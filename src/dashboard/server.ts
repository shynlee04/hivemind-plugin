/**
 * HiveMind TUI Dashboard (Ink)
 *
 * Replaces the old HTTP dashboard with an interactive terminal UI.
 * Features:
 * - Live state polling (default 2s)
 * - EN/VI live toggle
 * - Panels: session, hierarchy, metrics, alerts, traceability
 * - Escalation pressure rendered from evidence-gate signals
 */

import React, { useEffect, useMemo, useState } from "react"
import { Box, Text, render, useApp, useInput } from "ink"
import { execSync } from "node:child_process"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import {
  treeExists,
  loadTree,
  toAsciiTree,
  detectGaps,
  countCompleted,
  getTreeStats,
  type TreeStats,
} from "../lib/hierarchy-tree.js"
import {
  compileEscalatedSignals,
  createDetectionState,
  DEFAULT_THRESHOLDS,
  type DetectionState,
  type EscalatedSignal,
} from "../lib/detection.js"
import { readActiveMd, readManifest, type SessionManifest } from "../lib/planning-fs.js"

export type DashboardLanguage = "en" | "vi"

type Tier = "INFO" | "WARN" | "CRITICAL" | "DEGRADED"

interface DashboardStrings {
  title: string
  session: string
  hierarchy: string
  metrics: string
  alerts: string
  trace: string
  controls: string
  no_session: string
  no_hierarchy: string
  active: string
  mode: string
  governance: string
  automation: string
  retard_profile: string
}

const STRINGS: Record<DashboardLanguage, DashboardStrings> = {
  en: {
    title: "HiveMind Live Governance Dashboard",
    session: "Session",
    hierarchy: "Hierarchy",
    metrics: "Metrics",
    alerts: "Escalation Alerts",
    trace: "Traceability",
    controls: "Controls: [q] quit  [l] language  [r] refresh",
    no_session: "No session initialized. Run `hivemind init`.",
    no_hierarchy: "No hierarchy declared yet.",
    active: "Active",
    mode: "Mode",
    governance: "Governance",
    automation: "Automation",
    retard_profile: "Retard profile active: strict + skeptical + code-review",
  },
  vi: {
    title: "Bang Dieu Khien HiveMind (Truc Tiep)",
    session: "Phien",
    hierarchy: "Phan Cap",
    metrics: "Chi So",
    alerts: "Canh Bao Leo Thang",
    trace: "Truy Vet",
    controls: "Phim: [q] thoat  [l] ngon ngu  [r] lam moi",
    no_session: "Chua khoi tao phien. Hay chay `hivemind init`.",
    no_hierarchy: "Chua khai bao phan cap.",
    active: "Dang Hoat Dong",
    mode: "Che Do",
    governance: "Quan Tri",
    automation: "Tu Dong Hoa",
    retard_profile: "Che do retard: strict + skeptical + bat buoc review",
  },
}

export function getDashboardStrings(language: DashboardLanguage): DashboardStrings {
  return STRINGS[language] ?? STRINGS.en
}

interface SessionView {
  id: string
  status: string
  mode: string
  governanceMode: string
  automationLevel: string
  retardProfile: boolean
}

interface HierarchyView {
  lines: string[]
  totalNodes: number
  depth: number
  activeNodes: number
}

interface MetricsView {
  turnCount: number
  driftScore: number
  filesTouched: number
  contextUpdates: number
  violations: number
  healthScore: number
  writeWithoutReadCount: number
}

interface AlertView {
  tier: Tier
  message: string
  evidence: string
  suggestion?: string
}

interface TraceEntry {
  label: string
  value: string
}

interface TraceView {
  nowIso: string
  gitHash: string
  timeline: TraceEntry[]
}

export interface DashboardSnapshot {
  session: SessionView
  hierarchy: HierarchyView
  metrics: MetricsView
  alerts: AlertView[]
  trace: TraceView
}

