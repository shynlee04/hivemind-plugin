import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { createHivemindTaskTool } from '../src/tools/index.js'

const mockContext = {
  sessionID: 'ses-task',
  messageID: 'msg-task',
  agent: 'hivefiver',
  directory: '',
  worktree: '',
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as const

describe('hivemind_task tool', () => {
  let projectRoot = ''

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'hm-task-tool-'))
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  it('creates, activates, verifies, and completes canonical tasks', async () => {
    const toolDef = createHivemindTaskTool(projectRoot)

    const createResult = JSON.parse(String(await toolDef.execute({
      action: 'create',
      workflowId: 'wf-task',
      taskId: 'task-alpha',
      title: 'Implement the real task limb',
    }, mockContext))) as { status: string }
    assert.equal(createResult.status, 'success')

    const activateResult = JSON.parse(String(await toolDef.execute({
      action: 'activate',
      workflowId: 'wf-task',
      taskId: 'task-alpha',
      title: 'Implement the real task limb',
    }, mockContext))) as { status: string }
    assert.equal(activateResult.status, 'success')

    const verifyResult = JSON.parse(String(await toolDef.execute({
      action: 'verify',
      workflowId: 'wf-task',
      taskId: 'task-alpha',
      verificationContractId: 'contract-alpha',
    }, mockContext))) as { status: string }
    assert.equal(verifyResult.status, 'success')

    const completeResult = JSON.parse(String(await toolDef.execute({
      action: 'complete',
      workflowId: 'wf-task',
      taskId: 'task-alpha',
      evidenceRefs: 'test:targeted',
    }, mockContext))) as { status: string }
    assert.equal(completeResult.status, 'success')

    const tasksRaw = await readFile(join(projectRoot, '.hivemind', 'state', 'tasks.json'), 'utf-8')
    const tasks = JSON.parse(tasksRaw) as { tasks: Array<{ id: string; status: string; evidenceRefs: string[] }> }
    assert.equal(tasks.tasks.length, 1)
    assert.equal(tasks.tasks[0]?.id, 'task-alpha')
    assert.equal(tasks.tasks[0]?.status, 'complete')
    assert.deepEqual(tasks.tasks[0]?.evidenceRefs, ['test:targeted'])
  })
})
