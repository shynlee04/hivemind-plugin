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

import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import type { EnforcementState } from "../types"

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

/** Load a JSON file safely */
function loadJson<T>(worktree: string, relativePath: string): T | null {
  const fullPath = join(worktree, relativePath)
  if (!existsSync(fullPath)) return null
  try {
    return JSON.parse(readFileSync(fullPath, "utf-8")) as T
  } catch {
    return null
  }
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

/** Load health metrics from state file */
function loadHealthMetrics(worktree: string): HealthMetrics | null {
  try {
    const metricsPath = join(worktree, ".hivemind", "state", "health-metrics.json")
    const content = readFileSync(metricsPath, "utf-8")
    return JSON.parse(content) as HealthMetrics
  } catch {
    return null
  }
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

    // ── Deduplication: skip if System 2 (src/hooks) already injected ──
    // System 2 injects via:
    //   - session-lifecycle.ts: <hivemind> block into output.system (not messages)
    //   - messages-transform.ts: [SYSTEM ANCHOR ...] into output.messages
    //   - governance-instruction.ts: GOVERNANCE_MARKER into output.system
    // If any of these are present, the plugin's injection would create
    // duplicate/conflicting governance signals. (See: Team A audit — dual-injection race)
    const GX_PACK_MARKER = "## GX-Pack Governance Context"

    // Check output.system for System 2 system-layer injection
    const systemStrings: string[] = Array.isArray(output.system) ? output.system : []
    const hasSystemLayerInjection = systemStrings.some(
      (s: string) => s.includes("<hivemind>") || s.includes("HIVE-MASTER governance active")
    )

    // Check output.messages for message-layer markers ([SYSTEM ANCHOR] or own GX-Pack marker)
    const MESSAGE_MARKERS = ["[SYSTEM ANCHOR"]
    const hasMessageLayerInjection = output.messages.some((msg: any) => {
      const text = extractMessageText(msg)
      return MESSAGE_MARKERS.some(marker => text.includes(marker))
    })

    const hasGxPackInjection = output.messages.some((msg: any) => {
      const text = extractMessageText(msg)
      return text.includes(GX_PACK_MARKER)
    })

    // If System 2 already injected (via either layer), or if we already injected, skip
    if (hasSystemLayerInjection || hasMessageLayerInjection || hasGxPackInjection) return

    // Load schematic state files
    const todoState = loadJson<TodoState>(state.worktree, ".hivemind/state/todo.json")
    const profile = loadJson<RuntimeProfile>(state.worktree, ".hivemind/state/runtime-profile.json")
    const hierarchy = loadJson<HierarchyNode>(state.worktree, ".hivemind/state/hierarchy.json")
    const recovery = loadJson<ContextRecovery>(state.worktree, ".hivemind/state/context-recovery.json")

    const health = loadHealthMetrics(state.worktree)
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
        `**Turn:** ${state.current.turnCount} | **${healthSummary}** | **Depth:** ${state.current.delegationChain.length}/${profile.capabilities.depth_limit}`,
      )
    } else {
      contextLines.push(
        `**Agent:** ${state.current.agent} | **Turn:** ${state.current.turnCount} | **${healthSummary}**`,
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
        `- lineage=${classification.lineage} source=${classification.source} persisted_to_brain=${classification.persisted_to_brain}`,
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

    // === HIVEFIVER-SPECIFIC BLINDNESS ENFORCEMENT ===
    // hivefiver has read:deny, glob:deny, grep:deny — intentionally blind.
    // This block injects mandatory delegation awareness EVERY turn.
    if (state.current.agent === "hivefiver") {
      const delegatedToExplorer = state.current.delegationChain.some(
        (entry) => entry.to === "hivexplorer"
      )
      const turnCount = state.current.turnCount

      // Determine entry type
      let entryType: "first_entry" | "mid_session" | "post_compact" = "mid_session"
      if (turnCount <= 1) entryType = "first_entry"
      if (recovery) entryType = "post_compact"

      // Severity escalation based on turns without hivexplorer delegation
      let severity = "SEV-1 MONITOR"
      if (turnCount >= 12 && !delegatedToExplorer) severity = "SEV-3 CRITICAL"
      else if (turnCount >= 8 && !delegatedToExplorer) severity = "SEV-2 ELEVATED"
      else if (turnCount >= 4 && !delegatedToExplorer) severity = "SEV-1 WARNING"

      contextLines.push("")
      contextLines.push("### HIVEFIVER BLINDNESS ENFORCEMENT [ALWAYS-ON]")
      contextLines.push(`**Entry:** ${entryType} | **Severity:** ${severity}`)
      contextLines.push(
        `**Delegated to hivexplorer:** ${delegatedToExplorer ? "YES" : "NO — REQUIRED BEFORE ANY ACTION"}`
      )
      contextLines.push("")
      contextLines.push("YOU ARE BLIND. You have read:deny, glob:deny, grep:deny, bash:deny.")
      contextLines.push("GOLDEN RULE: Before creating, modifying, or claiming anything about existing files,")
      contextLines.push("you MUST delegate to hivexplorer for verification. No exceptions.")

      if (!delegatedToExplorer && turnCount >= 4) {
        contextLines.push("")
        contextLines.push(`**${severity}: ${turnCount} turns without hivexplorer verification.**`)
        contextLines.push("HIGH RISK of hallucination. Delegate to hivexplorer NOW or STOP.")
      }
    }

    const contextBlock = contextLines.join("\n")

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
