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
  createTurnInjectionKey,
  createTurnInjectionLedger,
  detectInjectionPresence,
  reserveInjectionBudget,
} from "../../../../src/lib/injection-orchestrator.js"
import { readUnifiedStateSnapshot } from "../../../../src/lib/state-snapshot.js"

interface TodoItem {
  id: string
  content: string
  status: string
  priority: string
  depends_on?: string
  hierarchy_node?: string
}

interface TodoState {
  items: TodoItem[]
  last_updated: number
}

interface RuntimeProfile {
  id: string
  intent: string
  policy_version: string
  role_envelope: {
    primary: { agent: string; level: number }
    secondary: { agent: string; level: number }
    monitor: { agent: string; level: number }
  }
  capabilities: {
    paths: string[]
    depth_limit: number
    delegate_to: string[]
  }
  constraints: string[]
}

interface HierarchyNode {
  id: string
  type: string
  content: string
  status?: string
  children?: HierarchyNode[]
}

interface ContextRecovery {
  trajectory_summary: string
  active_todos: string[]
  key_decisions: string[]
  recommended_next: string
}

interface HealthSignal {
  score: number
  velocity: number
}

interface HealthMetrics {
  composite: {
    score: number
    status: string
  }
  signals: Record<string, HealthSignal>
  thresholds: {
    hard_block: {
      signals: string[]
      below: number
    }
  }
}

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

/** Extract text content from any message shape (v1 legacy or v2 parts) */
function extractMessageText(msg: any): string {
  if (!msg) return ""
  // V2 format: { info, parts }
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || "")
      .join(" ")
  }
  // V1 format: { role, content }
  if (typeof msg.content === "string") return msg.content
  if (msg.info && typeof msg.info.content === "string") return msg.info.content
  // System prompt arrays
  if (Array.isArray(msg.content)) {
    return msg.content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || "")
      .join(" ")
  }
  return ""
}

/** Format active TODO items (max 10 for context budget) */
function formatActiveTodo(todoState: TodoState | null): string {
  if (!todoState || !todoState.items || todoState.items.length === 0) {
    return "No active TODO items."
  }

  const active = todoState.items
    .filter((item) => item.status === "in_progress" || item.status === "pending")
    .slice(0, 10)

  if (active.length === 0) return "All TODO items completed."

  const inProgress = active.filter((item) => item.status === "in_progress")
  const pending = active.filter((item) => item.status === "pending")

  const lines: string[] = []
  if (inProgress.length > 0) {
    lines.push(`**In Progress (${inProgress.length}):**`)
    for (const item of inProgress) {
      lines.push(`  - [WIP] ${item.content}`)
    }
  }
  if (pending.length > 0) {
    lines.push(`**Pending (${pending.length}):**`)
    for (const item of pending.slice(0, 5)) {
      lines.push(`  - [ ] ${item.content}`)
    }
    if (pending.length > 5) {
      lines.push(`  - ... and ${pending.length - 5} more`)
    }
  }

  // Check for HARD STOP
  const lastItem = todoState.items[todoState.items.length - 1]
  if (lastItem && lastItem.content.startsWith("HARD STOP")) {
    lines.push(`\n**HARD STOP:** ${lastItem.content}`)
  }

  return lines.join("\n")
}

/** Format hierarchy cursor (where we are in the trajectory tree) */
function formatHierarchyCursor(hierarchy: HierarchyNode | null): string {
  if (!hierarchy) return "No hierarchy loaded."

  const flatHierarchy = hierarchy as unknown as {
    trajectory?: string
    tactic?: string
    action?: string
  }
  if (
    typeof flatHierarchy.trajectory === "string" ||
    typeof flatHierarchy.tactic === "string" ||
    typeof flatHierarchy.action === "string"
  ) {
    const lines = [
      `→ trajectory: ${flatHierarchy.trajectory || "(unset)"}`,
      `  → tactic: ${flatHierarchy.tactic || "(unset)"}`,
      `    → action: ${flatHierarchy.action || "(unset)"}`,
    ]
    return lines.join("\n")
  }

  // Walk to deepest active node
  function findDeepestActive(node: HierarchyNode, path: string[]): string[] {
    const currentPath = [...path, `${node.type}: ${node.content}`]
    if (!node.children || node.children.length === 0) return currentPath

    const activeChild = node.children.find(
      (c) => c.status !== "complete" && c.status !== "cancelled"
    )
    if (activeChild) return findDeepestActive(activeChild, currentPath)
    return currentPath
  }

  const breadcrumb = findDeepestActive(hierarchy, [])
  return breadcrumb.map((b, i) => `${"  ".repeat(i)}→ ${b}`).join("\n")
}

