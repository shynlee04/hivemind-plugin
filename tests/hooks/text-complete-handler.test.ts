import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  getSessionEventsPath,
  getSessionMetadataPath,
  getSessionDiagnosticsPath,
} from '../../src/features/event-tracker/paths.js'
import { PURPOSE_CLASS_VALUES } from '../../src/features/event-tracker/types.js'

const HANDLER_PATH = '../../src/hooks/text-complete-handler.js'
const HANDLER_SRC = 'src/hooks/text-complete-handler.ts'

async function loadTextCompleteHandler() {
  // @ts-expect-error RED: implementation lands in GREEN.
  return import(HANDLER_PATH)
}

async function readHandlerSource() {
  return readFile(join(process.cwd(), HANDLER_SRC), 'utf8')
}

// ---------------------------------------------------------------------------
// Test 1: Source inspection — uses event-tracker writers
// ---------------------------------------------------------------------------
test('text-complete-handler imports appendSessionEvent from events-writer', async () => {
  const source = await readHandlerSource()

  assert.match(source, /appendSessionEvent/)
  assert.match(source, /event-tracker\/writers\/events-writer/)
})

test('text-complete-handler imports initOrUpdateSessionMetadata from session-writer', async () => {
  const source = await readHandlerSource()

  assert.match(source, /initOrUpdateSessionMetadata/)
  assert.match(source, /event-tracker\/writers\/session-writer/)
})

