import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { detectEntryKernelState } from '../src/shared/entry-kernel-state.js'
import { createRuntimeInvocation } from '../src/shared/runtime-invocation.js'
import { createTurnOutputEnvelope } from '../src/shared/turn-output.js'

describe('lifecycle spine', () => {
  it('marks entry kernel state as its own lifecycle authority', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'hm-entry-spine-'))

    try {
      const entryState = await detectEntryKernelState(dir)

      assert.equal(entryState.lifecycle.layer, 'entry-kernel')
      assert.equal(entryState.lifecycle.phase, 'session-entry')
      assert.equal(entryState.lifecycle.state, 'uninitialized')
      assert.equal(entryState.state, 'uninitialized')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('creates runtime invocations as request lifecycle records rather than entry records', () => {
    const invocation = createRuntimeInvocation({
      sessionId: 'ses_runtime_spine',
      sessionScope: 'main',
      activeAgent: 'hivefiver',
      lineage: 'hivefiver',
      workflowId: 'wf_runtime_spine',
      gateState: 'qa-pending',
      entryState: 'qa-pending',
      qaState: 'pending',
      releaseState: 'blocked',
      requestReason: 'continue the workflow',
    })

    assert.equal(invocation.lifecycle.layer, 'runtime-invocation')
    assert.equal(invocation.lifecycle.phase, 'request')
    assert.equal(invocation.lifecycle.entryState, 'qa-pending')
    assert.equal(invocation.lifecycle.qaState, 'pending')
    assert.equal(invocation.lifecycle.releaseState, 'blocked')
    assert.equal(invocation.invokerClass, 'main-agent')
  })

  it('creates turn outputs as completed lifecycle records linked to runtime invocations', () => {
    const invocation = createRuntimeInvocation({
      sessionId: 'ses_turn_spine',
      parentSessionId: 'ses_parent',
      sessionScope: 'sub-session',
      activeAgent: 'hiveq',
      lineage: 'hivefiver',
      workflowId: 'wf_turn_spine',
      taskIds: ['task_a'],
      subtaskIds: ['subtask_a'],
      gateState: 'qa-pending',
      entryState: 'qa-pending',
      qaState: 'pending',
      releaseState: 'blocked',
      requestReason: 'verify delegated work',
    })

    const turnOutput = createTurnOutputEnvelope({
      runtimeInvocation: invocation,
      status: 'qa-pending',
      qaState: 'pending',
      rationale: ['delegated verification complete'],
    })

    assert.equal(turnOutput.lifecycle.layer, 'turn-output')
    assert.equal(turnOutput.lifecycle.phase, 'completed')
    assert.equal(turnOutput.lifecycle.entryState, 'qa-pending')
    assert.equal(turnOutput.lifecycle.invocationPhase, 'request')
    assert.equal(turnOutput.lifecycle.releaseState, 'blocked')
    assert.equal(turnOutput.sessionScope, 'sub-session')
    assert.equal(turnOutput.parentSessionId, 'ses_parent')
  })
})
