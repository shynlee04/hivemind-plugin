import { z } from "zod"

/**
 * Zod schema for the `hivemind-pressure` tool action selector.
 */
export const RuntimePressureActionSchema = z.enum(["classify", "detect", "inspect_tool_catalog", "attach_event"])

/**
 * Zod schema for pressure decision outcomes.
 */
export const PressureDecisionOutcomeSchema = z.enum(["allow", "advise", "require_approval", "defer", "block"])

/**
 * Zod schema for pressure bands.
 */
export const PressureBandSchema = z.enum(["steady", "advisory", "gated", "blocking"])

/**
 * Zod schema for `hivemind-pressure` tool input.
 */
export const RuntimePressureToolInputSchema = z.object({
  action: RuntimePressureActionSchema,
  score: z.number().optional(),
  tier: z.number().optional(),
  toolName: z.string().min(1).optional(),
  trajectoryId: z.string().min(1).optional(),
  rootSessionId: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
  parentTrajectoryId: z.string().min(1).optional(),
  eventId: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  evidenceRef: z.string().min(1).optional(),
  evidenceRefs: z.array(z.string().min(1)).optional(),
})

/**
 * Inferred `hivemind-pressure` tool input.
 */
export type RuntimePressureToolInput = z.infer<typeof RuntimePressureToolInputSchema>

/**
 * Parse and validate action-specific runtime-pressure tool input.
 *
 * @param rawInput - Untrusted tool arguments.
 * @returns Validated tool input.
 * @throws {Error | z.ZodError} When action-specific required fields are missing.
 */
export function parseRuntimePressureToolInput(rawInput: unknown): RuntimePressureToolInput {
  const parsed = RuntimePressureToolInputSchema.parse(rawInput)
  if (parsed.action === "attach_event") {
    if (!parsed.trajectoryId) throw new Error("[Hivemind] trajectoryId is required for attach_event")
    if (!parsed.summary) throw new Error("[Hivemind] summary is required for attach_event")
  }
  return parsed
}
