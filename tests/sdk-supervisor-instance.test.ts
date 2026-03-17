import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildRuntimeStatusSnapshot,
  createSupervisorStatusReport,
  createSupervisorInstanceRegistry,
  registerSupervisorInstance,
  summarizeSupervisorHealth,
} from '../src/sdk-supervisor/index.js'

describe('sdk supervisor instance registry', () => {
  it('registers same-local-env instances through the supervisor skeleton', () => {
    const registry = registerSupervisorInstance(
      createSupervisorInstanceRegistry(),
      {
        instanceId: 'sup_local',
        status: 'healthy',
        runtimeAuthority: 'managed-sdk',
        runtimeInstanceId: 'managed-sdk:sup_local:http://127.0.0.1:4096',
        serverBaseUrl: 'http://127.0.0.1:4096',
        startedAt: '2026-03-17T00:00:00.000Z',
        lastHeartbeatAt: '2026-03-17T00:00:05.000Z',
      },
    )

    assert.equal(registry.instances.length, 1)
    assert.equal(registry.instances[0]?.transport, 'same-local-env')
    assert.equal(registry.instances[0]?.runtimeAuthority, 'managed-sdk')
    assert.equal(registry.instances[0]?.runtimeInstanceId, 'managed-sdk:sup_local:http://127.0.0.1:4096')
    assert.equal(registry.instances[0]?.serverBaseUrl, 'http://127.0.0.1:4096')
  })

  it('summarizes registry health for status/reporting seams', () => {
    const registry = registerSupervisorInstance(
      registerSupervisorInstance(createSupervisorInstanceRegistry(), {
        instanceId: 'sup_healthy',
        status: 'healthy',
        runtimeAuthority: 'managed-sdk',
        runtimeInstanceId: 'managed-sdk:sup_healthy:http://127.0.0.1:4096',
        serverBaseUrl: 'http://127.0.0.1:4096',
        startedAt: '2026-03-17T00:00:00.000Z',
        lastHeartbeatAt: '2026-03-17T00:00:05.000Z',
      }),
      {
        instanceId: 'sup_degraded',
        status: 'degraded',
        runtimeAuthority: 'attached-sdk',
        runtimeInstanceId: 'attached-sdk:sup_degraded',
        serverBaseUrl: 'http://127.0.0.1:4097',
        startedAt: '2026-03-17T00:00:01.000Z',
        lastHeartbeatAt: '2026-03-17T00:00:06.000Z',
      },
    )

    const summary = summarizeSupervisorHealth(registry)

    assert.equal(summary.overallStatus, 'degraded')
    assert.equal(summary.healthyInstances, 1)
    assert.equal(summary.degradedInstances, 1)
    assert.equal(summary.blockedInstances, 0)
  })

  it('builds a runtime-status supervisor report with validated registry output', () => {
    const report = createSupervisorStatusReport({
      instanceId: 'sup_runtime_status',
      status: 'degraded',
      runtimeAuthority: 'managed-sdk',
      runtimeInstanceId: 'managed-sdk:sup_runtime_status:http://127.0.0.1:4096',
      serverBaseUrl: 'http://127.0.0.1:4096',
      startedAt: '2026-03-17T00:00:00.000Z',
      lastHeartbeatAt: '2026-03-17T00:00:05.000Z',
    })

    assert.equal(report.registry.version, 'v1')
    assert.equal(report.registry.instances[0]?.transport, 'same-local-env')
    assert.equal(report.registry.instances[0]?.runtimeAuthority, 'managed-sdk')
    assert.equal(report.registry.instances[0]?.runtimeInstanceId, 'managed-sdk:sup_runtime_status:http://127.0.0.1:4096')
    assert.equal(report.registry.instances[0]?.serverBaseUrl, 'http://127.0.0.1:4096')
    assert.equal(report.health.overallStatus, 'degraded')
  })

  it('builds the runtime-status kernel snapshot through schema-kernel records', async () => {
    const snapshot = await buildRuntimeStatusSnapshot({
      projectRoot: '/tmp/hm-runtime-status',
      sessionId: 'ses_runtime_status',
      agentId: 'hivefiver',
      recordedAt: '2026-03-17T00:00:00.000Z',
      snapshot: {
        attachmentMode: 'local-worktree',
        defaultLineage: 'hivefiver',
        defaultPurposeClass: 'planning',
        runtimeAuthority: 'managed-sdk',
        runtimeInstanceId: 'managed-sdk:ses_runtime_status:http://127.0.0.1:4096',
        serverBaseUrl: 'http://127.0.0.1:4096',
        preferredUserName: undefined,
        governanceMode: 'assisted',
        automationLevel: 'assisted',
        language: 'en',
        artifactLanguage: 'en',
        outputStyle: 'concise',
        expertLevel: 'advanced',
        branchFocus: 'runtime-entry-attachment',
        guardrails: ['workflow-first'],
        facilitators: ['hm-init'],
        mcpReadiness: ['context7'],
        hivebrainDigest: ['runtime-attachment-active'],
        entryState: 'uninitialized',
        qaState: 'blocked',
        releaseState: 'blocked',
        hasRuntimeAttachment: false,
        hasHivemind: false,
        hivemindHealthy: false,
        hasWorkflow: false,
        profileComplete: false,
        missingProfileFields: [
          'preferredUserName',
          'chatLanguage',
          'artifactLanguage',
          'expertiseLevel',
          'outputStyle',
          'governanceMode',
          'automationLevel',
        ],
        interactiveBootstrapRequired: true,
        bootstrapProfile: {
          chatLanguage: 'en',
          artifactLanguage: 'en',
          expertiseLevel: 'advanced',
          governanceMode: 'assisted',
          automationLevel: 'assisted',
          outputStyle: 'concise',
        },
        taskIds: [],
        subtaskIds: [],
      },
    })

    assert.equal(snapshot.kernel.entry.version, 'v1')
      assert.equal(snapshot.kernel.runtimeInvocation.requestReason, 'runtime-status-inspection')
      assert.equal(snapshot.kernel.sessionRegistry.sessions[0]?.status, 'waiting')
      assert.equal(snapshot.kernel.freshnessRegistry.artifacts[0]?.artifactRef, 'MASTER.active.md')
      assert.equal(snapshot.runtimeAuthority, 'managed-sdk')
      assert.equal(snapshot.runtimeInstanceId, 'managed-sdk:ses_runtime_status:http://127.0.0.1:4096')
      assert.equal(snapshot.serverBaseUrl, 'http://127.0.0.1:4096')
      assert.equal(snapshot.supervisor.registry.instances[0]?.instanceId, 'managed-sdk:ses_runtime_status:http://127.0.0.1:4096')
      assert.equal(snapshot.supervisor.registry.instances[0]?.runtimeAuthority, 'managed-sdk')
      assert.equal(snapshot.supervisor.registry.instances[0]?.runtimeInstanceId, 'managed-sdk:ses_runtime_status:http://127.0.0.1:4096')
      assert.equal(snapshot.supervisor.registry.instances[0]?.serverBaseUrl, 'http://127.0.0.1:4096')
      assert.equal(snapshot.supervisor.registry.instances[0]?.transport, 'same-local-env')
    })
})
