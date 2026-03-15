import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  assessRecoveryState,
  createRecoveryCheckpoint,
  repairRecoveryState,
} from '../src/recovery/index.js'
import { bootstrapTrajectoryLedger, loadTrajectoryLedger } from '../src/core/trajectory/index.js'
import { bootstrapWorkflowAuthority } from '../src/core/workflow-management/index.js'

describe('recovery checkpoint spine', () => {
  it('creates checkpoints and resumes from the latest target after recoverable drift', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-recovery-checkpoint-'))

    try {
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_runtime',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })
      await bootstrapTrajectoryLedger(dir, {
        trajectoryId: 'trj_runtime',
        workflowId: 'wf_runtime',
        sessionId: 'ses_runtime',
        lineage: 'hivefiver',
        purposeClass: 'implementation',
        taskIds: ['task_runtime'],
      })

      await createRecoveryCheckpoint(dir, {
        trajectoryId: 'trj_runtime',
        workflowId: 'wf_runtime',
        taskIds: ['task_runtime'],
        resumeTarget: 'command:hm-implement',
        source: 'test:checkpoint',
      })

      const assessment = await assessRecoveryState(dir, {
        sessionScope: 'main',
        trajectoryId: 'trj_runtime',
        workflowId: 'wf_runtime',
        taskIds: ['task_runtime'],
      })

      assert.equal(assessment.status, 'healthy')
      assert.equal(assessment.resumeTarget, 'command:hm-implement')
      assert.equal(assessment.pressureContract.id, 'steady-state')
      assert.equal(assessment.evidenceRefs.includes('checkpoint:chk_') || assessment.evidenceRefs.some((item) => item.startsWith('checkpoint:')), true)

      const ledger = await loadTrajectoryLedger(dir)
      assert.equal(ledger.trajectories[0]?.checkpointIds.length, 1)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('repairs a corrupt trajectory ledger and records a recovery outcome', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-recovery-repair-'))

    try {
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_repair',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })
      const ledgerPath = join(dir, '.hivemind', 'state', 'trajectory-ledger.json')
      await writeFile(ledgerPath, '{not-json')

      const assessment = await assessRecoveryState(dir, {
        sessionScope: 'main',
        workflowId: 'wf_repair',
      })
      assert.equal(assessment.status, 'recoverable')
      assert.equal(assessment.failureClasses.includes('corrupt-trajectory-ledger'), true)
      assert.equal(assessment.pressureContract.id, 'control-plane-repair')

      const repaired = await repairRecoveryState(dir, {
        sessionScope: 'main',
        workflowId: 'wf_repair',
        trajectoryId: 'trj_repair',
        lineage: 'hivefiver',
        purposeClass: 'planning',
      })

      assert.equal(repaired.status, 'healthy')
      assert.equal(repaired.recoveryOutcome, 'repair')
      assert.equal(repaired.repairActions.includes('rebuild-trajectory-ledger'), true)
      assert.equal(Array.isArray(repaired.evidenceRefs), true)

      const ledger = await loadTrajectoryLedger(dir)
      assert.equal(Array.isArray(ledger.recoveryLog), true)
      assert.equal(ledger.recoveryLog.at(-1)?.outcome, 'repair')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
