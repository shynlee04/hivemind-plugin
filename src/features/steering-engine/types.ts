// ---------------------------------------------------------------------------
// Re-export schema-inferred types for downstream consumers
// ---------------------------------------------------------------------------

export type {
  CompactionCondition,
  DepthCondition,
  HierarchyCondition,
  InjectionSurface,
  LineageCondition,
  MessageTransformContent,
  PhaseCondition,
  RegisteredPrimitive,
  SessionCompactingContent,
  SteeringCondition,
  SteeringConfig,
  SteeringContent,
  SteeringPolicy,
  SystemTransformContent,
  TaskBoundaryCondition,
  TurnsSinceCondition,
} from "./schema/steering-policy.schema.js"

// ---------------------------------------------------------------------------
// Steering condition type discriminant (string union)
// ---------------------------------------------------------------------------

/**
 * Seven condition types the steering engine evaluates.
 * Each type maps to a Zod-discriminated union variant.
 * @see REQ-01
 */
export type SteeringConditionType =
  | "hierarchy"
  | "depth"
  | "lineage"
  | "turns_since_last"
  | "workflow_phase"
  | "compaction_event"
  | "task_boundary"

// ---------------------------------------------------------------------------
// SteeringContext — runtime snapshot for condition evaluation
// ---------------------------------------------------------------------------

/**
 * Runtime context snapshot collected before condition evaluation.
 * This is a CQRS read-side structure — hooks read from in-memory state
 * and policy-evaluator consumes this snapshot without side effects.
 * @see §5 CQRS Boundary
 */
export interface SteeringContext {
  /** Agent hierarchy level: front-facing or subagent. */
  hierarchy?: "front-facing" | "subagent"
  /** Delegation depth: L0/L1/L2/L3. */
  depth?: "L0" | "L1" | "L2" | "L3"
  /** Agent lineage: hm or hf (gsd excluded per C3). */
  lineage?: "hm" | "hf"
  /** Current workflow phase. */
  workflow_phase?: "research" | "plan" | "execute" | "verify"
  /** Active skill names loaded for this agent. */
  active_skills: string[]
  /** Delegation parent chain (parent → grandparent → ...). */
  delegation_chain: string[]
  /** Parent agent name, if this is a subagent delegation. */
  parent_agent?: string
  /** Current turn number for this session. */
  turn_number: number
  /** Turns elapsed since the last steering injection. */
  turns_since_last_injection: number
  /** Whether a session compaction just occurred. */
  was_compacted: boolean
  /** Whether a task boundary shift was just detected. */
  task_boundary_shift: boolean
  /** Description of the current task boundary, if known. */
  task_boundary?: string
  /** Remaining token budget available for injection this turn. */
  remaining_token_budget: number
  /** Maximum token budget allowed per injection (from policy or config). */
  max_token_budget: number
}

// ---------------------------------------------------------------------------
// SteeringDecision — outcome of policy evaluation
// ---------------------------------------------------------------------------

/**
 * Output of the policy evaluation engine.
 * Captures whether injection should happen, which policy matched,
 * the target surface, rendered content, and the rationale.
 * @see §4 Policy Resolution Algorithm
 */
export interface SteeringDecision {
  /** Whether steering content should be injected this turn. */
  shouldInject: boolean
  /** The ID of the matched policy, if any. */
  matchedPolicy?: string
  /** The target injection surface. */
  surface: "messages.transform" | "session.compacting" | "system.transform"
  /** Rendered injection content (template with variables resolved). */
  content?: string
  /** Human-readable explanation for the decision. */
  reason: string
}
