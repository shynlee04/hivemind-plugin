import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { getSessionInjectionPath } from '../paths.js'

type InjectionAppendInput = {
  sessionId: string
  timestamp: string
  source: string
  summary: string
  payload: string
}

async function loadSessionWriter() {
  return import('../writers/session-writer.js')
}

test('session writer appends injection.md entries with deterministic grep-friendly labels', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_injection_append'
  const injectionPath = getSessionInjectionPath(projectRoot, sessionId)

  try {
    await mkdir(dirname(injectionPath), { recursive: true })

    const { appendSessionInjectionEntry } = await loadSessionWriter()

    await appendSessionInjectionEntry(projectRoot, {
      sessionId,
      timestamp: '2026-03-24T19:00:00.000Z',
      source: 'messages.transform',
      summary: 'Injected additional governance hints into system prompt.',
      payload: '{"source":"messages.transform","size":187}',
    } satisfies InjectionAppendInput)

    await appendSessionInjectionEntry(projectRoot, {
      sessionId,
      timestamp: '2026-03-24T19:05:00.000Z',
      source: 'system.transform',
      summary: 'Injected turn-level context summary for downstream model call.',
      payload: '{"source":"system.transform","size":221}',
    } satisfies InjectionAppendInput)

    const content = await readFile(injectionPath, 'utf8')
    assert.match(content, /## Injection Entry/)
    assert.match(content, /- \*\*Timestamp\*\*: 2026-03-24T19:00:00.000Z/)
    assert.match(content, /- \*\*Timestamp\*\*: 2026-03-24T19:05:00.000Z/)
    assert.match(content, /- \*\*Source\*\*: messages.transform/)
    assert.match(content, /- \*\*Source\*\*: system.transform/)
    assert.match(content, /### Payload/) 
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('session writer injection append keeps prior content unchanged and appends one block per write', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-session-writer-red-'))
  const sessionId = 'ses_plan6_red_injection_append_only'
  const injectionPath = getSessionInjectionPath(projectRoot, sessionId)

  try {
    await mkdir(dirname(injectionPath), { recursive: true })

    const { appendSessionInjectionEntry } = await loadSessionWriter()

    await appendSessionInjectionEntry(projectRoot, {
      sessionId,
      timestamp: '2026-03-24T19:10:00.000Z',
      source: 'messages.transform',
      summary: 'First injection write.',
      payload: '{"n":1}',
    } satisfies InjectionAppendInput)

    const contentAfterFirstWrite = await readFile(injectionPath, 'utf8')

    await appendSessionInjectionEntry(projectRoot, {
      sessionId,
      timestamp: '2026-03-24T19:11:00.000Z',
      source: 'messages.transform',
      summary: 'Second injection write.',
      payload: '{"n":2}',
    } satisfies InjectionAppendInput)

    const contentAfterSecondWrite = await readFile(injectionPath, 'utf8')
    const blockCount = (contentAfterSecondWrite.match(/^## Injection Entry$/gm) ?? []).length

    assert.ok(contentAfterSecondWrite.startsWith(contentAfterFirstWrite))
    assert.equal(blockCount, 2)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
