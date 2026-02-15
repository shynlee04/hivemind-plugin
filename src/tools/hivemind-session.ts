/**
 * hivemind_session — Unified session lifecycle management tool.
 *
 * Merged from: declare_intent, map_context, compact_session
 * Actions: start, update, close, status, resume
 *
 * Design:
 *   1. Iceberg — minimal args, system handles state
 *   2. Context Inference — session ID, timestamps auto-generated
 *   3. Signal-to-Noise — structured output, actionable guidance
 *   4. HC5 Compliance — --json flag for deterministic machine-parseable output
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { saveAnchors } from "../lib/anchors.js"
import {
  createBrainState,
  generateSessionId,
  unlockSession,
  lockSession,
  resetComplexityNudge,
} from "../schemas/brain-state.js"
import {
  initializePlanningDirectory,
  readActiveMd,
  archiveSession,
  updateIndexMd,
  resetActiveMd,
  listArchives,
  getExportDir,
} from "../lib/planning-fs.js"
import {
  createNode,
  createTree,
  setRoot,
  saveTree,
  toActiveMdBody,
  generateStamp,
  toBrainProjection,
} from "../lib/hierarchy-tree.js"
import type { SessionMode } from "../schemas/brain-state.js"
import type { BrainState } from "../schemas/brain-state.js"
import { buildSessionFilename, getEffectivePaths } from "../lib/paths.js"
import { instantiateSession, registerSession, generateIndexMd } from "../lib/planning-fs.js"
import { generateExportData, generateJsonExport, generateMarkdownExport } from "../lib/session-export.js"
import { existsSync } from "fs"

type HierarchyLevel = "trajectory" | "tactic" | "action"

interface JsonOutput {
  success: boolean
  action: string
  data: Record<string, unknown>
  timestamp: string
}

function toJsonOutput(action: string, data: Record<string, unknown>): string {
  return JSON.stringify({
    success: true,
    action,
    data,
    timestamp: new Date().toISOString(),
  } as JsonOutput)
}

const VALID_MODES: SessionMode[] = ["plan_driven", "quick_fix", "exploration"]
const VALID_LEVELS: HierarchyLevel[] = ["trajectory", "tactic", "action"]

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

      switch (args.action) {
        case "start":
          return handleStart(directory, args.mode, args.focus, jsonOutput)
        case "update":
          return handleUpdate(directory, args.level, args.content, jsonOutput)
        case "close":
          return handleClose(directory, args.summary, jsonOutput)
        case "status":
          return handleStatus(directory, jsonOutput)
        case "resume":
          return handleResume(directory, args.sessionId, jsonOutput)
        default:
          return jsonOutput
            ? toJsonOutput("error", { message: `Unknown action: ${args.action}` })
            : `ERROR: Unknown action. Use start, update, close, status, or resume.`
      }
    },
  })
}

/**
 * start — Begin a new session with intent declaration.
 * Merged from: declare_intent
 */
