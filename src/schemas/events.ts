/**
 * Event Schemas - Zod validation for in-process event engine
 *
 * IN-PROCESS CONSTRAINTS:
 * - NO HTTP/WebSocket (runs inside OpenCode plugin lifecycle)
 * - Native EventEmitter for pub/sub
 * - Target: <10MB RAM, sub-1ms latency
 *
 * @module schemas/events
 */

import { z } from "zod"

// ─── Event Schemas ─────────────────────────────────────────────────────

export const ArtifactEventTypeSchema = z.enum([
  "file:created",
  "file:modified",
  "file:deleted",
  "artifact:spawned",
  "plugin:activated",
  "plugin:deactivating",
  "codemap:updated",
  "codemap:compressed",
  "codemap:stale",
  "context:consolidated",
  "context:purged",
  "memory:classified",
  "pending_change:queued",
  "pending_change:verified",
])

export const ArtifactEventSchema = z.object({
  type: ArtifactEventTypeSchema,
  timestamp: z.string().datetime(),
  payload: z.record(z.string(), z.unknown()),
  source: z.string(),
})

export const CodemapUpdatedEventSchema = z.object({
  type: z.literal("codemap:updated"),
  timestamp: z.string().datetime(),
  payload: z.object({
    filesScanned: z.number(),
    totalTokens: z.number(),
    duration: z.number(),
    gitCommit: z.string().optional(),
  }),
  source: z.string().default("code-intel"),
})

export const CodemapCompressedEventSchema = z.object({
  type: z.literal("codemap:compressed"),
  timestamp: z.string().datetime(),
  payload: z.object({
    originalTokens: z.number(),
    compressedTokens: z.number(),
    reductionPercent: z.number(),
    filesProcessed: z.number(),
  }),
  source: z.string().default("code-intel"),
})

export const CodemapStaleEventSchema = z.object({
  type: z.literal("codemap:stale"),
  timestamp: z.string().datetime(),
  payload: z.object({
    reason: z.enum(["git_commit", "file_change", "ttl_expired", "manual"]),
    affectedFiles: z.array(z.string()).optional(),
    staleSince: z.string().datetime(),
  }),
  source: z.string().default("code-intel"),
})

export const ContextConsolidatedEventSchema = z.object({
  type: z.literal("context:consolidated"),
  timestamp: z.string().datetime(),
  payload: z.object({
    consolidatedCount: z.number().int().nonnegative(),
    dedupedCount: z.number().int().nonnegative(),
    sessionId: z.string().optional(),
  }),
  source: z.string().default("context-purifier"),
})

export const ContextPurgedEventSchema = z.object({
  type: z.literal("context:purged"),
  timestamp: z.string().datetime(),
  payload: z.object({
    purgedTemporaryCount: z.number().int().nonnegative(),
    sessionId: z.string().optional(),
  }),
  source: z.string().default("context-purifier"),
})

export const MemoryClassifiedEventSchema = z.object({
  type: z.literal("memory:classified"),
  timestamp: z.string().datetime(),
  payload: z.object({
    category: z.string(),
    confidence: z.number().min(0).max(1),
    sessionId: z.string().optional(),
  }),
  source: z.string().default("session-memory-classifier"),
})

export const PendingChangeQueuedEventSchema = z.object({
  type: z.literal("pending_change:queued"),
  timestamp: z.string().datetime(),
  payload: z.object({
    pendingChangeId: z.string().uuid(),
    entityType: z.string(),
    entityId: z.string(),
    gitDiffSignature: z.string(),
  }),
  source: z.string().default("sot-governance"),
})

export const PendingChangeVerifiedEventSchema = z.object({
  type: z.literal("pending_change:verified"),
  timestamp: z.string().datetime(),
  payload: z.object({
    pendingChangeId: z.string().uuid(),
    status: z.enum(["verified", "rejected"]),
    commitHash: z.string(),
    watcherEventId: z.string(),
    gitDiffSignature: z.string(),
  }),
  source: z.string().default("sot-governance"),
})

export const HiveMindEventSchema = z.union([
  ArtifactEventSchema,
  CodemapUpdatedEventSchema,
  CodemapCompressedEventSchema,
  CodemapStaleEventSchema,
  ContextConsolidatedEventSchema,
  ContextPurgedEventSchema,
  MemoryClassifiedEventSchema,
  PendingChangeQueuedEventSchema,
  PendingChangeVerifiedEventSchema,
])

// ─── Type Exports ───────────────────────────────────────────────────────

export type ArtifactEventType = z.infer<typeof ArtifactEventTypeSchema>
export type ArtifactEvent = z.infer<typeof ArtifactEventSchema>
export type CodemapUpdatedEvent = z.infer<typeof CodemapUpdatedEventSchema>
export type CodemapCompressedEvent = z.infer<typeof CodemapCompressedEventSchema>
export type CodemapStaleEvent = z.infer<typeof CodemapStaleEventSchema>
export type ContextConsolidatedEvent = z.infer<typeof ContextConsolidatedEventSchema>
export type ContextPurgedEvent = z.infer<typeof ContextPurgedEventSchema>
export type MemoryClassifiedEvent = z.infer<typeof MemoryClassifiedEventSchema>
export type PendingChangeQueuedEvent = z.infer<typeof PendingChangeQueuedEventSchema>
export type PendingChangeVerifiedEvent = z.infer<typeof PendingChangeVerifiedEventSchema>
export type HiveMindEvent = z.infer<typeof HiveMindEventSchema>
