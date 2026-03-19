import assert from 'node:assert/strict'
import test from 'node:test'

import { renderRouteHint } from '../src/plugin/route-hint.js'

test('renderRouteHint only emits the minimal route reminder fields', () => {
  const hint = renderRouteHint({ routeCommand: 'hm-plan', risk: 'gated' })

  assert.equal(
    hint,
    [
      '<hivemind-route-hint>',
      'route_command=hm-plan',
      'risk=gated',
      '</hivemind-route-hint>',
    ].join('\n'),
  )
  assert.equal(hint.includes('execution_rule='), false)
  assert.equal(hint.includes('<hivemind-route-bridge>'), false)
})

test('renderRouteHint returns undefined when there is no routed command', () => {
  assert.equal(renderRouteHint({ routeCommand: undefined, risk: 'none' }), undefined)
})
