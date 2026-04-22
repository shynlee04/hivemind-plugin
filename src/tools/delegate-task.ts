import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import type { DelegationManager } from "../lib/delegation-manager.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

const DelegateTaskInputSchema = z.object({
  agent: z.string().min(1, "agent is required").describe("Agent name to delegate to"),
  prompt: z.string().min(1, "prompt is required").describe("The task prompt to send to the delegated agent"),
  title: z.string().min(1).optional().describe("Optional title for the child session"),
  safetyCeilingMs: z.number().min(60000).max(3600000).optional().describe("Safety ceiling in milliseconds (max runtime, 1-60 min)"),
})

type DelegateTaskInput = z.infer<typeof DelegateTaskInputSchema>

/** @internal Runtime context injected by the OpenCode plugin framework. NOT available in non-OpenCode environments. */
type ToolContext = {
  sessionID?: string
  directory?: string
  worktree?: string
}

function isOpenCodeRuntimeAvailable(): boolean {
  return !!(process.env.OPENCODE_SESSION_ID || process.env.OPENCODE_HARNESS_STATE_DIR)
}

export function createDelegateTaskTool(
  delegationManager: DelegationManager,
): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "[REQUIRES OpenCode RUNTIME] Delegate work to a specialist agent via SDK child-session dispatch. Returns immediately with a delegation ID (always-background WaiterModel). This tool ONLY works inside an OpenCode plugin runtime environment where session context is injected by the framework. In non-OpenCode environments, use the native task/subagent dispatch mechanism instead.",
    args: {
      agent: s.string().describe("Agent name to delegate to (must be valid at runtime)"),
      prompt: s.string().describe("Task prompt to send to the delegated agent"),
      title: s.string().optional().describe("Optional title for the child session"),
      safetyCeilingMs: s.number().optional().describe("Safety ceiling in milliseconds (max runtime)"),
    },
    async execute(rawArgs: DelegateTaskInput, context: ToolContext): Promise<string> {
      const args = DelegateTaskInputSchema.parse(rawArgs)

      // R-RUNTIME-01: Honest runtime detection — this tool requires OpenCode plugin context
      const parentSessionId = context.sessionID ?? process.env.OPENCODE_SESSION_ID
      if (!parentSessionId) {
        const hasOpenCodeEnv = isOpenCodeRuntimeAvailable()
        const message = hasOpenCodeEnv
          ? "[Harness] Missing parent session ID for delegate-task. Context.sessionID and OPENCODE_SESSION_ID are both unavailable. This indicates a framework-level context injection failure."
          : "[Harness] delegate-task requires an OpenCode plugin runtime environment. sessionID context injection and OPENCODE_SESSION_ID are unavailable. In non-OpenCode environments, use the native task/subagent tool for delegation instead."
        return renderToolResult(error(message))
      }

      try {
        const result = await delegationManager.dispatch({
          parentSessionId,
          agent: args.agent,
          prompt: args.prompt,
          title: args.title,
          safetyCeilingMs: args.safetyCeilingMs,
          workingDirectory: context.directory,
          worktree: context.worktree,
        })

        return renderToolResult(success(`Delegation dispatched to ${args.agent}`, result))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { DelegateTaskInputSchema }