function buildCapabilityAdvisory(params: {
  agent: string
  turnCount: number
  delegatedToExplorer: boolean
  profile: RuntimeProfile | null
}): string[] {
  const { agent, turnCount, delegatedToExplorer, profile } = params
  const advisory: string[] = []

  advisory.push("### HIVEFIVER CAPABILITY ADVISORY")
  advisory.push(`- Agent: ${agent}`)
  advisory.push(`- Turn: ${turnCount}`)
  advisory.push(
    `- Delegation evidence (hivexplorer): ${delegatedToExplorer ? "present" : "not observed this session"}`
  )

  if (profile) {
    advisory.push(`- Profile: ${profile.id} (${profile.intent})`)
    advisory.push(`- Allowed paths: ${profile.capabilities.paths.join(", ") || "(unspecified)"}`)
    advisory.push(`- Depth limit: ${profile.capabilities.depth_limit}`)
    advisory.push(`- Delegate options: ${profile.capabilities.delegate_to.join(", ") || "(none declared)"}`)
  } else {
    advisory.push("- Runtime profile unavailable: continue with evidence-first execution.")
  }

  advisory.push("- Guidance: use deterministic methods (script/bash/git) when needed, then verify high-risk assumptions with targeted delegation.")
  advisory.push("- Guidance: prefer advisory escalation over hard blocking unless explicit strict policy is configured.")

  return advisory
}

/**
 * Build the messages.transform hook.
 *
 * This function is called by the plugin's hook registration.
 * It returns a function that mutates output.messages in-place.
 */
