import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  bootstrapTrajectoryLedger,
  closeTrajectory,
  createTrajectoryCheckpoint,
} from '../../core/trajectory/index.js'
import type { StartWorkInput } from '../../features/session-entry/start-work-types.js'
import { resolveStartWork } from './start-work-router.js'

function createInput(overrides: Partial<StartWorkInput> = {}): StartWorkInput {
  return {
    userMessage: 'plan plugin context',
    sessionId: 'ses_123',
    sessionScope: 'main',
    hasRuntimeAttachment: true,
    profileComplete: true,
    hasHivemind: true,
    hivemindHealthy: true,
    hasWorkflow: true,
    ...overrides,
  }
}

test('resolveStartWork attaches active trajectory continuations', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-start-work-attach-'))

  try {
    await bootstrapTrajectoryLedger(projectRoot, {
      trajectoryId: 'traj_active',
      workflowId: 'wf_123',
      sessionId: 'ses_prev',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task-1'],
    })
    await createTrajectoryCheckpoint(projectRoot, {
      trajectoryId: 'traj_active',
      workflowId: 'wf_123',
      taskIds: ['task-1'],
      source: 'test',
      resumeTarget: 'command:hm-plan',
    })

    const decision = resolveStartWork(createInput({
      projectRoot,
      workflowId: 'wf_123',
      taskIds: ['task-1'],
      userMessage: 'continue plugin planning work',
    }))

    assert.equal(decision.routeDisposition, 'attach')
    assert.equal(decision.traversalOutcome, 'route')
    assert.equal(decision.sessionState, 'ongoing')
    assert.equal(decision.nextTransition, 'command:hm-plan')
    assert.equal(decision.trajectoryAssessment?.action, 'attach-active')
    assert.ok(decision.pressureSignals.includes('trajectory-continuation'))
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('resolveStartWork resumes the last closed trajectory for continuation requests', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-start-work-resume-'))

  try {
    await bootstrapTrajectoryLedger(projectRoot, {
      trajectoryId: 'traj_closed',
      workflowId: 'wf_123',
      sessionId: 'ses_prev',
      lineage: 'hivefiver',
      purposeClass: 'planning',
      taskIds: ['task-1'],
    })
    await createTrajectoryCheckpoint(projectRoot, {
      trajectoryId: 'traj_closed',
      workflowId: 'wf_123',
      taskIds: ['task-1'],
      source: 'test',
      resumeTarget: 'command:hm-implement',
    })
    await closeTrajectory(projectRoot, 'traj_closed', {
      closingSummary: 'done-for-now',
    })

    const decision = resolveStartWork(createInput({
      projectRoot,
      workflowId: 'wf_123',
      taskIds: ['task-1'],
      userMessage: 'resume plugin planning work',
    }))

    assert.equal(decision.routeDisposition, 'resume')
    assert.equal(decision.traversalOutcome, 'route')
    assert.equal(decision.sessionState, 'continuation')
    assert.equal(decision.nextTransition, 'command:hm-implement')
    assert.equal(decision.trajectoryAssessment?.action, 'resume-closed')
    assert.ok(decision.pressureSignals.includes('trajectory-continuation'))
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('resolveStartWork readiness-gates bootstrap and repair routes', () => {
  const bootstrapDecision = resolveStartWork(createInput({
    userMessage: 'implement plugin context',
    hasRuntimeAttachment: false,
    profileComplete: false,
  }))

  assert.equal(bootstrapDecision.traversalOutcome, 'bootstrap')
  assert.equal(bootstrapDecision.requiredControlPlaneId, 'hm-init')
  assert.equal(bootstrapDecision.requiredCommandId, 'hm-init')
  assert.equal(bootstrapDecision.riskLevel, 'blocked')
  assert.equal(bootstrapDecision.pressureContract.id, 'fresh-bootstrap')

  const repairDecision = resolveStartWork(createInput({
    userMessage: 'repair plugin context',
    hasHivemind: true,
    hivemindHealthy: false,
  }))

  assert.equal(repairDecision.traversalOutcome, 'repair')
  assert.equal(repairDecision.requiredControlPlaneId, 'hm-doctor')
  assert.equal(repairDecision.requiredCommandId, 'hm-doctor')
  assert.equal(repairDecision.riskLevel, 'blocked')
  assert.equal(repairDecision.pressureContract.id, 'control-plane-repair')
})

test('resolveStartWork refuses when the active agent does not match the routed command agent', () => {
  const decision = resolveStartWork(createInput({
    userMessage: 'review plugin context before release',
    activeAgent: 'hivefiver',
  }))

  assert.equal(decision.recommendedCommandId, 'hm-verify')
  assert.equal(decision.commandAgent, 'hiveq')
  assert.equal(decision.traversalOutcome, 'refuse')
  assert.equal(decision.riskLevel, 'gated')
  assert.equal(decision.autoRoute, false)
  assert.ok(decision.pressureSignals.includes('active-trajectory-conflict'))
})

test('resolveStartWork suppresses auto-route for mixed-intent and gated lineage risk', () => {
  const mixedIntentDecision = resolveStartWork(createInput({
    userMessage: 'plan and implement plugin context',
  }))

  assert.equal(mixedIntentDecision.purposeClass, 'planning')
  assert.ok(mixedIntentDecision.reasons.includes('mixed-intent'))
  assert.equal(mixedIntentDecision.autoRoute, false)

  const gatedDecision = resolveStartWork(createInput({
    userMessage: 'implement plugin context',
    activeLineage: 'hiveminder',
  }))

  assert.equal(gatedDecision.recommendedCommandId, 'hm-implement')
  assert.equal(gatedDecision.riskLevel, 'gated')
  assert.equal(gatedDecision.autoRoute, false)
})

test('resolveStartWork marks delegated sub-session pressure explicitly', () => {
  const decision = resolveStartWork(createInput({
    userMessage: 'plan plugin handoff context',
    sessionScope: 'sub-session',
    parentSessionId: 'ses_parent',
    taskIds: ['task-1'],
  }))

  assert.equal(decision.sessionState, 'sub-session')
  assert.ok(decision.pressureSignals.includes('delegated-handoff'))
  assert.equal(decision.pressureContract.id, 'delegated-handoff')
})
