import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import type { DelegationManager } from "../lib/delegation-manager.js"
import type { PtyManager } from "../lib/pty/pty-manager.js"
import type { Delegation } from "../lib/types.js"
import { renderToolResult } from "../shared/tool-helpers.js"
import { error, success } from "../shared/tool-response.js"

const RunActionSchema = z.object({
  action: z.literal("run"),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  cwd: z.string().optional(),
  env: z.record(z.string(), z.string()).optional(),
})

const OutputActionSchema = z.object({
  action: z.literal("output"),
  sessionId: z.string().min(1),
  offset: z.number().int().min(0).optional(),
})

const InputActionSchema = z.object({
  action: z.literal("input"),
  sessionId: z.string().min(1),
  input: z.string(),
})

const ListActionSchema = z.object({
  action: z.literal("list"),
})

const TerminateActionSchema = z.object({
  action: z.literal("terminate"),
  sessionId: z.string().min(1),
})

const RunBackgroundCommandInputSchema = z.discriminatedUnion("action", [
  RunActionSchema,
  OutputActionSchema,
  InputActionSchema,
  ListActionSchema,
  TerminateActionSchema,
])

type RunBackgroundCommandInput = z.infer<typeof RunBackgroundCommandInputSchema>

type ToolContext = {
  sessionID?: string
  directory?: string
}

/**
 * Resolve the caller identity from the OpenCode tool context only.
 *
 * @param context - Tool execution context supplied by OpenCode.
 * @param action - Current run-background-command action for diagnostics.
 * @returns Caller session ID when present.
 * @throws {Error} When the context has no session ID.
 */
function requireCallerSessionId(context: ToolContext, action: RunBackgroundCommandInput["action"]): string {
  if (!context.sessionID) {
    throw new Error(`[Harness] Missing caller session ID for run-background-command ${action}`)
  }
  return context.sessionID
}

/**
 * Assert that a PTY session is owned by a caller-visible delegation.
 *
 * @param delegationManager - Delegation manager containing PTY ownership records.
 * @param callerSessionId - Current caller session from tool context.
 * @param sessionId - PTY session ID requested by the caller.
 * @returns The delegation that owns the PTY session.
 * @throws {Error} When no caller-visible delegation owns the PTY session.
 */
function requireVisiblePtyDelegation(
  delegationManager: DelegationManager,
  callerSessionId: string,
  sessionId: string,
): Delegation {
  const delegation = delegationManager.getDelegationForPtySession(sessionId)
  if (!delegation || !delegationManager.canSessionAccessDelegation(callerSessionId, delegation)) {
    throw new Error(`[Harness] Access denied for PTY session "${sessionId}": no caller-visible delegation owns this session`)
  }
  return delegation
}

export function createRunBackgroundCommandTool(args: {
  delegationManager: DelegationManager
  ptyManager: PtyManager | null
}): ReturnType<typeof tool> {
  const s = tool.schema

  return tool({
    description:
      "Run CLI commands in shared background PTY sessions with queue-governed dispatch, output reads, interactive input, session listing, and termination.",
    args: {
      action: s.string().describe("run, output, input, list, or terminate"),
      command: s.string().optional(),
      args: s.array(s.string()).optional(),
      cwd: s.string().optional(),
      env: s.record(s.string(), s.string()).optional(),
      sessionId: s.string().optional(),
      offset: s.number().optional(),
      input: s.string().optional(),
    },
    async execute(rawArgs: RunBackgroundCommandInput, context: ToolContext): Promise<string> {
      const parsed = RunBackgroundCommandInputSchema.parse(rawArgs)

      if (!args.ptyManager) {
        return renderToolResult(error("[Harness] PTY not available in current environment"))
      }

      try {
        if (parsed.action === "run") {
          const parentSessionId = requireCallerSessionId(context, parsed.action)

          const result = await args.delegationManager.dispatchCommand({
            parentSessionId,
            command: parsed.command,
            args: parsed.args,
            cwd: parsed.cwd ?? context.directory,
            env: parsed.env,
            title: `Background command: ${parsed.command}`,
            queueContext: {
              agent: undefined,
              category: "command",
            },
          })

          return renderToolResult(success(`Background command started: ${parsed.command}`, result))
        }

        if (parsed.action === "output") {
          const callerSessionId = requireCallerSessionId(context, parsed.action)
          requireVisiblePtyDelegation(args.delegationManager, callerSessionId, parsed.sessionId)
          return renderToolResult(success(`Output for ${parsed.sessionId}`, args.ptyManager.read(parsed.sessionId, parsed.offset ?? 0)))
        }

        if (parsed.action === "input") {
          const callerSessionId = requireCallerSessionId(context, parsed.action)
          requireVisiblePtyDelegation(args.delegationManager, callerSessionId, parsed.sessionId)
          args.ptyManager.write(parsed.sessionId, parsed.input)
          return renderToolResult(success(`Input sent to ${parsed.sessionId}`))
        }

        if (parsed.action === "terminate") {
          const callerSessionId = requireCallerSessionId(context, parsed.action)
          requireVisiblePtyDelegation(args.delegationManager, callerSessionId, parsed.sessionId)
          const cancellation = await args.delegationManager.markCommandCancellationForPtySession(parsed.sessionId)
          await args.ptyManager.terminate(parsed.sessionId)
          return renderToolResult(success(
            `Cancellation requested for ${parsed.sessionId}`,
            cancellation ?? { sessionId: parsed.sessionId, explicitCancellation: true },
          ))
        }

        const callerSessionId = requireCallerSessionId(context, parsed.action)
        const visibleSessions = args.ptyManager.listSessions().filter((session) => {
          const delegation = args.delegationManager.getDelegationForPtySession(session.id)
          return args.delegationManager.canSessionAccessDelegation(callerSessionId, delegation)
        })
        return renderToolResult(success("Shared PTY sessions", visibleSessions))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { RunBackgroundCommandInputSchema }
