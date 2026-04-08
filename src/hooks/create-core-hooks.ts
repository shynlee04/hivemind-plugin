/**
 * Core hook factory.
 *
 * Produces the `event`, `messages.transform`, and `shell.env` hooks that
 * route SDK events to the lifecycle manager and delegate message
 * transformation to the existing messages-transform module.
 */
import { asString, getNestedValue, isObject } from "../lib/helpers.js"
import {
  evaluateInjections,
  hasAnyInjection,
  INJECTION_CANDIDATE_IDS,
} from "../lib/injection-engine.js"
import { getSessionContinuity, getSessionRecoveryState } from "../lib/continuity.js"
import { listGovernanceViolations } from "../lib/governance-engine.js"
import { getEventSessionID } from "../lib/session-api.js"
import { transformMessages } from "./messages-transform.js"
import type { HookDependencies } from "./types.js"

// ---------------------------------------------------------------------------
// Hook return shape
// ---------------------------------------------------------------------------

type EventInput = { event?: unknown }
type MessagesInput = { sessionID?: string; messages?: Array<{ role: string; content: string }> }
type MessagesOutput = { messages: Array<{ role: string; content: string }> }
type SystemInput = { sessionID?: string }
type SystemOutput = { system?: unknown }
type ShellEnvOutput = { env?: unknown }

function buildInjectionGovernance(sessionID: string) {
  const blockingViolation = listGovernanceViolations().find(
    (violation) => violation.sessionID === sessionID && violation.actionType === "block",
  )

  if (!blockingViolation) {
    return undefined
  }

  return {
    blockedInjections: [...INJECTION_CANDIDATE_IDS],
    reasonByInjectionID: Object.fromEntries(
      INJECTION_CANDIDATE_IDS.map((id) => [id, blockingViolation.message]),
    ),
  }
}

function formatRuntimeInjectionBlock(args: {
  phase: "session-start" | "compaction"
  rules: string[]
  commands: string[]
  skills: string[]
  tools: string[]
}): string {
  const lines = [`<harness_runtime_injection phase="${args.phase}">`]

  if (args.rules.length > 0) {
    lines.push("Rules:")
    for (const rule of args.rules) {
      lines.push(`- ${rule}`)
    }
  }
  if (args.commands.length > 0) {
    lines.push("Commands:")
    for (const command of args.commands) {
      lines.push(`- ${command}`)
    }
  }
  if (args.skills.length > 0) {
    lines.push("Skills:")
    for (const skill of args.skills) {
      lines.push(`- ${skill}`)
    }
  }
  if (args.tools.length > 0) {
    lines.push("Tools:")
    for (const tool of args.tools) {
      lines.push(`- ${tool}`)
    }
  }

  lines.push("</harness_runtime_injection>")
  return lines.join("\n")
}

export interface CoreHooks {
  event: (input: EventInput) => Promise<void>
  "system.transform": (input: SystemInput, output: SystemOutput) => Promise<void>
  "experimental.chat.system.transform": (input: SystemInput, output: SystemOutput) => Promise<void>
  "messages.transform": (
    input: MessagesInput,
    output: MessagesOutput,
  ) => Promise<void>
  "shell.env": (input: Record<string, unknown>, output: ShellEnvOutput) => Promise<void>
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates the core hooks using the provided dependency bundle.
 *
 * @param deps - Dependency bundle containing the lifecycle manager
 * @returns Object with `event`, `messages.transform`, and `shell.env` handlers
 */
export function createCoreHooks(deps: HookDependencies): CoreHooks {
  const { lifecycleManager } = deps
  const eventObservers = deps.eventObservers ?? []

  const handleSystemTransform = async (
    input: SystemInput,
    output: SystemOutput,
  ): Promise<void> => {
    const sessionID = input.sessionID
    if (!sessionID) {
      return
    }

    const continuity = getSessionContinuity(sessionID)
    if (!continuity) {
      return
    }

    const evaluation = evaluateInjections({
      sessionID,
      phase: "session-start",
      agent: continuity.promptParams.agent,
      category: continuity.promptParams.category,
      delegation: continuity.metadata.delegation,
      route: continuity.metadata.route,
      recovery: getSessionRecoveryState(sessionID),
      governance: buildInjectionGovernance(sessionID),
    })

    if (!hasAnyInjection(evaluation.injections)) {
      return
    }

    output.system = Array.isArray(output.system) ? output.system : []
    ;(output.system as string[]).push(
      formatRuntimeInjectionBlock({
        phase: "session-start",
        ...evaluation.injections,
      }),
    )
  }

  return {
    event: async ({ event }: EventInput): Promise<void> => {
      const eventType = asString(getNestedValue(event, ["type"]))
      const sessionID = getEventSessionID(event)

      if (!eventType || !sessionID) {
        return
      }

      lifecycleManager.handleEvent({ event, eventType, sessionID })

      for (const observer of eventObservers) {
        await observer({ event })
      }
    },

    "system.transform": handleSystemTransform,

    "experimental.chat.system.transform": handleSystemTransform,

    "messages.transform": async (
      input: MessagesInput,
      output: MessagesOutput,
    ): Promise<void> => {
      const sessionID = input.sessionID
      if (!sessionID) {
        return
      }
      const messages = input.messages ?? []
      const transformed = transformMessages(messages, sessionID)
      output.messages = transformed
    },

    "shell.env": async (
      _input: Record<string, unknown>,
      output: ShellEnvOutput,
    ): Promise<void> => {
      output.env = {
        ...(isObject(output.env) ? output.env : {}),
        CI: "true",
        GIT_TERMINAL_PROMPT: "0",
        NO_COLOR: "1",
        TERM: "dumb",
      }
    },
  }
}
