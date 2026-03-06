/**
 * GX-Pack Context Injection Hook — messages.transform
 *
 * THE most critical hook in the GX-Pack module.
 * This is the ONLY programmatic way to inject governance context into every LLM turn.
 *
 * Mechanism: mutates output.messages in-place by prepending a system message
 * containing governance state, active TODO, hierarchy cursor, and constraints.
 *
 * SDK Reference: experimental.chat.messages.transform
 * Signature: (input: {}, output: { messages: { info: Message, parts: Part[] }[] }) => Promise<void>
 * Triggered at: packages/opencode/src/session/prompt.ts line 610
 *
 * @see docs/plans/SPEC-GX-PACK-CONTEXT-ENGINE-2026-03-02.md — Mechanism: Context Engineering Engine
 */

import type { EnforcementState } from "../types"
import { existsSync } from "node:fs"
import { join } from "node:path"
import {
  createTurnInjectionLedger,
  detectInjectionPresence,
  resolvePluginFallbackTurn,
  reserveInjectionBudget,
} from "../../../../src/lib/injection-orchestrator.js"
import {
  buildPluginFallbackContextBlock,
  type ContextRecovery,
  type HealthMetrics,
  type HierarchyNode,
  type RuntimeProfile,
  type TodoState,
} from "../../../../src/lib/plugin-fallback-context.js"
import {
  getSessionIdFromMessages,
  resolveRuntimeSessionLineage,
} from "../../../../src/lib/runtime-session-lineage.js"
import { readUnifiedStateSnapshot } from "../../../../src/lib/state-snapshot.js"

let coreRuntimePresenceCache: { worktree: string; present: boolean } | null = null

function coreRuntimeHooksPresent(worktree: string): boolean {
  if (process.env.GX_FORCE_PLUGIN_CONTEXT_INJECTION === "1") {
    return false
  }
  if (coreRuntimePresenceCache && coreRuntimePresenceCache.worktree === worktree) {
    return coreRuntimePresenceCache.present
  }
  const present = existsSync(join(worktree, "src/hooks/session-lifecycle.ts"))
    && existsSync(join(worktree, "src/hooks/messages-transform.ts"))
  coreRuntimePresenceCache = { worktree, present }
  return present
}


/**
 * Build the messages.transform hook.
 *
 * This function is called by the plugin's hook registration.
 * It returns a function that mutates output.messages in-place.
 *
 * @param state - Plugin enforcement state and worktree context.
 * @param deps - Optional test seams for direct harness coverage.
 * @returns A fallback-only messages.transform hook with child-session minimization.
 */
export function buildContextInjectionHook(state: {
  current: EnforcementState
  worktree: string
}, deps: {
  resolveSessionLineage?: typeof resolveRuntimeSessionLineage
} = {}) {
  return async (input: any, output: any) => {
    // Defensive: ensure messages array exists
    if (!output.messages || !Array.isArray(output.messages)) return

    // Core runtime hooks are canonical injectors; plugin path is fallback-only.
    if (coreRuntimeHooksPresent(state.worktree)) return

    const presence = detectInjectionPresence({
      system: Array.isArray(output.system) ? output.system : [],
      messages: output.messages,
    })

    // Unified snapshot read (brain + extension state). Safe no-op if unavailable.
    const snapshot = await readUnifiedStateSnapshot(state.worktree)
    const todoState = snapshot.todoState as TodoState | null
    const profile = snapshot.runtimeProfile as RuntimeProfile | null
    const hierarchy = snapshot.hierarchyState as HierarchyNode | null
    const recovery = snapshot.contextRecovery as ContextRecovery | null
    const health = snapshot.healthMetrics as HealthMetrics | null
    const runtimeSessionId = getSessionIdFromMessages(output.messages)
      || snapshot.brain?.session.opencode_session_id
      || snapshot.sessionId
      || state.current.sessionId
      || "unknown-session"
    const runtimeSessionLineage = await (deps.resolveSessionLineage ?? resolveRuntimeSessionLineage)(runtimeSessionId)
    const fallbackTurn = resolvePluginFallbackTurn({
      presence,
      snapshotSessionId: snapshot.sessionId,
      currentSessionId: state.current.sessionId,
      snapshotTurnCount: snapshot.turnCount,
      currentTurnCount: state.current.turnCount,
    })
    if (!fallbackTurn.shouldInject) return

    const resolvedSessionId = fallbackTurn.resolvedSessionId
    const resolvedTurnCount = fallbackTurn.resolvedTurnCount

    if (!snapshot.brain && !profile && !todoState && !hierarchy && !recovery && !health) {
      return
    }
    const healthScore = health?.composite.score ?? 100
    const healthStatus = health?.composite.status ?? "unknown"

    const degradedSignals = health
      ? Object.entries(health.signals)
        .filter(([, signal]) => signal.score < 40)
        .map(([name, signal]) => `${name}:${signal.score}`)
      : []

    const hardBlockWarnings = health
      ? health.thresholds.hard_block.signals.filter((name) => {
        const signal = health.signals[name]
        return signal && signal.score < health.thresholds.hard_block.below
      })
      : []

    let healthSummary = `Health: ${healthScore}/100 (${healthStatus})`
    if (degradedSignals.length > 0) {
      healthSummary += ` | DEGRADED: ${degradedSignals.join(", ")}`
    }
    if (hardBlockWarnings.length > 0) {
      healthSummary += ` | HARD_BLOCK: ${hardBlockWarnings.join(", ")}`
    }

    const contextBlock = buildPluginFallbackContextBlock({
      agent: state.current.agent,
      turnCount: resolvedTurnCount,
      delegationDepth: state.current.delegationChain.length,
      isChildSession: runtimeSessionLineage.isChildSession,
      healthSummary,
      delegatedToExplorer: state.current.delegationChain.some((entry) => entry.to === "hivexplorer"),
      profile,
      todoState,
      hierarchyState: hierarchy,
      contextRecovery: recovery,
      healthMetrics: health,
      scopeViolationCount: state.current.scopeViolations.length,
      entryDetection: state.current.entryDetection ?? null,
      intentClassification: state.current.intentClassification ?? null,
    })
    if (!contextBlock) {
      return
    }

    createTurnInjectionLedger({
      sessionId: resolvedSessionId,
      turnCount: resolvedTurnCount,
      contextWindowChars: 16000,
    })
    const grantedBudget = reserveInjectionBudget({
      turnKey: fallbackTurn.turnKey,
      channel: "plugin-message",
      requestedChars: contextBlock.length,
    })
    if (grantedBudget <= 0) {
      return
    }
    const finalContextBlock = contextBlock.length > grantedBudget
      ? `${contextBlock.slice(0, Math.max(0, grantedBudget - 32))}\n...[truncated by shared budget]`
      : contextBlock

    // Prepend as system message to the messages array
    // OpenCode messages format: { info: Message, parts: Part[] }
    const governanceMessage = {
      info: {
        role: "system" as const,
        content: finalContextBlock,
      },
      parts: [
        {
          type: "text" as const,
          text: finalContextBlock,
        },
      ],
    }

    output.messages.unshift(governanceMessage)
  }
}
