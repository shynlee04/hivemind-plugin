/**
 * Header Parser Tests
 *
 * RED-phase tests for session header extraction from raw markdown.
 * Tests parseSessionHeader() which extracts title, timestamp, sessionId,
 * created, and updated from the session header block.
 *
 * Will FAIL until `./header-parser.js` exports `parseSessionHeader`.
 *
 * @module event-tracker/parser/header-parser.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { parseSessionHeader } from './header-parser.js'

// ---------------------------------------------------------------------------
// Real session fixture from session-ses_2e78.md (trimmed)
// ---------------------------------------------------------------------------

const REAL_SESSION_HEADER = `# Agent automation tools research

**Session ID:** ses_2e78bb73effeKLvUjyj8t1Bx3V
**Created:** 3/23/2026, 9:09:27 AM
**Updated:** 3/23/2026, 9:10:34 AM

---

## User

some content here`

// ---------------------------------------------------------------------------
// Test: Standard header with all fields present
// ---------------------------------------------------------------------------

test('parseSessionHeader extracts all fields from real session format', () => {
  const header = parseSessionHeader(REAL_SESSION_HEADER)

  assert.equal(header.title, 'Agent automation tools research')
  assert.equal(header.sessionId, 'ses_2e78bb73effeKLvUjyj8t1Bx3V')
  assert.equal(header.created, '3/23/2026, 9:09:27 AM')
  assert.equal(header.updated, '3/23/2026, 9:10:34 AM')
})

// ---------------------------------------------------------------------------
// Test: Missing Session ID → defaults to 'N/A'
// ---------------------------------------------------------------------------

test('parseSessionHeader defaults sessionId to N/A when missing', () => {
  const markdown = `# My Session

**Created:** 3/23/2026, 9:00:00 AM
**Updated:** 3/23/2026, 9:05:00 AM

---

## User

hello`

  const header = parseSessionHeader(markdown)
  assert.equal(header.sessionId, 'N/A')
})

// ---------------------------------------------------------------------------
// Test: Missing Created/Updated → defaults to 'N/A'
// ---------------------------------------------------------------------------

test('parseSessionHeader defaults created and updated to N/A when missing', () => {
  const markdown = `# Another Session

**Session ID:** ses_abc123

---

## User

hello`

  const header = parseSessionHeader(markdown)
  assert.equal(header.created, 'N/A')
  assert.equal(header.updated, 'N/A')
})

// ---------------------------------------------------------------------------
// Test: Title with special characters (parentheses, dots)
// ---------------------------------------------------------------------------

test('parseSessionHeader handles title with special characters', () => {
  const markdown = `# Plan #4: Turn Parser (v2.0)

**Session ID:** ses_xyz
**Created:** 3/23/2026, 10:00:00 AM
**Updated:** 3/23/2026, 10:05:00 AM

---

## User

test`

  const header = parseSessionHeader(markdown)
  assert.equal(header.title, 'Plan #4: Turn Parser (v2.0)')
  assert.equal(header.sessionId, 'ses_xyz')
})

// ---------------------------------------------------------------------------
// Test: Empty markdown → returns defaults
// ---------------------------------------------------------------------------

test('parseSessionHeader returns all N/A for empty markdown', () => {
  const header = parseSessionHeader('')

  assert.equal(header.title, 'N/A')
  assert.equal(header.timestamp, 'N/A')
  assert.equal(header.sessionId, 'N/A')
  assert.equal(header.created, 'N/A')
  assert.equal(header.updated, 'N/A')
})
