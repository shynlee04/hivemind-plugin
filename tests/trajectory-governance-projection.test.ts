import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  activateWorkflowTask,
  bootstrapTrajectoryLedger,
  bootstrapWorkflowAuthority,
  createPlanningGovernanceProjection,
  createRecoveryCheckpoint,
} from '../src/index.js'

describe('trajectory governance projection', () => {
  it('projects trajectory, workflow, task, and checkpoint state into planning SOT', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-governance-projection-'))

    try {
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_projection',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })
      activateWorkflowTask(dir, {
        workflowId: 'wf_projection',
        taskId: 'task_projection',
        title: 'Projection task',
      })
      await bootstrapTrajectoryLedger(dir, {
        trajectoryId: 'trj_projection',
        workflowId: 'wf_projection',
        sessionId: 'ses_projection',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        taskIds: ['task_projection'],
      })
      await createRecoveryCheckpoint(dir, {
        trajectoryId: 'trj_projection',
        workflowId: 'wf_projection',
        taskIds: ['task_projection'],
        resumeTarget: 'command:hm-plan',
        source: 'test:projection',
      })

      const projection = await createPlanningGovernanceProjection(dir, {
        trajectoryId: 'trj_projection',
        workflowId: 'wf_projection',
      })

      assert.equal(projection.trajectoryId, 'trj_projection')
      assert.equal(projection.workflowId, 'wf_projection')
      assert.equal(projection.taskIds[0], 'task_projection')
      assert.equal(projection.checkpointIds.length, 1)

      const raw = JSON.parse(await readFile(projection.filePath, 'utf-8')) as {
        trajectoryId: string
        taskIds: string[]
        checkpointIds: string[]
      }
      assert.equal(raw.trajectoryId, 'trj_projection')
      assert.equal(raw.taskIds[0], 'task_projection')
      assert.equal(raw.checkpointIds.length, 1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
