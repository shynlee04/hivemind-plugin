import { readManifest } from "./manifest.js"
import { loadGraphTasks } from "./graph/reader.js"
import { getEffectivePaths } from "./paths.js"
import { ensureHivemindIngressClassification } from "./hivemind-ingress-policy.js"
import type { GraphTasksState } from "../schemas/graph-state.js"
import type { TaskItem, TaskManifest } from "../schemas/manifest.js"

export interface CanonicalTaskAuthoritySnapshot {
  source: "state.tasks" | "graph.tasks" | "empty"
  manifest: TaskManifest
}

/**
 * Create an empty canonical task manifest for callers that still need a stable
 * task payload when no task state has been materialized yet.
 *
 * @param sessionId - Session identifier associated with the current read.
 * @returns Empty task manifest seeded for the supplied session.
 */
function createEmptyTaskManifest(sessionId: string): TaskManifest {
  return {
    session_id: sessionId,
    updated_at: Date.now(),
    tasks: [],
  }
}

/**
 * Normalize graph-task status values into the task manifest contract.
 *
 * @param status - Status read from graph/tasks.json.
 * @returns Canonical task status used by the task manifest layer.
 */
function normalizeGraphTaskStatus(status: string | undefined): TaskItem["status"] {
  switch (String(status ?? "pending").toLowerCase()) {
    case "active":
      return "in_progress"
    case "complete":
      return "completed"
    default:
      return status ?? "pending"
  }
}

/**
 * Convert graph task state into the canonical task manifest shape used by
 * runtime tools, snapshots, and compatibility projections.
 *
 * @param graphTasks - Raw or validated graph task state.
 * @param sessionId - Session identifier attached to the synthesized manifest.
 * @returns Canonical task manifest synthesized from graph task state.
 */
function manifestFromGraphTasks(graphTasks: GraphTasksState, sessionId: string): TaskManifest {
  const updatedAt = graphTasks.tasks.reduce((latest, task) => {
    const parsed = Date.parse(task.updated_at)
    return Number.isFinite(parsed) ? Math.max(latest, parsed) : latest
  }, 0)

  return {
    session_id: sessionId,
    updated_at: updatedAt || Date.now(),
    tasks: graphTasks.tasks.map<TaskItem>((task) => ({
      id: task.id,
      text: task.title,
      status: normalizeGraphTaskStatus(task.status),
      priority: task.priority,
      domain: task.domain,
      lane: task.lane,
      persona: task.persona,
      source: task.source,
      hivefiver_action: task.hivefiver_action,
      validation_attempts: task.validation_attempts,
      max_validation_attempts: task.max_validation_attempts,
      evidence_confidence: task.evidence_confidence,
      menu_step: task.menu_step,
      menu_total: task.menu_total,
      recommended_skills: task.recommended_skills,
      canonical_command: task.canonical_command,
      acceptance_criteria: task.acceptance_criteria,
      dependencies: task.dependencies,
      lineage_owner: task.lineage_owner,
      owner_agent: task.owner_agent,
      origin_session_id: task.origin_session_id,
      parent_session_id: task.parent_session_id ?? undefined,
      session_kind: task.session_kind,
      workflow_topology: task.workflow_topology,
      related_entities: task.related_entities,
    })),
  }
}

/**
 * Read canonical task authority using the phase target contract:
 * `state/tasks.json` is the operational write model, while `graph/tasks.json`
 * is the durable global fallback when state tasks have not yet materialized.
 *
 * @param directory - Project root used to resolve `.hivemind` task paths.
 * @param sessionId - Session identifier to seed fallback manifests with.
 * @returns Canonical task authority snapshot and the source it came from.
 */
export async function readCanonicalTaskAuthority(
  directory: string,
  sessionId = "unknown",
): Promise<CanonicalTaskAuthoritySnapshot> {
  const paths = getEffectivePaths(directory)
  ensureHivemindIngressClassification(
    directory,
    paths.tasks,
    ["authority"],
    "readCanonicalTaskAuthority state/tasks read",
  )
  const stateTasks = await readManifest<TaskManifest | null>(paths.tasks, null)

  if (stateTasks && Array.isArray(stateTasks.tasks) && stateTasks.tasks.length > 0) {
    return {
      source: "state.tasks",
      manifest: stateTasks,
    }
  }

  ensureHivemindIngressClassification(
    directory,
    paths.graphTasks,
    ["authority"],
    "readCanonicalTaskAuthority graph/tasks fallback read",
  )
  const graphTasks = await loadGraphTasks(directory, { enabled: false })
  if (graphTasks.tasks.length > 0) {
    return {
      source: "graph.tasks",
      manifest: manifestFromGraphTasks(graphTasks, stateTasks?.session_id || sessionId),
    }
  }

  return {
    source: "empty",
    manifest: stateTasks ?? createEmptyTaskManifest(sessionId),
  }
}

/**
 * Render a stable human-readable task snapshot from canonical task authority.
 *
 * @param manifest - Canonical task manifest.
 * @returns Ordered `status: text` summary lines for exports and diagnostics.
 */
export function renderCanonicalTaskSnapshot(manifest: TaskManifest): string[] {
  return manifest.tasks.map((task) => {
    const status = typeof task.status === "string" ? task.status : "pending"
    return `${status}: ${task.text}`
  })
}
