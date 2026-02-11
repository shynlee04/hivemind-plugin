/**
 * Tool Activation Advisor — pure function.
 * Suggests which HiveMind tools are most relevant for the current state.
 */
import type { BrainState } from "../schemas/brain-state.js";

export interface ToolHint {
  tool: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export function getToolActivation(state: BrainState): ToolHint | null {
  if (state.session.governance_status === "LOCKED") {
    return {
      tool: "declare_intent",
      reason: "Session is LOCKED. Declare your intent to start working.",
      priority: "high",
    };
  }

  if (state.metrics.drift_score < 50 && state.metrics.turn_count >= 5) {
    return {
      tool: "map_context",
      reason: "Drift detected. Update your focus to stay on track.",
      priority: "high",
    };
  }

  if (state.metrics.turn_count >= 15) {
    return {
      tool: "compact_session",
      reason: "Long session detected. Consider archiving and resetting.",
      priority: "medium",
    };
  }

  if (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action) {
    return {
      tool: "map_context",
      reason: "No hierarchy set. Define your trajectory for better tracking.",
      priority: "medium",
    };
  }

  return null;
}
