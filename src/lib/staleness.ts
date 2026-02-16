/**
 * Staleness detection — pure function.
 * Checks if a session has been idle beyond the configured threshold.
 * US-012: TTS (Time-To-Stale) Filter for MemNode filtering.
 */
import type { BrainState } from "../schemas/brain-state.js";
import type { MemNode, TrajectoryNode } from "../schemas/graph-nodes.js";

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const DEFAULT_TTL_HOURS = 72;

export function isSessionStale(state: BrainState, maxDays: number, now: number = Date.now()): boolean {
  if (maxDays <= 0) return false;
  const elapsed = now - state.session.last_activity;
  return elapsed > maxDays * MS_PER_DAY;
}

export function getStalenessInfo(state: BrainState, maxDays: number, now: number = Date.now()): {
  isStale: boolean;
  idleDays: number;
  threshold: number;
} {
  const elapsed = now - state.session.last_activity;
  const idleDays = Math.floor(elapsed / MS_PER_DAY);
  return {
    isStale: isSessionStale(state, maxDays, now),
    idleDays,
    threshold: maxDays,
  };
}

// ============================================================================
// US-012: TTS (Time-To-Stale) Filter
// ============================================================================

/**
 * Configuration for TTS filter operations.
 */
export interface TTSConfig {
  /** Default TTL in hours before a mem is considered stale. Default: 72 */
  defaultTTLHours?: number;
  /** ISO timestamp for testing. If not provided, uses current time. */
  now?: string;
}

/**
 * Determines if a MemNode is stale based on staleness_stamp and active task linkage.
 *
 * @param mem - The MemNode to check
 * @param activeTaskIds - Array of currently active task UUIDs
 * @param config - Optional TTS configuration
 * @returns true if the mem is stale, false otherwise
 *
 * Logic:
 * 1. If mem.origin_task_id is in activeTaskIds, return false (never stale if linked to active task)
 * 2. Parse mem.staleness_stamp as ISO date
 * 3. Compare to config.now or current time
 * 4. Return true if current time > staleness_stamp
 */
export function isMemStale(
  mem: MemNode,
  activeTaskIds: string[],
  config?: TTSConfig
): boolean {
  // Never stale if linked to an active task
  if (mem.origin_task_id !== null && activeTaskIds.includes(mem.origin_task_id)) {
    return false;
  }

  // Parse staleness_stamp and compare to current/reference time
  const stalenessTime = new Date(mem.staleness_stamp).getTime();
  const referenceTime = config?.now
    ? new Date(config.now).getTime()
    : Date.now();

  // If staleness_stamp is invalid, use default TTL from updated_at
  if (isNaN(stalenessTime)) {
    const updatedTime = new Date(mem.updated_at).getTime();
    const ttlMs = (config?.defaultTTLHours ?? DEFAULT_TTL_HOURS) * MS_PER_HOUR;
    return referenceTime > updatedTime + ttlMs;
  }

  return referenceTime > stalenessTime;
}

/**
 * Calculates a relevance score for a MemNode based on task linkage and recency.
 *
 * @param mem - The MemNode to score
 * @param trajectory - The current trajectory containing active_task_ids
 * @returns A score between 0.0 and 1.0
 *
 * Scoring logic:
 * - Base score: 0.5
 * - +0.3 if linked to active task (origin_task_id matches trajectory.active_task_ids)
 * - +0.2 if recently updated (within 24 hours)
 * - -0.3 if type is "false_path" (defensive, shouldn't happen after filtering)
 * - Final score clamped to 0.0-1.0
 */
export function calculateRelevanceScore(
  mem: MemNode,
  trajectory: TrajectoryNode
): number {
  const now = Date.now();
  const twentyFourHoursAgo = now - 24 * MS_PER_HOUR;

  let score = 0.5;

  // +0.3 if linked to active task
  if (mem.origin_task_id !== null && trajectory.active_task_ids.includes(mem.origin_task_id)) {
    score += 0.3;
  }

  // +0.2 if recently updated (within 24 hours)
  const updatedTime = new Date(mem.updated_at).getTime();
  if (updatedTime >= twentyFourHoursAgo) {
    score += 0.2;
  }

  // -0.3 if false_path (defensive)
  if (mem.type === "false_path") {
    score -= 0.3;
  }

  // Clamp to 0.0-1.0
  return Math.max(0.0, Math.min(1.0, score));
}
