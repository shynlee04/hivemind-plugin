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
 * Four-way state-surface taxonomy required by the Phase 57 planning
 * contract for the tool catalog authority matrix:
 *
 * - `hivemind-state`     — writers into `.hivemind/state/*` (continuity,
 *                          delegations, journals, ledger, work contracts).
 * - `opencode-primitive` — configurators that materialise OpenCode
 *                          agent / command / skill / MCP files.
 * - `read-only`          — pure read or analysis tools that produce no
 *                          persistent side effect.
 * - `external-command`   — runners that spawn shells / commands outside
 *                          the harness's own state surface.
 *
 * Every registered tool must select exactly one of these.
 */
export type ToolStateSurface =
  | "hivemind-state"
  | "opencode-primitive"
  | "read-only"
  | "external-command"

/**
 * Where a tool attaches its evidence when it runs. Required for the
 * audit trail per the Phase 57 contract.
 */
export type ToolEvidenceAttachment =
  | "trajectory-ledger"
  | "session-journal"
  | "execution-lineage"
  | "none"

/**
 * Per-band pressure behavior for a registered tool. Maps each pressure
 * band to the outcome the control plane should produce when this tool
 * is requested at that band. Tools may opt into more permissive or more
 * restrictive behavior than the band default — this is what makes the
 * matrix the authority, not just the band.
 */
export type ToolPressureBehavior = {
  steady: PressureDecisionOutcome
  advisory: PressureDecisionOutcome
  gated: PressureDecisionOutcome
  blocking: PressureDecisionOutcome
}

/**
 * Tool authority matrix row for a currently registered plugin tool.
 *
 * The shape is the contract surface — every field is required by the
 * Phase 57 planning contract. Adding a new tool to the matrix without
 * filling these fields is a build-time error caught by the conformance
 * test.
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
  /** Four-way state-surface classification per the Phase 57 contract. */
  stateSurface: ToolStateSurface
  /** Per-band outcome map driving the control-plane decision. */
  pressureBehavior: ToolPressureBehavior
  /** Where evidence is attached when this tool runs. */
  evidenceAttachment: ToolEvidenceAttachment
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
 * Severity level attached to a pressure decision. Derived from the
 * pressure band — `steady` and `advisory` are non-blocking observations,
 * `gated` is a yellow-flag, `blocking` is an error.
 */
export type PressureSeverity = "info" | "warn" | "error"

/**
 * Pure control-plane decision for a proposed runtime action.
 *
 * Carries the contract-required payload from `57-CONTRACT-2026-04-30.md`
 * §"Control-Plane Decision Contract": status (carried as `outcome` for
 * source-compat), reason, severity, recommended action, and blocking
 * rationale when applicable.
 */
export type PressureDecision = PressureClassification & {
  /**
   * Final control-plane outcome. Maps to the contract's `status` field;
   * the field is named `outcome` for source-compat with prior callers.
   */
  outcome: PressureDecisionOutcome
  /** Tool authority row used for the decision, when a known tool was supplied. */
  tool?: ToolAuthority
  /** Severity derived from the pressure band. */
  severity: PressureSeverity
  /** One human-readable next step the caller should take. */
  recommendedAction: string
  /** Human-readable explanation for audit and debugging. */
  reason: string
  /**
   * Why the runtime trajectory was changed. Present only when
   * `outcome ∈ {require_approval, defer, block}` — i.e. exactly when
   * the decision diverts from "allow / advise".
   */
  blockingRationale?: string
}
