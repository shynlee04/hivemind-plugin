/**
 * Meta Parser Tests
 *
 * RED-phase tests for assistant metadata extraction.
 * Tests parseAssistantMeta(), isCompactionTurn(), and parseDuration()
 * which extract agent name, model, duration from assistant headers
 * and detect compaction turns.
 *
 * Will FAIL until `./meta-parser.js` exports these functions.
 *
 * @module event-tracker/parser/meta-parser.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  parseAssistantMeta,
  isCompactionTurn,
  parseDuration,
} from './meta-parser.js'

// ---------------------------------------------------------------------------
// Real assistant headers from session-ses_2e78.md
// ---------------------------------------------------------------------------

const REAL_ASSISTANT_HEADER = '## Assistant (Hiveminder · mimo-v2-pro-free · 22.5s)'
const REAL_ASSISTANT_HEADER_2 = '## Assistant (Hiveminder · mimo-v2-pro-free · 22.8s)'
const COMPACTION_HEADER = '## Assistant (Compaction · mimo-v2-pro-free · 500ms)'
const NO_DURATION_HEADER = '## Assistant (general · opencode/mimo-v2-pro-free)'

// ---------------------------------------------------------------------------
// parseAssistantMeta tests
// ---------------------------------------------------------------------------

test('parseAssistantMeta extracts agent, model, duration from real session header', () => {
  const meta = parseAssistantMeta(REAL_ASSISTANT_HEADER)

  assert.equal(meta.agentName, 'Hiveminder')
  assert.equal(meta.model, 'mimo-v2-pro-free')
  assert.equal(meta.duration, 22500)
})

test('parseAssistantMeta handles different duration value', () => {
  const meta = parseAssistantMeta(REAL_ASSISTANT_HEADER_2)

  assert.equal(meta.agentName, 'Hiveminder')
  assert.equal(meta.model, 'mimo-v2-pro-free')
  assert.equal(meta.duration, 22800)
})

test('parseAssistantMeta returns null duration when missing', () => {
  const meta = parseAssistantMeta(NO_DURATION_HEADER)

  assert.equal(meta.agentName, 'general')
  assert.equal(meta.model, 'opencode/mimo-v2-pro-free')
  assert.equal(meta.duration, null)
})

test('parseAssistantMeta handles malformed header gracefully', () => {
  const meta = parseAssistantMeta('## Assistant')

  assert.ok(typeof meta.agentName === 'string')
  assert.ok(typeof meta.model === 'string')
  assert.equal(meta.duration, null)
})

// ---------------------------------------------------------------------------
// isCompactionTurn tests
// ---------------------------------------------------------------------------

test('isCompactionTurn returns true for compaction header', () => {
  assert.equal(isCompactionTurn(COMPACTION_HEADER), true)
})

test('isCompactionTurn returns false for normal assistant header', () => {
  assert.equal(isCompactionTurn(REAL_ASSISTANT_HEADER), false)
})

// ---------------------------------------------------------------------------
// parseDuration tests
// ---------------------------------------------------------------------------

test('parseDuration converts seconds string to milliseconds', () => {
  assert.equal(parseDuration('1.2s'), 1200)
  assert.equal(parseDuration('22.5s'), 22500)
  assert.equal(parseDuration('0.5s'), 500)
})

test('parseDuration converts milliseconds string to number', () => {
  assert.equal(parseDuration('500ms'), 500)
  assert.equal(parseDuration('1000ms'), 1000)
})

test('parseDuration returns null for unrecognized format', () => {
  assert.equal(parseDuration(''), null)
  assert.equal(parseDuration('fast'), null)
  assert.equal(parseDuration('2m'), null)
})
