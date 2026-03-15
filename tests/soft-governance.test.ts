import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { initSdkContext, resetSdkContext } from '../src/hooks/sdk-context.js'
import { emitGovernanceToast, resetToastCooldowns } from '../src/hooks/soft-governance.js'

describe('soft governance toast bridge', () => {
  it('emits toasts through client.tui.showToast when available', async () => {
    const seen: Array<{ message: string; variant: string }> = []
    resetSdkContext()
    resetToastCooldowns()
    initSdkContext({
      client: {
        tui: {
          showToast: async ({ body }: { body: { message: string; variant: string } }) => {
            seen.push(body)
          },
        },
      } as never,
      $: {} as never,
      serverUrl: new URL('http://localhost'),
      project: {} as never,
    })

    const emitted = await emitGovernanceToast({
      id: 'runtime-cutover',
      message: 'Runtime cutover toast',
      variant: 'info',
    })

    assert.equal(emitted, true)
    assert.deepEqual(seen, [{ message: 'Runtime cutover toast', variant: 'info' }])

    resetSdkContext()
  })

  it('throttles repeated toast ids until cooldown reset', async () => {
    const seen: string[] = []
    resetSdkContext()
    resetToastCooldowns()
    initSdkContext({
      client: {
        tui: {
          showToast: async ({ body }: { body: { message: string } }) => {
            seen.push(body.message)
          },
        },
      } as never,
      $: {} as never,
      serverUrl: new URL('http://localhost'),
      project: {} as never,
    })

    const first = await emitGovernanceToast({
      id: 'same-warning',
      message: 'Same warning',
      variant: 'warning',
      cooldownMs: 60_000,
    })
    const second = await emitGovernanceToast({
      id: 'same-warning',
      message: 'Same warning',
      variant: 'warning',
      cooldownMs: 60_000,
    })

    assert.equal(first, true)
    assert.equal(second, false)
    assert.deepEqual(seen, ['Same warning'])

    resetToastCooldowns()
    const third = await emitGovernanceToast({
      id: 'same-warning',
      message: 'Same warning',
      variant: 'warning',
      cooldownMs: 60_000,
    })

    assert.equal(third, true)
    assert.deepEqual(seen, ['Same warning', 'Same warning'])

    resetSdkContext()
  })
})
