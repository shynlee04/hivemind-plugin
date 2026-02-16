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
import { loadTrajectory, saveTrajectory } from "../lib/graph-io.js"
import type { SessionMode } from "../schemas/brain-state.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

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

  // If no trajectory exists, create initial one
  if (!trajectory || !trajectory.trajectory) {
    trajectory = {
      version: "1.0.0",
      trajectory: {
        id: params?.sessionId || crypto.randomUUID(),
        session_id: params?.sessionId || crypto.randomUUID(),
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
        trajectory.trajectory.active_phase_id = params?.phaseId || null
        trajectory.trajectory.updated_at = now
      }
      break

    case "update_action":
      // After map_context(action level): updates active_task_ids
      if (trajectory.trajectory) {
        trajectory.trajectory.active_task_ids = params?.taskIds || []
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
              // For tactic level, we need to derive or generate a phase ID
              // In V3, this would come from the plan/phase system
              await syncTrajectoryToGraph(directory, "update_tactic", {
                phaseId: null, // TODO: Derive from plan system when available
              })
            } else {
              // For action level, update task IDs
              // In V3, this would come from the task system
              await syncTrajectoryToGraph(directory, "update_action", {
                taskIds: [], // TODO: Derive from task system when available
              })
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
