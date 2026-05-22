import { tool } from "@opencode-ai/plugin"
import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
import { discoverCommandBundles } from "../../routing/command-engine/index.js"
import type { CommandBundle } from "../../routing/command-engine/types.js"

const DEFERRED_SUBTASK_DISPATCH_DELAY_MS = 50

/**
 * Creates the execute-slash-command tool.
 *
 * Dispatches a slash command via one of three paths depending on input:
 *
 * 1. **Synthetic parent prompt** (`subtask: false` + `agent`): Calls
 *    `session.prompt({ agent, parts: [{ type: "text", text }] })` after
 *    tool return. The target agent runs in the parent session context.
 *    Requires the target agent to be `mode: all`.
 *
 * 2. **Subtask dispatch** (`subtask: true` + `agent`): Calls
 *    `session.prompt({ agent, parts: [{ type: "subtask", agent, prompt }] })`
 *    after tool return. Creates a child/delegation session.
 *
 * 3. **TUI pipeline** (no overrides): Uses `tui.appendPrompt + tui.submitPrompt`
 *    to inject `/command args` into the TUI prompt buffer. Best for basic
 *    command execution without agent context changes.
 *
 * The `agent` and `subtask` fields are added on-the-fly per invocation —
 * they are NOT written to any command or agent configuration file.
 *
 * @example
 * ```
 * // Basic TUI command execution (no agent override)
 * execute-slash-command { command: "gsd-stats", arguments: "" }
 *
 * // Subtask dispatch to a specific agent
 * execute-slash-command { command: "gsd-stats", agent: "gsd-executor", subtask: true }
 *
 * // Parent session dispatch with agent override
 * execute-slash-command { command: "gsd-stats", agent: "gsd-executor", subtask: false }
 *
 * // Command with agent and model override
 * execute-slash-command { command: "plan", arguments: "refactor auth module", agent: "gsd-planner", subtask: false, model: "anthropic/claude-sonnet-4-20250514" }
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
      "Executes an OpenCode slash command on the active session. " +
      "Three dispatch paths: (1) subtask:false + agent → synthetic parent prompt via session.prompt(), " +
      "(2) subtask:true + agent → subtask delegation via session.prompt(), " +
      "(3) no overrides → TUI appendPrompt/submitPrompt for basic command execution. " +
      "When agent is provided without subtask, defaults to subtask:false (parent session dispatch). " +
      "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
    args: {
      command: tool.schema.string().describe(
        "The command name without the leading slash (e.g., 'gsd-stats', 'hf-create', 'plan')",
      ),
      arguments: tool.schema.string().optional().describe(
        "Arguments string to pass to the command (e.g., 'my-new-skill'). Defaults to empty string.",
      ),
      agent: tool.schema.string().optional().describe(
        "Optional agent context override. With subtask:true, dispatches a SubtaskPartInput to this agent. " +
        "With subtask:false, dispatches the expanded command body as a deferred synthetic parent prompt for this agent.",
      ),
      model: tool.schema.string().optional().describe(
        "Optional model override in 'providerID/modelID' format (e.g., 'anthropic/claude-sonnet-4-20250514'). " +
        "When set, prepended as a model tag in the prompt text.",
      ),
      subtask: tool.schema.boolean().optional().describe(
        "Optional one-shot subtask override. When true, dispatches the command body as a SubtaskPartInput using the resolved or overridden agent.",
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
        const projectRoot = ctx.directory ?? ""
        const commandBundle = await findCommandBundle(projectRoot, args.command)
        const resolvedSubtask = args.subtask ?? (args.agent ? false : undefined)
        const syntheticPromptAgent = resolvedSubtask === false ? args.agent || commandBundle?.agent : undefined
        if (syntheticPromptAgent) {
          if (!commandBundle) {
            return {
              output: `✗ Failed to dispatch ${cmdDisplay}: command not found for synthetic parent prompt dispatch`,
              metadata: {
                error: true,
                errorType: "not_found",
                command: args.command,
              },
            }
          }

          const promptText = expandCommandArguments(commandBundle.body, args.arguments ?? "")
          dispatchPromptAfterToolReturn(client, {
            path: { id: ctx.sessionID },
            body: {
              agent: syntheticPromptAgent,
              parts: [
                {
                  type: "text",
                  text: promptText,
                },
              ],
            },
            query: { directory: ctx.directory },
          })

          return {
            output: [
              `✓ Command ${cmdDisplay} dispatched as synthetic parent prompt.`,
              `  Agent: ${syntheticPromptAgent}`,
              `  Description: ${commandBundle.description}`,
              "  Note: this bypasses native slash-command parsing and requires live UAT before runtime readiness claims.",
            ].join("\n"),
            metadata: {
              command: args.command,
              agent: syntheticPromptAgent,
              description: commandBundle.description,
              mode: "synthetic-parent-prompt",
              scheduled: true,
              dispatched: true,
            },
          }
        }

        const shouldDispatchSubtask = args.subtask ?? commandBundle?.subtask === true
        if (shouldDispatchSubtask) {
          if (!commandBundle) {
            return {
              output: `✗ Failed to dispatch ${cmdDisplay}: command not found for subtask dispatch`,
              metadata: {
                error: true,
                errorType: "not_found",
                command: args.command,
              },
            }
          }
          const subtaskAgent = args.agent || commandBundle.agent
          if (!subtaskAgent) {
            return {
              output: `✗ Failed to dispatch ${cmdDisplay}: command has subtask: true but no agent was provided or defined in frontmatter`,
              metadata: {
                error: true,
                errorType: "bad_request",
                command: args.command,
              },
            }
          }

          const promptText = expandCommandArguments(commandBundle.body, args.arguments ?? "")
          dispatchPromptAfterToolReturn(client, {
            path: { id: ctx.sessionID },
            body: {
              agent: subtaskAgent,
              parts: [
                {
                  type: "subtask",
                  agent: subtaskAgent,
                  description: commandBundle.description,
                  prompt: promptText,
                },
              ],
            },
            query: { directory: ctx.directory },
          })

          return {
            output: [
              `✓ Command ${cmdDisplay} dispatched as subtask.`,
              `  Agent: ${subtaskAgent}`,
              `  Description: ${commandBundle.description}`,
            ].join("\n"),
            metadata: {
              command: args.command,
              agent: subtaskAgent,
              description: commandBundle.description,
              mode: "subtask",
              scheduled: true,
              dispatched: true,
            },
          }
        }

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

async function findCommandBundle(projectRoot: string, commandName: string): Promise<CommandBundle | undefined> {
  if (!projectRoot) return undefined
  const discovery = await discoverCommandBundles({ projectRoot })
  return discovery.commands.find((command) => command.name === commandName)
}

function expandCommandArguments(commandBody: string, commandArguments: string): string {
  return commandBody.replaceAll("$ARGUMENTS", commandArguments)
}

function dispatchPromptAfterToolReturn(
  client: PluginInput["client"],
  request: Parameters<PluginInput["client"]["session"]["prompt"]>[0],
): void {
  setTimeout(() => {
    void client.session.prompt(request).catch((caughtError: unknown) => {
      const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
      console.error(`[Harness] Deferred slash command prompt dispatch failed: ${message}`)
    })
  }, DEFERRED_SUBTASK_DISPATCH_DELAY_MS)
}
