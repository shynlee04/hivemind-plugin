/**
 * HiveOps Governance Plugin — Entry Point (SDK-ALIGNED v2)
 *
 * Fixed to match @opencode-ai/plugin SDK v1.2.15 hook signatures.
 *
 * Root causes fixed:
 * 1. Plugin path: moved to .opencode/plugin/ (singular, per SDK convention)
 * 2. Event types: removed fabricated events (session.started, session.completed, file.created)
 * 3. Event properties: fixed shapes to match SDK (info.id, file, todos)
 * 4. Context injection: switched from messages.transform to system.transform
 *
 * Hook → Script Wiring Map:
 *
 * ┌─────────────────────────────────────┬──────────────────────────────────────────┐
 * │ Hook Event                          │ Scripts Fired                            │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: session.created              │ gx-entry-guard.sh                       │
 * │                                     │ gx-first-turn-refresh.sh                │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: session.idle                 │ gx-handoff-purify.sh                    │
 * │                                     │ gx-sot-register.sh (stub)               │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: todo.updated                 │ gx-todo-sync.sh                         │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: file.edited                  │ gx-schema-sync.sh validate              │
 * │ event: file.watcher.updated         │ (on .hivemind/state/*.json only)        │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ tool.execute.before (task tool)     │ gx-enforce.sh check-delegation          │
 * │                                     │ gx-trace-check.sh check-delegation      │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ tool.execute.before (file writes)   │ gx-enforce.sh check-path                │
 * │                                     │ gx-enforce.sh record-violation (on fail)│
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ tool.execute.after (every 10 calls) │ gx-health-compute.sh (runs 12 signals)  │
 * │                                     │ gx-mid-guard.sh                         │
 * │                                     │ gx-auto-purge.sh check                  │
 * │                                     │ gx-auto-purge.sh snapshot (if dirty>90) │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ tool.execute.after (every 50 calls) │ gx-trace-check.sh check-all             │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ experimental.session.compacting     │ gx-handoff-purify.sh                    │
 * │                                     │ gx-schema-sync.sh check-all             │
 * │                                     │ gx-semantic-validate.sh (stub)          │
 * │                                     │ gx-context-retrieve.sh                  │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ experimental.chat.system.transform  │ Reads 7 JSON state files directly       │
 * │                                     │ (no scripts — fast in-memory reads)     │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ experimental.chat.messages.transform│ Dedup consecutive identical messages    │
 * │                                     │ (best-effort, never crashes)            │
 * └─────────────────────────────────────┴──────────────────────────────────────────┘
 *
 * Cross-platform: macOS + Linux + Windows (Git Bash / WSL)
 */

import type { Plugin } from "@opencode-ai/plugin"
import { writeFileSync, mkdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import { loadEnforcementState, saveEnforcementState, createEnforcementState } from "./utils"
import { buildToolExecuteBeforeHook, buildToolExecuteAfterHook } from "./hooks/delegation"
import { buildEventHook } from "./hooks/events"
import { buildCompactionHook } from "./hooks/compaction"
import { buildContextInjectionHook } from "./hooks/context-injection"
import { buildMessagesTransformHook } from "./hooks/messages-transform"

export const HiveMindGovernance: Plugin = async ({ project, client, $, directory, worktree }) => {
  // ── Smoke test: prove the plugin loaded ──
  try {
    const stateDir = join(worktree, ".hivemind", "state")
    if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true })
    const loadMarker = join(stateDir, "plugin-loaded.json")
    writeFileSync(loadMarker, JSON.stringify({
      loaded: true,
      timestamp: new Date().toISOString(),
      epoch: Date.now(),
      worktree,
      plugin: "hiveops-governance",
      version: "2.0.0-sdk-aligned",
    }, null, 2), "utf-8")
  } catch {
    // Never crash plugin init for smoke test
  }

  // ── Initialize enforcement state ──
  const loaded = loadEnforcementState(worktree)
  const enforcementState = {
    current: loaded || createEnforcementState("init", "unknown"),
    save: (s: any) => saveEnforcementState(worktree, s),
    worktree,
  }

  return {
    // ── Delegation + Scope Enforcement ──
    // SDK: tool.execute.before(input: { tool, sessionID, callID }, output: { args })
    // Wires: gx-enforce.sh, gx-trace-check.sh
    "tool.execute.before": async (input: any, output: any) => {
      const hook = buildToolExecuteBeforeHook(enforcementState)
      await hook(input, output)
    },

    // ── Health + Audit + Auto-Purge ──
    // SDK: tool.execute.after(input: { tool, sessionID, callID, args }, output: { title, output, metadata })
    // Wires: gx-health-compute.sh (12 signals), gx-mid-guard.sh, gx-auto-purge.sh, gx-trace-check.sh
    "tool.execute.after": async (input: any, output: any) => {
      const hook = buildToolExecuteAfterHook(enforcementState)
      await hook(input, output)
    },

    // ── Session Lifecycle + TODO + File Events ──
    // SDK: event(input: { event: Event }) => Promise<void>
    // Wires: gx-entry-guard.sh, gx-first-turn-refresh.sh, gx-handoff-purify.sh,
    //        gx-sot-register.sh, gx-todo-sync.sh, gx-schema-sync.sh
    event: async ({ event }: { event: any }) => {
      const hook = buildEventHook(enforcementState)
      await hook({ event })
    },

    // ── Compaction Recovery ──
    // SDK: experimental.session.compacting(input: { sessionID }, output: { context: string[], prompt?: string })
    // Wires: gx-handoff-purify.sh, gx-schema-sync.sh, gx-semantic-validate.sh,
    //        gx-context-retrieve.sh
    "experimental.session.compacting": async (input: any, output: any) => {
      const hook = buildCompactionHook(enforcementState)
      await hook(input, output)
    },

    // ── Context Injection (every LLM turn) ──
    // SDK: experimental.chat.system.transform(input: { sessionID?, model }, output: { system: string[] })
    // Reads: todo.json, runtime-profile.json, hierarchy.json, context-recovery.json, health-metrics.json,
    //        sot-index.json, mems.json
    // NOTE: Previously used messages.transform (WRONG — Message has no "system" role)
    "experimental.chat.system.transform": async (input: any, output: any) => {
      const hook = buildContextInjectionHook(enforcementState)
      await hook(input, output)
    },

    // ── Message Deduplication (every LLM turn) ──
    // SDK: experimental.chat.messages.transform(input: { sessionID?, model }, output: { messages: Message[] })
    // Deduplicates consecutive identical messages to reduce token waste.
    // Safety: never adds messages, only removes duplicates. Best-effort, never crashes.
    "experimental.chat.messages.transform": async (input: any, output: any) => {
      const hook = buildMessagesTransformHook(enforcementState)
      await hook(input, output)
    },
  }
}

export default HiveMindGovernance
