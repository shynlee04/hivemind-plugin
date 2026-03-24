import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { getSessionEventsPath } from '../../src/features/event-tracker/paths.js'

const HANDLER_PATH = '../../src/hooks/compaction-handler.js'
const HANDLER_SRC = 'src/hooks/compaction-handler.ts'

async function loadCompactionHandler() {
  // @ts-expect-error RED: implementation lands in GREEN.
  return import(HANDLER_PATH)
}

async function readHandlerSource() {
  return readFile(join(process.cwd(), HANDLER_SRC), 'utf8')
}

// ---------------------------------------------------------------------------
// Test 1: Source inspection — uses event-tracker writers
// ---------------------------------------------------------------------------
test('compaction-handler imports appendSessionEvent from events-writer', async () => {
  const source = await readHandlerSource()

  assert.match(source, /appendSessionEvent/)
  assert.match(source, /event-tracker\/writers\/events-writer/)
})

// ---------------------------------------------------------------------------
// Test 2: Source inspection — factory pattern
// ---------------------------------------------------------------------------
test('compaction-handler exports createCompactionJournalHandler factory function', async () => {
  const { createCompactionJournalHandler } = await loadCompactionHandler()

  assert.equal(typeof createCompactionJournalHandler, 'function')
})

// ---------------------------------------------------------------------------
// Test 3: Factory returns async handler (input, output) => Promise<void>
// ---------------------------------------------------------------------------
test('createCompactionJournalHandler returns an async function', async () => {
  const { createCompactionJournalHandler } = await loadCompactionHandler()

  const handler = createCompactionJournalHandler({ directory: '/tmp/fake-project' })

  assert.equal(typeof handler, 'function')
  const result = handler(
    { sessionID: 'ses_test' },
    { context: ['segment1', 'segment2'] },
  )

  assert.ok(result instanceof Promise, 'handler must return a Promise')
  await result.catch(() => undefined)
})

// ---------------------------------------------------------------------------
// Test 4: Handler writes compaction event to events.md
// ---------------------------------------------------------------------------
test('handler writes compaction event entry to events.md', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-compaction-handler-'))

  try {
    const { createCompactionJournalHandler } = await loadCompactionHandler()
    const handler = createCompactionJournalHandler({ directory: projectRoot })

    await handler(
      { sessionID: 'ses_compaction_test' },
      { context: ['segment1', 'segment2', 'segment3'], prompt: 'compacted context' },
    )

    const eventsPath = getSessionEventsPath(projectRoot, 'ses_compaction_test')
    const content = await readFile(eventsPath, 'utf8')

    assert.match(content, /## compaction/)
    assert.match(content, /Session compaction/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 5: Handler does nothing on missing sessionId
// ---------------------------------------------------------------------------
test('handler skips when sessionId is missing', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-compaction-nosession-'))

  try {
    const { createCompactionJournalHandler } = await loadCompactionHandler()
    const handler = createCompactionJournalHandler({ directory: projectRoot })

    // Empty sessionID
    await handler(
      { sessionID: '' },
      { context: ['should not be written'] },
    )

    // Verify no events file was created
    const eventsPath = getSessionEventsPath(projectRoot, 'no-session')
    try {
      await readFile(eventsPath, 'utf8')
      assert.fail('events.md should not exist when sessionId is missing')
    } catch {
      // expected
    }
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 6: Handler returns void (Promise<void>)
// ---------------------------------------------------------------------------
test('handler resolves to void (not an object)', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-compaction-void-'))

  try {
    const { createCompactionJournalHandler } = await loadCompactionHandler()
    const handler = createCompactionJournalHandler({ directory: projectRoot })

    const result = await handler(
      { sessionID: 'ses_void_test' },
      { context: ['context segment'] },
    )

    assert.equal(result, undefined, 'handler must resolve to void')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 7: Handler uses .catch(() => undefined) resilience pattern
// ---------------------------------------------------------------------------
test('compaction-handler uses .catch(() => undefined) for error resilience', async () => {
  const source = await readHandlerSource()

  assert.match(source, /\.catch\(\(\)\s*=>\s*undefined\)/)
})

// ---------------------------------------------------------------------------
// Test 8: Handler is thin — no parser/core/compaction-adapter imports
// ---------------------------------------------------------------------------
test('compaction-handler does NOT import from parser, core, or compaction-adapter', async () => {
  const source = await readHandlerSource()

  assert.doesNotMatch(source, /from\s+['"]\.\.\/\.\.\/core\//)
  assert.doesNotMatch(source, /from\s+['"]\.\.\/\.\.\/features\/event-tracker\/parser\//)
  assert.doesNotMatch(source, /compaction-adapter/)
})
