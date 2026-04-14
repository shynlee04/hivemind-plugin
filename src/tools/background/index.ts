import { tool } from "@opencode-ai/plugin/tool"
import type { BackgroundManager, BackgroundTask } from "../../lib/background-manager.js"
import { renderToolResult } from "../../shared/tool-helpers.js"
import { success } from "../../shared/tool-response.js"

const s = tool.schema

type BackgroundToolAction = "spawn" | "list" | "status" | "cancel" | "wait"

type BackgroundToolArgs = {
  action: BackgroundToolAction
  task_id?: string
  command?: string
  args?: string[]
  cwd?: string
  timeout?: number
}

type ToolContext = {
  sessionID?: string
}

function requireSessionID(context: ToolContext): string {
  const sessionID = context.sessionID?.trim()
  if (!sessionID) {
    throw new Error("[Harness] Missing session ID for background task access.")
  }
  return sessionID
}

function requireTaskID(args: BackgroundToolArgs): string {
  const taskID = args.task_id?.trim()
  if (!taskID) {
    throw new Error("[Harness] task_id is required for this background action.")
  }
  return taskID
}

function getOwnedTask(
  backgroundManager: BackgroundManager,
  taskID: string,
  sessionID: string,
): BackgroundTask {
  const task = backgroundManager.getTask(taskID)
  if (!task || task.parentSessionID !== sessionID) {
    throw new Error("[Harness] Background task not found.")
  }
  return task
}

export function createBackgroundTool(
  backgroundManager: BackgroundManager,
  projectRoot: string,
): ReturnType<typeof tool> {
  return tool({
    description:
      "Manage harness OS child processes by spawning, listing, checking, waiting for, or cancelling tracked process tasks. This is not delegate-task async child-session work.",
    args: {
      action: s
        .string()
        .describe("Background action: spawn, list, status, cancel, or wait"),
      task_id: s.string().optional().describe("Tracked background task ID"),
      command: s.string().optional().describe("Executable to run for spawn actions"),
      args: s
        .array(s.string())
        .optional()
        .describe("Arguments passed to the spawned executable"),
      cwd: s.string().optional().describe("Working directory for spawn actions"),
      timeout: s.number().int().positive().optional().describe("Timeout in milliseconds"),
    },
    async execute(args: BackgroundToolArgs, context: ToolContext): Promise<string> {
      const sessionID = requireSessionID(context)

      switch (args.action) {
        case "spawn": {
          const command = args.command?.trim()
          if (!command) {
            throw new Error("[Harness] command is required for background spawn.")
          }

          const task = backgroundManager.spawn({
            command,
            args: args.args ?? [],
            cwd: args.cwd?.trim() || projectRoot,
            timeout: args.timeout,
            parentSessionID: sessionID,
          })

          return renderToolResult(success("Process task started", task))
        }
        case "list":
          return renderToolResult(
            success(
              "Process tasks listed",
              backgroundManager.listTasks(sessionID),
            ),
          )
        case "status": {
          const task = getOwnedTask(
            backgroundManager,
            requireTaskID(args),
            sessionID,
          )
          return renderToolResult(success("Process task retrieved", task))
        }
        case "cancel": {
          const taskID = requireTaskID(args)
          getOwnedTask(backgroundManager, taskID, sessionID)
          backgroundManager.kill(taskID)
          return renderToolResult(
            success(
              "Process task cancelled",
              getOwnedTask(backgroundManager, taskID, sessionID),
            ),
          )
        }
        case "wait": {
          const taskID = requireTaskID(args)
          getOwnedTask(backgroundManager, taskID, sessionID)
          return renderToolResult(
            success(
              "Process task completed",
              await backgroundManager.onComplete(taskID),
            ),
          )
        }
        default:
          throw new Error(
            `[Harness] Unsupported background action "${String(args.action)}".`,
          )
      }
    },
  })
}
