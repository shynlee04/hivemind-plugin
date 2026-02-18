/**
 * Event Handler Hook — Session event processing.
 *
 * Handles OpenCode session events:
 *   - session.created: Log new session
 *   - session.idle: Check staleness (drift check moved to soft-governance.ts)
 *   - session.compacted: Track compaction events
 *   - file.edited: Track file changes
 *   - session.diff: Track session diffs
 *
 * FLAW-TOAST-004/005/006/007 FIX: Removed all governance toasts.
 * - Drift toasts removed (FLAW-TOAST-007) - visible in scan_hierarchy output
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
  EventTodoUpdated,
} from "@opencode-ai/sdk"
import type { Logger } from "../lib/logging.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { saveTasks } from "../lib/manifest.js"
import { getStalenessInfo } from "../lib/staleness.js"
import { registerGovernanceSignal } from "../lib/detection.js"
import { queueStateMutation } from "../lib/state-mutation-queue.js"

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
          
          // V3.0: Increment user_turn_count on each user→assistant→user cycle
          nextState = {
            ...nextState,
            metrics: {
              ...nextState.metrics,
              user_turn_count: nextState.metrics.user_turn_count + 1,
            },
          }
          
          const staleness = getStalenessInfo(nextState, config.stale_session_days)

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

          // CQRS FIX: Queue mutation instead of direct save (hook is read-only)
          queueStateMutation({
            type: "UPDATE_METRICS",
            payload: { metrics: nextState.metrics },
            source: "event-handler.session.idle",
          })
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
            // CQRS FIX: Queue mutation instead of direct save (hook is read-only)
            queueStateMutation({
              type: "UPDATE_METRICS",
              payload: { metrics: nextState.metrics },
              source: "event-handler.session.compacted",
            })
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
          const evt = event as EventTodoUpdated | { properties?: { sessionID?: unknown; todos?: unknown[] } }
          const rawTodos = Array.isArray(evt.properties?.todos) ? evt.properties.todos : []
          const sessionID =
            typeof evt.properties?.sessionID === "string" && evt.properties.sessionID.length > 0
              ? evt.properties.sessionID
              : "unknown"
          await log.debug(`[event] todo.updated: ${sessionID}`)

          if (rawTodos.length > 0) {
            const now = Date.now()
            const tasks = rawTodos.map((todo: any, index: number) => {
              const content =
                typeof todo?.content === "string"
                  ? todo.content
                  : typeof todo?.text === "string"
                    ? todo.text
                    : ""
              return {
                id: typeof todo?.id === "string" && todo.id.length > 0 ? todo.id : `todo-${index + 1}`,
                text: content,
                content,
                status: typeof todo?.status === "string" ? todo.status : "pending",
                priority: typeof todo?.priority === "string" ? todo.priority : "medium",
                updated_at: now,
              }
            })

            await saveTasks(directory, {
              session_id: sessionID,
              updated_at: now,
              tasks,
            })
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
