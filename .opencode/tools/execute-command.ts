import { tool } from "@opencode-ai/plugin"
import { createOpencodeClient } from "@opencode-ai/sdk"

/**
 * Custom tool for executing OpenCode slash commands on the current session.
 *
 * Uses the OpenCode SDK to send a command (e.g., /plan, /gsd, /hf-create) to the
 * agent's own session, enabling programmatic command dispatch from within tools.
 */
export default tool({
  description:
    "Execute an OpenCode slash command on the current session. " +
    "Use this to run commands like /plan, /gsd, /hf-create, /hf-audit, etc. programmatically. " +
    "Returns the full response including message info and content parts.",
  args: {
    command: tool.schema
      .string()
      .describe(
        "The command name to execute (e.g., 'plan', 'gsd', 'hf-create', 'hf-audit'). Do not include the leading slash.",
      ),
    arguments: tool.schema
      .string()
      .optional()
      .default("")
      .describe("Optional arguments to pass to the command (e.g., '--help' or 'build-feature-x')."),
  },
  async execute(
    args: { command: string; arguments?: string },
    context: { sessionID: string; messageID: string; agent: string; directory: string; worktree: string },
  ): Promise<string> {
    try {
      // Create a client connected to the local OpenCode server
      const client = createOpencodeClient()

      // Execute the command on the current session via the SDK
      const result = await client.session.command({
        path: { id: context.sessionID },
        body: {
          command: args.command,
          arguments: args.arguments ?? "",
        },
      })

      return JSON.stringify({
        success: true,
        command: args.command,
        arguments: args.arguments ?? "",
        result,
      })
    } catch (error) {
      return JSON.stringify({
        success: false,
        command: args.command,
        arguments: args.arguments ?? "",
        error: error instanceof Error ? error.message : String(error),
      })
    }
  },
})
