import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import { renderToolResult } from "../../shared/tool-helpers.js"
import { error, success } from "../../shared/tool-response.js"

/** Zod contract for delegate-task v2 input validation and defaults. */
export const DelegateTaskV2Schema = z.object({
  agent: z.string().min(1, { error: "agent is required" }),
  prompt: z.string().min(1, { error: "prompt is required" }),
  safetyCeilingMs: z.number().int().positive().max(300_000).default(300_000),
  category: z.string().optional(),
  context: z.string().optional(),
})

type NativeTask = (params: { agent: string; prompt: string; disabledTools: string[] }) => Promise<unknown>
interface CoordinatorLike {
  attachChildSession?: (delegationId: string, childSessionId: string) => void
  dispatch(params: Record<string, unknown>): Promise<unknown>
  failDispatch?: (delegationId: string, caughtError: unknown) => void
}

/** @internal Runtime context injected by the OpenCode plugin framework. NOT available in non-OpenCode environments. */
type ToolContext = {
  sessionID?: string
  directory?: string
  worktree?: string
  task?: NativeTask
}

function isOpenCodeRuntimeAvailable(): boolean {
  return !!(process.env.OPENCODE_SESSION_ID || process.env.OPENCODE_HARNESS_STATE_DIR)
}

function getStringField(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === "string" && candidate.length > 0) return candidate
  }
  return undefined
}

function extractNativeTaskSessionId(value: unknown): string | undefined {
  const direct = getStringField(value, ["sessionID", "sessionId", "childSessionId", "id"])
  if (direct) return direct
  if (!value || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  return getStringField(record.session, ["id", "sessionID", "sessionId"])
}

/**
 * Creates the delegate-task v2 OpenCode tool boundary.
 *
 * @param coordinator - Coordination dependency that performs pre-flight dispatch wiring.
 * @param options - Optional native Task seam used by tests or host runtimes.
 * @returns An OpenCode tool definition that validates input and starts native delegation.
 */
export function createDelegateTaskTool(coordinator: CoordinatorLike, options: { nativeTask?: NativeTask } = {}): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "[REQUIRES OpenCode RUNTIME] Delegate work to a specialist agent via SDK child-session dispatch. Returns immediately with a delegation ID (always-background WaiterModel). This tool ONLY works inside an OpenCode plugin runtime environment where session context is injected by the framework. In non-OpenCode environments, use the native task/subagent dispatch mechanism instead.",
    args: {
      agent: s.string().describe("Agent name to delegate to (must be valid at runtime)"),
      prompt: s.string().describe("Task prompt to send to the delegated agent"),
      safetyCeilingMs: s.number().optional().describe("Safety ceiling in milliseconds (max runtime)"),
      category: s.string().optional().describe("Optional delegation category"),
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

      const nativeTask = options.nativeTask ?? context.task
      if (!nativeTask) {
        return renderToolResult(error(
          "[Harness] delegate-task cannot start native Task: OpenCode native Task seam is unavailable.",
        ))
      }

      try {
        const queueKey = `agent:${args.agent}`
        const result = await coordinator.dispatch({
          parentSessionId,
          agent: args.agent,
          prompt: args.prompt,
          category: args.category,
          currentDepth: 0,
          queueKey,
          safetyCeilingMs: args.safetyCeilingMs,
          surface: "agent-delegation",
        })
        const delegationId = typeof result === "object" && result !== null && "delegationId" in result
          ? String((result as Record<string, unknown>).delegationId)
          : undefined
        try {
          const nativeResult = await nativeTask({ agent: args.agent, prompt: args.prompt, disabledTools: ["delegate-task", "task"] })
          const childSessionId = extractNativeTaskSessionId(nativeResult)
          if (delegationId && childSessionId) coordinator.attachChildSession?.(delegationId, childSessionId)
        } catch (nativeError) {
          if (delegationId) coordinator.failDispatch?.(delegationId, nativeError)
          const message = nativeError instanceof Error ? nativeError.message : String(nativeError)
          return renderToolResult(error(`[Harness] Native Task dispatch failed: ${message}`))
        }

        return renderToolResult(success(`Delegation dispatched to ${args.agent}`, {
          ...(typeof result === "object" && result !== null ? result : {}),
          agent: args.agent,
          safetyCeilingMs: args.safetyCeilingMs,
        }))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { DelegateTaskV2Schema as DelegateTaskInputSchema }
