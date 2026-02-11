/**
 * Git Atomic Commit Advisor — pure function.
 * Suggests commit points based on session state.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface CommitSuggestion {
  reason: string;
  files: number;
}

export function shouldSuggestCommit(
  state: BrainState,
  threshold: number
): CommitSuggestion | null {
  const fileCount = state.metrics.files_touched.length;

  if (fileCount < threshold) return null;

  const turnsSinceLastSuggestion = state.metrics.turn_count - state.last_commit_suggestion_turn;
  if (state.last_commit_suggestion_turn > 0 && turnsSinceLastSuggestion < 3) return null;

  return {
    reason: `${fileCount} files touched — consider committing your work.`,
    files: fileCount,
  };
}
