import * as fs from 'node:fs/promises'
import * as path from 'node:path'

import { getHivemindPath } from '../shared/paths.js'
import { loadTrajectoryLedger } from '../core/trajectory/index.js'
import { readWorkflowTaskState } from '../core/workflow-management/index.js'

export interface PlanningGovernanceProjection {
  filePath: string
  trajectoryId: string
  workflowId: string
  taskIds: string[]
  checkpointIds: string[]
  recoveryOutcomes: string[]
  projectedAt: string
}

export async function createPlanningGovernanceProjection(
  projectRoot: string,
  input: { trajectoryId: string; workflowId: string },
): Promise<PlanningGovernanceProjection> {
  const ledger = await loadTrajectoryLedger(projectRoot)
  const trajectory = ledger.trajectories.find((item) => item.id === input.trajectoryId)
  const taskState = readWorkflowTaskState(projectRoot)
  const taskIds = taskState.tasks
    .filter((task) => task.workflowId === input.workflowId)
    .map((task) => task.id)
  const checkpointIds = trajectory?.checkpointIds ?? []
  const recoveryOutcomes = ledger.recoveryLog.map((entry) => entry.outcome)
  const projectedAt = new Date().toISOString()
  const filePath = path.join(
    getHivemindPath(projectRoot),
    'project',
    'planning',
    'trajectory-projections',
    `${input.trajectoryId}.json`,
  )

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify({
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds,
    checkpointIds,
    recoveryOutcomes,
    projectedAt,
  }, null, 2))

  return {
    filePath,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds,
    checkpointIds,
    recoveryOutcomes,
    projectedAt,
  }
}
