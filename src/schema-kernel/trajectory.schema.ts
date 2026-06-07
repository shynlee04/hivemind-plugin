import { z } from "zod"

/**
 * Zod schema for supported `hivemind-trajectory` actions.
 */
export const TrajectoryActionSchema = z.enum(["inspect", "traverse", "attach", "checkpoint", "event", "close", "create"])

/**
 * Zod schema for trajectory tool input.
 */
export const TrajectoryToolInputSchema = z.object({
  action: TrajectoryActionSchema,
  trajectoryId: z.string().min(1).optional(),
  rootSessionId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  parentTrajectoryId: z.string().min(1).optional(),
  checkpointId: z.string().min(1).optional(),
  eventId: z.string().min(1).optional(),
  eventType: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  evidenceRef: z.string().min(1).optional(),
  evidenceRefs: z.array(z.string().min(1)).optional(),
  // Phase-level trajectory fields
  phaseNumber: z.union([z.number(), z.string()]).optional(),
  phaseName: z.string().optional(),
  // Progressive disclosure depth
  depth: z.enum(["summary", "detailed", "full"]).optional(),
})

/**
 * Inferred `hivemind-trajectory` tool input.
 */
export type TrajectoryToolInput = z.infer<typeof TrajectoryToolInputSchema>

/**
 * Zod schema for phase trajectory creation input.
 *
 * Per D-01/D-04, trajectory is per-PHASE with ID format `traj-phase-{N}`.
 */
export const PhaseTrajectoryCreateSchema = z.object({
  projectRoot: z.string().min(1),
  phaseNumber: z.union([z.number(), z.string()]),
  rootSessionId: z.string().min(1),
  phaseName: z.string().optional(),
})

/**
 * Inferred phase trajectory creation input.
 */
export type PhaseTrajectoryCreateInput = z.infer<typeof PhaseTrajectoryCreateSchema>

/**
 * Zod schema for progressive disclosure depth parameter.
 *
 * Per D-27, all 3 levels are required: summary, detailed, full.
 */
export const TrajectoryDepthSchema = z.enum(["summary", "detailed", "full"])

/**
 * Inferred trajectory depth type.
 */
export type TrajectoryDepth = z.infer<typeof TrajectoryDepthSchema>

/**
 * Parse and validate action-specific trajectory tool input.
 *
 * @param rawInput - Untrusted raw tool arguments.
 * @returns Validated trajectory tool input.
 * @throws {z.ZodError | Error} When common or action-specific fields are invalid.
 */
export function parseTrajectoryToolInput(rawInput: unknown): TrajectoryToolInput {
  const parsed = TrajectoryToolInputSchema.parse(rawInput)
  if (["attach", "checkpoint", "event", "close"].includes(parsed.action) && !parsed.trajectoryId) {
    throw new Error("[Harness] trajectoryId is required")
  }
  if (parsed.action === "create" && !parsed.phaseNumber) {
    throw new Error("[Harness] phaseNumber is required for create")
  }
  if (parsed.action === "checkpoint" && !parsed.summary) {
    throw new Error("[Harness] summary is required for checkpoint")
  }
  if (parsed.action === "event" && (!parsed.eventType || !parsed.summary)) {
    throw new Error("[Harness] eventType and summary are required for event")
  }
  return parsed
}
