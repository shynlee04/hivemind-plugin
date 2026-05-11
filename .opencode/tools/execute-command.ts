import { tool } from "@opencode-ai/plugin"
import { createOpencodeClient } from "@opencode-ai/sdk"

/**
 * Unwraps SDK response objects in "fields" mode.
 *
 * The OpenCode SDK returns `{ data: T, error?, request?, response? }` by default.
 * This helper extracts the inner `data` field, or returns the value as-is if
 * it is already an unwrapped shape (e.g. contains an `id` property from a model).
 *
 * @template T - The expected data shape inside the wrapper.
 * @param response - The raw SDK response.
 * @returns The unwrapped data payload.
 */
function unwrapData<T>(response: unknown): T {
  if (
    response !== null &&
    typeof response === "object" &&
    "data" in response &&
    !("id" in response)
  ) {
    return (response as { data: T }).data
  }
  return response as T
}

/**
 * Executes a slash command or prompt on an OpenCode session.
 *
 * Two modes:
 * - `dispatch` (sync): runs a command via `client.session.command()` and
 *   returns the result. Pre-checks session status and returns a clear error
 *   if the target session is busy.
 * - `fire-and-forget` (async): sends a prompt via `client.session.promptAsync()`
 *   with `noReply: true` and returns immediately.
 *
 * When `agent` is omitted, the tool calls `client.app.agents()` and returns the
 * list of available agents for the caller to select from — no command is
 * dispatched.
 */
export default tool({
  description:
    "Execute a slash command or prompt on an OpenCode session. " +
    "Supports 'dispatch' (sync, runs a command and returns the result) and " +
    "'fire-and-forget' (async, sends a prompt and returns immediately). " +
    "When no agent is specified, lists available agents for selection.",

  args: {
    command: tool.schema
      .string()
      .optional()
      .describe(
        "Slash command name to execute (e.g. 'plan', 'gsd'). " +
          "Do not include a leading slash. Required for dispatch mode.",
      ),

    arguments: tool.schema
      .string()
      .optional()
      .default("")
      .describe("Optional arguments to pass to the command."),

    agent: tool.schema
      .string()
      .optional()
      .describe(
        "Target agent name (e.g. 'hm-l2-executor', 'gsd-planner'). " +
          "If omitted, the tool lists available agents for selection.",
      ),

    mode: tool.schema
      .enum(["dispatch", "fire-and-forget"])
      .optional()
      .default("dispatch")
      .describe(
        "Execution mode: 'dispatch' runs a command synchronously " +
          "(requires 'command'), 'fire-and-forget' sends an async prompt " +
          "and returns immediately.",
      ),

    sessionId: tool.schema
      .string()
      .optional()
      .describe(
        "Target session ID. Defaults to the current session. " +
          "Useful for dispatching to a specific child session.",
      ),
  },

  async execute(
    args: {
      command?: string
      arguments?: string
      agent?: string
      mode: "dispatch" | "fire-and-forget"
      sessionId?: string
    },
    context: {
      sessionID: string
      messageID: string
      agent: string
      directory: string
      worktree: string
    },
  ): Promise<string> {
    try {
      const client = createOpencodeClient({
        baseUrl: "http://localhost:4096",
        directory: context.directory,
      })
      const targetSession = args.sessionId ?? context.sessionID

      // --- Agent listing (when agent is omitted) ---
      if (!args.agent) {
        const response = await client.app.agents()
        const agents = unwrapData<
          Array<{ name: string; description?: string; mode: string }>
        >(response)

        if (!Array.isArray(agents)) {
          return JSON.stringify({
            success: false,
            error: "Failed to retrieve agent list — unexpected response shape",
          })
        }

        return JSON.stringify({
          success: false,
          needsAgentSelection: true,
          agents: agents.map((a) => ({
            name: a.name,
            description: a.description ?? null,
            mode: a.mode,
          })),
        })
      }

      // --- Validation ---
      if (args.mode === "dispatch" && !args.command) {
        return JSON.stringify({
          success: false,
          error: "'command' is required for dispatch mode.",
        })
      }

      if (args.mode === "fire-and-forget" && !args.command && !args.arguments) {
        return JSON.stringify({
          success: false,
          error:
            "Either 'command' or 'arguments' must be provided for fire-and-forget mode.",
        })
      }

      // --- Fire-and-forget (async) ---
      if (args.mode === "fire-and-forget") {
        const text = args.command
          ? `/${args.command} ${args.arguments ?? ""}`.trim()
          : (args.arguments ?? "")

        await client.session.promptAsync({
          path: { id: targetSession },
          body: {
            parts: [{ type: "text", text }],
            agent: args.agent,
            noReply: true,
          },
        })

        return JSON.stringify({
          success: true,
          mode: "fire-and-forget",
          sessionId: targetSession,
          status: "dispatched",
        })
      }

      // --- Dispatch (sync) with busy check ---
      const statusResponse = await client.session.status()
      const statusData = unwrapData<Record<string, { type: string }>>(
        statusResponse,
      )
      const sessionStatus = statusData?.[targetSession]

      if (sessionStatus?.type === "busy") {
        return JSON.stringify({
          success: false,
          error: `Session "${targetSession}" is currently busy.` +
            " Wait for it to become idle, or use a different session.",
          sessionStatus: sessionStatus.type,
        })
      }

      const commandResponse = await client.session.command({
        path: { id: targetSession },
        body: {
          command: args.command!,
          arguments: args.arguments ?? "",
          agent: args.agent,
        },
      })

      const commandResult = unwrapData<{
        info: {
          id: string
          role: string
          modelID: string
          providerID: string
        }
        parts: Array<unknown>
      }>(commandResponse)

      return JSON.stringify({
        success: true,
        mode: "dispatch",
        sessionId: targetSession,
        command: args.command,
        arguments: args.arguments ?? "",
        result: {
          info: commandResult?.info ?? null,
          partCount: Array.isArray(commandResult?.parts)
            ? commandResult.parts.length
            : 0,
        },
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})
