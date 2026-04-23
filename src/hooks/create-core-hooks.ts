/**
 * Core hook factory.
 *
 * Produces the `event`, `messages.transform`, and `shell.env` hooks that
 * route SDK events to the lifecycle manager and delegate message
 * transformation to the existing messages-transform module.
 *
 * Stripped in 14-01: injection-engine, governance-engine, pending-notifications removed.
 */
import { asString, getNestedValue, isObject } from "../lib/helpers.js"
import { getSessionContinuity, patchSessionContinuity } from "../lib/continuity.js"
import { replayPendingNotifications } from "../lib/notification-handler.js"
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

  const replayPendingNotificationsForEvent = async (
    sessionID: string,
    eventType: string,
  ): Promise<void> => {
    const continuity = getSessionContinuity(sessionID)
    const pendingNotifications = continuity?.metadata.pendingNotifications ?? []
    if (pendingNotifications.length === 0) {
      return
    }

    const shouldReplay =
      (eventType === "session.created" && continuity?.metadata.lifecycle?.phase === "created") ||
      eventType === "session.updated"

    if (!shouldReplay) {
      return
    }

    try {
      const delivered = await replayPendingNotifications(deps.client, sessionID, pendingNotifications)
      if (delivered) {
        patchSessionContinuity(sessionID, { pendingNotifications: [] })
      }
    } catch {
      // Best-effort replay
    }
  }

  return {
    event: async ({ event }: EventInput): Promise<void> => {
      const eventType = asString(getNestedValue(event, ["type"]))
      const sessionID = getEventSessionID(event)

      if (!eventType || !sessionID) {
        return
      }

      lifecycleManager.handleEvent({ event, eventType, sessionID })
      await replayPendingNotificationsForEvent(sessionID, eventType)

      for (const observer of eventObservers) {
        await observer({ event })
      }
    },

    "system.transform": async (
      _input: SystemInput,
      _output: SystemOutput,
    ): Promise<void> => {
      // System injection stripped in 14-01 clean slate
      // Will be restored in Plan 14-02 (DelegationManager)
    },

    "experimental.chat.system.transform": async (
      _input: SystemInput,
      _output: SystemOutput,
    ): Promise<void> => {
      // No-op stub during clean slate
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
