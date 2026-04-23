import { tool } from "@opencode-ai/plugin/tool"
import { z } from "zod"

import type { DelegationManager } from "../lib/delegation-manager.js"
import type { PtyManager } from "../lib/pty/pty-manager.js"
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
          const parentSessionId = context.sessionID ?? process.env.OPENCODE_SESSION_ID
          if (!parentSessionId) {
            throw new Error("[Harness] Missing parent session ID for run-background-command")
          }

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
          return renderToolResult(success(`Output for ${parsed.sessionId}`, args.ptyManager.read(parsed.sessionId, parsed.offset ?? 0)))
        }

        if (parsed.action === "input") {
          args.ptyManager.write(parsed.sessionId, parsed.input)
          return renderToolResult(success(`Input sent to ${parsed.sessionId}`))
        }

        if (parsed.action === "terminate") {
          const cancellation = await args.delegationManager.markCommandCancellationForPtySession(parsed.sessionId)
          await args.ptyManager.terminate(parsed.sessionId)
          return renderToolResult(success(
            `Cancellation requested for ${parsed.sessionId}`,
            cancellation ?? { sessionId: parsed.sessionId, explicitCancellation: true },
          ))
        }

        return renderToolResult(success("Shared PTY sessions", args.ptyManager.listSessions()))
      } catch (caughtError) {
        const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
        return renderToolResult(error(message))
      }
    },
  })
}

export { RunBackgroundCommandInputSchema }
