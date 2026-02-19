import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import {
  closeSession,
  getSessionStatus,
  resumeSession,
  startSession,
  updateSession,
  type HierarchyLevel,
  type SessionResult,
} from "../lib/session-engine.js"
import { createStateManager } from "../lib/persistence.js"
import { addGraphTask, loadGraphTasks, loadTrajectory, saveGraphTasks, saveTrajectory } from "../lib/graph-io.js"
import { clearPendingFailureAck, type SessionMode } from "../schemas/brain-state.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"
import { flushMutations, flushTaskManifestMutations } from "../lib/state-mutation-queue.js"

/**
 * Write trajectory state after session operations to maintain graph consistency.
 * This ensures trajectory.json stays in sync with session state.
 */
async function syncTrajectoryToGraph(
  directory: string,
  action: "start" | "update_trajectory" | "update_tactic" | "update_action" | "close" | "resume",
  params?: {
    intent?: string
    planId?: string | null
    phaseId?: string | null
    taskIds?: string[]
    sessionId?: string
  }
): Promise<void> {
  let trajectory = await loadTrajectory(directory)
  const now = new Date().toISOString()
  const fallbackSessionId = params?.sessionId || crypto.randomUUID()

  // If no trajectory exists, create initial one
  if (!trajectory || !trajectory.trajectory) {
    trajectory = {
      version: "1.0.0",
      trajectory: {
        id: fallbackSessionId,
        session_id: fallbackSessionId,
        active_plan_id: null,
        active_phase_id: null,
        active_task_ids: [],
        intent: params?.intent || "",
        created_at: now,
        updated_at: now,
      },
    }
  }

  switch (action) {
    case "start":
      // After declare_intent: sets active_plan_id, clears phase/task
      if (trajectory.trajectory) {
        trajectory.trajectory.intent = params?.intent || ""
        trajectory.trajectory.active_plan_id = params?.planId || null
        trajectory.trajectory.active_phase_id = null
        trajectory.trajectory.active_task_ids = []
        trajectory.trajectory.updated_at = now
      }
      break

    case "update_trajectory":
      // After map_context(trajectory level): updates intent shift stamp
      if (trajectory.trajectory) {
        trajectory.trajectory.intent = params?.intent || ""
        trajectory.trajectory.updated_at = now
      }
      break

    case "update_tactic":
      // After map_context(tactic level): updates active_phase_id
      if (trajectory.trajectory) {
        const existingPhaseId = trajectory.trajectory.active_phase_id
        trajectory.trajectory.active_phase_id = params?.phaseId || existingPhaseId || crypto.randomUUID()
        trajectory.trajectory.updated_at = now
      }
      break

    case "update_action":
      // After map_context(action level): updates active_task_ids
      if (trajectory.trajectory) {
        const existingTaskIds = trajectory.trajectory.active_task_ids
        const nextTaskIds = params?.taskIds && params.taskIds.length > 0
          ? params.taskIds
          : existingTaskIds.length > 0
            ? existingTaskIds
            : [crypto.randomUUID()]
        trajectory.trajectory.active_task_ids = nextTaskIds
        trajectory.trajectory.updated_at = now
      }
      break

    case "close":
    case "resume":
      // Close clears active state; resume sets a new session
      if (trajectory.trajectory) {
        if (action === "close") {
          trajectory.trajectory.active_phase_id = null
          trajectory.trajectory.active_task_ids = []
        }
        trajectory.trajectory.session_id = params?.sessionId || trajectory.trajectory.session_id
        trajectory.trajectory.updated_at = now
      }
      break
  }

  await saveTrajectory(directory, trajectory)
}

