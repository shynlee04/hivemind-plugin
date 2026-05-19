/**
 * Zod schema for the hivemind-session-view tool.
 *
 * Single action: get — returns enriched unified view across 3 data roots.
 * @module schema-kernel/session-view-schema
 */

import { z } from "zod"
import { safeSessionId } from "./session-tracker.schema.js"

/**
 * Input schema for the hivemind-session-view tool.
 */
export const SessionViewInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("get"),
    sessionId: safeSessionId,
  }),
])

/** Inferred type for session-view tool input. */
export type SessionViewInput = z.infer<typeof SessionViewInputSchema>

/**
 * Input schema for delegation-status tool (shared).
 */
export const SessionViewDelegationFilterSchema = z.object({
  sessionId: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
})

export type SessionViewDelegationFilter = z.infer<typeof SessionViewDelegationFilterSchema>
