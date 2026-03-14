import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { compilePromptPacket } from '../src/context/prompt-packet'
import { createDelegationPacket } from '../src/delegation'

describe('prompt packet compiler', () => {
  it('compiles full lineage packet for main sessions', () => {
    const packet = compilePromptPacket(
      {
        sessionId: 'ses_main',
        sessionClass: 'workflow-execution',
        lineage: 'hivefiver',
        trajectoryId: 'trj-main',
        workflowId: 'wf-runtime',
        taskIds: ['task-main'],
        checkpointId: 'chk-main',
        todoChainId: 'todo-main',
        branchFocus: 'refactor compiler',
        verificationContract: 'vc-main',
        guardrails: ['tdd'],
      },
      'main',
    )

    assert.equal(packet.sessionScope, 'main')
    assert.match(packet.systemPacket, /<hivemind-kernel-packet>/)
    assert.match(packet.messagePacket, /<hivemind-lineage-refresh>/)
    assert.match(packet.systemPacket, /trajectory=trj-main/)
    assert.match(packet.systemPacket, /task_ids=task-main/)
    assert.match(packet.systemPacket, /verification_contract=vc-main/)
  })

  it('compiles bounded delegation packet for sub-sessions', () => {
    const packet = compilePromptPacket(
      {
        sessionId: 'ses_sub',
        parentSessionId: 'ses_parent',
        lineage: 'hivefiver',
        trajectoryId: 'trj-sub',
        workflowId: 'wf-runtime',
        taskIds: ['task-sub'],
        checkpointId: 'chk-sub',
        branchFocus: 'investigate docs',
        returnContract: 'return evidence and exact next steps',
      },
      'sub-session',
    )

    assert.equal(packet.sessionScope, 'sub-session')
    assert.match(packet.systemPacket, /<hivemind-delegation-packet>/)
    assert.match(packet.messagePacket, /<hivemind-delegation-refresh>/)
    assert.doesNotMatch(packet.systemPacket, /<hivemind-kernel-packet>/)
    assert.match(packet.systemPacket, /trajectory=trj-sub/)
    assert.match(packet.systemPacket, /checkpoint_id=chk-sub/)
    assert.match(packet.systemPacket, /return_contract=return evidence and exact next steps/)
  })
})

describe('delegation packet contract', () => {
  it('creates structured delegation packet for sub-session handoff', () => {
    const packet = createDelegationPacket({
      sourceSessionId: 'ses_parent',
      targetSessionId: 'ses_sub',
      targetAgent: 'hivexplorer',
      workflowId: 'wf-runtime',
      scope: 'read audit docs and return evidence',
      constraints: ['no direct todo mutation'],
      successMetrics: ['evidence packet returned'],
    })

    assert.equal(packet.sourceSessionId, 'ses_parent')
    assert.equal(packet.targetAgent, 'hivexplorer')
    assert.equal(packet.constraints.length, 1)
  })
})
