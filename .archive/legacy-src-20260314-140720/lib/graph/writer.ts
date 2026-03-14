import { createHash } from "crypto"
import { dirname } from "path"
import { mkdir, writeFile } from "fs/promises"
import {
  GraphMemsStateSchema,
  GraphTasksStateSchema,
  PlansStateSchema,
  TrajectoryStateSchema,
  type GraphMemsState,
  type GraphTasksState,
  type PlansState,
  type TrajectoryState,
} from "../../schemas/graph-state.js"
import type { MemNode, TaskNode } from "../../schemas/graph-nodes.js"
import { withFileLock } from "../file-lock.js"
import { getEffectivePaths } from "../paths.js"
import {
  EMPTY_MEMS_STATE,
  EMPTY_TASKS_STATE,
  GRAPH_STATE_VERSION,
  _loadRawMems,
  _loadRawTasks,
  existsSync,
  loadValidatedState,
  saveValidatedState,
} from "./shared.js"
import { loadTrajectory } from "./reader.js"

export async function saveTrajectory(projectRoot: string, state: TrajectoryState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphTrajectory
  await saveValidatedState(filePath, TrajectoryStateSchema, state)
}

export async function savePlans(projectRoot: string, state: PlansState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphPlans
  await saveValidatedState(filePath, PlansStateSchema, state)
}

export async function saveGraphTasks(projectRoot: string, state: GraphTasksState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphTasks
  await saveValidatedState(filePath, GraphTasksStateSchema, state)
}

export async function saveGraphMems(projectRoot: string, state: GraphMemsState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphMems
  await saveValidatedState(filePath, GraphMemsStateSchema, state)
}

export async function addGraphTask(projectRoot: string, task: TaskNode): Promise<string> {
  const filePath = getEffectivePaths(projectRoot).graphTasks

  const directory = dirname(filePath)
  if (!existsSync(filePath)) {
    await mkdir(directory, { recursive: true })
    await writeFile(filePath, JSON.stringify({ version: GRAPH_STATE_VERSION, tasks: [] }, null, 2))
  }

  let validatedTask: TaskNode
  await withFileLock(filePath, async () => {
    validatedTask = GraphTasksStateSchema.shape.tasks.element.parse(task)
    const current = await _loadRawTasks(projectRoot)

    const taskById = new Map(current.tasks.map((item) => [item.id, item]))
    taskById.set(validatedTask.id, validatedTask)

    const nextState: GraphTasksState = {
      version: current.version,
      tasks: Array.from(taskById.values()),
    }

    await saveGraphTasks(projectRoot, nextState)
  })
  return validatedTask!.id
}

export async function invalidateTask(projectRoot: string, taskId: string): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphTasks

  await withFileLock(filePath, async () => {
    const current = await _loadRawTasks(projectRoot)

    const tasks = current.tasks.map((task) => {
      if (task.id !== taskId) {
        return task
      }

      return {
        ...task,
        status: "invalidated" as const,
        updated_at: new Date().toISOString(),
      }
    })

    await saveGraphTasks(projectRoot, {
      version: current.version,
      tasks,
    })
  })
}

export async function addGraphMem(projectRoot: string, mem: MemNode): Promise<string> {
  const filePath = getEffectivePaths(projectRoot).graphMems

  const directory = dirname(filePath)
  if (!existsSync(filePath)) {
    await mkdir(directory, { recursive: true })
    await writeFile(filePath, JSON.stringify({ version: GRAPH_STATE_VERSION, mems: [] }, null, 2))
  }

  let validatedMem: MemNode
  await withFileLock(filePath, async () => {
    validatedMem = GraphMemsStateSchema.shape.mems.element.parse(mem)
    const current = await _loadRawMems(projectRoot)

    const memById = new Map(current.mems.map((item: MemNode) => [item.id, item]))
    memById.set(validatedMem.id, validatedMem)

    const nextState: GraphMemsState = {
      version: current.version,
      mems: Array.from(memById.values()),
    }

    await saveGraphMems(projectRoot, nextState)
  })
  return validatedMem!.id
}

export async function flagFalsePath(projectRoot: string, memId: string): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphMems

  await withFileLock(filePath, async () => {
    const current = await _loadRawMems(projectRoot)

    const mems = current.mems.map((mem: MemNode) => {
      if (mem.id !== memId) {
        return mem
      }

      return {
        ...mem,
        type: "false_path" as const,
        updated_at: new Date().toISOString(),
      }
    })

    await saveGraphMems(projectRoot, {
      version: current.version,
      mems,
    })
  })
}

const SES_NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

export function normalizeSessionIdToUuid(sessionId: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(sessionId)) {
    return sessionId.toLowerCase()
  }

  if (sessionId.startsWith("ses_")) {
    const idPart = sessionId.slice(4)
    const hash = createHash("sha1")
    hash.update(SES_NAMESPACE_UUID + idPart)
    const bytes = hash.digest()

    bytes[6] = (bytes[6] & 0x0f) | 0x50
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = bytes.toString("hex")
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join("-")
  }

  const hash = createHash("sha1")
  hash.update(SES_NAMESPACE_UUID + sessionId)
  const bytes = hash.digest()

  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.toString("hex")
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-")
}

export async function resolveCanonicalSessionId(
  projectRoot: string,
  fallbackSessionId: string,
): Promise<string> {
  const trajectory = await loadTrajectory(projectRoot)

  if (trajectory?.trajectory?.session_id) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(trajectory.trajectory.session_id)) {
      return trajectory.trajectory.session_id
    }
  }

  return normalizeSessionIdToUuid(fallbackSessionId)
}

export interface InvalidationResult {
  invalidated: string[]
  count: number
}

export async function invalidateOrphanedActiveTasks(
  projectRoot: string,
  activeTaskIds: string[],
): Promise<InvalidationResult> {
  const filePath = getEffectivePaths(projectRoot).graphTasks

  if (!existsSync(filePath)) {
    return {
      invalidated: [],
      count: 0,
    }
  }

  const activeSet = new Set(activeTaskIds)
  const invalidated: string[] = []
  const now = new Date().toISOString()

  await withFileLock(filePath, async () => {
    const current = await _loadRawTasks(projectRoot)

    const tasks = current.tasks.map((task) => {
      if (task.status === "in_progress" && !activeSet.has(task.id)) {
        invalidated.push(task.id)
        return {
          ...task,
          status: "invalidated" as const,
          updated_at: now,
        }
      }
      return task
    })

    if (invalidated.length > 0) {
      await saveGraphTasks(projectRoot, {
        version: current.version,
        tasks,
      })
    }
  })

  return {
    invalidated,
    count: invalidated.length,
  }
}

export interface ReconciliationResult {
  invalidatedCount: number
  invalidatedIds: string[]
  error?: string
}

export async function reconcileStaleTasks(
  projectRoot: string,
): Promise<ReconciliationResult> {
  try {
    const trajectory = await loadTrajectory(projectRoot)

    if (!trajectory?.trajectory) {
      return {
        invalidatedCount: 0,
        invalidatedIds: [],
      }
    }

    const activeTaskIds = trajectory.trajectory.active_task_ids ?? []

    if (activeTaskIds.length === 0) {
      return {
        invalidatedCount: 0,
        invalidatedIds: [],
      }
    }

    const result = await invalidateOrphanedActiveTasks(projectRoot, activeTaskIds)

    return {
      invalidatedCount: result.count,
      invalidatedIds: result.invalidated,
    }
  } catch (error) {
    return {
      invalidatedCount: 0,
      invalidatedIds: [],
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export { EMPTY_MEMS_STATE, EMPTY_TASKS_STATE, loadValidatedState }