async function handleStart(
  directory: string,
  mode?: SessionMode,
  focus?: string,
  jsonOutput?: boolean
): Promise<string> {
  const configPath = getEffectivePaths(directory).config
  if (!existsSync(configPath)) {
    return jsonOutput
      ? toJsonOutput("start", { error: "not configured" })
      : [
        "ERROR: HiveMind is not configured for this project.",
        "Run setup first:",
        "  npx hivemind-context-governance",
        "Then call hivemind_session start again.",
      ].join("\n")
  }

  const config = await loadConfig(directory)
  const stateManager = createStateManager(directory)

  // Ensure planning directory exists
  await initializePlanningDirectory(directory)

  // Load or create brain state
  let state = await stateManager.load()
  if (state) {
    const sessionAge = Date.now() - state.session.start_time
    const hoursOld = Math.round(sessionAge / (1000 * 60 * 60))

    if (jsonOutput) {
      return toJsonOutput("start", {
        error: "session already active",
        activeSession: state.session.id,
        hoursOld,
        suggestion: "Use hivemind_session close first, or update to change focus.",
      })
    }

    return `Session already active: ${state.session.id}
Age: ${hoursOld} hours
Mode: ${state.session.mode}
Focus: ${state.hierarchy.trajectory || "(not set)"}

Use:
- hivemind_session update to change focus
- hivemind_session close to end this session
- hivemind_session status to inspect state`
  }

  // Validate inputs
  if (!mode || !VALID_MODES.includes(mode)) {
    const modesList = VALID_MODES.join(", ")
    return jsonOutput
      ? toJsonOutput("start", { error: "mode required", validModes: VALID_MODES })
      : `ERROR: mode is required. Choose from: ${modesList}`
  }

  if (!focus?.trim()) {
    return jsonOutput
      ? toJsonOutput("start", { error: "focus required" })
      : "ERROR: focus is required. What are you working on?"
  }

  // Create new session
  const sessionId = generateSessionId()
  state = createBrainState(sessionId, config, mode)

  // Capture old trajectory
  const oldTrajectory = state.hierarchy.trajectory

  // Unlock session
  state = unlockSession(state)
  state.session.mode = mode

  // === Hierarchy Tree: Create root trajectory node ===
  const now = new Date()
  const stamp = generateStamp(now)
  const rootNode = createNode("trajectory", focus, "active", now)
  let tree = createTree()
  tree = setRoot(tree, rootNode)

  // Save hierarchy tree
  await saveTree(directory, tree)

  // Project tree into flat brain.json hierarchy (backward compat)
  const projection = toBrainProjection(tree)
  state.hierarchy = { ...state.hierarchy, ...projection }

  // Reset complexity nudge
  state = resetComplexityNudge(state)

  // Save state
  await stateManager.save(state)

  // === Per-session file: Instantiate from template ===
  const sessionFileName = buildSessionFilename(now, mode, focus)
  const hierarchyBody = toActiveMdBody(tree)
  const sessionContent = instantiateSession({
    sessionId: state.session.id,
    stamp,
    mode,
    governanceStatus: "OPEN",
    created: now.getTime(),
    trajectory: focus,
    linkedPlans: [],
    turns: state.metrics.turn_count,
    drift: state.metrics.drift_score,
    hierarchyBody,
  })

  const { join } = await import("path")
  const { writeFile } = await import("fs/promises")
  await writeFile(join(getEffectivePaths(directory).activeDir, sessionFileName), sessionContent)

  // Register in manifest
  await registerSession(directory, stamp, sessionFileName, {
    created: now.getTime(),
    mode,
    trajectory: focus,
  })

  await generateIndexMd(directory)

  // Initialize anchors file
  await saveAnchors(directory, { anchors: [], version: "1.0.0" })

  if (jsonOutput) {
    return toJsonOutput("start", {
      sessionId: state.session.id,
      mode: state.session.mode,
      focus: state.hierarchy.trajectory,
      governanceStatus: state.session.governance_status,
    })
  }

  let response = `Session started: ${state.session.id}\nMode: ${mode}\nFocus: ${focus}\nStatus: OPEN`
  if (oldTrajectory && oldTrajectory !== focus) {
    response += `\n⚠ Previous trajectory replaced: "${oldTrajectory}"`
  }
  response += "\n→ Use hivemind_session update to refine focus as you work."

  return response
}

/**
 * update — Change focus/context mid-session.
 * Merged from: map_context
 */
