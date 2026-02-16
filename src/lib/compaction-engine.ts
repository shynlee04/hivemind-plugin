import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { loadConfig, createStateManager } from "./persistence.js"
import {
  readActiveMd,
  archiveSession,
  updateIndexMd,
  resetActiveMd,
  listArchives,
  getExportDir,
} from "./planning-fs.js"
import {
  generateExportData,
  generateJsonExport,
  generateMarkdownExport,
} from "./session-export.js"
import { loadMems, saveMems, addMem } from "./mems.js"
import { createLogger } from "./logging.js"
import { getEffectivePaths } from "./paths.js"
import {
  loadTree,
  saveTree,
  createTree,
  toAsciiTree,
  getTreeStats,
  treeExists,
  detectGaps,
  getAncestors,
  flattenTree,
  findNode,
  countCompleted,
  pruneCompleted,
  type HierarchyTree,
} from "./hierarchy-tree.js"
import {
  createBrainState,
  generateSessionId,
  lockSession,
  type BrainState,
  type MetricsState,
} from "../schemas/brain-state.js"
import { getClient } from "../hooks/sdk-context.js"

export interface TurningPoint {
  nodeId: string
  stamp: string
  level: string
  content: string
  type: "completed" | "stale_gap" | "cursor_path"
  detail: string
}

export interface CompactionReport {
  title: string
  sessionId: string
  nextCompactionCount: number
  activeWork: string[]
  cursorPath: string[]
  keyTurningPoints: string[]
  filesTouched: string[]
  resumeInstructions: string[]
  budget: number
  truncated: boolean
  text: string
}

export interface ExecuteCompactionParams {
  directory: string
  summary?: string
}

export interface ExecuteCompactionResult {
  success: boolean
  status?: "Archived" | "Error"
  sessionReset?: boolean
  error?: {
    code: "no_active_session" | "reset_partial_failure"
    message: string
  }
  archivedSessionId?: string
  newSessionId?: string | null
  summaryLine?: string
  legacyStatusText?: string
  metrics?: {
    turns: number
    filesTouched: number
    totalArchives: number
  }
  purification?: {
    turningPoints: number
    prunedCount: number
    report: CompactionReport
    summary: string
  }
  sdkSession?: {
    created: boolean
    id: string | null
    error: string | null
    note: string | null
  }
}

export function identifyTurningPoints(tree: HierarchyTree, _metrics: MetricsState): TurningPoint[] {
  const turningPoints: TurningPoint[] = []
  if (!tree.root) return turningPoints

  if (tree.cursor) {
    const ancestors = getAncestors(tree.root, tree.cursor)
    for (const node of ancestors) {
      turningPoints.push({
        nodeId: node.id,
        stamp: node.stamp,
        level: node.level,
        content: node.content,
        type: "cursor_path",
        detail: `Cursor ancestry: ${node.level} node`,
      })
    }
  }

  const allNodes = flattenTree(tree.root)
  for (const node of allNodes) {
    if (node.status === "complete" && node.completed) {
      turningPoints.push({
        nodeId: node.id,
        stamp: node.stamp,
        level: node.level,
        content: node.content,
        type: "completed",
        detail: `Completed at ${new Date(node.completed).toISOString()}`,
      })
    }
  }

  const gaps = detectGaps(tree)
  for (const gap of gaps) {
    if (gap.severity === "stale") {
      turningPoints.push({
        nodeId: "",
        stamp: gap.from,
        level: "",
        content: `Gap: ${gap.from} -> ${gap.to}`,
        type: "stale_gap",
        detail: `${gap.relationship} gap of ${Math.round(gap.gapMs / 60000)}min (stale)`,
      })
    }
  }

  const typePriority: Record<TurningPoint["type"], number> = {
    cursor_path: 0,
    completed: 1,
    stale_gap: 2,
  }
  turningPoints.sort((a, b) => typePriority[a.type] - typePriority[b.type])

  return turningPoints
}

