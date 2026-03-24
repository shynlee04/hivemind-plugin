/**
 * Index Writer — master session index maintenance and read-side queries.
 *
 * Provides rendering functions for the grep-friendly index markdown,
 * pure query functions over in-memory IndexEntry arrays,
 * and a single I/O function (updateMasterIndex) for full-rewrite persistence.
 *
 * @module event-tracker/writers/index-writer
 */

import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

import type { IndexEntry, SessionTreeNode } from '../types.js'
import { getEventTrackerIndexPath } from '../paths.js'

// ---------------------------------------------------------------------------
// Rendering Functions
// ---------------------------------------------------------------------------

/**
 * Renders the markdown table header row for the session index.
 * @returns Header line with pipe-delimited column labels and separator.
 */
export function renderIndexHeader(): string {
  const header = '| Session ID | Lineage | Purpose | Status | Created | Turns | Delegations | Parent |'
  const separator = '|------------|---------|---------|--------|---------|-------|-------------|--------|'
  return `${header}\n${separator}`
}

/**
 * Renders a single IndexEntry as a pipe-delimited markdown table row.
 * @param entry - The index entry to render.
 * @returns Single table row string.
 */
export function renderIndexEntry(entry: IndexEntry): string {
  const parent = entry.parentSessionId ? entry.parentSessionId : '—'
  return `| ${entry.sessionId} | ${entry.lineage} | ${entry.purposeClass} | ${entry.status} | ${entry.created} | ${entry.turnCount} | ${entry.delegationCount} | ${parent} |`
}

/**
 * Renders the full index markdown document from an array of entries.
 * Entries are sorted by created timestamp descending (newest first).
 * @param entries - Array of index entries.
 * @returns Complete index markdown string.
 */
export function renderIndexTable(entries: IndexEntry[]): string {
  const sorted = [...entries].sort((a, b) => b.created.localeCompare(a.created))
  const header = renderIndexHeader()
  const rows = sorted.map(renderIndexEntry)
  return `# Session Index\n\n${header}\n${rows.join('\n')}`
}

// ---------------------------------------------------------------------------
// Query Functions (pure)
// ---------------------------------------------------------------------------

/**
 * Filters entries to only active sessions.
 * @param entries - Array of index entries.
 * @returns Entries where status is 'active'.
 */
export function getActiveSessions(entries: IndexEntry[]): IndexEntry[] {
  return entries.filter((e) => e.status === 'active')
}

/**
 * Filters entries to direct children of a given parent session.
 * @param entries - Array of index entries.
 * @param parentSessionId - Parent session to find children for.
 * @returns Entries whose parentSessionId matches.
 */
export function getSubSessions(entries: IndexEntry[], parentSessionId: string): IndexEntry[] {
  return entries.filter((e) => e.parentSessionId === parentSessionId)
}

/**
 * Build a recursive session tree from flat index entries.
 * Guards against circular parent references with a visited-set.
 * @param entries - Array of index entries.
 * @param rootSessionId - Root session to build tree from.
 * @returns SessionTreeNode or null if root not found.
 */
export function getSessionTree(
  entries: IndexEntry[],
  rootSessionId: string
): SessionTreeNode | null {
  const entryMap = new Map<string, IndexEntry>()
  const childrenMap = new Map<string, IndexEntry[]>()
  for (const entry of entries) {
    entryMap.set(entry.sessionId, entry)
    const parentId = entry.parentSessionId
    if (parentId) {
      const list = childrenMap.get(parentId)
      if (list) {
        list.push(entry)
      } else {
        childrenMap.set(parentId, [entry])
      }
    }
  }

  const rootEntry = entryMap.get(rootSessionId)
  if (!rootEntry) return null

  const visited = new Set<string>()

  function buildNode(sessionId: string): SessionTreeNode | null {
    if (visited.has(sessionId)) return null
    visited.add(sessionId)

    const entry = entryMap.get(sessionId)
    if (!entry) return null

    const children: SessionTreeNode[] = []
    const childEntries = childrenMap.get(sessionId)
    if (childEntries) {
      for (const child of childEntries) {
        const childNode = buildNode(child.sessionId)
        if (childNode) children.push(childNode)
      }
    }

    return { entry, children }
  }

  return buildNode(rootSessionId)
}

// ---------------------------------------------------------------------------
// I/O Function
// ---------------------------------------------------------------------------

/**
 * Writes the full session index markdown to disk (full rewrite).
 * Creates parent directories if missing.
 * @param projectRoot - Absolute project root path.
 * @param entries - Array of index entries to render.
 */
export async function updateMasterIndex(projectRoot: string, entries: IndexEntry[]): Promise<void> {
  const indexPath = getEventTrackerIndexPath(projectRoot)
  const dir = path.dirname(indexPath)
  await mkdir(dir, { recursive: true })
  const content = renderIndexTable(entries)
  await writeFile(indexPath, content, 'utf8')
}
