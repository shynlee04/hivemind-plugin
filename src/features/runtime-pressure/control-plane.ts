import { classifyRuntimePressure } from "./model.js"
import type {
  PressureBand,
  PressureClassification,
  PressureDecision,
  PressureDecisionOutcome,
  PressureDetectionInput,
  PressureSeverity,
} from "./types.js"

/**
 * Detect the control-plane outcome for a pressure classification and
 * optional tool. Pure function — does not mutate runtime policy or
 * session state.
 *
 * Decision algorithm:
 *  1. Classify the pressure into a tier and band.
 *  2. Apply the conservative band-default outcome (soft governance).
 *  3. Derive `severity`, `recommendedAction`, and (when divergent)
 *     `blockingRationale` per the Phase 57 contract.
 *
 * After the tool-governance consolidation, per-tool authority lookup
 * was removed — all tools use the same conservative band-default.
 * OpenCode's native `permission:` field is the sole tool authority.
 *
 * @param input - Pressure score/tier plus optional registered tool name.
 * @returns Pure control-plane decision with the contract payload.
 */
export function detectRuntimePressure(input: PressureDetectionInput = {}): PressureDecision {
  const classification = classifyRuntimePressure(input)
  const outcome = unknownToolFallback(classification.band)
  const reason = buildReason(classification, outcome)
  const severity = deriveSeverity(classification.band, outcome)
  const recommendedAction = buildRecommendedAction(outcome, input.toolName)
  const decision: PressureDecision = {
    ...classification,
    outcome,
    severity,
    recommendedAction,
    reason,
  }
  if (isDivergentOutcome(outcome)) {
    decision.blockingRationale = buildBlockingRationale(classification.band, input.toolName, outcome)
  }
  return decision
}

/**
 * Soft-governance band default for all tools.
 * All outcomes are advisory by default; set `require_approval` or
 * `block` explicitly in config if hard-blocking is desired.
 */
function unknownToolFallback(band: PressureBand): PressureDecisionOutcome {
  switch (band) {
    case "steady":
      return "allow"
    case "advisory":
      return "advise"
    case "gated":
      return "advise"
    case "blocking":
      return "advise"
  }
}

/**
 * Build a human-readable explanation of the decision for audit and
 * debugging surfaces (trajectory ledger, error messages, etc.).
 */
function buildReason(
  classification: PressureClassification,
  outcome: PressureDecisionOutcome,
): string {
  return `${classification.band} pressure (tier ${classification.tier}) → ${outcome}`
}

/**
 * Derive severity from the pressure band, downgraded when the outcome
 * is `allow` even at gated bands and upgraded when the outcome is `block`
 * even at advisory bands.
 */
function deriveSeverity(band: PressureBand, outcome: PressureDecisionOutcome): PressureSeverity {
  if (outcome === "block") return "error"
  if (outcome === "defer" || outcome === "require_approval") return "warn"
  if (outcome === "advise") return "warn"
  // outcome === "allow"
  if (band === "blocking") return "error"
  if (band === "gated") return "warn"
  if (band === "advisory") return "warn"
  return "info"
}

/**
 * One human-readable next step the caller should take, suitable for
 * surfacing in error messages and trajectory ledger entries.
 */
function buildRecommendedAction(outcome: PressureDecisionOutcome, toolName?: string): string {
  const name = toolName ?? "this action"
  switch (outcome) {
    case "allow":
      return `proceed with ${name}`
    case "advise":
      return `proceed with ${name} but record advisory evidence`
    case "require_approval":
      return `obtain explicit approval before invoking ${name}`
    case "defer":
      return `defer ${name} until pressure lowers below the gated band`
    case "block":
      return `do not invoke ${name}; resolve pressure source first`
  }
}

/**
 * Why the runtime trajectory is being changed. Present only when the
 * outcome diverts from `allow` / `advise` (i.e. exactly when the caller
 * cannot just proceed).
 */
function buildBlockingRationale(
  band: PressureBand,
  toolName: string | undefined,
  outcome: PressureDecisionOutcome,
): string {
  const subject = toolName ? `tool "${toolName}"` : "an unregistered tool"
  switch (outcome) {
    case "require_approval":
      return `${band} pressure requires human approval before ${subject} can run`
    case "defer":
      return `${band} pressure defers ${subject} to avoid producing stale or unsafe evidence`
    case "block":
      return `${band} pressure prohibits ${subject} from running until the pressure source is resolved`
    default:
      return ""
  }
}

/**
 * True when the outcome diverts the runtime trajectory away from
 * `allow` / `advise` and therefore must carry a blocking rationale.
 */
function isDivergentOutcome(outcome: PressureDecisionOutcome): boolean {
  return outcome === "require_approval" || outcome === "defer" || outcome === "block"
}
