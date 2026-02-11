/**
 * Long Session Detection — pure function.
 * Detects when sessions exceed auto-compact threshold.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface LongSessionInfo {
  isLong: boolean;
  turnCount: number;
  threshold: number;
  suggestion: string;
}

/**
 * Checks if the current session exceeds the auto-compact threshold.
 */
export function detectLongSession(
  state: BrainState,
  autoCompactThreshold: number
): LongSessionInfo {
  const isLong = state.metrics.turn_count >= autoCompactThreshold;
  return {
    isLong,
    turnCount: state.metrics.turn_count,
    threshold: autoCompactThreshold,
    suggestion: isLong
      ? `Session has ${state.metrics.turn_count} turns (threshold: ${autoCompactThreshold}). Consider using compact_session to archive and reset.`
      : "",
  };
}
