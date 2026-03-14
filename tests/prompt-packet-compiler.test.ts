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
        workflowId: 'wf-runtime',
        todoChainId: 'todo-main',
        branchFocus: 'refactor compiler',
        guardrails: ['tdd'],
      },
      'main',
    )

    assert.equal(packet.sessionScope, 'main')
    assert.match(packet.systemPacket, /<hivemind-kernel-packet>/)
    assert.match(packet.messagePacket, /<hivemind-lineage-refresh>/)
  })

  it('compiles bounded delegation packet for sub-sessions', () => {
    const packet = compilePromptPacket(
      {
        sessionId: 'ses_sub',
        parentSessionId: 'ses_parent',
        lineage: 'hivefiver',
        workflowId: 'wf-runtime',
        branchFocus: 'investigate docs',
      },
      'sub-session',
    )

    assert.equal(packet.sessionScope, 'sub-session')
    assert.match(packet.systemPacket, /<hivemind-delegation-packet>/)
    assert.match(packet.messagePacket, /<hivemind-delegation-refresh>/)
    assert.doesNotMatch(packet.systemPacket, /<hivemind-kernel-packet>/)
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