export function generateNextCompactionReport(
  tree: HierarchyTree,
  turningPoints: TurningPoint[],
  state: BrainState,
): CompactionReport {
  const budget = 1800
  const sessionId = state.session.id
  const nextCompactionCount = (state.compaction_count ?? 0) + 1
  const title = "HiveMind Purification Report"
  const footer = "=== End Purification Report ==="
  const activeWork: string[] = []
  const cursorPath: string[] = []
  const keyTurningPoints: string[] = []
  const filesTouched: string[] = []
  const resumeInstructions: string[] = []

  if (tree.root) {
    const allNodes = flattenTree(tree.root)
    const activeNodes = allNodes.filter((node) => node.status !== "complete")
    for (const node of activeNodes.slice(0, 10)) {
      activeWork.push(`[${node.level}] ${node.content} (${node.stamp})`)
    }
    if (activeNodes.length > 10) {
      activeWork.push(`... and ${activeNodes.length - 10} more`)
    }
  }

  const cursorPoints = turningPoints.filter((point) => point.type === "cursor_path")
  if (cursorPoints.length > 0) {
    cursorPath.push(cursorPoints.map((point) => `${point.level}: ${point.content} (${point.stamp})`).join(" > "))
  }

  const keyPoints = turningPoints.filter((point) => point.type !== "cursor_path")
  if (keyPoints.length > 0) {
    for (const point of keyPoints.slice(0, 8)) {
      keyTurningPoints.push(`[${point.type}] ${point.content}: ${point.detail}`)
    }
  }

  for (const filePath of state.metrics.files_touched.slice(0, 10)) {
    filesTouched.push(filePath)
  }
  if (state.metrics.files_touched.length > 10) {
    filesTouched.push(`... and ${state.metrics.files_touched.length - 10} more`)
  }

  const cursorNode = tree.root && tree.cursor ? findNode(tree.root, tree.cursor) : null
  resumeInstructions.push(`You were working on: ${cursorNode ? cursorNode.content : "(no active cursor)"}`)
  resumeInstructions.push("Next step: Continue from the cursor position shown above")

  const lines: string[] = []
  lines.push(`=== ${title} ===`)
  lines.push(`Session: ${sessionId} | Compaction #${nextCompactionCount}`)
  lines.push("")
  lines.push("## Active Work (what to continue)")
  lines.push(...(activeWork.length > 0 ? activeWork.map((line) => `- ${line}`) : ["- (no active work)"]))
  lines.push("")
  lines.push("## Cursor Path (where you were)")
  lines.push(...(cursorPath.length > 0 ? cursorPath : ["- (no cursor set)"]))
  lines.push("")
  lines.push("## Key Turning Points")
  lines.push(...(keyTurningPoints.length > 0 ? keyTurningPoints.map((line) => `- ${line}`) : ["- (none)"]))
  lines.push("")
  lines.push("## Files Touched")
  lines.push(...(filesTouched.length > 0 ? filesTouched.map((line) => `- ${line}`) : ["- (none)"]))
  lines.push("")
  lines.push("## Resume Instructions")
  lines.push(...resumeInstructions.map((line) => `- ${line}`))
  lines.push(footer)

  let text = lines.join("\n")
  let truncated = false
  if (text.length > budget) {
    const maxBodyLength = budget - footer.length - 1
    text = `${text.slice(0, Math.max(0, maxBodyLength))}\n${footer}`
    truncated = true
  }

  return {
    title,
    sessionId,
    nextCompactionCount,
    activeWork,
    cursorPath,
    keyTurningPoints,
    filesTouched,
    resumeInstructions,
    budget,
    truncated,
    text,
  }
}

