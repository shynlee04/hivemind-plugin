/**
 * Graph Migration — One-time migration from legacy flat files to graph structure.
 *
 * Triggers on first hook if graph/ directory is empty.
 * Migrates: brain.json → trajectory.json, tasks.json → graph/tasks.json, mems.json → graph/mems.json
 *
 * @see US-018
 */

import { randomUUID } from "crypto"
import { existsSync } from "fs"
import { mkdir, readFile, rename, writeFile } from "fs/promises"
import { dirname, join } from "path"

import type {
  MemNode,
  PhaseNode,
  TaskNode,
  TrajectoryNode,
} from "../schemas/graph-nodes.js"
import {
  MemNodeSchema,
  PhaseNodeSchema,
  TaskNodeSchema,
  TrajectoryNodeSchema,
} from "../schemas/graph-nodes.js"
import type {
  GraphMemsState,
  GraphTasksState,
  PlansState,
  TrajectoryState,
} from "../schemas/graph-state.js"
import {
  saveGraphMems,
  saveGraphTasks,
  savePlans,
  saveTrajectory,
} from "./graph-io.js"
import { getHivemindPaths, getLegacyPaths } from "./paths.js"

// ─── Constants ─────────────────────────────────────────────────────────────

/** Fixed UUID for the legacy phase — all migrated tasks get this parent_phase_id */
export const LEGACY_PHASE_ID = "00000000-0000-4000-8000-000000000001"

/** Fixed UUID for the legacy plan that contains the legacy phase */
export const LEGACY_PLAN_ID = "00000000-0000-4000-8000-000000000002"

/** Fixed UUID for the trajectory that references the legacy plan */
export const LEGACY_TRAJECTORY_ID = "00000000-0000-4000-8000-000000000003"

/** Title for the legacy phase */
const LEGACY_PHASE_TITLE = "Legacy Context"

/** Title for the legacy plan */
const LEGACY_PLAN_TITLE = "Migrated Context"

const GRAPH_STATE_VERSION = "1.0.0"
const TASK_ID_LINEAGE_MAP_FILE = "task-id-lineage-map.json"

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MigrationResult {
  success: boolean
  migrated: {
    trajectory: boolean
    plans: boolean
    tasks: number
    mems: number
  }
  errors: string[]
  backupPath: string
}

interface LegacyBrain {
  session?: {
    id?: string
    mode?: string
    start_time?: number
    date?: string
    governance_status?: string
  }
  hierarchy?: {
    trajectory?: string
    tactic?: string
    action?: string
  }
  metrics?: {
    turn_count?: number
    drift_score?: number
  }
}

interface LegacyTask {
  id?: string
  text?: string
  status?: string
  priority?: string
}

interface LegacyTasks {
  session_id?: string
  tasks?: LegacyTask[]
}

interface LegacyMem {
  id?: string
  shelf?: string
  content?: string
  tags?: string[]
  created_at?: number | string
}

interface LegacyMems {
  mems?: LegacyMem[]
}

interface TaskIdLineageMapFile {
  version: string
  generated_at: string
  mappings: Record<string, string>
}

export interface TaskIdNormalizationResult {
  success: boolean
  changed: boolean
  mappings_created: number
  normalized: {
    state_tasks: number
    graph_tasks: number
    trajectory_refs: number
    mem_refs: number
  }
  map_path: string
  errors: string[]
}

// ─── Helper Functions ──────────────────────────────────────────────────────

/**
 * Create the default "Legacy Context" PhaseNode for migrated tasks.
 * This phase serves as the FK parent for all migrated tasks.
 */
function createLegacyPhase(): PhaseNode {
  const now = new Date().toISOString()
  return PhaseNodeSchema.parse({
    id: LEGACY_PHASE_ID,
    plan_id: LEGACY_PLAN_ID,
    title: LEGACY_PHASE_TITLE,
    status: "complete",
    order: 0,
    created_at: now,
    updated_at: now,
  })
}

/**
 * Create the default "Migrated Context" PlanNode for the legacy phase.
 */
function createLegacyPlan(): { id: string; trajectory_id: string; title: string; status: "complete"; created_at: string; updated_at: string } {
  const now = new Date().toISOString()
  return {
    id: LEGACY_PLAN_ID,
    trajectory_id: LEGACY_TRAJECTORY_ID,
    title: LEGACY_PLAN_TITLE,
    status: "complete",
    created_at: now,
    updated_at: now,
  }
}

