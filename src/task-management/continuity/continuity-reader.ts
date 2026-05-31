/**
 * Session-tracker enrichment helpers for continuity records.
 *
 * P41-C: All 5 readers now prefer session-tracker data over old files.
 * These helpers merge gap fields (lifecycle, pendingNotifications,
 * compactionCheckpoint) from child session-tracker records into the
 * in-memory SessionContinuityRecord before use.
 *
 * Key constraints:
 * - Does NOT import continuity/index.ts (prevents circular dependency)
 * - Does NOT import features/session-tracker/persistence/
 * - Does NOT mutate originals (returns new objects)
 * - Never throws (internal try-catch returns original record)
 * - Not exported from continuity/index.ts — imported directly by consumers
 *
 * @module task-management/continuity/continuity-reader
 */

import type { ChildSessionRecord } from "../../features/session-tracker/types.js"
import type { SessionContinuityRecord } from "../../shared/types.js"
import { resolveSessionFile } from "../../tools/session/session-resolver.js"

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enhances a single continuity record with session-tracker data.
 *
 * Tries to resolve the session via session-tracker. If the resolved record is
 * a child (delegated session) and carries any of the 3 enrichment fields
 * (lifecycle, pendingNotifications, compactionCheckpoint), they are merged
 * into the returned record. Otherwise returns the original.
 *
 * @param record - The continuity record to enrich.
 * @param projectRoot - Optional project root. When undefined, returns the
 *                      original record unchanged (no enrichment).
 * @returns A new enriched record, or the original if no enrichment occurred.
 */
export async function enrichContinuityWithTracker(
  record: SessionContinuityRecord,
  projectRoot?: string,
): Promise<SessionContinuityRecord> {
  // Fast-path: no project root → no enrichment possible
  if (!projectRoot || !record.sessionID) {
    return record
  }

  try {
    const resolved = await resolveSessionFile(projectRoot, record.sessionID)

    // Not a child session or not found → return original
    if (!resolved || resolved.type !== "child" || !resolved.childRecord) {
      return record
    }

    const cr = resolved.childRecord

    // Check if the child record carries any enrichment fields
    const hasLifecycle = cr.lifecycle !== undefined
    const hasPendingNotifications = cr.pendingNotifications !== undefined
    const hasCompactionCheckpoint = cr.compactionCheckpoint !== undefined

    if (!hasLifecycle && !hasPendingNotifications && !hasCompactionCheckpoint) {
      return record
    }

    // Build enriched record — never mutates the original
    return {
      ...record,
      metadata: {
        ...record.metadata,
        lifecycle: (hasLifecycle ? cr.lifecycle : record.metadata.lifecycle) as
          | SessionContinuityRecord["metadata"]["lifecycle"]
          | undefined,
        pendingNotifications: hasPendingNotifications
          ? (cr.pendingNotifications as SessionContinuityRecord["metadata"]["pendingNotifications"])
          : record.metadata.pendingNotifications,
        compactionCheckpoint: hasCompactionCheckpoint
          ? (cr.compactionCheckpoint as SessionContinuityRecord["metadata"]["compactionCheckpoint"])
          : record.metadata.compactionCheckpoint,
      },
    }
  } catch {
    // Never throw — returns original on any error (T-P41C-01)
    return record
  }
}

/**
 * Enhances a list of continuity records with session-tracker data.
 *
 * Runs all enrichments in parallel via Promise.all for efficiency.
 *
 * @param records - Array of continuity records to enrich.
 * @param projectRoot - Optional project root. When undefined, returns the
 *                      original list unchanged.
 * @returns Array of enriched records (or originals if no enrichment needed).
 */
export async function enrichContinuityListWithTracker(
  records: SessionContinuityRecord[],
  projectRoot?: string,
): Promise<SessionContinuityRecord[]> {
  if (!projectRoot || records.length === 0) {
    return records
  }

  return Promise.all(
    records.map((record) => enrichContinuityWithTracker(record, projectRoot)),
  )
}
