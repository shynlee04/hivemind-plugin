import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

type JsonRecord = Record<string, unknown>;

interface HierarchyNode {
  id: string;
  level: string;
  content: string;
  status: "active" | "pending" | "complete" | "blocked";
  children: HierarchyNode[];
}

interface HierarchyTree {
  root: HierarchyNode | null;
  cursor: string | null;
}

interface TaskNode {
  id: string;
  title: string;
  status: string;
  lane?: string;
  persona?: string;
  canonical_command?: string;
  hivefiver_action?: string;
  updated_at?: string;
}

export interface DashboardSnapshot {
  overview: {
    sessionId: string;
    mode: string;
    governanceStatus: string;
    driftScore: number;
    turnCount: number;
    filesTouched: number;
    updatedAt: string;
  };
  pipeline: {
    total: number;
    inProgress: number;
    pending: number;
    blocked: number;
    complete: number;
    activeTasks: TaskNode[];
    delegationLanes: string[];
  };
  hierarchy: {
    lines: string[];
    totalNodes: number;
    activeNodes: number;
    depth: number;
  };
  incidents: {
    level: "ok" | "warn" | "critical";
    items: string[];
  };
  codeIntel: {
    source: string;
    updatedAt: string;
    fileCount: number;
    totalTokens: number;
    compressionRatio: number;
    indexedEntities: number;
    codeIntelModules: string[];
  };
  governance: {
    checks: Array<{ key: string; status: "pass" | "warn" | "fail"; detail: string }>;
    anchors: Array<{ key: string; value: string }>;
    memsByShelf: Array<{ shelf: string; count: number }>;
    recentMessages: string[];
  };
  settings: {
    boundaries: string[];
  };
}

async function readJson(filePath: string): Promise<JsonRecord | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    const value = JSON.parse(raw);
    return typeof value === "object" && value !== null ? (value as JsonRecord) : null;
  } catch {
    return null;
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function markerForStatus(status: HierarchyNode["status"]): string {
  if (status === "complete") return "OK";
  if (status === "blocked") return "!!";
  if (status === "pending") return "..";
  return ">>";
}

export function hierarchyToLines(tree: HierarchyTree): string[] {
  if (!tree.root) {
    return ["(empty hierarchy)"];
  }

  const lines: string[] = [];

  const walk = (node: HierarchyNode, prefix: string, isLast: boolean, isRoot: boolean): void => {
    const connector = isRoot ? "" : isLast ? "\\-- " : "|-- ";
    const cursorMark = tree.cursor === node.id ? " <-- cursor" : "";
    const content = node.content.length > 82 ? `${node.content.slice(0, 79)}...` : node.content;
    const levelLabel = node.level.charAt(0).toUpperCase() + node.level.slice(1);
    lines.push(`${prefix}${connector}[${markerForStatus(node.status)}] ${levelLabel}: ${content}${cursorMark}`);

    const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "|   ");
    for (let i = 0; i < node.children.length; i += 1) {
      const child = node.children[i];
      if (!child) continue;
      walk(child, childPrefix, i === node.children.length - 1, false);
    }
  };

  walk(tree.root, "", true, true);
  return lines;
}

export function summarizeTasks(tasks: TaskNode[], activeTaskIds: string[]): DashboardSnapshot["pipeline"] {
  const counts = {
    total: tasks.length,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    complete: 0,
  };

  const lanes = new Set<string>();
  for (const task of tasks) {
    if (task.lane) lanes.add(task.lane);

    if (task.status === "in_progress" || task.status === "active") counts.inProgress += 1;
    else if (task.status === "pending") counts.pending += 1;
    else if (task.status === "blocked") counts.blocked += 1;
    else if (task.status === "complete") counts.complete += 1;
  }

  const index = new Map(tasks.map((task) => [task.id, task]));
  const activeTasks = activeTaskIds
    .map((id) => index.get(id))
    .filter((task): task is TaskNode => Boolean(task));

  return {
    ...counts,
    activeTasks,
    delegationLanes: Array.from(lanes).sort(),
  };
}

export function summarizeMemsByShelf(mems: Array<{ shelf?: string }>): Array<{ shelf: string; count: number }> {
  const buckets = new Map<string, number>();
  for (const mem of mems) {
    const shelf = mem.shelf ?? "unknown";
    buckets.set(shelf, (buckets.get(shelf) ?? 0) + 1);
  }
  return Array.from(buckets.entries())
    .map(([shelf, count]) => ({ shelf, count }))
    .sort((a, b) => b.count - a.count);
}

