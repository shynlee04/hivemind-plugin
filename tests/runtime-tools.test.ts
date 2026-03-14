import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  contextInjectionHookBridge,
  promptTransformationHookBridge,
  runtimeLoaderHookBridge,
  workflowIntegrationHookBridge,
} from '../src/hooks/index.js'

describe('runtime hook bridges', () => {
  it('loads instruction text through the runtime hook bridge path', async () => {
    const instruction = await contextInjectionHookBridge.loadInstruction()
    assert.match(instruction, /Inject only the lineage-scoped packet needed/)
  })

  it('executes prompt transformation hook bridge with instruction-backed metadata', async () => {
    const response = await promptTransformationHookBridge.execute({
      sessionId: 'ses_main',
      sessionScope: 'main',
      lineage: 'hivefiver',
      workflowId: 'wf-main',
      todoChainId: 'todo-main',
      branchFocus: 'refactor tools',
    })

    assert.equal(response.status, 'success')
    assert.match(String(response.metadata?.instruction ?? ''), /Transform runtime state into prompt packets/)
  })

  it('executes runtime loader and workflow integration hook bridges', async () => {
    const loader = await runtimeLoaderHookBridge.execute({
      prompt: 'continue delegated work',
      sessionScope: 'sub-session',
      hasWorkflow: true,
      hasHandoff: true,
    })
    const integration = await workflowIntegrationHookBridge.execute({
      workflow: {
        id: 'wf-sub',
        intent: 'continue delegated work',
        stage: 'interdependent',
        scope: 'sub-session',
        lineage: 'hivefiver',
      },
      handoff: {
        sourceSessionId: 'ses-parent',
        summary: 'bring back evidence',
        requiredNextSteps: ['return findings'],
      },
    })

    assert.equal(loader.status, 'success')
    assert.equal(integration.status, 'success')
    assert.equal(loader.data?.stage, 'interdependent')
    assert.equal(integration.data?.decision.loadStrategy, 'bounded')
  })
})
