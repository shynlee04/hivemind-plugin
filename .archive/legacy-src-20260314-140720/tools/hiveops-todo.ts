/**
 * HiveOps TODO state machine.
 *
 * This is the canonical `src` owner for the legacy `hiveops_todo` behavior.
 * Canonical write authority lives in `.hivemind/state/tasks.json`, with graph
 * synchronization to `.hivemind/graph/tasks.json`. The legacy
 * `.hivemind/state/todo.json` file is materialized as a compatibility artifact only.
 *
 * @example Agent calls: hiveops_todo({ action: "add", content: "Fix auth bug", priority: "high" })
 * @example Agent calls: hiveops_todo({ action: "complete", id: "task-1" })
 * @example Agent calls: hiveops_todo({ action: "list" })
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"

import { createStateManager } from "../lib/persistence.js"
import { getEffectivePaths } from "../lib/paths.js"
import { getHiveOpsPaths } from "../lib/hiveops-paths.js"
import { readManifest, writeManifest } from "../lib/manifest.js"
import { resolveCanonicalSessionId } from "../lib/graph-io.js"
import { resolveRuntimeSessionLineage } from "../lib/runtime-session-lineage.js"
import { resolveTaskOwnershipContext, type TaskOwnershipContext } from "../lib/task-governance.js"
import { normalizeTaskWorkflowTopology, resolveTaskWorkflowTopology } from "../lib/task-governance.js"
import { flushMutations, flushTaskManifestMutations, queueTaskManifestMutation } from "../lib/state-mutation-queue.js"
import type { TaskManifest, TaskItem, TaskWorkflowTopology } from "../schemas/manifest.js"

type HiveOpsTodoAction = "add" | "complete" | "start" | "block" | "cancel" | "list" | "deps" | "export"

interface LegacyTodoItem {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled"
  priority: "high" | "medium" | "low"
  created: number
  updated: number
  hierarchy_node_id?: string
  depends_on: string[]
  blocks: string[]
  workflow_topology?: TaskWorkflowTopology
  domain?: string
  plan_id?: string
  evidence?: string
}

interface LegacyTodoState {
  items: LegacyTodoItem[]
  version: number
  lastSync: number
  activeItem: string | null
}

const MAX_ACTIVE_ITEMS = 40
const DEFAULT_SESSION_ID = "unknown"

/**
 * Create a deterministic task manifest fallback for projects that have not yet
 * materialized task authority.
 *
 * @param sessionId - Session identifier associated with the manifest.
 * @returns Empty task manifest seeded for the current session.
 */
function createDefaultTaskManifest(sessionId: string): TaskManifest {
  return {
    session_id: sessionId,
    updated_at: Date.now(),
    tasks: [],
  }
}

/**
 * Load canonical task authority from `.hivemind/state/tasks.json`.
 *
 * @param directory - Project root used to resolve `.hivemind` paths.
 * @param sessionId - Session identifier used for fallback manifest creation.
 * @returns Current task manifest, or an empty manifest when none exists yet.
 */
async function loadTaskAuthority(directory: string, sessionId: string): Promise<TaskManifest> {
  const path = getEffectivePaths(directory).tasks
  return readManifest(path, createDefaultTaskManifest(sessionId))
}

/**
 * Materialize a compatibility `todo.json` payload from canonical task authority.
 *
 * @param manifest - Canonical task manifest.
 * @returns Compatibility snapshot matching the legacy `hiveops_todo` contract.
 */
