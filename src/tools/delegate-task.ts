import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import type { DelegationManager } from "../lib/delegation-manager.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

const DelegateTaskInputSchema = z.object({
  agent: z.string().min(1, "agent is required").describe("Agent name to delegate to"),
  prompt: z.string().min(1, "prompt is required").describe("The task prompt to send to the agent"),
  title: z.string().min(1).optional().describe("Optional title for the child session"),
  async: z.boolean().default(false).describe("Return immediately with a delegation ID"),
  timeoutMs: z.number().min(1000).max(1800000).optional().describe("Timeout in milliseconds"),
})

type DelegateTaskInput = z.infer<typeof DelegateTaskInputSchema>

type ToolContext = { sessionID?: string }

export function createDelegateTaskTool(
  delegationManager: DelegationManager,
): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Delegate work to a specialist agent. Use sync mode for immediate results or async mode for durable background work.",
    args: {
      agent: s.string().describe("Agent name to delegate to (must be valid at runtime)"),
      prompt: s.string().describe("Task prompt to send to the delegated agent"),
      title: s.string().optional().describe("Optional title for the child session"),
      async: s.boolean().optional().describe("If true, return delegation ID immediately"),
      timeoutMs: s.number().optional().describe("Timeout in milliseconds (1000-1800000)"),
    },
    async execute(rawArgs: DelegateTaskInput, context: ToolContext): Promise<string> {
      try {
        const args = DelegateTaskInputSchema.parse(rawArgs)
        const parentSessionId = context.sessionID ?? process.env.OPENCODE_SESSION_ID

        if (!parentSessionId) {
          throw new Error("[Harness] Missing parent session ID for delegate-task")
        }

        if (args.async) {
          const { delegationId } = await delegationManager.delegateAsync({
            parentSessionId,
            agent: args.agent,
            prompt: args.prompt,
            title: args.title,
            timeoutMs: args.timeoutMs,
          })

          return renderToolResult(success(`Async delegation dispatched to ${args.agent}`, {
            status: "dispatched",
            delegationId,
            message: `Async delegation dispatched to ${args.agent}`,
          }))
        }

        const result = await delegationManager.delegateSync({
          parentSessionId,
          agent: args.agent,
          prompt: args.prompt,
          title: args.title,
          timeoutMs: args.timeoutMs,
        })

        return renderToolResult(success(`Delegation completed via ${args.agent}`, result))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { DelegateTaskInputSchema }
