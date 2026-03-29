/**
 * Markdown Writer Tests — TDD RED+GREEN Phase
 *
 * Tests for the markdown-writer module that generates human-readable
 * events.md files for sessions (ADR-017 format).
 *
 * @module event-tracker/markdown-writer.test
 */

import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import type { SessionV3 } from './types.js'

type SessionWithMarkdownMeta = SessionV3 & {
  actors?: string[]
  toolsUsed?: string[]
}

// ---------------------------------------------------------------------------
// Dynamic import — forces RED gate (module may not exist yet)
// ---------------------------------------------------------------------------

async function loadMarkdownWriter() {
  return import('./markdown-writer.js')
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(overrides: Partial<SessionV3> = {}): SessionV3 {
  return {
    _schema: 'session/v3',
    sessionId: 'ses_abc123',
    semanticSessionId: 'ses_2026-03-26T185316_implementation_hiveminder',
    parentSessionId: null,
    lineage: 'hiveminder',
    purposeClass: 'implementation',
    agent: 'hiveminder',
    startedAt: '2026-03-26T11:53:16.525Z',
    endedAt: null,
    turnCount: 0,
    status: 'active',
    summary: '',
    keyFindings: [],
    subsessionIds: [],
    resumable: true,
    counters: {
      userMessageCount: 0,
      assistantOutputCount: 0,
      toolCallCount: 0,
      delegationCount: 0,
      compactionCount: 0,
    },
    toc: [],
    ...overrides,
  }
}

function getMarkdownFilePath(sessionsDir: string, session: SessionV3): string {
  return join(sessionsDir, 'journey-events', `${session.semanticSessionId ?? session.sessionId}.md`)
}

// ---------------------------------------------------------------------------
// Test 1: initEventsMarkdown creates events.md with header fields
// ---------------------------------------------------------------------------

test('initEventsMarkdown creates events.md with session header fields', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown } = await loadMarkdownWriter()
    const session: SessionWithMarkdownMeta = {
      ...makeSession(),
      actors: ['hiveminder', 'hiveq'],
      toolsUsed: ['read', 'bash'],
    }
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)

    const content = await readFile(filePath, 'utf8')

    assert.equal(filePath, join(tmpDir, 'journey-events', `${session.semanticSessionId}.md`))

    assert.ok(content.includes('# Session: ses_2026-03-26T185316_implementation_hiveminder'),
      'should include semantic session ID in heading')
    assert.ok(content.includes('**Session ID:** ses_abc123'),
      'should include Session ID field')
    assert.ok(content.includes('**Parent:** null'),
      'should include Parent field')
    assert.ok(content.includes('**Lineage:** hiveminder'),
      'should include Lineage field')
    assert.ok(content.includes('**Purpose:** implementation'),
      'should include Purpose field')
    assert.ok(content.includes('**Agent:** hiveminder'),
      'should include Agent field')
    assert.ok(content.includes('**Actors:** hiveminder, hiveq'),
      'should include actors field')
    assert.ok(content.includes('**Tools Used:** read, bash'),
      'should include tools used field')
    assert.ok(content.includes('**Status:** active'),
      'should include Status field')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initEventsMarkdown creates TOC placeholder section', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Table of Contents'), 'should include TOC heading')
    assert.ok(content.includes('| # | Timestamp | Type | Summary |'),
      'should include TOC table header')
    assert.ok(content.includes('---'), 'should include separator')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('initEventsMarkdown stores parent session ID when present', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown } = await loadMarkdownWriter()
    const session = makeSession({ parentSessionId: 'ses_parent_001' })
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('**Parent:** ses_parent_001'),
      'should show actual parent ID instead of null')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 2: appendTurnToMarkdown appends user_message turn
// ---------------------------------------------------------------------------

