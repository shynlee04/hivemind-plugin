import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { initSdkContext, resetSdkContext } from '../src/hooks/sdk-context.js'
import { showGovernanceToast, resetToastCooldowns } from '../src/hooks/soft-governance.js'

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

    await showGovernanceToast('runtime-cutover', 'Runtime cutover toast')

    assert.equal(seen.length, 1)
    assert.deepEqual(seen[0], { message: 'Runtime cutover toast', variant: 'info' })

    resetSdkContext()
  })

  it('throttles repeated toast categories until cooldown reset', async () => {
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

    // First call should emit
    await showGovernanceToast('same-warning', 'Same warning')
    assert.equal(seen.length, 1)

    // Second call within cooldown should be throttled
    await showGovernanceToast('same-warning', 'Same warning')
    assert.equal(seen.length, 1, 'should throttle duplicate within cooldown')

    // After reset, should emit again
    resetToastCooldowns()
    await showGovernanceToast('same-warning', 'Same warning')
    assert.equal(seen.length, 2, 'should emit after cooldown reset')

    assert.deepEqual(seen, ['Same warning', 'Same warning'])

    resetSdkContext()
  })

  it('returns silently when no SDK client available', async () => {
    resetSdkContext()
    resetToastCooldowns()

    // Should not throw — fire-and-forget pattern
    await showGovernanceToast('no-client', 'Should not error')
  })
})
