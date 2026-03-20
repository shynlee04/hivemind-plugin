/**
 * Chain Executor Tests
 *
 * Tests for the chain executor engine component.
 * Validates handler registration and action dispatch.
 *
 * @module agent-work-contract/engine/chain-executor.test
 */

import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { ChainExecutor, dispatchDelegationHandoffPacketAction } from './chain-executor.js'
import { ContractStore } from './contract-store.js'
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

test('dispatchDelegationHandoffPacketAction projects delegated refs without replacing canonical task state', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-chain-delegation-packet-'))

  try {
    const store = new ContractStore(directory)
    await store.create({
      contractId: 'contract-123',
      sessionId: 'ses_123',
      createdAt: '2026-03-21T10:00:00.000Z',
      updatedAt: '2026-03-21T10:00:00.000Z',
      userIntent: {
        raw: 'Delegate one implementation task',
        confidence: 0.95,
        purposeClass: 'project-driven',
        requiresPlan: true,
        requiresGovernance: true,
      },
      responseMode: 'broad-search-execute',
      workflow: {
        phase: 'implementation',
        tasks: [
          {
            id: 'task-1',
            title: 'Delegated task',
            status: 'active',
          },
          {
            id: 'task-2',
            title: 'Non-delegated task',
            status: 'pending',
          },
        ],
      },
      chainActions: {
        onTaskComplete: 'next-task',
        onWorkflowEnd: 'archive',
        onDelegation: 'handoff-packet',
        onCompaction80: 'launch-context-agent',
      },
    })

    const result = await dispatchDelegationHandoffPacketAction({
      projectRoot: directory,
      contractId: 'contract-123',
      handoff: {
        id: 'dlg_123',
        createdAt: '2026-03-21T10:01:00.000Z',
        updatedAt: '2026-03-21T10:02:00.000Z',
        status: 'validated',
        summary: 'Delegated the first task.',
        nextSteps: ['resume in child session'],
        packet: {
          delegationId: 'dlg_123',
          sourceSessionId: 'ses_123',
          targetSessionId: 'ses_child_456',
          sourceAgent: 'orchestrator',
          targetAgent: 'delegate-agent',
          workflowId: 'wf_123',
          taskIds: ['task-1'],
          subtaskIds: ['subtask-1'],
          scope: 'Implement task-1',
          constraints: [],
          memoryScope: [],
          successMetrics: [],
          requiredEvidence: [],
          returnContract: 'Return evidence',
          resumeTarget: 'command:hm-implement',
          pressureContractId: 'delegated-handoff',
        },
        evidence: [{ kind: 'trace', description: 'trace:dlg_123', createdAt: '2026-03-21T10:01:30.000Z' }],
      },
      handoffRef: '.hivemind/handoffs/dlg_123.json',
      continuity: {
        filePath: '.hivemind/project/runtime-continuity/continuity-workflow-wf_123.json',
        transaction: {
          version: 'v1',
          continuityId: 'continuity-workflow-wf_123',
          continuityKey: 'workflow:wf_123',
          commandId: 'hm-plan',
          phase: 'planning',
          currentSessionId: 'ses_123',
          turnOutputRefs: [],
          linkedContractId: 'contract-123',
          delegationId: 'dlg_123',
          handoffRef: '.hivemind/handoffs/dlg_123.json',
          targetSessionId: 'ses_child_456',
          resumeTarget: 'command:hm-implement',
          delegationStatus: 'validated',
          createdAt: '2026-03-21T10:00:00.000Z',
          updatedAt: '2026-03-21T10:02:00.000Z',
        },
      },
    })
    const contract = await store.get('contract-123') as (Awaited<ReturnType<typeof store.get>> & {
      delegationProjection?: {
        handoffs: Array<{
          delegationId: string
          taskRefs: string[]
          subtaskRefs: string[]
          status: string
        }>
      }
    })
    const delegatedHandoff = contract?.delegationProjection?.handoffs[0]

    assert.equal(result.executed, true)
    assert.ok(result.artifactRefs.includes('.hivemind/handoffs/dlg_123.json'))
    assert.ok(result.artifactRefs.includes('workflow-continuity:continuity-workflow-wf_123'))
    assert.deepEqual(contract?.workflow.tasks, [
      {
        id: 'task-1',
        title: 'Delegated task',
        status: 'active',
      },
      {
        id: 'task-2',
        title: 'Non-delegated task',
        status: 'pending',
      },
    ])
    assert.equal(contract?.delegationProjection?.handoffs.length, 1)
    assert.equal(delegatedHandoff?.delegationId, 'dlg_123')
    assert.deepEqual(delegatedHandoff?.taskRefs, ['task-1'])
    assert.deepEqual(delegatedHandoff?.subtaskRefs, ['subtask-1'])
    assert.equal(delegatedHandoff?.status, 'validated')
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
