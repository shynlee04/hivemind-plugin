import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { getSessionMetadataPath } from '../paths.js'

type SessionMetadataInput = {
  sessionId: string
  lineage: 'hivefiver' | 'hiveminder'
  purposeClass:
    | 'discovery'
    | 'brainstorming'
    | 'research'
    | 'planning'
    | 'implementation'
    | 'gatekeeping'
    | 'tdd'
    | 'course-correction'
  agent: string
  timestamp: string
  status?: 'active' | 'completed' | 'abandoned'
  parentSessionId?: string | null
}

async function loadSessionWriter() {
  return import('../writers/session-writer.js')
}

test('session writer initializes session.json when metadata file is missing', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_metadata_init'
  const metadataPath = getSessionMetadataPath(projectRoot, sessionId)

  const input: SessionMetadataInput = {
    sessionId,
    lineage: 'hiveminder',
    purposeClass: 'tdd',
    agent: 'hitea',
    timestamp: '2026-03-24T18:00:00.000Z',
    parentSessionId: null,
  }

  try {
    await mkdir(dirname(metadataPath), { recursive: true })

    const { initOrUpdateSessionMetadata } = await loadSessionWriter()

    await initOrUpdateSessionMetadata(projectRoot, input)

    const parsed = JSON.parse(await readFile(metadataPath, 'utf8')) as Record<string, unknown>
    assert.equal(parsed.sessionId, sessionId)
    assert.equal(parsed.created, input.timestamp)
    assert.equal(parsed.updated, input.timestamp)
    assert.equal(parsed.agent, 'hitea')
    assert.equal(parsed.status, 'active')
    assert.deepEqual(parsed.childSessionIds, [])
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('session writer updates mutable metadata fields without rewriting immutable baseline identity', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_metadata_update'
  const metadataPath = getSessionMetadataPath(projectRoot, sessionId)

  try {
    await mkdir(dirname(metadataPath), { recursive: true })

    const { initOrUpdateSessionMetadata } = await loadSessionWriter()

    await initOrUpdateSessionMetadata(projectRoot, {
      sessionId,
      lineage: 'hiveminder',
      purposeClass: 'planning',
      agent: 'hitea',
      timestamp: '2026-03-24T18:05:00.000Z',
      parentSessionId: null,
    } satisfies SessionMetadataInput)

    await initOrUpdateSessionMetadata(projectRoot, {
      sessionId,
      lineage: 'hiveminder',
      purposeClass: 'planning',
      agent: 'hitea',
      timestamp: '2026-03-24T18:10:00.000Z',
      status: 'completed',
      parentSessionId: null,
    } satisfies SessionMetadataInput)

    const parsed = JSON.parse(await readFile(metadataPath, 'utf8')) as Record<string, unknown>
    assert.equal(parsed.sessionId, sessionId)
    assert.equal(parsed.created, '2026-03-24T18:05:00.000Z')
    assert.equal(parsed.updated, '2026-03-24T18:10:00.000Z')
    assert.equal(parsed.status, 'completed')
    assert.equal(parsed.lineage, 'hiveminder')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('session writer init behavior is idempotent for repeated baseline writes', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_metadata_idempotent'
  const metadataPath = getSessionMetadataPath(projectRoot, sessionId)

  try {
    await mkdir(dirname(metadataPath), { recursive: true })

    const { initOrUpdateSessionMetadata } = await loadSessionWriter()

    const initPayload: SessionMetadataInput = {
      sessionId,
      lineage: 'hivefiver',
      purposeClass: 'implementation',
      agent: 'hitea',
      timestamp: '2026-03-24T18:20:00.000Z',
      parentSessionId: null,
    }

    await initOrUpdateSessionMetadata(projectRoot, initPayload)
    const once = await readFile(metadataPath, 'utf8')

    await initOrUpdateSessionMetadata(projectRoot, initPayload)
    const twice = await readFile(metadataPath, 'utf8')

    assert.equal(twice, once)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
