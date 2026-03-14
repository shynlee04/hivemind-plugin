import { existsSync } from "fs"
import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises"
import { dirname, sep } from "path"
import { z } from "zod"
import { createHash } from "crypto"

import {
  GraphMemsStateSchema,
  GraphTasksStateSchema,
  type GraphMemsState,
  type GraphTasksState,
  type PlansState,
} from "../../schemas/graph-state.js"
import type { MemNode, TaskNode } from "../../schemas/graph-nodes.js"
import { createLogger, noopLogger, type Logger } from "../logging.js"
import { getEffectivePaths } from "../paths.js"
import { quarantineOrphan } from "../orphan-quarantine.js"

export { withFileLock } from "../file-lock.js"
export { getEffectivePaths } from "../paths.js"
export { loadTasks, readManifest } from "../manifest.js"
export type { SessionManifest } from "../manifest.js"
export type { OrphanRecord } from "../orphan-quarantine.js"

export const GRAPH_STATE_VERSION = "1.0.0"

export const EMPTY_PLANS_STATE: PlansState = {
  version: GRAPH_STATE_VERSION,
  plans: [],
}

export const EMPTY_TASKS_STATE: GraphTasksState = {
  version: GRAPH_STATE_VERSION,
  tasks: [],
}

export const EMPTY_MEMS_STATE: GraphMemsState = {
  version: GRAPH_STATE_VERSION,
  mems: [],
}

const graphLoggerPromises = new Map<string, Promise<Logger>>()

function inferProjectRootFromFilePath(filePath: string): string {
  const marker = `${sep}.hivemind${sep}`
  const markerIndex = filePath.indexOf(marker)
  if (markerIndex === -1) {
    return process.cwd()
  }
  return filePath.slice(0, markerIndex)
}

function getGraphLogger(projectRoot: string): Promise<Logger> {
  let loggerPromise = graphLoggerPromises.get(projectRoot)
  if (!loggerPromise) {
    const paths = getEffectivePaths(projectRoot)
    loggerPromise = createLogger(paths.logsDir, "graph-io").catch(() => noopLogger)
    graphLoggerPromises.set(projectRoot, loggerPromise)
  }
  return loggerPromise
}

function normalizeErrorDetail(detail: unknown): string {
  if (detail instanceof Error) {
    return detail.message
  }
  if (typeof detail === "string") {
    return detail
  }
  try {
    return JSON.stringify(detail)
  } catch {
    return String(detail)
  }
}

export async function logGraph(level: "warn" | "error", filePath: string, message: string, detail?: unknown): Promise<void> {
  const logger = await getGraphLogger(inferProjectRootFromFilePath(filePath))
  const fullMessage = detail === undefined ? message : `${message} ${normalizeErrorDetail(detail)}`
  await logger[level](fullMessage)
}

export async function loadValidatedState<T>(
  filePath: string,
  schema: z.ZodType<T>,
): Promise<T | null> {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    const result = schema.safeParse(parsed)

    if (!result.success) {
      await logGraph("error", filePath, `[graph-io] Validation error in ${filePath}:`, result.error.message)
      return null
    }

    return result.data
  } catch (error) {
    await logGraph("error", filePath, `[graph-io] Failed to load ${filePath}:`, error)
    return null
  }
}

export async function saveValidatedState<T>(
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

export async function _loadRawTasks(projectRoot: string): Promise<GraphTasksState> {
  const paths = getEffectivePaths(projectRoot)
  const filePath = paths.graphTasks
  const orphanPath = paths.graphOrphans

  if (!existsSync(filePath)) {
    return EMPTY_TASKS_STATE
  }

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    const result = GraphTasksStateSchema.safeParse(parsed)

    if (result.success) {
      return result.data
    }

    await logGraph("error", filePath, "[graph-io] GraphTasksStateSchema parse failed, attempting recovery:", result.error.message)

    const rawTasks = (parsed as { tasks?: unknown[] })?.tasks ?? []
    const validTasks: TaskNode[] = []
    const now = new Date().toISOString()

    for (const rawTask of rawTasks) {
      const taskResult = GraphTasksStateSchema.shape.tasks.element.safeParse(rawTask)
      if (taskResult.success) {
        validTasks.push(taskResult.data)
      } else {
        const taskId = (rawTask as { id?: string })?.id ?? "unknown"
        await logGraph("warn", filePath, `[graph-io] Quarantining invalid task ${taskId}:`, taskResult.error.message)
        await quarantineOrphan(orphanPath, {
          id: taskId,
          type: "task",
          reason: `Zod validation failed: ${taskResult.error.message}`,
          original_data: rawTask,
          quarantined_at: now,
        })
      }
    }

    return {
      version: GRAPH_STATE_VERSION,
      tasks: validTasks,
    }
  } catch (error) {
    await logGraph("error", filePath, `[graph-io] Failed to load ${filePath}:`, error)
    return EMPTY_TASKS_STATE
  }
}

export async function _loadRawMems(projectRoot: string): Promise<GraphMemsState> {
  const paths = getEffectivePaths(projectRoot)
  const filePath = paths.graphMems
  const orphanPath = paths.graphOrphans

  if (!existsSync(filePath)) {
    return EMPTY_MEMS_STATE
  }

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    const result = GraphMemsStateSchema.safeParse(parsed)

    if (result.success) {
      return result.data
    }

    await logGraph("error", filePath, "[graph-io] GraphMemsStateSchema parse failed, attempting recovery:", result.error.message)

    const rawMems = (parsed as { mems?: unknown[] })?.mems ?? []
    const validMems: MemNode[] = []
    const now = new Date().toISOString()

    for (const rawMem of rawMems) {
      const memResult = GraphMemsStateSchema.shape.mems.element.safeParse(rawMem)
      if (memResult.success) {
        validMems.push(memResult.data)
      } else {
        const memId = (rawMem as { id?: string })?.id ?? "unknown"
        await logGraph("warn", filePath, `[graph-io] Quarantining invalid mem ${memId}:`, memResult.error.message)
        await quarantineOrphan(orphanPath, {
          id: memId,
          type: "mem",
          reason: `Zod validation failed: ${memResult.error.message}`,
          original_data: rawMem,
          quarantined_at: now,
        })
      }
    }

    return {
      version: GRAPH_STATE_VERSION,
      mems: validMems,
    }
  } catch (error) {
    await logGraph("error", filePath, `[graph-io] Failed to load ${filePath}:`, error)
    return EMPTY_MEMS_STATE
  }
}

export { createHash, existsSync, readFile }
