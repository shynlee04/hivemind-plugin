/**
 * Index Writer Tests — Plan #8 RED Phase
 *
 * Tests for the master session index writer: rendering functions,
 * query functions (getActiveSessions, getSubSessions, getSessionTree),
 * and I/O function (updateMasterIndex).
 *
 * These tests MUST fail until index-writer.ts is implemented and
 * the new types (IndexEntry, SessionTreeNode) are added to types.ts.
 *
 * @module event-tracker/writers/index-writer.test
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { IndexEntry } from '../types.js'

import {
  renderIndexHeader,
  renderIndexEntry,
  renderIndexTable,
  getActiveSessions,
  getSubSessions,
  getSessionTree,
  updateMasterIndex,
} from './index-writer.js'

import { getEventTrackerIndexPath } from '../paths.js'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<IndexEntry> = {}): IndexEntry {
  return {
    sessionId: 'ses_abc123',
    lineage: 'hiveminder',
    purposeClass: 'planning',
    agent: 'hivemaker',
    status: 'active',
    created: '2026-03-24T10:00:00Z',
    updated: '2026-03-24T12:30:00Z',
    turnCount: 42,
    delegationCount: 3,
    parentSessionId: null,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// renderIndexHeader
// ---------------------------------------------------------------------------

test('renderIndexHeader returns markdown table header with all column labels', () => {
  const header = renderIndexHeader()

  assert.ok(header.includes('Session ID'), 'should include Session ID column')
  assert.ok(header.includes('Lineage'), 'should include Lineage column')
  assert.ok(header.includes('Purpose'), 'should include Purpose column')
  assert.ok(header.includes('Status'), 'should include Status column')
  assert.ok(header.includes('Created'), 'should include Created column')
  assert.ok(header.includes('Turns'), 'should include Turns column')
  assert.ok(header.includes('Delegations'), 'should include Delegations column')
  assert.ok(header.includes('Parent'), 'should include Parent column')
})

test('renderIndexHeader includes markdown separator row', () => {
  const header = renderIndexHeader()

  assert.ok(header.includes('---'), 'should include markdown separator dashes')
})

// ---------------------------------------------------------------------------
// renderIndexEntry
// ---------------------------------------------------------------------------

test('renderIndexEntry single entry renders correct pipe-delimited row with all fields', () => {
  const entry = makeEntry()
  const row = renderIndexEntry(entry)

  assert.ok(row.includes('ses_abc123'), 'should contain session ID')
  assert.ok(row.includes('hiveminder'), 'should contain lineage')
  assert.ok(row.includes('planning'), 'should contain purpose class')
  assert.ok(row.includes('active'), 'should contain status')
  assert.ok(row.includes('2026-03-24T10:00:00Z'), 'should contain created timestamp')
  assert.ok(row.includes('42'), 'should contain turn count')
  assert.ok(row.includes('3'), 'should contain delegation count')
  assert.ok(row.includes('|'), 'should be pipe-delimited')
})

test('renderIndexEntry null parent renders em dash in Parent column', () => {
  const entry = makeEntry({ parentSessionId: null })
  const row = renderIndexEntry(entry)

  assert.ok(row.includes('—'), 'should render em dash for null parent')
})

test('renderIndexEntry entry with zero turns/delegations renders 0 values', () => {
  const entry = makeEntry({ turnCount: 0, delegationCount: 0 })
  const row = renderIndexEntry(entry)

  // Verify 0 values are present — each column is pipe-delimited
  const columns = row.split('|').map((c) => c.trim())
  assert.ok(columns.includes('0'), 'should render 0 for turn or delegation count')
})

test('renderIndexEntry with parent session ID renders parent ID not em dash', () => {
  const entry = makeEntry({ parentSessionId: 'ses_parent001' })
  const row = renderIndexEntry(entry)

  assert.ok(row.includes('ses_parent001'), 'should contain parent session ID')
  assert.ok(!row.includes('—'), 'should NOT render em dash when parent exists')
})

// ---------------------------------------------------------------------------
// renderIndexTable
// ---------------------------------------------------------------------------

test('renderIndexTable multiple entries produce header + rows sorted by created descending', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_old', created: '2026-03-22T08:00:00Z' }),
    makeEntry({ sessionId: 'ses_new', created: '2026-03-24T10:00:00Z' }),
    makeEntry({ sessionId: 'ses_mid', created: '2026-03-23T09:00:00Z' }),
  ]
  const table = renderIndexTable(entries)

  // Verify header present
  assert.ok(table.includes('Session ID'), 'should include header')

  // Verify ordering: newest first
  const newIdx = table.indexOf('ses_new')
  const midIdx = table.indexOf('ses_mid')
  const oldIdx = table.indexOf('ses_old')
  assert.ok(newIdx < midIdx, 'ses_new should appear before ses_mid')
  assert.ok(midIdx < oldIdx, 'ses_mid should appear before ses_old')
})

test('renderIndexTable empty entries array produces header only no data rows', () => {
  const table = renderIndexTable([])

  assert.ok(table.includes('Session ID'), 'should still include header')
  assert.ok(table.includes('---'), 'should still include separator')
  // Should not have any session ID data rows
  assert.ok(!table.includes('ses_'), 'should not contain any session data')
})

test('renderIndexTable output is deterministic for same input', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_a', created: '2026-03-24T10:00:00Z' }),
    makeEntry({ sessionId: 'ses_b', created: '2026-03-23T08:00:00Z' }),
  ]

  const table1 = renderIndexTable(entries)
  const table2 = renderIndexTable(entries)

  assert.equal(table1, table2, 'same input should produce identical output')
})

// ---------------------------------------------------------------------------
// getActiveSessions
// ---------------------------------------------------------------------------

test('getActiveSessions filters only status active entries', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_1', status: 'active' }),
    makeEntry({ sessionId: 'ses_2', status: 'completed' }),
    makeEntry({ sessionId: 'ses_3', status: 'active' }),
    makeEntry({ sessionId: 'ses_4', status: 'abandoned' }),
  ]

  const active = getActiveSessions(entries)
  assert.equal(active.length, 2)
  assert.ok(active.every((e) => e.status === 'active'), 'all results should be active')
  const ids = active.map((e) => e.sessionId)
  assert.ok(ids.includes('ses_1'))
  assert.ok(ids.includes('ses_3'))
})

test('getActiveSessions returns empty when all entries are completed', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_1', status: 'completed' }),
    makeEntry({ sessionId: 'ses_2', status: 'completed' }),
  ]

  const active = getActiveSessions(entries)
  assert.equal(active.length, 0)
})

test('getActiveSessions returns empty for empty input', () => {
  const active = getActiveSessions([])
  assert.equal(active.length, 0)
})

// ---------------------------------------------------------------------------
// getSubSessions
// ---------------------------------------------------------------------------

test('getSubSessions filters entries matching parentSessionId', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_root', parentSessionId: null }),
    makeEntry({ sessionId: 'ses_child1', parentSessionId: 'ses_root' }),
    makeEntry({ sessionId: 'ses_child2', parentSessionId: 'ses_root' }),
    makeEntry({ sessionId: 'ses_other', parentSessionId: 'ses_other_parent' }),
  ]

  const children = getSubSessions(entries, 'ses_root')
  assert.equal(children.length, 2)
  const ids = children.map((e) => e.sessionId)
  assert.ok(ids.includes('ses_child1'))
  assert.ok(ids.includes('ses_child2'))
})

test('getSubSessions returns empty when no children exist', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_lone', parentSessionId: null }),
  ]

  const children = getSubSessions(entries, 'ses_lone')
  assert.equal(children.length, 0)
})

test('getSubSessions null parent entries excluded from sub-session results', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_root', parentSessionId: null }),
    makeEntry({ sessionId: 'ses_orphan', parentSessionId: null }),
  ]

  const children = getSubSessions(entries, 'ses_root')
  assert.equal(children.length, 0, 'null parent entries should not appear as children')
})

// ---------------------------------------------------------------------------
// getSessionTree
// ---------------------------------------------------------------------------

test('getSessionTree single root with no children returns flat node', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_root', parentSessionId: null }),
  ]

  const tree = getSessionTree(entries, 'ses_root')
  assert.notEqual(tree, null)
  assert.equal(tree!.entry.sessionId, 'ses_root')
  assert.equal(tree!.children.length, 0)
})

test('getSessionTree root with 2 children returns tree of depth 2', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_root', parentSessionId: null }),
    makeEntry({ sessionId: 'ses_c1', parentSessionId: 'ses_root' }),
    makeEntry({ sessionId: 'ses_c2', parentSessionId: 'ses_root' }),
  ]

  const tree = getSessionTree(entries, 'ses_root')
  assert.notEqual(tree, null)
  assert.equal(tree!.entry.sessionId, 'ses_root')
  assert.equal(tree!.children.length, 2)

  const childIds = tree!.children.map((c) => c.entry.sessionId)
  assert.ok(childIds.includes('ses_c1'))
  assert.ok(childIds.includes('ses_c2'))
})

test('getSessionTree multi-level tree root child grandchild returns correct nesting', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_root', parentSessionId: null }),
    makeEntry({ sessionId: 'ses_child', parentSessionId: 'ses_root' }),
    makeEntry({ sessionId: 'ses_grandchild', parentSessionId: 'ses_child' }),
  ]

  const tree = getSessionTree(entries, 'ses_root')
  assert.notEqual(tree, null)
  assert.equal(tree!.entry.sessionId, 'ses_root')
  assert.equal(tree!.children.length, 1)
  assert.equal(tree!.children[0].entry.sessionId, 'ses_child')
  assert.equal(tree!.children[0].children.length, 1)
  assert.equal(tree!.children[0].children[0].entry.sessionId, 'ses_grandchild')
})

test('getSessionTree orphan entries parent not in set are excluded from tree', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_root', parentSessionId: null }),
    makeEntry({ sessionId: 'ses_orphan', parentSessionId: 'ses_missing_parent' }),
  ]

  const tree = getSessionTree(entries, 'ses_root')
  assert.notEqual(tree, null)
  assert.equal(tree!.children.length, 0, 'orphan should not appear as child of root')
})

test('getSessionTree circular parent reference A B A returns tree with cycle broken no infinite recursion', () => {
  // Direct cycle: ses_b -> ses_a -> ses_b
  const cycleEntries = [
    makeEntry({ sessionId: 'ses_a', parentSessionId: 'ses_b' }),
    makeEntry({ sessionId: 'ses_b', parentSessionId: 'ses_a' }),
  ]

  // This must NOT throw or hang — cycle guard should break the loop
  const tree = getSessionTree(cycleEntries, 'ses_a')
  assert.notEqual(tree, null, 'root should still be found')
  assert.equal(tree!.entry.sessionId, 'ses_a')

  // ses_b is child of ses_a. ses_a is visited, so when ses_b tries to add
  // ses_a as child, the cycle guard returns null — no infinite recursion
  assert.equal(tree!.children.length, 1, 'ses_b should be child of ses_a')
  assert.equal(tree!.children[0].entry.sessionId, 'ses_b')
  // ses_a should NOT appear again as grandchild (cycle broken)
  assert.equal(tree!.children[0].children.length, 0, 'cycle should be broken — ses_a not re-added')
})

test('getSessionTree returns null for non-existent root session ID', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_root', parentSessionId: null }),
  ]

  const tree = getSessionTree(entries, 'ses_nonexistent')
  assert.equal(tree, null)
})

test('getSessionTree deep cycle A B C A breaks at third visit', () => {
  const entries = [
    makeEntry({ sessionId: 'ses_a', parentSessionId: 'ses_c' }),
    makeEntry({ sessionId: 'ses_b', parentSessionId: 'ses_a' }),
    makeEntry({ sessionId: 'ses_c', parentSessionId: 'ses_b' }),
  ]

  // Must not throw or infinite-loop
  const tree = getSessionTree(entries, 'ses_a')
  assert.notEqual(tree, null)
  assert.equal(tree!.entry.sessionId, 'ses_a')
  // ses_b is child of ses_a
  assert.equal(tree!.children.length, 1)
  assert.equal(tree!.children[0].entry.sessionId, 'ses_b')
  // ses_c is child of ses_b
  assert.equal(tree!.children[0].children.length, 1)
  assert.equal(tree!.children[0].children[0].entry.sessionId, 'ses_c')
  // ses_a would be child of ses_c but is already visited — cycle broken
  assert.equal(tree!.children[0].children[0].children.length, 0)
})

// ---------------------------------------------------------------------------
// updateMasterIndex
// ---------------------------------------------------------------------------

test('updateMasterIndex writes index.md to correct path with rendered content', async () => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'idx-test-'))
  try {
    const entries = [
      makeEntry({ sessionId: 'ses_test01', created: '2026-03-24T10:00:00Z' }),
    ]

    await updateMasterIndex(tmpDir, entries)

    const indexPath = getEventTrackerIndexPath(tmpDir)
    const content = await readFile(indexPath, 'utf8')

    assert.ok(content.includes('ses_test01'), 'file should contain session ID')
    assert.ok(content.includes('Session ID'), 'file should contain header')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('updateMasterIndex overwrites existing index.md full rewrite', async () => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'idx-overwrite-'))
  try {
    // Write initial index
    await updateMasterIndex(tmpDir, [
      makeEntry({ sessionId: 'ses_old_entry', created: '2026-03-22T08:00:00Z' }),
    ])

    // Rewrite with new data
    await updateMasterIndex(tmpDir, [
      makeEntry({ sessionId: 'ses_new_entry', created: '2026-03-24T10:00:00Z' }),
    ])

    const indexPath = getEventTrackerIndexPath(tmpDir)
    const content = await readFile(indexPath, 'utf8')

    assert.ok(content.includes('ses_new_entry'), 'should contain new entry')
    assert.ok(!content.includes('ses_old_entry'), 'should NOT contain old entry after rewrite')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})

test('updateMasterIndex creates parent directory if missing', async () => {
  const tmpDir = await mkdtemp(path.join(tmpdir(), 'idx-mkdir-'))
  try {
    const nestedRoot = path.join(tmpDir, 'deep', 'nested')

    await updateMasterIndex(nestedRoot, [
      makeEntry({ sessionId: 'ses_deep' }),
    ])

    const indexPath = getEventTrackerIndexPath(nestedRoot)
    const content = await readFile(indexPath, 'utf8')

    assert.ok(content.includes('ses_deep'), 'file should exist in nested directory')
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
})
