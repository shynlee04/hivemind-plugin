import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  assessTrajectoryEntry,
  bootstrapTrajectoryLedger,
  closeTrajectory,
  createTrajectoryCheckpoint,
  loadTrajectoryLedger,
  recordTrajectoryEvent,
} from '../src/core/trajectory/index.js'

describe('trajectory ledger', () => {
  it('bootstraps an active trajectory with workflow, session, and task bindings', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-trajectory-ledger-'))

    try {
      const ledger = await bootstrapTrajectoryLedger(dir, {
        trajectoryId: 'trj_bootstrap',
        workflowId: 'wf_bootstrap',
        sessionId: 'ses_bootstrap',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        taskIds: ['task_bootstrap'],
      })

      assert.equal(ledger.activeTrajectoryId, 'trj_bootstrap')
      assert.equal(ledger.trajectories.length, 1)
      assert.equal(ledger.trajectories[0]?.workflowIds[0], 'wf_bootstrap')
      assert.equal(ledger.trajectories[0]?.sessionIds[0], 'ses_bootstrap')
      assert.equal(ledger.trajectories[0]?.taskIds[0], 'task_bootstrap')
      assert.equal(Array.isArray(ledger.checkpoints), true)
      assert.equal(Array.isArray(ledger.recoveryLog), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('keeps active and last-closed trajectories available for assessment and resume', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-trajectory-resume-'))

    try {
      await bootstrapTrajectoryLedger(dir, {
        trajectoryId: 'trj_active',
        workflowId: 'wf_active',
        sessionId: 'ses_active',
        lineage: 'hivefiver',
        purposeClass: 'implementation',
        taskIds: ['task_active'],
      })
      await recordTrajectoryEvent(dir, 'trj_active', {
        kind: 'summary',
        summary: 'Active implementation branch',
      })
      await createTrajectoryCheckpoint(dir, {
        trajectoryId: 'trj_active',
        workflowId: 'wf_active',
        taskIds: ['task_active'],
        source: 'test:resume',
        resumeTarget: 'command:hm-implement',
      })
      await closeTrajectory(dir, 'trj_active', {
        closingSummary: 'Validated implementation branch',
      })

      const ledger = await loadTrajectoryLedger(dir)
      assert.equal(ledger.activeTrajectoryId, null)
      assert.equal(ledger.lastClosedTrajectoryId, 'trj_active')

      const assessment = await assessTrajectoryEntry(dir, {
        userMessage: 'continue the validated implementation branch',
        lineage: 'hivefiver',
        purposeClass: 'implementation',
        sessionScope: 'main',
      })

      assert.equal(assessment.action, 'resume-closed')
      assert.equal(assessment.lastClosedTrajectoryId, 'trj_active')
      assert.equal(assessment.resumeTarget, 'command:hm-implement')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
