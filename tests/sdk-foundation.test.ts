import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import {
  createEventHandler,
  getClient,
  getProject,
  getServerUrl,
  getShell,
  initSdkContext,
  isSdkAvailable,
  log,
  resetSdkContext,
  withClient,
} from '../src/index.js'

describe('sdk foundation', () => {
  it('caches and resets sdk context safely', async () => {
    resetSdkContext()
    assert.equal(isSdkAvailable(), false)
    assert.equal(getClient(), null)

    const mockClient = { id: 'client' } as never
    const mockShell = { id: 'shell' } as never
    const mockServerUrl = new URL('http://localhost:3000')
    const mockProject = { id: 'project' } as never

    initSdkContext({
      client: mockClient,
      $: mockShell,
      serverUrl: mockServerUrl,
      project: mockProject,
    })

    assert.equal(isSdkAvailable(), true)
    assert.equal(getClient(), mockClient)
    assert.equal(getShell(), mockShell)
    assert.equal(getServerUrl(), mockServerUrl)
    assert.equal(getProject(), mockProject)
    assert.equal(await withClient(async () => 'ok', 'fallback'), 'ok')

    resetSdkContext()
    assert.equal(isSdkAvailable(), false)
    assert.equal(await withClient(async () => 'ok', 'fallback'), 'fallback')
  })

  it('emits structured logs through client.app.log when attached', async () => {
    const seen: Array<{ level: string; message: string }> = []
    resetSdkContext()
    initSdkContext({
      client: {
        app: {
          log: async ({ body }: { body: { level: string; message: string } }) => {
            seen.push(body)
          },
        },
      } as never,
      $: {} as never,
      serverUrl: new URL('http://localhost'),
      project: {} as never,
    })

    log.info('structured info')
    log.warn('structured warn')

    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(seen.some((entry) => entry.level === 'info' && entry.message.includes('structured info')), true)
    assert.equal(seen.some((entry) => entry.level === 'warn' && entry.message.includes('structured warn')), true)

    resetSdkContext()
  })

  it('projects runtime events without requiring hook-side writes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-plugin-events-'))

    try {
      const handler = createEventHandler(dir)

      await handler({
        event: {
          type: 'session.created',
          properties: {
            info: {} as never,
          },
        },
      })

      await handler({
        event: {
          type: 'session.compacted',
          properties: {
            sessionID: 'ses_sdk_foundation',
          },
        },
      })

      assert.equal(typeof handler, 'function')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
