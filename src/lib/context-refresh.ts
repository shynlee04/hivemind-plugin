/**
 * Context Refresh Trigger Module
 *
 * Triggers context refresh recommendations when negative sentiment
 * signals exceed thresholds.
 *
 * Threshold: 2 negative signals within 5 turns triggers refresh warning
 */

import type { BrainState } from "../schemas/brain-state.js";
import type { SentimentSignal } from "./sentiment.js";

export interface RefreshTriggerResult {
  shouldRefresh: boolean;
  signalCount: number;
  windowSize: number;
  message: string;
}

/** Default threshold configuration */
export const DEFAULT_REFRESH_THRESHOLD = {
  signalCount: 2,
  windowSize: 5, // turns
};

/**
 * Check if context refresh should be triggered
 * Based on signal count within recent turn window
 */
export function checkRefreshTrigger(
  state: BrainState,
  threshold = DEFAULT_REFRESH_THRESHOLD
): RefreshTriggerResult {
  const currentTurn = state.metrics.turn_count;
  const windowStart = Math.max(0, currentTurn - threshold.windowSize);
  
  // Count signals within the window
  const recentSignals = state.sentiment_signals.filter(
    (signal) => signal.turn_number >= windowStart && signal.turn_number <= currentTurn
  );
  
  const shouldRefresh = recentSignals.length >= threshold.signalCount;
  
  return {
    shouldRefresh,
    signalCount: recentSignals.length,
    windowSize: threshold.windowSize,
    message: shouldRefresh
      ? `[ContextRefresh] Drift detected (${recentSignals.length} negative signals in last ${threshold.windowSize} turns). Consider compact_session.`
      : `Context stable (${recentSignals.length} signals in last ${threshold.windowSize} turns)`,
  };
}

/**
 * Get recent signals for display
 */
export function getRecentSignals(
  state: BrainState,
  windowSize: number = 5
): SentimentSignal[] {
  const currentTurn = state.metrics.turn_count;
  const windowStart = Math.max(0, currentTurn - windowSize);
  
  return state.sentiment_signals.filter(
    (signal) => signal.turn_number >= windowStart && signal.turn_number <= currentTurn
  );
}

/**
 * Format signals for logging
 */
export function formatSignalsForLog(signals: SentimentSignal[]): string {
  if (signals.length === 0) return "No recent signals";
  
  return signals
    .map((s) => `[Turn ${s.turn_number}] ${s.type}: "${s.matched_text}"`)
    .join("\n  ");
}

/**
 * Check if drift warning should be added to active.md
 */
export function shouldAddDriftWarning(state: BrainState): boolean {
  const result = checkRefreshTrigger(state);
  return result.shouldRefresh;
}

/**
 * Generate drift warning content for active.md
 */
export function generateDriftWarning(state: BrainState): string {
  const recentSignals = getRecentSignals(state);
  
  return [
    "",
    "## ⚠️ Drift Warning",
    "",
    `**Detected**: ${recentSignals.length} negative signals in recent turns`,
    "",
    "**Recommendation**: Consider using `compact_session` to reset context,",
    "or `map_context` to refocus on current objectives.",
    "",
    "**Recent Signals**:",
    ...recentSignals.map((s) => `- Turn ${s.turn_number}: ${s.type} (${s.matched_text})`),
    "",
  ].join("\n");
}
