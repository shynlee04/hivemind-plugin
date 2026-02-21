import { existsSync } from "fs"
import { readdir, mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"
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
  addChild,
  normalizeDuplicateNodeIds,
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

import { loadMems, saveMems, addMem } from "./mems.js"
import { addGraphMem, loadTrajectory } from "./graph-io.js"
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
  if (state && state.session.governance_status === "OPEN") {
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
  
  // Preserve compaction tracking from previous session (if any)
  const previousCompactionCount = state?.compaction_count ?? 0
  const previousLastCompactionTime = state?.last_compaction_time ?? 0
  
  state = createBrainState(sessionId, config, mode)
  const oldTrajectory = state.hierarchy.trajectory

  state = unlockSession(state)
  state.session.mode = mode
  
  // Carry forward compaction tracking
  state.compaction_count = previousCompactionCount
  state.last_compaction_time = previousLastCompactionTime

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
    sessionId: state.session.id,
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

  // Update the hierarchy tree
  const loadedTree = await loadTree(directory)
  const tree = normalizeDuplicateNodeIds(loadedTree).tree
  const now = new Date()

  let updatedTree = tree
  if (targetLevel === "trajectory") {
    // Update or create trajectory root
    const trajectoryNode = createNode("trajectory", content, "active", now)
    updatedTree = setRoot(createTree(), trajectoryNode)
  } else if (targetLevel === "tactic") {
    // Add tactic under trajectory
    if (tree.root) {
      const tacticNode = createNode("tactic", content, "active", now)
      const result = addChild(tree, tree.root.id, tacticNode)
      if (result.success) {
        updatedTree = result.tree
      }
    }
  } else {
    // Add action under tactic (or trajectory if no tactic)
    if (tree.root) {
      // Find the deepest node to attach to
      let parentNode = tree.root
      if (tree.root.children.length > 0) {
        // Find the most recent tactic node
        const tacticNodes = tree.root.children.filter(n => n.level === "tactic")
        if (tacticNodes.length > 0) {
          parentNode = tacticNodes[tacticNodes.length - 1]
        }
      }
      const actionNode = createNode("action", content, "active", now)
      const result = addChild(tree, parentNode.id, actionNode)
      if (result.success) {
        updatedTree = result.tree
      }
    }
  }
  await saveTree(directory, updatedTree)

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

  // Create auto-compact mem entry
  const memsState = await loadMems(directory)
  const autoCompactMem = addMem(
    memsState,
    "context",
    `Session compacted: ${state.hierarchy.trajectory || "no trajectory"}. Turns: ${state.metrics.turn_count}, Files: ${state.metrics.files_touched.length}.`,
    ["auto-compact", "session-close"],
    sessionId
  )
  await saveMems(directory, autoCompactMem)

  // Persist lifecycle trace in graph mems with FK links.
  // Prefer the current active task FK from trajectory before close cleanup.
  const trajectory = await loadTrajectory(directory)
  const linkedTaskId = trajectory?.trajectory?.active_task_ids?.[0] ?? null
  await addGraphMem(directory, {
    id: randomUUID(),
    session_id: sessionId,
    origin_task_id: linkedTaskId,
    shelf: "context",
    type: "insight",
    content: `Lifecycle compact trace: ${summaryLine}`,
    relevance_score: 0.8,
    staleness_stamp: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  const config = await loadConfig(directory)
  const newSessionId = generateSessionId()
  const newState = createBrainState(newSessionId, config)
  
  // Carry forward compaction tracking fields
  const compactionCount = (state.compaction_count ?? 0) + 1
  newState.compaction_count = compactionCount
  newState.last_compaction_time = Date.now()
  
  // Generate compaction report for next session
  const reportLines = [
    "=== HiveMind Compaction Report ===",
    `Session: ${sessionId}`,
    `Duration: ${Math.round(durationMs / 60000)} minutes`,
    `Turns: ${state.metrics.turn_count}`,
    `Files: ${state.metrics.files_touched.length}`,
    `Drift: ${state.metrics.drift_score}/100`,
    "",
    "Hierarchy:",
    `- Trajectory: ${state.hierarchy.trajectory || "(none)"}`,
    `- Tactic: ${state.hierarchy.tactic || "(none)"}`,
    `- Action: ${state.hierarchy.action || "(none)"}`,
    "",
    `Summary: ${summaryLine}`,
    "=== End Compaction Report ===",
  ]
  newState.next_compaction_report = reportLines.join("\n")
  
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
  const sessionsDir = getEffectivePaths(directory).sessionsDir

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
