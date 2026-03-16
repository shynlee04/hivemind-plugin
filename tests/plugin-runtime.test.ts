import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createPluginRuntimePlan } from '../src/plugin/index.js'
import { buildRouteReminder } from '../src/plugin/runtime-plan.js'

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
    assert.equal(response.data?.entryKernel.version, 'v1')
    assert.equal(response.data?.entryKernel.fieldOwnership.session, 'start-work')
    assert.equal(response.data?.entryKernel.fieldOwnership.routing, 'start-work')
    assert.equal(response.data?.entryKernel.fieldOwnership.profile, 'runtime-attachment')
    assert.equal(response.data?.entryKernel.fieldOwnership.bindings, 'runtime-attachment')
    assert.equal(response.data?.entryKernel.session.sessionState, 'ongoing')
    assert.equal(response.data?.entryKernel.routing.recommendedCommandId, 'hm-plan')
    assert.equal(response.data?.entryKernel.profile.preferredUserName, 'Apple')
    assert.equal(response.data?.entryKernel.profile.language, 'vi')
    assert.equal(response.data?.entryKernel.bindings.workflowId, 'wf_runtime')
    assert.equal(response.data?.entryKernel.bindings.profileComplete, false)
    assert.equal(response.data?.entryKernel.defaults.branchFocus, 'start-work driven orchestration')
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
    assert.equal(response.data?.entryKernel.session.sessionScope, 'sub-session')
    assert.equal(response.data?.entryKernel.bindings.hasWorkflow, true)
    assert.equal(response.data?.entryKernel.bindings.workflowId, 'wf_child')
    assert.equal(response.data?.entryKernel.profile.outputStyle, 'concise')
    assert.equal(response.data?.entryKernel.defaults.branchFocus, 'delegated verification')
    assert.match(response.data?.systemTransform ?? '', /<hivemind-delegation-packet>/)
    assert.match(response.data?.systemTransform ?? '', /preferred_user_name=Apple/)
    assert.match(response.data?.systemTransform ?? '', /language=vi/)
    assert.match(response.data?.messageTransform ?? '', /artifact_language=en/)
    assert.equal(response.data?.startWork.pressureSignals.includes('delegated-handoff'), true)
  })

  it('derives route reminder authority from entryKernel routing fields', async () => {
    const response = await createPluginRuntimePlan({
      startWork: {
        userMessage: 'plan the workflow roadmap for the hook refactor',
        sessionId: 'ses_route_authority',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        hasHivemind: true,
        hivemindHealthy: true,
        hasWorkflow: true,
        hasHandoff: false,
      },
      promptState: {
        sessionId: 'ses_route_authority',
        sessionScope: 'main',
        preferredUserName: 'Apple',
        lineage: 'hivefiver',
        workflowId: 'wf_runtime',
        branchFocus: 'start-work driven orchestration',
        language: 'en',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'advanced',
        outputStyle: 'concise',
      },
    })

    assert.equal(response.status, 'success')
    assert.ok(response.data)

    const tamperedPlan = {
      ...response.data,
      startWork: {
        ...response.data.startWork,
        requiredCommandId: 'hm-init',
        recommendedCommandId: 'hm-init',
        traversalOutcome: 'bootstrap' as const,
        routeDisposition: 'refuse' as const,
        riskLevel: 'blocked' as const,
        nextTransition: 'command:hm-init',
      },
    }

    const reminder = buildRouteReminder(tamperedPlan)
    assert.equal(reminder?.includes('command=hm-plan'), true)
    assert.equal(reminder?.includes('outcome=route'), true)
    assert.equal(reminder?.includes('route_disposition=create'), true)
    assert.equal(reminder?.includes('risk=none'), true)
    assert.equal(reminder?.includes('next_transition=command:hm-plan'), true)
  })

  it('keeps mixed-intent prompts advisory through the plugin runtime plan', async () => {
    const response = await createPluginRuntimePlan({
      startWork: {
        userMessage: 'I was thinking we may need to refactor session handling, but first research what other frameworks do, and also there is a failing test, and should we add TDD for this?',
        sessionId: 'ses_runtime_mixed',
        sessionScope: 'main',
        activeLineage: 'hivefiver',
        hasHivemind: true,
        hivemindHealthy: true,
        hasWorkflow: true,
        hasHandoff: false,
      },
      promptState: {
        sessionId: 'ses_runtime_mixed',
        sessionScope: 'main',
        preferredUserName: 'Apple',
        lineage: 'hivefiver',
        workflowId: 'wf_runtime_mixed',
        branchFocus: 'mixed-intent safety',
        language: 'en',
        artifactLanguage: 'en',
        governanceMode: 'strict',
        automationLevel: 'guided',
        expertLevel: 'advanced',
        outputStyle: 'concise',
      },
    })

    assert.equal(response.status, 'success')
    assert.equal(response.data?.startWork.purposeClass, 'research')
    assert.equal(response.data?.startWork.recommendedCommandId, 'hm-research')
    assert.equal(response.data?.startWork.autoRoute, false)
    assert.equal(response.data?.entryKernel.routing.recommendedCommandId, 'hm-research')
    assert.equal(response.data?.entryKernel.routing.autoRoute, false)
    assert.equal(response.data?.autoSlash.commandBinding.bindingKind, 'workflow-command')
    assert.equal(response.data?.autoSlash.commandBinding.autoRoute, false)
    assert.equal(response.data?.commandPreview?.frontmatter.agent, 'hiverd')
  })
})
