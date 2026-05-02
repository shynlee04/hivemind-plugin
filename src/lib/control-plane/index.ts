/**
 * @fileoverview Control Plane barrel — re-exports all control plane modules.
 * The control plane intercepts and routes user messages through gatekeeper
 * decisions before they reach the agent.
 *
 * Phase 61 — CP-01, CP-02, CP-03, CP-04
 */

export {
  createGatekeeper,
  BLOCKING_GATES,
  NON_BLOCKING_GATES,
} from "./gatekeeper.js"

export type {
  GateDecision,
  GateEvaluationContext,
  GateEvaluationResult,
  GateResult,
  Gatekeeper,
} from "./gatekeeper.js"

export {
  GateDecisionType,
  isBlockingDecision,
  classifyGateDecision,
} from "./gate-decision.js"

export type {
  GateDecisionRecord,
} from "./gate-decision.js"