/**
 * Migrate brain.json data to TrajectoryNode.
 * Extracts session ID and intent from brain state.
 */
function migrateBrainToTrajectory(brain: LegacyBrain, sessionId: string): TrajectoryNode {
  const now = new Date().toISOString()
  const intent = brain.hierarchy?.trajectory ?? "Migrated session"

  return TrajectoryNodeSchema.parse({
    id: LEGACY_TRAJECTORY_ID,
    session_id: sessionId,
    active_plan_id: LEGACY_PLAN_ID,
    active_phase_id: LEGACY_PHASE_ID,
    active_task_ids: [],
    intent,
    created_at: now,
    updated_at: now,
  })
}

/**
 * Map legacy task status to TaskNode status.
 */
function mapTaskStatus(status?: string): TaskNode["status"] {
  switch (status) {
    case "complete":
    case "completed":
      return "complete"
    case "in_progress":
    case "in-progress":
      return "in_progress"
    case "invalidated":
      return "invalidated"
    default:
      return "pending"
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function mapToUuidLineage(id: string, lineageMap: Map<string, string>): { id: string; created: boolean } {
  if (isUuid(id)) {
    return { id, created: false }
  }

  const existing = lineageMap.get(id)
  if (existing) {
    return { id: existing, created: false }
  }

  const next = randomUUID()
  lineageMap.set(id, next)
  return { id: next, created: true }
}

async function readJsonFileOrNull(path: string): Promise<unknown | null> {
  if (!existsSync(path)) {
    return null
  }

  const raw = await readFile(path, "utf-8")
  return JSON.parse(raw) as unknown
}

async function writeJsonAtomic(path: string, data: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  const tempPath = `${path}.tmp-${process.pid}-${Date.now()}`
  await writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8")
  await rename(tempPath, path)
}

/**
 * Phase 1: Normalize non-UUID task IDs into UUID lineage and keep references consistent.
 *
 * Touches active paths only:
 * - .hivemind/state/tasks.json task IDs
 * - .hivemind/graph/tasks.json task IDs
 * - .hivemind/graph/trajectory.json active_task_ids references
 * - .hivemind/graph/mems.json origin_task_id references
 *
 * A deterministic lineage map artifact is persisted to graph/task-id-lineage-map.json
 * so future runs keep the same mapping for legacy IDs.
 */
export async function normalizeTaskIdsToUuidLineage(projectRoot: string): Promise<TaskIdNormalizationResult> {
  const paths = getHivemindPaths(projectRoot)
  const mapPath = join(paths.graphDir, TASK_ID_LINEAGE_MAP_FILE)

  const result: TaskIdNormalizationResult = {
    success: false,
    changed: false,
    mappings_created: 0,
    normalized: {
      state_tasks: 0,
      graph_tasks: 0,
      trajectory_refs: 0,
      mem_refs: 0,
    },
    map_path: mapPath,
    errors: [],
  }

  try {
    await mkdir(paths.graphDir, { recursive: true })

    const lineageMap = new Map<string, string>()
    let mapChanged = false

    const mapRaw = await readJsonFileOrNull(mapPath)
    if (mapRaw && typeof mapRaw === "object") {
      const mapObj = mapRaw as Partial<TaskIdLineageMapFile>
      if (mapObj.mappings && typeof mapObj.mappings === "object") {
        for (const [legacyId, uuid] of Object.entries(mapObj.mappings)) {
          if (typeof uuid === "string" && isUuid(uuid)) {
            lineageMap.set(legacyId, uuid)
          }
        }
      }
    }

    const stateTasksRaw = await readJsonFileOrNull(paths.tasks)
    if (stateTasksRaw && typeof stateTasksRaw === "object") {
      const stateTasks = stateTasksRaw as { tasks?: Array<Record<string, unknown>>; active_task_id?: unknown }
      let updated = false
      let nextStateTasks: { tasks?: Array<Record<string, unknown>>; active_task_id?: unknown } = { ...stateTasks }

      if (Array.isArray(stateTasks.tasks)) {
        const nextTasks = stateTasks.tasks.map((task) => {
          if (!task || typeof task !== "object") {
            return task
          }

          const id = task.id
          if (typeof id !== "string") {
            return task
          }

          const mapped = mapToUuidLineage(id, lineageMap)
          if (mapped.created) {
            mapChanged = true
            result.mappings_created++
          }
          if (mapped.id !== id) {
            updated = true
            result.normalized.state_tasks++
            return {
              ...task,
              id: mapped.id,
            }
          }
          return task
        })

        nextStateTasks = {
          ...nextStateTasks,
          tasks: nextTasks,
        }
      }

      if (typeof stateTasks.active_task_id === "string") {
        const mapped = mapToUuidLineage(stateTasks.active_task_id, lineageMap)
        if (mapped.created) {
          mapChanged = true
          result.mappings_created++
        }
        if (mapped.id !== stateTasks.active_task_id) {
          updated = true
          result.normalized.trajectory_refs++
          nextStateTasks = {
            ...nextStateTasks,
            active_task_id: mapped.id,
          }
        }
      }

      if (updated) {
        await writeJsonAtomic(paths.tasks, nextStateTasks)
        result.changed = true
      }
    }

    const graphTasksRaw = await readJsonFileOrNull(paths.graphTasks)
    if (graphTasksRaw && typeof graphTasksRaw === "object") {
      const graphTasksState = graphTasksRaw as { version?: string; tasks?: Array<Record<string, unknown>> }
      if (Array.isArray(graphTasksState.tasks)) {
        let updated = false
        const nextTasks = graphTasksState.tasks.map((task) => {
          if (!task || typeof task !== "object") {
            return task
          }

          const id = task.id
          if (typeof id !== "string") {
            return task
          }

          const mapped = mapToUuidLineage(id, lineageMap)
          if (mapped.created) {
            mapChanged = true
            result.mappings_created++
          }
          if (mapped.id !== id) {
            updated = true
            result.normalized.graph_tasks++
            return {
              ...task,
              id: mapped.id,
            }
          }
          return task
        })

        if (updated) {
          await writeJsonAtomic(paths.graphTasks, {
            ...graphTasksState,
            tasks: nextTasks,
          })
          result.changed = true
        }
      }
    }

    const trajectoryRaw = await readJsonFileOrNull(paths.graphTrajectory)
    if (trajectoryRaw && typeof trajectoryRaw === "object") {
      const trajectoryState = trajectoryRaw as {
        version?: string
        trajectory?: { active_task_ids?: unknown[] } & Record<string, unknown>
      }

      if (trajectoryState.trajectory && Array.isArray(trajectoryState.trajectory.active_task_ids)) {
        let updated = false
        const nextActiveTaskIds = trajectoryState.trajectory.active_task_ids.map((taskId) => {
          if (typeof taskId !== "string") {
            return taskId
          }
          const mapped = mapToUuidLineage(taskId, lineageMap)
          if (mapped.created) {
            mapChanged = true
            result.mappings_created++
          }
          if (mapped.id !== taskId) {
            updated = true
            result.normalized.trajectory_refs++
          }
          return mapped.id
        })

        if (updated) {
          await writeJsonAtomic(paths.graphTrajectory, {
            ...trajectoryState,
            trajectory: {
              ...trajectoryState.trajectory,
              active_task_ids: nextActiveTaskIds,
            },
          })
          result.changed = true
        }
      }
    }

    const memsRaw = await readJsonFileOrNull(paths.graphMems)
    if (memsRaw && typeof memsRaw === "object") {
      const memsState = memsRaw as { version?: string; mems?: Array<Record<string, unknown>> }
      if (Array.isArray(memsState.mems)) {
        let updated = false
        const nextMems = memsState.mems.map((mem) => {
          if (!mem || typeof mem !== "object") {
            return mem
          }

          const originTaskId = mem.origin_task_id
          if (typeof originTaskId !== "string") {
            return mem
          }

          const mapped = mapToUuidLineage(originTaskId, lineageMap)
          if (mapped.created) {
            mapChanged = true
            result.mappings_created++
          }
          if (mapped.id !== originTaskId) {
            updated = true
            result.normalized.mem_refs++
            return {
              ...mem,
              origin_task_id: mapped.id,
            }
          }
          return mem
        })

        if (updated) {
          await writeJsonAtomic(paths.graphMems, {
            ...memsState,
            mems: nextMems,
          })
          result.changed = true
        }
      }
    }

    if (mapChanged || !existsSync(mapPath)) {
      const orderedMappings = Object.fromEntries(
        Array.from(lineageMap.entries()).sort(([a], [b]) => a.localeCompare(b)),
      )
      await writeJsonAtomic(mapPath, {
        version: GRAPH_STATE_VERSION,
        generated_at: new Date().toISOString(),
        mappings: orderedMappings,
      } satisfies TaskIdLineageMapFile)
      result.changed = true
    }

    result.success = true
    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result.errors.push(`Task ID normalization failed: ${msg}`)
    return result
  }
}

/**
 * Migrate legacy tasks to TaskNode array.
 * All tasks get parent_phase_id = LEGACY_PHASE_ID for FK validation.
 */
function migrateTasks(tasks: LegacyTask[]): TaskNode[] {
  const now = new Date().toISOString()

  return tasks.map((task, index) => {
    const taskId = task.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(task.id)
      ? task.id
      : randomUUID()

    return TaskNodeSchema.parse({
      id: taskId,
      parent_phase_id: LEGACY_PHASE_ID,
      title: task.text ?? `Migrated task ${index + 1}`,
      status: mapTaskStatus(task.status),
      file_locks: [],
      created_at: now,
      updated_at: now,
    })
  })
}

/**
 * Migrate legacy mems to MemNode array.
 * Adds required fields: staleness_stamp, type, relevance_score.
 */
function migrateMems(mems: LegacyMem[]): MemNode[] {
  const now = new Date().toISOString()

  return mems.map((mem, index) => {
    const memId = mem.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(mem.id)
      ? mem.id
      : randomUUID()

    const createdAt = typeof mem.created_at === "number"
      ? new Date(mem.created_at).toISOString()
      : (mem.created_at ?? now)

    return MemNodeSchema.parse({
      id: memId,
      origin_task_id: null,
      shelf: mem.shelf ?? "general",
      type: "insight",
      content: mem.content ?? `Migrated memory ${index + 1}`,
      relevance_score: 0.5,
      staleness_stamp: now,
      created_at: createdAt,
      updated_at: now,
    })
  })
}

/**
 * Create backup of legacy files before migration.
 */
async function backupLegacyFiles(projectRoot: string, backupPath: string): Promise<void> {
  const legacy = getLegacyPaths(projectRoot)
  const paths = getHivemindPaths(projectRoot)

  await mkdir(backupPath, { recursive: true })

  const filesToBackup = [
    { from: legacy.brain, to: join(backupPath, "brain.json.bak") },
    { from: legacy.hierarchy, to: join(backupPath, "hierarchy.json.bak") },
    { from: legacy.anchors, to: join(backupPath, "anchors.json.bak") },
    { from: legacy.mems, to: join(backupPath, "mems.json.bak") },
    { from: paths.brain, to: join(backupPath, "state-brain.json.bak") },
    { from: paths.mems, to: join(backupPath, "memory-mems.json.bak") },
  ]

  for (const { from, to } of filesToBackup) {
    if (existsSync(from)) {
      await rename(from, to)
    }
  }
}

/**
 * Check if graph migration is needed.
 * Returns true if graph directory is empty or missing.
 */
export function isGraphMigrationNeeded(projectRoot: string): boolean {
  const paths = getHivemindPaths(projectRoot)

  // If graph directory doesn't exist, migration is needed
  if (!existsSync(paths.graphDir)) {
    return true
  }

  // If trajectory.json doesn't exist, migration is needed
  if (!existsSync(paths.graphTrajectory)) {
    return true
  }

  return false
}

// ─── Main Migration Function ───────────────────────────────────────────────

/**
 * One-time migration from legacy flat files to graph structure.
 * Triggers on first hook if graph/ directory is empty.
 *
 * @param projectRoot - The project root directory
 * @returns Migration result with status and any errors
 */
export async function migrateToGraph(projectRoot: string): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migrated: {
      trajectory: false,
      plans: false,
      tasks: 0,
      mems: 0,
    },
    errors: [],
    backupPath: "",
  }

  const paths = getHivemindPaths(projectRoot)
  const legacy = getLegacyPaths(projectRoot)

  // Create backup directory with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  result.backupPath = join(paths.root, "backups", `migration-${timestamp}`)

  try {
    // Ensure graph directory exists
    await mkdir(paths.graphDir, { recursive: true })

    // Read legacy files
    let brain: LegacyBrain = {}
    let legacyTasks: LegacyTasks = { tasks: [] }
    let legacyMems: LegacyMems = { mems: [] }

    // Try to read brain.json from either location
    const brainPath = existsSync(legacy.brain) ? legacy.brain : paths.brain
    if (existsSync(brainPath)) {
      try {
        const brainData = await readFile(brainPath, "utf-8")
        brain = JSON.parse(brainData) as LegacyBrain
      } catch (err) {
        result.errors.push(`Failed to read brain.json: ${err}`)
      }
    }

    // Try to read tasks.json
    if (existsSync(paths.tasks)) {
      try {
        const tasksData = await readFile(paths.tasks, "utf-8")
        legacyTasks = JSON.parse(tasksData) as LegacyTasks
      } catch (err) {
        result.errors.push(`Failed to read tasks.json: ${err}`)
      }
    }

    // Try to read mems.json from either location
    const memsPath = existsSync(legacy.mems) ? legacy.mems : paths.mems
    if (existsSync(memsPath)) {
      try {
        const memsData = await readFile(memsPath, "utf-8")
        legacyMems = JSON.parse(memsData) as LegacyMems
      } catch (err) {
        result.errors.push(`Failed to read mems.json: ${err}`)
      }
    }

    // Generate session ID from brain or create new UUID
    const sessionId = brain.session?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(brain.session.id)
      ? brain.session.id
      : randomUUID()

    // Ensure graph directory exists
    await mkdir(paths.graphDir, { recursive: true })

    // Check if already migrated (idempotent)
    if (existsSync(paths.graphTrajectory)) {
      result.errors.push("Migration already completed")
      result.success = true
      return result
    }

    // Backup legacy files AFTER reading, before writing new structure
    await backupLegacyFiles(projectRoot, result.backupPath)

    // 1. Migrate brain → trajectory
    const trajectory = migrateBrainToTrajectory(brain, sessionId)
    const trajectoryState: TrajectoryState = {
      version: GRAPH_STATE_VERSION,
      trajectory,
    }
    await saveTrajectory(projectRoot, trajectoryState)
    result.migrated.trajectory = true

    // 2. Create plans with legacy plan
    const legacyPlan = createLegacyPlan()
    const plansState: PlansState = {
      version: GRAPH_STATE_VERSION,
      plans: [legacyPlan],
    }
    await savePlans(projectRoot, plansState)
    result.migrated.plans = true

    // 3. Migrate tasks with FK to legacy phase
    const tasks = migrateTasks(legacyTasks.tasks ?? [])
    const tasksState: GraphTasksState = {
      version: GRAPH_STATE_VERSION,
      tasks,
    }
    await saveGraphTasks(projectRoot, tasksState)
    result.migrated.tasks = tasks.length

    // 4. Migrate mems with required fields
    const mems = migrateMems(legacyMems.mems ?? [])
    const memsState: GraphMemsState = {
      version: GRAPH_STATE_VERSION,
      mems,
    }
    await saveGraphMems(projectRoot, memsState)
    result.migrated.mems = mems.length

    // 5. Update trajectory with active task IDs
    if (tasks.length > 0) {
      const activeTaskIds = tasks
        .filter((t) => t.status === "pending" || t.status === "in_progress")
        .map((t) => t.id)
        .slice(0, 5) // Limit to 5 active tasks

      trajectory.active_task_ids = activeTaskIds
      trajectory.updated_at = new Date().toISOString()

      const updatedState: TrajectoryState = {
        version: GRAPH_STATE_VERSION,
        trajectory,
      }
      await saveTrajectory(projectRoot, updatedState)
    }

    // Phase 1 hardening: normalize any non-UUID task lineage in active graph/state paths.
    const normalization = await normalizeTaskIdsToUuidLineage(projectRoot)
    if (!normalization.success) {
      result.errors.push(...normalization.errors)
    }

    result.success = result.errors.length === 0
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    result.errors.push(`Migration failed: ${msg}`)
  }

  return result
}

// ─── Export for Testing ────────────────────────────────────────────────────

export const _internal = {
  LEGACY_PHASE_ID,
  LEGACY_PLAN_ID,
  LEGACY_TRAJECTORY_ID,
  createLegacyPhase,
  createLegacyPlan,
  migrateBrainToTrajectory,
  migrateTasks,
  migrateMems,
  mapTaskStatus,
  isUuid,
  mapToUuidLineage,
}
