/**
 * Session Intent Classifier - classifies session purpose into 6 categories.
 *
 * Pure function library - no file I/O, no side effects.
 * Used by event-handler.ts on session.created to auto-classify sessions.
 *
 * Categories map to SYSTEM-DIRECTIVES Section 4B memory classification:
 *   discovery, research, planning, implementing, debug, testing
 */

import type { LineageScope } from "../schemas/brain-state.js"

export type SessionIntentCategory =
  | "discovery"
  | "research"
  | "planning"
  | "implementing"
  | "debug"
  | "testing"

export interface SessionIntentClassification {
  intent: SessionIntentCategory
  confidence: number
  reasons: string[]
  recommended_mode: "plan_driven" | "quick_fix" | "exploration"
  recommended_output_style: number
}

export interface SessionIntentInput {
  trajectoryIntent?: string
  hierarchyLevel?: string
  mode?: string
  focusContent?: string
  recentAnchors?: string[]
}

const INTENT_CATEGORIES: SessionIntentCategory[] = [
  "discovery",
  "research",
  "planning",
  "implementing",
  "debug",
  "testing",
]

const INTENT_KEYWORDS: Record<SessionIntentCategory, string[]> = {
  discovery: ["brainstorm", "ideate", "explore", "options", "compare", "discover", "creative", "possibilities", "alternatives"],
  research: ["research", "analyze", "evaluate", "benchmark", "survey", "investigate", "study", "literature", "comparison"],
  planning: ["plan", "roadmap", "milestone", "phase", "architecture", "design", "requirement", "spec", "breakdown", "structure"],
  implementing: ["implement", "build", "wire", "create", "refactor", "add", "code", "patch", "feature", "integrate", "connect"],
  debug: ["debug", "fix", "error", "failure", "broken", "root cause", "bug", "crash", "regression", "failing", "issue"],
  testing: ["test", "verify", "validate", "gate", "assert", "regression", "coverage", "lint", "tsc", "check", "audit"],
}

const INTENT_RECOMMENDATIONS: Record<
  SessionIntentCategory,
  { mode: "plan_driven" | "quick_fix" | "exploration"; outputStyle: number }
> = {
  discovery: { mode: "exploration", outputStyle: 1 },
  research: { mode: "exploration", outputStyle: 1 },
  planning: { mode: "plan_driven", outputStyle: 2 },
  implementing: { mode: "plan_driven", outputStyle: 4 },
  debug: { mode: "quick_fix", outputStyle: 3 },
  testing: { mode: "plan_driven", outputStyle: 3 },
}

function buildSignalText(input: SessionIntentInput): string {
  const parts: string[] = []
  if (input.trajectoryIntent) {
    parts.push(input.trajectoryIntent)
  }
  if (input.focusContent) {
    parts.push(input.focusContent)
  }
  if (input.recentAnchors && input.recentAnchors.length > 0) {
    parts.push(input.recentAnchors.join(" "))
  }
  return parts.join(" ").toLowerCase()
}

function scoreCategory(text: string, category: SessionIntentCategory): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  for (const keyword of INTENT_KEYWORDS[category]) {
    if (text.includes(keyword)) {
      score += 1
      reasons.push(`keyword:${keyword}`)
    }
  }
  return { score, reasons }
}

// ─── P1-B: Lineage Classification ──────────────────────────────────────────────
// Ports the concept from the disabled .opencode/ classify-intent.sh script.
// Classifies the lineage scope of a session based on agent identity and
// session text signals; returns "project" (hiveminder) or "meta-framework" (hivefiver).

/** Agent names that belong to the meta-framework (hivefiver) lineage */
const META_FRAMEWORK_AGENTS = [
  "hivefiver",
  "hivehealer",
  "hitea",
] as const

/** Agent names that belong to the project (hiveminder) lineage */
const PROJECT_AGENTS = [
  "hiveminder",
  "hivemaker",
  "hiveplanner",
  "hiveq",
  "hiverd",
  "hivexplorer",
] as const