export function buildGovernanceChecks(options: {
  hasMemoryMemsFile: boolean;
  anchorCount: number;
  activeTaskCount: number;
  driftScore: number;
  pendingChanges: number;
}): Array<{ key: string; status: "pass" | "warn" | "fail"; detail: string }> {
  const checks: Array<{ key: string; status: "pass" | "warn" | "fail"; detail: string }> = [];

  checks.push({
    key: "mems_presence",
    status: options.hasMemoryMemsFile ? "pass" : "fail",
    detail: options.hasMemoryMemsFile
      ? "memory/mems.json detected"
      : "memory/mems.json not found",
  });
  checks.push({
    key: "anchors",
    status: options.anchorCount > 0 ? "pass" : "warn",
    detail: `anchors=${options.anchorCount}`,
  });
  checks.push({
    key: "active_tasks",
    status: options.activeTaskCount > 0 ? "pass" : "warn",
    detail: `active_task_ids=${options.activeTaskCount}`,
  });
  checks.push({
    key: "drift",
    status: options.driftScore >= 50 ? "pass" : "warn",
    detail: `drift_score=${options.driftScore}`,
  });
  checks.push({
    key: "pending_changes",
    status: options.pendingChanges === 0 ? "pass" : "warn",
    detail: `pending_changes=${options.pendingChanges}`,
  });

  return checks;
}

function countHierarchyNodes(node: HierarchyNode | null): { total: number; active: number; depth: number } {
  if (!node) return { total: 0, active: 0, depth: 0 };

  let total = 0;
  let active = 0;
  let depth = 0;
  const stack: Array<{ node: HierarchyNode; d: number }> = [{ node, d: 1 }];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    total += 1;
    if (current.node.status === "active") active += 1;
    if (current.d > depth) depth = current.d;

    for (let i = current.node.children.length - 1; i >= 0; i -= 1) {
      const child = current.node.children[i];
      if (!child) continue;
      stack.push({ node: child, d: current.d + 1 });
    }
  }

  return { total, active, depth };
}

