import type { MemNode, TaskNode } from "../../schemas/graph-nodes.js"
import {
  GraphMemsStateSchema,
  GraphTasksStateSchema,
  type GraphMemsState,
  type GraphTasksState,
} from "../../schemas/graph-state.js"
import {
  existsSync,
  logGraph,
  readFile,
} from "./shared.js"
import { quarantineOrphan } from "../orphan-quarantine.js"

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

    const validMems: MemNode[] = []
    const now = new Date().toISOString()

    for (const mem of result.data.mems) {
      let shouldQuarantine = false
      let quarantineReason = ""

      if (mem.origin_task_id !== null && !validTaskIds.has(mem.origin_task_id)) {
        shouldQuarantine = true
        quarantineReason = `origin_task_id ${mem.origin_task_id} not found in valid tasks`
      }

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
