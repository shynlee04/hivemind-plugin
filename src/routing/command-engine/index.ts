import { homedir } from "node:os"
import path from "node:path"
import { loadPrimitives } from "../../features/bootstrap/primitive-loader.js"
import { detectRuntimePressure } from "../../features/runtime-pressure/index.js"
import type {
  CommandBundle,
  CommandContextRenderInput,
  CommandContextRenderResult,
  CommandContractAnalysis,
  CommandDiscoveryResult,
  CommandEngineActionInput,
  CommandListResult,
  CommandMessageTransformInput,
  CommandMessageTransformResult,
  CommandRoutePreview,
  CommandRoutePreviewInput,
} from "./types.js"

const DEFAULT_CONTEXT_LIMIT = 4_000
const MAX_CONTEXT_LIMIT = 16_000
const COMMAND_FAILURE_STATES = ["missing_command", "invalid_contract", "pressure_blocked", "context_overflow"] as const

/**
 * Discover command bundles from existing OpenCode command primitives.
 *
 * @param options - Project root containing `.opencode/commands`.
 * @returns Discovered command bundles and primitive-loader warnings.
 */
export async function discoverCommandBundles(options: { projectRoot: string; globalConfigPath?: string }): Promise<CommandDiscoveryResult> {
  const primitives = await loadPrimitives({
    projectRoot: options.projectRoot,
    globalConfigPath: options.globalConfigPath ?? resolveDefaultGlobalConfigPath(),
  })
  const commands = Array.from(primitives.commands.entries())
    .map(([name, command]): CommandBundle => ({
      name,
      source: "opencode-command",
      filePath: command.filePath,
      description: command.frontmatter.description,
      agent: command.frontmatter.agent,
      model: command.frontmatter.model,
      subtask: command.frontmatter.subtask,
      body: command.body,
      namespace: command.frontmatter.namespace,
      requires: command.frontmatter.requires,
      tools: command.frontmatter.tools,
    }))
    .sort((left, right) => left.name.localeCompare(right.name))

  return { commands, warnings: primitives.warnings }
}

function resolveDefaultGlobalConfigPath(): string {
  if (process.env.OPENCODE_GLOBAL_CONFIG_DIR) return process.env.OPENCODE_GLOBAL_CONFIG_DIR
  const configHome = process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config")
  return path.join(configHome, "opencode")
}

/**
 * Analyze the routing contract exposed by a command bundle.
 *
 * @param command - Discovered command bundle.
 * @returns Contract analysis with explicit failure states.
 */
export function analyzeCommandContract(command: CommandBundle): CommandContractAnalysis {
  const valid = command.name.length > 0 && command.description.length > 0 && command.body.length > 0
  return {
    name: command.name,
    valid,
    failureStates: [...COMMAND_FAILURE_STATES],
    acceptsArguments: command.body.includes("$ARGUMENTS"),
    contextNeeds: ["bounded-context", "pressure-decision"],
    outputShape: "route-preview",
  }
}

/**
 * Render command context into a bounded serialized payload.
 *
 * @param input - Command name, context payload, and bounds.
 * @returns Bounded context rendering result.
 */
export function renderCommandContext(input: CommandContextRenderInput, band?: string): CommandContextRenderResult {
  const maxCharacters = normalizeContextLimit(input.maxCharacters, band)
  const rawRendered = JSON.stringify({ commandName: input.commandName, context: input.context ?? {} }, null, 2)
  const truncated = rawRendered.length > maxCharacters
  return {
    commandName: input.commandName,
    rendered: truncated ? rawRendered.slice(0, maxCharacters) : rawRendered,
    truncated,
    maxCharacters,
  }
}

/**
 * Apply a narrow command-only message transform.
 *
 * @param input - Command invocation and existing messages.
 * @returns Transformed messages plus explicit broad-transform exclusions.
 */
export function transformCommandMessages(input: CommandMessageTransformInput): CommandMessageTransformResult {
  const args = input.arguments?.trim()
  const invocation = args ? `/${input.commandName} ${args}` : `/${input.commandName}`
  return {
    messages: [...(input.messages ?? []), { role: "user", content: invocation }],
    exclusions: ["broad-system-transform", "process-launch", "command-execution"],
  }
}

/**
 * Preview command routing without executing or spawning any process.
 *
 * @param input - Project root, command name, optional context, and pressure values.
 * @returns Route preview payload.
 */
