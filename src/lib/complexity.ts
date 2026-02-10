/**
 * Complexity Detection Module
 *
 * Detects when sessions get complex based on:
 *   - Files touched count (unique file paths)
 *   - Turn count (total tool calls since last declare_intent)
 *
 * Configurable thresholds (default: 3 files OR 5 turns)
 */

import type { BrainState } from "../schemas/brain-state.js";

export interface ComplexityThreshold {
  maxFiles: number;
  maxTurns: number;
}

export interface ComplexityCheckResult {
  isComplex: boolean;
  filesCount: number;
  turnsCount: number;
  threshold: ComplexityThreshold;
  message: string;
}

/** Default complexity threshold */
export const DEFAULT_COMPLEXITY_THRESHOLD: ComplexityThreshold = {
  maxFiles: 3,
  maxTurns: 5,
};

/**
 * Check if current session complexity exceeds thresholds
 */
export function checkComplexity(
  state: BrainState,
  threshold: ComplexityThreshold = DEFAULT_COMPLEXITY_THRESHOLD
): ComplexityCheckResult {
  const filesCount = state.metrics.files_touched.length;
  const turnsCount = state.metrics.turn_count;
  
  const filesExceeded = filesCount >= threshold.maxFiles;
  const turnsExceeded = turnsCount >= threshold.maxTurns;
  const isComplex = filesExceeded || turnsExceeded;
  
  let message = "Complexity normal";
  if (isComplex) {
    const reasons: string[] = [];
    if (filesExceeded) reasons.push(`${filesCount} files touched`);
    if (turnsExceeded) reasons.push(`${turnsCount} turns`);
    message = `Complexity rising (${reasons.join(", ")}). Consider declare_intent.`;
  }
  
  return {
    isComplex,
    filesCount,
    turnsCount,
    threshold,
    message,
  };
}

/**
 * Check if nudge should be shown (only once per session)
 */
export function shouldShowComplexityNudge(
  state: BrainState,
  nudgeShown: boolean
): boolean {
  if (nudgeShown) return false;
  
  const check = checkComplexity(state);
  return check.isComplex;
}

/**
 * Format complexity for display
 */
export function formatComplexity(state: BrainState): string {
  const check = checkComplexity(state);
  return `${check.filesCount} files, ${check.turnsCount} turns`;
}

/**
 * Get complexity percentage (0-100)
 * Based on how close to thresholds
 */
export function getComplexityPercentage(
  state: BrainState,
  threshold: ComplexityThreshold = DEFAULT_COMPLEXITY_THRESHOLD
): number {
  const filesRatio = state.metrics.files_touched.length / threshold.maxFiles;
  const turnsRatio = state.metrics.turn_count / threshold.maxTurns;
  const maxRatio = Math.max(filesRatio, turnsRatio);
  return Math.min(100, Math.round(maxRatio * 100));
}
