/**
 * Context Quality Escalation — Integration Helpers
 * 
 * Add to src/lib/session-governance.ts
 * Called by session-lifecycle.ts hook
 */

import type { HierarchyState } from "../schemas/hierarchy.js"

export type ContextLevel = 1 | 2 | 3 | 4

export interface EscalationBlock {
  level: ContextLevel
  emoji: string
  label: string
  lines: string[]
  shouldHalt: boolean
  haltReason?: string
}

/**
 * Calculate context quality level based on turn count
 */
export function calculateContextLevel(turnCount: number): ContextLevel {
  if (turnCount >= 5) return 4
  if (turnCount === 4) return 3
  if (turnCount >= 2) return 2
  return 1
}

/**
 * Generate escalation block for session-lifecycle injection
 */
export function generateEscalationBlock(
  turnCount: number,
  role: "MAIN" | "SUB",
  hierarchy: HierarchyState
): EscalationBlock {
  const level = calculateContextLevel(turnCount)
  
  switch (level) {
    case 1:
      return generateLevel1Block(role, hierarchy)
    case 2:
      return generateLevel2Block(turnCount, hierarchy)
    case 3:
      return generateLevel3Block(role, hierarchy)
    case 4:
      return generateLevel4Block(hierarchy)
  }
}

function generateLevel1Block(role: "MAIN" | "SUB", hierarchy: HierarchyState): EscalationBlock {
  return {
    level: 1,
    emoji: "⚠️",
    label: "MILD",
    lines: [
      "⚠️ CONTEXT CHECK [1/4]",
      `Role: ${role} | Mode: [Coordinator/Executor/Researcher]`,
      "→ Verify session intent declared",
      "→ Classify: Project-related? Execution-oriented?",
      `→ Snapshot: ${hierarchy.trajectory || "Not set"} | ${hierarchy.tactic || "Not set"} | ${hierarchy.action || "Not set"}`,
    ],
    shouldHalt: false,
  }
}

function generateLevel2Block(turnCount: number, hierarchy: HierarchyState): EscalationBlock {
  const complexity = hierarchy.action ? "Complex" : "Building"
  
  return {
    level: 2,
    emoji: "⚠️⚠️",
    label: "URGENT",
    lines: [
      "⚠️⚠️ CONTEXT DECAY [2/4]",
      `Turns: ${turnCount} | Hierarchy: ${complexity}`,
      "",
      "→ Context relationships becoming unclear",
      "→ Knowledge symlinks accumulating",
      "→ Consider: Summarize current state",
      "→ Demand: Identify rot points NOW",
    ],
    shouldHalt: false,
  }
}

function generateLevel3Block(role: "MAIN" | "SUB", _hierarchy: HierarchyState): EscalationBlock {
  const haltForMain = role === "MAIN"
  
  return {
    level: 3,
    emoji: "⚠️⚠️⚠️",
    label: "CRITICAL",
    lines: [
      "⚠️⚠️⚠️ CONTEXT ROT [3/4]",
      "Turns: 4 | Action: HALT FOR RECONSTRUCTION",
      "",
      "→ Spawn subagents for context collection ONLY",
      "→ DO NOT proceed with execution",
      "→ Present findings for explicit confirmation",
      "→ Output: Handoff prompt OR continuation decision",
    ],
    shouldHalt: haltForMain,
    haltReason: haltForMain ? "Context level 3: MAIN agent must seek explicit confirmation" : undefined,
  }
}

function generateLevel4Block(_hierarchy: HierarchyState): EscalationBlock {
  return {
    level: 4,
    emoji: "🛑",
    label: "EMERGENCY",
    lines: [
      "🛑 MANDATORY STOP [4/4]",
      "Context integrity compromised. Session must end or restart.",
      "",
      "**HALT REQUIRED**: Generate handoff prompt",
      `Last known focus: ${_hierarchy.action || _hierarchy.tactic || _hierarchy.trajectory || "Unknown"}`,
    ],
    shouldHalt: true,
    haltReason: "Context level 4: Mandatory stop for session handoff",
  }
}

/**
 * Format escalation block for <hivemind> injection
 */
export function formatEscalationForInjection(block: EscalationBlock): string {
  const lines = [
    `${block.emoji} CONTEXT QUALITY: ${block.label} [${block.level}/4]`,
    ...block.lines,
  ]
  
  if (block.shouldHalt && block.haltReason) {
    lines.push("")
    lines.push(`**HALT**: ${block.haltReason}`)
  }
  
  return lines.join("\n")
}

/**
 * Generate handoff prompt for Level 4
 */
export function generateHandoffPrompt(
  sessionId: string,
  hierarchy: HierarchyState,
  gaps: string[]
): string {
  const lines = [
    "**HANDOFF PROMPT** (copy to new session):",
    "```",
    `Last Focus: ${hierarchy.action || hierarchy.tactic || "Unknown"}`,
    `Session ID: ${sessionId}`,
    `Why Stopped: Context level 4 - mandatory stop`,
    "",
    "Gaps to Address:",
    ...gaps.map(g => `- ${g}`),
    "",
    "DO NOT:",
    "- Trust previous session's assumptions",
    "- Proceed without re-validating context",
    "- Execute until gaps are resolved",
    "```",
  ]
  
  return lines.join("\n")
}
