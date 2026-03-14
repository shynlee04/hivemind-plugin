import { classifySessionIntent } from "./session-intent-classifier.js"

export type HiveFiverIntent =
  | "build_new"
  | "fix_broken"
  | "audit_health"
  | "extend"
  | "improve"
  | "learn"
  | "unknown"

export type HiveFiverConfidence = "high" | "medium" | "low" | "none"
export type HiveFiverLanguage = "en" | "vi" | "bilingual"
export type HiveFiverMaturity = "L0" | "L1" | "L2" | "L3"
export type HiveFiverInputBand = "short" | "medium" | "long" | "wall_of_text"
export type HiveFiverGuidance = "high" | "medium" | "low"

export interface HiveFiverIntentResult {
  intent: HiveFiverIntent
  confidence: HiveFiverConfidence
  reasons: string[]
  next_command: string
  pipeline_id:
    | "full_build"
    | "doctor_fix"
    | "audit_only"
    | "audit_then_build"
    | "guided_onboard"
    | "adaptive"
}

export interface HiveFiverDiscoveryProfile {
  language: HiveFiverLanguage
  maturity: HiveFiverMaturity
  input_band: HiveFiverInputBand
  guidance: HiveFiverGuidance
  signal_count: number
}

export interface HiveFiverRouteStageResult {
  action: string
  route_type: "explicit" | "intent" | "status"
  next_command: string
  intent?: HiveFiverIntent
  confidence?: HiveFiverConfidence
  pipeline_id?: HiveFiverIntentResult["pipeline_id"]
}

const EXPLICIT_ACTIONS = new Map<string, string>([
  ["start", "/hivefiver-start"],
  ["discovery", "/hivefiver-discovery"],
  ["intake", "/hivefiver-intake"],
  ["spec", "/hivefiver-spec"],
  ["architect", "/hivefiver-architect"],
  ["build", "/hivefiver-build"],
  ["audit", "/hivefiver-audit"],
  ["doctor", "/hivefiver-doctor"],
  ["continue", "/hivefiver-continue"],
  ["recover", "/hivefiver-doctor"],
])

const INTENT_KEYWORDS: Array<{
  intent: HiveFiverIntent
  keywords: string[]
}> = [
  {
    intent: "fix_broken",
    keywords: ["fix", "broken", "repair", "doctor", "regression", "error", "failing", "debug", "recover"],
  },
  {
    intent: "audit_health",
    keywords: ["audit", "review", "health", "inspect", "verify", "compliance", "status"],
  },
  {
    intent: "extend",
    keywords: ["extend", "expand", "add onto", "augment", "integrate into existing"],
  },
  {
    intent: "improve",
    keywords: ["improve", "optimize", "clean up", "harden", "stabilize", "polish"],
  },
  {
    intent: "learn",
    keywords: ["learn", "what is", "explain", "teach", "understand", "how do i"],
  },
  {
    intent: "build_new",
    keywords: ["build", "create", "scaffold", "make", "design", "new", "bootstrap"],
  },
]

const MATURITY_TECH_TERMS = [
  "ast",
  "schema",
  "hook",
  "zod",
  "plugin",
  "opencode",
  "refactor",
  "deterministic",
  "ingress",
  "lineage",
  "manifest",
]

const VIETNAMESE_SIGNALS = [
  "toi",
  "muon",
  "lam",
  "giup",
  "duoc",
  "khong",
  "sao",
  "nhu the nao",
  "xin",
  "vui long",
]

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function toConfidence(score: number): HiveFiverConfidence {
  if (score >= 3) return "high"
  if (score === 2) return "medium"
  if (score === 1) return "low"
  return "none"
}

function mapIntentToRoute(intent: HiveFiverIntent): Pick<HiveFiverIntentResult, "next_command" | "pipeline_id"> {
  switch (intent) {
    case "fix_broken":
      return { next_command: "/hivefiver-doctor", pipeline_id: "doctor_fix" }
    case "audit_health":
      return { next_command: "/hivefiver-audit", pipeline_id: "audit_only" }
    case "improve":
      return { next_command: "/hivefiver-audit", pipeline_id: "audit_then_build" }
    case "learn":
      return { next_command: "/hivefiver-discovery", pipeline_id: "guided_onboard" }
    case "build_new":
    case "extend":
      return { next_command: "/hivefiver-discovery", pipeline_id: "full_build" }
    default:
      return { next_command: "/hivefiver-discovery", pipeline_id: "adaptive" }
  }
}

/**
 * Classify free-form HiveFiver intake into the command/workflow stage taxonomy.
 *
 * @param input - Raw user input or compiled discovery text.
 * @returns Intent classification compatible with the legacy shell contract.
 */