/** Keywords that signal meta-framework scope when agent is unknown */
const META_FRAMEWORK_KEYWORDS = [
  "meta-builder", "framework", "skill", "governance", "registry",
  "parity", "platform", "adapter", "mirror", "agent-spec",
  "hivefiver", "hivehealer", "hitea",
] as const

/** Keywords that signal project scope when agent is unknown */
const PROJECT_KEYWORDS = [
  "project", "feature", "product", "user", "customer",
  "implement", "build", "deploy", "ship", "release",
  "hiveminder", "hivemaker", "hiveplanner",
] as const

/**
 * Classify session lineage scope from agent name and/or session text.
 *
 * Resolution order:
 *   1. Known agent name → deterministic mapping
 *   2. Session text keyword scoring → probabilistic but bounded
 *   3. Fallback → "unknown"
 *
 * @param agentName The declared agent name (may be "unresolved" or empty).
 * @param sessionText Optional session text (trajectory, focus, etc.) for keyword fallback.
 * @returns Resolved lineage scope.
 */
export function classifyLineageScope(
  agentName: string,
  sessionText?: string,
): LineageScope {
  const normalizedAgent = agentName.trim().toLowerCase()

  // 1. Deterministic agent-name resolution
  if ((META_FRAMEWORK_AGENTS as readonly string[]).includes(normalizedAgent)) {
    return "meta-framework"
  }
  if ((PROJECT_AGENTS as readonly string[]).includes(normalizedAgent)) {
    return "project"
  }

  // 2. Keyword-based fallback from session text
  if (sessionText) {
    const lowerText = sessionText.toLowerCase()
    let metaScore = 0
    let projectScore = 0

    for (const kw of META_FRAMEWORK_KEYWORDS) {
      if (lowerText.includes(kw)) metaScore++
    }
    for (const kw of PROJECT_KEYWORDS) {
      if (lowerText.includes(kw)) projectScore++
    }

    // Require a 2+ margin to avoid ambiguous classification
    if (metaScore > projectScore && metaScore >= 2) return "meta-framework"
    if (projectScore > metaScore && projectScore >= 2) return "project"
  }

  return "unknown"
}

export function classifySessionIntent(input: SessionIntentInput): SessionIntentClassification {
  const signalText = buildSignalText(input)
  const scores: Record<SessionIntentCategory, { score: number; reasons: string[] }> = {
    discovery: scoreCategory(signalText, "discovery"),
    research: scoreCategory(signalText, "research"),
    planning: scoreCategory(signalText, "planning"),
    implementing: scoreCategory(signalText, "implementing"),
    debug: scoreCategory(signalText, "debug"),
    testing: scoreCategory(signalText, "testing"),
  }

  const totalKeywordMatches = INTENT_CATEGORIES.reduce((sum, category) => sum + scores[category].score, 0)
  if (totalKeywordMatches === 0) {
    return {
      intent: "planning",
      confidence: 0.2,
      reasons: ["fallback:no-keyword-match"],
      recommended_mode: "plan_driven",
      recommended_output_style: 2,
    }
  }

  if (input.mode === "quick_fix") {
    scores.debug.score += 2
    scores.debug.reasons.push("mode:quick_fix:+2")
  } else if (input.mode === "exploration") {
    scores.discovery.score += 1
    scores.discovery.reasons.push("mode:exploration:+1")
    scores.research.score += 1
    scores.research.reasons.push("mode:exploration:+1")
  }

  let winner: SessionIntentCategory = "planning"
  let winnerScore = -1
  let winnerReasons: string[] = []
  for (const category of INTENT_CATEGORIES) {
    const candidate = scores[category]
    if (candidate.score > winnerScore) {
      winner = category
      winnerScore = candidate.score
      winnerReasons = candidate.reasons
    }
  }

  const confidence = Math.min(1, Math.max(0.2, winnerScore / 5))
  const recommendation = INTENT_RECOMMENDATIONS[winner]
  return {
    intent: winner,
    confidence,
    reasons: winnerReasons,
    recommended_mode: recommendation.mode,
    recommended_output_style: recommendation.outputStyle,
  }
}