export async function executeCompaction(params: ExecuteCompactionParams): Promise<ExecuteCompactionResult> {
  const { directory, summary } = params
  const stateManager = createStateManager(directory)
  const config = await loadConfig(directory)
  const log = await createLogger(getEffectivePaths(directory).logsDir, "compact-session")

  const state = await stateManager.load()
  if (!state) {
    return {
      success: false,
      status: "Error",
      sessionReset: false,
      error: {
        code: "no_active_session",
        message: "No active session to compact. Call declare_intent to start a session first.",
      },
    }
  }

  const activeMd = await readActiveMd(directory)
  const hasTree = treeExists(directory)
  const tree = hasTree ? await loadTree(directory) : createTree()

  const archiveLines = [
    `# Archived Session: ${state.session.id}`,
    "",
    `**Mode**: ${state.session.mode}`,
    `**Started**: ${new Date(state.session.start_time).toISOString()}`,
    `**Archived**: ${new Date().toISOString()}`,
    `**Turns**: ${state.metrics.turn_count}`,
    `**Drift Score**: ${state.metrics.drift_score}/100`,
    `**Files Touched**: ${state.metrics.files_touched.length}`,
    `**Context Updates**: ${state.metrics.context_updates}`,
    "",
    "## Hierarchy at Archive",
  ]

  if (hasTree && tree.root) {
    const stats = getTreeStats(tree)
    archiveLines.push(`Tree (${stats.totalNodes} nodes):`)
    archiveLines.push("```")
    archiveLines.push(toAsciiTree(tree))
    archiveLines.push("```")
    archiveLines.push(`Completed: ${stats.completedNodes} | Active: ${stats.activeNodes}`)
  } else {
    if (state.hierarchy.trajectory) archiveLines.push(`- **Trajectory**: ${state.hierarchy.trajectory}`)
    if (state.hierarchy.tactic) archiveLines.push(`- **Tactic**: ${state.hierarchy.tactic}`)
    if (state.hierarchy.action) archiveLines.push(`- **Action**: ${state.hierarchy.action}`)
  }

  archiveLines.push("")
  archiveLines.push("## Session Content")
  archiveLines.push(activeMd.body)
  const archiveContent = archiveLines.filter(Boolean).join("\n")

  await archiveSession(directory, state.session.id, archiveContent)

  const summaryLine =
    summary ||
    `Session ${state.session.id}: ${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`
  await updateIndexMd(directory, summaryLine)

  try {
    const exportData = generateExportData(state, summaryLine)
    const exportDir = getExportDir(directory)
    await mkdir(exportDir, { recursive: true })

    const timestamp = new Date().toISOString().split("T")[0]
    const baseName = `session_${timestamp}_${state.session.id}`

    await writeFile(join(exportDir, `${baseName}.json`), generateJsonExport(exportData))
    await writeFile(join(exportDir, `${baseName}.md`), generateMarkdownExport(exportData, activeMd.body))
  } catch {
    // Export failure is non-fatal
  }

  try {
    let memsState = await loadMems(directory)
    const autoContent = [
      `Session ${state.session.id}:`,
      summary || `${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`,
      state.hierarchy.trajectory ? `Trajectory: ${state.hierarchy.trajectory}` : "",
      state.hierarchy.tactic ? `Tactic: ${state.hierarchy.tactic}` : "",
    ]
      .filter(Boolean)
      .join(" | ")

    memsState = addMem(
      memsState,
      "context",
      autoContent,
      ["auto-compact", "session-summary"],
      state.session.id,
    )
    await saveMems(directory, memsState)
  } catch {
    // Auto-mem failure is non-fatal
  }

  const turningPoints = identifyTurningPoints(tree, state.metrics)
  const report = generateNextCompactionReport(tree, turningPoints, state)

  let prunedCount = 0
  if (hasTree && countCompleted(tree) >= 5) {
    const pruneResult = pruneCompleted(tree)
    prunedCount = pruneResult.pruned
    await saveTree(directory, pruneResult.tree)
  }

  let resetError: string | null = null
  let newSessionId: string | null = null
  try {
    if (hasTree) {
      await saveTree(directory, createTree())
    }

    await resetActiveMd(directory)

    const compactionCount = (state.compaction_count ?? 0) + 1
    const compactionTime = Date.now()

    newSessionId = generateSessionId()
    const newState = createBrainState(newSessionId, config)
    newState.compaction_count = compactionCount
    newState.last_compaction_time = compactionTime
    newState.next_compaction_report = report.text
    await stateManager.save(lockSession(newState))
  } catch (error: unknown) {
    resetError = `Reset partially failed after archive: ${String(error)}`
  }

  let createdSdkSessionId: string | null = null
  let sdkError: string | null = null
  if (newSessionId) {
    try {
      const client = getClient() as {
        session?: {
          create?: (args: { directory: string; title: string; parentID?: string }) => Promise<{ id?: string }>
        }
      }
      if (client.session?.create) {
        const created = await client.session.create({
          directory,
          title: `HiveMind: ${newSessionId}`,
          parentID: state.session.id || undefined,
        })
        createdSdkSessionId = typeof created?.id === "string" && created.id.length > 0
          ? created.id
          : newSessionId
        await log.info(`[compact-session] Created SDK session ${createdSdkSessionId}`)
      }
    } catch (error: unknown) {
      sdkError = error instanceof Error ? error.message : String(error)
      await log.warn(`[compact-session] Failed to create SDK session: ${sdkError}`)
    }
  }

  const archives = await listArchives(directory)
  const purificationSummary = `Purified: ${turningPoints.length} turning points${prunedCount > 0 ? `, ${prunedCount} completed pruned` : ""}.`
  const sdkNote = createdSdkSessionId ? `Started new SDK session: ${createdSdkSessionId}` : null

  return {
    success: !resetError,
    status: resetError ? "Error" : "Archived",
    sessionReset: !resetError,
    error: resetError
      ? {
          code: "reset_partial_failure",
          message: resetError,
        }
      : undefined,
    archivedSessionId: state.session.id,
    newSessionId,
    summaryLine,
    legacyStatusText: !resetError ? "Archived. Session reset." : "Archived. Session reset failed.",
    metrics: {
      turns: state.metrics.turn_count,
      filesTouched: state.metrics.files_touched.length,
      totalArchives: archives.length,
    },
    purification: {
      turningPoints: turningPoints.length,
      prunedCount,
      report,
      summary: purificationSummary,
    },
    sdkSession: {
      created: createdSdkSessionId !== null,
      id: createdSdkSessionId,
      error: sdkError,
      note: sdkNote,
    },
  }
}
