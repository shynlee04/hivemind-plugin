/**
 * Zod schemas for the session-tracker, session-hierarchy, and session-context tools.
 *
 * Defines input contracts for agent-initiated session knowledge queries.
 * All operations are read-only (CQRS read-side). Every sessionId field is
 * validated with a Zod `.refine()` that rejects path separators and
 * traversal sequences before the handler ever sees the value (GAP-05).
 *
 * @module schema-kernel/session-tracker-schema
 */

import { z } from "zod"

/**
 * Reusable session ID refinement that rejects path separators and traversal
 * sequences at the Zod boundary. This is the first line of defense before
 * `safeSessionPath()` applies a second guard in each handler (defense in depth).
 */
export const safeSessionId = z
  .string()
  .min(1)
  .refine(
    (id) => !id.includes("/") && !id.includes("..") && !id.includes("\\"),
    { message: "sessionId must not contain path separators or traversal sequences" },
  )

// ---------------------------------------------------------------------------
// Session-tracker tool schemas
// ---------------------------------------------------------------------------

/**
 * Input schema for the session-tracker tool.
 *
 * Six actions: export-session, get-status, get-summary, list-sessions, search-sessions,
 * filter-sessions.
 * Backward-compatible with existing action names.
 */
export const SessionTrackerInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("export-session"),
    sessionId: safeSessionId,
    format: z.enum(["markdown", "json"]).optional().default("markdown"),
  }),
  z.object({
    action: z.literal("get-status"),
    sessionId: safeSessionId,
  }),
  z.object({
    action: z.literal("get-summary"),
    sessionId: safeSessionId,
  }),
  z.object({
    action: z.literal("list-sessions"),
    limit: z.number().min(1).max(100).optional().default(20),
  }),
  z.object({
    action: z.literal("search-sessions"),
    query: z.string().min(1),
    limit: z.number().min(1).max(100).optional().default(20),
  }),
  z.object({
    action: z.literal("filter-sessions"),
    status: z.string().optional(),
    agentType: z.string().optional(),
    minDepth: z.number().min(0).optional(),
    maxDepth: z.number().min(0).optional(),
    timeAfter: z.string().optional(),
    timeBefore: z.string().optional(),
    limit: z.number().min(1).max(100).optional().default(20),
  }),
])

/** Inferred type for session-tracker tool input. */
export type SessionTrackerInput = z.infer<typeof SessionTrackerInputSchema>

// ---------------------------------------------------------------------------
// Session-hierarchy tool schemas
// ---------------------------------------------------------------------------

/**
 * Input schema for the session-hierarchy tool.
 *
 * Four actions: get-children, get-parent-chain, get-delegation-depth, get-manifest.
 */
export const SessionHierarchyInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("get-children"),
    sessionId: safeSessionId,
    includeStatus: z.boolean().optional().default(true),
  }),
  z.object({
    action: z.literal("get-parent-chain"),
    sessionId: safeSessionId,
  }),
  z.object({
    action: z.literal("get-delegation-depth"),
    sessionId: safeSessionId,
  }),
  z.object({
    action: z.literal("get-manifest"),
    sessionId: safeSessionId,
  }),
])

/** Inferred type for session-hierarchy tool input. */
export type SessionHierarchyInput = z.infer<typeof SessionHierarchyInputSchema>

// ---------------------------------------------------------------------------
// Session-context tool schemas
// ---------------------------------------------------------------------------

/**
 * Input schema for the session-context tool.
 *
 * Four actions: find-related, cross-reference, synthesize-context, aggregate.
 */
export const SessionContextInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("find-related"),
    sessionId: safeSessionId,
    maxRelated: z.number().min(1).max(50).optional().default(10),
  }),
  z.object({
    action: z.literal("cross-reference"),
    sessionId: safeSessionId,
    query: z.string().min(1).optional(),
  }),
  z.object({
    action: z.literal("synthesize-context"),
    sessionId: safeSessionId,
  }),
  z.object({
    action: z.literal("aggregate"),
    groupBy: z.enum(["subagentType", "status"]),
  }),
])

/** Inferred type for session-context tool input. */
export type SessionContextInput = z.infer<typeof SessionContextInputSchema>
