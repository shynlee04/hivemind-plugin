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
import { getStalenessInfo } from "../lib/staleness.js"
import { registerGovernanceSignal } from "../lib/detection.js"
import { queueStateMutation, queueTaskManifestMutation } from "../lib/state-mutation-queue.js"
import { detectAutoRealignment } from "../lib/hivefiver-integration.js"

function normalizeStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  const normalized = value.filter((item: unknown): item is string => typeof item === "string")
  return normalized.length > 0 ? normalized : undefined
}

function pickStringArray(input: Record<string, unknown>, keys: string[]): string[] | undefined {
  for (const key of keys) {
    const picked = normalizeStringArray(input[key])
    if (picked && picked.length > 0) {
      return picked
    }
  }
  return undefined
}

function pickString(input: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === "string" && value.length > 0) {
      return value
    }
  }
  return undefined
}

function pickNumber(input: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }
  }
  return undefined
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value
  if (typeof value !== "string") return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === "true" || normalized === "yes") return true
  if (normalized === "false" || normalized === "no") return false
  return undefined
}

function pickBoolean(input: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const picked = normalizeBoolean(input[key])
    if (picked !== undefined) {
      return picked
    }
  }
  return undefined
}

type NextStepMenuOption = {
  id?: string
  command: string
  action?: string
  label?: string
  description?: string
  requiresPermission?: boolean
}

function normalizeNextStepMenu(value: unknown): NextStepMenuOption[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const normalized: NextStepMenuOption[] = []
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) {
      continue
    }
    const record = entry as Record<string, unknown>
    const command = pickString(record, ["command"])
    if (!command) {
      continue
    }

    normalized.push({
      id: pickString(record, ["id"]),
      command,
      action: pickString(record, ["action"]),
      label: pickString(record, ["label"]),
      description: pickString(record, ["description"]),
      requiresPermission: pickBoolean(record, ["requiresPermission", "requires_permission"]),
    })
  }

  return normalized.length > 0 ? normalized : undefined
}

function pickNextStepMenu(input: Record<string, unknown>, keys: string[]): NextStepMenuOption[] | undefined {
  for (const key of keys) {
    const menu = normalizeNextStepMenu(input[key])
    if (menu && menu.length > 0) {
      return menu
    }
  }
  return undefined
}

