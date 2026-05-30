import { getToolAuthority } from "./authority-matrix.js"
import { classifyRuntimePressure } from "./model.js"
import type {
  PressureBand,
  PressureClassification,
  PressureDecision,
  PressureDecisionOutcome,
  PressureDetectionInput,
  PressureSeverity,
  ToolAuthority,
} from "./types.js"

/**
 * Detect the control-plane outcome for a pressure classification and
 * optional tool. Pure function — does not mutate runtime policy or
 * session state.
 *
 * Decision algorithm:
 *  1. Classify the pressure into a tier and band.
 *  2. If a known tool is supplied, prefer its per-band `pressureBehavior`
 *     mapping (the matrix is the authority).
 *  3. Otherwise fall back to a band default that is conservative for
 *     unknown / mutating / executing actions.
 *  4. Derive `severity`, `recommendedAction`, and (when divergent)
 *     `blockingRationale` per the Phase 57 contract.
 *
 * @param input - Pressure score/tier plus optional registered tool name.
 * @returns Pure control-plane decision with the contract payload.
 */
export function detectRuntimePressure(input: PressureDetectionInput = {}): PressureDecision {
  const classification = classifyRuntimePressure(input)
  const tool = getToolAuthority(input.toolName)
  const outcome = resolveOutcome(classification, tool)
  const reason = buildReason(classification, tool, outcome)
  const severity = deriveSeverity(classification.band, outcome)
  const recommendedAction = buildRecommendedAction(outcome, tool)
  const decision: PressureDecision = {
    ...classification,
    tool,
    outcome,
    severity,
    recommendedAction,
    reason,
  }
  if (isDivergentOutcome(outcome)) {
    decision.blockingRationale = buildBlockingRationale(classification.band, tool, outcome)
  }
  return decision
}

/**
 * Resolve the control-plane outcome for a classification + optional tool.
 * Tool-specific `pressureBehavior` wins over the band default.
 */
function resolveOutcome(
  classification: PressureClassification,
  tool: ToolAuthority | undefined,
): PressureDecisionOutcome {
  if (tool) {
    return tool.pressureBehavior[classification.band]
  }
  return unknownToolFallback(classification.band)
}

/**
 * Conservative band default for unknown / unregistered tools. Matches
 * the legacy `detectRuntimePressure` behavior so callers that pass no
 * tool name still get sensible decisions.
 */
function unknownToolFallback(band: PressureBand): PressureDecisionOutcome {
  switch (band) {
    case "steady":
      return "allow"
    case "advisory":
      return "advise"
    case "gated":
      return "require_approval"
    case "blocking":
      return "block"
  }
}

/**
 * Build a human-readable explanation of the decision for audit and
 * debugging surfaces (trajectory ledger, error messages, etc.).
 */
function buildReason(
  classification: PressureClassification,
  tool: ToolAuthority | undefined,
  outcome: PressureDecisionOutcome,
): string {
  const subject = tool ? `tool "${tool.name}"` : "unknown tool"
  return `${classification.band} pressure (tier ${classification.tier}) → ${outcome} for ${subject}`
}

/**
 * Derive severity from the pressure band, downgraded when the outcome
 * is `allow` even at gated bands (per-tool override) and upgraded when
 * the outcome is `block` even at advisory bands.
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
function buildRecommendedAction(outcome: PressureDecisionOutcome, tool: ToolAuthority | undefined): string {
  const name = tool?.name ?? "this action"
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
  tool: ToolAuthority | undefined,
  outcome: PressureDecisionOutcome,
): string {
  const subject = tool ? `${tool.stateSurface} tool "${tool.name}"` : "an unregistered tool"
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