export async function routeCommandPreview(input: CommandRoutePreviewInput): Promise<CommandRoutePreview> {
  const discovery = await discoverCommandBundles({ projectRoot: input.projectRoot })
  const command = discovery.commands.find((candidate) => candidate.name === input.commandName)
  const pressure = detectRuntimePressure({ score: input.score, tier: input.tier, toolName: "hivemind-command-engine" })
  const context = renderCommandContext(input, pressure.band)
  const transform = transformCommandMessages(input)
  const routeStatus = resolveRouteStatus(Boolean(command), pressure.outcome)

  return {
    executable: false,
    pressure,
    route: {
      action: "preview_only",
      commandName: input.commandName,
      filePath: command?.filePath,
      status: routeStatus,
    },
    contract: command ? analyzeCommandContract(command) : undefined,
    context,
    transform,
  }
}

/**
 * Execute a command-engine action through the public library API.
 *
 * @param projectRoot - Project root for discovery and routing.
 * @param input - Validated action input.
 * @returns Action-specific command-engine result.
 */
export async function executeCommandEngineAction(
  projectRoot: string,
  input: CommandEngineActionInput,
): Promise<CommandDiscoveryResult | CommandContractAnalysis | CommandContextRenderResult | CommandMessageTransformResult | CommandRoutePreview | CommandListResult> {
  switch (input.action) {
    case "discover":
      return discoverCommandBundles({ projectRoot })
    case "list_commands":
      return listCommands({ projectRoot })
    case "analyze_contract": {
      const command = await requireCommand(projectRoot, input.commandName)
      return analyzeCommandContract(command)
    }
    case "render_context": {
      const pressure = detectRuntimePressure({ score: input.score, tier: input.tier, toolName: "hivemind-command-engine" })
      return renderCommandContext({
        commandName: input.commandName ?? "unknown-command",
        context: input.context,
        maxCharacters: input.maxCharacters,
      }, pressure.band)
    }
    case "transform_messages":
      return transformCommandMessages({
        commandName: input.commandName ?? "unknown-command",
        arguments: input.arguments,
        messages: input.messages,
      })
    case "route_preview":
      if (!input.commandName) throw new Error("[Harness] commandName is required for route_preview")
      return routeCommandPreview({ projectRoot, ...input, commandName: input.commandName })
  }
}

/**
 * List available commands in a compact, agent-friendly format.
 *
 * Unlike `discover` which returns full command bundles with raw bodies,
 * this returns a minimal summary optimized for agent decision-making:
 * name, description, agent hint, and whether arguments are accepted.
 *
 * @param options - Project root containing `.opencode/commands`.
 * @returns Compact command listing with total count.
 */
export async function listCommands(options: { projectRoot: string }): Promise<CommandListResult> {
  const discovery = await discoverCommandBundles(options)
  const commands = discovery.commands.map((cmd) => ({
    name: cmd.name,
    description: cmd.description,
    ...(cmd.agent && { agent: cmd.agent }),
    acceptsArguments: cmd.body.includes("$ARGUMENTS"),
  }))
  return { commands, total: commands.length }
}

/**
 * Require a command bundle by name for command-specific actions.
 *
 * @param projectRoot - Project root for discovery.
 * @param commandName - Command name to find.
 * @returns Matching command bundle.
 * @throws {Error} When commandName is absent or missing.
 */
async function requireCommand(projectRoot: string, commandName?: string): Promise<CommandBundle> {
  if (!commandName) throw new Error("[Harness] commandName is required for analyze_contract")
  const discovery = await discoverCommandBundles({ projectRoot })
  const command = discovery.commands.find((candidate) => candidate.name === commandName)
  if (!command) throw new Error(`[Harness] Command not found: ${commandName}`)
  return command
}

/**
 * Normalize context bounds.
 *
 * @param requestedLimit - Untrusted requested character limit.
 * @returns Safe character limit.
 */
function normalizeContextLimit(requestedLimit?: number, band?: string): number {
  let baseLimit = DEFAULT_CONTEXT_LIMIT
  if (requestedLimit !== undefined && Number.isFinite(requestedLimit)) {
    baseLimit = requestedLimit
  }

  let maxLimit = MAX_CONTEXT_LIMIT
  if (band === "advisory") {
    maxLimit = 8_000
  } else if (band === "gated") {
    maxLimit = 4_000
  } else if (band === "blocking") {
    maxLimit = 2_000
  }

  return Math.max(1, Math.min(maxLimit, Math.trunc(baseLimit)))
}

/**
 * Resolve route status from command presence and pressure outcome.
 *
 * @param commandFound - True when the command exists.
 * @param outcome - Phase 57 pressure outcome.
 * @returns Route status for preview consumers.
 */
function resolveRouteStatus(commandFound: boolean, outcome: string): CommandRoutePreview["route"]["status"] {
  if (!commandFound) return "missing"
  if (outcome === "block" || outcome === "require_approval") return "blocked"
  if (outcome === "defer") return "deferred"
  return "ready"
}

export type * from "./types.js"
