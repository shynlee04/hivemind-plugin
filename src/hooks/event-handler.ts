import type {
  Event,
  EventSessionCreated,
  EventSessionIdle,
  EventSessionCompacted,
  EventFileEdited,
  EventSessionDiff,
} from "@opencode-ai/sdk"
import type { Logger } from "../lib/logging.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { getStalenessInfo } from "../lib/staleness.js"
import {
  computeGovernanceSeverity,
  registerGovernanceSignal,
  type GovernanceSeverity,
} from "../lib/detection.js"
import { getClient } from "./sdk-context.js"

type ToastVariant = "info" | "warning" | "error"

export function createEventHandler(log: Logger, directory: string) {
  const stateManager = createStateManager(directory)

  return async (input: { event: Event }): Promise<void> => {
    try {
      const { event } = input
      const config = await loadConfig(directory)
      const state = await stateManager.load()

      switch (event.type) {
        case "session.created":
          await log.info(`[event] session.created: ${(event as EventSessionCreated).properties.info.id}`)
          break

        case "session.idle":
          await log.info(`[event] session.idle: ${(event as EventSessionIdle).properties.sessionID}`)

          if (!state) {
            await log.debug("[event] session.idle skipped (no brain state)")
            break
          }

          let nextState = state
          const staleness = getStalenessInfo(nextState, config.stale_session_days)

          if (nextState.metrics.drift_score < 50) {
            const repeatCount = nextState.metrics.governance_counters.drift
            const severity = computeGovernanceSeverity({
              kind: "drift",
              repetitionCount: repeatCount,
              acknowledged: nextState.metrics.governance_counters.acknowledged,
            })
            nextState = {
              ...nextState,
              metrics: {
                ...nextState.metrics,
                governance_counters: registerGovernanceSignal(nextState.metrics.governance_counters, "drift"),
              },
            }

            await showToastSafe(
              log,
              `Drift risk detected. Score ${nextState.metrics.drift_score}/100. Use map_context to realign.`,
              toToastVariant(severity),
            )
          }

          if (staleness.isStale) {
            const repeatCount = nextState.metrics.governance_counters.drift
            const severity = computeGovernanceSeverity({
              kind: "drift",
              repetitionCount: repeatCount,
              acknowledged: nextState.metrics.governance_counters.acknowledged,
            })
            nextState = {
              ...nextState,
              metrics: {
                ...nextState.metrics,
                governance_counters: registerGovernanceSignal(nextState.metrics.governance_counters, "drift"),
              },
            }

            await showToastSafe(
              log,
              `Session idle ${staleness.idleDays}d (threshold ${staleness.threshold}d). Run compact_session if context is stale.`,
              toToastVariant(severity),
            )
          }

          await stateManager.save(nextState)
          break

        case "session.compacted":
          await log.info(`[event] session.compacted: ${(event as EventSessionCompacted).properties.sessionID}`)

          if (state) {
            const nextState = {
              ...state,
              metrics: {
                ...state.metrics,
                governance_counters: registerGovernanceSignal(state.metrics.governance_counters, "compaction"),
              },
            }
            await stateManager.save(nextState)
          }

          await showToastSafe(
            log,
            "Session compacted. Context snapshot preserved.",
            "info",
          )
          break

        case "file.edited":
          await log.debug(`[event] file.edited: ${(event as EventFileEdited).properties.file}`)
          break

        case "session.diff":
          await log.debug(`[event] session.diff: ${(event as EventSessionDiff).properties.sessionID} (${(event as EventSessionDiff).properties.diff.length} files)`)
          break

        default:
          // Log unhandled events at debug level for discoverability
          await log.debug(`[event] ${(event as any).type} (unhandled)`)
          break
      }
    } catch (error: unknown) {
      // P3: Never break event handling
      await log.error(`Event handler error: ${error}`)
    }
  }
}

function toToastVariant(severity: GovernanceSeverity): ToastVariant {
  if (severity === "error") return "error"
  if (severity === "warning") return "warning"
  return "info"
}

async function showToastSafe(log: Logger, message: string, variant: ToastVariant): Promise<void> {
  const client = getClient()
  if (!client?.tui?.showToast) {
    await log.debug(`[event] toast skipped (${variant}): ${message}`)
    return
  }

  try {
    await client.tui.showToast({
      body: {
        message,
        variant,
      },
    })
  } catch (error: unknown) {
    await log.warn(`[event] toast failed (${variant}): ${error}`)
  }
}
