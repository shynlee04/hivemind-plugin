/**
 * Core hook factory.
 *
 * Produces the `event`, `messages.transform`, and `shell.env` hooks that
 * route SDK events to the lifecycle manager and delegate message
 * transformation to the existing messages-transform module.
 */
import { asString, getNestedValue, isObject } from "../lib/helpers.js"
import { getEventSessionID } from "../lib/session-api.js"
import { transformMessages } from "./messages-transform.js"
import type { HookDependencies } from "./types.js"

// ---------------------------------------------------------------------------
// Hook return shape
// ---------------------------------------------------------------------------

type EventInput = { event?: unknown }
type MessagesInput = { sessionID?: string; messages?: Array<{ role: string; content: string }> }
type MessagesOutput = { messages: Array<{ role: string; content: string }> }
type ShellEnvOutput = { env?: unknown }

export interface CoreHooks {
  event: (input: EventInput) => Promise<void>
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