function materializeLegacyTodoState(manifest: TaskManifest): LegacyTodoState {
  const items = manifest.tasks.map<LegacyTodoItem>((task) => ({
    id: task.id,
    content: task.text,
    status: normalizeLegacyStatus(task.status),
    priority: normalizeLegacyPriority(task.priority),
    created: typeof task.created_at === "number" ? task.created_at : 0,
    updated: typeof task.completed_at === "number" ? task.completed_at : manifest.updated_at,
    hierarchy_node_id:
      typeof task.related_entities?.requirement_node_id === "string"
        ? task.related_entities.requirement_node_id
        : undefined,
    depends_on: Array.isArray(task.dependencies) ? [...task.dependencies] : [],
    blocks: [],
    workflow_topology: resolveTaskWorkflowTopology({
      workflowTopology: task.workflow_topology,
      dependencies: task.dependencies,
    }),
    domain: typeof task.domain === "string" ? task.domain : undefined,
    plan_id:
      typeof task.related_entities?.plan_id === "string"
        ? task.related_entities.plan_id
        : undefined,
    evidence: typeof task.evidence_confidence === "string" ? task.evidence_confidence : undefined,
  }))

  const byId = new Map(items.map((item) => [item.id, item]))
  for (const item of items) {
    for (const dependencyId of item.depends_on) {
      const dependency = byId.get(dependencyId)
      if (dependency && !dependency.blocks.includes(item.id)) {
        dependency.blocks.push(item.id)
      }
    }
  }

  const activeItem = items.find((item) => item.status === "in_progress")?.id ?? null

  return {
    items,
    version: 1,
    lastSync: manifest.updated_at,
    activeItem,
  }
}

/**
 * Normalize task status into the legacy TODO presentation contract.
 *
 * @param status - Canonical task status from the task manifest.
 * @returns Legacy TODO status for compatibility rendering.
 */
function normalizeLegacyStatus(status: TaskItem["status"]): LegacyTodoItem["status"] {
  switch (String(status ?? "pending").toLowerCase()) {
    case "in_progress":
    case "in-progress":
      return "in_progress"
    case "complete":
    case "completed":
      return "completed"
    case "blocked":
      return "blocked"
    case "cancelled":
      return "cancelled"
    default:
      return "pending"
  }
}

/**
 * Normalize task priority into the legacy TODO presentation contract.
 *
 * @param priority - Task priority from the canonical manifest.
 * @returns Legacy TODO priority.
 */
function normalizeLegacyPriority(priority: TaskItem["priority"]): LegacyTodoItem["priority"] {
  switch (String(priority ?? "medium").toLowerCase()) {
    case "high":
      return "high"
    case "low":
      return "low"
    default:
      return "medium"
  }
}

/**
 * Persist canonical task authority, materialize the compatibility snapshot, and
 * synchronize graph task state.
 *
 * @param directory - Project root used to resolve `.hivemind` paths.
 * @param manifest - Updated canonical task manifest.
 * @returns Resolves when all writes and graph synchronization are complete.
 */
async function saveTaskAuthority(directory: string, manifest: TaskManifest): Promise<void> {
  const paths = getEffectivePaths(directory)
  const hiveOpsPaths = getHiveOpsPaths(directory)
  const nextManifest: TaskManifest = {
    ...manifest,
    updated_at: Date.now(),
  }

  await writeManifest(paths.tasks, nextManifest)
  await writeManifest(hiveOpsPaths.todoFile, materializeLegacyTodoState(nextManifest))

  queueTaskManifestMutation({
    type: "UPSERT_TASKS_MANIFEST",
    directory,
    payload: nextManifest,
    source: "hiveops-todo",
  })
  await flushTaskManifestMutations()
}

/**
 * Generate a task identifier that remains compatible with the legacy tool
 * output while being deterministic enough for manifest and graph sync.
 *
 * @returns New task identifier.
 */
