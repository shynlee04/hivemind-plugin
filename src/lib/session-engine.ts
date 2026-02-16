import { existsSync } from "fs"
import { readdir, mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { saveAnchors } from "./anchors.js"
import {
  createNode,
  createTree,
  generateStamp,
  loadTree,
  saveTree,
  setRoot,
  toActiveMdBody,
  toBrainProjection,
  treeExists,
} from "./hierarchy-tree.js"
import {
  archiveSession,
  generateIndexMd,
  getExportDir,
  initializePlanningDirectory,
  instantiateSession,
  listArchives,
  readActiveMd,
  registerSession,
  resetActiveMd,
  updateIndexMd,
} from "./planning-fs.js"
import { buildSessionFilename, getEffectivePaths } from "./paths.js"
import { createStateManager, loadConfig } from "./persistence.js"
import { generateExportData, generateJsonExport, generateMarkdownExport, loadSession } from "./session-export.js"
import {
  createBrainState,
  generateSessionId,
  lockSession,
  resetComplexityNudge,
  unlockSession,
  type BrainState,
  type SessionMode,
} from "../schemas/brain-state.js"

export type HierarchyLevel = "trajectory" | "tactic" | "action"

export interface SessionOptions {
  mode?: SessionMode
  focus?: string
}

export interface SessionUpdates {
  level?: HierarchyLevel
  content?: string
}

export interface SessionResult {
  success: boolean
  action: "start" | "update" | "close" | "resume"
  error?: string
  data: Record<string, unknown>
}

export interface SessionStatus {
  active: boolean
  session: Record<string, unknown> | null
  hierarchy?: Record<string, unknown>
  metrics?: Record<string, unknown>
}

const VALID_MODES: SessionMode[] = ["plan_driven", "quick_fix", "exploration"]
const VALID_LEVELS: HierarchyLevel[] = ["trajectory", "tactic", "action"]

export async function startSession(directory: string, options: SessionOptions): Promise<SessionResult> {
  const configPath = getEffectivePaths(directory).config
  if (!existsSync(configPath)) {
    return {
      success: false,
      action: "start",
      error: "not configured",
      data: { configured: false },
    }
  }

  const config = await loadConfig(directory)
  const stateManager = createStateManager(directory)
  await initializePlanningDirectory(directory)

  let state = await stateManager.load()
  if (state) {
    const sessionAge = Date.now() - state.session.start_time
    const hoursOld = Math.round(sessionAge / (1000 * 60 * 60))

    return {
      success: false,
      action: "start",
      error: "session already active",
      data: {
        activeSession: state.session.id,
        hoursOld,
        mode: state.session.mode,
        focus: state.hierarchy.trajectory,
      },
    }
  }

  const mode = options.mode
  const focus = options.focus

  if (!mode || !VALID_MODES.includes(mode)) {
    return {
      success: false,
      action: "start",
      error: "mode required",
      data: { validModes: VALID_MODES },
    }
  }

  if (!focus?.trim()) {
    return {
      success: false,
      action: "start",
      error: "focus required",
      data: {},
    }
  }

  const sessionId = generateSessionId()
  state = createBrainState(sessionId, config, mode)
  const oldTrajectory = state.hierarchy.trajectory

  state = unlockSession(state)
  state.session.mode = mode

  const now = new Date()
  const stamp = generateStamp(now)
  const rootNode = createNode("trajectory", focus, "active", now)
  let tree = createTree()
  tree = setRoot(tree, rootNode)
  await saveTree(directory, tree)

  const projection = toBrainProjection(tree)
  state.hierarchy = { ...state.hierarchy, ...projection }
  state = resetComplexityNudge(state)
  await stateManager.save(state)

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

  await writeFile(join(getEffectivePaths(directory).activeDir, sessionFileName), sessionContent)

  await registerSession(directory, stamp, sessionFileName, {
    created: now.getTime(),
    mode,
    trajectory: focus,
  })

  await generateIndexMd(directory)
  await saveAnchors(directory, { anchors: [], version: "1.0.0" })

  return {
    success: true,
    action: "start",
    data: {
      sessionId: state.session.id,
      mode: state.session.mode,
      focus: state.hierarchy.trajectory,
      governanceStatus: state.session.governance_status,
      replacedTrajectory: Boolean(oldTrajectory && oldTrajectory !== focus),
      previousTrajectory: oldTrajectory || null,
    },
  }
}

export async function updateSession(directory: string, updates: SessionUpdates): Promise<SessionResult> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return {
      success: false,
      action: "update",
      error: "no active session",
      data: { active: false },
    }
  }

  const targetLevel = updates.level || "tactic"
  if (!VALID_LEVELS.includes(targetLevel)) {
    return {
      success: false,
      action: "update",
      error: "invalid level",
      data: { validLevels: VALID_LEVELS },
    }
  }

  const content = updates.content
  if (!content?.trim()) {
    return {
      success: false,
      action: "update",
      error: "content required",
      data: {},
    }
  }

  const hierarchyUpdate: Partial<BrainState["hierarchy"]> = {}
  if (targetLevel === "trajectory") {
    hierarchyUpdate.trajectory = content
    hierarchyUpdate.tactic = ""
    hierarchyUpdate.action = ""
  } else if (targetLevel === "tactic") {
    hierarchyUpdate.tactic = content
    hierarchyUpdate.action = ""
  } else {
    hierarchyUpdate.action = content
  }

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

  return {
    success: true,
    action: "update",
    data: {
      level: targetLevel,
      content,
      hierarchy: {
        trajectory: updatedState.hierarchy.trajectory,
        tactic: updatedState.hierarchy.tactic,
        action: updatedState.hierarchy.action,
      },
      contextUpdates: updatedState.metrics.context_updates,
    },
  }
}

