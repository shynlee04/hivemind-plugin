/**
 * Record normalizer for the continuity store.
 *
 * Extracted from `continuity/index.ts` to satisfy the ≤500 LOC gate (GA-4).
 * Converts a raw parsed JSON value into a typed `SessionContinuityRecord`,
 * applying safe defaults and dropping invalid fields.
 *
 * @module task-management/continuity/continuity-normalize
 */

import type {
  CapturedResult,
  CompactionCheckpointData,
  DelegationMeta,
  DelegationPacket,
  PendingNotification,
  SessionContinuityMetadata,
  SessionContinuityRecord,
  SessionLifecycleState,
} from "../../shared/types.js"

/**
 * Normalizes a raw parsed JSON entry into a typed SessionContinuityRecord.
 *
 * Returns null when the value is not a non-null object. The normalizer
 * applies safe defaults for missing fields and uses type predicates to
 * avoid throwing on malformed input — the caller decides whether to
 * discard the record.
 *
 * @param sessionID - The session ID for the record (from map key).
 * @param value - The raw parsed JSON value.
 * @returns Normalized record, or null if input is not a valid object.
 */
export function normalizeContinuityRecord(
  sessionID: string,
  value: unknown,
): SessionContinuityRecord | null {
  if (typeof value !== "object" || value === null) {
    return null
  }

  const rec = value as Record<string, unknown>
  const meta =
    typeof rec.metadata === "object" && rec.metadata !== null
      ? (rec.metadata as Record<string, unknown>)
      : {}
  const promptParams =
    typeof rec.promptParams === "object" && rec.promptParams !== null
      ? (rec.promptParams as SessionContinuityRecord["promptParams"])
      : {}

  return {
    sessionID,
    promptParams,
    toolProfile:
      typeof rec.toolProfile === "object" && rec.toolProfile !== null
        ? (rec.toolProfile as SessionContinuityRecord["toolProfile"])
        : undefined,
    metadata: {
      status: (meta.status as SessionContinuityMetadata["status"]) ?? "pending",
      description: typeof meta.description === "string" ? meta.description : "",
      delegation: (meta.delegation as DelegationMeta | null) ?? null,
      category: typeof meta.category === "string" ? meta.category : undefined,
      constraints: Array.isArray(meta.constraints) ? [...(meta.constraints as string[])] : [],
      lifecycle: (meta.lifecycle as SessionLifecycleState | undefined) ?? undefined,
      pendingNotifications: Array.isArray(meta.pendingNotifications)
        ? [...(meta.pendingNotifications as PendingNotification[])]
        : [],
      resultCapture: (meta.resultCapture as CapturedResult | undefined) ?? undefined,
      compactionCheckpoint:
        (meta.compactionCheckpoint as CompactionCheckpointData | undefined) ?? undefined,
      delegationPacket: (meta.delegationPacket as DelegationPacket | undefined) ?? undefined,
      route: typeof meta.route === "string" ? meta.route : undefined,
      lastToolActivityAt:
        typeof meta.lastToolActivityAt === "number" ? meta.lastToolActivityAt : undefined,
      updatedAt:
        typeof meta.updatedAt === "number" && Number.isFinite(meta.updatedAt)
          ? meta.updatedAt
          : Date.now(),
    },
  }
}
