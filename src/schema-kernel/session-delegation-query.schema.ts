/**
 * Zod schemas for the session-delegation-query tool.
 *
 * Two actions: list (paginated delegation summary) and get (single delegation drill-down).
 * All sessionId fields are validated with safeSessionId to reject path traversal.
 * Read-only (CQRS read-side).
 *
 * @module schema-kernel/session-delegation-query
 */

import { z } from "zod"
import { safeSessionId } from "./session-tracker.schema.js"

/**
 * Input schema for the session-delegation-query tool.
 *
 * Two actions:
 * - `list`: Paginated delegation summaries with filtering options.
 * - `get`: Full drill-down detail for a single delegation by sessionID.
 */
export const SessionDelegationQueryInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("list"),
    /** Optional: scope to a single root main session. */
    rootSessionId: safeSessionId.optional(),
    /** Filter by session status (e.g. "active", "completed", "error"). */
    status: z.string().optional(),
    /** Filter by subagent type (e.g. "hm-l2-researcher"). */
    agentType: z.string().optional(),
    /** Filter by delegating agent name (e.g. "Hm-L0-Orchestrator"). */
    delegatedBy: z.string().optional(),
    /** Minimum delegation depth (inclusive). */
    minDepth: z.number().int().min(0).optional(),
    /** Maximum delegation depth (inclusive). */
    maxDepth: z.number().int().min(0).optional(),
    /** Only delegations updated on or after this ISO 8601 timestamp. */
    updatedAfter: z.string().optional(),
    /** Only delegations updated on or before this ISO 8601 timestamp. */
    updatedBefore: z.string().optional(),
    /** Pagination offset (0-indexed). */
    offset: z.number().int().min(0).optional().default(0),
    /** Maximum entries per page (1-100). */
    limit: z.number().int().min(1).max(100).optional().default(20),
  }),
  z.object({
    action: z.literal("get"),
    /** Session ID to retrieve full delegation detail for. */
    sessionId: safeSessionId,
  }),
])

/** Inferred type for session-delegation-query tool input. */
export type SessionDelegationQueryInput = z.infer<typeof SessionDelegationQueryInputSchema>
