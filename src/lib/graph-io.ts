import { existsSync } from "fs"
import { mkdir, readFile, rename, unlink, writeFile } from "fs/promises"
import { dirname, sep } from "path"
import { z } from "zod"
import { loadTasks, readManifest, type SessionManifest } from "./manifest.js"
import { createLogger, noopLogger, type Logger } from "./logging.js"

import type { MemNode, RalphPrdJson, RalphUserStory, TaskNode } from "../schemas/graph-nodes.js"
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
import {
  quarantineOrphan,
  type OrphanRecord,
} from "./orphan-quarantine.js"

export type { OrphanRecord } from "./orphan-quarantine.js"

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

async function logGraph(level: "warn" | "error", filePath: string, message: string, detail?: unknown): Promise<void> {
  const logger = await getGraphLogger(inferProjectRootFromFilePath(filePath))
  const fullMessage = detail === undefined ? message : `${message} ${normalizeErrorDetail(detail)}`
  await logger[level](fullMessage)
}

/**
 * Load and validate state with safeParse (non-throwing).
 * Returns null on parse failure instead of crashing the agent.
 */
async function loadValidatedState<T>(
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

/**
 * Validate FK constraints for tasks against known phase IDs.
 * Returns valid tasks and quarantines orphans.
 */
export async function validateTasksWithFKValidation(
  filePath: string,
  validPhaseIds: Set<string>,
  orphanPath: string,
  validPlanIds: Set<string> = new Set<string>(),
  planLineageById: Map<string, { project_id: string | null; milestone_id: string | null }> = new Map(),
): Promise<GraphTasksState | null> {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    const result = GraphTasksStateSchema.safeParse(parsed)
    
    if (!result.success) {
      await logGraph("error", filePath, `[graph-io] Validation error in ${filePath}:`, result.error.message)
      return null
    }
    
    // FK validation: filter out orphan tasks
    const validTasks: TaskNode[] = []
    const now = new Date().toISOString()
    
    for (const task of result.data.tasks) {
      let shouldQuarantine = false
      let quarantineReason = ""

      if (!validPhaseIds.has(task.parent_phase_id)) {
        shouldQuarantine = true
        quarantineReason = `parent_phase_id ${task.parent_phase_id} not found in valid phases`
      }

      const taskPlanId = task.plan_id ?? null
      const taskProjectId = task.project_id ?? null
      const taskMilestoneId = task.milestone_id ?? null

      if (!shouldQuarantine && taskPlanId !== null && !validPlanIds.has(taskPlanId)) {
        shouldQuarantine = true
        quarantineReason = `plan_id ${taskPlanId} not found in valid plans`
      }

      if (!shouldQuarantine && (taskProjectId !== null || taskMilestoneId !== null) && taskPlanId === null) {
        shouldQuarantine = true
        quarantineReason = "project_id/milestone_id requires explicit plan_id lineage"
      }

      if (!shouldQuarantine && taskPlanId !== null && (taskProjectId !== null || taskMilestoneId !== null)) {
        const lineage = planLineageById.get(taskPlanId)
        const planProjectId = lineage?.project_id ?? null
        const planMilestoneId = lineage?.milestone_id ?? null

        if (taskProjectId !== null && planProjectId === null) {
          shouldQuarantine = true
          quarantineReason = `project_id ${taskProjectId} cannot be validated: plan ${taskPlanId} has no project_id lineage`
        }

        if (!shouldQuarantine && taskProjectId !== null && taskProjectId !== planProjectId) {
          shouldQuarantine = true
          quarantineReason = `project_id ${taskProjectId} does not match plan ${taskPlanId} project_id ${planProjectId}`
        }

        if (!shouldQuarantine && taskMilestoneId !== null && planMilestoneId === null) {
          shouldQuarantine = true
          quarantineReason = `milestone_id ${taskMilestoneId} cannot be validated: plan ${taskPlanId} has no milestone_id lineage`
        }

        if (!shouldQuarantine && taskMilestoneId !== null && taskMilestoneId !== planMilestoneId) {
          shouldQuarantine = true
          quarantineReason = `milestone_id ${taskMilestoneId} does not match plan ${taskPlanId} milestone_id ${planMilestoneId}`
        }
      }

      if (shouldQuarantine) {
        await logGraph("warn", filePath, `[graph-io] Quarantining orphan task ${task.id}: ${quarantineReason}`)
        await quarantineOrphan(orphanPath, {
          id: task.id,
          type: "task",
          reason: quarantineReason,
          original_data: task,
          quarantined_at: now,
        })
      } else {
        validTasks.push(task)
      }
    }
    
    return {
      version: result.data.version,
      tasks: validTasks,
    }
  } catch (error) {
    await logGraph("error", filePath, `[graph-io] Failed to load ${filePath}:`, error)
    return null
  }
}

