/**
 * hivemind_cycle — Unified export and cycle management tool.
 *
 * Merged from: export_cycle
 * Actions: export, list, prune
 *
 * Design:
 *   1. Iceberg — minimal args, system handles archive management
 *   2. Context Inference — session ID from brain state, reads from sessions/
 *   3. Signal-to-Noise — structured output with session metadata
 *   4. HC5 Compliance — --json flag for deterministic machine-parseable output
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager } from "../lib/persistence.js"
import { sessionExists, loadSession, pruneSession } from "../lib/session-export.js"
import { readdir, rm } from "fs/promises"
import { join } from "path"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

export function createHivemindCycleTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Manage session export lifecycle. " +
      "Actions: export (archive current), list (show exports), prune (delete old). " +
      "Use --json for machine-parseable output.",
    args: {
      action: tool.schema
        .enum(["export", "list", "prune"])
        .describe("What to do: export | list | prune"),
      sessionId: tool.schema
        .string()
        .optional()
        .describe("For prune: session ID to delete"),
      keep: tool.schema
        .number()
        .optional()
        .describe("For prune: number of recent sessions to keep"),
      json: tool.schema
        .boolean()
        .optional()
        .describe("Output as machine-parseable JSON (HC5)"),
    },
    async execute(args, _context) {
      const jsonOutput = args.json ?? false

      switch (args.action) {
        case "export":
          return handleExport(directory, jsonOutput)
        case "list":
          return handleList(directory, jsonOutput)
        case "prune":
          return handlePrune(directory, args.sessionId, args.keep, jsonOutput)
        default:
          return jsonOutput
            ? toErrorOutput(`Unknown action: ${args.action}`)
            : `ERROR: Unknown action. Use export, list, or prune.`
      }
    },
  })
}

async function handleExport(directory: string, jsonOutput: boolean): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return jsonOutput
      ? toErrorOutput("No active session to export")
      : "ERROR: No active session to export. Start a session first."
  }

  const sessionId = state.session.id

  // Calculate duration from start_time
  const durationMs = state.session.last_activity - state.session.start_time

  // Use session-export utility to create export
  const { exportSession } = await import("../lib/session-export.js")
  const exportPath = await exportSession(directory, sessionId)

  if (jsonOutput) {
    return toSuccessOutput("Session exported", sessionId, {
      sessionId,
      exportPath,
      mode: state.session.mode,
      duration: durationMs,
      turnCount: state.metrics.turn_count,
      filesTouched: state.metrics.files_touched.length,
    })
  }

  return `Session exported to: ${exportPath}
ID: ${sessionId}
Mode: ${state.session.mode}
Duration: ${Math.round(durationMs / 60000)}min
Turns: ${state.metrics.turn_count}
Files: ${state.metrics.files_touched.length}
→ Use hivemind_cycle list to see all exports, or prune to clean up.`
}

async function handleList(directory: string, jsonOutput: boolean): Promise<string> {
  const sessionsDir = join(directory, "sessions")

  try {
    const files = await readdir(sessionsDir)
    const sessionFiles = files.filter(f => f.startsWith("session-") && f.endsWith(".json"))

    if (sessionFiles.length === 0) {
      return jsonOutput
        ? toSuccessOutput("No sessions found", undefined, { sessions: [], total: 0 })
        : "No exported sessions found. Use hivemind_cycle export to archive a session."
    }

    // Load each session for metadata
    const sessions: Array<{
      id: string
      mode: string
      governance_status: string
      created_at: string
      turn_count: number
      files_touched: number
    }> = []

    for (const file of sessionFiles) {
      try {
        const session = await loadSession(directory, file.replace(".json", ""))
        if (session) {
          sessions.push({
            id: session.session.id,
            mode: session.session.mode,
            governance_status: session.session.governance_status,
            created_at: new Date(session.session.start_time).toISOString(),
            turn_count: session.metrics.turn_count,
            files_touched: session.metrics.files_touched.length,
          })
        }
      } catch {
        // Skip corrupted sessions
      }
    }

    // Sort by creation date, newest first
    sessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    if (jsonOutput) {
      return toSuccessOutput("Sessions listed", undefined, {
        total: sessions.length,
        sessions: sessions.slice(0, 20),
      })
    }

    const lines: string[] = []
    lines.push(`=== EXPORTED SESSIONS (${sessions.length}) ===`)
    lines.push("")

    for (const s of sessions.slice(0, 10)) {
      const date = s.created_at.split("T")[0]
      lines.push(`${s.id} | ${s.mode} | ${s.turn_count} turns | ${s.files_touched} files | ${date}`)
    }

    if (sessions.length > 10) {
      lines.push("")
      lines.push(`... and ${sessions.length - 10} more. Use hivemind_cycle export to archive, or prune to clean up.`)
    }

    lines.push("=== END SESSIONS ===")
    return lines.join("\n")
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return jsonOutput
      ? toErrorOutput(`Could not list sessions: ${errorMsg}`)
      : `ERROR: Could not list sessions: ${errorMsg}`
  }
}

async function handlePrune(
  directory: string,
  sessionId?: string,
  keep?: number,
  jsonOutput?: boolean
): Promise<string> {
  // If specific session ID provided, delete just that one
  if (sessionId) {
    const exists = await sessionExists(directory, sessionId)
    if (!exists) {
      return jsonOutput
        ? toErrorOutput(`Session ${sessionId} not found`)
        : `ERROR: Session ${sessionId} not found.`
    }

    await pruneSession(directory, sessionId)

    return jsonOutput
      ? toSuccessOutput("Session deleted", sessionId, { deleted: sessionId })
      : `Deleted session: ${sessionId}`
  }

  // Otherwise, prune to keep N most recent
  const keepCount = keep ?? 5
  const sessionsDir = join(directory, "sessions")

  try {
    const files = await readdir(sessionsDir)
    const sessionFiles = files.filter(f => f.startsWith("session-") && f.endsWith(".json"))

    if (sessionFiles.length <= keepCount) {
      return jsonOutput
        ? toSuccessOutput("No pruning needed", undefined, { kept: sessionFiles.length, deleted: 0 })
        : `No pruning needed. ${sessionFiles.length} sessions, keeping all (limit: ${keepCount}).`
    }

    // Load sessions to sort by date
    const sessions: Array<{ file: string; date: number }> = []
    for (const file of sessionFiles) {
      try {
        const session = await loadSession(directory, file.replace(".json", ""))
        if (session) {
          sessions.push({
            file,
            date: session.session.start_time,
          })
        }
      } catch {
        // Corrupted sessions will be deleted
      }
    }

    // Sort by date, newest first
    sessions.sort((a, b) => b.date - a.date)

    // Keep N, delete the rest
    const toDelete = sessions.slice(keepCount)
    let deletedCount = 0

    for (const s of toDelete) {
      try {
        await rm(join(sessionsDir, s.file), { force: true })
        deletedCount++
      } catch {
        // Skip errors
      }
    }

    if (jsonOutput) {
      return toSuccessOutput("Sessions pruned", undefined, {
        kept: keepCount,
        deleted: deletedCount,
        totalBefore: sessions.length,
        totalAfter: sessions.length - deletedCount,
      })
    }

    return `Pruned ${deletedCount} old sessions. Kept ${keepCount} most recent.`
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return jsonOutput
      ? toErrorOutput(`Could not prune sessions: ${errorMsg}`)
      : `ERROR: Could not prune sessions: ${errorMsg}`
  }
}
