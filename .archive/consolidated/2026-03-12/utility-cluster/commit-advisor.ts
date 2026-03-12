/**
 * Git Atomic Commit Advisor — pure function.
 * Suggests commit points based on session state.
 */
import type { BrainState } from "../schemas/brain-state.js";

/** Minimum turns between repeated commit suggestions */
const MIN_TURNS_BETWEEN_SUGGESTIONS = 3;

export interface CommitSuggestion {
  reason: string;
  files: number;
}

/**
 * Returns a commit suggestion if conditions are met, or null.
 *
 * Triggers when files touched >= threshold, with a cooldown
 * of MIN_TURNS_BETWEEN_SUGGESTIONS turns since the last suggestion.
 */
export function shouldSuggestCommit(
  state: BrainState,
  threshold: number
): CommitSuggestion | null {
  const fileCount = state.metrics.files_touched.length;

  if (fileCount < threshold) return null;

  if (state.metrics.turn_count < MIN_TURNS_BETWEEN_SUGGESTIONS) return null;

  return {
    reason: `${fileCount} files touched — consider committing your work.`,
    files: fileCount,
  };
}
