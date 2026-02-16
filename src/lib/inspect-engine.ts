import { createStateManager } from "./persistence.js"
import { loadAnchors } from "./anchors.js"
import { loadMems, getShelfSummary } from "./mems.js"
import { detectChainBreaks } from "./chain-analysis.js"
import { calculateDriftScore } from "../schemas/brain-state.js"
import { readActiveMd } from "./planning-fs.js"
import {
  loadTree,
  toAsciiTree,
  getAncestors,
  getCursorNode,
  detectGaps,
  treeExists,
  getTreeStats,
} from "./hierarchy-tree.js"

type HierarchyState = {
  trajectory: string
  tactic: string
  action: string
}

type MetricsState = {
  turnCount: number
  driftScore: number
  filesTouched: number
  contextUpdates: number
}

export interface ScanResult {
  active: boolean
  error?: string
  sessionId?: string
  governanceStatus?: string
  mode?: string
  hierarchy?: HierarchyState
  metrics?: MetricsState
  treeStats?: {
    totalNodes: number
    depth: number
    activeNodes: number
    completedNodes: number
    pendingNodes: number
  } | null
  anchorCount?: number
  memCount?: number
  treeAscii?: string
  anchorsPreview?: Array<{ key: string; value: string }>
  memShelfSummary?: Record<string, number>
}

export interface InspectResult {
  active: boolean
  error?: string
  sessionId?: string
  mode?: string
  hierarchy?: HierarchyState
  cursor?: {
    id: string
    level: string
    content: string
    status: string
  } | null
  cursorPath?: Array<{ level: string; content: string; stamp: string }>
  metrics?: MetricsState
  chainBreaks?: string[]
  staleGaps?: Array<{
    from: string
    to: string
    gapHours: number
    relationship: string
  }>
  anchors?: Array<{ key: string; value: string }>
  filesTouched?: string[]
  treeAscii?: string
  planSection?: {
    lines: string[]
    truncatedCount: number
  }
}

export interface DriftReport {
  active: boolean
  error?: string
  driftScore?: number
  healthStatus?: "good" | "warning" | "critical"
  hierarchy?: HierarchyState
  chainBreaks?: string[]
  chainIntact?: boolean
  anchors?: Array<{ key: string; value: string }>
  metrics?: {
    turnCount: number
    filesTouched: number
    contextUpdates: number
    violationCount: number
  }
  recommendation?: "on_track" | "some_drift" | "significant_drift"
}

export async function scanState(directory: string): Promise<ScanResult> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return { active: false, error: "no session" }
  }

  const anchorsState = await loadAnchors(directory)
  const memsState = await loadMems(directory)
  const tree = treeExists(directory) ? await loadTree(directory) : null
  const treeStats = tree?.root ? getTreeStats(tree) : null

  return {
    active: true,
    sessionId: state.session.id,
    governanceStatus: state.session.governance_status,
    mode: state.session.mode,
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
    },
    treeStats: treeStats
      ? {
          totalNodes: treeStats.totalNodes,
          depth: treeStats.depth,
          activeNodes: treeStats.activeNodes,
          completedNodes: treeStats.completedNodes,
          pendingNodes: treeStats.pendingNodes,
        }
      : null,
    anchorCount: anchorsState.anchors.length,
    memCount: memsState.mems.length,
    treeAscii: tree?.root ? toAsciiTree(tree) : undefined,
    anchorsPreview: anchorsState.anchors.slice(0, 5).map((a) => ({ key: a.key, value: a.value.slice(0, 60) })),
    memShelfSummary: getShelfSummary(memsState),
  }
}

export async function deepInspect(directory: string, _target: string): Promise<InspectResult> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return { active: false, error: "no session" }
  }

  const anchorsState = await loadAnchors(directory)
  const activeMd = await readActiveMd(directory)
  const chainBreaks = detectChainBreaks(state)
  const tree = treeExists(directory) ? await loadTree(directory) : null
  const cursorNode = tree?.root && tree.cursor ? getCursorNode(tree) : null
  const ancestors = tree?.root && tree.cursor ? getAncestors(tree.root, tree.cursor) : []
  const gaps = tree?.root ? detectGaps(tree) : []
  const staleGaps = gaps.filter((g) => g.severity === "stale")

  const planSection = extractPlanSection(activeMd.body)

  return {
    active: true,
    sessionId: state.session.id,
    mode: state.session.mode,
    hierarchy: {
      trajectory: state.hierarchy.trajectory,
      tactic: state.hierarchy.tactic,
      action: state.hierarchy.action,
    },
    cursor: cursorNode
      ? {
          id: cursorNode.id,
          level: cursorNode.level,
          content: cursorNode.content,
          status: cursorNode.status,
        }
      : null,
    cursorPath: ancestors.map((n) => ({ level: n.level, content: n.content, stamp: n.stamp })),
    metrics: {
      turnCount: state.metrics.turn_count,
      driftScore: state.metrics.drift_score,
      filesTouched: state.metrics.files_touched.length,
      contextUpdates: state.metrics.context_updates,
    },
    chainBreaks: chainBreaks.map((b) => b.message),
    staleGaps: staleGaps.map((g) => ({
      from: g.from,
      to: g.to,
      gapHours: Math.round((g.gapMs / (60 * 60 * 1000)) * 10) / 10,
      relationship: g.relationship,
    })),
    anchors: anchorsState.anchors.map((a) => ({ key: a.key, value: a.value })),
    filesTouched: state.metrics.files_touched.slice(0, 10),
    treeAscii: tree?.root ? toAsciiTree(tree) : undefined,
    planSection,
  }
}

export async function driftReport(directory: string): Promise<DriftReport> {
  const stateManager = createStateManager(directory)
  const state = await stateManager.load()

  if (!state) {
    return { active: false, error: "no session" }
  }

  const anchorsState = await loadAnchors(directory)
  const chainBreaks = detectChainBreaks(state)
  const driftScore = calculateDriftScore(state)

  return {
    active: true,
    driftScore,
    healthStatus: driftScore >= 70 ? "good" : driftScore >= 40 ? "warning" : "critical",
    hierarchy: {
      trajectory: state.hierarchy.trajectory,
      tactic: state.hierarchy.tactic,
      action: state.hierarchy.action,
    },
    chainBreaks: chainBreaks.map((b) => b.message),
    chainIntact: chainBreaks.length === 0,
    anchors: anchorsState.anchors.map((a) => ({ key: a.key, value: a.value })),
    metrics: {
      turnCount: state.metrics.turn_count,
      filesTouched: state.metrics.files_touched.length,
      contextUpdates: state.metrics.context_updates,
      violationCount: state.metrics.violation_count,
    },
    recommendation:
      driftScore >= 70 && chainBreaks.length === 0
        ? "on_track"
        : driftScore >= 40
          ? "some_drift"
          : "significant_drift",
  }
}

function extractPlanSection(body: string): { lines: string[]; truncatedCount: number } | undefined {
  if (!body.includes("## Plan")) {
    return undefined
  }

  const planStart = body.indexOf("## Plan")
  const planEnd = body.indexOf("\n## ", planStart + 1)
  const planSection = planEnd > -1 ? body.substring(planStart, planEnd) : body.substring(planStart)
  const planLines = planSection.trim().split("\n")

  if (planLines.length > 10) {
    return { lines: planLines.slice(0, 10), truncatedCount: planLines.length - 10 }
  }

  return { lines: planLines, truncatedCount: 0 }
}
