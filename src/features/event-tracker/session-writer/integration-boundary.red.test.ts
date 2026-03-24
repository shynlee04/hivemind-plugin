import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import { mapEventEntryToSessionEventInput } from '../classifier/writer-adapter.js'
import { getSessionDelegationPath } from '../paths.js'
import type { EventEntry } from '../types.js'

async function loadSessionWriter() {
  return import('../writers/session-writer.js')
}

test('session writer source reuses canonical path builders from paths.ts without duplicating helper creation', async () => {
  const testDir = dirname(fileURLToPath(import.meta.url))
  const source = await readFile(
    join(testDir, '..', 'writers', 'session-writer.ts'),
    'utf8',
  )

  assert.match(source, /getSessionMetadataPath/)
  assert.match(source, /getSessionDelegationPath/)
  assert.match(source, /getSessionInjectionPath/)
  assert.doesNotMatch(source, /function\s+getSessionMetadataPath\s*\(/)
  assert.doesNotMatch(source, /function\s+getSessionDelegationPath\s*\(/)
  assert.doesNotMatch(source, /function\s+getSessionInjectionPath\s*\(/)
})

test('session writer consumes classifier adapter output and appends delegation artifacts without classifying', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_integration_boundary'
  const delegationPath = getSessionDelegationPath(projectRoot, sessionId)

  const event: EventEntry = {
    id: 'evt-plan6-red-boundary',
    sessionId,
    turnNumber: 12,
    type: 'delegation_returned',
    importance: 'high',
    timestamp: '2026-03-24T19:20:00.000Z',
    data: {
      delegatedTo: 'hiveq',
      statusDetail: 'partial',
      evidenceSnapshot: 'RED failures captured',
      blockedReason: 'session writer missing',
      completionMetadata: 'tests=4',
    },
  }

  try {
    await mkdir(dirname(delegationPath), { recursive: true })

    const adapted = mapEventEntryToSessionEventInput(event)
    const { appendSessionDelegationEntry } = await loadSessionWriter()

    await appendSessionDelegationEntry(projectRoot, {
      sessionId,
      timestamp: adapted.timestamp,
      packetId: event.id,
      delegatedTo: adapted.actor ?? 'N/A',
      status: event.type,
      summary: adapted.summary ?? 'N/A',
      details: adapted.details ?? '',
    })

    const content = await readFile(delegationPath, 'utf8')
    assert.match(content, /Delegation returned by hiveq/)
    assert.match(content, /Evidence: RED failures captured/)
    assert.doesNotMatch(content, /function createSummary/)
    assert.doesNotMatch(content, /function createDetails/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
