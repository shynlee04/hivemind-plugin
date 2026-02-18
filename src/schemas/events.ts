/**
 * Event Schemas - Zod validation for idumb-v2 in-process event engine
 *
 * IN-PROCESS CONSTRAINTS:
 * - NO HTTP/WebSocket (runs inside OpenCode plugin lifecycle)
 * - Native EventEmitter for pub/sub
 * - Target: <10MB RAM, sub-1ms latency
 *
 * @module schemas/events
 */

import { z } from "zod";

// ─── Event Schemas ─────────────────────────────────────────────────────

export const ArtifactEventTypeSchema = z.enum([
  "file:created",
  "file:modified",
  "file:deleted",
  "artifact:spawned",
  "plugin:activated",
  "plugin:deactivating",
]);

export const ArtifactEventSchema = z.object({
  /** Event type */
  type: ArtifactEventTypeSchema,
  /** ISO timestamp */
  timestamp: z.string().datetime(),
  /** Event payload - varies by type */
  payload: z.record(z.string(), z.unknown()),
  /** Source identifier (e.g., "fs-watcher", "manual") */
  source: z.string(),
});

// ─── Type Exports ───────────────────────────────────────────────────────

export type ArtifactEventType = z.infer<typeof ArtifactEventTypeSchema>;
export type ArtifactEvent = z.infer<typeof ArtifactEventSchema>;
