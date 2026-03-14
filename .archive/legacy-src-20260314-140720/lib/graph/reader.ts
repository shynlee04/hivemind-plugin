import {
  GraphMemsStateSchema,
  GraphTasksStateSchema,
  PlansStateSchema,
  TrajectoryStateSchema,
  type GraphMemsState,
  type GraphTasksState,
  type TrajectoryState,
} from "../../schemas/graph-state.js"
import type { OrphanRecord } from "./shared.js"
import {
  EMPTY_MEMS_STATE,
  EMPTY_PLANS_STATE,
  EMPTY_TASKS_STATE,
  _loadRawMems,
  _loadRawTasks,
  existsSync,
  getEffectivePaths,
  loadValidatedState,
  logGraph,
} from "./shared.js"
import {
  validateMemsWithFKValidation,
  validateTasksWithFKValidation,
} from "./fk-validator.js"
import { readManifest, type SessionManifest } from "../manifest.js"

export interface FKValidationOptions {
  enabled?: boolean
  onOrphanQuarantined?: (record: OrphanRecord) => void
}

export async function loadTrajectory(projectRoot: string): Promise<TrajectoryState | null> {
  const filePath = getEffectivePaths(projectRoot).graphTrajectory
  return loadValidatedState(filePath, TrajectoryStateSchema)
}

export async function loadPlans(projectRoot: string) {
  const filePath = getEffectivePaths(projectRoot).graphPlans
  const state = await loadValidatedState(filePath, PlansStateSchema)
  return state ?? EMPTY_PLANS_STATE
}

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

  if (!enabled) {
    return _loadRawTasks(projectRoot)
  }

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

    const planWithPhases = plan as { phases?: Array<{ id: string }> }
    if (planWithPhases.phases) {
      for (const phase of planWithPhases.phases) {
        validPhaseIds.add(phase.id)
      }
    }
  }

  const trajectory = await loadTrajectory(projectRoot)
  const lifecyclePhaseId = trajectory?.trajectory?.active_phase_id
  if (lifecyclePhaseId) {
    validPhaseIds.add(lifecyclePhaseId)
  }

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

  if (!enabled) {
    return _loadRawMems(projectRoot)
  }

  const tasks = await _loadRawTasks(projectRoot)
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

  try {
    const sessionsPath = paths.sessionsManifest
    if (existsSync(sessionsPath)) {
      const sessions = await readManifest<SessionManifest>(sessionsPath)
      if (sessions && sessions.sessions) {
        sessions.sessions.forEach((session) => {
          validSessionIds.add(session.stamp)
          if (session.session_id) {
            if (Array.isArray(session.session_id)) {
              session.session_id.forEach((id) => validSessionIds.add(id))
            } else {
              validSessionIds.add(session.session_id)
            }
          }
        })
      }
    }
  } catch (error) {
    await logGraph("warn", filePath, "Failed to load sessions for FK validation", error)
  }

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

export async function loadGraphWithFullFKValidation(
  projectRoot: string,
  options: FKValidationOptions = {},
): Promise<{
  trajectory: TrajectoryState | null
  tasks: GraphTasksState
  mems: GraphMemsState
}> {
  const trajectory = await loadTrajectory(projectRoot)
  const tasks = await loadGraphTasks(projectRoot, options)
  const mems = await loadGraphMems(projectRoot, options)

  return { trajectory, tasks, mems }
}

export interface LifecycleLineageSnapshot {
  has_trajectory: boolean
  chain_presence: {
    project: boolean
    milestone: boolean
    phase: boolean
    plan: boolean
    task: boolean
    verification: boolean
  }
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

  const activePlanId = trajectory?.trajectory?.active_plan_id ?? null
  const activePhaseId = trajectory?.trajectory?.active_phase_id ?? null
  const activeTaskIds = trajectory?.trajectory?.active_task_ids ?? []

  const hasProjectLineage =
    plans.plans.length > 0 &&
    tasks.tasks.length > 0 &&
    planProjectMissing.length === 0 &&
    taskProjectMissing.length === 0

  const hasMilestoneLineage =
    plans.plans.length > 0 &&
    tasks.tasks.length > 0 &&
    planMilestoneMissing.length === 0 &&
    taskMilestoneMissing.length === 0

  const hasPhaseLineage =
    (typeof activePhaseId === "string" && activePhaseId.trim().length > 0) ||
    tasks.tasks.some((task) => typeof task.parent_phase_id === "string" && task.parent_phase_id.trim().length > 0)

  const hasPlanLineage =
    (typeof activePlanId === "string" && activePlanId.trim().length > 0 && planIds.has(activePlanId)) ||
    plans.plans.length > 0

  const hasTaskLineage = activeTaskIds.length > 0 || tasks.tasks.length > 0
  const hasVerificationLineage = memVerificationMissing.length === 0

  return {
    has_trajectory: trajectory !== null,
    chain_presence: {
      project: hasProjectLineage,
      milestone: hasMilestoneLineage,
      phase: hasPhaseLineage,
      plan: hasPlanLineage,
      task: hasTaskLineage,
      verification: hasVerificationLineage,
    },
    active_plan_id: activePlanId,
    active_phase_id: activePhaseId,
    active_task_ids: activeTaskIds,
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

export { GraphMemsStateSchema, GraphTasksStateSchema }
