/**
 * Session hook factory.
 *
 * Produces the `experimental.session.compacting` hook that injects checkpointed
 * harness state into compaction context and an `event` hook that drives
 * session-level auto-loop behavior on `session.idle`.
 */
import {
  captureCheckpoint,
  formatCheckpointContext,
} from "../lib/compaction-checkpoint.js"
import {
  getContinuityStoragePath,
  getSessionContinuity,
  getSessionRecoveryState,
} from "../lib/continuity.js"
import { asString, getNestedValue } from "../lib/helpers.js"
import {
  evaluateInjections,
  hasAnyInjection,
  INJECTION_CANDIDATE_IDS,
} from "../lib/injection-engine.js"
import { listGovernanceViolations } from "../lib/governance-engine.js"
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

function extractAssistantText(messages: unknown[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    const role =
      asString(getNestedValue(message, ["info", "role"])) ??
      asString(getNestedValue(message, ["role"]))

    if (role !== "assistant") {
      continue
    }

    const parts = getNestedValue(message, ["parts"])
    if (!Array.isArray(parts)) {
      return ""
    }

    return parts
      .filter((part) => getNestedValue(part, ["type"]) === "text")
      .map((part) => asString(getNestedValue(part, ["text"])) ?? "")
      .join("")
      .trim()
  }

  return ""
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

  return {
    event: async ({ event }: EventInput): Promise<void> => {
      const eventType = asString(getNestedValue(event, ["type"]))
      const sessionID = getEventSessionID(event)

      if (!eventType || !sessionID) {
        return
      }

      if (eventType !== "session.idle") {
        return
      }

      const continuity = getSessionContinuity(sessionID)
      if (!continuity) {
        return
      }

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
        autoLoopStates.set(sessionID, state)
      }
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
      const checkpoint = captureCheckpoint(sessionID, stateManager, {
        tools: continuity?.promptParams.tools ?? [],
      })
      lifecycleManager.recordCompactionCheckpoint(sessionID, checkpoint)
      const autoLoopState = autoLoopStates.get(sessionID)

      output.context = Array.isArray(output.context) ? output.context : []
      ;(output.context as string[]).push(formatCheckpointContext(checkpoint))

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
        const injectionEvaluation = evaluateInjections({
          sessionID,
          phase: "compaction",
          agent: continuity.promptParams.agent,
          category: continuity.promptParams.category,
          delegation: continuity.metadata.delegation,
          route: continuity.metadata.route,
          recovery: getSessionRecoveryState(sessionID),
          governance: buildInjectionGovernance(sessionID),
        })

        if (hasAnyInjection(injectionEvaluation.injections)) {
          ;(output.context as string[]).push(
            formatRuntimeInjectionBlock({
              phase: "compaction",
              ...injectionEvaluation.injections,
            }),
          )
        }

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
