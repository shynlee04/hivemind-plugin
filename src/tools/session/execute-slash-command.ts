import { tool } from "@opencode-ai/plugin"
import type { PluginInput, ToolDefinition } from "@opencode-ai/plugin"
import { success, error } from "../../shared/tool-response.js"
import { renderToolResult } from "../../shared/tool-helpers.js"

/** Wrap a ToolResponse into the ToolResult format expected by tool(). */
function toToolResult<T>(response: { kind: string; message: string; data?: T; metadata?: Record<string, unknown> }) {
  return {
    output: renderToolResult(response),
    metadata: (response.metadata ?? {}) as Record<string, unknown>,
  }
}

/**
 * Creates the execute-slash-command tool.
 *
 * Dispatches OpenCode slash commands through the SDK-native `session.command()`
 * path as the primary mechanism, with three specialized dispatch modes:
 *
 * 1. **Direct command execution** — calls `client.session.command()` with the
 *    command name, arguments, optional agent, and optional model. Agent/model
 *    parameters trigger SDK-side agent switching with proper event emission.
 *
 * 2. **Subtask routing** — when the command's frontmatter has `subtask: true`,
 *    dispatches via `client.session.prompt()` with `SubtaskPartInput`, which
 *    creates a properly tracked child session.
 *
 * 3. **TUI fallback** — if the SDK path fails (session busy, queued, error),
 *    falls back to the TUI prompt pipeline (`clearPrompt → appendPrompt →
 *    submitPrompt`), preserving backward compatibility.
 *
 * ## Agent Switching Mechanisms
 *
 * - **Mechanism (a) — pass-agent:** When `agent` is provided, it is passed to
 *   `session.command()`, triggering an SDK-side agent switch with
 *   `SessionNextAgentSwitched` event.
 * - **Mechanism (b) — run-then-restore:** When `restore: true` is set, the
 *   tool caches `ctx.agent` before dispatch, executes the command under the
 *   target agent, then sends a follow-up `session.command()` to restore the
 *   prior agent.
 *
 * ## Preflight Check
 *
 * Before dispatching, the tool calls `client.command.list()` to verify the
 * command exists in the OpenCode command registry. Unknown commands return
 * a graceful error with the list of available commands.
 *
 * ## Standard Result Envelope
 *
 * All returns use `success()` / `error()` from `src/shared/tool-response.ts`
 * with `{ kind, message, data, metadata }` shape.
 *
 * @example
 * ```
 * // Basic command
 * execute-slash-command { command: "gsd-stats" }
 *
 * // Command with arguments
 * execute-slash-command { command: "hf-create", arguments: "skill my-new-skill" }
 *
 * // Agent switch (mechanism a)
 * execute-slash-command { command: "deep-research-synthesis-repomix", arguments: "vitest", agent: "hm-researcher" }
 *
 * // Agent switch and restore (mechanism b)
 * execute-slash-command { command: "plan", arguments: "refactor", agent: "hm-planner", restore: true }
 *
 * // Model override
 * execute-slash-command { command: "gsd-help", model: "anthropic/claude-sonnet-4-20250514" }
 * ```
 *
 * @see src/tools/hivemind/hivemind-command-engine.ts — CQRS read-side command discovery
 * @see src/shared/tool-response.ts — Standard result envelope
 *
 * @param client - The OpenCode SDK client instance (injected from plugin composition root).
 * @returns ToolDefinition for the execute-slash-command tool.
 */
