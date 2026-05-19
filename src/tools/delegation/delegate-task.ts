import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

export const DelegateTaskV2Schema = z.object({
  agent: z.string().min(1, { error: "agent is required" }),
  prompt: z.string().min(1, { error: "prompt is required" }),
  context: z.string().optional(),
})

interface CoordinatorLike {
  dispatch(params: Record<string, unknown>): Promise<unknown>
}

type ToolContext = {
  sessionID?: string
  directory?: string
  worktree?: string
}

const UNSUPPORTED_NATIVE_TASK_MESSAGE =
  "[Harness] delegate-task runtime child-session dispatch is blocked: @opencode-ai/plugin ToolContext v1.15.4 exposes sessionID/messageID/agent/directory/worktree/abort/metadata/ask, but no task field or custom-tool API for invoking OpenCode's built-in Task tool. Use the verified OpenCode Task tool directly, or wait for the CP-PTY/SDK child-session integration path; mocked nativeTask injection is test-only evidence and is not L1 runtime proof."

function isOpenCodeRuntimeAvailable(): boolean {
  return !!(process.env.OPENCODE_SESSION_ID || process.env.OPENCODE_HARNESS_STATE_DIR)
}

export function createDelegateTaskTool(coordinator: CoordinatorLike): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "[REQUIRES OpenCode RUNTIME] Delegate work to a specialist agent via SDK child-session dispatch. Returns immediately with a delegation ID (always-background WaiterModel). This tool ONLY works inside an OpenCode plugin runtime environment where session context is injected by the framework. In non-OpenCode environments, use the native task/subagent dispatch mechanism instead.",
    args: {
      agent: s.string().describe("Agent name to delegate to (must be valid at runtime)"),
      prompt: s.string().describe("Task prompt to send to the delegated agent"),
      context: s.string().optional().describe("Optional context packet"),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      const parsed = DelegateTaskV2Schema.safeParse(rawArgs)
      if (!parsed.success) return renderToolResult(error(`[Harness] Invalid delegate-task input: ${z.prettifyError(parsed.error)}`))
      const args = parsed.data

      const parentSessionId = context.sessionID ?? process.env.OPENCODE_SESSION_ID
      if (!parentSessionId) {
        const hasOpenCodeEnv = isOpenCodeRuntimeAvailable()
        const message = hasOpenCodeEnv
          ? "[Harness] Missing parent session ID for delegate-task. Context.sessionID and OPENCODE_SESSION_ID are both unavailable. This indicates a framework-level context injection failure."
          : "[Harness] delegate-task requires an OpenCode plugin runtime environment. sessionID context injection and OPENCODE_SESSION_ID are unavailable. In non-OpenCode environments, use the native task/subagent tool for delegation instead."
        return renderToolResult(error(message))
      }

      try {
        const prompt = args.context ? `${args.context}\n\n${args.prompt}` : args.prompt
        const result = await coordinator.dispatch({
          agent: args.agent,
          currentDepth: 0,
          parentSessionId,
          prompt,
          queueKey: `agent:${args.agent}`,
          surface: "agent-delegation",
          workingDirectory: context.directory ?? context.worktree,
        })
        const resultRecord = asRecord(result)
        if (resultRecord.status === "error" || resultRecord.status === "timeout") {
          const resultMessage = typeof resultRecord.error === "string" ? resultRecord.error : `[Harness] delegate-task returned ${String(resultRecord.status)}`
          return renderToolResult(error(resultMessage, resultRecord))
        }
        return renderToolResult(success(
          `[Harness] Delegated task to ${args.agent}`,
          { ...resultRecord, agent: args.agent },
        ))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : { result: value }
}

export { DelegateTaskV2Schema as DelegateTaskInputSchema }
export { UNSUPPORTED_NATIVE_TASK_MESSAGE }