/**
 * Validate FK constraints for mems against known task IDs.
 * Returns valid mems and quarantines orphans.
 */
export async function validateMemsWithFKValidation(
  filePath: string,
  validTaskIds: Set<string>,
  orphanPath: string,
  validVerificationIds: Set<string> = new Set<string>(),
  validSessionIds: Set<string> = validTaskIds,
): Promise<GraphMemsState | null> {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const raw = await readFile(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    const result = GraphMemsStateSchema.safeParse(parsed)
    
    if (!result.success) {
      await logGraph("error", filePath, `[graph-io] Validation error in ${filePath}:`, result.error.message)
      return null
    }
    
    // FK validation: filter out orphan mems.
    // origin_task_id is nullable, but session_id is required by schema.
    const validMems: MemNode[] = []
    const now = new Date().toISOString()

    for (const mem of result.data.mems) {
      let shouldQuarantine = false
      let quarantineReason = ""

      // origin_task_id can be null (valid) - only quarantine if non-null and missing
      if (mem.origin_task_id !== null && !validTaskIds.has(mem.origin_task_id)) {
        shouldQuarantine = true
        quarantineReason = `origin_task_id ${mem.origin_task_id} not found in valid tasks`
      }

      // session_id FK validation - always required and must resolve against session lineage.
      if (!shouldQuarantine && !validSessionIds.has(mem.session_id)) {
        shouldQuarantine = true
        quarantineReason = `session_id ${mem.session_id} not found in valid session lineage`
      }

      if (!shouldQuarantine && mem.verification_id !== undefined && mem.verification_id !== null && !validVerificationIds.has(mem.verification_id)) {
        shouldQuarantine = true
        quarantineReason = `verification_id ${mem.verification_id} not found in valid verification lineage`
      }

      if (shouldQuarantine) {
        await logGraph("warn", filePath, `[graph-io] Quarantining orphan mem ${mem.id}: ${quarantineReason}`)
        await quarantineOrphan(orphanPath, {
          id: mem.id,
          type: "mem",
          reason: quarantineReason,
          original_data: mem,
          quarantined_at: now,
        })
      } else {
        validMems.push(mem)
      }
    }
    
    return {
      version: result.data.version,
      mems: validMems,
    }
  } catch (error) {
    await logGraph("error", filePath, `[graph-io] Failed to load ${filePath}:`, error)
    return null
  }
}

// ─── Load/Save Functions with FK Validation ───────────────────────────

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

/**
 * Internal helper: Load tasks with Zod validation only (no FK validation).
 * Used by write operations that need to preserve all existing data.
 */