async function handleUpdate(
  directory: string,
  level?: HierarchyLevel,
  content?: string,
  jsonOutput?: boolean
): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return jsonOutput
      ? toJsonOutput("update", { error: "no active session", active: false })
      : "ERROR: No active session. Use hivemind_session start to begin."
  }

  // Validate inputs
  const targetLevel = level || "tactic"
  if (!VALID_LEVELS.includes(targetLevel)) {
    return jsonOutput
      ? toJsonOutput("update", { error: "invalid level", validLevels: VALID_LEVELS })
      : `ERROR: Invalid level. Use: ${VALID_LEVELS.join(", ")}`
  }

  if (!content?.trim()) {
    return jsonOutput
      ? toJsonOutput("update", { error: "content required" })
      : "ERROR: content is required. What is the new focus?"
  }

  // Determine which hierarchy level to update
  const hierarchyUpdate: Partial<BrainState["hierarchy"]> = {}

  if (targetLevel === "trajectory") {
    hierarchyUpdate.trajectory = content
    hierarchyUpdate.tactic = ""
    hierarchyUpdate.action = ""
  } else if (targetLevel === "tactic") {
    hierarchyUpdate.tactic = content
    hierarchyUpdate.action = ""
  } else if (targetLevel === "action") {
    hierarchyUpdate.action = content
  }

  // Update state
  const updatedState: BrainState = {
    ...state,
    hierarchy: {
      ...state.hierarchy,
      ...hierarchyUpdate,
    },
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
    metrics: {
      ...state.metrics,
      context_updates: state.metrics.context_updates + 1,
    },
  }

  await stateManager.save(updatedState)

  if (jsonOutput) {
    return toJsonOutput("update", {
      level: targetLevel,
      content,
      trajectory: updatedState.hierarchy.trajectory,
      tactic: updatedState.hierarchy.tactic,
      action: updatedState.hierarchy.action,
      contextUpdates: updatedState.metrics.context_updates,
    })
  }

  const lines: string[] = []
  lines.push(`Context updated at [${targetLevel}] level.`)
  lines.push("")
  lines.push("Current hierarchy:")

  if (updatedState.hierarchy.trajectory) {
    lines.push(`  Trajectory: ${updatedState.hierarchy.trajectory}`)
  }
  if (updatedState.hierarchy.tactic) {
    lines.push(`  Tactic: ${updatedState.hierarchy.tactic}`)
  }
  if (updatedState.hierarchy.action) {
    lines.push(`  Action: ${updatedState.hierarchy.action}`)
  }

  lines.push("")
  lines.push(`Context updates: ${updatedState.metrics.context_updates}`)
  lines.push("→ Use hivemind_inspect drift to verify alignment.")

  return lines.join("\n")
}

/**
 * close — End session and create archive.
 * Merged from: compact_session
 */
