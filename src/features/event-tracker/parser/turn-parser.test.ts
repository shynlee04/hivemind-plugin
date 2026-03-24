/**
 * Turn Parser Integration Tests
 *
 * RED-phase integration tests for parseSession() which composes
 * splitter, meta-parser, delegation-extractor, header-parser,
 * and counter into a full session parsing pipeline.
 *
 * Will FAIL until `./turn-parser.js` exports `parseSession`.
 *
 * @module event-tracker/parser/turn-parser.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSession } from './turn-parser.js'

// ---------------------------------------------------------------------------
// Full session fixture (adapted from session-ses_2e78.md)
// ---------------------------------------------------------------------------

const FULL_SESSION = `# Agent automation tools research

**Session ID:** ses_2e78bb73effeKLvUjyj8t1Bx3V
**Created:** 3/23/2026, 9:09:27 AM
**Updated:** 3/23/2026, 9:10:34 AM

---

## User

deep research and synthesis of today

---

## Assistant (Hiveminder · mimo-v2-pro-free · 22.5s)

_Thinking:_

The user wants me to do deep research on OpenCode community plugins.

Let me launch multiple parallel research streams.

**Tool: todowrite**

**Input:**
\`\`\`json
{
  "todos": [
    { "content": "Research plugins", "status": "in_progress", "priority": "high" }
  ]
}
\`\`\`

**Output:**
\`\`\`
[{ "content": "Research plugins", "status": "in_progress", "priority": "high" }]
\`\`\`

---

## User

continue with the next phase

---

## Assistant (Hiveminder · mimo-v2-pro-free · 22.8s)

_Thinking:_

Launching parallel research across multiple vectors.

**Tool: task**

**Input:**
\`\`\`json
{
  "agent": "hivexplorer",
  "subagent_type": "hivexplorer",
  "description": "Investigate codebase for test patterns",
  "packet_id": "pkt-delegate-001"
}
\`\`\`

**Output:**
\`\`\`
Delegation dispatched.
\`\`\`

---

## Assistant (Compaction · mimo-v2-pro-free · 500ms)

Session compacted. Previous turns summarized.`

// ---------------------------------------------------------------------------
// Session with delegation
// ---------------------------------------------------------------------------

const SESSION_WITH_DELEGATION = `# Delegation Test

**Session ID:** ses-delegate
**Created:** 3/23/2026, 10:00:00 AM
**Updated:** 3/23/2026, 10:05:00 AM

---

## User

run an investigation

---

## Assistant (Hiveminder · mimo-v2-pro-free · 5.0s)

Dispatching.

**Tool: task**

**Input:**
\`\`\`json
{
  "agent": "hivexplorer",
  "subagent_type": "hivexplorer",
  "description": "Scan for patterns",
  "packet_id": "pkt-scan-001"
}
\`\`\`

**Output:**
\`\`\`
Done.
\`\`\``

// ---------------------------------------------------------------------------
// Test: Full session parse → correct ParsedSession with header
// ---------------------------------------------------------------------------

test('parseSession extracts header from full session markdown', () => {
  const result = parseSession(FULL_SESSION)

  assert.equal(result.header.title, 'Agent automation tools research')
  assert.equal(result.header.sessionId, 'ses_2e78bb73effeKLvUjyj8t1Bx3V')
  assert.equal(result.header.created, '3/23/2026, 9:09:27 AM')
  assert.equal(result.header.updated, '3/23/2026, 9:10:34 AM')
})

// ---------------------------------------------------------------------------
// Test: Full session parse → correct turn count and numbering
// ---------------------------------------------------------------------------

test('parseSession produces correct number of turns from full session', () => {
  const result = parseSession(FULL_SESSION)

  // 2 user turns + 1 compaction = 3 turns
  assert.ok(result.turns.length >= 2, 'should have at least 2 user turns')

  // Turn numbering starts at 1
  assert.equal(result.turns[0].turnNumber, 1)
})

// ---------------------------------------------------------------------------
// Test: Session with delegation → delegations populated
// ---------------------------------------------------------------------------

test('parseSession extracts delegations from task tool blocks', () => {
  const result = parseSession(SESSION_WITH_DELEGATION)

  assert.ok(result.delegations.length >= 1, 'should have at least 1 delegation')
  assert.equal(result.delegations[0].delegatedTo, 'hivexplorer')
  assert.equal(result.delegations[0].packetId, 'pkt-scan-001')
})

// ---------------------------------------------------------------------------
// Test: Empty markdown → empty turns, default header
// ---------------------------------------------------------------------------

test('parseSession handles empty markdown with defaults', () => {
  const result = parseSession('')

  assert.deepEqual(result.turns, [])
  assert.equal(result.header.title, 'N/A')
  assert.equal(result.header.sessionId, 'N/A')
  assert.equal(result.counters.userMessageCount, 0)
  assert.equal(result.counters.agentOutputCount, 0)
  assert.equal(result.counters.delegationCount, 0)
})

// ---------------------------------------------------------------------------
// Test: Thinking blocks → thinking field populated
// ---------------------------------------------------------------------------

test('parseSession extracts thinking blocks from assistant content', () => {
  const result = parseSession(FULL_SESSION)

  const firstTurn = result.turns[0]
  assert.ok(firstTurn, 'should have at least one turn')
  assert.notEqual(firstTurn.thinking, null)
  assert.ok(
    firstTurn.thinking?.includes('deep research'),
    'thinking should contain expected text'
  )
})

// ---------------------------------------------------------------------------
// Test: Multi-turn session → correct turn numbering
// ---------------------------------------------------------------------------

test('parseSession numbers turns sequentially starting from 1', () => {
  const result = parseSession(FULL_SESSION)

  for (let i = 0; i < result.turns.length; i++) {
    assert.equal(
      result.turns[i].turnNumber,
      i + 1,
      `turn ${i} should have turnNumber ${i + 1}`
    )
  }
})

// ---------------------------------------------------------------------------
// Test: Tool invocations (non-task) are not in delegations
// ---------------------------------------------------------------------------

test('parseSession does not extract non-task tools as delegations', () => {
  // FULL_SESSION has a todowrite tool — should NOT appear in delegations
  const result = parseSession(FULL_SESSION)

  const todowriteDelegations = result.delegations.filter(
    (d) => d.delegatedTo === 'todowrite'
  )
  assert.equal(todowriteDelegations.length, 0, 'todowrite should not be a delegation')
})
