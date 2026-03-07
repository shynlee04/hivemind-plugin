/**
 * @deprecated DISABLED 2026-03-08 — This plugin is disabled in opencode.json.
 * Reason: References nonexistent GX-Pack scripts, deep cross-layer imports,
 * and duplicates governance already handled by canonical src/hooks/*.
 * Canonical replacement: src/hooks/ (session-lifecycle, soft-governance,
 * tool-gate, compaction, event-handler, messages-transform).
 * See AGENTS.md §Dual-Injection Systems for context.
 *
 * --- Original description ---
 * HiveOps Governance Plugin — Entry Point (FULLY WIRED)
 *
 * All 29 GX-Pack scripts are deterministically wired to plugin hooks.
 * Every script fires automatically — no manual invocation needed.
 *
 * Hook → Script Wiring Map:
 *
 * ┌─────────────────────────────────────┬──────────────────────────────────────────┐
 * │ Hook Event                          │ Scripts Fired                            │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: session.created/started      │ gx-entry-guard.sh                       │
 * │                                     │ gx-first-turn-refresh.sh                │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: session.completed/idle       │ gx-handoff-purify.sh                    │
 * │                                     │ gx-sot-register.sh (stub)               │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: todo.updated                 │ gx-todo-sync.sh                         │
 * ├─────────────────────────────────────┼──────────────────────────────────────────┤
 * │ event: file.edited/created          │ gx-schema-sync.sh validate              │
 * │   (on .hivemind/state/*.json only)  │                                         │
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
 * │ experimental.chat.messages.transform│ Reads unified state snapshot adapter     │
 * │                                     │ (StateManager + validated readers)       │
 * └─────────────────────────────────────┴──────────────────────────────────────────┘
 *
 * Scripts NOT auto-wired (agent-invoked via skill instructions):
 * - gx-decision-log.sh       → agents call to log decisions
 * - gx-workflow-state.sh     → agents call to transition workflow stages
 * - gx-scope-resolve.sh      → agents call to check scope before operations
 * - gx-swarm-launch.sh       → agents call to spawn parallel agents (stub)
 *
 * Cross-platform: macOS + Linux + Windows (Git Bash / WSL)
 */

import type { Plugin } from "@opencode-ai/plugin"
import { loadEnforcementState, saveEnforcementState, createEnforcementState } from "./utils"
import { buildToolExecuteBeforeHook, buildToolExecuteAfterHook } from "./hooks/delegation"
import { buildEventHook } from "./hooks/events"
import { buildCompactionHook } from "./hooks/compaction"
import { buildContextInjectionHook } from "./hooks/context-injection"
import { buildEntryGuardHook } from "./hooks/entry-guard"
import { buildIntentClassifierHook } from "./hooks/intent-classifier"

export const HiveMindGovernance: Plugin = async ({ project, client, $, directory, worktree }) => {
  // ── Initialize enforcement state ──
  const loaded = loadEnforcementState(worktree)
  const enforcementState = {
    current: loaded || createEnforcementState("init", "unknown"),
    save: (s: any) => saveEnforcementState(worktree, s),
    worktree,
  }

  // Detect current agent from project context
  let agentDetected = false

  return {
    // ── Delegation + Scope Enforcement ──
    // Wires: gx-enforce.sh, gx-trace-check.sh
    "tool.execute.before": async (input: any, output: any) => {
      if (!agentDetected && input.agent) {
        enforcementState.current = {
          ...enforcementState.current,
          agent: input.agent,
        }
        agentDetected = true
      }

      const hook = buildToolExecuteBeforeHook(enforcementState)
      await hook(input, output)
    },

    // ── Health + Audit + Auto-Purge ──
    // Wires: gx-health-compute.sh (12 signals), gx-mid-guard.sh, gx-auto-purge.sh, gx-trace-check.sh
    "tool.execute.after": async (input: any, output: any) => {
      const hook = buildToolExecuteAfterHook(enforcementState)
      await hook(input, output)
    },

    // ── Session Lifecycle + TODO + File Events ──
    // Wires: gx-entry-guard.sh, gx-first-turn-refresh.sh, gx-handoff-purify.sh,
    //        gx-sot-register.sh, gx-todo-sync.sh, gx-schema-sync.sh
    event: async ({ event }: { event: any }) => {
      const entryGuardHook = buildEntryGuardHook(enforcementState)
      const hook = buildEventHook(enforcementState)
      await entryGuardHook({ event })
      await hook({ event })
    },

    // ── Compaction Recovery ──
    // Wires: gx-handoff-purify.sh, gx-schema-sync.sh, gx-semantic-validate.sh,
    //        gx-context-retrieve.sh
    "experimental.session.compacting": async (input: any, output: any) => {
      const hook = buildCompactionHook(enforcementState)
      await hook(input, output)
    },

    // ── Context Injection (every LLM turn) ──
    // Reads unified snapshot via src/lib/state-snapshot.ts
    "experimental.chat.messages.transform": async (input: any, output: any) => {
      const intentClassifierHook = buildIntentClassifierHook(enforcementState)
      const hook = buildContextInjectionHook(enforcementState)
      await intentClassifierHook(input, output)
      await hook(input, output)
    },
  }
}

export default HiveMindGovernance
