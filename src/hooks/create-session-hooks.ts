/**
 * Session hook factory.
 *
 * Produces the `experimental.session.compacting` hook and an `event` hook
 * that drives session-level auto-loop behavior on `session.idle`.
 *
 * Stripped in 14-01: compaction-checkpoint, injection-engine, governance-engine,
 * tasking/* removed. Auto-loop and parent-coordination code preserved but simplified.
 */
import {
  getContinuityStoragePath,
  getSessionContinuity,
} from "../lib/continuity.js"
import { asString, extractAssistantText, getNestedValue } from "../lib/helpers.js"
import {
  getEventSessionID,
  getSessionMessages,
} from "../lib/session-api.js"
import type { HookDependencies } from "./types.js"

type CompactingInput = { sessionID?: unknown }
type CompactingOutput = { context?: unknown }
type EventInput = { event?: unknown }

type AutoLoopState = {
  iterations: number
  lastMessageCount: number
  retryPending: boolean
  exhausted: boolean
}

const DEFAULT_AUTO_LOOP_CONFIG = {
  maxIterations: 5,
  completionSignal: "<promise>DONE</promise>",
  backoffMs: 1000,
} as const

/** Event types that permanently disable delegation-packet auto-loop retries. */
const TERMINAL_SESSION_EVENTS = new Set(["session.deleted", "session.error"])

export interface SessionHooks {
  event: (input: EventInput) => Promise<void>
  "experimental.session.compacting": (
    input: CompactingInput,
    output: CompactingOutput,
  ) => Promise<void>
}

function resolveAutoLoopConfig(deps: HookDependencies) {
  return {
    maxIterations: deps.autoLoopConfig?.maxIterations ?? DEFAULT_AUTO_LOOP_CONFIG.maxIterations,
    completionSignal:
      deps.autoLoopConfig?.completionSignal ?? DEFAULT_AUTO_LOOP_CONFIG.completionSignal,
    backoffMs: deps.autoLoopConfig?.backoffMs ?? DEFAULT_AUTO_LOOP_CONFIG.backoffMs,
  }
}

function getAutoLoopState(
  autoLoopStates: Map<string, AutoLoopState>,
  sessionID: string,
): AutoLoopState {
  const state = autoLoopStates.get(sessionID)
  if (state) {
    return state
  }

  const nextState: AutoLoopState = {
    iterations: 0,
    lastMessageCount: 0,
    retryPending: false,
    exhausted: false,
  }
  autoLoopStates.set(sessionID, nextState)
  return nextState
}

function buildAutoLoopPrompt(args: {
  iteration: number
  maxIterations: number
  completionSignal: string
  description: string
  constraints: string[]
  assistantText: string
}): string {
  const lines = [
    `<system_reminder>Auto-loop retry ${args.iteration}/${args.maxIterations}</system_reminder>`,
    "",
    `Your previous response did not include ${args.completionSignal}. Continue the current task from where you left off.`,
    `When the task is fully complete, emit exactly ${args.completionSignal}.`,
    "",
    "Task:",
    args.description,
  ]

  if (args.constraints.length > 0) {
    lines.push("", "Constraints:")
    for (const constraint of args.constraints) {
      lines.push(`- ${constraint}`)
    }
  }

  if (args.assistantText) {
    lines.push("", "Latest assistant response:", args.assistantText)
  }

  return lines.join("\n")
}

