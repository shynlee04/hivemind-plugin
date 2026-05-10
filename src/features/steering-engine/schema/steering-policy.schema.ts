import { z } from "zod"

// ---------------------------------------------------------------------------
// §1.1 Condition Types — discriminated union of 7 steering condition variants
// ---------------------------------------------------------------------------

/**
 * Matches when the agent is front-facing or a subagent.
 * @see REQ-01, REQ-05
 */
export const HierarchyConditionSchema = z.object({
  type: z.literal("hierarchy"),
  match: z.enum(["front-facing", "subagent"]),
})
export type HierarchyCondition = z.infer<typeof HierarchyConditionSchema>

/**
 * Matches when the agent operates at a specific delegation depth (L0-L3).
 * @see REQ-01
 */
export const DepthConditionSchema = z.object({
  type: z.literal("depth"),
  match: z.enum(["L0", "L1", "L2", "L3"]),
})
export type DepthCondition = z.infer<typeof DepthConditionSchema>

/**
 * Matches when the agent belongs to a specific lineage (hm or hf).
 * gsd-* is excluded per constraint C3.
 * @see REQ-01
 */
export const LineageConditionSchema = z.object({
  type: z.literal("lineage"),
  match: z.enum(["hm", "hf"]), // gsd excluded (C3)
})
export type LineageCondition = z.infer<typeof LineageConditionSchema>

/**
 * Matches when the number of turns since the last steering injection
 * meets or exceeds the specified minimum.
 * @see REQ-01
 */
export const TurnsSinceConditionSchema = z.object({
  type: z.literal("turns_since_last"),
  minimum: z.number().int().min(0),
})
export type TurnsSinceCondition = z.infer<typeof TurnsSinceConditionSchema>

/**
 * Matches when the agent is in a specific workflow phase (research, plan,
 * execute, or verify).
 * @see REQ-01
 */
export const PhaseConditionSchema = z.object({
  type: z.literal("workflow_phase"),
  match: z.enum(["research", "plan", "execute", "verify"]),
})
export type PhaseCondition = z.infer<typeof PhaseConditionSchema>

/**
 * Matches when a session compaction event has just occurred.
 * @see REQ-01, REQ-03
 */
export const CompactionConditionSchema = z.object({
  type: z.literal("compaction_event"),
  match: z.literal(true),
})
export type CompactionCondition = z.infer<typeof CompactionConditionSchema>

/**
 * Matches when a task boundary shift has been detected.
 * @see REQ-01
 */
export const TaskBoundaryConditionSchema = z.object({
  type: z.literal("task_boundary"),
  match: z.literal(true),
})
export type TaskBoundaryCondition = z.infer<typeof TaskBoundaryConditionSchema>

/**
 * Discriminated union of all 7 steering condition types.
 * Conditions within a policy use AND logic — all must match for injection.
 * @see REQ-01
 */
export const SteeringConditionSchema = z.discriminatedUnion("type", [
  HierarchyConditionSchema,
  DepthConditionSchema,
  LineageConditionSchema,
  TurnsSinceConditionSchema,
  PhaseConditionSchema,
  CompactionConditionSchema,
  TaskBoundaryConditionSchema,
])
export type SteeringCondition = z.infer<typeof SteeringConditionSchema>

// ---------------------------------------------------------------------------
// §1.2 Injection Surface Enum
// ---------------------------------------------------------------------------

/**
 * Three injection surfaces available for steering content.
 *
 * - `messages.transform` – conditional <system_reminder> mid-conversation (REQ-02)
 * - `session.compacting`  – full context recovery packet on compaction (REQ-03)
 * - `system.transform`    – single-line role marker on session start (REQ-04)
 */
export const InjectionSurfaceSchema = z.enum([
  "messages.transform",
  "session.compacting",
  "system.transform",
])
export type InjectionSurface = z.infer<typeof InjectionSurfaceSchema>

// ---------------------------------------------------------------------------
// §3.1 Steering Content — union of surface-specific content shapes
// ---------------------------------------------------------------------------

/**
 * Content template for messages.transform injection.
 * Budget ≤200 tokens per RESEARCH.md §4.4.
 * @see REQ-02
 */
export const MessageTransformContentSchema = z.object({
  template: z.string().max(2000),
  estimated_tokens: z.number().int().min(0).max(200),
})
export type MessageTransformContent = z.infer<
  typeof MessageTransformContentSchema
>

/**
 * Content template for session.compacting injection.
 * Budget ≤800 tokens per RESEARCH.md §4.4.
 * @see REQ-03
 */
export const SessionCompactingContentSchema = z.object({
  template: z.string().max(4000),
  estimated_tokens: z.number().int().min(0).max(800),
})
export type SessionCompactingContent = z.infer<
  typeof SessionCompactingContentSchema
>

