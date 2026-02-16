import { existsSync } from "fs"
import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises"
import { dirname } from "path"
import type { z } from "zod"

import type { MemNode, TaskNode } from "../schemas/graph-nodes.js"
import { withFileLock } from "./file-lock.js"
import {
  GraphMemsStateSchema,
  GraphTasksStateSchema,
  PlansStateSchema,
  TrajectoryStateSchema,
  type GraphMemsState,
  type GraphTasksState,
  type PlansState,
  type TrajectoryState,
} from "../schemas/graph-state.js"
import { getEffectivePaths } from "./paths.js"

const GRAPH_STATE_VERSION = "1.0.0"

const EMPTY_PLANS_STATE: PlansState = {
  version: GRAPH_STATE_VERSION,
  plans: [],
}

const EMPTY_TASKS_STATE: GraphTasksState = {
  version: GRAPH_STATE_VERSION,
  tasks: [],
}

const EMPTY_MEMS_STATE: GraphMemsState = {
  version: GRAPH_STATE_VERSION,
  mems: [],
}

async function loadValidatedState<T>(
  filePath: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null
  }

  const raw = await readFile(filePath, "utf-8")
  const parsed = JSON.parse(raw) as unknown
  return schema.parse(parsed)
}

async function saveValidatedState<T>(
  filePath: string,
  schema: z.ZodType<T>,
  state: T,
): Promise<void> {
  const validated = schema.parse(state)
  const directory = dirname(filePath)
  await mkdir(directory, { recursive: true })

  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`
  try {
    await writeFile(tempPath, JSON.stringify(validated, null, 2))
    await rename(tempPath, filePath)
  } catch (error) {
    if (existsSync(tempPath)) {
      await unlink(tempPath).catch(() => {})
    }
    throw error
  }
}

export async function loadTrajectory(projectRoot: string): Promise<TrajectoryState | null> {
  const filePath = getEffectivePaths(projectRoot).graphTrajectory
  return loadValidatedState(filePath, TrajectoryStateSchema)
}

export async function saveTrajectory(projectRoot: string, state: TrajectoryState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphTrajectory
  await saveValidatedState(filePath, TrajectoryStateSchema, state)
}

export async function loadPlans(projectRoot: string): Promise<PlansState> {
  const filePath = getEffectivePaths(projectRoot).graphPlans
  const state = await loadValidatedState(filePath, PlansStateSchema)
  return state ?? EMPTY_PLANS_STATE
}

export async function savePlans(projectRoot: string, state: PlansState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphPlans
  await saveValidatedState(filePath, PlansStateSchema, state)
}

export async function loadGraphTasks(projectRoot: string): Promise<GraphTasksState> {
  const filePath = getEffectivePaths(projectRoot).graphTasks
  const state = await loadValidatedState(filePath, GraphTasksStateSchema)
  return state ?? EMPTY_TASKS_STATE
}

export async function saveGraphTasks(projectRoot: string, state: GraphTasksState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphTasks
  await saveValidatedState(filePath, GraphTasksStateSchema, state)
}

export async function addGraphTask(projectRoot: string, task: TaskNode): Promise<string> {
  const filePath = getEffectivePaths(projectRoot).graphTasks

  let validatedTask: TaskNode
  await withFileLock(filePath, async () => {
    validatedTask = GraphTasksStateSchema.shape.tasks.element.parse(task)
    const current = await loadGraphTasks(projectRoot)

    const taskById = new Map(current.tasks.map((item) => [item.id, item]))
    taskById.set(validatedTask!.id, validatedTask!)

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
    const current = await loadGraphTasks(projectRoot)

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

export async function loadGraphMems(projectRoot: string): Promise<GraphMemsState> {
  const filePath = getEffectivePaths(projectRoot).graphMems
  const state = await loadValidatedState(filePath, GraphMemsStateSchema)
  return state ?? EMPTY_MEMS_STATE
}

export async function saveGraphMems(projectRoot: string, state: GraphMemsState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphMems
  await saveValidatedState(filePath, GraphMemsStateSchema, state)
}

export async function addGraphMem(projectRoot: string, mem: MemNode): Promise<string> {
  const filePath = getEffectivePaths(projectRoot).graphMems

  let validatedMem: MemNode
  await withFileLock(filePath, async () => {
    validatedMem = GraphMemsStateSchema.shape.mems.element.parse(mem)
    const current = await loadGraphMems(projectRoot)

    const memById = new Map(current.mems.map((item) => [item.id, item]))
    memById.set(validatedMem!.id, validatedMem!)

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
    const current = await loadGraphMems(projectRoot)

    const mems = current.mems.map((mem) => {
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
