/**
 * Unit tests for hivemind-journal tool
 * Tests the CQRS write-side bridge for session journaling
 */

import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { type ToolContext } from '@opencode-ai/plugin'

import { createHivemindJournalTool } from './hivemind-journal.js'

// Test constants
const TEST_SESSION_ID = 'test-session-journal-123'
const TEST_TIMESTAMP = '2026-03-25T10:00:00.000Z'

/**
 * Creates a properly typed mock ToolContext
 */
function createMockContext(root: string): ToolContext {
  return {
    sessionID: TEST_SESSION_ID,
    messageID: 'msg-123',
    agent: 'test-agent',
    directory: root,
    worktree: root,
    abort: new AbortController().signal,
    metadata(_input: Record<string, unknown>) {
      // noop
    },
    async ask(input: Record<string, unknown>) {
      // Mock ask - noop
      console.log('ask called with:', JSON.stringify(input))
    },
  }
}

/**
 * RED phase: These tests define the expected behavior.
 * They fail until the implementation exists.
 */
test('hivemind-journal tool file exists at correct path', async () => {
  const { existsSync } = await import('node:fs')
  const toolPath = join(process.cwd(), 'src/tools/hivemind-journal.ts')
  assert.ok(existsSync(toolPath), 'Tool file should exist at src/tools/hivemind-journal.ts')
})

test('hivemind-journal exports createHivemindJournalTool function', async () => {
  assert.ok(
    typeof createHivemindJournalTool === 'function',
    'Should export createHivemindJournalTool function'
  )
})

test('hivemind-journal tool has correct args schema with all required fields', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    
    // Verify the tool has a description
    assert.ok(tool.description, 'Tool should have a description')
    assert.ok(tool.description.includes('journal'), 'Description should mention journal')
    
    // Verify args structure exists
    assert.ok(tool.args, 'Tool should have args')
    
    // Verify each required arg field exists with schema
    assert.ok(tool.args.sessionId, 'Should have sessionId arg')
    assert.ok(tool.args.eventType, 'Should have eventType arg')
    assert.ok(tool.args.payload, 'Should have payload arg')
    assert.ok(tool.args.timestamp, 'Should have timestamp arg')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool writes assistant_output event to events.md', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    
    await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'assistant_output',
      payload: {
        actor: 'test-agent',
        title: 'Test Output',
        summary: 'Test summary content',
        details: 'Test details content'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    // Verify events.md was created
    const eventsPath = join(projectRoot, '.hivemind', 'sessions', TEST_SESSION_ID, 'events.md')
    const content = await readFile(eventsPath, 'utf8')
    
    assert.ok(content.includes('## assistant_output'), 'Should contain assistant_output header')
    assert.ok(content.includes(TEST_TIMESTAMP), 'Should contain timestamp')
    assert.ok(content.includes('Test Output'), 'Should contain title')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool writes user_message event to events.md', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    
    await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'user_message',
      payload: {
        actor: 'user',
        title: 'User Message',
        summary: 'User message summary'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    const eventsPath = join(projectRoot, '.hivemind', 'sessions', TEST_SESSION_ID, 'events.md')
    const content = await readFile(eventsPath, 'utf8')
    
    assert.ok(content.includes('## user_message'), 'Should contain user_message header')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool writes tool_call event to events.md', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    
    await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'tool_call',
      payload: {
        actor: 'agent',
        title: 'Tool Invocation',
        summary: 'Called some tool'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    const eventsPath = join(projectRoot, '.hivemind', 'sessions', TEST_SESSION_ID, 'events.md')
    const content = await readFile(eventsPath, 'utf8')
    
    assert.ok(content.includes('## tool_call'), 'Should contain tool_call header')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool writes compaction event to events.md', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    
    await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'compaction',
      payload: {
        actor: 'system',
        title: 'Session Compaction',
        summary: 'Compacted session'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    const eventsPath = join(projectRoot, '.hivemind', 'sessions', TEST_SESSION_ID, 'events.md')
    const content = await readFile(eventsPath, 'utf8')
    
    assert.ok(content.includes('## compaction'), 'Should contain compaction header')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool writes trajectory event to events.md', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    
    await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'trajectory',
      payload: {
        actor: 'system',
        title: 'Trajectory Update',
        summary: 'Trajectory was updated'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    const eventsPath = join(projectRoot, '.hivemind', 'sessions', TEST_SESSION_ID, 'events.md')
    const content = await readFile(eventsPath, 'utf8')
    
    assert.ok(content.includes('## trajectory'), 'Should contain trajectory header')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool writes diagnostic event to diagnostics.log', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    
    await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'diagnostic',
      payload: {
        level: 'info',
        source: 'test-source',
        message: 'Test diagnostic message',
        details: 'Test details'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    const diagnosticsPath = join(projectRoot, '.hivemind', 'sessions', TEST_SESSION_ID, 'diagnostics.log')
    const content = await readFile(diagnosticsPath, 'utf8')
    
    assert.ok(content.includes('session=test-session-journal-123'), 'Should contain session ID')
    assert.ok(content.includes('level=info'), 'Should contain level')
    assert.ok(content.includes('message=Test diagnostic message'), 'Should contain message')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool returns success: true and path on successful write', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    const ctx = createMockContext(projectRoot)
    
    const result = await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'assistant_output',
      payload: {
        actor: 'test-agent',
        title: 'Test Output',
        summary: 'Test summary'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    const parsed = JSON.parse(result)
    assert.ok(parsed.success === true, 'Result should have success: true')
    assert.ok(parsed.path, 'Result should have a path field')
    assert.ok(parsed.path.includes('events.md'), 'Path should reference events.md')
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('journal tool uses context.directory for path resolution', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-journal-test-'))
  
  try {
    const tool = createHivemindJournalTool(projectRoot)
    
    // Call with a different directory than projectRoot to verify context is used
    const differentDir = await mkdtemp(join(tmpdir(), 'hm-journal-different-'))
    
    const ctx = createMockContext(differentDir)
    
    const result = await tool.execute({
      sessionId: TEST_SESSION_ID,
      eventType: 'assistant_output',
      payload: {
        actor: 'test-agent',
        title: 'Test Output',
        summary: 'Test summary'
      },
      timestamp: TEST_TIMESTAMP
    }, ctx)
    
    const parsed = JSON.parse(result)
    // The path should be under the context.directory, not projectRoot
    assert.ok(parsed.path.includes(differentDir), 'Path should use context.directory')
    
    await rm(differentDir, { recursive: true, force: true })
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
