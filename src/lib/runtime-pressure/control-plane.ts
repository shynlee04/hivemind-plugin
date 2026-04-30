import { getToolAuthority } from "./authority-matrix.js"
import { classifyRuntimePressure } from "./model.js"
import type { PressureDecision, PressureDetectionInput, ToolAuthority } from "./types.js"

/**
 * Detect the control-plane outcome for a pressure classification and optional tool.
 *
 * @param input - Pressure score/tier plus optional registered tool name.
 * @returns Pure control-plane decision; does not mutate runtime policy or session state.
 */
export function detectRuntimePressure(input: PressureDetectionInput = {}): PressureDecision {
  const classification = classifyRuntimePressure(input)
  const tool = getToolAuthority(input.toolName)
  const mutating = isMutatingAuthority(tool)
  const executing = tool?.canExecute ?? false

  if (classification.band === "steady") {
    return { ...classification, tool, outcome: "allow", reason: "steady pressure permits registered runtime actions" }
  }

  if (classification.band === "advisory") {
    return { ...classification, tool, outcome: "advise", reason: "advisory pressure records guidance without gating" }
  }

  if (classification.band === "gated") {
    if (!tool || mutating || executing) {
      return { ...classification, tool, outcome: "require_approval", reason: "gated pressure requires approval for unknown, mutating, or executing actions" }
    }
    return { ...classification, tool, outcome: "advise", reason: "gated pressure permits read-only inspection with advisory evidence" }
  }

  if (!tool || mutating || executing) {
    return { ...classification, tool, outcome: "block", reason: "blocking pressure rejects unknown, mutating, or executing actions" }
  }
  return { ...classification, tool, outcome: "defer", reason: "blocking pressure defers read-only inspection until pressure lowers" }
}

/**
 * Check whether a tool authority row can mutate durable or project state.
 *
 * @param tool - Optional tool authority row.
 * @returns True when the row is stateful or explicitly mutating.
 */
function isMutatingAuthority(tool?: ToolAuthority): boolean {
  return tool?.mutatesState === true || tool?.authority === "write" || tool?.authority === "state"
}
