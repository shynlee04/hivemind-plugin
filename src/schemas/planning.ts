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

export type RequirementStatus = z.infer<typeof RequirementStatusSchema>
export type Requirement = z.infer<typeof RequirementSchema>
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>
export type Phase = z.infer<typeof PhaseSchema>
export type PlanningState = z.infer<typeof PlanningStateSchema>
export type Milestone = z.infer<typeof MilestoneSchema>
export type PlanningManifest = z.infer<typeof PlanningManifestSchema>
