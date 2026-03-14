/**
 * Hierarchy Chain Analysis — pure functions.
 * Detects structural breaks in the trajectory→tactic→action chain.
 *
 * Two modes:
 *   1. Flat analysis (from brain.json flat hierarchy) — backward compat
 *   2. Tree analysis (from hierarchy.json tree) — timestamp gap detection
 */
import type { BrainState } from "../schemas/brain-state.js";
import type { TimestampGap } from "./hierarchy-tree.js";

export interface ChainBreak {
  level: "trajectory" | "tactic" | "action";
  issue: "orphaned" | "missing_parent" | "empty_chain" | "stale_gap";
  message: string;
}

/**
 * Detect chain breaks from flat brain.json hierarchy (backward compat).
 *
 * @consumer soft-governance.ts, session-lifecycle.ts, think-back.ts
 */
export function detectChainBreaks(state: BrainState): ChainBreak[] {
  const breaks: ChainBreak[] = [];
  const { trajectory, tactic, action } = state.hierarchy;

  // Rule 1: Action without tactic
  if (action && !tactic) {
    breaks.push({
      level: "action",
      issue: "missing_parent",
      message: `Action "${truncate(action)}" has no parent tactic. Use map_context to set a tactic.`,
    });
  }

  // Rule 2: Tactic without trajectory
  if (tactic && !trajectory) {
    breaks.push({
      level: "tactic",
      issue: "missing_parent",
      message: `Tactic "${truncate(tactic)}" has no parent trajectory. Use declare_intent to set focus.`,
    });
  }

  // Rule 3: Empty chain with open session
  if (!trajectory && !tactic && !action && state.session.governance_status === "OPEN") {
    breaks.push({
      level: "trajectory",
      issue: "empty_chain",
      message: "Session is OPEN but no hierarchy is set. Use map_context to set your focus.",
    });
  }

  return breaks;
}

/**
 * Detect chain breaks from hierarchy tree using timestamp gaps.
 * Returns breaks where sibling or parent-child gaps exceed thresholds.
 *
 * @consumer session-lifecycle.ts (system.transform), think-back.ts
 */
export function detectTreeChainBreaks(
  gaps: TimestampGap[],
  staleThresholdMs: number = 2 * 60 * 60 * 1000 // 2 hours default
): ChainBreak[] {
  const breaks: ChainBreak[] = [];

  for (const gap of gaps) {
    if (gap.gapMs >= staleThresholdMs) {
      const hours = Math.round(gap.gapMs / (60 * 60 * 1000) * 10) / 10;
      breaks.push({
        level: "action", // Tree gaps don't map to a single level
        issue: "stale_gap",
        message: `${hours}hr gap between ${gap.from} → ${gap.to} (${gap.relationship}). Context may be lost.`,
      });
    }
  }

  return breaks;
}

function truncate(s: string, max: number = 40): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
