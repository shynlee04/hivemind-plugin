/**
 * Zod schema for the session-tracker tool.
 *
 * Defines the input contract for agent-initiated session tracker queries.
 * Actions: export-session, list-sessions, search-sessions.
 * All operations are read-only (CQRS read-side).
 *
 * @module schema-kernel/session-tracker-schema
 */

import { z } from "zod"

/**
 * Valid actions for the session-tracker tool.
 */
export const SessionTrackerActionSchema = z.enum([
  "export-session",
  "list-sessions",
  "search-sessions",
])

/**
 * Input schema for the session-tracker tool.
 *
 * @example
 * ```typescript
 * // Export a session
 * SessionTrackerInputSchema.parse({
 *   action: "export-session",
 *   sessionId: "ses_abc123",
 * })
 *
 * // List all sessions
 * SessionTrackerInputSchema.parse({
 *   action: "list-sessions",
 *   limit: 20,
 * })
 *
 * // Search sessions
 * SessionTrackerInputSchema.parse({
 *   action: "search-sessions",
 *   query: "investigator",
 * })
 * ```
 */
export const SessionTrackerInputSchema = z.object({
  /** The action to perform. */
  action: SessionTrackerActionSchema,
  /** Session ID (required for export-session). */
  sessionId: z.string().optional(),
  /** Search query string (required for search-sessions). */
  query: z.string().optional(),
  /** Maximum number of results (default: 20, max: 100). */
  limit: z.number().min(1).max(100).default(20).optional(),
})

/** Inferred type for session-tracker tool input. */
export type SessionTrackerInput = z.infer<typeof SessionTrackerInputSchema>
