/**
 * Dual-Read Backward Compatibility — Graph-aware functions with legacy fallback.
 *
 * During the transition period (after US-018 migration), the system must support
 * dual-read: check graph/ first, then fall back to legacy state/ and memory/.
 *
 * This ensures backward compatibility during migration and provides graceful
 * degradation for projects that haven't migrated yet.
 *
 * @see US-019
 */

import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { randomUUID } from "crypto"

import type { TrajectoryState, PlansState, GraphTasksState, GraphMemsState } from "../schemas/graph-state.js"
import { loadTrajectory, loadPlans, loadGraphTasks, loadGraphMems } from "./graph-io.js"
import { getHivemindPaths, getLegacyPaths } from "./paths.js"
import { isGraphMigrationNeeded } from "./graph-migrate.js"

/** Fixed UUID for legacy phase - used when migrating tasks from pre-graph structure */
const LEGACY_PHASE_ID = "00000000-0000-0000-0000-000000000001"

export interface DualReadOptions {
  /** Log fallback warnings to console. Default: true */
  logFallbacks?: boolean
  /** Perform migration if graph is empty. Default: false */
  autoMigrate?: boolean
}

// ─── Migration Status ───────────────────────────────────────────────────

/**
 * Check if the project has migrated to graph structure.
 * Returns true if graph/trajectory.json exists.
 */
export function isMigrated(projectRoot: string): boolean {
  return !isGraphMigrationNeeded(projectRoot)
}

/**
 * Check if dual-read is needed (graph exists but some data is in legacy).
 * Returns true if project is in transition period.
 */
export function isDualReadNeeded(projectRoot: string): boolean {
  const paths = getHivemindPaths(projectRoot)
  const legacy = getLegacyPaths(projectRoot)

  // If graph trajectory exists but legacy files still exist with content, dual-read is needed
  const hasGraph = existsSync(paths.graphTrajectory)

  // Check if legacy files have actual content (not just empty files)
  const hasLegacyBrainContent = (existsSync(legacy.brain) && getFileSize(legacy.brain) > 10) ||
    (existsSync(paths.brain) && getFileSize(paths.brain) > 10)
  const hasLegacyMemsContent = (existsSync(legacy.mems) && getFileSize(legacy.mems) > 10) ||
    (existsSync(paths.mems) && getFileSize(paths.mems) > 10)

  return hasGraph && (hasLegacyBrainContent || hasLegacyMemsContent)
}

/**
 * Get file size, returns 0 if file doesn't exist or can't be read.
 */
function getFileSize(filePath: string): number {
  try {
    const { statSync } = require("fs")
    return statSync(filePath).size
  } catch {
    return 0
  }
}

// ─── Trajectory Dual-Read ───────────────────────────────────────────────

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

/**
 * Convert legacy brain format to trajectory state format.
 */
function convertBrainToTrajectory(brain: LegacyBrain): TrajectoryState {
  const now = new Date().toISOString()
  const sessionId = brain.session?.id ?? randomUUID()
  const intent = brain.hierarchy?.trajectory ?? "Legacy session"

  return {
    version: "1.0.0",
    trajectory: {
      id: randomUUID(),
      session_id: sessionId,
      active_plan_id: null,
      active_phase_id: null,
      active_task_ids: [],
      intent,
      created_at: brain.session?.start_time ? new Date(brain.session.start_time).toISOString() : now,
      updated_at: now,
    },
  }
}

/**
 * Read trajectory with dual-read support.
 * Priority: graph/trajectory.json → state/brain.json → null
 */
export async function loadTrajectoryDual(
  projectRoot: string,
  options?: DualReadOptions,
): Promise<TrajectoryState | null> {
  const paths = getHivemindPaths(projectRoot)
  const legacy = getLegacyPaths(projectRoot)
  const logFallback = options?.logFallbacks !== false

  // Check graph first (new v3.0 structure)
  if (existsSync(paths.graphTrajectory)) {
    return loadTrajectory(projectRoot)
  }

  // Fallback to legacy brain.json (v1.x flat or v2.0 state/)
  const legacyBrainPath = existsSync(legacy.brain) ? legacy.brain : paths.brain

  if (existsSync(legacyBrainPath)) {
    if (logFallback) {
      console.log("[dual-read] Falling back to legacy brain.json for trajectory")
    }

    try {
      const brainData = readFileSync(legacyBrainPath, "utf-8")
      const brain = JSON.parse(brainData) as LegacyBrain
      return convertBrainToTrajectory(brain)
    } catch (err) {
      console.error("[dual-read] Failed to read legacy brain.json:", err)
      return null
    }
  }

  // No trajectory found anywhere
  return null
}

// ─── Plans Dual-Read ───────────────────────────────────────────────────

/**
 * Read plans with dual-read support.
 * Priority: graph/plans.json → empty (no legacy equivalent)
 */
export async function loadPlansDual(
  _projectRoot: string,
  _options?: DualReadOptions,
): Promise<PlansState> {
  // Plans only exist in graph structure, no legacy fallback needed
  // Options reserved for future use (e.g., auto-migration trigger)
  return loadPlans(_projectRoot)
}

// ─── Tasks Dual-Read ───────────────────────────────────────────────────

