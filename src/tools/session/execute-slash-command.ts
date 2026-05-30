import { tool } from "@opencode-ai/plugin/tool"
import type { PluginInput } from "@opencode-ai/plugin"
import { promises as fs } from "node:fs"
import path from "node:path"
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
  stackOnSessionId?: string
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
      "Use `stackOnSessionId` to attach command execution onto an existing session (PREFERRED for retrying or continuing work). " +
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

        // Clone validated arguments to allow parsing flags and stripping them
        const executionArgs = { ...validated }
        let overrideAgent = executionArgs.agent
        let overrideSubtask = executionArgs.subtask

        if (executionArgs.arguments) {
          const agentFlagMatch = executionArgs.arguments.match(/--agent\s+([a-zA-Z0-9-]+)/i)
          if (agentFlagMatch) {
            overrideAgent = agentFlagMatch[1]
            executionArgs.arguments = executionArgs.arguments.replace(/--agent\s+[a-zA-Z0-9-]+/i, "").trim()
          }

          if (executionArgs.arguments.includes("--subtask")) {
            overrideSubtask = true
            executionArgs.arguments = executionArgs.arguments.replace(/--subtask/g, "").trim()
          } else if (executionArgs.arguments.includes("--no-subtask")) {
            overrideSubtask = false
            executionArgs.arguments = executionArgs.arguments.replace(/--no-subtask/g, "").trim()
          }
        }

        // Force refresh: always re-discover commands to pick up new/updated primitives
        const resolveResult = await resolveCommand({
          commandName: executionArgs.command,
          projectRoot,
          forceRefresh: true,
        })
        if (!resolveResult.success) {
          const suggestionsMsg = resolveResult.suggestions && resolveResult.suggestions.length > 0
            ? `\nSuggestions:\n${resolveResult.suggestions.map(s => `  /${s}`).join("\n")}`
            : ""
          return {
            output: describeError(new CommandNotFoundError(`Command not found: ${executionArgs.command}${suggestionsMsg}`)),
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
        let suggestedAgent: string | undefined
        if (!overrideAgent && !commandBundle?.agent && client && typeof client.app?.agents === "function") {
          const rawAgents = await getAppAgents(client)
          const normalizedAgents = rawAgents.map((a) => {
            if (typeof a === "string") return { name: a, description: "" }
            const obj = a as { name?: string; id?: string; description?: string }
            return { name: obj.name || obj.id || "", description: obj.description }
          }).filter((a) => a.name.length > 0)
          const agentResult = await selectAgent(executionArgs.command, normalizedAgents)
          if (agentResult.agent) {
            suggestedAgent = agentResult.agent
          }
        }

        // Determine agent for dispatch: explicit > frontmatter > suggested
        let resolvedAgent = overrideAgent || commandBundle?.agent || suggestedAgent

        // Enforce lineage/prefix alignment (e.g. hm-* commands must pair with hm-* agents)
        const prefixMatch = executionArgs.command.trim().replace(/^\//, "").match(/^([a-zA-Z0-9]+)-/)
        const commandPrefix = prefixMatch ? prefixMatch[1].toLowerCase() : null

        const FUNCTIONAL_VERBS = new Set([
          "plan", "verify", "validate", "audit", "review", "debug", "fix", "spec", "write", "doc", "research", "run"
        ])
        const isLineagePrefix = commandPrefix && !FUNCTIONAL_VERBS.has(commandPrefix)

        if (isLineagePrefix && resolvedAgent) {
          const agentLower = resolvedAgent.toLowerCase()
          const isAligned = agentLower.startsWith(commandPrefix + "-") || agentLower === commandPrefix
          if (!isAligned && client && typeof client.app?.agents === "function") {
            const rawAgents = await getAppAgents(client)
            const normalizedAgents = rawAgents.map((a) => {
              if (typeof a === "string") return { name: a, description: "" }
              const obj = a as { name?: string; id?: string; description?: string }
              return { name: obj.name || obj.id || "", description: obj.description }
            }).filter((a) => a.name.length > 0)
            const agentResult = await selectAgent(executionArgs.command, normalizedAgents)
            if (agentResult.agent) {
              resolvedAgent = agentResult.agent
            }
          }
        }

        // Validate agent format & existence if agent is used
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

        // Determine parentSessionID — stackOnSessionId takes precedence
        const resolvedParentSessionID = executionArgs.stackOnSessionId || executionArgs.parentSessionID || ctx.sessionID || ""

        // Resolve if we are in a child/sub session
        const resolved = await resolveSessionFile(projectRoot, ctx.sessionID)
        const isChildSession = resolved ? resolved.type === "child" : false

        // Check if subtask was explicitly passed in args
        const hasExplicitSubtask = overrideSubtask !== undefined
        const subtaskParam = overrideSubtask

        // Synthetic parent prompt: ONLY for validated.agent (explicit args.agent or parsed flag override).
        // commandBundle.agent (frontmatter) and suggestedAgent (selectAgent) are
        // metadata — they do NOT trigger Path 1. Commands with frontmatter agents
        // route through Path 3 (TUI pipeline), where OpenCode's command processing
        // reads the frontmatter and switches agent automatically.
        const syntheticPromptAgent =
          // Explicit subtask:false with explicit agent → Path 1 synthetic prompt
          (hasExplicitSubtask && overrideSubtask === false && overrideAgent)
            ? overrideAgent
          // No explicit subtask, explicit args.agent provided, no frontmatter subtask
          : (!hasExplicitSubtask && overrideAgent && commandBundle?.subtask !== true)
            ? overrideAgent
          : undefined

        if (syntheticPromptAgent) {
          const promptText = await expandCommandTemplate(commandBundle.body, executionArgs.arguments ?? "", projectRoot)
          dispatchCommand({
            client,
            sessionID: ctx.sessionID,
            agent: syntheticPromptAgent,
            // Restore to the calling agent after the target agent completes
            restoreAgent: ctx.agent || undefined,
            promptText,
            subtask: false,
            directory: ctx.directory,
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
          } as ToolResult
        }

        const shouldDispatchSubtask = isChildSession ? false : (subtaskParam ?? commandBundle?.subtask === true)
        if (shouldDispatchSubtask) {
          const subtaskAgent = resolvedAgent
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
          if (executionArgs.trackExecution && tracker?.pendingRegistry) {
            tracker.pendingRegistry.add({
              parentSessionID: resolvedParentSessionID,
              callID: ctx.messageID || `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              subagentType: subtaskAgent,
              tool: "execute-slash-command",
              timestamp: Date.now(),
            })
          }

          const promptText = await expandCommandTemplate(commandBundle.body, executionArgs.arguments ?? "", projectRoot)
          const dispatchResult = await dispatchCommand({
            client,
            sessionID: ctx.sessionID,
            agent: subtaskAgent,
            promptText,
            subtask: true,
            description: commandBundle.description,
            commandSource: executionArgs.commandSource,
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
        // Build the slash command text for TUI pipeline
        // NOTE: @agent prefix in prompt text does NOT work for agent override
        // Agent is passed via metadata/context, not prompt text
        const parts: string[] = []

        // The command itself — use resolved commandBundle.name, not validated.command
        // validated.command is the original input (e.g., "stats"), commandBundle.name
        // is the resolved name after fuzzy/substring matching (e.g., "gsd-stats")
        parts.push(`/${commandBundle.name}`)

        // Append arguments if any
        if (executionArgs.arguments) {
          parts.push(executionArgs.arguments)
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

        // If an agent was resolved (from selectAgent or command frontmatter),
        // use session.command() with agent override instead of the TUI pipeline.
        // This ensures the command runs under the correct agent.
        if (resolvedAgent) {
          setTimeout(async () => {
            try {
              await client.session.command({
                path: { id: ctx.sessionID },
                body: {
                  command: commandBundle.name,
                  arguments: validated.arguments ?? "",
                  agent: resolvedAgent,
                },
                ...(ctx.directory ? { query: { directory: ctx.directory } } : {}),
              })
            } catch (caughtError: unknown) {
              const message = caughtError instanceof Error ? caughtError.message : String(caughtError)
              console.error(`[Harness] session.command dispatch failed: ${message}`)
            }
          }, 50)

          return {
            output: [
              `✓ Command ${cmdDisplay} dispatched via SDK command API.`,
              `  Agent: ${resolvedAgent}`,
              suggestedAgent ? `  (agent suggested by intent: ${suggestedAgent})` : null,
            ].filter(Boolean).join("\n"),
            metadata: buildSuccessMetadata(
              args,
              validated,
              "session-command",
              resolvedParentSessionID,
              startTime,
              {
                command: commandBundle.name,
                agent: resolvedAgent,
                dispatched: true,
              }
            ),
            error: false,
          } as ToolResult
        }

        // No agent override — use TUI pipeline for basic command execution
        await client.tui.clearPrompt()
        await client.tui.appendPrompt({ body: { text: promptText } })
        await client.tui.submitPrompt()

        return {
          output: [
            `✓ Command ${cmdDisplay} dispatched to TUI prompt.`,
            `  Prompt text: ${promptText}`,
            `  The command will execute immediately after this tool call returns.`,
          ].filter(Boolean).join("\n"),
          metadata: buildSuccessMetadata(
            args,
            validated,
            "user-session",
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

export function resolvePhaseInfo(args: string) {
  const match = args.match(/\b(\d+)(?:\.(\d+))?(?:\.(\d+))?\b/)
  if (!match) {
    return {
      phaseId: "",
      paddedPhase: "",
      phaseName: "",
    }
  }
  const major = match[1]
  const minor = match[2]
  const patch = match[3]

  const segments = [major, minor, patch].filter(Boolean)
  const phaseId = segments.join(".")

  const paddedMajor = major.length === 1 ? `0${major}` : major
  const paddedSegments = [paddedMajor, minor, patch].filter(Boolean)
  const paddedPhase = paddedSegments.join(".")

  const cleanArgs = args.replace(/--\S+/g, "").trim()
  const phaseNameMatch = cleanArgs.match(/(?:phase\s*)?\b\d+(?:\.\d+)*\s*[-:]?\s*(.+)$/i)
  let phaseName = ""
  if (phaseNameMatch) {
    phaseName = phaseNameMatch[1].trim().replace(/[-_]+/g, " ")
  } else {
    phaseName = `Phase ${phaseId}`
  }

  return { phaseId, paddedPhase, phaseName }
}

async function resolveReferences(body: string, projectRoot: string): Promise<string> {
  const lines = body.split("\n")
  const resolvedLines: string[] = []

  for (const line of lines) {
    const match = line.match(/^\s*@(\S+)/)
    if (match) {
      const rawPath = match[1]
      let resolvedPath = rawPath
      if (!path.isAbsolute(rawPath)) {
        resolvedPath = path.resolve(projectRoot, rawPath)
      }
      try {
        const fileContent = await fs.readFile(resolvedPath, "utf-8")
        resolvedLines.push(`<reference path="${rawPath}">\n${fileContent}\n</reference>`)
      } catch (err) {
        resolvedLines.push(`<!-- Reference path not found: ${rawPath} -->`)
      }
    } else {
      resolvedLines.push(line)
    }
  }

  return resolvedLines.join("\n")
}

async function expandCommandTemplate(commandBody: string, commandArguments: string, projectRoot: string): Promise<string> {
  let expanded = await resolveReferences(commandBody, projectRoot)

  const { phaseId, paddedPhase, phaseName } = resolvePhaseInfo(commandArguments)

  expanded = expanded.replaceAll("$ARGUMENTS", commandArguments)
  expanded = expanded.replaceAll("$USER_PROMPT", commandArguments)
  expanded = expanded.replaceAll("$PHASE_ID", phaseId)
  expanded = expanded.replaceAll("$PADDED_PHASE", paddedPhase)
  expanded = expanded.replaceAll("$PHASE_NAME", phaseName)

  return expanded
}



