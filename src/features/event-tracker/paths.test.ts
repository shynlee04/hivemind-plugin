/**
 * Event Tracker Path Builders Tests (RED)
 *
 * These tests define the expected path-builder contract for event-tracker.
 * They are intentionally authored before implementation.
 */

import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import { HIVEMIND_DIR, SESSIONS_DIR } from '../../shared/paths.js'
import * as eventTrackerPaths from './paths.js'

const projectRoot = path.join(path.sep, 'tmp', 'workspace')
const sessionId = 'ses_abc123'

function expectedSessionDir(): string {
  return path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, sessionId)
}

function expectedInSession(filename: string): string {
  return path.join(expectedSessionDir(), filename)
}

test('exports required path builders', () => {
  assert.equal(typeof eventTrackerPaths.getEventTrackerSessionDir, 'function')
  assert.equal(typeof eventTrackerPaths.getSessionEventsPath, 'function')
  assert.equal(typeof eventTrackerPaths.getSessionDiagnosticsPath, 'function')
  assert.equal(typeof eventTrackerPaths.getSessionDelegationPath, 'function')
  assert.equal(typeof eventTrackerPaths.getSessionInjectionPath, 'function')
  assert.equal(typeof eventTrackerPaths.getSessionMetadataPath, 'function')
  assert.equal(typeof eventTrackerPaths.getEventTrackerIndexPath, 'function')
  assert.equal(typeof eventTrackerPaths.getSessionSynthesisPath, 'function')
})

test('builds deterministic session directory path using shared SESSIONS_DIR authority', () => {
  const first = eventTrackerPaths.getEventTrackerSessionDir(projectRoot, sessionId)
  const second = eventTrackerPaths.getEventTrackerSessionDir(projectRoot, sessionId)

  assert.equal(first, second)
  assert.equal(first, expectedSessionDir())
})

test('builds events.md path via join-based composition', () => {
  const actual = eventTrackerPaths.getSessionEventsPath(projectRoot, sessionId)
  assert.equal(actual, expectedInSession('events.md'))
})

test('builds diagnostics.log path via join-based composition', () => {
  const actual = eventTrackerPaths.getSessionDiagnosticsPath(projectRoot, sessionId)
  assert.equal(actual, expectedInSession('diagnostics.log'))
})

test('builds delegation.md path via join-based composition', () => {
  const actual = eventTrackerPaths.getSessionDelegationPath(projectRoot, sessionId)
  assert.equal(actual, expectedInSession('delegation.md'))
})

test('builds injection.md path via join-based composition', () => {
  const actual = eventTrackerPaths.getSessionInjectionPath(projectRoot, sessionId)
  assert.equal(actual, expectedInSession('injection.md'))
})

test('builds session.json path via join-based composition', () => {
  const actual = eventTrackerPaths.getSessionMetadataPath(projectRoot, sessionId)
  assert.equal(actual, expectedInSession('session.json'))
})

test('builds master index path via join-based composition', () => {
  const actual = eventTrackerPaths.getEventTrackerIndexPath(projectRoot)
  const expected = path.join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR, 'index.md')
  assert.equal(actual, expected)
})

test('builds synthesis path via join-based composition', () => {
  const actual = eventTrackerPaths.getSessionSynthesisPath(projectRoot, sessionId)
  assert.equal(actual, expectedInSession('synthesis.md'))
})
