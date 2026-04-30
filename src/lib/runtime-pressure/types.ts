/**
 * Pressure tiers supported by the runtime pressure model.
 */
export type PressureTier = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Pressure bands used by the control plane to choose an enforcement posture.
 */
export type PressureBand = "steady" | "advisory" | "gated" | "blocking"

/**
 * Control-plane decision outcomes for a proposed runtime action.
 */
export type PressureDecisionOutcome = "allow" | "advise" | "require_approval" | "defer" | "block"

/**
 * Side-effect authority advertised by a registered tool.
 */
export type ToolAuthorityLevel = "read" | "write" | "execute" | "state"

/**
 * Tool authority matrix row for a currently registered plugin tool.
 */
export type ToolAuthority = {
  /** Registered OpenCode tool name. */
  name: string
  /** Authority level used by pure pressure decisions. */
  authority: ToolAuthorityLevel
  /** True when the tool may mutate persistent Hivemind or project state. */
  mutatesState: boolean
  /** True when the tool can launch commands or child sessions. */
  canExecute: boolean
  /** Short reason explaining why the authority level was assigned. */
  reason: string
}

/**
 * Input accepted by the pure pressure classifier.
 */
export type PressureClassificationInput = {
  /** Numeric pressure score. Values are clamped into the 0-9 tier range. */
  score?: number
  /** Optional direct tier value. Takes precedence over score when present. */
  tier?: number
}

/**
 * Pressure classification returned by the model.
 */
export type PressureClassification = {
  /** Clamped pressure tier from 0 through 9. */
  tier: PressureTier
  /** Escalation band mapped from the tier. */
  band: PressureBand
}

/**
 * Input accepted by the pure control-plane detector.
 */
export type PressureDetectionInput = PressureClassificationInput & {
  /** Registered tool name being considered. */
  toolName?: string
}

/**
 * Pure control-plane decision for a proposed runtime action.
 */
export type PressureDecision = PressureClassification & {
  /** Final control-plane outcome. */
  outcome: PressureDecisionOutcome
  /** Tool authority row used for the decision, when a known tool was supplied. */
  tool?: ToolAuthority
  /** Human-readable explanation for audit and debugging. */
  reason: string
}
