/**
 * Splitter Tests
 *
 * RED-phase tests for turn splitting at `## User` boundaries.
 * Tests splitTurns() which divides raw session markdown into
 * individual turn blocks.
 *
 * Will FAIL until `./splitter.js` exports `splitTurns`.
 *
 * @module event-tracker/parser/splitter.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { splitTurns } from './splitter.js'

// ---------------------------------------------------------------------------
// Real session snippets extracted from session-ses_2e78.md
// ---------------------------------------------------------------------------

const SINGLE_TURN = `## User

deep research and synthesis of today

---

## Assistant (Hiveminder · mimo-v2-pro-free · 22.5s)

_Thinking:_

The user wants me to do deep research.

**Tool: todowrite**

**Input:**
\`\`\`json
{ "todos": [] }
\`\`\`

**Output:**
\`\`\`
[]
\`\`\``

const TWO_TURNS = `## User

first message

---

## Assistant (Hiveminder · mimo-v2-pro-free · 5.0s)

first response

---

## User

second message

---

## Assistant (Hiveminder · mimo-v2-pro-free · 3.2s)

second response`

const COMPACTION_TURN = `## Assistant (Compaction · mimo-v2-pro-free · 500ms)

Compacted session summary here.`

// ---------------------------------------------------------------------------
// Test: Single user + assistant pair → 1 element
// ---------------------------------------------------------------------------

test('splitTurns returns 1 element for single user+assistant pair', () => {
  const result = splitTurns(SINGLE_TURN)
  assert.equal(result.length, 1)
  assert.ok(result[0].includes('## User'))
  assert.ok(result[0].includes('deep research and synthesis'))
})

// ---------------------------------------------------------------------------
// Test: Multiple turns → correct count
// ---------------------------------------------------------------------------

test('splitTurns returns 2 elements for two user turns', () => {
  const result = splitTurns(TWO_TURNS)
  assert.equal(result.length, 2)
  assert.ok(result[0].includes('first message'))
  assert.ok(result[1].includes('second message'))
})

// ---------------------------------------------------------------------------
// Test: Compaction turn (no ## User before it) → handled correctly
// ---------------------------------------------------------------------------

test('splitTurns returns empty array for compaction-only markdown (no ## User)', () => {
  const result = splitTurns(COMPACTION_TURN)
  assert.equal(result.length, 0)
})

// ---------------------------------------------------------------------------
// Test: Empty string → empty array
// ---------------------------------------------------------------------------

test('splitTurns returns empty array for empty string', () => {
  const result = splitTurns('')
  assert.deepEqual(result, [])
})

// ---------------------------------------------------------------------------
// Test: No ## User sections → empty array
// ---------------------------------------------------------------------------

test('splitTurns returns empty array when no ## User sections exist', () => {
  const markdown = `# Just a header

Some text here.

## Assistant (Agent · model · 1s)

Response text.`

  const result = splitTurns(markdown)
  assert.deepEqual(result, [])
})

// ---------------------------------------------------------------------------
// Test: Each element preserves inner content verbatim
// ---------------------------------------------------------------------------

test('splitTurns preserves tool blocks and thinking content verbatim', () => {
  const result = splitTurns(SINGLE_TURN)
  assert.equal(result.length, 1)

  const block = result[0]
  assert.ok(block.includes('**Tool: todowrite**'))
  assert.ok(block.includes('**Input:**'))
  assert.ok(block.includes('**Output:**'))
  assert.ok(block.includes('_Thinking:_'))
})
