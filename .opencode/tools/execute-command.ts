import { tool } from "@opencode-ai/plugin"
import { createOpencodeClient } from "@opencode-ai/sdk"

/**
 * Helper to unwrap SDK response objects handling both "fields" and "data" response styles.
 * The SDK default response style wraps data in { data: T, error, request, response }.
 * This extracts the inner data, or returns the value as-is if already unwrapped.
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
 * Custom tool for executing OpenCode commands and prompts on child sessions.
 *
 * The core problem this solves: calling `client.session.command()` on the **current**
 * (parent) session queues the command because the session is busy processing this tool.
 * This tool instead creates a CHILD session (linked via parentID), which is idle,
 * so dispatch runs immediately.
 *
 * Two modes:
 * - `dispatch` (default): Runs a command synchronously on a child session and returns
 *   the result. Requires `command` + optional `arguments`.
 * - `fire-and-forget`: Sends a prompt to a child session via `promptAsync` with
 *   `noReply: true` and returns immediately. Uses `prompt` or `command` + `arguments`.
 *
 * When `agent` is omitted, the tool lists all available agents for selection.
 */
export default tool({
  description:
    "Execute a command or prompt on a child session (not the current busy session). " +
    "Supports two modes: 'dispatch' (sync command execution on child session) and " +
    "'fire-and-forget' (async prompt dispatch to child session, returns immediately). " +
    "When no agent is specified, lists available agents for selection.",
  args: {
    mode: tool.schema
      .enum(["dispatch", "fire-and-forget"])
      .optional()
      .default("dispatch")
      .describe(
        "Execution mode: 'dispatch' runs a command synchronously on a child session, " +
          "'fire-and-forget' sends an async prompt and returns immediately",
      ),
    command: tool.schema
      .string()
      .optional()
      .describe(
        "The command name to execute (e.g., 'plan', 'gsd', 'hf-create'). " +
          "Do not include leading slash. Required for dispatch mode.",
      ),
    arguments: tool.schema
      .string()
      .optional()
      .default("")
      .describe("Optional arguments to pass to the command (e.g., '--help' or 'build-feature-x')."),
    prompt: tool.schema
      .string()
      .optional()
      .describe("Text prompt to send (alternative to command, preferred for fire-and-forget mode)."),
    agent: tool.schema
      .string()
      .optional()
      .describe(
        "Target agent name (e.g., 'hm-l2-executor', 'gsd-planner'). " +
          "If omitted, lists available agents for selection.",
      ),
    title: tool.schema
      .string()
      .optional()
      .describe("Optional title for the child session (auto-generated if omitted)."),
  },
  async execute(
    args: {
      mode: "dispatch" | "fire-and-forget"
      command?: string
      arguments?: string
      prompt?: string
      agent?: string
      title?: string
    },
    context: { sessionID: string; messageID: string; agent: string; directory: string; worktree: string },
  ): Promise<string> {
    try {
      // --- Validation ---
      if (!args.command && !args.prompt) {
        return JSON.stringify({
          success: false,
          error: "Either 'command' or 'prompt' must be provided",
        })
      }

      if (args.mode === "dispatch" && !args.command) {
        return JSON.stringify({
          success: false,
          error: "Command is required for dispatch mode. Use 'prompt' with fire-and-forget mode instead.",
        })
      }

      // Create SDK client connected to the local OpenCode server
      const client = createOpencodeClient()

      // --- Agent selection (when agent is omitted) ---
      if (!args.agent) {
        const response = await client.app.agents()
        const agents = unwrapData<Array<{ name: string; description?: string; mode: string }>>(response)

        if (!Array.isArray(agents)) {
          return JSON.stringify({
            success: false,
            error: "Failed to retrieve agent list",
          })
        }

        const agentList = agents.map((a) => ({
          name: a.name,
          description: a.description ?? null,
          mode: a.mode,
        }))

        return JSON.stringify({
          success: false,
          needsAgentSelection: true,
          agents: agentList,
        })
      }

      // --- Create child session ---
      const sessionResponse = await client.session.create({
        body: {
          parentID: context.sessionID,
          title:
            args.title ??
            `execute-${args.command ?? "prompt"}-${args.mode === "fire-and-forget" ? "async" : "sync"}`,
        },
      })

      const childSession = unwrapData<{ id: string }>(sessionResponse)
      const childSessionId = childSession?.id

      if (!childSessionId) {
        return JSON.stringify({
          success: false,
          error: "Failed to create child session — no session ID returned",
        })
      }

      // --- Fire-and-forget mode ---
      if (args.mode === "fire-and-forget") {
        const text =
          args.prompt ??
          `/${args.command ?? ""} ${args.arguments ?? ""}`.trim()

        await client.session.promptAsync({
          path: { id: childSessionId },
          body: {
            agent: args.agent,
            noReply: true,
            parts: [{ type: "text", text }],
          },
        })

        return JSON.stringify({
          success: true,
          mode: "fire-and-forget",
          childSessionId,
          status: "dispatched",
        })
      }

      // --- Dispatch mode (sync command) ---
      const commandResponse = await client.session.command({
        path: { id: childSessionId },
        body: {
          command: args.command!,
          arguments: args.arguments ?? "",
          agent: args.agent,
        },
      })

      const commandResult = unwrapData<{
        info: { id: string; role: string; modelID: string; providerID: string }
        parts: Array<unknown>
      }>(commandResponse)

      return JSON.stringify({
        success: true,
        mode: "dispatch",
        childSessionId,
        command: args.command,
        arguments: args.arguments ?? "",
        result: {
          info: commandResult?.info ?? null,
          partCount: Array.isArray(commandResult?.parts) ? commandResult.parts.length : 0,
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
