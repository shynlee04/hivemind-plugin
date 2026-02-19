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
import { clearPendingFailureAck } from "../schemas/brain-state.js"
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
    },
    async execute(args, _context) {
      // CHIMERA-3: Always return JSON for FK chaining
      switch (args.action) {
        case "export":
          return handleExport(directory)
        case "list":
          return handleList(directory)
        case "prune":
          return handlePrune(directory, args.sessionId, args.keep)
        default:
          return toErrorOutput(`Unknown action: ${args.action}`)
      }
    },
  })
}

// CHIMERA-3: Always return JSON for FK chaining
async function handleExport(directory: string): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return toErrorOutput("No session state found")
  }

  // LOCKED means no active session to export
  if (state.session.governance_status === "LOCKED") {
    return toErrorOutput("No active session to export")
  }

  const sessionId = state.session.id

  // Calculate duration from start_time
  const durationMs = state.session.last_activity - state.session.start_time

  // Use session-export utility to create export
  const { exportSession } = await import("../lib/session-export.js")
  const exportPath = await exportSession(directory, sessionId)

  if (state.pending_failure_ack) {
    await stateManager.save(clearPendingFailureAck(state))
  }

  return toSuccessOutput("Session exported", sessionId, {
    sessionId,
    exportPath,
    mode: state.session.mode,
    duration: durationMs,
    turnCount: state.metrics.turn_count,
    filesTouched: state.metrics.files_touched.length,
  })
}

// CHIMERA-3: Always return JSON for FK chaining
async function handleList(directory: string): Promise<string> {
  const sessionsDir = join(directory, "sessions")

  try {
    const files = await readdir(sessionsDir)
    const sessionFiles = files.filter(f => f.startsWith("session-") && f.endsWith(".json"))

    if (sessionFiles.length === 0) {
      return toSuccessOutput("No sessions found", undefined, { sessions: [], total: 0 })
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

    return toSuccessOutput("Sessions listed", undefined, {
      total: sessions.length,
      sessions: sessions.slice(0, 20),
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return toErrorOutput(`Could not list sessions: ${errorMsg}`)
  }
}

// CHIMERA-3: Always return JSON for FK chaining
async function handlePrune(
  directory: string,
  sessionId?: string,
  keep?: number
): Promise<string> {
  // If specific session ID provided, delete just that one
  if (sessionId) {
    const exists = await sessionExists(directory, sessionId)
    if (!exists) {
      return toErrorOutput(`Session ${sessionId} not found`)
    }

    await pruneSession(directory, sessionId)

    return toSuccessOutput("Session deleted", sessionId, { deleted: sessionId })
  }

  // Otherwise, prune to keep N most recent
  const keepCount = keep ?? 5
  const sessionsDir = join(directory, "sessions")

  try {
    const files = await readdir(sessionsDir)
    const sessionFiles = files.filter(f => f.startsWith("session-") && f.endsWith(".json"))

    if (sessionFiles.length <= keepCount) {
      return toSuccessOutput("No pruning needed", undefined, { kept: sessionFiles.length, deleted: 0 })
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

    return toSuccessOutput("Sessions pruned", undefined, {
      kept: keepCount,
      deleted: deletedCount,
      totalBefore: sessions.length,
      totalAfter: sessions.length - deletedCount,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return toErrorOutput(`Could not prune sessions: ${errorMsg}`)
  }
}
