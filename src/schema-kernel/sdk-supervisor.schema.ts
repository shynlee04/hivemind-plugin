import { z } from "zod"

/** Zod schema for SDK supervisor actions. */
export const SdkSupervisorActionSchema = z.enum(["health", "heartbeat", "diagnostics", "readiness"])

/** Zod schema for the `hivemind-sdk-supervisor` tool input. */
export const SdkSupervisorToolInputSchema = z.object({
  action: SdkSupervisorActionSchema,
  sessionId: z.string().min(1).optional(),
  maxDiagnostics: z.number().optional(),
  score: z.number().optional(),
  tier: z.number().optional(),
})

/** Inferred SDK supervisor tool input. */
export type SdkSupervisorToolInput = z.infer<typeof SdkSupervisorToolInputSchema>
