/**
 * Task Governance — Consolidated task authority, ownership, and topology.
 *
 * Merged from: task-authority.ts, task-ownership.ts, task-topology.ts
 * Date: 2026-03-12
 *
 * ## Responsibilities
 * - **Authority**: Reads canonical task state from state/tasks.json or graph/tasks.json
 * - **Ownership**: Resolves lineage owner, agent, and session-kind metadata
 * - **Topology**: Normalizes and resolves workflow topology (parallel, dependent, etc.)
 *
 * @module task-governance
 */

import { readManifest } from "./manifest.js"
import { loadGraphTasks } from "./graph/reader.js"
import { getEffectivePaths } from "./paths.js"
import { ensureHivemindIngressClassification } from "./hivemind-ingress-policy.js"
import { inferSessionKindFromRole } from "./session-role.js"
import { classifyLineageScope } from "./session-intent-classifier.js"
import type { GraphTasksState } from "../schemas/graph-state.js"
import type { TaskItem, TaskManifest, TaskLineageOwner, TaskSessionKind, TaskWorkflowTopology } from "../schemas/manifest.js"
import type { LineageScope, SessionKind } from "../schemas/brain-state.js"

// ─── Authority ───────────────────────────────────────────────────────────────

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

// ─── Ownership ───────────────────────────────────────────────────────────────

export interface TaskOwnershipContext {
  lineage_owner: TaskLineageOwner
  owner_agent?: string
  origin_session_id?: string
  parent_session_id?: string
  session_kind: TaskSessionKind
}

function normalizeAgentName(agentName?: string): string | undefined {
  if (typeof agentName !== "string") return undefined
  const normalized = agentName.trim().toLowerCase()
  if (!normalized || normalized === "unknown" || normalized === "unresolved") {
    return undefined
  }
  return normalized
}

/**
 * Normalize arbitrary lineage-owner input into the canonical task contract.
 *
 * @param value - Raw lineage owner candidate.
 * @returns Canonical task lineage owner, or `undefined` when invalid.
 */
export function normalizeTaskLineageOwner(value?: string): TaskLineageOwner | undefined {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (normalized === "hiveminder" || normalized === "hivefiver" || normalized === "unknown") {
    return normalized
  }
  return undefined
}

/**
 * Normalize arbitrary session-kind input into the canonical task contract.
 *
 * @param value - Raw session-kind candidate.
 * @returns Canonical task session kind, or `undefined` when invalid.
 */
export function normalizeTaskSessionKind(value?: string): TaskSessionKind | undefined {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (normalized === "main" || normalized === "sub" || normalized === "unresolved") {
    return normalized
  }
  return undefined
}

/**
 * Convert the current brain-state lineage scope into the explicit task lineage
 * owner labels that will survive across task projections, graph sync, and
 * cross-session monitoring flows.
 *
 * @param lineageScope - Current session lineage scope.
 * @returns Task lineage owner label used by the canonical task contract.
 */
export function mapLineageScopeToTaskOwner(lineageScope?: LineageScope): TaskLineageOwner {
  switch (lineageScope) {
    case "meta-framework":
      return "hivefiver"
    case "project":
      return "hiveminder"
    default:
      return "unknown"
  }
}

/**
 * Resolve canonical task ownership from the best available session/runtime
 * signals without allowing unresolved compatibility fields to become primary
 * authority.
 *
 * @param input - Current agent/session ownership signals.
 * @returns Normalized task ownership metadata for the canonical task contract.
 */
export function resolveTaskOwnershipContext(input: {
  ownerAgent?: string
  lineageScope?: LineageScope
  originSessionId?: string
  parentSessionId?: string | null
  sessionKind?: SessionKind
}): TaskOwnershipContext {
  const owner_agent = normalizeAgentName(input.ownerAgent)
  const parent_session_id =
    typeof input.parentSessionId === "string" && input.parentSessionId.trim().length > 0
      ? input.parentSessionId.trim()
      : undefined

  const session_kind: TaskSessionKind =
    normalizeTaskSessionKind(input.sessionKind)
      ? normalizeTaskSessionKind(input.sessionKind)!
      : parent_session_id
        ? "sub"
        : owner_agent
          ? inferSessionKindFromRole(owner_agent)
          : "unresolved"

  const lineageScope: LineageScope =
    input.lineageScope && input.lineageScope !== "unknown"
      ? input.lineageScope
      : owner_agent
        ? classifyLineageScope(owner_agent)
        : "unknown"

  return {
    lineage_owner: mapLineageScopeToTaskOwner(lineageScope),
    owner_agent,
    origin_session_id:
      typeof input.originSessionId === "string" && input.originSessionId.trim().length > 0
        ? input.originSessionId.trim()
        : undefined,
    parent_session_id,
    session_kind,
  }
}

// ─── Topology ────────────────────────────────────────────────────────────────

/**
 * Normalize arbitrary workflow-topology input into the canonical task contract.
 *
 * @param value - Raw workflow-topology candidate.
 * @returns Canonical task workflow topology, or `undefined` when invalid.
 */
export function normalizeTaskWorkflowTopology(value?: string): TaskWorkflowTopology | undefined {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (
    normalized === "parallel" ||
    normalized === "dependent" ||
    normalized === "independent" ||
    normalized === "inter-dependent" ||
    normalized === "unclassified"
  ) {
    return normalized
  }
  return undefined
}

/**
 * Resolve workflow topology for the canonical task contract.
 *
 * Explicit topology wins. When topology is omitted, dependency-bearing tasks
 * become `dependent` and all others default to `unclassified`.
 *
 * @param input - Workflow-topology hints for the current task.
 * @returns Canonical task workflow topology.
 */
export function resolveTaskWorkflowTopology(input: {
  workflowTopology?: string
  dependencies?: string[]
}): TaskWorkflowTopology {
  const explicit = normalizeTaskWorkflowTopology(input.workflowTopology)
  if (explicit) {
    return explicit
  }

  const hasDependencies = Array.isArray(input.dependencies) && input.dependencies.length > 0
  return hasDependencies ? "dependent" : "unclassified"
}
