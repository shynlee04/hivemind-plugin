import { execSync } from "node:child_process";
import { createStateManager, loadConfig } from "../lib/persistence.js";
import { isCoachAutomation, normalizeAutomationLabel } from "../schemas/config.js";
import {
  treeExists,
  loadTree,
  toAsciiTree,
  detectGaps,
  countCompleted,
  getTreeStats,
  type TreeStats,
} from "../lib/hierarchy-tree.js";
import {
  compileEscalatedSignals,
  createDetectionState,
  DEFAULT_THRESHOLDS,
  type DetectionState,
  type EscalatedSignal,
} from "../lib/detection.js";
import { readActiveMd, readManifest, type SessionManifest } from "../lib/planning-fs.js";
import {
  DashboardSnapshot,
  HierarchyView,
  TraceEntry,
  AlertView
} from "./types.js";

function getGitHash(projectRoot: string): string {
  try {
    const out = execSync(`git -C "${projectRoot}" rev-parse --short HEAD`, {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString("utf-8")
      .trim();
    return out || "unknown";
  } catch {
    return "unknown";
  }
}

function formatSince(timestamp: number): string {
  const delta = Math.max(0, Date.now() - timestamp);
  const mins = Math.floor(delta / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function buildSessionTimeline(manifest: SessionManifest, gitHash: string): TraceEntry[] {
  const entries: TraceEntry[] = [];

  if (manifest.active_stamp) {
    entries.push({ label: "active_stamp", value: manifest.active_stamp });
  }

  const recent = [...manifest.sessions]
    .sort((a, b) => b.created - a.created)
    .slice(0, 5);

  for (const session of recent) {
    const activeMark = manifest.active_stamp === session.stamp ? "*" : " ";
    entries.push({
      label: `${activeMark}${session.stamp}`,
      value: `${session.status} (${formatSince(session.created)})`,
    });
  }

  entries.push({ label: "git_head", value: gitHash });
  return entries;
}

function toAlertView(signal: EscalatedSignal): AlertView {
  return {
    tier: signal.tier,
    message: signal.message,
    evidence: signal.evidence,
    suggestion: signal.suggestion,
  };
}

async function loadHierarchyView(projectRoot: string): Promise<{
  hierarchy: HierarchyView;
  maxGapMs?: number;
  completedBranches: number;
  stats: TreeStats;
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
    };
  }

  const tree = await loadTree(projectRoot);
  const ascii = toAsciiTree(tree);
  const lines = ascii.split("\n");
  const stats = getTreeStats(tree);
  const gaps = detectGaps(tree);
  const staleGaps = gaps.filter((gap) => gap.severity === "stale");
  const maxGapMs = staleGaps.length > 0
    ? Math.max(...staleGaps.map((gap) => gap.gapMs))
    : undefined;

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
  };
}

export async function loadDashboardSnapshot(projectRoot: string): Promise<DashboardSnapshot> {
  const config = await loadConfig(projectRoot);
  const stateManager = createStateManager(projectRoot);
  const state = await stateManager.load();

  const gitHash = getGitHash(projectRoot);
  const manifest = await readManifest(projectRoot);
  const timeline = buildSessionTimeline(manifest, gitHash);

  if (!state) {
    return {
      session: {
        id: "(none)",
        status: "LOCKED",
        mode: "plan_driven",
        governanceMode: config.governance_mode,
        automationLevel: normalizeAutomationLabel(config.automation_level),
        coachProfile: isCoachAutomation(config.automation_level),
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
    };
  }

  const detection: DetectionState = {
    consecutive_failures: state.metrics.consecutive_failures ?? 0,
    consecutive_same_section: state.metrics.consecutive_same_section ?? 0,
    last_section_content: state.metrics.last_section_content ?? "",
    tool_type_counts: state.metrics.tool_type_counts ?? createDetectionState().tool_type_counts,
    keyword_flags: state.metrics.keyword_flags ?? [],
  };

  const hierarchyBundle = await loadHierarchyView(projectRoot);

  let sessionFileLines: number | undefined;
  try {
    const activeMd = await readActiveMd(projectRoot);
    sessionFileLines = activeMd.body ? activeMd.body.split("\n").length : 0;
  } catch {
    sessionFileLines = undefined;
  }

  const thresholds = {
    ...DEFAULT_THRESHOLDS,
    ...config.detection_thresholds,
    session_file_lines: config.detection_thresholds?.session_file_lines ?? config.max_active_md_lines,
  };

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
  });

  return {
    session: {
      id: state.session.id,
      status: state.session.governance_status,
      mode: state.session.mode,
      governanceMode: config.governance_mode,
      automationLevel: normalizeAutomationLabel(config.automation_level),
      coachProfile: isCoachAutomation(config.automation_level),
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
  };
}
