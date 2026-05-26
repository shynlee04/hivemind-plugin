import { tool } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import { discoverCommandBundles } from "../../routing/command-engine/index.js"
import type { CommandBundle } from "../../routing/command-engine/types.js"
import { resolveSessionFile } from "./session-resolver.js"
import { ExecuteSlashCommandSchema } from "../../schema-kernel/commands.schema.js"
import {
  CommandNotFoundError,
  AgentNotFoundError,
  DelegationTimeoutError,
  InvalidCommandError,
  DelegationContextError,
} from "../../shared/errors/commands.js"
import { describeError } from "../../shared/helpers.js"
import { randomUUID } from "node:crypto"
import { getAppAgents } from "../../shared/app-api.js"
import { isValidSessionID } from "../../features/session-tracker/types.js"

const DEFERRED_SUBTASK_DISPATCH_DELAY_MS = 50

function getErrorType(err: unknown): string {
  if (err instanceof CommandNotFoundError || (err && (err as any).name === "CommandNotFoundError")) {
    return "not_found"
  }
  if (err instanceof AgentNotFoundError || (err && (err as any).name === "AgentNotFoundError")) {
    return "not_found"
  }
  if (err instanceof InvalidCommandError || (err && (err as any).name === "InvalidCommandError")) {
    return "missing_arg"
  }
  if (err instanceof DelegationContextError || (err && (err as any).name === "DelegationContextError")) {
    return "dispatch_failed"
  }
  if (err instanceof DelegationTimeoutError || (err && (err as any).name === "DelegationTimeoutError")) {
    return "dispatch_failed"
  }
  if (err instanceof Error) {
    if (err.message.includes("build") || err.message.includes("compile")) {
      return "build_failed"
    }
    if (err.message.includes("dispatch")) {
      return "dispatch_failed"
    }
    return "runtime"
  }
  return "unexpected"
}

function buildSuccessMetadata(
  args: any,
  validated: any,
  mode: string,
  parentSessionID: string,
  startTime: Date,
  extra: Record<string, any> = {}
) {
  const endTime = new Date()
  return {
    commandSource: validated.commandSource,
    id: randomUUID(),
    commandStart: startTime.toISOString(),
    commandEnd: endTime.toISOString(),
    commandDuration: endTime.getTime() - startTime.getTime(),
    trackExecution: validated.trackExecution,
    command: args.command,
    agent: validated.agent || undefined,
    model: validated.model || undefined,
    mode,
    parentSessionID,
    ...extra,
  }
}

/**
 * Creates the execute-slash-command tool.
 *
 * Dispatches a slash command via one of three paths depending on input:
 *
 * 1. **Synthetic parent prompt** (`subtask: false` + `agent`): Calls
 *    `session.prompt({ agent, parts: [{ type: "text", text }] })` after
 *    tool return. The target agent runs one turn in the parent session,
 *    then the original agent is restored. Requires `mode: all` agents.
 *
 * 2. **Subtask dispatch** (`subtask: true` + `agent`): Calls
 *    `session.prompt({ agent, parts: [{ type: "subtask", agent, prompt }] })`
 *    after tool return. Creates a child/delegation session (proven Phase 21.1).
 *
 * 3. **TUI pipeline** (no overrides): Uses `tui.appendPrompt + tui.submitPrompt`
 *    to inject `/command args` into the TUI prompt buffer.
 *
 * The `agent` and `subtask` fields are added on-the-fly per invocation.
 * When `agent` is provided without `subtask`, defaults to `subtask: false`
 * (parent session dispatch).
 *
 * @example
 * ```
 * // Basic command execution (no agent override)
 * execute-slash-command { command: "gsd-stats", arguments: "" }
 *
 * // Synthetic parent prompt (agent runs one turn in parent session)
 * execute-slash-command { command: "gsd-stats", agent: "gsd-executor" }
 *
 * // Explicit subtask dispatch
 * execute-slash-command { command: "gsd-stats", agent: "gsd-executor", subtask: true }
 *
 * // Command with model override
 * execute-slash-command { command: "plan", arguments: "refactor auth module", model: "anthropic/claude-sonnet-4-20250514" }
 * ```
 *
 * @see src/tools/hivemind/hivemind-command-engine.ts — discovery companion (CQRS read-side)
 * @see src/routing/command-engine/index.ts — command engine core
 *
 * @param client - The OpenCode SDK client instance (injected from plugin composition root).
 * @param sessionTracker - Optional session tracker instance for tracking in-flight commands.
 * @returns ToolDefinition for the execute-slash-command tool.
 */
