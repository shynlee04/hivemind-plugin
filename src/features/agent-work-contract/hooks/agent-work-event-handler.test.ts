/**
 * Agent-Work Event Handler Tests
 *
 * Validates schema-first extraction for agent-work event packets.
 *
 * @module agent-work-contract/hooks/agent-work-event-handler.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'

import * as agentWorkEventHandler from './agent-work-event-handler.js'

test('AgentWorkEventHandler - extractAgentWorkEventPacket - extracts compaction packet', () => {
  const packet = agentWorkEventHandler.extractAgentWorkEventPacket({
    event: {
      type: 'session.compacted',
      properties: {
        sessionID: 'session-123',
      },
    },
  })

  assert.deepEqual(packet, {
    eventType: 'session.compacted',
    sessionId: 'session-123',
    summary: 'event:session.compacted',
    trigger: 'onCompaction80',
  })
})

test('AgentWorkEventHandler - extractAgentWorkEventPacket - extracts command packet', () => {
  const packet = agentWorkEventHandler.extractAgentWorkEventPacket({
    event: {
      type: 'command.executed',
      properties: {
        name: 'hm-plan',
        sessionID: 'session-456',
        arguments: '--fast',
        messageID: 'message-1',
      },
    },
  })

  assert.deepEqual(packet, {
    eventType: 'command.executed',
    sessionId: 'session-456',
    summary: 'event:command.executed',
  })
})

test('AgentWorkEventHandler - extractAgentWorkEventPacket - ignores unsupported events', () => {
  const packet = agentWorkEventHandler.extractAgentWorkEventPacket({
    event: {
      type: 'file.edited',
      properties: {
        file: 'src/index.ts',
      },
    },
  })

  assert.equal(packet, null)
})

test('AgentWorkEventHandler - extractAgentWorkEventPacket - ignores malformed unsupported input', () => {
  const packet = agentWorkEventHandler.extractAgentWorkEventPacket({
    event: {
      type: 'file.edited',
    },
  })

  assert.equal(packet, null)
})

test('AgentWorkEventHandler - extractAgentWorkEventPacket - rejects invalid session packet', () => {
  assert.throws(() => {
    agentWorkEventHandler.extractAgentWorkEventPacket({
      event: {
        type: 'session.compacted',
        properties: {},
      },
    })
  })
})

test('AgentWorkEventHandler - extractAgentWorkEventPacket - rejects invalid command packet', () => {
  assert.throws(() => {
    agentWorkEventHandler.extractAgentWorkEventPacket({
      event: {
        type: 'command.executed',
        properties: {
          name: 'hm-plan',
          sessionID: 'session-456',
          messageID: 'message-1',
        },
      },
    })
  })
})

test('AgentWorkEventHandler - module surface - stays helper-only', () => {
  assert.equal('createEventHandler' in agentWorkEventHandler, false)
  assert.equal('default' in agentWorkEventHandler, false)
})