test('appendTurnToMarkdown appends user_message turn with correct header', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 1,
      timestamp: '2026-03-26T11:53:16.525Z',
      type: 'user_message',
      content: 'ok it is going to be a very complex work',
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Turn 1 — User Message'),
      'should include turn header with label')
    assert.ok(content.includes('**Timestamp:** 2026-03-26T11:53:16.525Z'),
      'should include timestamp')
    assert.ok(content.includes('ok it is going to be a very complex work'),
      'should include content')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('appendTurnToMarkdown preserves existing content on append', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 1,
      timestamp: '2026-03-26T11:53:16.525Z',
      type: 'user_message',
      content: 'First message',
    })
    await appendTurnToMarkdown(filePath, {
      turnNumber: 2,
      timestamp: '2026-03-26T11:54:00.000Z',
      type: 'user_message',
      content: 'Second message',
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Turn 1 — User Message'), 'should have turn 1')
    assert.ok(content.includes('## Turn 2 — User Message'), 'should have turn 2')
    assert.ok(content.includes('First message'), 'should preserve first content')
    assert.ok(content.includes('Second message'), 'should have second content')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 3: appendTurnToMarkdown appends assistant_output turn
// ---------------------------------------------------------------------------

test('appendTurnToMarkdown appends assistant_output turn', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 2,
      timestamp: '2026-03-26T11:53:45.112Z',
      type: 'assistant_output',
      content: 'The import on line 33 only imports resolveDefaultAgent.',
      metadata: { model: 'claude-sonnet-4-20250514', duration: '1523ms' },
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Turn 2 — Assistant Output'),
      'should include assistant output header')
    assert.ok(content.includes('**Model:** claude-sonnet-4-20250514'),
      'should include model metadata')
    assert.ok(content.includes('**Duration:** 1523ms'),
      'should include duration metadata')
    assert.ok(content.includes('The import on line 33 only imports resolveDefaultAgent.'),
      'should include content')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 4: appendTurnToMarkdown appends tool_call turn (pruned)
// ---------------------------------------------------------------------------

test('appendTurnToMarkdown appends tool_call turn with tool name and result only', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 3,
      timestamp: '2026-03-26T11:54:02.334Z',
      type: 'tool_call',
      content: 'task_created:task_implementation_001',
      metadata: { tool: 'hivemind_task', action: 'create' },
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Turn 3 — Tool Invocation'),
      'should include tool invocation header')
    assert.ok(content.includes('**Tool:** hivemind_task'),
      'should include tool name')
    assert.ok(content.includes('**Action:** create'),
      'should include action')
    assert.ok(content.includes('task_created:task_implementation_001'),
      'should include result summary')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('appendTurnToMarkdown tool_call does not dump full JSON', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 1,
      timestamp: '2026-03-26T12:00:00.000Z',
      type: 'tool_call',
      content: 'created successfully',
      metadata: { tool: 'some_tool', action: 'run' },
    })

    const content = await readFile(filePath, 'utf8')

    // Should not contain JSON braces in the turn block
    const toolTurnStart = content.indexOf('## Turn 1 — Tool Invocation')
    const nextSeparator = content.indexOf('---', toolTurnStart + 1)
    const toolBlock = content.slice(toolTurnStart, nextSeparator)

    assert.ok(!toolBlock.includes('{'), 'should not contain JSON object braces')
    assert.ok(!toolBlock.includes('"'), 'should not contain JSON quotes')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 5: generateTOC creates table of contents from turn headers
// ---------------------------------------------------------------------------

test('generateTOC builds TOC from turn headers in events.md', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown, generateTOC } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 1,
      timestamp: '2026-03-26T11:53:16Z',
      type: 'user_message',
      content: 'User asks about session errors and wants to debug them',
    })
    await appendTurnToMarkdown(filePath, {
      turnNumber: 2,
      timestamp: '2026-03-26T11:53:45Z',
      type: 'assistant_output',
      content: 'Resolved import issue by adding missing export',
    })
    await appendTurnToMarkdown(filePath, {
      turnNumber: 3,
      timestamp: '2026-03-26T12:01:22Z',
      type: 'delegation',
      content: 'Delegated to code-skeptic for review of auth module',
    })

    await generateTOC(filePath, makeSession({
      toc: [
        { turnNumber: 1, timestamp: '2026-03-26T11:53:16Z', type: 'user_message', summary: 'User asks about session errors...' },
        { turnNumber: 2, timestamp: '2026-03-26T11:53:45Z', type: 'assistant_output', summary: 'Resolved import issue...' },
        { turnNumber: 3, timestamp: '2026-03-26T12:01:22Z', type: 'delegation', summary: 'Delegated to code-skeptic...' },
      ],
    }))

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('| 1 | 2026-03-26T11:53:16Z | User Message | User asks about session errors... |'),
      'should include TOC row for turn 1')
    assert.ok(content.includes('| 2 | 2026-03-26T11:53:45Z | Assistant Output | Resolved import issue... |'),
      'should include TOC row for turn 2')
    assert.ok(content.includes('| 3 | 2026-03-26T12:01:22Z | Delegation | Delegated to code-skeptic... |'),
      'should include TOC row for turn 3')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('generateTOC replaces previous TOC entries', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown, generateTOC } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 1,
      timestamp: '2026-03-26T11:53:16Z',
      type: 'user_message',
      content: 'First message',
    })

    // First TOC generation
    await generateTOC(filePath, makeSession({
      toc: [
        { turnNumber: 1, timestamp: '2026-03-26T11:53:16Z', type: 'user_message', summary: 'First message' },
      ],
    }))

    // Add more turns
    await appendTurnToMarkdown(filePath, {
      turnNumber: 2,
      timestamp: '2026-03-26T11:54:00Z',
      type: 'assistant_output',
      content: 'Second response',
    })

    // Re-generate TOC
    await generateTOC(filePath, makeSession({
      toc: [
        { turnNumber: 1, timestamp: '2026-03-26T11:53:16Z', type: 'user_message', summary: 'First message' },
        { turnNumber: 2, timestamp: '2026-03-26T11:54:00Z', type: 'assistant_output', summary: 'Second response' },
      ],
    }))

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('| 1 |'), 'should have turn 1 in TOC')
    assert.ok(content.includes('| 2 |'), 'should have turn 2 in TOC')

    // Count TOC header occurrences — should only appear once (no duplication)
    const tocMatches = content.match(/## Table of Contents/g) ?? []
    assert.equal(tocMatches.length, 1, 'TOC heading should not be duplicated')

    // Turn content should still be present
    assert.ok(content.includes('## Turn 1 — User Message'), 'turn 1 content preserved')
    assert.ok(content.includes('## Turn 2 — Assistant Output'), 'turn 2 content preserved')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Test 6: appendDiagnosticToMarkdown adds diagnostic entry
// ---------------------------------------------------------------------------

test('appendDiagnosticToMarkdown adds diagnostic section with entry', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendDiagnosticToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendDiagnosticToMarkdown(filePath, {
      timestamp: '2026-03-26T11:53:16.525Z',
      level: 'info',
      message: 'turn_complete agent=hiveminder text_len=170',
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Diagnostics'), 'should include Diagnostics heading')
    assert.ok(content.includes('### 2026-03-26T11:53:16.525Z [info]'),
      'should include append-only diagnostic heading')
    assert.ok(content.includes('turn_complete agent=hiveminder text_len=170'),
      'should include diagnostic entry')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('appendDiagnosticToMarkdown appends multiple entries', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendDiagnosticToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendDiagnosticToMarkdown(filePath, {
      timestamp: '2026-03-26T11:53:16.525Z',
      level: 'info',
      message: 'turn_complete agent=hiveminder',
    })
    await appendDiagnosticToMarkdown(filePath, {
      timestamp: '2026-03-26T11:54:02.334Z',
      level: 'error',
      message: 'ENOENT: no such file or directory',
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('### 2026-03-26T11:53:16.525Z [info]'),
      'should include first diagnostic')
    assert.ok(content.includes('turn_complete agent=hiveminder'),
      'should preserve first diagnostic message')
    assert.ok(content.includes('### 2026-03-26T11:54:02.334Z [error]'),
      'should include second diagnostic')
    assert.ok(content.includes('ENOENT: no such file or directory'),
      'should preserve second diagnostic message')

    // Diagnostics heading should appear only once
    const diagMatches = content.match(/## Diagnostics/g) ?? []
    assert.equal(diagMatches.length, 1, 'Diagnostics heading should not be duplicated')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Delegation turn type
// ---------------------------------------------------------------------------

test('appendTurnToMarkdown appends delegation turn', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 4,
      timestamp: '2026-03-26T12:01:22Z',
      type: 'delegation',
      content: 'Delegated to code-skeptic for review',
      metadata: { delegatedTo: 'code-skeptic', packetId: 'pkt-001' },
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Turn 4 — Delegation'),
      'should include delegation turn header')
    assert.ok(content.includes('Delegated to code-skeptic for review'),
      'should include content')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// Compaction and error turn types
// ---------------------------------------------------------------------------

test('appendTurnToMarkdown appends compaction turn', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 5,
      timestamp: '2026-03-26T13:00:00Z',
      type: 'compaction',
      content: 'Compacted 45 messages to 8 messages',
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Turn 5 — Compaction'),
      'should include compaction turn header')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('appendTurnToMarkdown appends error turn', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendTurnToMarkdown } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendTurnToMarkdown(filePath, {
      turnNumber: 6,
      timestamp: '2026-03-26T14:00:00Z',
      type: 'error',
      content: 'TypeError: Cannot read properties of undefined',
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Turn 6 — Error'),
      'should include error turn header')
    assert.ok(content.includes('TypeError: Cannot read properties of undefined'),
      'should include error message')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('appendToolBatch appends a tool batch table', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendToolBatch } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendToolBatch(filePath, {
      turnNumber: 7,
      toolName: 'hivemind_task',
      invocations: [
        { action: 'create', result: 'task_created:task_001' },
        { action: 'verify', result: 'verified ok' },
      ],
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Tool Batch: hivemind_task (Turn 7)'),
      'should include tool batch heading')
    assert.ok(content.includes('| Action | Result |'),
      'should include tool batch table header')
    assert.ok(content.includes('| create | task_created:task_001 |'),
      'should include first tool invocation row')
    assert.ok(content.includes('| verify | verified ok |'),
      'should include second tool invocation row')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('appendDelegation appends a delegations section', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'mw-test-'))
  try {
    const { initEventsMarkdown, appendDelegation } = await loadMarkdownWriter()
    const session = makeSession()
    const filePath = getMarkdownFilePath(tmpDir, session)

    await initEventsMarkdown(tmpDir, session)
    await appendDelegation(filePath, {
      parentSessionId: 'ses_parent_001',
      childSessionId: 'ses_child_001',
      actor: 'hiveminder',
      summary: 'Delegated markdown verification to hiveq',
    })

    const content = await readFile(filePath, 'utf8')

    assert.ok(content.includes('## Delegations'), 'should include delegations section heading')
    assert.ok(content.includes('### ses_parent_001 -> ses_child_001'),
      'should include delegation relationship heading')
    assert.ok(content.includes('**Actor:** hiveminder'),
      'should include delegation actor')
    assert.ok(content.includes('**Summary:** Delegated markdown verification to hiveq'),
      'should include delegation summary')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})
