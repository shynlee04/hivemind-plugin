import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
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
        startedAt: '2026-03-17T00:00:00.000Z',
        lastHeartbeatAt: '2026-03-17T00:00:05.000Z',
      },
    )

    assert.equal(registry.instances.length, 1)
    assert.equal(registry.instances[0]?.transport, 'same-local-env')
  })

  it('summarizes registry health for status/reporting seams', () => {
    const registry = registerSupervisorInstance(
      registerSupervisorInstance(createSupervisorInstanceRegistry(), {
        instanceId: 'sup_healthy',
        status: 'healthy',
        startedAt: '2026-03-17T00:00:00.000Z',
        lastHeartbeatAt: '2026-03-17T00:00:05.000Z',
      }),
      {
        instanceId: 'sup_degraded',
        status: 'degraded',
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
})