function getGitHash(projectRoot: string): string {
  try {
    const out = execSync(`git -C "${projectRoot}" rev-parse --short HEAD`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString("utf-8")
      .trim()
    return out || "unknown"
  } catch {
    return "unknown"
  }
}

function formatSince(timestamp: number): string {
  const delta = Math.max(0, Date.now() - timestamp)
  const mins = Math.floor(delta / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function buildSessionTimeline(manifest: SessionManifest, gitHash: string): TraceEntry[] {
  const entries: TraceEntry[] = []

  if (manifest.active_stamp) {
    entries.push({ label: "active_stamp", value: manifest.active_stamp })
  }

  const recent = [...manifest.sessions]
    .sort((a, b) => b.created - a.created)
    .slice(0, 5)

  for (const session of recent) {
    const activeMark = manifest.active_stamp === session.stamp ? "*" : " "
    entries.push({
      label: `${activeMark}${session.stamp}`,
      value: `${session.status} (${formatSince(session.created)})`,
    })
  }

  entries.push({ label: "git_head", value: gitHash })
  return entries
}

function toAlertView(signal: EscalatedSignal): AlertView {
  return {
    tier: signal.tier,
    message: signal.message,
    evidence: signal.evidence,
    suggestion: signal.suggestion,
  }
}

async function loadHierarchyView(projectRoot: string): Promise<{
  hierarchy: HierarchyView
  maxGapMs?: number
  completedBranches: number
  stats: TreeStats
}> {
  if (!treeExists(projectRoot)) {
    return {
      hierarchy: {
        lines: ["(no hierarchy.json)"],
        totalNodes: 0,
        depth: 0,
        activeNodes: 0,
      },
      completedBranches: 0,
      stats: {
        totalNodes: 0,
        activeNodes: 0,
        completedNodes: 0,
        blockedNodes: 0,
        pendingNodes: 0,
        depth: 0,
      },
    }
  }

  const tree = await loadTree(projectRoot)
  const ascii = toAsciiTree(tree)
  const lines = ascii.split("\n")
  const stats = getTreeStats(tree)
  const gaps = detectGaps(tree)
  const staleGaps = gaps.filter((gap) => gap.severity === "stale")
  const maxGapMs = staleGaps.length > 0
    ? Math.max(...staleGaps.map((gap) => gap.gapMs))
    : undefined

  return {
    hierarchy: {
      lines,
      totalNodes: stats.totalNodes,
      depth: stats.depth,
      activeNodes: stats.activeNodes,
    },
    maxGapMs,
    completedBranches: countCompleted(tree),
    stats,
  }
}

export async function loadDashboardSnapshot(projectRoot: string): Promise<DashboardSnapshot> {
  const config = await loadConfig(projectRoot)
  const stateManager = createStateManager(projectRoot)
  const state = await stateManager.load()

  const gitHash = getGitHash(projectRoot)
  const manifest = await readManifest(projectRoot)
  const timeline = buildSessionTimeline(manifest, gitHash)

  if (!state) {
    return {
      session: {
        id: "(none)",
        status: "LOCKED",
        mode: "plan_driven",
        governanceMode: config.governance_mode,
        automationLevel: config.automation_level,
        retardProfile: config.automation_level === "retard",
      },
      hierarchy: {
        lines: ["(no state)"],
        totalNodes: 0,
        depth: 0,
        activeNodes: 0,
      },
      metrics: {
        turnCount: 0,
        driftScore: 100,
        filesTouched: 0,
        contextUpdates: 0,
        violations: 0,
        healthScore: 100,
        writeWithoutReadCount: 0,
      },
      alerts: [],
      trace: {
        nowIso: new Date().toISOString(),
        gitHash,
        timeline,
      },
    }
  }

  const detection: DetectionState = {
    consecutive_failures: state.metrics.consecutive_failures ?? 0,
    consecutive_same_section: state.metrics.consecutive_same_section ?? 0,
    last_section_content: state.metrics.last_section_content ?? "",
    tool_type_counts: state.metrics.tool_type_counts ?? createDetectionState().tool_type_counts,
    keyword_flags: state.metrics.keyword_flags ?? [],
  }

  const hierarchyBundle = await loadHierarchyView(projectRoot)

  let sessionFileLines: number | undefined
  try {
    const activeMd = await readActiveMd(projectRoot)
    sessionFileLines = activeMd.body ? activeMd.body.split("\n").length : 0
  } catch {
    sessionFileLines = undefined
  }

  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...config.detection_thresholds,
    session_file_lines: config.detection_thresholds?.session_file_lines ?? config.max_active_md_lines,
  }

  const escalatedSignals = compileEscalatedSignals({
    turnCount: state.metrics.turn_count,
    detection,
    completedBranches: hierarchyBundle.completedBranches,
    hierarchyActionEmpty: state.hierarchy.action === "",
    timestampGapMs: hierarchyBundle.maxGapMs,
    sessionFileLines,
    missingTree: !treeExists(projectRoot),
    writeWithoutReadCount: state.metrics.write_without_read_count ?? 0,
    thresholds,
    maxSignals: 5,
  })

  return {
    session: {
      id: state.session.id,
      status: state.session.governance_status,
      mode: state.session.mode,
      governanceMode: config.governance_mode,
      automationLevel: config.automation_level,
      retardProfile: config.automation_level === "retard",
    },
    hierarchy: hierarchyBundle.hierarchy,
    metrics: {
      turnCount: state.metrics.turn_count,
      driftScore: state.metrics.drift_score,
      filesTouched: state.metrics.files_touched.length,
      contextUpdates: state.metrics.context_updates,
      violations: state.metrics.violation_count,
      healthScore: state.metrics.auto_health_score,
      writeWithoutReadCount: state.metrics.write_without_read_count ?? 0,
    },
    alerts: escalatedSignals.map(toAlertView),
    trace: {
      nowIso: new Date().toISOString(),
      gitHash,
      timeline,
    },
  }
}

function tierColor(tier: Tier): "green" | "yellow" | "red" | "magenta" {
  if (tier === "INFO") return "green"
  if (tier === "WARN") return "yellow"
  if (tier === "CRITICAL") return "red"
  return "magenta"
}

function Panel(props: {
  title: string
  lines: string[]
  color?: "cyan" | "green" | "yellow" | "magenta"
}): React.ReactElement {
  const color = props.color ?? "cyan"
  return React.createElement(
    Box,
    {
      borderStyle: "round",
      borderColor: color,
      flexDirection: "column",
      paddingX: 1,
      marginBottom: 1,
    },
    [
      React.createElement(Text, { key: `${props.title}-title`, bold: true, color }, props.title),
      ...props.lines.map((line, index) =>
        React.createElement(Text, { key: `${props.title}-${index}` }, line)
      ),
    ]
  )
}

function DashboardApp(props: {
  projectRoot: string
  initialLanguage: DashboardLanguage
  refreshMs: number
}): React.ReactElement {
  const { exit } = useApp()
  const [language, setLanguage] = useState<DashboardLanguage>(props.initialLanguage)
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  const strings = useMemo(() => getDashboardStrings(language), [language])

  useEffect(() => {
    let mounted = true

    const refresh = async () => {
      try {
        const next = await loadDashboardSnapshot(props.projectRoot)
        if (!mounted) return
        setSnapshot(next)
        setError(null)
      } catch (err) {
        if (!mounted) return
        setError(String(err))
      }
    }

    void refresh()
    const timer = setInterval(() => {
      void refresh()
    }, props.refreshMs)

    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [props.projectRoot, props.refreshMs])

  useInput((input, key) => {
    if (input === "q" || key.escape || (key.ctrl && input === "c")) {
      exit()
      return
    }

    if (input === "l") {
      setLanguage((prev) => (prev === "en" ? "vi" : "en"))
      return
    }

    if (input === "r") {
      void loadDashboardSnapshot(props.projectRoot)
        .then((next) => {
          setSnapshot(next)
          setError(null)
        })
        .catch((err) => {
          setError(String(err))
        })
    }
  })

  if (error) {
    return React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1 },
      [
        React.createElement(Text, { key: "error-title", color: "red", bold: true }, "Dashboard error"),
        React.createElement(Text, { key: "error-message" }, error),
        React.createElement(Text, { key: "error-controls", color: "gray" }, strings.controls),
      ]
    )
  }

  if (!snapshot) {
    return React.createElement(
      Box,
      { flexDirection: "column", paddingX: 1 },
      [
        React.createElement(Text, { key: "loading-title", bold: true }, strings.title),
        React.createElement(Text, { key: "loading-text" }, "Loading..."),
      ]
    )
  }

  const sessionLines = [
    `${strings.active}: ${snapshot.session.id}`,
    `${strings.mode}: ${snapshot.session.mode}`,
    `${strings.governance}: ${snapshot.session.governanceMode} (${snapshot.session.status})`,
    `${strings.automation}: ${snapshot.session.automationLevel}`,
    snapshot.session.retardProfile ? strings.retard_profile : "",
  ].filter(Boolean)

  const hierarchyLines = [
    ...snapshot.hierarchy.lines,
    `nodes=${snapshot.hierarchy.totalNodes} depth=${snapshot.hierarchy.depth} active=${snapshot.hierarchy.activeNodes}`,
  ]

  const metricLines = [
    `turns=${snapshot.metrics.turnCount} drift=${snapshot.metrics.driftScore}/100`,
    `files=${snapshot.metrics.filesTouched} updates=${snapshot.metrics.contextUpdates}`,
    `violations=${snapshot.metrics.violations} health=${snapshot.metrics.healthScore}%`,
    `write_without_read=${snapshot.metrics.writeWithoutReadCount}`,
  ]

  const alertLines = snapshot.alerts.length > 0
    ? snapshot.alerts.flatMap((alert, index) => [
      `[${alert.tier}] ${alert.message}`,
      `  evidence: ${alert.evidence}`,
      alert.suggestion ? `  suggestion: ${alert.suggestion}` : "",
      index < snapshot.alerts.length - 1 ? "" : "",
    ]).filter(Boolean)
    : ["No active escalations."]

  const traceLines = [
    `time=${snapshot.trace.nowIso}`,
    `git=${snapshot.trace.gitHash}`,
    ...snapshot.trace.timeline.map((entry) => `${entry.label}: ${entry.value}`),
  ]

  return React.createElement(
    Box,
    { flexDirection: "column", paddingX: 1 },
    [
      React.createElement(Text, { key: "title", bold: true, color: "cyan" }, strings.title),
      React.createElement(Text, { key: "controls", color: "gray" }, strings.controls),
      React.createElement(Box, { key: "content", flexDirection: "row", marginTop: 1 }, [
        React.createElement(Box, { key: "left", flexDirection: "column", flexGrow: 1, marginRight: 1 }, [
          Panel({ title: strings.session, lines: sessionLines, color: "cyan" }),
          Panel({ title: strings.hierarchy, lines: hierarchyLines.length > 0 ? hierarchyLines : [strings.no_hierarchy], color: "green" }),
        ]),
        React.createElement(Box, { key: "right", flexDirection: "column", flexGrow: 1 }, [
          Panel({ title: strings.metrics, lines: metricLines, color: "yellow" }),
          React.createElement(
            Box,
            {
              key: "alert-panel",
              borderStyle: "round",
              borderColor: snapshot.alerts.length > 0
                ? tierColor(snapshot.alerts[0].tier)
                : "green",
              flexDirection: "column",
              paddingX: 1,
              marginBottom: 1,
            },
            [
              React.createElement(Text, { key: "alert-title", bold: true, color: snapshot.alerts.length > 0 ? tierColor(snapshot.alerts[0].tier) : "green" }, strings.alerts),
              ...alertLines.map((line, index) => React.createElement(Text, { key: `alert-${index}` }, line)),
            ]
          ),
          Panel({ title: strings.trace, lines: traceLines, color: "magenta" }),
        ]),
      ]),
    ]
  )
}

export interface DashboardOptions {
  language?: DashboardLanguage
  refreshMs?: number
}

export async function runDashboardTui(
  projectRoot: string,
  options: DashboardOptions = {}
): Promise<void> {
  const result = render(
    React.createElement(DashboardApp, {
      projectRoot,
      initialLanguage: options.language ?? "en",
      refreshMs: options.refreshMs ?? 2000,
    })
  )

  await result.waitUntilExit()
}