/**
 * Content template for system.transform injection.
 * Budget ≤50 tokens per RESEARCH.md §4.4.
 * @see REQ-04
 */
export const SystemTransformContentSchema = z.object({
  template: z.string().max(200),
  estimated_tokens: z.number().int().min(0).max(50),
})
export type SystemTransformContent = z.infer<
  typeof SystemTransformContentSchema
>

/**
 * Union of all three surface-specific content shapes.
 */
export const SteeringContentSchema = z.union([
  MessageTransformContentSchema,
  SessionCompactingContentSchema,
  SystemTransformContentSchema,
])
export type SteeringContent = z.infer<typeof SteeringContentSchema>

// ---------------------------------------------------------------------------
// §1.3 SteeringPolicy — top-level policy object
// ---------------------------------------------------------------------------

/**
 * A single steering policy that defines when and how steering content
 * is injected into an agent session. Conditions use AND logic.
 *
 * Invariants:
 * - Semver versioning resolves O2
 * - lineage excludes gsd (C3)
 * - min_turn_interval ≥ 0 prevents injection fatigue (C5)
 * @see REQ-01
 */
export const SteeringPolicySchema = z.object({
  /** Unique policy identifier (lowercase alphanumeric + hyphens). */
  id: z.string().min(1).max(64).regex(/^[a-z0-9][a-z0-9-]*$/),
  /** Human-readable policy name. */
  name: z.string().min(1).max(128),
  /** Semver version for migration support (O2). */
  version: z.string().regex(/^\d+\.\d+\.\d+$/).default("1.0.0"),
  /** Conditions that must ALL match (AND logic). Empty array → always matches. */
  conditions: z.array(SteeringConditionSchema).min(0),
  /** Target injection surface. */
  surface: InjectionSurfaceSchema,
  /** Content template keyed to the target surface. */
  content: SteeringContentSchema,
  /** Priority for conflict resolution (higher wins in priority cascade). */
  priority: z.number().int().min(0).max(100).default(50),
  /** Whether this policy is active. */
  enabled: z.boolean().default(true),
  /** Minimum turns between injections to prevent fatigue (C5). */
  min_turn_interval: z.number().int().min(0).default(3),
  /** Maximum estimated token budget consumed by this injection. */
  max_token_budget: z.number().int().min(0).default(600),
})
export type SteeringPolicy = z.infer<typeof SteeringPolicySchema>

// ---------------------------------------------------------------------------
// §7.4 SteeringConfig — top-level user configuration
// ---------------------------------------------------------------------------

/**
 * User-configurable steering configuration with default fallbacks.
 * Invalid policies are rejected at load time, never silently ignored.
 * @see §7.4
 */
export const SteeringConfigSchema = z
  .object({
    /** User-defined steering policies (merged with shipped defaults). */
    policies: z.array(SteeringPolicySchema).default([]),
    /** Global defaults that override shipped policy defaults. */
    defaults: z
      .object({
        min_turn_interval: z.number().int().min(0).default(3),
        max_token_budget: z.number().int().min(0).default(600),
        enabled: z.boolean().default(true),
      })
      .default({}),
  })
  .default({})
export type SteeringConfig = z.infer<typeof SteeringConfigSchema>

// ---------------------------------------------------------------------------
// §2 Primitive Registration Schema (REQ-06)
// ---------------------------------------------------------------------------

/**
 * Supported primitive types for dynamic registration discovery.
 * @see REQ-06
 */
export const PrimitiveTypeSchema = z.enum([
  "agent",
  "skill",
  "command",
  "tool",
  "plugin",
])
export type PrimitiveType = z.infer<typeof PrimitiveTypeSchema>

/**
 * A registered primitive discovered from .opencode/ YAML frontmatter.
 * Lineage and hierarchy are inferred from filename patterns.
 * @see REQ-06, §2.2, §2.3
 */
export const RegisteredPrimitiveSchema = z.object({
  type: PrimitiveTypeSchema,
  name: z.string().min(1).max(64),
  description: z.string().optional(),
  mode: z.enum(["subagent"]).optional(),
  lineage: z.enum(["hm", "hf"]).optional(),
  hierarchy: z.enum(["L0", "L1", "L2", "L3"]).optional(),
  tools: z.record(z.unknown()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  source_path: z.string(),
  scope: z.enum(["project", "global"]),
})
export type RegisteredPrimitive = z.infer<typeof RegisteredPrimitiveSchema>

// ---------------------------------------------------------------------------
// §2.4 Discovery paths (C7: singular + plural dirs)
// ---------------------------------------------------------------------------

/**
 * Discovery paths for primitive type scanning.
 * Both singular and plural directory names are supported per C7.
 * @see §2.4
 */
export const DISCOVERY_PATHS = {
  agent: [".opencode/agent/", ".opencode/agents/"],
  skill: [".opencode/skills/"],
  command: [".opencode/commands/"],
} as const
