import assert from 'node:assert/strict'
import test from 'node:test'

import { createEventId } from './event-id.js'

test('createEventId is deterministic for same inputs', () => {
  const first = createEventId({
    sessionId: 'ses_plan5_red',
    turnNumber: 3,
    type: 'delegation_returned',
    ordinal: 0,
  })
  const second = createEventId({
    sessionId: 'ses_plan5_red',
    turnNumber: 3,
    type: 'delegation_returned',
    ordinal: 0,
  })

  assert.equal(first, second)
})

test('createEventId changes when ordinal changes', () => {
  const first = createEventId({
    sessionId: 'ses_plan5_red',
    turnNumber: 3,
    type: 'delegation_created',
    ordinal: 0,
  })
  const second = createEventId({
    sessionId: 'ses_plan5_red',
    turnNumber: 3,
    type: 'delegation_created',
    ordinal: 1,
  })

  assert.notEqual(first, second)
})

test('createEventId includes recognizable event identity segments', () => {
  const id = createEventId({
    sessionId: 'ses_plan5_red',
    turnNumber: 11,
    type: 'tool_invocation',
    ordinal: 2,
  })

  assert.match(id, /ses_plan5_red/)
  assert.match(id, /11/)
  assert.match(id, /tool_invocation/)
  assert.match(id, /2/)
})
