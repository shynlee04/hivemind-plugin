/**
 * Dependencies for the tool-after-workflow transform (AC-20).
 *
 * Injected at composition time from plugin.ts:
 *  - logWarn: optional logging callback
 */
export interface ToolAfterWorkflowDeps {
  logWarn?: (message: string, error: unknown) => void
}

/**
 * Input shape for the tool.execute.after hook used by workflow persistence.
 */
export interface ToolAfterWorkflowInput {
  tool: string
  sessionID?: string
  callID?: string
  args?: Record<string, unknown>
}

/**
 * Extracted workflow-config persistence logic from tool.execute.after (AC-20).
 *
 * Handles workflow turn advancement and persistence after configure-primitive
 * tool calls. Best-effort — errors are caught silently, never fail the tool call.
 *
 * Mirror of the original inline block from plugin.ts (lines 301-317).
 *
 * @param deps - Typed dependencies injected from plugin.ts at composition time.
 * @returns An async function that receives (input, _output) for workflow persistence.
 */
export function createToolAfterWorkflow(
  _deps: ToolAfterWorkflowDeps,
): (input: ToolAfterWorkflowInput, _output?: unknown) => Promise<void> {
  return async (input, _output) => {
    if (input.tool !== "configure-primitive") return
    const args = input.args
    if (!args || typeof args.workflowId !== "string" || typeof args.workflowTurn !== "number") return

    try {
      const { readWorkflow, persistWorkflow, advanceTurn, completeCurrentTurn } =
        await import("../../config/workflow/index.js")
      const workflow = readWorkflow(args.workflowId)
      if (!workflow) return

      const advanced = advanceTurn(workflow, args.workflowTurn as number)
      const output = typeof _output === "string" ? _output.substring(0, 500) : "completed"
      const completed = completeCurrentTurn(advanced, { toolOutput: output })
      persistWorkflow(completed)
    } catch {
      // Best-effort persistence — never fail the tool call
    }
  }
}
