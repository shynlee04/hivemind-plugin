import assert from 'node:assert/strict'
import test from 'node:test'

import type { RuntimeBindingsSnapshot } from '../src/features/runtime-entry/attachment.js'
import { maybeExecuteNlFirstRuntimeDispatch } from '../src/features/runtime-entry/nl-first-dispatch.js'
import type { StartWorkDecision } from '../src/features/session-entry/start-work-types.js'
import { getRuntimePressureContract } from '../src/shared/pressure-contract.js'

function createStartWorkDecision(overrides: Partial<StartWorkDecision> = {}): StartWorkDecision {
  return {
    sessionId: 'ses_123',
    sessionScope: 'main',
    sessionState: 'fresh',
    lineage: 'hivefiver',
    purposeClass: 'planning',
    confidence: 0.9,
    reasons: ['planning-keyword'],
    readiness: [],
    traversalOutcome: 'route',
    commandAgent: 'planner',
    continuityAlerts: [],
    workflowAuthority: undefined,
    trajectoryAssessment: undefined,
    routeDisposition: 'create',
    nextTransition: 'command:hm-plan',
    requiredControlPlaneId: undefined,
    recommendedControlPlaneId: undefined,
    requiredCommandId: undefined,
    recommendedCommandId: 'hm-plan',
    programmaticInitiationRequired: false,
    autoRoute: true,
    riskLevel: 'none',
    opencodeKnowledge: [],
    pressureSignals: ['steady-state'],
    pressureContract: getRuntimePressureContract('steady-state'),
    ...overrides,
  }
}

const snapshot = {} as RuntimeBindingsSnapshot

test('nl-first dispatch keeps workflow route hints when no execution bridge is available', async () => {
  const result = await maybeExecuteNlFirstRuntimeDispatch({
    projectRoot: '/tmp/hivemind',
    startWork: createStartWorkDecision(),
    snapshot,
    userMessage: 'please plan the runtime cleanup',
    context: {
      sessionID: 'ses_123',
      agent: 'hivefiver',
    },
  })

  assert.deepEqual(result.plan, {
    shouldDispatch: false,
    routeKind: 'workflow-command',
    commandId: 'hm-plan',
    reason: 'NL-first runtime dispatch execution is not available in the messages transform flow; preserving the route hint.',
  })
})

test('nl-first dispatch reports control-plane routes without suppressing the route hint', async () => {
  const result = await maybeExecuteNlFirstRuntimeDispatch({
    projectRoot: '/tmp/hivemind',
    startWork: createStartWorkDecision({
      recommendedControlPlaneId: 'hm-init',
      requiredCommandId: 'hm-init',
      recommendedCommandId: 'hm-init',
      programmaticInitiationRequired: true,
    }),
    snapshot,
    userMessage: 'bootstrap hivemind',
    context: {
      sessionID: 'ses_123',
      agent: 'hivefiver',
    },
  })

  assert.deepEqual(result.plan, {
    shouldDispatch: false,
    routeKind: 'control-plane',
    commandId: 'hm-init',
    reason: 'NL-first runtime dispatch execution is not available in the messages transform flow; preserving the route hint.',
  })
})
