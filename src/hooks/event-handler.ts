/**
 * Event Handler Hook — Session event processing.
 *
 * Handles OpenCode session events:
 *   - session.created: Log new session
 *   - session.idle: Check drift and staleness
 *   - session.compacted: Track compaction events
 *   - file.edited: Track file changes
 *   - session.diff: Track session diffs
 *
 * FLAW-TOAST-004/005/006 FIX: Added toast throttling to prevent noise cascade.
 * - Drift toasts only emit when drift_score < 30 (was < 50)
 * - Staleness toasts removed - visible in scan_hierarchy output
 * - Session compacted toast removed - duplicate of compaction.ts
 *
 * P3: try/catch — never break event handling
 */

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
import { saveTasks } from "../lib/manifest.js"
import { getStalenessInfo } from "../lib/staleness.js"
import {
  computeGovernanceSeverity,
  registerGovernanceSignal,
  type GovernanceSeverity,
} from "../lib/detection.js"
import { getClient } from "./sdk-context.js"
import { checkAndRecordToast } from "../lib/toast-throttle.js"

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

          // FLAW-TOAST-004 FIX: Only emit drift toast when score < 30 (was < 50)
          // and only after 10+ turns to avoid false urgency during active exploration
          if (nextState.metrics.drift_score < 30 && nextState.metrics.turn_count >= 10) {
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

            // Throttle drift toasts
            if (checkAndRecordToast("drift", "idle")) {
              await showToastSafe(
                log,
                `Drift risk detected. Score ${nextState.metrics.drift_score}/100. Use map_context to realign.`,
                toToastVariant(severity),
              )
            }
          }

          // FLAW-TOAST-005 FIX: Removed staleness toast
          // Staleness is visible in scan_hierarchy output - no push notification needed
          // Just log it for debugging purposes
          if (staleness.isStale) {
            await log.debug(`[event] Session stale: ${staleness.idleDays}d idle (threshold ${staleness.threshold}d)`)
            nextState = {
              ...nextState,
              metrics: {
                ...nextState.metrics,
                governance_counters: registerGovernanceSignal(nextState.metrics.governance_counters, "drift"),
              },
            }
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

          // FLAW-TOAST-006 FIX: Removed session.compacted toast
          // This was a duplicate of compaction.ts toast - redundant notification
          // Compaction is transparent, context is preserved
          break

        case "file.edited":
          await log.debug(`[event] file.edited: ${(event as EventFileEdited).properties.file}`)
          break

        case "session.diff":
          await log.debug(`[event] session.diff: ${(event as EventSessionDiff).properties.sessionID} (${(event as EventSessionDiff).properties.diff.length} files)`)
          break

        case "todo.updated": {
          const evt = event as any
          await log.debug(`[event] todo.updated: ${evt.properties?.sessionID || "unknown"}`)

          if (evt.properties?.todos) {
            const payload = {
              session_id: evt.properties.sessionID || "unknown",
              updated_at: Date.now(),
              tasks: evt.properties.todos
            }
            await saveTasks(directory, payload)
          }
          break
        }

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
