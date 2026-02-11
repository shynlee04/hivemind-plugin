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

/** @internal — only checkComplexity() is consumed externally */
interface ComplexityThreshold {
  maxFiles: number;
  maxTurns: number;
}

/** @internal */
interface ComplexityCheckResult {
  isComplex: boolean;
  filesCount: number;
  turnsCount: number;
  threshold: ComplexityThreshold;
  message: string;
}

/** Default complexity threshold */
/** @internal */
const DEFAULT_COMPLEXITY_THRESHOLD: ComplexityThreshold = {
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
// Dead functions removed: shouldShowComplexityNudge, formatComplexity, getComplexityPercentage
// Preserved in git history — re-add when needed.