async function listCodeIntelModules(projectRoot: string): Promise<string[]> {
  const codeIntelDir = join(projectRoot, "src", "lib", "code-intel");
  try {
    const entries = await readdir(codeIntelDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export async function loadDashboardSnapshot(projectRoot: string): Promise<DashboardSnapshot> {
  const paths = {
    brain: join(projectRoot, ".hivemind", "state", "brain.json"),
    hierarchy: join(projectRoot, ".hivemind", "state", "hierarchy.json"),
    anchors: join(projectRoot, ".hivemind", "state", "anchors.json"),
    tasks: join(projectRoot, ".hivemind", "graph", "tasks.json"),
    trajectory: join(projectRoot, ".hivemind", "graph", "trajectory.json"),
    graphMems: join(projectRoot, ".hivemind", "graph", "mems.json"),
    memoryMems: join(projectRoot, ".hivemind", "memory", "mems.json"),
    pendingChanges: join(projectRoot, ".hivemind", "graph", "pending-changes.json"),
    codeIntelEntities: join(projectRoot, ".hivemind", "graph", "codebase", "code-intel", "entities.json"),
    codeIntelSummary: join(projectRoot, ".hivemind", "codebase", "code-intel", "codemap-summary.json"),
    compressedCodemap: join(projectRoot, ".hivemind", "codemap", "compressed-codemap.json"),
  };

  const [
    brain,
    hierarchy,
    anchors,
    tasks,
    trajectory,
    graphMems,
    pendingChanges,
    codeIntelEntities,
    codeIntelSummary,
    compressedCodemap,
    codeIntelModules,
    hasMemoryMemsFile,
  ] = await Promise.all([
    readJson(paths.brain),
    readJson(paths.hierarchy),
    readJson(paths.anchors),
    readJson(paths.tasks),
    readJson(paths.trajectory),
    readJson(paths.graphMems),
    readJson(paths.pendingChanges),
    readJson(paths.codeIntelEntities),
    readJson(paths.codeIntelSummary),
    readJson(paths.compressedCodemap),
    listCodeIntelModules(projectRoot),
    fileExists(paths.memoryMems),
  ]);

  const brainSession = (brain?.session ?? {}) as JsonRecord;
  const brainMetrics = (brain?.metrics ?? {}) as JsonRecord;
  const brainRecentMessages = Array.isArray(brain?.recent_messages)
    ? (brain?.recent_messages as JsonRecord[])
    : [];

  const hierarchyTree = (hierarchy as unknown as HierarchyTree) ?? { root: null, cursor: null };
  const hierarchyLines = hierarchyToLines(hierarchyTree);
  const hierarchyStats = countHierarchyNodes(hierarchyTree.root);

  const taskList = Array.isArray(tasks?.tasks) ? (tasks?.tasks as TaskNode[]) : [];
  const activeTaskIds = Array.isArray((trajectory?.trajectory as JsonRecord | undefined)?.active_task_ids)
    ? (((trajectory?.trajectory as JsonRecord | undefined)?.active_task_ids ?? []) as string[])
    : [];
  const pipeline = summarizeTasks(taskList, activeTaskIds);

  const anchorsList = Array.isArray(anchors?.anchors)
    ? (anchors?.anchors as Array<{ key: string; value: string }>)
    : [];
  const graphMemsList = Array.isArray(graphMems?.mems)
    ? (graphMems?.mems as Array<{ shelf?: string }>)
    : [];

  const entitiesNode = codeIntelEntities?.entities;
  const indexedEntities =
    entitiesNode && typeof entitiesNode === "object"
      ? Object.keys(entitiesNode as JsonRecord).length
      : 0;

  const summarySource = codeIntelSummary ? "codemap-summary.json" : compressedCodemap ? "compressed-codemap.json" : "none";
  const summaryPayload = (codeIntelSummary ?? compressedCodemap ?? {}) as JsonRecord;

  const evidencePressure = Number(brainMetrics.evidence_pressure ?? (brainMetrics.governance_counters as JsonRecord | undefined)?.evidence_pressure ?? 0);
  const keywordFlags = Array.isArray(brainMetrics.keyword_flags) ? (brainMetrics.keyword_flags as string[]) : [];
  const incidentItems = [
    ...(evidencePressure >= 90 ? [`evidence pressure high: ${evidencePressure}`] : []),
    ...keywordFlags.map((item) => `keyword flag: ${item}`),
  ];

  const pendingChangeCount = Array.isArray(pendingChanges?.pending_changes)
    ? (pendingChanges?.pending_changes as unknown[]).length
    : 0;

  const governanceChecks = buildGovernanceChecks({
    hasMemoryMemsFile,
    anchorCount: anchorsList.length,
    activeTaskCount: activeTaskIds.length,
    driftScore: Number(brainMetrics.drift_score ?? 0),
    pendingChanges: pendingChangeCount,
  });

  return {
    overview: {
      sessionId: String(brainSession.id ?? "n/a"),
      mode: String(brainSession.mode ?? "plan_driven"),
      governanceStatus: String(brainSession.governance_status ?? "UNKNOWN"),
      driftScore: Number(brainMetrics.drift_score ?? 0),
      turnCount: Number(brainMetrics.turn_count ?? 0),
      filesTouched: Array.isArray(brainMetrics.files_touched) ? (brainMetrics.files_touched as unknown[]).length : 0,
      updatedAt: new Date().toISOString(),
    },
    pipeline,
    hierarchy: {
      lines: hierarchyLines,
      totalNodes: hierarchyStats.total,
      activeNodes: hierarchyStats.active,
      depth: hierarchyStats.depth,
    },
    incidents: {
      level: incidentItems.length === 0 ? "ok" : evidencePressure >= 95 ? "critical" : "warn",
      items: incidentItems.length > 0 ? incidentItems : ["No escalated incident signals"],
    },
    codeIntel: {
      source: summarySource,
      updatedAt: String(summaryPayload.updatedAt ?? summaryPayload.createdAt ?? "n/a"),
      fileCount: Number(summaryPayload.fileCount ?? (summaryPayload.files as unknown[] | undefined)?.length ?? 0),
      totalTokens: Number(summaryPayload.totalTokens ?? 0),
      compressionRatio: Number(summaryPayload.compressionRatio ?? 0),
      indexedEntities,
      codeIntelModules,
    },
    governance: {
      checks: governanceChecks,
      anchors: anchorsList,
      memsByShelf: summarizeMemsByShelf(graphMemsList),
      recentMessages: brainRecentMessages
        .slice(-6)
        .map((entry) => `${String(entry.role ?? "unknown")}: ${String(entry.content ?? "").slice(0, 100)}`),
    },
    settings: {
      boundaries: [
        "Read-mostly sidecar; no write/mutation operations in dashboard-v2",
        "Actions requiring state mutation remain in hivemind_* tools",
        "Keyboard-first navigation only; no hidden mouse-only behavior",
        "Fallback-safe rendering when artifacts are missing",
      ],
    },
  };
}