export const createExecuteSlashCommandTool = (client: PluginInput["client"]): ToolDefinition => {
  return tool({
    description:
      "Executes an OpenCode slash command on the active session. " +
      "Dispatches via the SDK-native session.command() path with TUI fallback. " +
      "Supports agent switching (two mechanisms), model override, command preflight, " +
      "frontmatter-aware dispatch, subtask routing, and standard response envelope. " +
      "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
    args: {
      command: tool.schema.string().describe(
        "The command name without the leading slash (e.g., 'gsd-stats', 'hf-create', 'plan')",
      ),
      arguments: tool.schema.string().optional().describe(
        "Arguments string to pass to the command (e.g., 'my-new-skill'). Defaults to empty string.",
      ),
      agent: tool.schema.string().optional().describe(
        "Optional agent context override. Passed to session.command() for SDK-side agent switching. " +
        "When set, the TUI switches to the target agent with proper SessionNextAgentSwitched event. " +
        "Combine with restore: true for mechanism (b): run-under-agent-then-restore.",
      ),
      model: tool.schema.string().optional().describe(
        "Optional model override in 'providerID/modelID' format (e.g., 'anthropic/claude-sonnet-4-20250514'). " +
        "Passed to session.command() for SDK-side model selection.",
      ),
      restore: tool.schema.boolean().optional().describe(
        "When true and agent is set, runs mechanism (b): records current agent, " +
        "dispatches under the target agent, then restores the prior agent via a follow-up " +
        "session.command() call. Only effective when agent is also provided.",
      ),
    },
    async execute(args, ctx) {
      const sessionID = ctx.sessionID
      const currentAgent = ctx.agent

      ctx.metadata({
        title: `Executing /${args.command}${args.arguments ? ` ${args.arguments}` : ""}`,
        metadata: {
          command: args.command,
          ...(args.agent && { agent: args.agent }),
          ...(args.model && { model: args.model }),
          ...(args.restore && { restore: true }),
        },
      })

      // Step 1: Preflight — Command existence check (REQ-03)
      try {
        const commands = await client.command.list({
          query: { directory: ctx.directory },
        })
        const unwrappedCommands = Array.isArray(commands)
          ? commands
          : (commands as { data?: Array<{ name: string }> }).data ?? []

        const found = unwrappedCommands.find(
          (c: { name: string }) => c.name === args.command,
        )

        if (!found) {
          const available = unwrappedCommands.map(
            (c: { name: string }) => c.name,
          )
          return toToolResult(
            error(
              `Command not found: /${args.command}. Available commands: ${available.join(", ")}`,
              { availableCommands: available },
              { command: args.command },
            ),
          )
        }

        // Step 2: Frontmatter enrichment (REQ-04)
        const frontmatterAgent = (found as { agent?: string }).agent
        const frontmatterModel = (found as { model?: string }).model
        const frontmatterSubtask = (found as { subtask?: boolean }).subtask
        const effectiveAgent = args.agent || frontmatterAgent
        const effectiveModel = args.model || frontmatterModel

        // Step 3: Subtask routing (REQ-04 subtask)
        if (frontmatterSubtask === true) {
          try {
            const subtaskAgent = effectiveAgent ?? "assistant"
            const cmdTemplate = (found as { template?: string }).template ?? args.command
            const promptText = `${cmdTemplate}${args.arguments ? ` ${args.arguments}` : ""}`
            const subtaskDescription: string = (found as { description?: string }).description ?? ""
            await client.session.prompt({
              path: { id: sessionID },
              body: {
                agent: subtaskAgent,
                parts: [
                  {
                    type: "subtask" as const,
                    agent: subtaskAgent,
                    prompt: promptText,
                    description: subtaskDescription,
                  },
                ],
              },
              query: { directory: ctx.directory },
            })
            return toToolResult(
              success(
                `Subtask dispatched: /${args.command} → ${subtaskAgent}`,
                {
                  command: args.command,
                  agent: subtaskAgent,
                  dispatched: true,
                },
                { command: args.command, mode: "subtask" },
              ),
            )
          } catch (subtaskError: unknown) {
            const msg =
              subtaskError instanceof Error
                ? subtaskError.message
                : String(subtaskError)
            return toToolResult(
              error(
                `Subtask dispatch failed for /${args.command}: ${msg}`,
                { command: args.command },
                { command: args.command, mode: "subtask", error: msg },
              ),
            )
          }
        }

        // Step 4: Primary path — SDK session.command() (REQ-01)
        try {
          // Mechanism (b) — run-as-then-restore (REQ-02)
          if (args.restore && effectiveAgent && currentAgent) {
            await client.session.command({
              path: { id: sessionID },
              body: {
                command: args.command,
                arguments: args.arguments ?? "",
                agent: effectiveAgent,
                model: effectiveModel,
              },
              query: { directory: ctx.directory },
            })
            // Restore prior agent
            await client.session.command({
              path: { id: sessionID },
              body: {
                command: "",
                arguments: "",
                agent: currentAgent,
              },
              query: { directory: ctx.directory },
            })
            return toToolResult(
              success(
                `Command /${args.command} executed under ${effectiveAgent} and restored to ${currentAgent}.`,
                {
                  command: args.command,
                  agent: effectiveAgent,
                  restored: true,
                  priorAgent: currentAgent,
                },
                {
                  command: args.command,
                  mode: "agent-switch-restore",
                },
              ),
            )
          }

          // Mechanism (a) — simple agent switch via SDK
          await client.session.command({
            path: { id: sessionID },
            body: {
              command: args.command,
              arguments: args.arguments ?? "",
              ...(effectiveAgent && { agent: effectiveAgent }),
              ...(effectiveModel && { model: effectiveModel }),
            },
            query: { directory: ctx.directory },
          })

          const parts: string[] = [
            `✓ Command /${args.command} dispatched via SDK command path.`,
          ]
          if (effectiveAgent) {
            parts.push(`  Agent: ${effectiveAgent}`)
          }
          if (effectiveModel) {
            parts.push(`  Model: ${effectiveModel}`)
          }
          parts.push(
            "  The command will execute after this tool call returns.",
          )

          return toToolResult(
            success(
              parts.join("\n"),
              {
                command: args.command,
                agent: effectiveAgent ?? null,
                dispatched: true,
              },
              {
                command: args.command,
                mode: effectiveAgent
                  ? args.restore
                    ? "agent-switch-restore"
                    : "agent-switch"
                  : "direct",
              },
            ),
          )
        } catch (sdkError: unknown) {
          // Step 5: TUI fallback (REQ-01 hybrid approach)
          try {
            const parts: string[] = []
            if (effectiveAgent) parts.push(`@${effectiveAgent}`)
            parts.push(`/${args.command}`)
            if (args.arguments) parts.push(args.arguments)
            const promptText = parts.join(" ")

            await client.tui.clearPrompt()
            await client.tui.appendPrompt({
              body: { text: promptText },
            })
            await client.tui.submitPrompt()

            return toToolResult(
              success(
                [
                  `✓ Command /${args.command} dispatched via TUI fallback.`,
                  `  Prompt text: ${promptText}`,
                  `  The command will execute after this tool call returns.`,
                ].join("\n"),
                {
                  command: args.command,
                  promptText,
                  dispatched: true,
                  fallback: true,
                },
                {
                  command: args.command,
                  mode: "tui-fallback",
                },
              ),
            )
          } catch (tuiError: unknown) {
            const msg =
              tuiError instanceof Error
                ? tuiError.message
                : String(tuiError)
            return toToolResult(
              error(
                `Failed to dispatch /${args.command}: ${msg}`,
                { command: args.command },
                { command: args.command, error: msg },
              ),
            )
          }
        }
      } catch (preflightError: unknown) {
        const msg =
          preflightError instanceof Error
            ? preflightError.message
            : String(preflightError)
        return toToolResult(
          error(
            `Preflight check failed for /${args.command}: ${msg}`,
            { command: args.command },
            { command: args.command, error: msg },
          ),
        )
      }
    },
  })
}