// ---------------------------------------------------------------------------
// Test 2: Source inspection — uses classifier / writer-adapter
// ---------------------------------------------------------------------------
test('text-complete-handler does NOT import from parser or core (thin handler constraint)', async () => {
  const source = await readHandlerSource()

  assert.doesNotMatch(source, /from\s+['"]\.\.\/\.\.\/core\//)
  assert.doesNotMatch(source, /from\s+['"]\.\.\/\.\.\/features\/event-tracker\/parser\//)
})

// ---------------------------------------------------------------------------
// Test 3: Source inspection — uses injection-store
// ---------------------------------------------------------------------------
test('text-complete-handler imports getAndClearInjectionPayload from injection-store', async () => {
  const source = await readHandlerSource()

  assert.match(source, /getAndClearInjectionPayload/)
  assert.match(source, /injection-store/)
})

// ---------------------------------------------------------------------------
// Test 4: Source inspection — factory pattern
// ---------------------------------------------------------------------------
test('text-complete-handler exports createTextCompleteHandler factory function', async () => {
  const { createTextCompleteHandler } = await loadTextCompleteHandler()

  assert.equal(typeof createTextCompleteHandler, 'function')
})

// ---------------------------------------------------------------------------
// Test 5: Factory returns async handler (input, output) => Promise<void>
// ---------------------------------------------------------------------------
test('createTextCompleteHandler returns an async function', async () => {
  const { createTextCompleteHandler } = await loadTextCompleteHandler()

  const handler = createTextCompleteHandler({ directory: '/tmp/fake-project' })

  assert.equal(typeof handler, 'function')
  const result = handler(
    { sessionID: 'ses_test', messageID: 'msg_1', partID: 'part_1' },
    { text: 'assistant response' },
  )

  assert.ok(result instanceof Promise, 'handler must return a Promise')
  await result.catch(() => undefined)
})

// ---------------------------------------------------------------------------
// Test 6: Handler does nothing on missing sessionId
// ---------------------------------------------------------------------------
test('handler skips when sessionId is missing', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-text-complete-nosession-'))

  try {
    const { createTextCompleteHandler } = await loadTextCompleteHandler()
    const handler = createTextCompleteHandler({ directory: projectRoot })

    // No sessionID in input
    await handler(
      { messageID: 'msg_1', partID: 'part_1' },
      { text: 'should not be written' },
    )

    // Verify no files were created
    const eventsPath = getSessionEventsPath(projectRoot, 'no-session')
    try {
      await readFile(eventsPath, 'utf8')
      assert.fail('events.md should not exist when sessionId is missing')
    } catch {
      // expected — file should not exist
    }
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 7: Handler does nothing on empty text
// ---------------------------------------------------------------------------
test('handler skips when output text is empty', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-text-complete-empty-'))

  try {
    const { createTextCompleteHandler } = await loadTextCompleteHandler()
    const handler = createTextCompleteHandler({ directory: projectRoot })

    await handler(
      { sessionID: 'ses_empty_text', messageID: 'msg_1', partID: 'part_1' },
      { text: '' },
    )

    // Verify no events file was created
    const eventsPath = getSessionEventsPath(projectRoot, 'ses_empty_text')
    try {
      await readFile(eventsPath, 'utf8')
      assert.fail('events.md should not exist when text is empty')
    } catch {
      // expected
    }
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 8: Handler writes assistant_output event to events.md
// ---------------------------------------------------------------------------
test('handler writes assistant_output event entry to events.md', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-text-complete-event-'))

  try {
    const { createTextCompleteHandler } = await loadTextCompleteHandler()
    const handler = createTextCompleteHandler({ directory: projectRoot })

    await handler(
      { sessionID: 'ses_event_test', messageID: 'msg_1', partID: 'part_1' },
      { text: 'This is the assistant response content.' },
    )

    const eventsPath = getSessionEventsPath(projectRoot, 'ses_event_test')
    const content = await readFile(eventsPath, 'utf8')

    assert.match(content, /## assistant_output/)
    assert.match(content, /- \*\*Title\*\*: Assistant response/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 9: Handler updates session.json with metadata
// ---------------------------------------------------------------------------
test('handler writes session.json with session metadata', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-text-complete-meta-'))

  try {
    const { createTextCompleteHandler } = await loadTextCompleteHandler()
    const handler = createTextCompleteHandler({ directory: projectRoot })

    await handler(
      { sessionID: 'ses_meta_test', messageID: 'msg_1', partID: 'part_1' },
      { text: 'Response for metadata test.' },
    )

    const metaPath = getSessionMetadataPath(projectRoot, 'ses_meta_test')
    const raw = await readFile(metaPath, 'utf8')
    const meta = JSON.parse(raw)

    assert.equal(meta.sessionId, 'ses_meta_test')
    assert.equal(meta.lineage, 'hiveminder')
    assert.ok(meta.purposeClass, 'purposeClass should be set')
    assert.equal(meta.status, 'active')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 10: Handler writes diagnostic log line
// ---------------------------------------------------------------------------
test('handler writes diagnostic log with turn_complete line', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-text-complete-diag-'))

  try {
    const { createTextCompleteHandler } = await loadTextCompleteHandler()
    const handler = createTextCompleteHandler({ directory: projectRoot })

    await handler(
      { sessionID: 'ses_diag_test', messageID: 'msg_1', partID: 'part_1' },
      { text: 'Diagnostic log test response.' },
    )

    const diagPath = getSessionDiagnosticsPath(projectRoot, 'ses_diag_test')
    const content = await readFile(diagPath, 'utf8')

    assert.match(content, /turn_complete/)
    assert.match(content, /text_len=/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 11: isPurposeClass type guard — narrows string to PurposeClass
// ---------------------------------------------------------------------------
test('source uses isPurposeClass type guard instead of as any cast', async () => {
  const source = await readHandlerSource()

  assert.match(source, /isPurposeClass/, 'must define isPurposeClass type guard')
  assert.doesNotMatch(source, /as\s+any/, 'must NOT use as any cast')
})

test('isPurposeClass type guard accepts all valid PurposeClass values', async () => {
  const source = await readHandlerSource()

  // The guard should reference PURPOSE_CLASS_VALUES sentinel array
  assert.match(source, /PURPOSE_CLASS_VALUES/, 'must use PURPOSE_CLASS_VALUES sentinel')
})

// ---------------------------------------------------------------------------
// Test 12: Handler uses .catch(() => undefined) resilience pattern
// ---------------------------------------------------------------------------
test('text-complete-handler uses .catch(() => undefined) for error resilience', async () => {
  const source = await readHandlerSource()

  assert.match(source, /\.catch\(\(\)\s*=>\s*undefined\)/)
})

// ---------------------------------------------------------------------------
// Test 13: Handler does not import from diagnostic-log (thin handler)
// ---------------------------------------------------------------------------
test('text-complete-handler does NOT import from sdk-supervisor/diagnostic-log', async () => {
  const source = await readHandlerSource()

  assert.doesNotMatch(source, /sdk-supervisor\/diagnostic-log/)
})