export function createHivemindSessionTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Manage session lifecycle. " +
      "Actions: start (declare intent), update (change focus), close (compact), status (inspect), resume (reopen). " +
      "Always returns JSON for FK chaining.",
    args: {
      action: tool.schema
        .enum(["start", "update", "close", "status", "resume"])
        .describe("What to do: start | update | close | status | resume"),
      mode: tool.schema
        .enum(["plan_driven", "quick_fix", "exploration"])
        .optional()
        .describe("For start: session mode"),
      focus: tool.schema
        .string()
        .optional()
        .describe("For start: primary focus/goals"),
      level: tool.schema
        .enum(["trajectory", "tactic", "action"])
        .optional()
        .describe("For update: hierarchy level"),
      content: tool.schema
        .string()
        .optional()
        .describe("For update: new focus content"),
      summary: tool.schema
        .string()
        .optional()
        .describe("For close: session summary"),
      sessionId: tool.schema
        .string()
        .optional()
        .describe("For resume: session ID to resume"),
      status: tool.schema
        .enum(["in_progress", "blocked", "done"])
        .optional()
        .describe("Optional workflow status for update"),
      forceNewActionTask: tool.schema
        .boolean()
        .optional()
        .describe("For update(action): force creating a new graph task instead of reusing active one"),
    },
    async execute(args, _context) {
      // CHIMERA-3: Always return JSON for FK chaining - no conditionals
      if (args.action === "status") {
        const status = await getSessionStatus(directory)
        const sessionId = typeof status.session?.id === "string" ? status.session.id : undefined
        return toSuccessOutput("Session status", sessionId, {
          active: status.active,
          session: status.session,
          hierarchy: status.hierarchy,
          metrics: status.metrics,
        })
      }

      const stateManager = createStateManager(directory)
      await flushMutations(stateManager)
      await flushTaskManifestMutations()

      let result: SessionResult
      switch (args.action) {
        case "start":
          result = await startSession(directory, {
            mode: args.mode as SessionMode | undefined,
            focus: args.focus,
          })
          // Wire trajectory write-through: set intent, clear phase/task
          if (result.success && result.data.sessionId) {
            await syncTrajectoryToGraph(directory, "start", {
              intent: args.focus,
              sessionId: result.data.sessionId as string,
            })
          }
          break
        case "update": {
          const level = args.level as HierarchyLevel | undefined
          result = await updateSession(directory, {
            level,
            content: args.content,
          })
          // Wire trajectory write-through based on hierarchy level
          if (result.success) {
            const targetLevel = level || "tactic"
            if (targetLevel === "trajectory") {
              await syncTrajectoryToGraph(directory, "update_trajectory", {
                intent: args.content,
              })
            } else if (targetLevel === "tactic") {
              const trajectory = await loadTrajectory(directory)
              const phaseId = trajectory?.trajectory?.active_phase_id || crypto.randomUUID()
              await syncTrajectoryToGraph(directory, "update_tactic", { phaseId })
            } else {
              const now = new Date().toISOString()
              const trajectory = await loadTrajectory(directory)
              let phaseId = trajectory?.trajectory?.active_phase_id || null
              if (!phaseId) {
                phaseId = crypto.randomUUID()
                await syncTrajectoryToGraph(directory, "update_tactic", { phaseId })
              }

              const existingTaskIds = trajectory?.trajectory?.active_task_ids || []
              const forceNewActionTask = args.forceNewActionTask === true
              const currentTasks = await loadGraphTasks(directory, { enabled: false })
              await saveGraphTasks(directory, currentTasks)

              let taskId: string | null = null
              if (!forceNewActionTask && existingTaskIds.length > 0) {
                for (const existingTaskId of [...existingTaskIds].reverse()) {
                  const existingTask = currentTasks.tasks.find((task) => task.id === existingTaskId)
                  if (existingTask && existingTask.status !== "complete" && existingTask.status !== "invalidated") {
                    taskId = existingTask.id
                    break
                  }
                }
              }

              if (!taskId) {
                taskId = crypto.randomUUID()
                await addGraphTask(directory, {
                  id: taskId,
                  parent_phase_id: phaseId,
                  title: args.content || "Lifecycle task",
                  status: "in_progress",
                  file_locks: [],
                  created_at: now,
                  updated_at: now,
                })
              }

              await syncTrajectoryToGraph(directory, "update_action", {
                taskIds: existingTaskIds.includes(taskId) ? existingTaskIds : [...existingTaskIds, taskId],
              })
            }

            if (args.status === "blocked") {
              const currentState = await stateManager.load()
              if (currentState?.pending_failure_ack) {
                await stateManager.save(clearPendingFailureAck(currentState))
              }
            }
          }
          break
        }
        case "close":
          result = await closeSession(directory, args.summary)
          // Wire trajectory write-through: clear active state
          if (result.success && result.data.sessionId) {
            await syncTrajectoryToGraph(directory, "close", {
              sessionId: result.data.sessionId as string,
            })
          }
          break
        case "resume":
          result = await resumeSession(directory, args.sessionId || "")
          // Wire trajectory write-through: set new session
          if (result.success && result.data.sessionId) {
            await syncTrajectoryToGraph(directory, "resume", {
              sessionId: result.data.sessionId as string,
            })
          }
          break
        default:
          result = {
            success: false,
            action: "update",
            error: `Unknown action: ${String(args.action)}`,
            data: {},
          }
      }

      // CHIMERA-3: Always return JSON for FK chaining - no conditionals
      return result.success
        ? toSuccessOutput(`Session ${result.action} completed`, result.data.sessionId as string | undefined, {
            ...result.data,
            error: result.error,
          })
        : toErrorOutput(result.error || "Operation failed")
    },
  })
}