interface LegacyTasks {
  session_id?: string
  tasks?: Array<{
    id?: string
    text?: string
    status?: string
    priority?: string
  }>
}

/**
 * Read tasks with dual-read support.
 * Priority: graph/tasks.json → state/tasks.json
 */
export async function loadTasksDual(
  projectRoot: string,
  options?: DualReadOptions,
): Promise<GraphTasksState> {
  const paths = getHivemindPaths(projectRoot)
  const logFallback = options?.logFallbacks !== false

  // Check graph first (new v3.0 structure)
  if (existsSync(paths.graphTasks)) {
    return loadGraphTasks(projectRoot)
  }

  // Fallback to state/tasks.json (v2.0 structure) or legacy .hivemind/tasks.json (v1.x)
  // Legacy v1.x had tasks at root level, v2.0 moved to state/
  const legacyTasksPath = join(projectRoot, ".hivemind", "tasks.json")
  const legacyV1Exists = existsSync(legacyTasksPath)
  const tasksPath = legacyV1Exists ? legacyTasksPath : paths.tasks

  if (existsSync(tasksPath)) {
    if (logFallback) {
      console.log("[dual-read] Falling back to state/tasks.json for tasks")
    }

    try {
      const tasksData = readFileSync(paths.tasks, "utf-8")
      const legacyTasks = JSON.parse(tasksData) as LegacyTasks

      const now = new Date().toISOString()
      const migratedTasks = (legacyTasks.tasks ?? []).map((task, index) => ({
        id: task.id ?? randomUUID(),
        parent_phase_id: LEGACY_PHASE_ID, // Use legacy phase ID for migrated tasks
        title: task.text ?? `Migrated task ${index + 1}`,
        status: mapLegacyTaskStatus(task.status),
        file_locks: [],
        created_at: now,
        updated_at: now,
      }))

      return {
        version: "1.0.0",
        tasks: migratedTasks,
      }
    } catch (err) {
      console.error("[dual-read] Failed to read legacy tasks.json:", err)
      return { version: "1.0.0", tasks: [] }
    }
  }

  // No tasks found
  return { version: "1.0.0", tasks: [] }
}

/**
 * Map legacy task status to TaskNode status.
 */
function mapLegacyTaskStatus(status?: string): "pending" | "in_progress" | "complete" | "invalidated" {
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

// ─── Mems Dual-Read ───────────────────────────────────────────────────

interface LegacyMems {
  mems?: Array<{
    id?: string
    shelf?: string
    content?: string
    tags?: string[]
    created_at?: number | string
  }>
}

/**
 * Read mems with dual-read support.
 * Priority: graph/mems.json → memory/mems.json
 */
export async function loadMemsDual(
  projectRoot: string,
  options?: DualReadOptions,
): Promise<GraphMemsState> {
  const paths = getHivemindPaths(projectRoot)
  const legacy = getLegacyPaths(projectRoot)
  const logFallback = options?.logFallbacks !== false

  // Check graph first (new v3.0 structure)
  if (existsSync(paths.graphMems)) {
    return loadGraphMems(projectRoot)
  }

  // Fallback to memory/mems.json (v2.0 structure) or legacy mems.json
  const legacyMemsPath = existsSync(legacy.mems) ? legacy.mems : paths.mems

  if (existsSync(legacyMemsPath)) {
    if (logFallback) {
      console.log("[dual-read] Falling back to legacy mems.json for mems")
    }

    try {
      const memsData = readFileSync(legacyMemsPath, "utf-8")
      const legacyMems = JSON.parse(memsData) as LegacyMems

      const now = new Date().toISOString()
      const migratedMems = (legacyMems.mems ?? []).map((mem, index) => {
        const createdAt = typeof mem.created_at === "number"
          ? new Date(mem.created_at).toISOString()
          : (mem.created_at ?? now)

        return {
          id: mem.id ?? randomUUID(),
          origin_task_id: null,
          shelf: mem.shelf ?? "general",
          type: "insight" as const,
          content: mem.content ?? `Migrated memory ${index + 1}`,
          relevance_score: 0.5,
          staleness_stamp: now,
          created_at: createdAt,
          updated_at: now,
        }
      })

      return {
        version: "1.0.0",
        mems: migratedMems,
      }
    } catch (err) {
      console.error("[dual-read] Failed to read legacy mems.json:", err)
      return { version: "1.0.0", mems: [] }
    }
  }

  // No mems found
  return { version: "1.0.0", mems: [] }
}

// ─── Utility Functions ─────────────────────────────────────────────────

/**
 * Get migration status summary for debugging/logging.
 */
export function getMigrationStatus(projectRoot: string): {
  isMigrated: boolean
  isDualReadNeeded: boolean
  graphExists: boolean
  legacyExists: boolean
} {
  const paths = getHivemindPaths(projectRoot)
  const legacy = getLegacyPaths(projectRoot)

  const graphExists = existsSync(paths.graphDir)
  const legacyExists = existsSync(legacy.brain) || existsSync(paths.brain)

  return {
    isMigrated: isMigrated(projectRoot),
    isDualReadNeeded: isDualReadNeeded(projectRoot),
    graphExists,
    legacyExists,
  }
}