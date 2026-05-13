import type { PressureDecision } from "../../features/runtime-pressure/types.js"

/** Command bundle discovered from existing OpenCode command primitives. */
export type CommandBundle = {
  /** Command name derived from the primitive file name. */
  name: string
  /** Source kind for the discovered command. */
  source: "opencode-command"
  /** Absolute primitive file path for traceability. */
  filePath: string
  /** Command description from frontmatter. */
  description: string
  /** Optional agent hint from frontmatter. */
  agent?: string
  /** Raw command body. */
  body: string
}

/** Result of discovering command bundles. */
export type CommandDiscoveryResult = {
  /** Discovered command bundles. */
  commands: CommandBundle[]
  /** Discovery warnings emitted by primitive loading. */
  warnings: string[]
}

/** Command contract failure states understood by the route previewer. */
export type CommandFailureState = "missing_command" | "invalid_contract" | "pressure_blocked" | "context_overflow"

/** Contract analysis for one command bundle. */
export type CommandContractAnalysis = {
  /** Command name under analysis. */
  name: string
  /** True when the command has the required fields for routing preview. */
  valid: boolean
  /** Expected failure states for safe routing. */
  failureStates: CommandFailureState[]
  /** Arguments placeholder supported by the command body. */
  acceptsArguments: boolean
  /** Context fields required before execution can be implemented later. */
  contextNeeds: string[]
  /** Output contract currently supported by this phase. */
  outputShape: "route-preview"
}

/** Input for bounded context rendering. */
export type CommandContextRenderInput = {
  /** Command receiving the rendered context. */
  commandName: string
  /** Serializable context payload. */
  context?: unknown
  /** Maximum rendered character count. */
  maxCharacters?: number
}

/** Output from bounded context rendering. */
export type CommandContextRenderResult = {
  /** Command receiving the rendered context. */
  commandName: string
  /** Rendered bounded context. */
  rendered: string
  /** True when the rendered payload was truncated. */
  truncated: boolean
  /** Maximum applied to the rendered payload. */
  maxCharacters: number
}

/** Message accepted by the narrow command transformer. */
export type CommandMessage = {
  /** OpenCode-style message role. */
  role: "system" | "user" | "assistant"
  /** Message content. */
  content: string
}

/** Input for narrow command message transformation. */
export type CommandMessageTransformInput = {
  /** Command name to render as a slash command. */
  commandName: string
  /** Raw command arguments. */
  arguments?: string
  /** Existing messages to preserve. */
  messages?: CommandMessage[]
}

/** Output from narrow command message transformation. */
export type CommandMessageTransformResult = {
  /** Preserved messages plus the command invocation message. */
  messages: CommandMessage[]
  /** Transform exclusions that prevent broad system-transform regressions. */
  exclusions: string[]
}

/** Input for command route preview. */
export type CommandRoutePreviewInput = {
  /** Project root used for `.opencode/commands` discovery. */
  projectRoot: string
  /** Command to preview. */
  commandName: string
  /** Optional arguments included in transformed messages. */
  arguments?: string
  /** Optional bounded context payload. */
  context?: unknown
  /** Maximum context characters. */
  maxCharacters?: number
  /** Runtime pressure score. */
  score?: number
  /** Runtime pressure tier. */
  tier?: number
}

/** Result of command route preview. */
export type CommandRoutePreview = {
  /** Always false in Phase 59; no process spawning or command execution. */
  executable: false
  /** Pressure decision used for routing posture. */
  pressure: PressureDecision
  /** Route preview details. */
  route: {
    /** Phase 59 supports preview only. */
    action: "preview_only"
    /** Command name if found. */
    commandName: string
    /** Absolute file path if found. */
    filePath?: string
    /** Route status. */
    status: "ready" | "missing" | "blocked" | "deferred"
  }
  /** Contract analysis when the command exists. */
  contract?: CommandContractAnalysis
  /** Bounded context rendering result. */
  context: CommandContextRenderResult
  /** Narrow message transform result. */
  transform: CommandMessageTransformResult
}

/** Compact command summary returned by `list_commands`. */
export type CommandListEntry = {
  /** Command name (without leading slash). */
  name: string
  /** Human-readable command description. */
  description: string
  /** Optional agent hint from frontmatter. */
  agent?: string
  /** True when the command body contains `$ARGUMENTS`. */
  acceptsArguments: boolean
}

/** Result of listing available commands. */
export type CommandListResult = {
  /** Available commands sorted by name. */
  commands: CommandListEntry[]
  /** Total command count. */
  total: number
}

/** Tool/library action input for the command engine. */
export type CommandEngineActionInput = {
  /** Command-engine action selector. */
  action: "discover" | "analyze_contract" | "render_context" | "transform_messages" | "route_preview" | "list_commands"
  /** Optional command name for command-specific actions. */
  commandName?: string
  /** Optional command arguments. */
  arguments?: string
  /** Optional context payload. */
  context?: unknown
  /** Optional message list. */
  messages?: CommandMessage[]
  /** Maximum context characters. */
  maxCharacters?: number
  /** Runtime pressure score. */
  score?: number
  /** Runtime pressure tier. */
  tier?: number
}
