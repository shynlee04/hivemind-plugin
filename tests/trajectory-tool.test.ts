import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { createHivemindTrajectoryTool } from '../src/tools/index.js'

const mockContext = {
  sessionID: 'ses-trajectory',
  messageID: 'msg-trajectory',
  agent: 'hivefiver',
  directory: '',
  worktree: '',
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as const

describe('hivemind_trajectory tool', () => {
  let projectRoot = ''

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'hm-trajectory-tool-'))
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  it('attaches, traverses, checkpoints, records events, and closes a trajectory', async () => {
    const toolDef = createHivemindTrajectoryTool(projectRoot)

    const attachResult = JSON.parse(String(await toolDef.execute({
      action: 'attach',
      trajectoryId: 'trj-alpha',
      workflowId: 'wf-alpha',
      purposeClass: 'implementation',
      taskIds: 'task-alpha',
    }, mockContext))) as { status: string; data?: { pressureContract?: { id?: string } } }
    assert.equal(attachResult.status, 'success')
    assert.equal(attachResult.data?.pressureContract?.id, 'trajectory-continuation')

    const traverseResult = JSON.parse(String(await toolDef.execute({
      action: 'traverse',
      trajectoryId: 'trj-alpha',
    }, mockContext))) as { status: string; data?: { tasks?: unknown[] } }
    assert.equal(traverseResult.status, 'success')
    assert.equal(traverseResult.data?.tasks?.length, 1)

    const checkpointResult = JSON.parse(String(await toolDef.execute({
      action: 'checkpoint',
      trajectoryId: 'trj-alpha',
      workflowId: 'wf-alpha',
      taskIds: 'task-alpha',
      source: 'test',
      resumeTarget: 'command:hm-harness',
    }, mockContext))) as { status: string }
    assert.equal(checkpointResult.status, 'success')

    const eventResult = JSON.parse(String(await toolDef.execute({
      action: 'event',
      trajectoryId: 'trj-alpha',
      summary: 'trajectory-event',
      kind: 'transition',
      evidenceRefs: 'test:trajectory',
    }, mockContext))) as { status: string }
    assert.equal(eventResult.status, 'success')

    const closeResult = JSON.parse(String(await toolDef.execute({
      action: 'close',
      trajectoryId: 'trj-alpha',
      summary: 'close trajectory after validation',
    }, mockContext))) as { status: string; data?: { pressureContract?: { id?: string } } }
    assert.equal(closeResult.status, 'success')
    assert.equal(closeResult.data?.pressureContract?.id, 'trajectory-control')

    const ledgerRaw = await readFile(join(projectRoot, '.hivemind', 'state', 'trajectory-ledger.json'), 'utf-8')
    const ledger = JSON.parse(ledgerRaw) as {
      lastClosedTrajectoryId: string
      trajectories: Array<{ id: string; status: string }>
      checkpoints: Array<{ trajectoryId: string }>
    }
    assert.equal(ledger.lastClosedTrajectoryId, 'trj-alpha')
    assert.equal(ledger.trajectories[0]?.status, 'closed')
    assert.equal(ledger.checkpoints[0]?.trajectoryId, 'trj-alpha')
  })
})
