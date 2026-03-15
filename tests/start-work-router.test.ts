import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { resolveStartWork } from '../src/hooks/start-work/index.js'
import { bootstrapWorkflowAuthority } from '../src/core/workflow-management/index.js'
import { bootstrapTrajectoryLedger, closeTrajectory } from '../src/core/trajectory/index.js'

describe('start-work router', () => {
  it('forces hm-init when no hivemind state exists', () => {
    const decision = resolveStartWork({
      userMessage: 'implement the refactor workflow',
      sessionId: 'ses_bootstrap',
      sessionScope: 'main',
      hasHivemind: false,
      hivemindHealthy: false,
      hasWorkflow: false,
      hasHandoff: false,
    })

    assert.equal(decision.requiredCommandId, 'hm-init')
    assert.equal(decision.riskLevel, 'blocked')
    assert.equal(decision.pressureContract.id, 'fresh-bootstrap')
    assert.equal(decision.pressureSignals.includes('fresh-bootstrap'), true)
  })

  it('forces hm-init when workflow state exists but bootstrap profile intake is incomplete', () => {
    const decision = resolveStartWork({
      userMessage: 'continue the planning work',
      sessionId: 'ses_profile_gap',
      sessionScope: 'main',
      hasRuntimeAttachment: false,
      profileComplete: false,
      hasHivemind: true,
      hivemindHealthy: true,
      hasWorkflow: true,
      hasHandoff: false,
    })

    assert.equal(decision.requiredCommandId, 'hm-init')
    assert.equal(decision.riskLevel, 'blocked')
    assert.equal(decision.pressureSignals.includes('fresh-bootstrap'), true)
  })

  it('routes framework implementation into hivefiver command stack', () => {
    const decision = resolveStartWork({
      userMessage: 'implement the plugin hook refactor and workflow chain',
      sessionId: 'ses_impl',
      sessionScope: 'main',
      activeLineage: 'hivefiver',
      hasHivemind: true,
      hivemindHealthy: true,
      hasWorkflow: true,
      hasHandoff: false,
    })

    assert.equal(decision.lineage, 'hivefiver')
    assert.equal(decision.purposeClass, 'implementation')
    assert.equal(decision.recommendedCommandId, 'hm-implement')
    assert.equal(decision.autoRoute, true)
    assert.equal(decision.pressureContract.id, 'steady-state')
  })

  it('keeps sub-session continuity bounded', () => {
    const decision = resolveStartWork({
      userMessage: 'investigate and synthesize the doc-intel gaps',
      sessionId: 'ses_sub',
      sessionScope: 'sub-session',
      parentSessionId: 'ses_parent',
      activeLineage: 'hivefiver',
      hasHivemind: true,
      hivemindHealthy: true,
      hasWorkflow: true,
      hasHandoff: true,
    })

    assert.equal(decision.sessionState, 'sub-session')
    assert.equal(decision.purposeClass, 'research')
    assert.equal(decision.recommendedCommandId, 'hm-research')
    assert.equal(decision.pressureSignals.includes('delegated-handoff'), true)
  })

  it('gates sub-session entries that have no linked task authority', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-start-work-'))

    try {
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_parent',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })

      const decision = resolveStartWork({
        userMessage: 'continue delegated implementation',
        sessionId: 'ses_sub_orphan',
        sessionScope: 'sub-session',
        projectRoot: dir,
        activeLineage: 'hivefiver',
      })

      assert.equal(decision.riskLevel, 'gated')
      assert.equal(decision.traversalOutcome, 'route')
      assert.equal(decision.continuityAlerts.includes('missing-task-link'), true)
      assert.equal(decision.pressureSignals.includes('delegated-handoff'), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('attaches to an active trajectory instead of treating the session as the authority', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-start-work-trajectory-'))

    try {
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_active',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })
      await bootstrapTrajectoryLedger(dir, {
        trajectoryId: 'trj_active',
        workflowId: 'wf_active',
        sessionId: 'ses_existing',
        lineage: 'hivefiver',
        purposeClass: 'planning',
        taskIds: ['task_active'],
      })

      const decision = resolveStartWork({
        userMessage: 'continue the active planning workflow',
        sessionId: 'ses_new',
        sessionScope: 'main',
        projectRoot: dir,
        activeLineage: 'hivefiver',
        workflowId: 'wf_active',
      })

      assert.equal(decision.trajectoryAssessment?.action, 'attach-active')
      assert.equal(decision.trajectoryAssessment?.activeTrajectoryId, 'trj_active')
      assert.equal(decision.routeDisposition, 'attach')
      assert.equal(decision.pressureContract.id, 'trajectory-continuation')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('resumes last-closed trajectories when there is no active one and the prompt signals continuation', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-start-work-resume-'))

    try {
      bootstrapWorkflowAuthority(dir, {
        workflowId: 'wf_closed',
        sessionScope: 'main',
        lineage: 'hivefiver',
      })
      await bootstrapTrajectoryLedger(dir, {
        trajectoryId: 'trj_closed',
        workflowId: 'wf_closed',
        sessionId: 'ses_closed',
        lineage: 'hivefiver',
        purposeClass: 'implementation',
        taskIds: ['task_closed'],
      })
      await closeTrajectory(dir, 'trj_closed', {
        closingSummary: 'Implementation branch validated',
      })

      const decision = resolveStartWork({
        userMessage: 'resume the implementation work we validated last time',
        sessionId: 'ses_resume',
        sessionScope: 'main',
        projectRoot: dir,
        activeLineage: 'hivefiver',
      })

      assert.equal(decision.trajectoryAssessment?.action, 'resume-closed')
      assert.equal(decision.trajectoryAssessment?.lastClosedTrajectoryId, 'trj_closed')
      assert.equal(decision.routeDisposition, 'resume')
      assert.equal(decision.pressureSignals.includes('trajectory-continuation'), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
