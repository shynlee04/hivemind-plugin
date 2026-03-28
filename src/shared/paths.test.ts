/**
 * Shared Paths Dead Code Cleanup Tests (RED)
 *
 * These tests verify that getEffectivePaths() and STATE_FILES
 * do NOT contain dead fields that reference non-existent directories/files.
 */

import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import * as paths from './paths.js'

const projectRoot = path.join(path.sep, 'tmp', 'workspace')

// --- ARTIFACTS_DIR and CHECKPOINTS_DIR should not exist ---

test('ARTIFACTS_DIR constant is removed (never used)', () => {
  assert.equal((paths as any).ARTIFACTS_DIR, undefined)
})

test('CHECKPOINTS_DIR constant is removed (never used)', () => {
  assert.equal((paths as any).CHECKPOINTS_DIR, undefined)
})

// --- STATE_FILES should not contain dead file entries ---

test('STATE_FILES does not contain hiveneuron (file does not exist)', () => {
  assert.equal('hiveneuron' in paths.STATE_FILES, false)
})

test('STATE_FILES does not contain hivebrain (file does not exist)', () => {
  assert.equal('hivebrain' in paths.STATE_FILES, false)
})

test('STATE_FILES does not contain brain (file does not exist)', () => {
  assert.equal('brain' in paths.STATE_FILES, false)
})

test('STATE_FILES does not contain anchors (file does not exist)', () => {
  assert.equal('anchors' in paths.STATE_FILES, false)
})

// --- getEffectivePaths should not return handoffsDir ---

test('getEffectivePaths does not return handoffsDir (directory does not exist)', () => {
  const effective = paths.getEffectivePaths(projectRoot)
  assert.equal('handoffsDir' in effective, false)
})

// --- Functional exports remain intact ---

test('getEffectivePaths returns required functional fields', () => {
  const effective = paths.getEffectivePaths(projectRoot)
  const root = path.join(projectRoot, '.hivemind')

  assert.equal(effective.root, root)
  assert.equal(effective.stateDir, path.join(root, 'state'))
  assert.equal(effective.configDir, path.join(root, 'config'))
  assert.equal(effective.graphDir, path.join(root, 'graph'))
  assert.equal(effective.sessionsDir, path.join(root, 'sessions'))
  assert.equal(effective.projectPlanningDir, path.join(root, 'project', 'planning'))
  assert.equal(effective.journeyEventsDir, path.join(root, 'sessions', 'journey-events'))
  assert.equal(effective.errorLogsDir, path.join(root, 'sessions', 'error-logs'))
  assert.equal(effective.runtimeAttachmentSettings, path.join(root, 'config', 'runtime-attachment.json'))
  assert.equal(effective.workflowTasksState, path.join(root, 'state', 'tasks.json'))
  assert.equal(effective.workflowTasksGraph, path.join(root, 'graph', 'tasks.json'))
  assert.equal(effective.trajectoryLedger, path.join(root, 'state', 'trajectory-ledger.json'))
})

test('getEffectivePaths omits deprecated legacy directories', () => {
  const effective = paths.getEffectivePaths(projectRoot)

  assert.equal('sessionInspectionDir' in effective, false)
  assert.equal('errorLogDir' in effective, false)
})

test('path builder functions remain intact', () => {
  assert.equal(typeof paths.getHivemindPath, 'function')
  assert.equal(typeof paths.getStatePath, 'function')
  assert.equal(typeof paths.getSessionPath, 'function')
  assert.equal((paths as any).getSessionInspectionPath, undefined)
  assert.equal((paths as any).getErrorLogPath, undefined)
  assert.equal(typeof paths.getConfigPath, 'function')
  assert.equal(typeof paths.isHivemindPath, 'function')
  assert.equal(typeof paths.isSessionFile, 'function')
})

test('path constants remain intact', () => {
  assert.equal(paths.HIVEMIND_DIR, '.hivemind')
  assert.equal(paths.STATE_DIR, 'state')
  assert.equal(paths.SESSIONS_DIR, 'sessions')
  assert.equal(paths.GRAPH_DIR, 'graph')
  assert.equal(paths.CONFIG_DIR, 'config')
})