export function buildContextInjectionHook(state: {
  current: EnforcementState
  worktree: string
}) {
  return async (input: any, output: any) => {
    // Defensive: ensure messages array exists
    if (!output.messages || !Array.isArray(output.messages)) return

    // Core runtime hooks are canonical injectors; plugin path is fallback-only.
    if (coreRuntimeHooksPresent(state.worktree)) return

    const presence = detectInjectionPresence({
      system: Array.isArray(output.system) ? output.system : [],
      messages: output.messages,
    })
    if (presence.core_system || presence.core_message || presence.plugin_message) return

    // Unified snapshot read (brain + extension state). Safe no-op if unavailable.
    const snapshot = await readUnifiedStateSnapshot(state.worktree)
    const todoState = snapshot.todoState as TodoState | null
    const profile = snapshot.runtimeProfile as RuntimeProfile | null
    const hierarchy = snapshot.hierarchyState as HierarchyNode | null
    const recovery = snapshot.contextRecovery as ContextRecovery | null
    const health = snapshot.healthMetrics as HealthMetrics | null
    const resolvedSessionId = snapshot.sessionId || state.current.sessionId || "unknown-session"
    const resolvedTurnCount = snapshot.turnCount || state.current.turnCount || 0

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

    // Build context block
    const contextLines: string[] = [
      "## GX-Pack Governance Context (Auto-Injected)",
      "",
    ]

    // Agent + Profile summary
    if (profile) {
      contextLines.push(
        `**Agent:** ${state.current.agent} | **Profile:** ${profile.id} | **Intent:** ${profile.intent}`,
        `**Turn:** ${resolvedTurnCount} | **${healthSummary}** | **Depth:** ${state.current.delegationChain.length}/${profile.capabilities.depth_limit}`,
      )
    } else {
      contextLines.push(
        `**Agent:** ${state.current.agent} | **Turn:** ${resolvedTurnCount} | **${healthSummary}**`,
        `*No runtime profile — run gx-entry-guard.sh to build one.*`,
      )
    }

    contextLines.push("")

    // Entry detection + first-turn classification context
    if (state.current.entryDetection) {
      const detection = state.current.entryDetection
      contextLines.push("### Entry Detection")
      contextLines.push(
        `- entry_condition=${detection.entry_condition} lineage=${detection.lineage} state_exists=${detection.state_exists}`,
      )
      contextLines.push(
        `- hierarchy_status=${detection.hierarchy_status} trajectory_status=${detection.trajectory_status}`,
      )
      if (detection.bootstrap_executed) {
        contextLines.push("- auto_init=executed")
      }
      contextLines.push("")
    }

    if (state.current.intentClassification) {
      const classification = state.current.intentClassification
      contextLines.push("### Intent Classification")
      contextLines.push(
        `- lineage=${classification.lineage} source=${classification.source} persisted_to_profile=${classification.persisted_to_profile}`,
      )
      contextLines.push(`- input_excerpt=${classification.input_excerpt}`)
      contextLines.push("")
    }

    // Active TODO
    contextLines.push("### Active TODO")
    contextLines.push(formatActiveTodo(todoState))
    contextLines.push("")

    // Hierarchy cursor
    contextLines.push("### Hierarchy Cursor")
    contextLines.push(formatHierarchyCursor(hierarchy))
    contextLines.push("")

    // Per-signal health breakdown
    if (health && Object.keys(health.signals).length > 0) {
      contextLines.push("### Health Signals")
      for (const [name, signal] of Object.entries(health.signals)) {
        contextLines.push(`- ${name}: score=${signal.score}, velocity=${signal.velocity}`)
      }
      contextLines.push("")
    }

    // Constraints
    if (profile && profile.constraints.length > 0) {
      contextLines.push("### Constraints")
      for (const c of profile.constraints) {
        contextLines.push(`- ${c}`)
      }
      contextLines.push("")
    }

    // Scope violations
    if (state.current.scopeViolations.length > 0) {
      contextLines.push(
        `### Scope Violations: ${state.current.scopeViolations.length} recorded`,
      )
    } else {
      contextLines.push("### Scope: Clean")
    }

    // Recovery context (if recovering from dirty context)
    if (recovery) {
      contextLines.push("")
      contextLines.push("### Context Recovery (auto-recovered)")
      contextLines.push(`**Trajectory:** ${recovery.trajectory_summary}`)
      if (recovery.active_todos.length > 0) {
        contextLines.push(`**Pending:** ${recovery.active_todos.join(", ")}`)
      }
      if (recovery.key_decisions.length > 0) {
        contextLines.push(`**Decisions:** ${recovery.key_decisions.join("; ")}`)
      }
      contextLines.push(`**Next:** ${recovery.recommended_next}`)
    }

    // Hard block warning
    if (hardBlockWarnings.length > 0) {
      contextLines.push("")
      contextLines.push(
        `### WARNING: hard_block triggered for ${hardBlockWarnings.join(", ")} (below ${health?.thresholds.hard_block.below ?? "n/a"}).`,
      )
    }

    // === HIVEFIVER CAPABILITY-AWARE ADVISORY ===
    if (state.current.agent === "hivefiver") {
      const delegatedToExplorer = state.current.delegationChain.some(
        (entry) => entry.to === "hivexplorer"
      )
      const advisory = buildCapabilityAdvisory({
        agent: state.current.agent,
        turnCount: resolvedTurnCount,
        delegatedToExplorer,
        profile,
      })
      contextLines.push("")
      contextLines.push(...advisory)
    }

    let contextBlock = contextLines.join("\n")
    const turnKey = createTurnInjectionKey(resolvedSessionId, resolvedTurnCount)
    createTurnInjectionLedger({
      sessionId: resolvedSessionId,
      turnCount: resolvedTurnCount,
      contextWindowChars: 16000,
    })
    const grantedBudget = reserveInjectionBudget({
      turnKey,
      channel: "plugin-message",
      requestedChars: contextBlock.length,
    })
    if (grantedBudget <= 0) {
      return
    }
    if (contextBlock.length > grantedBudget) {
      contextBlock = `${contextBlock.slice(0, Math.max(0, grantedBudget - 32))}\n...[truncated by shared budget]`
    }

    // Prepend as system message to the messages array
    // OpenCode messages format: { info: Message, parts: Part[] }
    const governanceMessage = {
      info: {
        role: "system" as const,
        content: contextBlock,
      },
      parts: [
        {
          type: "text" as const,
          text: contextBlock,
        },
      ],
    }

    output.messages.unshift(governanceMessage)
  }
}
