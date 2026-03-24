import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

import { getSessionEventsPath } from '../../../../src/features/event-tracker/paths.js'

type EventWriterInput = {
  sessionId: string
  timestamp: string
  type: string
  actor?: string
  title?: string
  summary?: string
  details?: string
}

async function loadEventsWriter() {
  // @ts-expect-error RED: implementation lands in GREEN.
  return import('../../../../src/features/event-tracker/writers/events-writer.js')
}

test('events-writer uses getSessionEventsPath and appendExactUtf8Content for append delegation', async () => {
  const source = await readFile(
    join(process.cwd(), 'src/features/event-tracker/writers/events-writer.ts'),
    'utf8',
  )

  assert.match(source, /getSessionEventsPath/)
  assert.match(source, /appendExactUtf8Content/)
})

test('appendSessionEvent appends readable markdown blocks to events.md without minting timestamps', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-event-tracker-events-writer-'))
  const sessionId = 'ses_append_only'
  const eventsPath = getSessionEventsPath(projectRoot, sessionId)
  const firstEntry: EventWriterInput = {
    sessionId,
    timestamp: '2026-03-24T11:00:00.000Z',
    type: 'assistant_output',
    actor: 'hiveminder',
    title: 'Initial answer',
    summary: 'Returned a short implementation summary.',
    details: 'The assistant described the intended next step.',
  }
  const secondEntry: EventWriterInput = {
    sessionId,
    timestamp: '2026-03-24T11:05:00.000Z',
    type: 'tool_invocation',
    actor: 'hiveminder',
    title: 'Verification command',
    summary: 'Ran the focused RED test command.',
    details: 'The writer should append this as a second markdown block.',
  }

  try {
    await mkdir(dirname(eventsPath), { recursive: true })

    const { appendSessionEvent } = await loadEventsWriter()

    await appendSessionEvent(projectRoot, firstEntry)
    await appendSessionEvent(projectRoot, secondEntry)

    const content = await readFile(eventsPath, 'utf8')
    assert.match(content, /## assistant_output/)
    assert.match(content, /## tool_invocation/)
    assert.match(content, /- \*\*Timestamp\*\*: 2026-03-24T11:00:00.000Z/)
    assert.match(content, /- \*\*Timestamp\*\*: 2026-03-24T11:05:00.000Z/)
    assert.match(content, /- \*\*Actor\*\*: hiveminder/)
    assert.match(content, /Returned a short implementation summary\./)
    assert.match(content, /The writer should append this as a second markdown block\./)

    const firstTimestampIndex = content.indexOf(firstEntry.timestamp)
    const secondTimestampIndex = content.indexOf(secondEntry.timestamp)
    assert.notEqual(firstTimestampIndex, -1)
    assert.notEqual(secondTimestampIndex, -1)
    assert.ok(firstTimestampIndex < secondTimestampIndex)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('renderEventMarkdownBlock tolerates missing optional fields with N/A metadata and empty details', async () => {
  const entry: EventWriterInput = {
    sessionId: 'ses_missing_fields',
    timestamp: '2026-03-24T12:00:00.000Z',
    type: 'error',
  }

  const { renderEventMarkdownBlock } = await loadEventsWriter()
  const rendered = renderEventMarkdownBlock(entry)

  assert.match(rendered, /## error/)
  assert.match(rendered, /- \*\*Timestamp\*\*: 2026-03-24T12:00:00.000Z/)
  assert.match(rendered, /- \*\*Actor\*\*: N\/A/)
  assert.match(rendered, /- \*\*Title\*\*: N\/A/)
  assert.match(rendered, /- \*\*Summary\*\*: N\/A/)
  assert.match(rendered, /### Details\n\n(?:$|\n)/)
})
