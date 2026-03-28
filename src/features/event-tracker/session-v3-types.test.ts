// SessionV3 Type Tests (RED Phase)
//
// Verifies that the SessionV3 interface (ADR-017) exists in types.ts
// and has the correct field shape. This test MUST FAIL until SessionV3
// is added to src/features/event-tracker/types.ts.
//
// Colocated with types.ts so that tsc --noEmit (which covers src/**/*)
// catches the missing type at compile time.

import assert from 'node:assert/strict'
import test from 'node:test'

// RED gate: this import fails at compile time if SessionV3 does not exist.
import type { SessionV3 } from './types.js'

// ---------------------------------------------------------------------------
// Runtime shape fixture — type annotation forces tsc to validate SessionV3
// ---------------------------------------------------------------------------

/** Minimal valid SessionV3 for runtime field-existence checks. */
const fixture: SessionV3 = {
  _schema: 'session/v3',
  sessionId: 'sess-v3-001',
  semanticSessionId: 'sem-sess-001',
  parentSessionId: null,
  lineage: 'hiveminder',
  purposeClass: 'implementation',
  agent: 'general',
  startedAt: '2026-03-26T00:00:00.000Z',
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
}

// ---------------------------------------------------------------------------
// _schema literal
// ---------------------------------------------------------------------------

test('SessionV3 _schema is literal "session/v3"', () => {
  assert.equal(fixture._schema, 'session/v3')
})

// ---------------------------------------------------------------------------
// Top-level required fields
// ---------------------------------------------------------------------------

test('SessionV3 has sessionId string', () => {
  assert.equal(typeof fixture.sessionId, 'string')
})

test('SessionV3 has semanticSessionId string', () => {
  assert.equal(typeof fixture.semanticSessionId, 'string')
})

test('SessionV3 has parentSessionId as string | null', () => {
  assert.ok(
    typeof fixture.parentSessionId === 'string' || fixture.parentSessionId === null,
  )
})

test('SessionV3 has lineage as hivefiver | hiveminder', () => {
  assert.ok(fixture.lineage === 'hivefiver' || fixture.lineage === 'hiveminder')
})

test('SessionV3 has purposeClass with valid PurposeClass value', () => {
  const valid = [
    'discovery', 'brainstorming', 'research', 'planning',
    'implementation', 'gatekeeping', 'tdd', 'course-correction',
  ]
  assert.ok(valid.includes(fixture.purposeClass))
})

test('SessionV3 has agent string', () => {
  assert.equal(typeof fixture.agent, 'string')
})

test('SessionV3 has startedAt string', () => {
  assert.equal(typeof fixture.startedAt, 'string')
})

test('SessionV3 has endedAt as string | null', () => {
  assert.ok(typeof fixture.endedAt === 'string' || fixture.endedAt === null)
})

test('SessionV3 has turnCount number', () => {
  assert.equal(typeof fixture.turnCount, 'number')
})

test('SessionV3 has status as active | completed | errored', () => {
  assert.ok(
    fixture.status === 'active' ||
      fixture.status === 'completed' ||
      fixture.status === 'errored',
  )
})

test('SessionV3 has summary string', () => {
  assert.equal(typeof fixture.summary, 'string')
})

test('SessionV3 has keyFindings string[]', () => {
  assert.ok(Array.isArray(fixture.keyFindings))
})

test('SessionV3 has subsessionIds string[]', () => {
  assert.ok(Array.isArray(fixture.subsessionIds))
})

test('SessionV3 has resumable boolean', () => {
  assert.equal(typeof fixture.resumable, 'boolean')
})

// ---------------------------------------------------------------------------
// counters sub-object — 5 required numeric fields
// ---------------------------------------------------------------------------

test('SessionV3.counters has userMessageCount', () => {
  assert.equal(typeof fixture.counters.userMessageCount, 'number')
})

test('SessionV3.counters has assistantOutputCount', () => {
  assert.equal(typeof fixture.counters.assistantOutputCount, 'number')
})

test('SessionV3.counters has toolCallCount', () => {
  assert.equal(typeof fixture.counters.toolCallCount, 'number')
})

test('SessionV3.counters has delegationCount', () => {
  assert.equal(typeof fixture.counters.delegationCount, 'number')
})

test('SessionV3.counters has compactionCount', () => {
  assert.equal(typeof fixture.counters.compactionCount, 'number')
})

// ---------------------------------------------------------------------------
// toc (table of contents) — typed array entries
// ---------------------------------------------------------------------------

test('SessionV3.toc is array', () => {
  assert.ok(Array.isArray(fixture.toc))
})

test('SessionV3 toc entry has turnNumber, timestamp, type, summary', () => {
  const entry: SessionV3['toc'][number] = {
    turnNumber: 1,
    timestamp: '2026-03-26T00:01:00.000Z',
    type: 'user_message',
    summary: 'User asked about runtime',
  }
  assert.equal(typeof entry.turnNumber, 'number')
  assert.equal(typeof entry.timestamp, 'string')
  assert.equal(typeof entry.type, 'string')
  assert.equal(typeof entry.summary, 'string')
})

test('SessionV3 toc type accepts user_message | assistant_output | delegation | compaction | error', () => {
  const valid: SessionV3['toc'][number]['type'][] = [
    'user_message',
    'assistant_output',
    'delegation',
    'compaction',
    'error',
  ]
  for (const t of valid) {
    const entry: SessionV3['toc'][number] = {
      turnNumber: 0,
      timestamp: '2026-03-26T00:00:00.000Z',
      type: t,
      summary: '',
    }
    assert.equal(entry.type, t)
  }
})
