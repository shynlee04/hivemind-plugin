/**
 * Staleness detection — pure function.
 * Checks if a session has been idle beyond the configured threshold.
 */
import type { BrainState } from "../schemas/brain-state.js";

const MS_PER_DAY = 86_400_000;

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
