import { tool } from "@opencode-ai/plugin"
import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"

/**
 * Creates the execute-slash-command tool.
 *
 * This tool allows an agent to programmatically dispatch a slash command
 * (e.g., built-in commands or custom `.opencode/commands/*.md` commands)
 * to the active session via the TUI prompt pipeline.
 *
 * ## Why TUI path instead of `session.command()`?
 *
 * `session.command()` calls `SessionPrompt.prompt()` internally, which
 * **blocks** until the LLM completes. But since this tool is called
 * *during* an active LLM loop, `SessionRunState.ensureRunning()` detects
 * the session is busy and **queues** the command — it never executes
 * immediately.
 *
 * The TUI path (`appendPrompt` + `submitPrompt`) bypasses this by
 * injecting the command text into the TUI prompt buffer, which the TUI
 * processes as a slash command *after* the current tool call returns.
 * This results in immediate execution once the current turn completes.
 *
 * **SDK contract** (TUI pipeline):
 * - `tui.appendPrompt({ body: { text } })` — injects `/<command> <args>` into the TUI prompt
 * - `tui.submitPrompt()` — submits the prompt, triggering slash command dispatch
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
 *
 * @param client - The OpenCode SDK client instance (injected from plugin composition root).
 * @returns ToolDefinition for the execute-slash-command tool.
 */
export const createExecuteSlashCommandTool = (client: PluginInput["client"]): ToolDefinition => {
  return tool({
    description:
      "Executes an OpenCode slash command on the active session. This is equivalent to a user typing '/command args' in the TUI. " +
      "Dispatches via the TUI prompt pipeline for immediate execution — NOT the blocking session.command() path. " +
      "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
    args: {
      command: tool.schema.string().describe(
        "The command name without the leading slash (e.g., 'gsd-stats', 'hf-create', 'plan')",
      ),
      arguments: tool.schema.string().optional().describe(
        "Arguments string to pass to the command (e.g., 'my-new-skill'). Defaults to empty string.",
      ),
      agent: tool.schema.string().optional().describe(
        "Optional agent context override. When set, the agent is prepended as '@agent' before the command " +
        "(e.g., '@hm-researcher /deep-research-synthesis-repomix vitest').",
      ),
      model: tool.schema.string().optional().describe(
        "Optional model override in 'providerID/modelID' format (e.g., 'anthropic/claude-sonnet-4-20250514'). " +
        "When set, prepended as a model tag in the prompt text.",
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
        // Build the slash command text exactly as a user would type it in the TUI
        // Format: [@agent] [/command] [arguments]
        const parts: string[] = []

        // Prepend agent override if specified
        if (args.agent) {
          parts.push(`@${args.agent}`)
        }

        // The command itself
        parts.push(`/${args.command}`)

        // Append arguments if any
        if (args.arguments) {
          parts.push(args.arguments)
        }

        const promptText = parts.join(" ")

        // Step 1: Clear any existing prompt to avoid stale state
        await client.tui.clearPrompt()

        // Step 2: Append the slash command text to the TUI prompt buffer
        await client.tui.appendPrompt({
          body: { text: promptText },
        })

        // Step 3: Submit the prompt — TUI dispatches as a slash command
        await client.tui.submitPrompt()

        return {
          output: [
            `✓ Command ${cmdDisplay} dispatched to TUI prompt.`,
            `  Prompt text: ${promptText}`,
            `  The command will execute immediately after this tool call returns.`,
            args.agent ? `  Agent: ${args.agent}` : null,
            args.model ? `  Model: ${args.model}` : null,
          ].filter(Boolean).join("\n"),
          metadata: {
            command: args.command,
            promptText,
            dispatched: true,
            ...(args.agent && { agent: args.agent }),
            ...(args.model && { model: args.model }),
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
          output: `✗ Failed to dispatch ${cmdDisplay}: ${msg}`,
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