export async function closeSession(directory: string, summary?: string): Promise<SessionResult> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return {
      success: false,
      action: "close",
      error: "no active session",
      data: { active: false },
    }
  }

  const activeMd = await readActiveMd(directory)
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

  if (state.hierarchy.trajectory) {
    archiveLines.push(`- **Trajectory**: ${state.hierarchy.trajectory}`)
  }
  if (state.hierarchy.tactic) {
    archiveLines.push(`- **Tactic**: ${state.hierarchy.tactic}`)
  }
  if (state.hierarchy.action) {
    archiveLines.push(`- **Action**: ${state.hierarchy.action}`)
  }

  archiveLines.push("")
  archiveLines.push("## Session Content")
  archiveLines.push(activeMd.body)
  const archiveContent = archiveLines.filter(Boolean).join("\n")

  await archiveSession(directory, sessionId, archiveContent)

  const summaryLine =
    summary ||
    `Session ${sessionId}: ${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`
  await updateIndexMd(directory, summaryLine)

  try {
    const exportData = generateExportData(state, summaryLine)
    const exportDir = getExportDir(directory)
    await mkdir(exportDir, { recursive: true })
    const stamp = new Date().toISOString().split("T")[0]
    const baseName = `session_${stamp}_${sessionId}`

    await writeFile(join(exportDir, `${baseName}.json`), generateJsonExport(exportData))
    await writeFile(join(exportDir, `${baseName}.md`), generateMarkdownExport(exportData, activeMd.body))
  } catch {
    // Non-fatal export failure.
  }

  if (treeExists(directory)) {
    const tree = await loadTree(directory)
    tree.root = null
    tree.cursor = null
    await saveTree(directory, tree)
  }

  await resetActiveMd(directory)

  const config = await loadConfig(directory)
  const newSessionId = generateSessionId()
  const newState = createBrainState(newSessionId, config)
  await stateManager.save(lockSession(newState))

  const archives = await listArchives(directory)

  return {
    success: true,
    action: "close",
    data: {
      sessionId,
      durationMs,
      durationMinutes: Math.round(durationMs / 60000),
      turnCount: state.metrics.turn_count,
      filesTouched: state.metrics.files_touched.length,
      contextUpdates: state.metrics.context_updates,
      archivesCount: archives.length,
      summary: summaryLine,
    },
  }
}

export async function getSessionStatus(directory: string): Promise<SessionStatus> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return {
      active: false,
      session: null,
    }
  }

  const durationMs = Date.now() - state.session.start_time
  return {
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
  }
}

export async function resumeSession(directory: string, sessionId: string): Promise<SessionResult> {
  const sessionsDir = join(directory, "sessions")

  if (!sessionId) {
    try {
      const files = await readdir(sessionsDir)
      const sessionFiles = files.filter(f => f.startsWith("session-") && f.endsWith(".json"))

      if (sessionFiles.length === 0) {
        return {
          success: false,
          action: "resume",
          error: "no exported sessions",
          data: { available: [] },
        }
      }

      return {
        success: false,
        action: "resume",
        error: "sessionId required",
        data: {
          availableCount: sessionFiles.length,
        },
      }
    } catch (err: unknown) {
      return {
        success: false,
        action: "resume",
        error: err instanceof Error ? err.message : String(err),
        data: {},
      }
    }
  }

  const stateManager = createStateManager(directory)
  const existing = await stateManager.load()

  if (existing && existing.session.governance_status === "OPEN") {
    return {
      success: false,
      action: "resume",
      error: "session already active",
      data: { sessionId: existing.session.id },
    }
  }

  const config = await loadConfig(directory)
  const newSessionId = generateSessionId()
  const state = createBrainState(newSessionId, config, "plan_driven")
  state.session.mode = "plan_driven"

  // CHIMERA-5 Fix: Restore cursor from exported BrainState (flat JSON files)
  // Session exports are stored as flat JSON files in sessions/ or sessions/archive/exports/
  // NOT in nested directories like sessions/{sessionId}/trajectory.json
  let restoredCursor: {
    trajectory?: string
    tactic?: string
    action?: string
  } | null = null

  try {
    // Normalize sessionId: strip "session-" prefix and ".json" suffix if present
    const normalizedId = sessionId.replace(/^session-/, "").replace(/\.json$/, "")

    // Try to load the exported BrainState using loadSession
    const exportedState = await loadSession(directory, normalizedId)

    if (exportedState?.hierarchy) {
      // Restore hierarchy from the exported BrainState
      state.hierarchy.trajectory = exportedState.hierarchy.trajectory || ""
      state.hierarchy.tactic = exportedState.hierarchy.tactic || ""
      state.hierarchy.action = exportedState.hierarchy.action || ""

      restoredCursor = {
        trajectory: state.hierarchy.trajectory,
        tactic: state.hierarchy.tactic,
        action: state.hierarchy.action,
      }
    }
  } catch {
    // Non-fatal: cursor restore is best-effort
    // Session will still start with empty hierarchy
  }

  await stateManager.save(unlockSession(state))

  return {
    success: true,
    action: "resume",
    data: {
      sessionId: newSessionId,
      fromSession: sessionId,
      mode: state.session.mode,
      restored: true,
      restoredCursor,
      note: restoredCursor
        ? "Started new session with restored cursor"
        : "Started new session (cursor restore unavailable)",
    },
  }
}
