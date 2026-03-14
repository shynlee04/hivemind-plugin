import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildContextInjectionPlan,
  buildWorkflowIntegrationState,
  resolveRuntimeLoadStage,
  transformRuntimePrompt,
} from '../src/index.js'
import { routeWorkflow } from '../src/core/workflow-management/index.js'

describe('runtime hook hierarchy', () => {
  it('connects prompt transformation to injection planning', () => {
    const packet = transformRuntimePrompt({
      sessionId: 'ses_main',
      sessionScope: 'main',
      lineage: 'hivefiver',
      workflowId: 'wf-refactor',
      todoChainId: 'todo-refactor',
      branchFocus: 'split runtime families',
    })
    const plan = buildContextInjectionPlan(packet)

    assert.match(plan.systemText, /<hivemind-kernel-packet>/)
    assert.match(plan.messageText ?? '', /<hivemind-lineage-refresh>/)
    assert.equal(plan.sessionScope, 'main')
  })

  it('derives runtime stage and workflow continuity without conflict', () => {
    const stage = resolveRuntimeLoadStage({
      prompt: 'continue the delegated audit with handoff continuity',
      sessionScope: 'sub-session',
      hasWorkflow: true,
      hasHandoff: true,
    })

    const workflow = {
      id: 'wf-refactor',
      intent: 'continue runtime hierarchy refactor',
      stage,
      scope: 'sub-session' as const,
      lineage: 'hivefiver' as const,
    }
    const decision = routeWorkflow(workflow)
    const continuity = buildWorkflowIntegrationState(workflow, {
      sourceSessionId: 'ses_parent',
      targetSessionId: 'ses_child',
      summary: 'carry the delegated continuity packet forward',
      requiredNextSteps: ['return evidence', 'update handoff'],
    })

    assert.equal(stage, 'interdependent')
    assert.equal(decision.loadStrategy, 'bounded')
    assert.equal(continuity.nextSteps.length, 2)
  })
})