async function _loadRawTasks(projectRoot: string): Promise<GraphTasksState> {
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

    // Zod parse failed - attempt graceful recovery
    await logGraph("error", filePath, "[graph-io] GraphTasksStateSchema parse failed, attempting recovery:", result.error.message)
    
    // Try to recover valid tasks from the raw parsed data
    const rawTasks = (parsed as { tasks?: unknown[] })?.tasks ?? []
    const validTasks: TaskNode[] = []
    const now = new Date().toISOString()
    
    for (const rawTask of rawTasks) {
      const taskResult = GraphTasksStateSchema.shape.tasks.element.safeParse(rawTask)
      if (taskResult.success) {
        validTasks.push(taskResult.data)
      } else {
        // Quarantine the invalid task
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

    // Return recovered tasks instead of empty state
    return {
      version: GRAPH_STATE_VERSION,
      tasks: validTasks,
    }
  } catch (error) {
    await logGraph("error", filePath, `[graph-io] Failed to load ${filePath}:`, error)
    return EMPTY_TASKS_STATE
  }
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
    const current = await _loadRawTasks(projectRoot)

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

/**
 * Internal helper: Load mems with Zod validation only (no FK validation).
 * Used by write operations that need to preserve all existing data.
 */
async function _loadRawMems(projectRoot: string): Promise<GraphMemsState> {
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

    // Zod parse failed - attempt graceful recovery
    await logGraph("error", filePath, "[graph-io] GraphMemsStateSchema parse failed, attempting recovery:", result.error.message)
    
    // Try to recover valid mems from the raw parsed data
    const rawMems = (parsed as { mems?: unknown[] })?.mems ?? []
    const validMems: MemNode[] = []
    const now = new Date().toISOString()
    
    for (const rawMem of rawMems) {
      const memResult = GraphMemsStateSchema.shape.mems.element.safeParse(rawMem)
      if (memResult.success) {
        validMems.push(memResult.data)
      } else {
        // Quarantine the invalid mem
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

    // Return recovered mems instead of empty state
    return {
      version: GRAPH_STATE_VERSION,
      mems: validMems,
    }
  } catch (error) {
    await logGraph("error", filePath, `[graph-io] Failed to load ${filePath}:`, error)
    return EMPTY_MEMS_STATE
  }
}

export async function saveGraphMems(projectRoot: string, state: GraphMemsState): Promise<void> {
  const filePath = getEffectivePaths(projectRoot).graphMems
  await saveValidatedState(filePath, GraphMemsStateSchema, state)
}

export async function addGraphMem(projectRoot: string, mem: MemNode): Promise<string> {
  const filePath = getEffectivePaths(projectRoot).graphMems

  // Ensure the file exists before trying to lock it
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

// ─── FK-Validated Load Functions ─────────────────────────────────────

/**
 * Options for FK-validated loading.
 */
export interface FKValidationOptions {
  /** Enable FK validation (default: true) */
  enabled?: boolean
  /** Callback when orphans are quarantined */
  onOrphanQuarantined?: (record: OrphanRecord) => void
}

/**
 * Load tasks with FK validation against parent phase IDs.
 * This loads plans first to extract valid phase IDs, then validates each task's parent_phase_id.
 * Orphan tasks are quarantined to the orphans file.
 * 
 * @param projectRoot - Project root directory
 * @param options - FK validation options
 * @returns Tasks state with only valid (non-orphan) tasks
 */
export async function loadGraphTasks(
  projectRoot: string,
  options: FKValidationOptions = {},
): Promise<GraphTasksState> {
  const { enabled = true } = options
  const paths = getEffectivePaths(projectRoot)
  const filePath = paths.graphTasks
  const orphanPath = paths.graphOrphans
  
  if (!existsSync(filePath)) {
    return EMPTY_TASKS_STATE
  }

  // If FK validation disabled, fall back to raw load (Zod only)
  if (!enabled) {
    return _loadRawTasks(projectRoot)
  }

  // Step 1: Load plans to extract valid phase IDs
  // Phases are nested inside plans, so we need to traverse plans[].phases[]
  const plans = await loadPlans(projectRoot)
  const validPhaseIds = new Set<string>()
  const validPlanIds = new Set<string>()
  const planLineageById = new Map<string, { project_id: string | null; milestone_id: string | null }>()
  
  for (const plan of plans.plans) {
    validPlanIds.add(plan.id)
    planLineageById.set(plan.id, {
      project_id: plan.project_id ?? null,
      milestone_id: plan.milestone_id ?? null,
    })

    // Each plan has phases nested inside (from cognitive-packer pattern)
    const planWithPhases = plan as { phases?: Array<{ id: string }> }
    if (planWithPhases.phases) {
      for (const phase of planWithPhases.phases) {
        validPhaseIds.add(phase.id)
      }
    }
  }

  // Step 1b: Include active lifecycle phase from trajectory as a valid FK source.
  // This keeps session-lifecycle-generated tasks FK-valid even before plan phases are materialized.
  const trajectory = await loadTrajectory(projectRoot)
  const lifecyclePhaseId = trajectory?.trajectory?.active_phase_id
  if (lifecyclePhaseId) {
    validPhaseIds.add(lifecyclePhaseId)
  }

  // Step 2: Load and validate tasks with FK validation
  const validatedState = await validateTasksWithFKValidation(
    filePath,
    validPhaseIds,
    orphanPath,
    validPlanIds,
    planLineageById,
  )
  
  if (validatedState) {
    return validatedState
  }

  return EMPTY_TASKS_STATE
}

/**
 * Load mems with FK validation against origin task IDs.
 * This loads tasks first to get valid task IDs, then validates each mem's origin_task_id.
 * Mems with null origin_task_id are always valid (no FK constraint).
 * Orphan mems are quarantined to the orphans file.
 * 
 * @param projectRoot - Project root directory
 * @param options - FK validation options
 * @returns Mems state with only valid (non-orphan) mems
 */
export async function loadGraphMems(
  projectRoot: string,
  options: FKValidationOptions = {},
): Promise<GraphMemsState> {
  const { enabled = true } = options
  const paths = getEffectivePaths(projectRoot)
  const filePath = paths.graphMems
  const orphanPath = paths.graphOrphans
  
  if (!existsSync(filePath)) {
    return EMPTY_MEMS_STATE
  }

  // If FK validation disabled, fall back to raw load (Zod only)
  if (!enabled) {
    return _loadRawMems(projectRoot)
  }

  // Step 1: Load tasks to get valid task IDs (use raw load to get ALL tasks)
  const tasks = await _loadRawTasks(projectRoot)
  
  // Build set of valid task IDs
  const validTaskIds = new Set(tasks.tasks.map((task) => task.id))
  const validSessionIds = new Set<string>()
  const validVerificationIds = new Set<string>()

  const trajectory = await loadTrajectory(projectRoot)
  const trajectorySessionId = trajectory?.trajectory?.session_id
  if (trajectorySessionId) {
    validSessionIds.add(trajectorySessionId)
  }

  const plans = await loadPlans(projectRoot)
  for (const plan of plans.plans) {
    const planWithVerifications = plan as { verifications?: Array<{ id: string }> }
    if (planWithVerifications.verifications) {
      for (const verification of planWithVerifications.verifications) {
        validVerificationIds.add(verification.id)
      }
    }
  }

  // Step 1b: Load sessions to get valid session IDs
  try {
    const sessionsPath = paths.sessionsManifest
    if (existsSync(sessionsPath)) {
      const sessions = await readManifest<SessionManifest>(sessionsPath)
      if (sessions && sessions.sessions) {
         sessions.sessions.forEach(s => {
            validSessionIds.add(s.stamp)
            if (s.session_id) {
              if (Array.isArray(s.session_id)) {
                s.session_id.forEach(id => validSessionIds.add(id))
              } else {
                validSessionIds.add(s.session_id)
              }
            }
          })
      }
    }
  } catch (e) {
    await logGraph("warn", filePath, "Failed to load sessions for FK validation", e)
  }

  // Step 2: Load and validate mems with FK validation
  const validatedState = await validateMemsWithFKValidation(
    filePath,
    validTaskIds,
    orphanPath,
    validVerificationIds,
    validSessionIds,
  )
  
  if (validatedState) {
    return validatedState
  }

  return EMPTY_MEMS_STATE
}

/**
 * Load all graph entities with full FK validation chain:
 * 1. Load trajectory (no FK constraints - root entity)
 * 2. Load tasks with FK validation against trajectory phases
 * 3. Load mems with FK validation against tasks
 * 
 * @param projectRoot - Project root directory
 * @param options - FK validation options
 * @returns Tuple of [trajectory, tasks, mems] all FK-validated
 */
export async function loadGraphWithFullFKValidation(
  projectRoot: string,
  options: FKValidationOptions = {},
): Promise<{
  trajectory: TrajectoryState | null
  tasks: GraphTasksState
  mems: GraphMemsState
}> {
  // Load in dependency order for FK validation
  // Note: loadGraphTasks and loadGraphMems now have FK validation built-in
  const trajectory = await loadTrajectory(projectRoot)
  const tasks = await loadGraphTasks(projectRoot, options)
  const mems = await loadGraphMems(projectRoot, options)

  return { trajectory, tasks, mems }
}

export interface LifecycleLineageSnapshot {
  has_trajectory: boolean
  active_plan_id: string | null
  active_phase_id: string | null
  active_task_ids: string[]
  totals: {
    plans: number
    tasks: number
    mems: number
  }
  missing: {
    plan_project_lineage: string[]
    plan_milestone_lineage: string[]
    task_plan_lineage: string[]
    task_project_lineage: string[]
    task_milestone_lineage: string[]
    mem_verification_lineage: string[]
  }
}

/**
 * HiveFiver compatibility helper:
 * summarizes lifecycle lineage integrity for GSD/Ralph bridge validation.
 */
export async function buildLifecycleLineageSnapshot(
  projectRoot: string,
): Promise<LifecycleLineageSnapshot> {
  const [trajectory, plans, tasks, mems] = await Promise.all([
    loadTrajectory(projectRoot),
    loadPlans(projectRoot),
    loadGraphTasks(projectRoot),
    loadGraphMems(projectRoot),
  ])

  const planIds = new Set(plans.plans.map((plan) => plan.id))

  const planProjectMissing: string[] = []
  const planMilestoneMissing: string[] = []
  for (const plan of plans.plans) {
    if (!plan.project_id || plan.project_id.trim().length === 0) {
      planProjectMissing.push(plan.id)
    }
    if (!plan.milestone_id || plan.milestone_id.trim().length === 0) {
      planMilestoneMissing.push(plan.id)
    }
  }

  const taskPlanMissing: string[] = []
  const taskProjectMissing: string[] = []
  const taskMilestoneMissing: string[] = []
  for (const task of tasks.tasks) {
    if (!task.plan_id || !planIds.has(task.plan_id)) {
      taskPlanMissing.push(task.id)
    }
    if (!task.project_id || task.project_id.trim().length === 0) {
      taskProjectMissing.push(task.id)
    }
    if (!task.milestone_id || task.milestone_id.trim().length === 0) {
      taskMilestoneMissing.push(task.id)
    }
  }

  const memVerificationMissing = mems.mems
    .filter((mem) => mem.verification_id === undefined || mem.verification_id === null)
    .map((mem) => mem.id)

  return {
    has_trajectory: trajectory !== null,
    active_plan_id: trajectory?.trajectory?.active_plan_id ?? null,
    active_phase_id: trajectory?.trajectory?.active_phase_id ?? null,
    active_task_ids: trajectory?.trajectory?.active_task_ids ?? [],
    totals: {
      plans: plans.plans.length,
      tasks: tasks.tasks.length,
      mems: mems.mems.length,
    },
    missing: {
      plan_project_lineage: planProjectMissing,
      plan_milestone_lineage: planMilestoneMissing,
      task_plan_lineage: taskPlanMissing,
      task_project_lineage: taskProjectMissing,
      task_milestone_lineage: taskMilestoneMissing,
      mem_verification_lineage: memVerificationMissing,
    },
  }
}

export interface RalphTaskGraphSnapshot {
  source: "state.tasks" | "graph.tasks" | "empty"
  warnings: string[]
  prd: RalphPrdJson
}

function toRalphStatus(value: string | undefined): RalphUserStory["status"] {
  if (value === "completed" || value === "complete") return "completed"
  if (value === "in_progress" || value === "active") return "in_progress"
  if (value === "blocked" || value === "invalidated") return "blocked"
  return "pending"
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      .map((entry) => entry.trim())
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }

  return []
}

function toAcceptanceCriteria(
  description: string,
  fallback: unknown,
): string[] {
  const fromField = toStringArray(fallback)
  if (fromField.length > 0) {
    return fromField
  }

  const extracted = description
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- [ ] ") || line.startsWith("- ") || line.startsWith("* "))
    .map((line) => line.replace(/^- \[ \]\s*/, "").replace(/^[-*]\s*/, "").trim())
    .filter((line) => line.length > 0)

  return extracted
}

/**
 * HiveFiver / Ralph bridge helper:
 * builds flat-root PRD JSON from persisted TODO/task state with deterministic IDs.
 */
export async function buildRalphTaskGraphSnapshot(
  projectRoot: string,
  options: {
    name?: string
    description?: string
  } = {},
): Promise<RalphTaskGraphSnapshot> {
  const warnings: string[] = []
  const name = options.name?.trim() || "HiveFiver Task Export"
  const description = options.description?.trim() || "Generated from .hivemind task manifests."

  const stateTasks = await loadTasks(projectRoot)
  if (stateTasks && stateTasks.tasks.length > 0) {
    const userStories: RalphUserStory[] = stateTasks.tasks.map((task, index) => {
      const node = task as Record<string, unknown>
      const titleRaw = typeof task.text === "string" && task.text.trim().length > 0
        ? task.text.trim()
        : `Task ${index + 1}`
      const dependencies = toStringArray(
        node.dependencies ?? node.depends_on ?? node.dependsOn,
      )
      const acceptanceCriteria = toAcceptanceCriteria(
        titleRaw,
        node.acceptanceCriteria ?? node.acceptance_criteria,
      )

      return {
        id: task.id || `story-${index + 1}`,
        title: titleRaw.split("\n")[0] || `Task ${index + 1}`,
        description: titleRaw,
        status: toRalphStatus(task.status),
        dependencies,
        acceptanceCriteria,
        relatedEntities:
          typeof node.related_entities === "object" && node.related_entities !== null
            ? {
                session_id:
                  typeof (node.related_entities as Record<string, unknown>).session_id === "string"
                    ? (node.related_entities as Record<string, unknown>).session_id as string
                    : undefined,
                plan_id:
                  typeof (node.related_entities as Record<string, unknown>).plan_id === "string"
                    ? (node.related_entities as Record<string, unknown>).plan_id as string
                    : undefined,
                phase_id:
                  typeof (node.related_entities as Record<string, unknown>).phase_id === "string"
                    ? (node.related_entities as Record<string, unknown>).phase_id as string
                    : undefined,
                graph_task_id:
                  typeof (node.related_entities as Record<string, unknown>).graph_task_id === "string"
                    ? (node.related_entities as Record<string, unknown>).graph_task_id as string
                    : undefined,
                story_id:
                  typeof (node.related_entities as Record<string, unknown>).story_id === "string"
                    ? (node.related_entities as Record<string, unknown>).story_id as string
                    : undefined,
                workflow_id:
                  typeof (node.related_entities as Record<string, unknown>).workflow_id === "string"
                    ? (node.related_entities as Record<string, unknown>).workflow_id as string
                    : undefined,
                requirement_node_id:
                  typeof (node.related_entities as Record<string, unknown>).requirement_node_id === "string"
                    ? (node.related_entities as Record<string, unknown>).requirement_node_id as string
                    : undefined,
                mcp_provider_id:
                  typeof (node.related_entities as Record<string, unknown>).mcp_provider_id === "string"
                    ? (node.related_entities as Record<string, unknown>).mcp_provider_id as string
                    : undefined,
                export_id:
                  typeof (node.related_entities as Record<string, unknown>).export_id === "string"
                    ? (node.related_entities as Record<string, unknown>).export_id as string
                    : undefined,
              }
            : undefined,
      }
    })

    return {
      source: "state.tasks",
      warnings,
      prd: {
        name,
        description,
        userStories,
      },
    }
  }

  const graphTasks = await loadGraphTasks(projectRoot)
  if (graphTasks.tasks.length > 0) {
    warnings.push("state/tasks.json not found or empty; using graph/tasks.json fallback")
    const userStories: RalphUserStory[] = graphTasks.tasks.map((task, index) => ({
      id: task.id,
      title: task.title,
      description: `Phase ${task.parent_phase_id}: ${task.title}`,
      status: toRalphStatus(task.status),
      dependencies: index > 0 ? [graphTasks.tasks[index - 1]?.id].filter(Boolean) as string[] : [],
      acceptanceCriteria: [],
      relatedEntities: {
        graph_task_id: task.id,
      },
    }))

    return {
      source: "graph.tasks",
      warnings,
      prd: {
        name,
        description,
        userStories,
      },
    }
  }

  warnings.push("no tasks found in state/tasks.json or graph/tasks.json")
  return {
    source: "empty",
    warnings,
    prd: {
      name,
      description,
      userStories: [],
    },
  }
}