export function classifyHiveFiverIntent(input: string): HiveFiverIntentResult {
  const text = normalizeText(input)
  const reasons: string[] = []
  let bestIntent: HiveFiverIntent = "unknown"
  let bestScore = 0

  for (const candidate of INTENT_KEYWORDS) {
    const score = candidate.keywords.reduce(
      (total, keyword) => total + (text.includes(keyword) ? 1 : 0),
      0,
    )
    if (score > 0) {
      reasons.push(`${candidate.intent}:${score}`)
    }
    if (score > bestScore) {
      bestIntent = candidate.intent
      bestScore = score
    }
  }

  if (bestIntent === "unknown") {
    const broad = classifySessionIntent({
      trajectoryIntent: input,
      focusContent: input,
    })
    switch (broad.intent) {
      case "debug":
        bestIntent = "fix_broken"
        bestScore = Math.max(bestScore, 1)
        reasons.push(`fallback:${broad.intent}`)
        break
      case "testing":
        bestIntent = "audit_health"
        bestScore = Math.max(bestScore, 1)
        reasons.push(`fallback:${broad.intent}`)
        break
      case "implementing":
        bestIntent = "build_new"
        bestScore = Math.max(bestScore, 1)
        reasons.push(`fallback:${broad.intent}`)
        break
      case "planning":
        bestIntent = "extend"
        bestScore = Math.max(bestScore, 1)
        reasons.push(`fallback:${broad.intent}`)
        break
      case "discovery":
      case "research":
        bestIntent = "learn"
        bestScore = Math.max(bestScore, 1)
        reasons.push(`fallback:${broad.intent}`)
        break
    }
  }

  const route = mapIntentToRoute(bestIntent)
  return {
    intent: bestIntent,
    confidence: toConfidence(bestScore),
    reasons: reasons.length > 0 ? reasons : ["fallback:unknown"],
    next_command: route.next_command,
    pipeline_id: route.pipeline_id,
  }
}

/**
 * Build a lightweight guided-discovery profile for the HiveFiver command/workflow
 * bridge without creating a second runtime authority model.
 *
 * @param input - Raw user input.
 * @returns Compatibility profile payload for the legacy shell contract.
 */
export function buildHiveFiverDiscoveryProfile(input: string): HiveFiverDiscoveryProfile {
  const trimmed = input.trim()
  const lower = normalizeText(input)
  const wordCount = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
  const viSignals = VIETNAMESE_SIGNALS.reduce(
    (count, signal) => count + (lower.includes(signal) ? 1 : 0),
    /[ăâêôơưđ]/i.test(trimmed) ? 2 : 0,
  )
  const techSignals = MATURITY_TECH_TERMS.reduce(
    (count, signal) => count + (lower.includes(signal) ? 1 : 0),
    0,
  )

  let language: HiveFiverLanguage = "en"
  if (viSignals >= 2 && /[a-z]/i.test(trimmed)) {
    language = "bilingual"
  } else if (viSignals >= 2) {
    language = "vi"
  }

  let maturity: HiveFiverMaturity = "L1"
  if (techSignals >= 5) {
    maturity = "L3"
  } else if (techSignals >= 2) {
    maturity = "L2"
  } else if (
    lower.includes("what is") ||
    lower.includes("new to") ||
    lower.includes("beginner") ||
    lower.includes("khong biet")
  ) {
    maturity = "L0"
  }

  let inputBand: HiveFiverInputBand = "medium"
  if (wordCount <= 12) {
    inputBand = "short"
  } else if (wordCount <= 60) {
    inputBand = "medium"
  } else if (wordCount <= 160) {
    inputBand = "long"
  } else {
    inputBand = "wall_of_text"
  }

  let guidance: HiveFiverGuidance = "medium"
  if (maturity === "L0" || inputBand === "wall_of_text") {
    guidance = "high"
  } else if (maturity === "L3" && inputBand === "short") {
    guidance = "low"
  }

  return {
    language,
    maturity,
    input_band: inputBand,
    guidance,
    signal_count: viSignals + techSignals,
  }
}

/**
 * Resolve the first `/hivefiver` route without relying on the dead shell
 * classifier contract.
 *
 * @param input - Raw action string passed to `/hivefiver`.
 * @returns Route decision compatible with router/start/discovery workflows.
 */
export function routeHiveFiverStage(input: string): HiveFiverRouteStageResult {
  const normalized = normalizeText(input)
  const action = normalized.split(/\s+/)[0] ?? ""
  const explicitCommand = EXPLICIT_ACTIONS.get(action)
  if (explicitCommand) {
    return {
      action,
      route_type: "explicit",
      next_command: explicitCommand,
    }
  }

  if (normalized === "" || normalized === ".") {
    return {
      action: normalized || "status",
      route_type: "status",
      next_command: "/hivefiver-start",
    }
  }

  const classified = classifyHiveFiverIntent(input)
  return {
    action: normalized,
    route_type: "intent",
    next_command: classified.next_command,
    intent: classified.intent,
    confidence: classified.confidence,
    pipeline_id: classified.pipeline_id,
  }
}