async function waitForRetry(ms: number, sleep: HookDependencies["sleep"]): Promise<void> {
  if (ms <= 0) {
    return
  }

  if (sleep) {
    await sleep(ms)
    return
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function createSessionHooks(deps: HookDependencies): SessionHooks {
  const { client, lifecycleManager, sleep, stateManager } = deps
  const autoLoopConfig = resolveAutoLoopConfig(deps)
  const autoLoopStates = new Map<string, AutoLoopState>()
  const terminalAutoLoopSessions = new Set<string>()

  return {
    event: async ({ event }: EventInput): Promise<void> => {
      const eventType = asString(getNestedValue(event, ["type"]))
      const sessionID = getEventSessionID(event)

      if (!eventType || !sessionID) {
        return
      }

      if (TERMINAL_SESSION_EVENTS.has(eventType)) {
        autoLoopStates.delete(sessionID)
        terminalAutoLoopSessions.add(sessionID)
        return
      }

      if (eventType !== "session.idle" || terminalAutoLoopSessions.has(sessionID)) {
        return
      }

      const continuity = getSessionContinuity(sessionID)
      if (!continuity) {
        return
      }

      // Auto-loop for delegation packets
      if (continuity.metadata.delegationPacket) {
        const state = getAutoLoopState(autoLoopStates, sessionID)
        if (state.retryPending || state.exhausted) {
          return
        }

        const messages = await getSessionMessages(client, sessionID)
        const assistantText = extractAssistantText(messages)
        if (assistantText.includes(autoLoopConfig.completionSignal)) {
          autoLoopStates.delete(sessionID)
          return
        }

        if (messages.length <= state.lastMessageCount) {
          return
        }

        if (state.iterations >= autoLoopConfig.maxIterations) {
          state.exhausted = true
          stateManager.addWarning(
            sessionID,
            `[Harness] Reached max auto-loop iterations (${autoLoopConfig.maxIterations}) for session ${sessionID}`,
          )
          autoLoopStates.set(sessionID, state)
          return
        }

        state.iterations += 1
        state.lastMessageCount = messages.length
        state.retryPending = true
        autoLoopStates.set(sessionID, state)

        try {
          await waitForRetry(autoLoopConfig.backoffMs, sleep)
          if (terminalAutoLoopSessions.has(sessionID)) {
            autoLoopStates.delete(sessionID)
            return
          }
          await lifecycleManager.requestAutoLoopRetry({
            sessionID,
            promptText: buildAutoLoopPrompt({
              iteration: state.iterations,
              maxIterations: autoLoopConfig.maxIterations,
              completionSignal: autoLoopConfig.completionSignal,
              description: continuity.metadata.description,
              constraints: continuity.metadata.constraints,
              assistantText,
            }),
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          stateManager.addWarning(sessionID, `[Harness] Auto-loop retry failed: ${message}`)
        } finally {
          state.retryPending = false
          if (!terminalAutoLoopSessions.has(sessionID)) {
            autoLoopStates.set(sessionID, state)
          }
        }
        return
      }

      // Parent auto-loop stripped in 14-01 clean slate — tasking/* removed
      // Will be restored in Plan 14-02 (DelegationManager)
    },

    "experimental.session.compacting": async (
      input: CompactingInput,
      output: CompactingOutput,
    ): Promise<void> => {
      const sessionID = asString(getNestedValue(input, ["sessionID"]))
      if (!sessionID) {
        return
      }

      const continuity = getSessionContinuity(sessionID)
      const lifecycle = lifecycleManager.getLifecycleSnapshot(sessionID)
      const autoLoopState = autoLoopStates.get(sessionID)

      output.context = Array.isArray(output.context) ? output.context : []

      if (lifecycle || autoLoopState) {
        const contextLines = ["Harness session context:"]

        if (lifecycle?.phase) {
          contextLines.push(`- lifecycle_phase: ${lifecycle.phase}`)
        }
        if (lifecycle?.runMode) {
          contextLines.push(`- lifecycle_run_mode: ${lifecycle.runMode}`)
        }
        if (lifecycle?.queue) {
          contextLines.push(`- lifecycle_queue: ${lifecycle.queue.active}/${lifecycle.queue.limit}`)
          contextLines.push(`- lifecycle_queue_pending: ${lifecycle.queue.pending}`)
        }
        if (lifecycle?.observation) {
          contextLines.push(`- lifecycle_signal: ${lifecycle.observation.source}`)
        }
        if (autoLoopState) {
          contextLines.push(
            `- auto_loop_iteration: ${autoLoopState.iterations}/${autoLoopConfig.maxIterations}`,
          )
          contextLines.push(`- auto_loop_exhausted: ${autoLoopState.exhausted}`)
        }

        ;(output.context as string[]).push(contextLines.join("\n"))
      }

      if (continuity) {
        ;(output.context as string[]).push(
          [
            "Harness continuity snapshot:",
            JSON.stringify(
              {
                session_id: continuity.sessionID,
                prompt_params: continuity.promptParams,
                tool_profile: continuity.toolProfile,
                metadata: continuity.metadata,
                lifecycle,
                storage: {
                  mode: "durable-file",
                  path: getContinuityStoragePath(),
                },
              },
              null,
              2,
            ),
          ].join("\n"),
        )
      }
    },
  }
}