function generateTaskId(): string {
  return `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * Render workflow topology in a compact user-facing label.
 *
 * @param workflowTopology - Canonical workflow topology.
 * @returns Short label for list/dependency displays.
 */
function formatWorkflowTopology(workflowTopology?: TaskWorkflowTopology): string {
  return `[${workflowTopology ?? "unclassified"}]`
}

/**
 * Resolve the canonical session identifier and ownership context for manual
 * task creation without allowing compatibility surfaces to become task
 * authority.
 *
 * @param directory - Project root used to read runtime state.
 * @param contextSessionId - Session identifier supplied by the tool context.
 * @param contextAgent - Agent name supplied by the tool context.
 * @returns Session identifier plus canonical task ownership metadata.
 */
async function resolveTaskSessionContext(
  directory: string,
  contextSessionId?: string,
  contextAgent?: string,
): Promise<{ sessionId: string; ownership: TaskOwnershipContext }> {
  const stateManager = createStateManager(directory)
  await flushMutations(stateManager)
  const state = await stateManager.load()
  const sessionId =
    state?.session?.id ||
    (contextSessionId && contextSessionId.trim().length > 0 ? contextSessionId : undefined) ||
    DEFAULT_SESSION_ID

  const runtimeSessionId =
    (contextSessionId && contextSessionId.trim().length > 0 ? contextSessionId.trim() : undefined) ||
    state?.session?.opencode_session_id ||
    undefined
  const runtimeLineage = await resolveRuntimeSessionLineage(runtimeSessionId)
  const parentSessionId = runtimeLineage.parentID
    ? await resolveCanonicalSessionId(directory, runtimeLineage.parentID)
    : undefined

  return {
    sessionId,
    ownership: resolveTaskOwnershipContext({
      ownerAgent: state?.session?.role || contextAgent,
      lineageScope: state?.session?.lineage_scope,
      originSessionId: state?.session?.id || sessionId,
      parentSessionId,
      sessionKind:
        state?.session?.kind && state.session.kind !== "unresolved"
          ? state.session.kind
          : runtimeLineage.isChildSession
            ? "sub"
            : undefined,
    }),
  }
}

/**
 * Render a human-readable TODO list from the canonical task manifest.
 *
 * @param manifest - Canonical task manifest.
 * @returns Topology-enriched task list output.
 */
function renderTodoList(manifest: TaskManifest): string {
  if (manifest.tasks.length === 0) return "No TODO items."

  const items = materializeLegacyTodoState(manifest)
  const lines = items.items
    .filter((item) => item.status !== "cancelled")
    .map((item) => {
      const status = { pending: " ", in_progress: "▶", completed: "✓", blocked: "✗", cancelled: "~" }[item.status]
      const deps = item.depends_on.length > 0 ? ` [deps: ${item.depends_on.join(",")}]` : ""
      const domain = item.domain ? ` (${item.domain})` : ""
      const plan = item.plan_id ? ` [plan:${item.plan_id}]` : ""
      const topology = formatWorkflowTopology(
        resolveTaskWorkflowTopology({
          workflowTopology: manifest.tasks.find((task) => task.id === item.id)?.workflow_topology,
          dependencies: manifest.tasks.find((task) => task.id === item.id)?.dependencies,
        }),
      )
      return `[${status}] ${item.id} [${item.priority}] ${topology}${domain}${plan} — ${item.content}${deps}`
    })

  const pending = items.items.filter((item) => item.status === "pending").length
  const active = items.items.filter((item) => item.status === "in_progress").length
  const done = items.items.filter((item) => item.status === "completed").length
  const blocked = items.items.filter((item) => item.status === "blocked").length

  return [
    `TODO State: ${pending} pending, ${active} active, ${done} done, ${blocked} blocked`,
    `Capacity: ${pending + active + blocked}/${MAX_ACTIVE_ITEMS} active slots used`,
    "---",
    ...lines,
    ...(items.items.some((item) => item.content.startsWith("HARD STOP"))
      ? ["---", `⛔ HARD STOP: ${items.items.find((item) => item.content.startsWith("HARD STOP"))?.content}`]
      : ["---", "⚠️ No HARD STOP item — add one as the last TODO item"]),
  ].join("\n")
}

export function createHiveOpsTodoTool(fallbackDirectory: string): ToolDefinition {
  return tool({
    description:
      "Manage stateful TODO items with canonical task authority in src, graph sync, and compatibility export. " +
      "Use this instead of todowrite for structured task management without preserving todo.json as the runtime source of truth.",
    args: {
      action: tool.schema
        .enum(["add", "complete", "start", "block", "cancel", "list", "deps", "export"])
        .describe("Action: add/complete/start/block/cancel a task, list all, show deps, or export"),
      content: tool.schema.string().optional().describe("Task description (required for add)"),
      id: tool.schema.string().optional().describe("Task ID (required for complete/start/block/cancel)"),
      priority: tool.schema.enum(["high", "medium", "low"]).optional().describe("Priority level"),
      domain: tool.schema.string().optional().describe("Domain tag (R1-R8)"),
      plan_id: tool.schema.string().optional().describe("Plan lineage ID (e.g. META01, PROJ01-SUB01)"),
      depends_on: tool.schema.string().optional().describe("Comma-separated dependency task IDs"),
      topology: tool.schema
        .enum(["parallel", "dependent", "independent", "inter-dependent", "unclassified"])
        .optional()
        .describe("Workflow topology classification for the task"),
      evidence: tool.schema.string().optional().describe("Evidence for completion"),
      hierarchy_node: tool.schema.string().optional().describe("Linked hierarchy node ID"),
    },
    async execute(args, context) {
      const directory = context.directory || fallbackDirectory || "."
      const { sessionId, ownership } = await resolveTaskSessionContext(directory, context.sessionID, context.agent)
      const manifest = await loadTaskAuthority(directory, sessionId)

      switch (args.action as HiveOpsTodoAction) {
        case "add": {
          if (!args.content) return "ERROR: content is required for add action"

          const activeItems = manifest.tasks.filter(
            (task) => task.status !== "completed" && task.status !== "complete" && task.status !== "cancelled",
          )
          if (activeItems.length >= MAX_ACTIVE_ITEMS) {
            return (
              `BLOCKED: Active task limit reached (${activeItems.length}/${MAX_ACTIVE_ITEMS}). ` +
              `Complete or cancel existing tasks before adding new ones. ` +
              `Active: ${activeItems.filter((task) => task.status === "in_progress").length} in_progress, ` +
              `${activeItems.filter((task) => task.status === "pending").length} pending, ` +
              `${activeItems.filter((task) => task.status === "blocked").length} blocked.`
            )
          }

          const dependencies = args.depends_on
            ? args.depends_on.split(",").map((value) => value.trim()).filter(Boolean)
            : []
          const workflowTopology = resolveTaskWorkflowTopology({
            workflowTopology: normalizeTaskWorkflowTopology(args.topology),
            dependencies,
          })

          const item: TaskItem = {
            id: generateTaskId(),
            text: args.content,
            status: "pending",
            priority: args.priority || "medium",
            domain: args.domain,
            source: "manual",
            dependencies,
            created_at: Date.now(),
            lineage_owner: ownership.lineage_owner,
            owner_agent: ownership.owner_agent,
            origin_session_id: ownership.origin_session_id,
            parent_session_id: ownership.parent_session_id,
            session_kind: ownership.session_kind,
            workflow_topology: workflowTopology,
            related_entities: {
              session_id: sessionId,
              plan_id: args.plan_id,
              requirement_node_id: args.hierarchy_node,
            },
          }

          manifest.tasks.push(item)
          await saveTaskAuthority(directory, manifest)

          let message =
            `Added: ${item.id} — "${item.text}" [${item.priority}] ${formatWorkflowTopology(item.workflow_topology)}` +
            `${item.domain ? ` (${item.domain})` : ""}${args.plan_id ? ` [plan:${args.plan_id}]` : ""}`
          const hasHardStop = manifest.tasks.some((task) => task.text.startsWith("HARD STOP"))
          if (!hasHardStop && activeItems.length >= 3) {
            message += "\n⚠️ WARNING: No HARD STOP item exists. Add one as the last TODO item."
          }
          return message
        }

        case "start": {
          if (!args.id) return "ERROR: id is required for start action"
          const item = manifest.tasks.find((task) => task.id === args.id)
          if (!item) return `ERROR: Task ${args.id} not found`

          const unmetDependencies = (item.dependencies ?? []).filter((dependencyId) => {
            const dependency = manifest.tasks.find((task) => task.id === dependencyId)
            return dependency && dependency.status !== "completed" && dependency.status !== "complete"
          })
          if (unmetDependencies.length > 0) {
            return `BLOCKED: Task ${args.id} has unmet dependencies: [${unmetDependencies.join(", ")}]`
          }

          const current = manifest.tasks.find((task) => task.status === "in_progress")
          if (current && current.id !== args.id) {
            return `BLOCKED: Task ${current.id} is already in_progress. Complete it first.`
          }

          item.status = "in_progress"
          await saveTaskAuthority(directory, manifest)
          return `Started: ${item.id} — "${item.text}"`
        }

        case "complete": {
          if (!args.id) return "ERROR: id is required for complete action"
          const item = manifest.tasks.find((task) => task.id === args.id)
          if (!item) return `ERROR: Task ${args.id} not found`

          item.status = "completed"
          item.completed_at = Date.now()
          if (args.evidence) {
            item.evidence_confidence = "full"
          }
          await saveTaskAuthority(directory, manifest)

          const unblocked = manifest.tasks
            .filter((task) => (task.dependencies ?? []).includes(item.id))
            .filter((task) =>
              (task.dependencies ?? []).every((dependencyId) => {
                const dependency = manifest.tasks.find((candidate) => candidate.id === dependencyId)
                return dependency && (dependency.status === "completed" || dependency.status === "complete")
              }),
            )
            .map((task) => task.id)

          let message = `Completed: ${item.id} — "${item.text}"`
          if (unblocked.length > 0) {
            message += `\nUnblocked: [${unblocked.join(", ")}]`
          }
          return message
        }

        case "block": {
          if (!args.id) return "ERROR: id is required for block action"
          const item = manifest.tasks.find((task) => task.id === args.id)
          if (!item) return `ERROR: Task ${args.id} not found`

          item.status = "blocked"
          await saveTaskAuthority(directory, manifest)
          return `Blocked: ${item.id} — "${item.text}"`
        }

        case "cancel": {
          if (!args.id) return "ERROR: id is required for cancel action"
          const item = manifest.tasks.find((task) => task.id === args.id)
          if (!item) return `ERROR: Task ${args.id} not found`

          item.status = "cancelled"
          await saveTaskAuthority(directory, manifest)
          return `Cancelled: ${item.id}`
        }

        case "list":
          return renderTodoList(manifest)

        case "deps": {
          if (!args.id) {
            const roots = manifest.tasks.filter((task) => (task.dependencies ?? []).length === 0 && task.status !== "cancelled")
            if (roots.length === 0) return "No root tasks (all have dependencies)."
            const lines = roots.map((root) => {
              const downstream = manifest.tasks
                .filter((task) => (task.dependencies ?? []).includes(root.id))
                .map((task) => task.text)
              return `${root.id} ${formatWorkflowTopology(root.workflow_topology)}: "${root.text}" → [${downstream.join(", ")}]`
            })
            return `Dependency roots:\n${lines.join("\n")}`
          }

          const item = manifest.tasks.find((task) => task.id === args.id)
          if (!item) return `ERROR: Task ${args.id} not found`

          const upstream = (item.dependencies ?? []).map((dependencyId) => manifest.tasks.find((task) => task.id === dependencyId)?.text || dependencyId)
          const downstream = manifest.tasks
            .filter((task) => (task.dependencies ?? []).includes(item.id))
            .map((task) => task.text)

          return [
            `Task: ${item.id} — "${item.text}"`,
            `Topology: ${item.workflow_topology ?? "unclassified"}`,
            `Upstream: [${upstream.join(", ") || "none"}]`,
            `Downstream: [${downstream.join(", ") || "none"}]`,
          ].join("\n")
        }

        case "export": {
          const summary = {
            total: manifest.tasks.length,
            pending: manifest.tasks.filter((task) => task.status === "pending").length,
            in_progress: manifest.tasks.filter((task) => task.status === "in_progress").length,
            completed: manifest.tasks.filter((task) => task.status === "completed" || task.status === "complete").length,
            blocked: manifest.tasks.filter((task) => task.status === "blocked").length,
            active: manifest.tasks.find((task) => task.status === "in_progress")?.id ?? null,
            items: materializeLegacyTodoState(manifest).items.filter((item) => item.status !== "cancelled"),
          }
          return JSON.stringify(summary, null, 2)
        }

        default:
          return `ERROR: Unknown action: ${args.action}`
      }
    },
  })
}