function normalizeNonNegativeInt(value: number | undefined, fallback: number): number {
  if (value === undefined) return fallback
  const rounded = Math.floor(value)
  if (!Number.isFinite(rounded)) return fallback
  return rounded < 0 ? fallback : rounded
}

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
              const todoRecord = (typeof todo === "object" && todo !== null ? todo : {}) as Record<string, unknown>
              const relatedRecord =
                typeof todoRecord.related_entities === "object" && todoRecord.related_entities !== null
                  ? (todoRecord.related_entities as Record<string, unknown>)
                  : typeof todoRecord.relatedEntities === "object" && todoRecord.relatedEntities !== null
                    ? (todoRecord.relatedEntities as Record<string, unknown>)
                    : {}
              const realignment = detectAutoRealignment(content)
              return {
                id: typeof todo?.id === "string" && todo.id.length > 0 ? todo.id : `todo-${index + 1}`,
                text: content,
                content,
                status: typeof todo?.status === "string" ? todo.status : "pending",
                priority: typeof todo?.priority === "string" ? todo.priority : "medium",
                domain: typeof todo?.domain === "string" ? todo.domain : realignment.domain,
                lane: typeof todo?.lane === "string" ? todo.lane : (realignment.shouldRealign ? "auto" : undefined),
                persona:
                  pickString(todoRecord, ["persona"]) ||
                  (typeof todo?.lane === "string" ? todo.lane : realignment.persona),
                source: typeof todo?.source === "string" ? todo.source : "todo.updated",
                hivefiver_action:
                  pickString(todoRecord, ["hivefiver_action", "hivefiverAction"]) ||
                  realignment.recommendedAction,
                validation_attempts: normalizeNonNegativeInt(
                  pickNumber(todoRecord, ["validation_attempts", "validationAttempts"]),
                  0,
                ),
                max_validation_attempts: normalizeNonNegativeInt(
                  pickNumber(todoRecord, ["max_validation_attempts", "maxValidationAttempts"]),
                  10,
                ),
                evidence_confidence:
                  pickString(todoRecord, ["evidence_confidence", "evidenceConfidence"]) || "partial",
                menu_step: normalizeNonNegativeInt(
                  pickNumber(todoRecord, ["menu_step", "menuStep"]),
                  0,
                ) || undefined,
                menu_total: normalizeNonNegativeInt(
                  pickNumber(todoRecord, ["menu_total", "menuTotal"]),
                  0,
                ) || undefined,
                auto_initiate:
                  pickBoolean(todoRecord, ["auto_initiate", "autoInitiate"]) ??
                  realignment.canAutoInitiate,
                requires_permission:
                  pickBoolean(todoRecord, ["requires_permission", "requiresPermission"]) ??
                  realignment.requiresPermission,
                permission_prompt:
                  pickString(todoRecord, ["permission_prompt", "permissionPrompt"]) ||
                  realignment.permissionPrompt,
                next_step_menu:
                  pickNextStepMenu(todoRecord, ["next_step_menu", "nextStepMenu"]) ||
                  realignment.nextStepMenu,
                dependencies: pickStringArray(todoRecord, ["dependencies", "dependency_ids", "dependencyIds"]),
                acceptance_criteria: pickStringArray(todoRecord, ["acceptance_criteria", "acceptanceCriteria"]),
                recommended_skills:
                  pickStringArray(todoRecord, ["recommended_skills", "recommendedSkills"]) ||
                  realignment.recommendedSkills,
                canonical_command:
                  pickString(todoRecord, ["canonical_command", "canonicalCommand"]) ||
                  (realignment.shouldRealign ? realignment.recommendedCommand : undefined),
                related_entities: {
                  session_id:
                    pickString(relatedRecord, ["session_id", "sessionId"]) ||
                    pickString(todoRecord, ["session_id", "sessionId"]) ||
                    sessionID,
                  plan_id:
                    pickString(relatedRecord, ["plan_id", "planId"]) ||
                    pickString(todoRecord, ["plan_id", "planId"]),
                  phase_id:
                    pickString(relatedRecord, ["phase_id", "phaseId"]) ||
                    pickString(todoRecord, ["phase_id", "phaseId"]),
                  graph_task_id:
                    pickString(relatedRecord, ["graph_task_id", "graphTaskId"]) ||
                    pickString(todoRecord, ["graph_task_id", "graphTaskId"]),
                  story_id:
                    pickString(relatedRecord, ["story_id", "storyId"]) ||
                    pickString(todoRecord, ["story_id", "storyId"]),
                  workflow_id:
                    pickString(relatedRecord, ["workflow_id", "workflowId"]) ||
                    pickString(todoRecord, ["workflow_id", "workflowId"]) ||
                    (realignment.shouldRealign ? realignment.recommendedWorkflow : undefined),
                  requirement_node_id:
                    pickString(relatedRecord, ["requirement_node_id", "requirementNodeId"]) ||
                    pickString(todoRecord, ["requirement_node_id", "requirementNodeId"]),
                  mcp_provider_id:
                    pickString(relatedRecord, ["mcp_provider_id", "mcpProviderId"]) ||
                    pickString(todoRecord, ["mcp_provider_id", "mcpProviderId"]),
                  export_id:
                    pickString(relatedRecord, ["export_id", "exportId"]) ||
                    pickString(todoRecord, ["export_id", "exportId"]),
                },
                last_realigned_at: realignment.shouldRealign ? now : undefined,
                updated_at: now,
              }
            })

            queueTaskManifestMutation({
              type: "UPSERT_TASKS_MANIFEST",
              directory,
              payload: {
                session_id: sessionID,
                updated_at: now,
                tasks,
              },
              source: "event-handler.todo.updated",
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
