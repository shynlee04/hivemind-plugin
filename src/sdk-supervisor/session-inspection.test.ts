import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  createPreparedPurificationCommand,
  upsertSessionInspectionExport,
} from './session-inspection.js'

test('SessionInspection - createPreparedPurificationCommand - keeps ses_id and markdown path stable', () => {
  const command = createPreparedPurificationCommand({
    sessionId: 'ses_full_123',
    markdownPath: '/tmp/export.md',
    preparedAt: '2026-03-23T00:00:00.000Z',
  })

  assert.deepEqual(command, {
    version: 'v1',
    kind: 'session-inspection-purification',
    status: 'prepared',
    ses_id: 'ses_full_123',
    markdown_path: '/tmp/export.md',
    tool_hints: ['grep', 'read'],
    instruction: 'Read the saved markdown_path from disk and use ses_id as the purification target.',
    prepared_at: '2026-03-23T00:00:00.000Z',
  })
})

test('SessionInspection - upsertSessionInspectionExport - replaces session-scoped export artifacts', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-session-inspection-'))

  try {
    const firstExport = await upsertSessionInspectionExport(projectRoot, {
      sessionId: 'ses_full_123',
      assistantText: 'first pass',
    })
    const secondExport = await upsertSessionInspectionExport(projectRoot, {
      sessionId: 'ses_full_123',
      assistantText: 'second pass',
    })

    assert.equal(firstExport.directoryPath, secondExport.directoryPath)
    assert.equal(firstExport.markdownPath, secondExport.markdownPath)
    assert.equal(firstExport.commandPath, secondExport.commandPath)

    const markdown = await readFile(secondExport.markdownPath, 'utf8')
    const command = JSON.parse(await readFile(secondExport.commandPath, 'utf8')) as {
      ses_id: string
      markdown_path: string
    }

    assert.match(secondExport.directoryPath, /\.hivemind\/session-inspection\/ses_full_123$/)
    assert.match(markdown, /ses_id: `ses_full_123`/)
    assert.match(markdown, /second pass/)
    assert.doesNotMatch(markdown, /first pass/)
    assert.equal(command.ses_id, 'ses_full_123')
    assert.equal(command.markdown_path, secondExport.markdownPath)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