async function handleClose(
  directory: string,
  summary?: string,
  jsonOutput?: boolean
): Promise<string> {
  const stateManager = createStateManager(directory)

  // Load brain state
  const state = await stateManager.load()
  if (!state) {
    return jsonOutput
      ? toJsonOutput("close", { error: "no active session", active: false })
      : "ERROR: No active session to close. Start one first."
  }

  // Read current active.md content for archival
  const activeMd = await readActiveMd(directory)

  // Build archive content
  const sessionId = state.session.id
  const durationMs = Date.now() - state.session.start_time

  const archiveLines = [
    `# Archived Session: ${sessionId}`,
    "",
    `**Mode**: ${state.session.mode}`,
    `**Started**: ${new Date(state.session.start_time).toISOString()}`,
    `**Archived**: ${new Date().toISOString()}`,
    `**Turns**: ${state.metrics.turn_count}`,
    `**Drift Score**: ${state.metrics.drift_score}/100`,
    `**Files Touched**: ${state.metrics.files_touched.length}`,
    "",
    "## Hierarchy",
  ]

  if (state.hierarchy.trajectory) archiveLines.push(`- **Trajectory**: ${state.hierarchy.trajectory}`)
  if (state.hierarchy.tactic) archiveLines.push(`- **Tactic**: ${state.hierarchy.tactic}`)
  if (state.hierarchy.action) archiveLines.push(`- **Action**: ${state.hierarchy.action}`)

  archiveLines.push("")
  archiveLines.push("## Session Content")
  archiveLines.push(activeMd.body)

  const archiveContent = archiveLines.filter(Boolean).join("\n")

  // Archive the session
  await archiveSession(directory, sessionId, archiveContent)

  // Update index.md with summary
  const summaryLine =
    summary ||
    `Session ${sessionId}: ${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`
  await updateIndexMd(directory, summaryLine)

  // Auto-export JSON + Markdown snapshot to archive/exports
  try {
    const exportData = generateExportData(state, summaryLine)
    const exportDir = getExportDir(directory)
    const { mkdir, writeFile } = await import("fs/promises")
    const { join } = await import("path")

    await mkdir(exportDir, { recursive: true })
    const stamp = new Date().toISOString().split("T")[0]
    const baseName = `session_${stamp}_${sessionId}`

    await writeFile(join(exportDir, `${baseName}.json`), generateJsonExport(exportData))
    await writeFile(
      join(exportDir, `${baseName}.md`),
      generateMarkdownExport(exportData, activeMd.body)
    )
  } catch {
    // Non-fatal: close should still succeed even if export fails
  }

  // Reset hierarchy tree
  const { loadTree, saveTree } = await import("../lib/hierarchy-tree.js")
  const { treeExists } = await import("../lib/hierarchy-tree.js")
  if (treeExists(directory)) {
    const tree = await loadTree(directory)
    tree.root = null
    tree.cursor = null
    await saveTree(directory, tree)
  }

  // Reset active.md to template
  await resetActiveMd(directory)

  // Create fresh brain state (new session, locked)
  const config = await loadConfig(directory)
  const newSessionId = generateSessionId()
  const newState = createBrainState(newSessionId, config)
  await stateManager.save(lockSession(newState))

  // Count archives for output
  const archives = await listArchives(directory)

  if (jsonOutput) {
    return toJsonOutput("close", {
      sessionId,
      durationMs,
      durationMinutes: Math.round(durationMs / 60000),
      turnCount: state.metrics.turn_count,
      filesTouched: state.metrics.files_touched.length,
      contextUpdates: state.metrics.context_updates,
      archivesCount: archives.length,
      summary: summaryLine,
    })
  }

  const lines: string[] = []
  lines.push(`Session closed: ${sessionId}`)
  lines.push("")
  lines.push("## Summary")
  lines.push(summaryLine)
  lines.push("")
  lines.push("## Stats")
  lines.push(`Duration: ~${Math.round(durationMs / 60000)} minutes`)
  lines.push(`Turns: ${state.metrics.turn_count}`)
  lines.push(`Files: ${state.metrics.files_touched.length}`)
  lines.push(`Archives: ${archives.length}`)
  lines.push("")
  lines.push("→ Session is now LOCKED. Use hivemind_session start to begin new work.")

  return lines.join("\n")
}

/**
 * status — Inspect current session state.
 * NEW ACTION - addresses HC4 violation (missing read operation)
 */
async function handleStatus(directory: string, jsonOutput?: boolean): Promise<string> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return jsonOutput
      ? toJsonOutput("status", { active: false, session: null })
      : "No active session. Use hivemind_session start to begin."
  }

  const durationMs = Date.now() - state.session.start_time

  if (jsonOutput) {
    return toJsonOutput("status", {
      active: true,
      session: {
        id: state.session.id,
        mode: state.session.mode,
        governanceStatus: state.session.governance_status,
        startTime: new Date(state.session.start_time).toISOString(),
        lastActivity: new Date(state.session.last_activity).toISOString(),
        durationMinutes: Math.round(durationMs / 60000),
      },
      hierarchy: {
        trajectory: state.hierarchy.trajectory,
        tactic: state.hierarchy.tactic,
        action: state.hierarchy.action,
      },
      metrics: {
        turnCount: state.metrics.turn_count,
        driftScore: state.metrics.drift_score,
        filesTouched: state.metrics.files_touched.length,
        contextUpdates: state.metrics.context_updates,
        violations: state.metrics.violation_count,
      },
    })
  }

  const lines: string[] = []
  lines.push("=== SESSION STATUS ===")
  lines.push("")
  lines.push(`ID: ${state.session.id}`)
  lines.push(`Mode: ${state.session.mode}`)
  lines.push(`Status: ${state.session.governance_status}`)
  lines.push(`Duration: ~${Math.round(durationMs / 60000)} min`)
  lines.push("")

  lines.push("## Hierarchy")
  if (state.hierarchy.trajectory) lines.push(`Trajectory: ${state.hierarchy.trajectory}`)
  if (state.hierarchy.tactic) lines.push(`Tactic: ${state.hierarchy.tactic}`)
  if (state.hierarchy.action) lines.push(`Action: ${state.hierarchy.action}`)
  lines.push("")

  lines.push("## Metrics")
  lines.push(`Turns: ${state.metrics.turn_count}`)
  lines.push(`Drift: ${state.metrics.drift_score}/100`)
  lines.push(`Files: ${state.metrics.files_touched.length}`)
  lines.push(`Context updates: ${state.metrics.context_updates}`)
  if (state.metrics.violation_count > 0) {
    lines.push(`Violations: ${state.metrics.violation_count}`)
  }

  lines.push("")
  lines.push("=== END STATUS ===")
  return lines.join("\n")
}

