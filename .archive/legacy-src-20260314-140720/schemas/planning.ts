import { z } from "zod"

/** Planning requirement status */
export const RequirementStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "deferred",
  "cancelled",
])

/** Single requirement entry */
export const RequirementSchema = z.object({
  id: z.string().regex(/^REQ-\d{3,}$/, "Requirement ID must match REQ-NNN format"),
  description: z.string().min(1),
  phase: z.string().optional(),
  status: RequirementStatusSchema.default("pending"),
  acceptance_criteria: z.array(z.string()).default([]),
})

/** Phase status */
export const PhaseStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
  "blocked",
])

/** Single phase entry */
export const PhaseSchema = z.object({
  number: z.number().int().positive(),
  name: z.string().min(1),
  status: PhaseStatusSchema.default("not_started"),
  progress: z.number().min(0).max(100).default(0),
})

/** Planning state (maps to STATE.md) */
export const PlanningStateSchema = z.object({
  current_position: z.string().default(""),
  active_blockers: z.array(z.string()).default([]),
  recent_decisions: z
    .array(
      z.object({
        decision: z.string(),
        date: z.string(),
        session_id: z.string().optional(),
      }),
    )
    .default([]),
  session_history: z
    .array(
      z.object({
        session_id: z.string(),
        summary: z.string(),
        date: z.string(),
      }),
    )
    .default([]),
})

/** Milestone entry */
export const MilestoneSchema = z.object({
  name: z.string().min(1),
  completed_date: z.string(),
  phases_included: z.array(z.number()).default([]),
  summary: z.string().default(""),
})

/** Full planning manifest */
export const PlanningManifestSchema = z.object({
  version: z.literal("1.0.0"),
  project_name: z.string().default(""),
  requirements: z.array(RequirementSchema).default([]),
  phases: z.array(PhaseSchema).default([]),
  state: PlanningStateSchema.default({
    current_position: "",
    active_blockers: [],
    recent_decisions: [],
    session_history: [],
  }),
  milestones: z.array(MilestoneSchema).default([]),
})

/** Input child status item for plan completion eligibility checks. */
export const PlanCompletionChildSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1),
})

/** Input payload for plan completion eligibility checks. */
export const PlanCompletionCheckInputSchema = z.object({
  parent_id: z.string().min(1).optional(),
  children: z.array(PlanCompletionChildSchema).default([]),
  terminal_statuses: z.array(z.string().min(1)).optional(),
})

/** Deterministic result payload for completion eligibility checks. */
export const PlanCompletionCheckResultSchema = z.object({
  can_transition_to_completed: z.boolean(),
  blocking_child_ids: z.array(z.string()),
  blocking_statuses: z.array(z.string()),
  rule_version: z.string().min(1),
})

// ─── Planning Framework Schemas ───────────────────────────────────────────────

/** Plan type discriminator */
export const PlanTypeSchema = z.enum(["plan", "sub_plan", "atomic_plan"])

/** Plan status values */
export const PlanFileStatusSchema = z.enum(["pending", "active", "complete", "blocked"])

/** Plan owner */
export const PlanOwnerSchema = z.enum(["main", "subagent", "delegated"])

/** Plan domain tags */
export const PlanDomainSchema = z.enum([
  "frontend", "backend", "api", "data", "persistence",
  "hooks", "sdk", "meta", "infra",
])

/** Plan purpose tags */
export const PlanPurposeSchema = z.enum([
  "discovery", "research", "planning", "implementation",
  "testing", "verification", "debugging",
])

/** Plan tier classification */
export const PlanTierSchema = z.enum([
  "governance_sot", "realtime_codebase", "knowledge_base", "planning_artifact",
])

/** Validation state */
export const PlanValidationStateSchema = z.enum(["pending", "validated", "failed", "skipped"])

/** Plan file YAML frontmatter schema */
export const PlanFileFrontmatterSchema = z.object({
  id: z.string().uuid(),
  type: PlanTypeSchema,
  prefix: z.string().min(1),
  title: z.string().min(1),
  status: PlanFileStatusSchema,
  parent_id: z.string().uuid().nullable(),
  root_id: z.string().uuid().nullable(),
  trajectory_id: z.string().uuid().optional(),
  session_ids: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  owner: PlanOwnerSchema.default("main"),
  domain: PlanDomainSchema.default("meta"),
  purpose: PlanPurposeSchema.default("planning"),
  tier: PlanTierSchema.default("planning_artifact"),
  validation_state: PlanValidationStateSchema.default("pending"),
  tags: z.array(z.string()).default([]),
})

/** Evidence item for validation artifacts */
export const ValidationEvidenceSchema = z.object({
  type: z.enum(["commit", "test", "checkpoint", "manual"]),
  ref: z.string().min(1),
  description: z.string().optional(),
  result: z.string().optional(),
})

/** Validation artifact YAML frontmatter schema */
export const ValidationArtifactSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("validation"),
  plan_id: z.string().uuid(),
  status: z.enum(["pending", "pass", "fail", "partial"]),
  validator: z.enum(["main", "subagent"]).default("main"),
  created: z.string().datetime(),
  updated: z.string().datetime(),
  evidence: z.array(ValidationEvidenceSchema).default([]),
})

/** Machine-checkable plan completion criteria */
export const PlanCompletionCriteriaSchema = z.object({
  all_nodes_complete: z.boolean(),
  all_links_resolve: z.boolean(),
  all_validations_pass: z.boolean(),
  yaml_headers_valid: z.boolean(),
  navigation_intact: z.boolean(),
  graph_sync: z.boolean(),
})

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type RequirementStatus = z.infer<typeof RequirementStatusSchema>
export type Requirement = z.infer<typeof RequirementSchema>
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>
export type Phase = z.infer<typeof PhaseSchema>
export type PlanningState = z.infer<typeof PlanningStateSchema>
export type Milestone = z.infer<typeof MilestoneSchema>
export type PlanningManifest = z.infer<typeof PlanningManifestSchema>
export type PlanCompletionChild = z.infer<typeof PlanCompletionChildSchema>
export type PlanCompletionCheckInput = z.infer<typeof PlanCompletionCheckInputSchema>
export type PlanCompletionCheckResult = z.infer<typeof PlanCompletionCheckResultSchema>
export type PlanFileFrontmatter = z.infer<typeof PlanFileFrontmatterSchema>
export type ValidationEvidence = z.infer<typeof ValidationEvidenceSchema>
export type ValidationArtifact = z.infer<typeof ValidationArtifactSchema>
export type PlanCompletionCriteria = z.infer<typeof PlanCompletionCriteriaSchema>
