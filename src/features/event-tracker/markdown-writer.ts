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
import { dirname, join } from 'node:path'

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

/**
 * Resolves the actor display name for a TOC row based on event type.
 * User messages → "User", assistant → agent name, others → type label.
 */
function resolveActorFromType(type: string): string {
  if (type === 'user_message') return 'User'
  if (type === 'assistant_output') return 'Assistant'
  return resolveTurnLabel(type)
}

/**
 * Extracts tool names mentioned in a summary string for the TOC Tools column.
 * Returns the comma-separated tool references, or "—" if none found.
 */
function resolveToolsFromSummary(summary: string): string {
  // Match known tool patterns: tool names containing underscores or tool_ prefixed words
  const toolMatches = summary.match(/\b\w+_\w+\b/g)
  if (toolMatches && toolMatches.length > 0) {
    return uniqueOrdered(toolMatches).join(', ')
  }
  return '—'
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

export function getJourneyMarkdownPath(sessionsDir: string, sessionId: string): string {
  return join(sessionsDir, 'journey-events', `${sessionId}.md`)
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
  const filePath = getJourneyMarkdownPath(
    sessionsDir,
    session.semanticSessionId ?? session.sessionId,
  )

  if (!existsSync(filePath)) {
    await initEventsMarkdown(sessionsDir, toSessionV3(session))
  }

  return filePath
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
 * Ensures the markdown parent directory exists, then appends content.
 */
async function appendToEvents(filePath: string, content: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await appendFile(filePath, content, 'utf8')
}

/**
 * Reads the full content of the markdown file. Returns empty string if missing.
 */
async function readEvents(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf8')
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
 * @param sessionsDir - Absolute path to the sessions directory
 * @param session    - SessionV3 record with header metadata
 */
export async function initEventsMarkdown(sessionsDir: string, session: SessionV3): Promise<void> {
  const parentValue = session.parentSessionId ?? 'null'

  const now = new Date().toISOString()
  const header = [
    `# Session: ${session.semanticSessionId}`,
    '',
    `**Session ID:** ${session.sessionId}`,
    `**Created:** ${now}`,
    `**Updated:** ${now}`,
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
    '| # | Timestamp | Actor | Tools | Summary |',
    '|---|-----------|-------|-------|---------|',
    '',
    '---',
    '',
  ].join('\n')

  const journeyEventsDir = join(sessionsDir, 'journey-events')
  await mkdir(journeyEventsDir, { recursive: true })
  const filePath = getJourneyMarkdownPath(
    sessionsDir,
    session.semanticSessionId ?? session.sessionId,
  )
  await writeFile(filePath, header, 'utf8')
}

/**
 * Append a turn entry to events.md.
 *
 * Renders the turn in the reference format:
 * - User messages: `## User`
 * - Assistant turns: `## Assistant ({role} · {model} · {duration})`
 * - Other types: `## {Label}`
 * - Assistant content prefixed with `_Thinking:\n\n`
 * - Trailing `---` separator
 *
 * @param filePath - Absolute path to the session markdown file
 * @param turn       - Turn data to append
 */
export async function appendTurnToMarkdown(
  filePath: string,
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
  const lines: string[] = []

  // Determine section layout based on turn type
  if (turn.type === 'tool_call') {
    const toolName = turn.metadata?.['tool'] ?? 'unknown'
    const action = turn.metadata?.['action'] ?? ''
    const result = turn.content ?? ''

    lines.push(`**Tool:** ${toolName}`)
    lines.push('')
    lines.push('**Input:**')
    lines.push('```json')
    lines.push(action)
    lines.push('```')
    lines.push('')
    lines.push('**Output:**')
    lines.push('```')
    lines.push(result)
    lines.push('```')
  } else if (turn.type === 'user_message') {
    lines.push('## User')
    lines.push('')
    lines.push(turn.content)
  } else if (turn.type === 'assistant_output') {
    const role = turn.metadata?.['role'] ?? 'Assistant'
    const model = turn.metadata?.['model'] ?? ''
    const duration = turn.metadata?.['duration'] ?? ''
    const parts = [role, model, duration].filter(Boolean)
    lines.push(`## Assistant (${parts.join(' · ')})`)
    lines.push('')

    if (turn.content) {
      lines.push('_Thinking:_')
      lines.push('')
      lines.push(turn.content)
    }
  } else {
    const label = resolveTurnLabel(turn.type)
    lines.push(`## ${label}`)
    lines.push('')
    lines.push(turn.content)
  }

  lines.push('')

  lines.push('---')
  lines.push('')

  await appendToEvents(filePath, lines.join('\n'))
}

/**
 * Generate the Table of Contents from a SessionV3 record and rewrite
 * the TOC section in events.md.
 *
 * Reads the existing events.md, locates the `## Table of Contents` section,
 * replaces it with the new TOC rows from `session.toc`, and writes the
 * updated content back.
 *
 * @param filePath - Absolute path to the session markdown file
 * @param session    - SessionV3 record whose `toc` entries drive the TOC
 */
export async function generateTOC(filePath: string, session: SessionV3): Promise<void> {
  const content = await readEvents(filePath)
  if (!content) return

  const headerLines = [
    `# Session: ${session.semanticSessionId}`,
    '',
    `**Session ID:** ${session.sessionId}`,
    `**Created:** ${session.startedAt}`,
    `**Updated:** ${session.endedAt ?? new Date().toISOString()}`,
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
    '| # | Timestamp | Actor | Tools | Summary |',
    '|---|-----------|-------|-------|---------|',
  ]

  // Build TOC rows from session.toc
  const tocRows = session.toc
    .map(
      (entry) =>
        `| ${entry.turnNumber} | ${entry.timestamp} | ${escapeTableCell(resolveActorFromType(entry.type))} | ${escapeTableCell(resolveToolsFromSummary(entry.summary))} | ${escapeTableCell(entry.summary)} |`,
    )
    .join('\n')

  // Find the TOC section boundaries
  const tocHeaderStart = content.indexOf('## Table of Contents')
  if (tocHeaderStart === -1) return

  // The TOC ends at the next `---` separator after the table header row
  const tableHeaderEnd = content.indexOf('|---|-----------|------|---------|', tocHeaderStart)
  const tableHeaderEnd2 = tableHeaderEnd === -1
    ? content.indexOf('|---|-----------|-------|-------|---------|', tocHeaderStart)
    : tableHeaderEnd
  if (tableHeaderEnd2 === -1) return

  const headerRowPattern = tableHeaderEnd !== -1
    ? '|---|-----------|------|---------|'
    : '|---|-----------|-------|-------|---------|'

  // Find the end of current TOC content (next --- after table header)
  const afterTableHeader = tableHeaderEnd2 + headerRowPattern.length
  const separatorIdx = content.indexOf('\n---', afterTableHeader)
  if (separatorIdx === -1) return

  // Rebuild: refreshed header + TOC rows + everything from separator onward
  const afterSeparator = content.slice(separatorIdx)
  const newContent = headerLines.join('\n') + '\n' + tocRows + afterSeparator

  await writeFile(filePath, newContent, 'utf8')
}

/**
 * Append a tool batch section to events.md.
 *
 * Renders each invocation with Input/Output code blocks in the reference format:
 * ```
 * **Tool:** {name}
 *
 * **Input:**
 * ```json
 * {args}
 * ```
 *
 * **Output:**
 * ```
 * {result}
 * ```
 * ```
 *
 * @param filePath - Absolute path to the session markdown file
 * @param batch      - Tool batch data for a single turn/tool pair
 */
export async function appendToolBatch(filePath: string, batch: ToolBatchEntry): Promise<void> {
  const lines: string[] = []

  for (const invocation of batch.invocations) {
    lines.push(`**Tool:** ${batch.toolName}`)
    lines.push('')
    lines.push('**Input:**')
    lines.push('```json')
    lines.push(invocation.action)
    lines.push('```')
    lines.push('')
    lines.push('**Output:**')
    lines.push('```')
    lines.push(invocation.result)
    lines.push('```')
    lines.push('')
  }

  lines.push('---')
  lines.push('')

  await appendToEvents(filePath, lines.join('\n'))
}

/**
 * Append a delegation record to the Delegations section of events.md.
 *
 * Creates the section on first use, then appends a delegation block describing
 * the parent/child relationship and summary.
 *
 * @param filePath    - Absolute path to the session markdown file
 * @param delegation  - Delegation metadata to append
 */
export async function appendDelegation(
  filePath: string,
  delegation: DelegationRecord,
): Promise<void> {
  const content = await readEvents(filePath)
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

  await appendToEvents(filePath, lines.join('\n'))
}

/**
 * Update the `**Updated:**` timestamp field in the events.md file.
 *
 * Replaces the existing Updated field value with the current ISO timestamp.
 * This should be called whenever new content is appended to the session journal.
 *
 * @param filePath - Absolute path to the session markdown file
 */
export async function updateSessionTimestamp(filePath: string): Promise<void> {
  const content = await readEvents(filePath)
  if (!content) return

  const now = new Date().toISOString()
  const updatedPattern = /\*\*Updated:\*\* .+/
  const newContent = content.replace(updatedPattern, `**Updated:** ${now}`)

  await writeFile(filePath, newContent, 'utf8')
}

/**
 * Append a diagnostic entry to the Diagnostics section of events.md.
 *
 * If the Diagnostics section does not exist, it is created with table headers.
 * Each entry is appended as a row in the diagnostics table.
 *
 * @param filePath - Absolute path to the session markdown file
 * @param entry      - Diagnostic data (timestamp, level, message)
 */
export async function appendDiagnosticToMarkdown(
  filePath: string,
  entry: { timestamp: string; level: string; message: string },
): Promise<void> {
  const content = await readEvents(filePath)
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

  await appendToEvents(filePath, lines.join('\n'))
}
