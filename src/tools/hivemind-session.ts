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
import type { SessionMode } from "../schemas/brain-state.js"

interface JsonOutput {
  success: boolean
  action: string
  data: Record<string, unknown>
  timestamp: string
}

function toJsonOutput(action: string, success: boolean, data: Record<string, unknown>): string {
  return JSON.stringify({
    success,
    action,
    data,
    timestamp: new Date().toISOString(),
  } as JsonOutput)
}

function toText(result: SessionResult): string {
  if (!result.success) {
    return `ERROR: ${result.error || "operation failed"}`
  }

  const data = result.data
  switch (result.action) {
    case "start":
      return [
        `Session started: ${String(data.sessionId || "unknown")}`,
        `Mode: ${String(data.mode || "unknown")}`,
        `Focus: ${String(data.focus || "(not set)")}`,
        `Status: ${String(data.governanceStatus || "OPEN")}`,
      ].join("\n")
    case "update": {
      const level = String(data.level || "tactic")
      return [
        `Context updated at [${level}] level.`,
        `Context updates: ${String(data.contextUpdates || 0)}`,
      ].join("\n")
    }
    case "close":
      return [
        `Session closed: ${String(data.sessionId || "unknown")}`,
        `Duration: ~${String(data.durationMinutes || 0)} minutes`,
        `Turns: ${String(data.turnCount || 0)}`,
        `Files: ${String(data.filesTouched || 0)}`,
      ].join("\n")
    case "resume":
      return [
        `Session resumed with new ID: ${String(data.sessionId || "unknown")}`,
        `(Based on archive: ${String(data.fromSession || "unknown")})`,
      ].join("\n")
    default:
      return JSON.stringify(result)
  }
}

function statusToText(status: Awaited<ReturnType<typeof getSessionStatus>>): string {
  if (!status.active) {
    return "No active session. Use hivemind_session start to begin."
  }

  const session = status.session || {}
  const hierarchy = status.hierarchy || {}
  const metrics = status.metrics || {}

  const lines: string[] = []
  lines.push("=== SESSION STATUS ===")
  lines.push("")
  lines.push(`ID: ${String(session.id || "unknown")}`)
  lines.push(`Mode: ${String(session.mode || "unknown")}`)
  lines.push(`Status: ${String(session.governanceStatus || "unknown")}`)
  lines.push(`Duration: ~${String(session.durationMinutes || 0)} min`)
  lines.push("")
  lines.push("## Hierarchy")
  if (hierarchy.trajectory) lines.push(`Trajectory: ${String(hierarchy.trajectory)}`)
  if (hierarchy.tactic) lines.push(`Tactic: ${String(hierarchy.tactic)}`)
  if (hierarchy.action) lines.push(`Action: ${String(hierarchy.action)}`)
  lines.push("")
  lines.push("## Metrics")
  lines.push(`Turns: ${String(metrics.turnCount || 0)}`)
  lines.push(`Drift: ${String(metrics.driftScore || 0)}/100`)
  lines.push(`Files: ${String(metrics.filesTouched || 0)}`)
  lines.push(`Context updates: ${String(metrics.contextUpdates || 0)}`)
  if (metrics.violations) lines.push(`Violations: ${String(metrics.violations)}`)
  lines.push("")
  lines.push("=== END STATUS ===")
  return lines.join("\n")
}

export function createHivemindSessionTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Manage session lifecycle. " +
      "Actions: start (declare intent), update (change focus), close (compact), status (inspect), resume (reopen). " +
      "Use --json for machine-parseable output.",
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
      json: tool.schema
        .boolean()
        .optional()
        .describe("Output as machine-parseable JSON (HC5)"),
    },
    async execute(args, _context) {
      const jsonOutput = args.json ?? false

      if (args.action === "status") {
        const status = await getSessionStatus(directory)
        return jsonOutput
          ? toJsonOutput("status", true, {
            active: status.active,
            session: status.session,
            hierarchy: status.hierarchy,
            metrics: status.metrics,
          })
          : statusToText(status)
      }

      let result: SessionResult
      switch (args.action) {
        case "start":
          result = await startSession(directory, {
            mode: args.mode as SessionMode | undefined,
            focus: args.focus,
          })
          break
        case "update":
          result = await updateSession(directory, {
            level: args.level as HierarchyLevel | undefined,
            content: args.content,
          })
          break
        case "close":
          result = await closeSession(directory, args.summary)
          break
        case "resume":
          result = await resumeSession(directory, args.sessionId || "")
          break
        default:
          result = {
            success: false,
            action: "update",
            error: `Unknown action: ${String(args.action)}`,
            data: {},
          }
      }

      return jsonOutput
        ? toJsonOutput(result.action, result.success, { ...result.data, error: result.error })
        : toText(result)
    },
  })
}
