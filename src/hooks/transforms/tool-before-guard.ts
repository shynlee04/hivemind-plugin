import type { SessionTracker } from "../../features/session-tracker/index.js"

/**
 * Dependencies for the tool-before-guard transform (AC-18).
 *
 * Injected at composition time from plugin.ts:
 *  - toolGuardHook: the tool.execute.before guard (toolGuardHooks["tool.execute.before"])
 *  - sessionTracker: SessionTracker instance for proactive child discovery
 *  - logWarn: optional logging callback
 */
export interface ToolBeforeGuardDeps {
  toolGuardHook: (input: unknown, output: unknown) => Promise<void>
  sessionTracker: Pick<SessionTracker, "handleToolExecuteBefore">
  logWarn?: (message: string, error: unknown) => void
}

/**
 * Extracted hook handler for tool.execute.before (AC-18).
 *
 * Runs the tool guard FIRST (circuit breaker, budget, governance), then
 * detects task tool dispatch for proactive child session discovery.
 * Best-effort: session-tracker errors are caught and logged — never block
 * tool execution or throw to the OpenCode runtime.
 *
 * Mirror of the original inline handler from plugin.ts (lines 194-235).
 *
 * @param deps - Typed dependencies injected from plugin.ts at composition time.
 * @returns An async function that receives (input, output) for tool.execute.before.
 */
export function createToolBeforeGuard(
  deps: ToolBeforeGuardDeps,
): (input: unknown, output: unknown) => Promise<void> {
  return async (input, output) => {
    // Run existing tool guard logic first (circuit breaker, budget, governance)
    await deps.toolGuardHook(input, output)

    // Session tracker: detect task dispatch for proactive child discovery
    try {
      const toolName = (input as Record<string, unknown>)?.tool
      if (toolName === "task" || toolName === "delegate-task") {
        const inputRecord = input as Record<string, unknown>
        const sessionID = (inputRecord.sessionID as string) || ""
        const callID = (inputRecord.callID as string) || ""
        const agent = (inputRecord.agent as string) || ""

        // Extract args from output (PreToolUse output contains the tool's arguments)
        const outputRecord = output as Record<string, unknown> | undefined
        const args = (outputRecord?.args ?? {}) as Record<string, unknown>

        const subagentType = (args.subagent_type as string) || (args.agent as string) || agent
        const description = (args.description as string) || (args.prompt as string) || ""
        const taskId = (args.task_id as string) || undefined

        if (sessionID && callID) {
          await deps.sessionTracker.handleToolExecuteBefore({
            sessionID,
            callID,
            subagentType,
            description,
            taskId,
          })
        }
      }
    } catch (err) {
      deps.logWarn?.("[Harness] Session tracker: tool.execute.before hook failed", err)
    }
  }
}
