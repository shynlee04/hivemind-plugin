import { tool } from "@opencode-ai/plugin"
import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"

/**
 * Creates the execute-slash-command tool.
 *
 * This tool allows an agent to programmatically dispatch a slash command
 * (e.g., built-in commands or custom `.opencode/commands/*.md` commands)
 * to the active session via the deterministic `POST /session/:id/command`
 * SDK endpoint.
 *
 * The command will execute natively — any workflow, agent routing, or
 * primitive stacking defined in the command will trigger. This is the
 * write-side companion to the `hivemind-command-engine` discovery tool
 * (CQRS pattern).
 *
 * **SDK contract** (OpenCode `CommandInput`):
 * - `command` (required) — command name without leading slash
 * - `arguments` (required) — arguments string (can be empty `""`)
 * - `agent` (optional) — agent context override for this command
 * - `model` (optional) — model override in `"providerID/modelID"` format
 * - `variant` (optional) — model variant override
 *
 * @example
 * ```
 * // Basic command execution
 * execute-slash-command { command: "gsd-stats", arguments: "" }
 *
 * // Command with arguments
 * execute-slash-command { command: "hf-create", arguments: "skill my-new-skill" }
 *
 * // Command with agent context override
 * execute-slash-command { command: "deep-research-synthesis-repomix", arguments: "vitest", agent: "hm-researcher" }
 *
 * // Command with model override
 * execute-slash-command { command: "plan", arguments: "refactor auth module", model: "anthropic/claude-sonnet-4-20250514" }
 * ```
 *
 * @see src/tools/hivemind/hivemind-command-engine.ts — discovery companion (CQRS read-side)
 * @see src/routing/command-engine/index.ts — command engine core
 * @see .opencode/tools-deprecated/execute-command.ts — superseded predecessor
 *
 * @param client - The OpenCode SDK client instance (injected from plugin composition root).
 * @returns ToolDefinition for the execute-slash-command tool.
 */
export const createExecuteSlashCommandTool = (client: PluginInput["client"]): ToolDefinition => {
  return tool({
    description:
      "Executes an OpenCode slash command on the active session. This is equivalent to a user typing '/command args' in the TUI. " +
      "Dispatches via the deterministic SDK command endpoint — NOT the LLM inference path. " +
      "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
    args: {
      command: tool.schema.string().describe(
        "The command name without the leading slash (e.g., 'gsd-stats', 'hf-create', 'plan')",
      ),
      arguments: tool.schema.string().optional().describe(
        "Arguments string to pass to the command (e.g., 'my-new-skill'). Defaults to empty string.",
      ),
      agent: tool.schema.string().optional().describe(
        "Optional agent context override. When set, the command executes under this agent's " +
        "permissions, instructions, and model config (e.g., 'hm-researcher', 'hm-executor').",
      ),
      model: tool.schema.string().optional().describe(
        "Optional model override in 'providerID/modelID' format (e.g., 'anthropic/claude-sonnet-4-20250514'). " +
        "When set, the command's prompt loop uses this model instead of the session default.",
      ),
      variant: tool.schema.string().optional().describe(
        "Optional model variant override (e.g., 'thinking'). " +
        "Only effective when the specified model supports the requested variant.",
      ),
    },
    async execute(args, ctx) {
      const cmdDisplay = `/${args.command}${args.arguments ? ` ${args.arguments}` : ""}`
      ctx.metadata({
        title: `Executing ${cmdDisplay}`,
        metadata: {
          command: args.command,
          ...(args.agent && { agent: args.agent }),
          ...(args.model && { model: args.model }),
        },
      })

      try {
        const body: {
          command: string
          arguments: string
          agent?: string
          model?: string
          variant?: string
        } = {
          command: args.command,
          arguments: args.arguments || "",
        }

        // Pass optional agent context — enables agent switching before command dispatch
        if (args.agent) {
          body.agent = args.agent
        }

        // Pass optional model override — enables model pinning for specific commands
        if (args.model) {
          body.model = args.model
        }

        // Pass optional variant — enables variant selection (e.g., "thinking")
        if (args.variant) {
          body.variant = args.variant
        }

        const res = await client.session.command({
          path: { id: ctx.sessionID },
          body,
        })

        const responseId = res.data?.info?.id || "unknown"
        const partsCount = res.data?.parts?.length ?? 0

        return {
          output: [
            `✓ Command ${cmdDisplay} executed successfully.`,
            `  Response ID: ${responseId}`,
            `  Parts: ${partsCount}`,
            args.agent ? `  Agent: ${args.agent}` : null,
            args.model ? `  Model: ${args.model}` : null,
          ].filter(Boolean).join("\n"),
          metadata: {
            responseId,
            command: args.command,
            partsCount,
            ...(args.agent && { agent: args.agent }),
            ...(args.model && { model: args.model }),
            ...(args.variant && { variant: args.variant }),
          },
        }
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)

        // Classify error type for better agent error handling
        let errorType: "bad_request" | "not_found" | "internal" = "internal"
        if (error instanceof Error) {
          const statusMatch = msg.match(/\b(400|422)\b/)
          if (statusMatch) errorType = "bad_request"
          else if (msg.includes("404") || msg.includes("not found")) errorType = "not_found"
        }

        return {
          output: `✗ Failed to execute ${cmdDisplay}: ${msg}`,
          metadata: {
            error: true,
            errorType,
            command: args.command,
            message: msg,
          },
        }
      }
    },
  })
}
