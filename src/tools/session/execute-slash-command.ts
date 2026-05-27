import { tool } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
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
import { isValidSessionID } from "../../features/session-tracker/types.js"
import { resolveCommand } from "./resolve-command.js"
import { dispatchCommand, validateAgentFormat, validateAgentExists } from "./dispatch-command.js"
import { getAppAgents } from "../../shared/app-api.js"
import { selectAgent } from "./semantic-agent-selector.js"

function getErrorName(err: unknown): string {
  if (err instanceof Error) return err.name
  if (err && typeof err === "object") {
    const maybeError = err as { name?: unknown }
    return typeof maybeError.name === "string" ? maybeError.name : ""
  }
  return ""
}

function getErrorType(err: unknown): string {
  const errName = getErrorName(err)
  if (err instanceof CommandNotFoundError || errName === "CommandNotFoundError") {
    return "not_found"
  }
  if (err instanceof AgentNotFoundError || errName === "AgentNotFoundError") {
    return "not_found"
  }
  if (err instanceof InvalidCommandError || errName === "InvalidCommandError") {
    return "missing_arg"
  }
  if (err instanceof DelegationContextError || errName === "DelegationContextError") {
    return "dispatch_failed"
  }
  if (err instanceof DelegationTimeoutError || errName === "DelegationTimeoutError") {
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
  const errMessage = err && typeof err === "object"
    ? String((err as Record<string, unknown>).message ?? "")
    : ""
  if (errMessage.includes("build") || errMessage.includes("compile")) {
    return "build_failed"
  }
  if (errMessage.includes("dispatch")) {
    return "dispatch_failed"
  }
  return "unexpected"
}

type ToolResult = {
  output: string
  metadata?: Record<string, unknown>
  error?: boolean
}

interface PendingRegistry {
  add: (entry: Record<string, unknown>) => void
}

/** Shape of raw tool input args before Zod validation. */
interface ExecuteInput {
  command: string
  arguments?: string
  agent?: string
  model?: string
  subtask?: boolean
  commandSource?: string
  trackExecution?: boolean
  parentSessionID?: string
  [key: string]: unknown
}

function buildSuccessMetadata(
  args: Record<string, unknown>,
  validated: Record<string, unknown>,
  mode: string,
  parentSessionID: string,
  startTime: Date,
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
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

export const createExecuteSlashCommandTool = (client: PluginInput["client"], sessionTracker?: unknown): ReturnType<typeof tool> => {
  return tool({
    description:
      "Executes an OpenCode slash command on the active session. " +
      "Three dispatch paths: (1) subtask:false + agent → synthetic parent prompt via session.prompt() " +
      "(agent runs one turn, then restored), (2) subtask:true + agent → subtask delegation via session.prompt(), " +
      "(3) no overrides → TUI appendPrompt/submitPrompt for basic command execution. " +
      "When agent is provided without subtask, defaults to subtask:false (parent session dispatch). " +
      "Use `hivemind-command-engine` with action `discover` or `list_commands` to find available commands first.",
    args: ExecuteSlashCommandSchema.shape as unknown as Parameters<typeof tool>[0]["args"],
    async execute(args: ExecuteInput, ctx) {
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
        const normalizedArgs: Record<string, unknown> = { ...args, command: inputCommand }

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
          } as ToolResult
        }
        const validated = parsed.data

        const projectRoot = ctx.directory ?? ""
        const resolveResult = await resolveCommand({
          commandName: validated.command,
          projectRoot,
        })
        if (!resolveResult.success) {
          const suggestionsMsg = resolveResult.suggestions && resolveResult.suggestions.length > 0
            ? `\nSuggestions:\n${resolveResult.suggestions.map(s => `  /${s}`).join("\n")}`
            : ""
          return {
            output: describeError(new CommandNotFoundError(`Command not found: ${validated.command}${suggestionsMsg}`)),
            metadata: {
              error: true,
              errorType: "not_found",
              command: args.command,
              suggestions: resolveResult.suggestions,
            },
            error: true,
          } as ToolResult
        }
        const commandBundle = resolveResult.commandBundle!

        // Stage 2: Resolve agent from intent if none explicitly provided
        if (!validated.agent && !commandBundle?.agent && client && typeof client.app?.agents === "function") {
          const rawAgents = await getAppAgents(client)
          const normalizedAgents = rawAgents.map((a) => {
            if (typeof a === "string") return { name: a, description: "" }
            const obj = a as { name?: string; id?: string; description?: string }
            return { name: obj.name || obj.id || "", description: obj.description }
          }).filter((a) => a.name.length > 0)
          const agentResult = await selectAgent(validated.command, normalizedAgents)
          if (agentResult.agent) {
            validated.agent = agentResult.agent
          }
        }

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
          if (!validateAgentFormat(resolvedAgent)) {
            return {
              output: describeError(new InvalidCommandError(`Invalid agent name format: ${resolvedAgent}`)),
              metadata: {
                error: true,
                errorType: "missing_arg",
                field: "agent",
                command: args.command,
              },
              error: true,
            } as ToolResult
          }

          if (client) {
            const exists = await validateAgentExists(resolvedAgent, client)
            if (!exists) {
              return {
                output: describeError(new AgentNotFoundError(`Agent not found: ${resolvedAgent}`)),
                metadata: {
                  error: true,
                  errorType: "not_found",
                  agent: resolvedAgent,
                  command: args.command,
                },
                error: true,
              } as ToolResult
            }
          }
        }

        if (syntheticPromptAgent) {
          const promptText = expandCommandArguments(commandBundle.body, validated.arguments ?? "")
          const dispatchResult = await dispatchCommand({
            client,
            sessionID: ctx.sessionID,
            agent: syntheticPromptAgent,
            promptText,
            subtask: false,
            directory: ctx.directory,
          })

          if (!dispatchResult.success) {
            return {
              output: dispatchResult.output ?? `Failed to dispatch ${cmdDisplay}`,
              metadata: {
                error: true,
                errorType: "dispatch_failed",
                command: args.command,
              },
              error: true,
            } as ToolResult
          }

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
          } as ToolResult
        }

        const shouldDispatchSubtask = subtaskParam ?? commandBundle?.subtask === true
        if (shouldDispatchSubtask) {
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
            } as ToolResult
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
            } as ToolResult
          }

          const tracker = sessionTracker as { pendingRegistry?: PendingRegistry } | undefined
          if (validated.trackExecution && tracker?.pendingRegistry) {
            tracker.pendingRegistry.add({
              parentSessionID: resolvedParentSessionID,
              callID: ctx.messageID || `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              subagentType: subtaskAgent,
              tool: "execute-slash-command",
              timestamp: Date.now(),
            })
          }

          const promptText = expandCommandArguments(commandBundle.body, validated.arguments ?? "")
          const dispatchResult = await dispatchCommand({
            client,
            sessionID: ctx.sessionID,
            agent: subtaskAgent,
            promptText,
            subtask: true,
            description: commandBundle.description,
            commandSource: validated.commandSource,
            directory: ctx.directory,
          })

          if (!dispatchResult.success) {
            return {
              output: dispatchResult.output ?? `Failed to dispatch ${cmdDisplay}`,
              metadata: {
                error: true,
                errorType: "dispatch_failed",
                command: args.command,
              },
              error: true,
            } as ToolResult
          }

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
          } as ToolResult
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
          const childDispatchResult = await dispatchCommand({
            client,
            sessionID: ctx.sessionID,
            promptText,
            subtask: false,
            directory: ctx.directory,
          })

          if (!childDispatchResult.success) {
            return {
              output: childDispatchResult.output ?? `Failed to dispatch ${cmdDisplay}`,
              metadata: {
                error: true,
                errorType: "dispatch_failed",
                command: args.command,
              },
              error: true,
            } as ToolResult
          }

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
          } as ToolResult
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
        } as ToolResult
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
        } as ToolResult
      }
    },
  })
}

function expandCommandArguments(commandBody: string, commandArguments: string): string {
  return commandBody.replaceAll("$ARGUMENTS", commandArguments)
}


