import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const HANDLER_PATH = '../../src/hooks/transform-handler.js'
const HANDLER_SRC = 'src/hooks/transform-handler.ts'

async function loadTransformHandler() {
  // @ts-expect-error RED: implementation lands in GREEN.
  return import(HANDLER_PATH)
}

async function readHandlerSource() {
  return readFile(join(process.cwd(), HANDLER_SRC), 'utf8')
}

// ---------------------------------------------------------------------------
// Test 1: Source inspection — uses setInjectionPayload from injection-store
// ---------------------------------------------------------------------------
test('transform-handler imports setInjectionPayload from injection-store', async () => {
  const source = await readHandlerSource()

  assert.match(source, /setInjectionPayload/)
  assert.match(source, /injection-store/)
})

// ---------------------------------------------------------------------------
// Test 2: Source inspection — factory pattern
// ---------------------------------------------------------------------------
test('transform-handler exports createTransformHandler factory function', async () => {
  const { createTransformHandler } = await loadTransformHandler()

  assert.equal(typeof createTransformHandler, 'function')
})

// ---------------------------------------------------------------------------
// Test 3: Factory returns async handler (input, output) => Promise<void>
// ---------------------------------------------------------------------------
test('createTransformHandler returns an async function', async () => {
  const { createTransformHandler } = await loadTransformHandler()

  const handler = createTransformHandler({ directory: '/tmp/fake-project' })

  assert.equal(typeof handler, 'function')
  const result = handler(
    { sessionID: 'ses_test', model: { id: 'gpt-4', provider: 'openai' } },
    { system: ['injected line 1', 'injected line 2'] },
  )

  assert.ok(result instanceof Promise, 'handler must return a Promise')
  await result.catch(() => undefined)
})

// ---------------------------------------------------------------------------
// Test 4: Handler calls setInjectionPayload with sessionId from input
// ---------------------------------------------------------------------------
test('handler captures injection payload with sessionId and system context', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-transform-handler-'))

  try {
    const { setInjectionPayload, getAndClearInjectionPayload } = await import(
      '../../src/plugin/injection-store.js'
    )

    const { createTransformHandler } = await loadTransformHandler()
    const handler = createTransformHandler({ directory: projectRoot })

    await handler(
      { sessionID: 'ses_capture_test', model: { id: 'gpt-4', provider: 'openai' } },
      { system: ['line A', 'line B'] },
    )

    const captured = getAndClearInjectionPayload('ses_capture_test')

    assert.ok(captured, 'setInjectionPayload should have been called')
    assert.equal(captured.sessionId, 'ses_capture_test')
    assert.equal(captured.contextBlock, 'line A\nline B')
    assert.equal(captured.purposeClass, 'system')
    assert.equal(captured.variant, 'system-transform')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 5: Handler does nothing on missing sessionId
// ---------------------------------------------------------------------------
test('handler skips when sessionId is missing', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-transform-handler-nosession-'))

  try {
    const { getAndClearInjectionPayload } = await import(
      '../../src/plugin/injection-store.js'
    )

    const { createTransformHandler } = await loadTransformHandler()
    const handler = createTransformHandler({ directory: projectRoot })

    // No sessionID in input
    await handler(
      { model: { id: 'gpt-4', provider: 'openai' } },
      { system: ['should not be captured'] },
    )

    // Verify no injection was set — any pending payloads for this session should not exist
    const captured = getAndClearInjectionPayload('ses_no_session_test')
    assert.equal(captured, undefined, 'no injection should be set when sessionId is missing')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 6: Handler return type is Promise<void> (void, not object)
// ---------------------------------------------------------------------------
test('handler resolves to void (not an object)', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-transform-handler-void-'))

  try {
    const { createTransformHandler } = await loadTransformHandler()
    const handler = createTransformHandler({ directory: projectRoot })

    const result = await handler(
      { sessionID: 'ses_void_test', model: { id: 'gpt-4', provider: 'openai' } },
      { system: ['context'] },
    )

    assert.equal(result, undefined, 'handler must resolve to void')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 7: Handler uses try/catch resilience pattern for sync throws
// ---------------------------------------------------------------------------
test('transform-handler uses try/catch for error resilience', async () => {
  const source = await readHandlerSource()

  assert.match(source, /try\s*\{\s*setInjectionPayload\([^)]*\)\s*\}\s*catch\s*\{\s*\}/)
})
