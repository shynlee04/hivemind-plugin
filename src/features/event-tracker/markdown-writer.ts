/**
 * Markdown Writer — Human-readable events.md generation (ADR-017)
 *
 * Generates and maintains session events.md files in the ADR-specified format.
 * Event additions are append-only via `fs.promises.appendFile`, except
 * `generateTOC` and existing diagnostic rewrites which replace in-place.
 *
 * @module event-tracker/markdown-writer
 */

import { existsSync } from 'node:fs'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import type { SessionV2 } from './consolidated-writer.js'
import type { SessionV3 } from './types.js'

// ---------------------------------------------------------------------------
// Turn type label mapping
// ---------------------------------------------------------------------------

/** Maps internal turn types to human-readable section labels. */
const TURN_LABELS: Record<string, string> = {
  user_message: 'User Message',
  assistant_output: 'Assistant Output',
  tool_call: 'Tool Invocation',
  delegation: 'Delegation',
  compaction: 'Compaction',
  error: 'Error',
  session_created: 'Session Created',
  session_idle: 'Session Idle',
}

/**
 * Resolves the display label for a turn type.
 * Falls back to title-cased version of the raw type string.
 */
function resolveTurnLabel(type: string): string {
  return TURN_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1)
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>')
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
}

function uniqueOrdered(values: string[]): string[] {
  return [...new Set(values)]
}

function extractSessionMetadata(session: SessionV3): Record<string, unknown> {
  return typeof session === 'object' && session !== null
    ? (session as unknown as Record<string, unknown>)
    : {}
}

function resolveActors(session: SessionV3): string[] {
  const metadata = extractSessionMetadata(session)
  const nestedMetadata = metadata['metadata']
  const nestedRecord =
    typeof nestedMetadata === 'object' && nestedMetadata !== null
      ? (nestedMetadata as Record<string, unknown>)
      : {}

  return uniqueOrdered([
    session.agent,
    ...readStringArray(metadata['actors']),
    ...readStringArray(metadata['participants']),
    ...readStringArray(nestedRecord['actors']),
    ...readStringArray(nestedRecord['participants']),
  ])
}

function resolveToolsUsed(session: SessionV3): string[] {
  const metadata = extractSessionMetadata(session)
  const nestedMetadata = metadata['metadata']
  const nestedRecord =
    typeof nestedMetadata === 'object' && nestedMetadata !== null
      ? (nestedMetadata as Record<string, unknown>)
      : {}

  return uniqueOrdered([
    ...readStringArray(metadata['toolsUsed']),
    ...readStringArray(metadata['toolNames']),
    ...readStringArray(metadata['tools']),
    ...readStringArray(nestedRecord['toolsUsed']),
    ...readStringArray(nestedRecord['toolNames']),
    ...readStringArray(nestedRecord['tools']),
  ])
}

function formatActors(session: SessionV3): string {
  return resolveActors(session).join(', ')
}

function formatToolsUsed(session: SessionV3): string {
  const toolsUsed = resolveToolsUsed(session)
  return toolsUsed.length > 0 ? toolsUsed.join(', ') : 'none'
}

export function getJourneyMarkdownSessionDir(sessionsDir: string, sessionId: string): string {
  return join(sessionsDir, 'journey-events', sessionId)
}

function toSessionV3(session: SessionV2): SessionV3 {
  return {
    _schema: 'session/v3',
    sessionId: session.sessionId,
    semanticSessionId: session.semanticSessionId ?? session.sessionId,
    parentSessionId: session.parentSessionId,
    lineage: session.lineage,
    purposeClass: session.purposeClass,
    agent: session.agent,
    startedAt: session.created,
    endedAt: session.status === 'active' ? null : session.updated,
    turnCount: session.counters.turnCount,
    status: session.status === 'abandoned' ? 'errored' : session.status,
    summary: '',
    keyFindings: [],
    subsessionIds: session.childSessionIds,
    resumable: session.status === 'active',
    counters: {
      userMessageCount: session.counters.userMessageCount,
      assistantOutputCount: session.counters.assistantOutputCount,
      toolCallCount: session.counters.toolCallCount,
      delegationCount: session.counters.delegationCount,
      compactionCount: session.counters.compactionCount,
    },
    toc: [],
  }
}

export async function ensureEventsMarkdown(
  sessionsDir: string,
  session: SessionV2,
): Promise<string> {
  const sessionDir = getJourneyMarkdownSessionDir(
    sessionsDir,
    session.semanticSessionId ?? session.sessionId,
  )
  const eventsPath = join(sessionDir, 'events.md')

  if (!existsSync(eventsPath)) {
    await initEventsMarkdown(sessionDir, toSessionV3(session))
  }

  return sessionDir
}

