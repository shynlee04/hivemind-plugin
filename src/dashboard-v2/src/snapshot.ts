import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { apiClient } from "./api.js";
import { resolveFreshness, resolveRunCorrelation } from "./surfaces.js";

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

interface SwarmSignal {
  kind: "lane" | "task" | "session";
  label: string;
  detail: string;
}

interface TimeTravelTimelineEntry {
  eventId: string;
  sessionId: string;
  actionId: string;
  runKey: string;
  runKeySource: string;
  eventType: string;
  status: string;
  timestamp: string;
}

interface TimeTravelSnapshotSignal {
  state: "available" | "metadata_only" | "missing";
  snapshotId: string | null;
  sessionId: string | null;
  actionId: string | null;
  capturedAt: string | null;
  note: string;
}

interface TimeTravelCompareSignal {
  state: "ready" | "degraded" | "unavailable";
  mode: "in_session" | "cross_session" | "none";
  changeCount: number;
  note: string;
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
  server: {
    connected: boolean;
    version: string | null;
    sessions: Array<{ id: string; title?: string; updatedAt?: string }>;
    agents: Array<{ id: string; name: string; description?: string }>;
    project: { name: string; path: string } | null;
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
  swarm: {
    activeLanes: string[];
    activeOrchestrations: number;
    connectedSessions: number;
    activeAgents: number;
    topAgents: string[];
    signals: SwarmSignal[];
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
  toolRegistry: {
    catalog: {
      totalTools: number;
      tools: string[];
      source: string;
    };
    schema: {
      totalSchemas: number;
      schemas: string[];
      governanceCheckCount: number;
      pendingChanges: number;
    };
    activity: {
      activeTasks: number;
      inProgressTasks: number;
      activeLanes: number;
      activeAgents: number;
      sessions: number;
      recentMessages: number;
    };
  };
  timetravel: {
    timelineState: "loading" | "ready";
    timeline: TimeTravelTimelineEntry[];
    snapshot: TimeTravelSnapshotSignal;
    compare: TimeTravelCompareSignal;
    warnings: string[];
    lastRefreshAt: string;
  };
  surfaces: {
    correlation: {
      canonicalRunKey: string;
      source: string;
      swarm: { runKey: string; source: string };
      toolRegistry: { runKey: string; source: string };
      timetravel: { runKey: string; source: string };
    };
    freshness: {
      generatedAt: string;
      swarm: { lastUpdatedAt: string; ageMs: number; pollCadenceMs: number; staleAfterMs: number; isStale: boolean };
      toolRegistry: { lastUpdatedAt: string; ageMs: number; pollCadenceMs: number; staleAfterMs: number; isStale: boolean };
      timetravel: { lastUpdatedAt: string; ageMs: number; pollCadenceMs: number; staleAfterMs: number; isStale: boolean };
    };
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

function buildSwarmSignals(options: {
  lanes: string[];
  activeTasks: TaskNode[];
  sessions: number;
}): SwarmSignal[] {
  const laneSignals: SwarmSignal[] = options.lanes.slice(0, 3).map((lane) => ({
    kind: "lane",
    label: lane,
    detail: "delegation lane active",
  }));

  const taskSignals: SwarmSignal[] = options.activeTasks.slice(0, 3).map((task) => ({
    kind: "task",
    label: task.persona ?? task.lane ?? task.status,
    detail: task.title,
  }));

  const sessionSignal: SwarmSignal[] = options.sessions > 0
    ? [{ kind: "session", label: String(options.sessions), detail: "live session(s) discovered" }]
    : [];

  return [...laneSignals, ...taskSignals, ...sessionSignal].slice(0, 6);
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

async function listModuleFiles(projectRoot: string, pathParts: string[]): Promise<string[]> {
  const dirPath = join(projectRoot, ...pathParts);
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts") && entry.name !== "index.ts")
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function toTimelineEntries(
  eventRows: unknown,
  fallbackTasks: TaskNode[],
  sessionId: string,
): TimeTravelTimelineEntry[] {
  if (Array.isArray(eventRows)) {
    const entries = eventRows
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const record = row as JsonRecord;
        const eventId = String(record.event_id ?? record.id ?? "").trim();
        const actionId = String(record.action_id ?? "n/a").trim() || "n/a";
        const correlation = resolveRunCorrelation([
          { source: "tool_run_id", value: record.tool_run_id },
          { source: "dispatch_id", value: record.dispatch_id },
          { source: "run_id", value: record.run_id },
          { source: "correlation_id", value: record.correlation_id },
          { source: "action_id", value: record.action_id },
          { source: "event_id", value: record.event_id ?? record.id },
        ]);
        const timestamp = String(record.timestamp ?? record.created_at ?? "n/a").trim() || "n/a";
        const eventType = String(record.event_type ?? record.type ?? "event").trim() || "event";
        const status = String(record.status ?? "active").trim() || "active";
        const eventSessionId = String(record.session_id ?? sessionId).trim() || sessionId;
        if (!eventId) return null;
        return {
          eventId,
          actionId,
          runKey: correlation.runKey,
          runKeySource: correlation.source,
          timestamp,
          eventType,
          status,
          sessionId: eventSessionId,
        };
      })
      .filter((entry): entry is TimeTravelTimelineEntry => Boolean(entry));

    if (entries.length > 0) {
      return entries.sort((a, b) => {
        const ts = b.timestamp.localeCompare(a.timestamp);
        return ts !== 0 ? ts : b.eventId.localeCompare(a.eventId);
      });
    }
  }

  return fallbackTasks.slice(0, 8).map((task, index) => ({
    eventId: task.id || `task-${index + 1}`,
    sessionId,
    actionId: task.id || "n/a",
    runKey: task.id || "n/a",
    runKeySource: task.id ? "task.id" : "fallback",
    eventType: task.hivefiver_action ?? task.canonical_command ?? "task.status",
    status: task.status || "pending",
    timestamp: task.updated_at ?? "n/a",
  }));
}

function latestTaskTimestamp(tasks: TaskNode[]): string | null {
  let latest: string | null = null;
  for (const task of tasks) {
    if (!task.updated_at) continue;
    if (latest === null || task.updated_at.localeCompare(latest) > 0) {
      latest = task.updated_at;
    }
  }
  return latest;
}

function toSnapshotSignal(snapshotRows: unknown, sessionId: string, activeActionId: string | null): TimeTravelSnapshotSignal {
  if (Array.isArray(snapshotRows) && snapshotRows.length > 0) {
    const first = snapshotRows[0];
    if (first && typeof first === "object") {
      const record = first as JsonRecord;
      return {
        state: "available",
        snapshotId: String(record.snapshot_id ?? record.id ?? "snapshot-unknown"),
        sessionId: String(record.session_id ?? sessionId),
        actionId: String(record.action_id ?? activeActionId ?? "n/a"),
        capturedAt: String(record.captured_at ?? record.timestamp ?? "n/a"),
        note: "snapshot payload reference available",
      };
    }
  }

  return {
    state: "metadata_only",
    snapshotId: null,
    sessionId,
    actionId: activeActionId,
    capturedAt: null,
    note: "snapshot unavailable; metadata-only mode active",
  };
}

function toCompareSignal(diffRows: unknown, snapshotSignal: TimeTravelSnapshotSignal): TimeTravelCompareSignal {
  if (Array.isArray(diffRows) && diffRows.length > 0) {
    const first = diffRows[0];
    if (first && typeof first === "object") {
      const record = first as JsonRecord;
      const sameSession = String(record.session_id ?? snapshotSignal.sessionId ?? "") === String(snapshotSignal.sessionId ?? "");
      return {
        state: sameSession ? "ready" : "degraded",
        mode: sameSession ? "in_session" : "cross_session",
        changeCount: Number(record.change_count ?? 0),
        note: sameSession
          ? "diff summary ready for selected session"
          : "cross-session diff is informational only",
      };
    }
  }

  return {
    state: "degraded",
    mode: "none",
    changeCount: 0,
    note: "diff compute unavailable; compare remains in degraded mode",
  };
}

export async function loadServerData() {
  const health = await apiClient.checkHealth();
  const sessions = await apiClient.listSessions();
  const agents = await apiClient.listAgents();
  const project = await apiClient.getProject();

  return {
    connected: health !== null,
    version: health?.version || null,
    sessions: sessions.map((s) => ({
      id: s.id,
      title: s.title,
      updatedAt: s.updatedAt,
    })),
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
    })),
    project: project,
  };
}

export async function loadDashboardSnapshot(projectRoot: string): Promise<DashboardSnapshot> {
  const paths = {
    brain: join(projectRoot, ".hivemind", "state", "brain.json"),
    hierarchy: join(projectRoot, ".hivemind", "state", "hierarchy.json"),
    anchors: join(projectRoot, ".hivemind", "state", "anchors.json"),
    tasks: join(projectRoot, ".hivemind", "graph", "tasks.json"),
    trajectory: join(projectRoot, ".hivemind", "graph", "trajectory.json"),
    graphMems: join(projectRoot, ".hivemind", "graph", "mems.json"),
    timelineEntries: join(projectRoot, ".hivemind", "graph", "timeline-events.json"),
    stateSnapshots: join(projectRoot, ".hivemind", "graph", "state-snapshots.json"),
    stateDiffs: join(projectRoot, ".hivemind", "graph", "state-diffs.json"),
    memoryMems: join(projectRoot, ".hivemind", "memory", "mems.json"),
    pendingChanges: join(projectRoot, ".hivemind", "graph", "pending-changes.json"),
    codeIntelEntities: join(projectRoot, ".hivemind", "graph", "codebase", "code-intel", "entities.json"),
    codeIntelSummary: join(projectRoot, ".hivemind", "codebase", "code-intel", "codemap-summary.json"),
    compressedCodemap: join(projectRoot, ".hivemind", "codemap", "compressed-codemap.json"),
  };

  // Fetch local files AND server data in parallel
  const [
    brain,
    hierarchy,
    anchors,
    tasks,
    trajectory,
    graphMems,
    timelineEntries,
    stateSnapshots,
    stateDiffs,
    pendingChanges,
    codeIntelEntities,
    codeIntelSummary,
    compressedCodemap,
    codeIntelModules,
    toolModules,
    schemaModules,
    hasMemoryMemsFile,
    serverData,
  ] = await Promise.all([
    readJson(paths.brain),
    readJson(paths.hierarchy),
    readJson(paths.anchors),
    readJson(paths.tasks),
    readJson(paths.trajectory),
    readJson(paths.graphMems),
    readJson(paths.timelineEntries),
    readJson(paths.stateSnapshots),
    readJson(paths.stateDiffs),
    readJson(paths.pendingChanges),
    readJson(paths.codeIntelEntities),
    readJson(paths.codeIntelSummary),
    readJson(paths.compressedCodemap),
    listCodeIntelModules(projectRoot),
    listModuleFiles(projectRoot, ["src", "tools"]),
    listModuleFiles(projectRoot, ["src", "schemas"]),
    fileExists(paths.memoryMems),
    loadServerData(), // FIX: Actually fetch server data
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

  const activeOrchestrations = pipeline.activeTasks.filter((task) => task.status === "in_progress" || task.status === "active").length;
  const topAgents = serverData.agents.slice(0, 4).map((agent) => agent.name);
  const swarmSignals = buildSwarmSignals({
    lanes: pipeline.delegationLanes,
    activeTasks: pipeline.activeTasks,
    sessions: serverData.sessions.length,
  });

  const timelineRows = (timelineEntries?.entries ?? timelineEntries?.events ?? timelineEntries?.timeline ?? null) as unknown;
  const snapshotRows = (stateSnapshots?.snapshots ?? stateSnapshots?.entries ?? null) as unknown;
  const diffRows = (stateDiffs?.diffs ?? stateDiffs?.entries ?? null) as unknown;
  const sessionId = String(brainSession.id ?? "n/a");
  const activeActionId = String((trajectory?.trajectory as JsonRecord | undefined)?.active_action_id ?? "").trim() || null;

  const timelineSignal = toTimelineEntries(timelineRows, pipeline.activeTasks, sessionId);
  const snapshotSignal = toSnapshotSignal(snapshotRows, sessionId, activeActionId);
  const compareSignal = toCompareSignal(diffRows, snapshotSignal);
  const timeTravelWarnings = [
    ...(timelineSignal.length === 0 ? ["timeline_unavailable"] : []),
    ...(snapshotSignal.state !== "available" ? ["snapshot_missing"] : []),
    ...(compareSignal.state !== "ready" ? ["diff_unavailable"] : []),
  ];

  const primaryTaskRecord = (pipeline.activeTasks[0] ?? null) as (TaskNode & JsonRecord) | null;
  const swarmCorrelation = resolveRunCorrelation([
    { source: "task.tool_run_id", value: primaryTaskRecord?.tool_run_id },
    { source: "task.dispatch_id", value: primaryTaskRecord?.dispatch_id },
    { source: "task.run_id", value: primaryTaskRecord?.run_id },
    { source: "trajectory.active_action_id", value: activeActionId },
    { source: "task.id", value: primaryTaskRecord?.id },
  ]);
  const toolRegistryCorrelation = resolveRunCorrelation([
    { source: "trajectory.active_action_id", value: activeActionId },
    { source: "task.id", value: primaryTaskRecord?.id },
    { source: "session.id", value: sessionId },
  ]);
  const timeTravelCorrelation = resolveRunCorrelation([
    { source: "timeline.tool_run_id", value: timelineSignal[0]?.runKey },
    { source: "timeline.action_id", value: timelineSignal[0]?.actionId },
    { source: "snapshot.action_id", value: snapshotSignal.actionId },
    { source: "trajectory.active_action_id", value: activeActionId },
  ]);
  const canonicalCorrelation = resolveRunCorrelation([
    { source: `swarm.${swarmCorrelation.source}`, value: swarmCorrelation.runKey },
    { source: `timetravel.${timeTravelCorrelation.source}`, value: timeTravelCorrelation.runKey },
    { source: `toolRegistry.${toolRegistryCorrelation.source}`, value: toolRegistryCorrelation.runKey },
  ]);

  const nowIso = new Date().toISOString();
  const swarmFreshness = resolveFreshness(latestTaskTimestamp(pipeline.activeTasks) ?? timelineSignal[0]?.timestamp, nowIso);
  const toolRegistryFreshness = resolveFreshness(nowIso, nowIso);
  const timetravelFreshness = resolveFreshness(timeTravelWarnings.length === 0 ? timelineSignal[0]?.timestamp : nowIso, nowIso);

  return {
    overview: {
      sessionId: String(brainSession.id ?? "n/a"),
      mode: String(brainSession.mode ?? "plan_driven"),
      governanceStatus: String(brainSession.governance_status ?? "UNKNOWN"),
      driftScore: Number(brainMetrics.drift_score ?? 0),
      turnCount: Number(brainMetrics.turn_count ?? 0),
      filesTouched: Array.isArray(brainMetrics.files_touched) ? (brainMetrics.files_touched as unknown[]).length : 0,
      updatedAt: nowIso,
    },
    server: serverData, // FIX: Use actual server data from loadServerData()
    pipeline,
    swarm: {
      activeLanes: pipeline.delegationLanes,
      activeOrchestrations,
      connectedSessions: serverData.sessions.length,
      activeAgents: serverData.agents.length,
      topAgents,
      signals: swarmSignals,
    },
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
    toolRegistry: {
      catalog: {
        totalTools: toolModules.length,
        tools: toolModules,
        source: "src/tools",
      },
      schema: {
        totalSchemas: schemaModules.length,
        schemas: schemaModules,
        governanceCheckCount: governanceChecks.length,
        pendingChanges: pendingChangeCount,
      },
      activity: {
        activeTasks: pipeline.activeTasks.length,
        inProgressTasks: pipeline.inProgress,
        activeLanes: pipeline.delegationLanes.length,
        activeAgents: serverData.agents.length,
        sessions: serverData.sessions.length,
        recentMessages: brainRecentMessages.length,
      },
    },
    timetravel: {
      timelineState: "ready",
      timeline: timelineSignal,
      snapshot: snapshotSignal,
      compare: compareSignal,
      warnings: timeTravelWarnings,
      lastRefreshAt: nowIso,
    },
    surfaces: {
      correlation: {
        canonicalRunKey: canonicalCorrelation.runKey,
        source: canonicalCorrelation.source,
        swarm: swarmCorrelation,
        toolRegistry: toolRegistryCorrelation,
        timetravel: timeTravelCorrelation,
      },
      freshness: {
        generatedAt: nowIso,
        swarm: swarmFreshness,
        toolRegistry: toolRegistryFreshness,
        timetravel: timetravelFreshness,
      },
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
