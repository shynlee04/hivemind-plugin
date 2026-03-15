import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { createDelegationPacket } from '../src/delegation/index.js'

describe('delegation packet', () => {
  it('captures trajectory, workflow, task, sub-task, and return-contract bindings', () => {
    const packet = createDelegationPacket({
      sourceSessionId: 'ses_main',
      targetSessionId: 'ses_sub',
      sourceAgent: 'hiveminder',
      targetAgent: 'hivefiver',
      trajectoryId: 'trj_main',
      workflowId: 'wf_refactor',
      taskIds: ['task_refactor'],
      subtaskIds: ['subtask_verify'],
      scope: 'bounded refactor branch',
      memoryScope: ['debug', 'verification'],
      returnContract: 'Return evidence and exact next-step routing',
    })

    assert.equal(packet.trajectoryId, 'trj_main')
    assert.equal(packet.taskIds[0], 'task_refactor')
    assert.equal(packet.subtaskIds[0], 'subtask_verify')
    assert.equal(packet.sourceAgent, 'hiveminder')
    assert.equal(packet.memoryScope[0], 'debug')
    assert.match(packet.returnContract, /evidence/)
    assert.equal(packet.pressureContractId, 'delegated-handoff')
  })
})