export const createExecuteSlashCommandTool = (client: PluginInput["client"], sessionTracker?: any): ReturnType<typeof tool> => {
  return tool({
    description:
      "Executes an OpenCode slash command on the active session. " +
      "Three dispatch paths: (1) subtask:false + agent → synthetic parent prompt via session.prompt() " +
      "(agent runs one turn, then restored), (2) subtask:true + agent → subtask delegation via session.prompt(), " +
      "(3) no overrides → TUI appendPrompt/submitPrompt for basic command execution. " +
      "When agent is provided without subtask, defaults to subtask:false (parent session dispatch). " +
      "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
    args: ExecuteSlashCommandSchema.shape as any,
    async execute(args: any, ctx) {
      const cmdDisplay = `/${args.command}${args.arguments ? ` ${args.arguments}` : ""}`
      ctx.metadata({
        title: `Executing ${cmdDisplay}`,
        metadata: {
          command: args.command,
          ...(args.agent && { agent: args.agent }),
          ...(args.model && { model: args.model }),
        },
      })

      const startTime = new Date()

      try {
        // Normalize command name for schema validation compatibility
        const inputCommand = typeof args.command === "string" ? args.command.toLowerCase().replace(/_/g, "-") : args.command
        const normalizedArgs = { ...args, command: inputCommand }

        // Validate inputs using safeParse
        const parsed = ExecuteSlashCommandSchema.safeParse(normalizedArgs)
        if (!parsed.success) {
          const firstIssue = parsed.error.issues[0]
          return {
            output: describeError(new InvalidCommandError(parsed.error.message)),
            metadata: {
              error: true,
              errorType: "missing_arg",
              field: firstIssue ? String(firstIssue.path[0] || "command") : "command",
              cause: parsed.error.issues,
              command: args.command,
            },
            error: true,
          } as any
        }
        const validated = parsed.data

        const projectRoot = ctx.directory ?? ""
        const commandBundle = await findCommandBundle(projectRoot, validated.command)

        // Check if subtask was explicitly passed in args
        const hasExplicitSubtask = "subtask" in args
        const subtaskParam = hasExplicitSubtask ? validated.subtask : undefined

        const resolvedSubtask = subtaskParam ?? (validated.agent ? false : undefined)
        const syntheticPromptAgent = resolvedSubtask === false ? validated.agent || commandBundle?.agent : undefined

        // Determine parentSessionID
        const resolvedParentSessionID = validated.parentSessionID || ctx.sessionID || ""

        // Validate agent format & existence if agent is used
        const resolvedAgent = validated.agent || commandBundle?.agent
        if (resolvedAgent) {
          if (!/^[a-z][a-z0-9-]*$/.test(resolvedAgent)) {
            return {
              output: describeError(new InvalidCommandError(`Invalid agent name format: ${resolvedAgent}`)),
              metadata: {
                error: true,
                errorType: "missing_arg",
                field: "agent",
                command: args.command,
              },
              error: true,
            } as any
          }

          // Safety validation against app agents registry if available
          if (client && (client as any).app && typeof (client as any).app.agents === "function") {
            try {
              const appAgents = await getAppAgents(client)
              const agentNames = appAgents.map((a: any) => typeof a === "string" ? a : (a && typeof a.id === "string" ? a.id : ""))
              if (!agentNames.includes(resolvedAgent)) {
                return {
                  output: describeError(new AgentNotFoundError(`Agent not found: ${resolvedAgent}`)),
                  metadata: {
                    error: true,
                    errorType: "not_found",
                    agent: resolvedAgent,
                    command: args.command,
                  },
                  error: true,
                } as any
              }
            } catch (err) {
              // Safety fallback: ignore errors from app.agents() if it fails
            }
          }
        }

        if (syntheticPromptAgent) {
          if (!commandBundle) {
            return {
              output: describeError(new CommandNotFoundError(`Command not found: ${validated.command}`)),
              metadata: {
                error: true,
                errorType: "not_found",
                command: args.command,
              },
              error: true,
            } as any
          }

          const promptText = expandCommandArguments(commandBundle.body, validated.arguments ?? "")
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
              "  Note: synthetic parent prompt creates a ## USER turn in the session body. Agent will be restored after one turn.",
            ].join("\n"),
            metadata: buildSuccessMetadata(
              args,
              validated,
              "synthetic-parent-prompt",
              resolvedParentSessionID,
              startTime,
              {
                agent: syntheticPromptAgent,
                description: commandBundle.description,
                scheduled: true,
                dispatched: true,
              }
            ),
            error: false,
          } as any
        }

        const shouldDispatchSubtask = subtaskParam ?? commandBundle?.subtask === true
        if (shouldDispatchSubtask) {
          if (!commandBundle) {
            return {
              output: describeError(new CommandNotFoundError(`Command not found: ${validated.command}`)),
              metadata: {
                error: true,
                errorType: "not_found",
                command: args.command,
              },
              error: true,
            } as any
          }
          const subtaskAgent = validated.agent || commandBundle.agent
          if (!subtaskAgent) {
            return {
              output: describeError(new InvalidCommandError(`command has subtask: true but no agent was provided or defined in frontmatter`)),
              metadata: {
                error: true,
                errorType: "bad_request",
                command: args.command,
              },
              error: true,
            } as any
          }

          // Validate parentSessionID for delegation context
          if (!resolvedParentSessionID || !isValidSessionID(resolvedParentSessionID)) {
            return {
              output: describeError(new DelegationContextError("Parent session ID is missing or invalid for delegation context")),
              metadata: {
                error: true,
                errorType: "dispatch_failed",
                parentSessionID: resolvedParentSessionID,
                command: args.command,
              },
              error: true,
            } as any
          }

          if (validated.trackExecution && sessionTracker?.pendingRegistry) {
            sessionTracker.pendingRegistry.add({
              parentSessionID: resolvedParentSessionID,
              callID: ctx.messageID || `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              subagentType: subtaskAgent,
              tool: "execute-slash-command",
              timestamp: Date.now(),
            })
          }

          const promptText = expandCommandArguments(commandBundle.body, validated.arguments ?? "")
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
                  parentSessionID: resolvedParentSessionID,
                  commandSource: validated.commandSource,
                } as any,
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
            metadata: buildSuccessMetadata(
              args,
              validated,
              "subtask",
              resolvedParentSessionID,
              startTime,
              {
                agent: subtaskAgent,
                description: commandBundle.description,
                scheduled: true,
                dispatched: true,
              }
            ),
            error: false,
          } as any
        }

        const resolved = await resolveSessionFile(projectRoot, ctx.sessionID)
        const isChildSession = resolved ? resolved.type === "child" : false

        // Build the slash command text exactly as a user would type it in the TUI
        // Format: [@agent] [/command] [arguments]
        const parts: string[] = []

        // Prepend agent override if specified
        if (validated.agent) {
          parts.push(`@${validated.agent}`)
        }

        // The command itself
        parts.push(`/${validated.command}`)

        // Append arguments if any
        if (validated.arguments) {
          parts.push(validated.arguments)
        }

        const promptText = parts.join(" ")

        if (isChildSession) {
          // Bypassing TUI pipeline for child sessions to avoid global prompt clearing and workspace interference
          dispatchPromptAfterToolReturn(client, {
            path: { id: ctx.sessionID },
            body: {
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
              `✓ Command ${cmdDisplay} dispatched directly to child session ${ctx.sessionID} (bypassed TUI).`,
              `  Prompt text: ${promptText}`,
              `  The command will execute immediately after this tool call returns.`,
              validated.agent ? `  Agent: ${validated.agent}` : null,
              validated.model ? `  Model: ${validated.model}` : null,
            ].filter(Boolean).join("\n"),
            metadata: buildSuccessMetadata(
              args,
              validated,
              "session-prompt",
              resolvedParentSessionID,
              startTime,
              {
                promptText,
                dispatched: true,
              }
            ),
            error: false,
          } as any
        }

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
            validated.agent ? `  Agent: ${validated.agent}` : null,
            validated.model ? `  Model: ${validated.model}` : null,
          ].filter(Boolean).join("\n"),
          metadata: buildSuccessMetadata(
            args,
            validated,
            validated.subtask ? "subtask" : "user-session",
            resolvedParentSessionID,
            startTime,
            {
              promptText,
              dispatched: true,
            }
          ),
          error: false,
        } as any
      } catch (err: unknown) {
        const msg = describeError(err)
        const errorType = getErrorType(err)

        return {
          output: `✗ Failed to dispatch ${cmdDisplay}: ${msg}`,
          metadata: {
            error: true,
            errorType,
            command: args.command,
            message: msg,
            cause: err,
          },
          error: true,
        } as any
      }
    },
  })
}

interface CachedDiscovery {
  commands: CommandBundle[]
  timestamp: number
}

const discoveryCache = new Map<string, CachedDiscovery>()
const CACHE_TTL_MS = 5000

async function findCommandBundle(projectRoot: string, commandName: string): Promise<CommandBundle | undefined> {
  if (!projectRoot) return undefined
  const now = Date.now()
  const cached = discoveryCache.get(projectRoot)
  let commands: CommandBundle[]
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    commands = cached.commands
  } else {
    const discovery = await discoverCommandBundles({ projectRoot })
    commands = discovery.commands
    discoveryCache.set(projectRoot, { commands, timestamp: now })
  }

  // Exact match first
  const exact = commands.find((command) => command.name === commandName)
  if (exact) return exact

  // Case-insensitive, hyphen/underscore normalized comparison
  const normalizedSearch = commandName.toLowerCase().replace(/[-_]/g, "")
  const fuzzy = commands.find((command) => {
    const normalizedCandidate = command.name.toLowerCase().replace(/[-_]/g, "")
    return normalizedCandidate === normalizedSearch
  })
  if (fuzzy) return fuzzy

  // Try substring prefix/suffix matching if still not found
  return commands.find((command) => {
    const candidate = command.name.toLowerCase()
    const search = commandName.toLowerCase()
    return candidate.includes(search) || search.includes(candidate)
  })
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

