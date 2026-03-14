import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createPluginRuntimePlan } from '../src/plugin/index.js'

describe('plugin runtime plan', () => {
  it('assembles start-work, handler context, packet transforms, and command preview', async () => {
    const response = await createPluginRuntimePlan({
      startWork: {
        userMessage: 'plan the workflow roadmap for the hook refactor',
        sessionId: 'ses_runtime',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        hasHivemind: true,
        hivemindHealthy: true,
        hasWorkflow: true,
        hasHandoff: false,
      },
      promptState: {
        sessionId: 'ses_runtime',
        sessionScope: 'main',
        lineage: 'hivefiver',
        workflowId: 'wf_runtime',
        todoChainId: 'todo_runtime',
        branchFocus: 'start-work driven orchestration',
      },
    })

    assert.equal(response.status, 'success')
    assert.equal(response.data?.startWork.lineage, 'hivefiver')
    assert.equal(response.data?.pluginContext.category, 'planning')
    assert.equal(response.data?.promptPacket.sessionScope, 'main')
    assert.ok(response.data?.runtimeSurfaces.some((entry) => entry.id === 'hm-plan'))
    assert.ok(response.data?.runtimeSurfaces.some((entry) => entry.id === 'hivemind_task'))
    assert.ok(response.data?.runtimeSurfaces.some((entry) => entry.id === 'hivemind_trajectory'))
    assert.ok(response.data?.runtimeSurfaces.some((entry) => entry.id === 'hivemind_handoff'))
    assert.equal(response.data?.commandPreview?.frontmatter.agent, 'hivefiver')
    assert.match(response.data?.commandPreview?.body ?? '', /## Output Contract/)
  })

  it('uses delegated prompt mode for sub-sessions', async () => {
    const response = await createPluginRuntimePlan({
      startWork: {
        userMessage: 'investigate the delegated handoff evidence',
        sessionId: 'ses_child',
        sessionScope: 'sub-session',
        parentSessionId: 'ses_parent',
        activeLineage: 'hivefiver',
        hasHivemind: true,
        hivemindHealthy: true,
        hasWorkflow: true,
        hasHandoff: true,
      },
      promptState: {
        sessionId: 'ses_child',
        parentSessionId: 'ses_parent',
        sessionScope: 'sub-session',
        lineage: 'hivefiver',
        workflowId: 'wf_child',
        branchFocus: 'delegated verification',
      },
    })

    assert.equal(response.data?.pluginContext.sessionInheritance.promptMode, 'delegated')
    assert.equal(response.data?.pluginContext.sessionInheritance.todoAuthority, 'delegated')
    assert.match(response.data?.systemTransform ?? '', /<hivemind-delegation-packet>/)
  })
})
