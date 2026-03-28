/**
 * Session Structure Tests (RED Phase)
 *
 * Tests for directory-based session layout (ADR-017).
 * Authored BEFORE implementation — every test MUST fail initially.
 *
 * @module event-tracker/session-structure.test
 */

import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  createSessionDir,
  createSubSessionDir,
  getSessionDirPath,
  getSubSessionDirPath,
  migrateFlatToDirectory,
} from './session-structure.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a disposable temp directory for each test. */
async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'session-structure-'))
}

/** Clean up a temp directory after the test. */
async function cleanTmpDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true })
}

// ---------------------------------------------------------------------------
// Pure path computation (no side effects)
// ---------------------------------------------------------------------------

test('getSessionDirPath returns sessionsDir/semanticId', () => {
  const sessionsDir = '/tmp/hivemind/.hivemind/sessions'
  const semanticId = 'planning-explore-2026-03-26'
  const result = getSessionDirPath(sessionsDir, semanticId)

  assert.equal(result, path.join(sessionsDir, semanticId))
})

test('getSessionDirPath is deterministic', () => {
  const sessionsDir = '/tmp/hivemind/.hivemind/sessions'
  const semanticId = 'research-audit-2026-03-26'

  const first = getSessionDirPath(sessionsDir, semanticId)
  const second = getSessionDirPath(sessionsDir, semanticId)

  assert.equal(first, second)
})

test('getSubSessionDirPath returns parentDir/subsessions/childSemanticId', () => {
  const parentDir = '/tmp/hivemind/.hivemind/sessions/planning-explore-2026-03-26'
  const childSemanticId = 'delegation-agent-architect-1'
  const result = getSubSessionDirPath(parentDir, childSemanticId)

  assert.equal(result, path.join(parentDir, 'subsessions', childSemanticId))
})

test('getSubSessionDirPath is deterministic', () => {
  const parentDir = '/tmp/hivemind/.hivemind/sessions/planning-explore-2026-03-26'
  const childSemanticId = 'delegation-hivexplorer-2'

  const first = getSubSessionDirPath(parentDir, childSemanticId)
  const second = getSubSessionDirPath(parentDir, childSemanticId)

  assert.equal(first, second)
})

// ---------------------------------------------------------------------------
// Directory creation (side effects)
// ---------------------------------------------------------------------------

test('createSessionDir creates directory and returns path', async () => {
  const sessionsDir = await makeTmpDir()
  const semanticId = 'tdd-session-001'

  try {
    const result = createSessionDir(sessionsDir, semanticId)
    const expected = path.join(sessionsDir, semanticId)

    // Must return the correct path
    assert.equal(result, expected)

    // Must actually create the directory
    const stat = await fs.stat(result)
    assert.ok(stat.isDirectory(), 'createSessionDir must create a directory')
  } finally {
    await cleanTmpDir(sessionsDir)
  }
})

test('createSessionDir is idempotent — does not throw if directory already exists', async () => {
  const sessionsDir = await makeTmpDir()
  const semanticId = 'tdd-idempotent-001'

  try {
    await createSessionDir(sessionsDir, semanticId)
    // Second call must NOT throw
    await assert.doesNotReject(async () => {
      await createSessionDir(sessionsDir, semanticId)
    })
  } finally {
    await cleanTmpDir(sessionsDir)
  }
})

test('createSubSessionDir creates subsessions/childDir and returns path', async () => {
  const sessionsDir = await makeTmpDir()
  const parentSemanticId = 'planning-explore-001'
  const parentDir = await createSessionDir(sessionsDir, parentSemanticId)
  const childSemanticId = 'delegation-hiveq-1'

  try {
    const result = createSubSessionDir(parentDir, childSemanticId)
    const expected = path.join(parentDir, 'subsessions', childSemanticId)

    assert.equal(result, expected)

    const stat = await fs.stat(result)
    assert.ok(stat.isDirectory(), 'createSubSessionDir must create a directory')
  } finally {
    await cleanTmpDir(sessionsDir)
  }
})

test('createSubSessionDir creates parent subsessions directory if missing', async () => {
  const sessionsDir = await makeTmpDir()
  const parentDir = path.join(sessionsDir, 'root-session-001')

  try {
    // parentDir itself does NOT exist yet — createSubSessionDir should
    // create the full tree: parentDir/subsessions/childId
    await fs.mkdir(parentDir, { recursive: true })
    const childSemanticId = 'delegation-explore-1'
    createSubSessionDir(parentDir, childSemanticId)

    const subsessionsDir = path.join(parentDir, 'subsessions')
    const subsessionsStat = await fs.stat(subsessionsDir)
    assert.ok(subsessionsStat.isDirectory(), 'subsessions/ directory must be created')
  } finally {
    await cleanTmpDir(sessionsDir)
  }
})

// ---------------------------------------------------------------------------
// migrateFlatToDirectory
// ---------------------------------------------------------------------------

test('migrateFlatToDirectory moves flat session.json into session directory', async () => {
  const sessionsDir = await makeTmpDir()
  const semanticId = 'ses_migrate_test_001'

  try {
    // Simulate flat layout: sessions/ses_migrate_test_001.json
    const flatFile = path.join(sessionsDir, `${semanticId}.json`)
    const flatContent = JSON.stringify({
      sessionId: 'ses_migrate_test_001',
      semanticSessionId: semanticId,
      lineage: 'hiveminder',
      purposeClass: 'research',
      agent: 'test-agent',
      status: 'completed',
    })
    await fs.writeFile(flatFile, flatContent, 'utf-8')

    // Migrate
    const sessionDir = await migrateFlatToDirectory(sessionsDir, flatFile)

    // Flat file should no longer exist
    await assert.rejects(
      () => fs.stat(flatFile),
      { code: 'ENOENT' },
      'flat session.json must be removed after migration',
    )

    // New file should exist at sessionDir/session.json
    const migratedFile = path.join(sessionDir, 'session.json')
    const migratedContent = await fs.readFile(migratedFile, 'utf-8')
    assert.equal(migratedContent, flatContent, 'migrated session.json must preserve original content')
  } finally {
    await cleanTmpDir(sessionsDir)
  }
})

test('migrateFlatToDirectory returns the session directory path', async () => {
  const sessionsDir = await makeTmpDir()
  const semanticId = 'ses_migrate_path_001'

  try {
    const flatFile = path.join(sessionsDir, `${semanticId}.json`)
    await fs.writeFile(flatFile, '{"test": true}', 'utf-8')

    const result = await migrateFlatToDirectory(sessionsDir, flatFile)
    const expected = path.join(sessionsDir, semanticId)

    assert.equal(result, expected)
  } finally {
    await cleanTmpDir(sessionsDir)
  }
})

test('migrateFlatToDirectory throws if flat file does not exist', async () => {
  const sessionsDir = await makeTmpDir()
  const flatFile = path.join(sessionsDir, 'ses_nonexistent.json')

  try {
    await assert.rejects(
      () => migrateFlatToDirectory(sessionsDir, flatFile),
      /ENOENT|not found/i,
      'must throw when flat file is missing',
    )
  } finally {
    await cleanTmpDir(sessionsDir)
  }
})
