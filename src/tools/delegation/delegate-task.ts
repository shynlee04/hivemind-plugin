import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"
// POLICY (P58, G1): This tool MUST route via coordinator.dispatch only.
//   Do NOT import the native `task` tool from "@opencode-ai/plugin" —
//   bypassing coordinator.dispatch skips the Hivemind delegation
//   lifecycle, session-tracker events, and tmux pane projection.
export const DelegateTaskV2Schema = z.object({
  agent: z.string().min(1, { error: "agent is required" }),
  prompt: z.string().min(1, { error: "prompt is required" }),
  context: z.string().optional(),
  stackOnSessionId: z.string().optional(),
})

interface CoordinatorLike {
  dispatch(params: Record<string, unknown>): Promise<unknown>
}

type ToolContext = {
  sessionID: string
  directory?: string
  worktree?: string
}

export function createDelegateTaskTool(coordinator: CoordinatorLike, config?: { delegation_systems?: { delegate_task?: boolean } }): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Delegate work to a specialist agent via SDK child-session dispatch. Returns immediately with a delegation ID (true-fire-and-forget WaiterModel (P58.3)). " +
      "**STACKING (PREFERRED):** Use `stackOnSessionId` to attach new work onto an existing session (completed, failed, aborted, cancelled, or even active). " +
      "This PRESERVES full context from the previous session. The SDK supports stacking on ANY valid session ID, both within the current delegation tree AND across independent sessions. " +
      "**ALWAYS prefer stacking onto existing sessions over creating new ones** — especially when retrying after failure. " +
      "Use `delegation-status({ action: 'find-stackable' })` to discover available sessions before dispatching. " +
      "Legacy context stacking: pass context as JSON `{\"parentSessionId\": \"<existing-session-id>\"}` — equivalent to stackOnSessionId. " +
      "Respects the config `delegation_systems.delegate_task` flag — when disabled, the tool returns a graceful error. " +
      "This tool ONLY works inside an OpenCode plugin runtime environment where session context is injected by the framework.",
    args: {
      agent: s.string().describe("Agent name to delegate to (must be valid at runtime)"),
      prompt: s.string().describe("Task prompt to send to the delegated agent"),
      context: s.string().optional().describe("Optional context packet. Legacy stacking: pass JSON {\"parentSessionId\": \"ses_xxx\"}. Otherwise treated as free-text prepended to prompt."),
      stackOnSessionId: s.string().optional().describe("Session ID to stack onto. Works for completed, failed, aborted, cancelled, and active sessions. PREFERRED over creating new sessions when retrying, resuming, or continuing work. Takes precedence over context-based parentSessionId."),
    },
    async execute(rawArgs: unknown, context: ToolContext): Promise<string> {
      const parsed = DelegateTaskV2Schema.safeParse(rawArgs)
      if (!parsed.success) return renderToolResult(error(`[Hivemind] Invalid delegate-task input: ${z.prettifyError(parsed.error)}`))
      const args = parsed.data

      if (config && config.delegation_systems?.delegate_task === false) {
        return renderToolResult(error("[Hivemind] delegate-task is disabled by config `delegation_systems.delegate_task: false`. Enable it in .hivemind/configs.json to use this tool."))
      }

      let parentSessionId = context.sessionID
      let prompt = args.prompt

      // First-class stackOnSessionId takes precedence
      if (args.stackOnSessionId) {
        parentSessionId = args.stackOnSessionId
      } else if (args.context) {
        // Legacy JSON context for session stacking: {"parentSessionId": "ses_xxx"}
        try {
          const parsed = JSON.parse(args.context) as { parentSessionId?: string }
          if (parsed.parentSessionId && typeof parsed.parentSessionId === "string") {
            parentSessionId = parsed.parentSessionId
            const { parentSessionId: _, ...rest } = parsed
            const remaining = Object.keys(rest).length > 0 ? JSON.stringify(rest) : ""
            prompt = remaining ? `${remaining}\n\n${args.prompt}` : args.prompt
          } else {
            prompt = `${args.context}\n\n${args.prompt}`
          }
        } catch {
          prompt = `${args.context}\n\n${args.prompt}`
        }
      }

      try {
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
          const resultMessage = typeof resultRecord.error === "string" ? resultRecord.error : `[Hivemind] delegate-task returned ${String(resultRecord.status)}`
          return renderToolResult(error(resultMessage, resultRecord))
        }
        return renderToolResult(success(
          `[Hivemind] Delegated task to ${args.agent}${args.stackOnSessionId ? ` (stacked on ${args.stackOnSessionId})` : ""}`,
          { ...resultRecord, agent: args.agent, stackedOn: args.stackOnSessionId ?? undefined },
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

