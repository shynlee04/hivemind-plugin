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
        preferredUserName: 'Apple',
        lineage: 'hivefiver',
        workflowId: 'wf_runtime',
        todoChainId: 'todo_runtime',
        branchFocus: 'start-work driven orchestration',
        language: 'vi',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'beginner',
        outputStyle: 'explanatory',
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
    assert.equal(response.data?.startWork.pressureContract.id, 'steady-state')
    assert.equal(response.data?.runtimeSurfaces.find((entry) => entry.id === 'hm-plan')?.hostEvent, 'slash-command.requested')
    assert.equal(response.data?.runtimeSurfaces.find((entry) => entry.id === 'hivemind_task')?.pressureContract.id, 'task-mutation')
    assert.equal(response.data?.commandPreview?.frontmatter.agent, 'hivefiver')
    assert.match(response.data?.commandPreview?.body ?? '', /## Output Contract/)
    assert.match(response.data?.systemTransform ?? '', /preferred_user_name=Apple/)
    assert.match(response.data?.messageTransform ?? '', /language=vi/)
    assert.match(response.data?.messageTransform ?? '', /artifact_language=en/)
    assert.match(response.data?.messageTransform ?? '', /expert_level=beginner/)
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
        preferredUserName: 'Apple',
        lineage: 'hivefiver',
        workflowId: 'wf_child',
        branchFocus: 'delegated verification',
        language: 'vi',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'advanced',
        outputStyle: 'concise',
      },
    })

    assert.equal(response.data?.pluginContext.sessionInheritance.promptMode, 'delegated')
    assert.equal(response.data?.pluginContext.sessionInheritance.todoAuthority, 'delegated')
    assert.match(response.data?.systemTransform ?? '', /<hivemind-delegation-packet>/)
    assert.match(response.data?.systemTransform ?? '', /preferred_user_name=Apple/)
    assert.match(response.data?.systemTransform ?? '', /language=vi/)
    assert.match(response.data?.messageTransform ?? '', /artifact_language=en/)
    assert.equal(response.data?.startWork.pressureSignals.includes('delegated-handoff'), true)
  })
})