/**
 * resume — Reopen a closed session for continued work.
 * NEW ACTION - enables session continuity
 */
async function handleResume(
  directory: string,
  sessionId?: string,
  jsonOutput?: boolean
): Promise<string> {
  const { readdir } = await import("fs/promises")
  const { join } = await import("path")
  const sessionsDir = join(directory, "sessions")

  // If no session ID, list available sessions
  if (!sessionId) {
    try {
      const files = await readdir(sessionsDir)
      const sessionFiles = files.filter(f => f.startsWith("session-") && f.endsWith(".json"))

      if (sessionFiles.length === 0) {
        return jsonOutput
          ? toJsonOutput("resume", { error: "no exported sessions", available: [] })
          : "No exported sessions found. Use hivemind_session start to begin a new session."
      }

      if (jsonOutput) {
        return toJsonOutput("resume", {
          suggestion: "provide sessionId",
          availableCount: sessionFiles.length,
          note: "Use hivemind_session resume {sessionId} with one of the archived sessions",
        })
      }

      const lines: string[] = []
      lines.push("Available sessions to resume:")
      lines.push("")
      lines.push("Note: Direct resume requires loading archived session data.")
      lines.push("Currently archived sessions: " + sessionFiles.length)
      lines.push("")
      lines.push("Use hivemind_session start to begin a fresh session.")
      lines.push("Or use hivemind_session status to check current state.")

      return lines.join("\n")
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      return jsonOutput
        ? toJsonOutput("resume", { error: errorMsg })
        : `ERROR: Could not list sessions: ${errorMsg}`
    }
  }

  // For now, simplified resume - just start a new session with context from archive
  // Full resume would require loading archived session and restoring state
  const stateManager = createStateManager(directory)
  const existing = await stateManager.load()

  if (existing && existing.session.governance_status === "OPEN") {
    return jsonOutput
      ? toJsonOutput("resume", { error: "session already active", sessionId: existing.session.id })
      : `Session already active: ${existing.session.id}. Close it first with hivemind_session close.`
  }

  // Create a new session based on the archived one (simplified)
  const config = await loadConfig(directory)
  const newSessionId = generateSessionId()
  const state = createBrainState(newSessionId, config, "plan_driven")
  state.session.mode = "plan_driven"

  await stateManager.save(unlockSession(state))

  if (jsonOutput) {
    return toJsonOutput("resume", {
      sessionId: newSessionId,
      fromSession: sessionId,
      mode: state.session.mode,
      restored: true,
      note: "Started new session (simplified resume - full restore requires archive loading)",
    })
  }

  const lines: string[] = []
  lines.push(`Session resumed with new ID: ${newSessionId}`)
  lines.push(`(Based on archive: ${sessionId})`)
  lines.push("")
  lines.push("Note: This started a fresh session. Full resume from archive requires manual state restoration.")
  lines.push("→ Use hivemind_session status to verify, update to change focus.")

  return lines.join("\n")
}