/** A single tool batch entry rendered into the journey-events markdown. */
export interface ToolBatchEntry {
  turnNumber: number
  toolName: string
  invocations: Array<{ action: string; result: string }>
}

/** A delegation record rendered into the journey-events markdown. */
export interface DelegationRecord {
  parentSessionId: string
  childSessionId: string
  actor: string
  summary: string
}

// ---------------------------------------------------------------------------
// File I/O helpers
// ---------------------------------------------------------------------------

/**
 * Ensures the session directory exists, then appends content to events.md.
 */
async function appendToEvents(sessionDir: string, content: string): Promise<void> {
  await mkdir(sessionDir, { recursive: true })
  const eventsPath = join(sessionDir, 'events.md')
  await appendFile(eventsPath, content, 'utf8')
}

/**
 * Reads the full content of events.md. Returns empty string if missing.
 */
async function readEvents(sessionDir: string): Promise<string> {
  const eventsPath = join(sessionDir, 'events.md')
  try {
    return await readFile(eventsPath, 'utf8')
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialize events.md with the session header and TOC placeholder.
 *
 * Writes the ADR-specified header block:
 * - `# Session: {semanticSessionId}` heading
 * - Metadata fields (Session ID, Parent, Lineage, Purpose, Agent, Actors,
 *   Tools Used, Status)
 * - Table of Contents placeholder with column headers
 *
 * @param sessionDir - Absolute path to the session directory
 * @param session    - SessionV3 record with header metadata
 */
export async function initEventsMarkdown(sessionDir: string, session: SessionV3): Promise<void> {
  const parentValue = session.parentSessionId ?? 'null'

  const header = [
    `# Session: ${session.semanticSessionId}`,
    '',
    `**Session ID:** ${session.sessionId}`,
    `**Parent:** ${parentValue}`,
    `**Lineage:** ${session.lineage}`,
    `**Purpose:** ${session.purposeClass}`,
    `**Agent:** ${session.agent}`,
    `**Actors:** ${formatActors(session)}`,
    `**Tools Used:** ${formatToolsUsed(session)}`,
    `**Status:** ${session.status}`,
    '',
    '---',
    '',
    '## Table of Contents',
    '',
    '| # | Timestamp | Type | Summary |',
    '|---|-----------|------|---------|',
    '',
    '---',
    '',
  ].join('\n')

  await mkdir(sessionDir, { recursive: true })
  const eventsPath = join(sessionDir, 'events.md')
  await writeFile(eventsPath, header, 'utf8')
}

/**
 * Append a turn entry to events.md.
 *
 * Renders the turn as a markdown block with:
 * - `## Turn {N} — {Label}` header
 * - Metadata fields (Timestamp, and type-specific fields)
 * - Content in a fenced or plain block
 * - Trailing `---` separator
 *
 * @param sessionDir - Absolute path to the session directory
 * @param turn       - Turn data to append
 */
export async function appendTurnToMarkdown(
  sessionDir: string,
  turn: {
    turnNumber: number
    timestamp: string
    type:
      | 'user_message'
      | 'assistant_output'
      | 'tool_call'
      | 'delegation'
      | 'compaction'
      | 'error'
      | 'session_created'
      | 'session_idle'
    content: string
    metadata?: Record<string, string>
  },
): Promise<void> {
  const label = resolveTurnLabel(turn.type)
  const lines: string[] = []

  lines.push(`## Turn ${turn.turnNumber} — ${label}`)
  lines.push('')
  lines.push(`**Timestamp:** ${turn.timestamp}`)

  // Type-specific metadata fields
  if (turn.type === 'assistant_output' && turn.metadata) {
    if (turn.metadata['model']) {
      lines.push(`**Model:** ${turn.metadata['model']}`)
    }
    if (turn.metadata['duration']) {
      lines.push(`**Duration:** ${turn.metadata['duration']}`)
    }
  }

  if (turn.type === 'tool_call' && turn.metadata) {
    if (turn.metadata['tool']) {
      lines.push(`**Tool:** ${turn.metadata['tool']}`)
    }
    if (turn.metadata['action']) {
      lines.push(`**Action:** ${turn.metadata['action']}`)
    }
  }

  lines.push('')
  lines.push(turn.content)
  lines.push('')
  lines.push('---')
  lines.push('')

  await appendToEvents(sessionDir, lines.join('\n'))
}

/**
 * Generate the Table of Contents from a SessionV3 record and rewrite
 * the TOC section in events.md.
 *
 * Reads the existing events.md, locates the `## Table of Contents` section,
 * replaces it with the new TOC rows from `session.toc`, and writes the
 * updated content back.
 *
 * @param sessionDir - Absolute path to the session directory
 * @param session    - SessionV3 record whose `toc` entries drive the TOC
 */
export async function generateTOC(sessionDir: string, session: SessionV3): Promise<void> {
  const content = await readEvents(sessionDir)
  if (!content) return

  const headerLines = [
    `# Session: ${session.semanticSessionId}`,
    '',
    `**Session ID:** ${session.sessionId}`,
    `**Parent:** ${session.parentSessionId ?? 'null'}`,
    `**Lineage:** ${session.lineage}`,
    `**Purpose:** ${session.purposeClass}`,
    `**Agent:** ${session.agent}`,
    `**Actors:** ${formatActors(session)}`,
    `**Tools Used:** ${formatToolsUsed(session)}`,
    `**Status:** ${session.status}`,
    '',
    '---',
    '',
    '## Table of Contents',
    '',
    '| # | Timestamp | Type | Summary |',
    '|---|-----------|------|---------|',
  ]

  // Build TOC rows from session.toc
  const tocRows = session.toc
    .map(
      (entry) =>
        `| ${entry.turnNumber} | ${entry.timestamp} | ${resolveTurnLabel(entry.type)} | ${escapeTableCell(entry.summary)} |`,
    )
    .join('\n')

  // Find the TOC section boundaries
  const tocHeaderStart = content.indexOf('## Table of Contents')
  if (tocHeaderStart === -1) return

  // The TOC ends at the next `---` separator after the table header row
  const tableHeaderEnd = content.indexOf('|---|-----------|------|---------|', tocHeaderStart)
  if (tableHeaderEnd === -1) return

  // Find the end of current TOC content (next --- after table header)
  const afterTableHeader = tableHeaderEnd + '|---|-----------|------|---------|'.length
  const separatorIdx = content.indexOf('\n---', afterTableHeader)
  if (separatorIdx === -1) return

  // Rebuild: refreshed header + TOC rows + everything from separator onward
  const afterSeparator = content.slice(separatorIdx)
  const newContent = headerLines.join('\n') + '\n' + tocRows + afterSeparator

  const eventsPath = join(sessionDir, 'events.md')
  await writeFile(eventsPath, newContent, 'utf8')
}

/**
 * Append a tool batch section to events.md.
 *
 * Renders the batch as a markdown table with action/result rows grouped under a
 * tool-specific heading.
 *
 * @param sessionDir - Absolute path to the session directory
 * @param batch      - Tool batch data for a single turn/tool pair
 */
export async function appendToolBatch(sessionDir: string, batch: ToolBatchEntry): Promise<void> {
  const lines = [
    `## Tool Batch: ${batch.toolName} (Turn ${batch.turnNumber})`,
    '',
    '| Action | Result |',
    '|--------|--------|',
    ...batch.invocations.map(
      (invocation) =>
        `| ${escapeTableCell(invocation.action)} | ${escapeTableCell(invocation.result)} |`,
    ),
    '',
    '---',
    '',
  ]

  await appendToEvents(sessionDir, lines.join('\n'))
}

/**
 * Append a delegation record to the Delegations section of events.md.
 *
 * Creates the section on first use, then appends a delegation block describing
 * the parent/child relationship and summary.
 *
 * @param sessionDir  - Absolute path to the session directory
 * @param delegation  - Delegation metadata to append
 */
export async function appendDelegation(
  sessionDir: string,
  delegation: DelegationRecord,
): Promise<void> {
  const content = await readEvents(sessionDir)
  const lines: string[] = []

  if (!content.includes('## Delegations')) {
    lines.push('## Delegations', '')
  }

  lines.push(`### ${delegation.parentSessionId} -> ${delegation.childSessionId}`)
  lines.push('')
  lines.push(`**Actor:** ${delegation.actor}`)
  lines.push(`**Summary:** ${delegation.summary}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  await appendToEvents(sessionDir, lines.join('\n'))
}

/**
 * Append a diagnostic entry to the Diagnostics section of events.md.
 *
 * If the Diagnostics section does not exist, it is created with table headers.
 * Each entry is appended as a row in the diagnostics table.
 *
 * @param sessionDir - Absolute path to the session directory
 * @param entry      - Diagnostic data (timestamp, level, message)
 */
export async function appendDiagnosticToMarkdown(
  sessionDir: string,
  entry: { timestamp: string; level: string; message: string },
): Promise<void> {
  const content = await readEvents(sessionDir)
  const lines: string[] = []

  if (!content.includes('## Diagnostics')) {
    lines.push('## Diagnostics', '')
  }

  lines.push(`### ${entry.timestamp} [${entry.level}]`)
  lines.push('')
  lines.push(entry.message)
  lines.push('')
  lines.push('---')
  lines.push('')

  await appendToEvents(sessionDir, lines.join('\n'))
}
