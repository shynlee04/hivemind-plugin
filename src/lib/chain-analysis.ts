/**
 * Hierarchy Chain Analysis — pure function.
 * Detects structural breaks in the trajectory→tactic→action chain.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface ChainBreak {
  level: "trajectory" | "tactic" | "action";
  issue: "orphaned" | "missing_parent" | "empty_chain";
  message: string;
}

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

function truncate(s: string, max: number = 40): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
