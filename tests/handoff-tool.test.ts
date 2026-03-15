import assert from 'node:assert/strict'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { createHivemindHandoffTool } from '../src/tools/index.js'

const mockContext = {
  sessionID: 'ses-handoff',
  messageID: 'msg-handoff',
  agent: 'hivefiver',
  directory: '',
  worktree: '',
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as const

describe('hivemind_handoff tool', () => {
  let projectRoot = ''

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), 'hm-handoff-tool-'))
  })

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true })
  })

  it('creates, validates, updates, and closes delegation handoffs', async () => {
    const toolDef = createHivemindHandoffTool(projectRoot)

    const createResult = JSON.parse(String(await toolDef.execute({
      action: 'create',
      workflowId: 'wf-handoff',
      targetAgent: 'hiveq',
      scope: 'validate trajectory bindings',
      summary: 'handoff summary',
      requiredEvidence: JSON.stringify([
        { kind: 'test_report', description: 'vitest green', required: true },
      ]),
    }, mockContext))) as { status: string; data?: { record?: { id?: string }; pressureContract?: { id?: string } } }
    assert.equal(createResult.status, 'success')
    assert.equal(createResult.data?.pressureContract?.id, 'delegated-handoff')
    const handoffId = createResult.data?.record?.id
    assert.ok(handoffId)

    const validateBefore = JSON.parse(String(await toolDef.execute({
      action: 'validate',
      id: handoffId,
    }, mockContext))) as { data?: { valid?: boolean; missingEvidence?: string[]; pressureContract?: { id?: string } } }
    assert.equal(validateBefore.data?.valid, false)
    assert.deepEqual(validateBefore.data?.missingEvidence, ['test_report:vitest green'])
    assert.equal(validateBefore.data?.pressureContract?.id, 'handoff-validation')

    const updateResult = JSON.parse(String(await toolDef.execute({
      action: 'update',
      id: handoffId,
      evidence: JSON.stringify([
        { kind: 'test_report', description: 'vitest green', createdAt: new Date().toISOString() },
      ]),
    }, mockContext))) as { status: string }
    assert.equal(updateResult.status, 'success')

    const closeResult = JSON.parse(String(await toolDef.execute({
      action: 'close',
      id: handoffId,
      summary: 'handoff complete',
    }, mockContext))) as { data?: { valid?: boolean; record?: { status?: string }; pressureContract?: { id?: string } } }
    assert.equal(closeResult.data?.valid, true)
    assert.equal(closeResult.data?.record?.status, 'closed')
    assert.equal(closeResult.data?.pressureContract?.id, 'handoff-validation')

    const files = await readdir(join(projectRoot, '.hivemind', 'handoffs'))
    assert.equal(files.some((file) => file === `${handoffId}.json`), true)
  })
})
