/**
 * Chain Executor Tests
 *
 * Tests for the chain executor engine component.
 * Validates handler registration and action dispatch.
 *
 * @module agent-work-contract/engine/chain-executor.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { ChainExecutor } from './chain-executor.js'
import type { ChainActionEvent } from '../types.js'

test('ChainExecutor - registerHandler - registers handler for trigger', () => {
  const executor = new ChainExecutor()
  
  executor.registerHandler('onTaskComplete', async () => {
    // Handler registered
  })
  
  assert.equal(executor.hasHandler('onTaskComplete'), true)
})

test('ChainExecutor - registerHandler - allows multiple handlers per trigger', () => {
  const executor = new ChainExecutor()
  
  executor.registerHandler('onTaskComplete', async () => {
    // First handler
  })
  
  executor.registerHandler('onTaskComplete', async () => {
    // Second handler
  })
  
  assert.equal(executor.hasHandler('onTaskComplete'), true)
})

test('ChainExecutor - dispatch - calls registered handler for onTaskComplete', async () => {
  const executor = new ChainExecutor()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let receivedPayload: any = null
  
  executor.registerHandler('onTaskComplete', async (payload) => {
    receivedPayload = payload
  })
  
  const event: ChainActionEvent = {
    trigger: 'onTaskComplete',
    payload: { contractId: 'c1', taskId: 't1' }
  }
  
  await executor.dispatch(event)
  
  assert.ok(receivedPayload !== null)
  assert.equal(receivedPayload.contractId, 'c1')
  assert.equal(receivedPayload.taskId, 't1')
})

test('ChainExecutor - dispatch - calls registered handler for onWorkflowEnd', async () => {
  const executor = new ChainExecutor()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let receivedPayload: any = null
  
  executor.registerHandler('onWorkflowEnd', async (payload) => {
    receivedPayload = payload
  })
  
  const event: ChainActionEvent = {
    trigger: 'onWorkflowEnd',
    payload: { contractId: 'c1' }
  }
  
  await executor.dispatch(event)
  
  assert.ok(receivedPayload !== null)
  assert.equal(receivedPayload.contractId, 'c1')
})

test('ChainExecutor - dispatch - calls registered handler for onDelegation', async () => {
  const executor = new ChainExecutor()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let receivedPayload: any = null
  
  executor.registerHandler('onDelegation', async (payload) => {
    receivedPayload = payload
  })
  
  const event: ChainActionEvent = {
    trigger: 'onDelegation',
    payload: { contractId: 'c1', delegationId: 'd1' }
  }
  
  await executor.dispatch(event)
  
  assert.ok(receivedPayload !== null)
  assert.equal(receivedPayload.contractId, 'c1')
  assert.equal(receivedPayload.delegationId, 'd1')
})

test('ChainExecutor - dispatch - calls registered handler for onCompaction80', async () => {
  const executor = new ChainExecutor()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let receivedPayload: any = null
  
  executor.registerHandler('onCompaction80', async (payload) => {
    receivedPayload = payload
  })
  
  const event: ChainActionEvent = {
    trigger: 'onCompaction80',
    payload: { contractId: 'c1' }
  }
  
  await executor.dispatch(event)
  
  assert.ok(receivedPayload !== null)
  assert.equal(receivedPayload.contractId, 'c1')
})

test('ChainExecutor - dispatch - calls multiple handlers in registration order', async () => {
  const executor = new ChainExecutor()
  const calls: string[] = []
  
  executor.registerHandler('onTaskComplete', async () => {
    calls.push('first')
  })
  
  executor.registerHandler('onTaskComplete', async () => {
    calls.push('second')
  })
  
  const event: ChainActionEvent = {
    trigger: 'onTaskComplete',
    payload: { contractId: 'c1', taskId: 't1' }
  }
  
  await executor.dispatch(event)
  
  assert.deepEqual(calls, ['first', 'second'])
})

test('ChainExecutor - dispatch - handles errors gracefully', async () => {
  const executor = new ChainExecutor()
  const calls: string[] = []
  
  executor.registerHandler('onTaskComplete', async () => {
    throw new Error('Handler error')
  })
  
  executor.registerHandler('onTaskComplete', async () => {
    calls.push('second')
  })
  
  const event: ChainActionEvent = {
    trigger: 'onTaskComplete',
    payload: { contractId: 'c1', taskId: 't1' }
  }
  
  // Should not throw, but should log error and continue
  await executor.dispatch(event)
  
  // Second handler should still be called
  assert.deepEqual(calls, ['second'])
})

test('ChainExecutor - dispatch - no-ops for unregistered trigger', async () => {
  const executor = new ChainExecutor()
  
  const event: ChainActionEvent = {
    trigger: 'onTaskComplete',
    payload: { contractId: 'c1', taskId: 't1' }
  }
  
  // Should not throw when no handlers registered
  await executor.dispatch(event)
  
  assert.ok(true)
})

test('ChainExecutor - hasHandler - returns false for unregistered trigger', () => {
  const executor = new ChainExecutor()
  
  assert.equal(executor.hasHandler('onTaskComplete'), false)
})

test('ChainExecutor - clearHandlers - removes all handlers for a trigger', async () => {
  const executor = new ChainExecutor()
  const calls: string[] = []
  
  executor.registerHandler('onTaskComplete', async () => {
    calls.push('called')
  })
  
  executor.clearHandlers('onTaskComplete')
  
  const event: ChainActionEvent = {
    trigger: 'onTaskComplete',
    payload: { contractId: 'c1', taskId: 't1' }
  }
  
  await executor.dispatch(event)
  
  assert.deepEqual(calls, [])
})

test('ChainExecutor - dispatch - waits for async handlers', async () => {
  const executor = new ChainExecutor()
  const order: string[] = []
  
  executor.registerHandler('onTaskComplete', async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 50))
    order.push('first')
  })
  
  executor.registerHandler('onTaskComplete', async () => {
    order.push('second')
  })
  
  const event: ChainActionEvent = {
    trigger: 'onTaskComplete',
    payload: { contractId: 'c1', taskId: 't1' }
  }
  
  await executor.dispatch(event)
  
  // Both handlers should complete in order
  assert.deepEqual(order, ['first', 'second'])
})

test('ChainExecutor - dispatch - handles all four trigger types', async () => {
  const executor = new ChainExecutor()
  const results: string[] = []
  
  executor.registerHandler('onTaskComplete', async () => { results.push('task') })
  executor.registerHandler('onWorkflowEnd', async () => { results.push('workflow') })
  executor.registerHandler('onDelegation', async () => { results.push('delegation') })
  executor.registerHandler('onCompaction80', async () => { results.push('compaction') })
  
  await executor.dispatch({ trigger: 'onTaskComplete', payload: { contractId: 'c1', taskId: 't1' } })
  await executor.dispatch({ trigger: 'onWorkflowEnd', payload: { contractId: 'c1' } })
  await executor.dispatch({ trigger: 'onDelegation', payload: { contractId: 'c1', delegationId: 'd1' } })
  await executor.dispatch({ trigger: 'onCompaction80', payload: { contractId: 'c1' } })
  
  assert.deepEqual(results, ['task', 'workflow', 'delegation', 'compaction'])
})