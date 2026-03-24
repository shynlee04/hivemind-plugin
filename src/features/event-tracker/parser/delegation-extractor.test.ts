/**
 * Delegation Extractor Tests
 *
 * RED-phase tests for delegation JSON extraction from `task` tool blocks.
 * Tests extractDelegations() which scans turn text for `**Tool: task**`
 * blocks and extracts delegation records.
 *
 * Will FAIL until `./delegation-extractor.js` exports `extractDelegations`.
 *
 * @module event-tracker/parser/delegation-extractor.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { extractDelegations } from './delegation-extractor.js'

// ---------------------------------------------------------------------------
// Fixture: turn with a task tool delegation block
// ---------------------------------------------------------------------------

const TURN_WITH_DELEGATION = `## User

Please investigate the codebase.

---

## Assistant (Hiveminder · mimo-v2-pro-free · 10.0s)

I'll delegate this to the explorer.

**Tool: task**

**Input:**
\`\`\`json
{
  "agent": "hivexplorer",
  "subagent_type": "hivexplorer",
  "description": "Investigate codebase for test patterns",
  "prompt": "Find all test files and identify patterns",
  "packet_id": "pkt-abc123"
}
\`\`\`

**Output:**
\`\`\`
Delegation dispatched.
\`\`\``

// ---------------------------------------------------------------------------
// Fixture: turn with non-task tool (should be ignored)
// ---------------------------------------------------------------------------

const TURN_WITH_NON_TASK_TOOL = `## User

Do something.

---

## Assistant (general · model · 1.0s)

Let me check.

**Tool: read**

**Input:**
\`\`\`json
{ "path": "README.md" }
\`\`\`

**Output:**
\`\`\`
File content here.
\`\`\``

// ---------------------------------------------------------------------------
// Fixture: turn with malformed JSON in task block
// ---------------------------------------------------------------------------

const TURN_WITH_MALFORMED_JSON = `## User

Delegate something.

---

## Assistant (general · model · 1.0s)

**Tool: task**

**Input:**
\`\`\`json
{ this is not valid json !!!
\`\`\`

**Output:**
\`\`\`
Error.
\`\`\``

// ---------------------------------------------------------------------------
// Fixture: turn with multiple delegation blocks
// ---------------------------------------------------------------------------

const TURN_WITH_MULTIPLE_DELEGATIONS = `## User

Run two investigations.

---

## Assistant (Hiveminder · mimo-v2-pro-free · 5.0s)

Dispatching parallel agents.

**Tool: task**

**Input:**
\`\`\`json
{
  "agent": "hivexplorer",
  "subagent_type": "hivexplorer",
  "description": "Scan for test patterns",
  "packet_id": "pkt-001"
}
\`\`\`

**Output:**
\`\`\`
Done.
\`\`\`

**Tool: task**

**Input:**
\`\`\`json
{
  "agent": "hiveq",
  "subagent_type": "hiveq",
  "description": "Verify test coverage",
  "packet_id": "pkt-002"
}
\`\`\`

**Output:**
\`\`\`
Done.
\`\`\``

// ---------------------------------------------------------------------------
// Test: Turn with task tool and valid JSON → extracts delegation
// ---------------------------------------------------------------------------

test('extractDelegations extracts delegation from task tool block', () => {
  const result = extractDelegations(TURN_WITH_DELEGATION)

  assert.equal(result.length, 1)
  assert.equal(result[0].delegatedTo, 'hivexplorer')
  assert.equal(result[0].description, 'Investigate codebase for test patterns')
  assert.equal(result[0].subagentType, 'hivexplorer')
  assert.equal(result[0].packetId, 'pkt-abc123')
})

// ---------------------------------------------------------------------------
// Test: Turn with no tool blocks → empty array
// ---------------------------------------------------------------------------

test('extractDelegations returns empty array when no tool blocks exist', () => {
  const plainTurn = `## User

Just a plain question.

---

## Assistant (general · model · 1.0s)

Just a plain answer.`

  const result = extractDelegations(plainTurn)
  assert.deepEqual(result, [])
})

// ---------------------------------------------------------------------------
// Test: Turn with non-task tool blocks → empty array
// ---------------------------------------------------------------------------

test('extractDelegations ignores non-task tool blocks', () => {
  const result = extractDelegations(TURN_WITH_NON_TASK_TOOL)
  assert.deepEqual(result, [])
})

// ---------------------------------------------------------------------------
// Test: Turn with malformed JSON → skips gracefully, no throw
// ---------------------------------------------------------------------------

test('extractDelegations skips malformed JSON without throwing', () => {
  assert.doesNotThrow(() => {
    const result = extractDelegations(TURN_WITH_MALFORMED_JSON)
    assert.ok(Array.isArray(result))
  })
})

// ---------------------------------------------------------------------------
// Test: Multiple delegation blocks in one turn → extracts all
// ---------------------------------------------------------------------------

test('extractDelegations extracts multiple delegation blocks from one turn', () => {
  const result = extractDelegations(TURN_WITH_MULTIPLE_DELEGATIONS)

  assert.equal(result.length, 2)
  assert.equal(result[0].delegatedTo, 'hivexplorer')
  assert.equal(result[0].packetId, 'pkt-001')
  assert.equal(result[1].delegatedTo, 'hiveq')
  assert.equal(result[1].packetId, 'pkt-002')
})

// ---------------------------------------------------------------------------
// Test: Missing optional JSON fields → defaults to empty string / null
// ---------------------------------------------------------------------------

test('extractDelegations handles missing optional fields with defaults', () => {
  const turn = `## User

Delegate.

---

## Assistant (general · model · 1.0s)

**Tool: task**

**Input:**
\`\`\`json
{
  "agent": "explore"
}
\`\`\`

**Output:**
\`\`\`
Done.
\`\`\``

  const result = extractDelegations(turn)

  assert.equal(result.length, 1)
  assert.equal(result[0].delegatedTo, 'explore')
  // description and subagentType may be empty string or derived
  assert.ok(typeof result[0].description === 'string')
  assert.ok(typeof result[0].subagentType === 'string')
  assert.equal(result[0].packetId, null)
})
