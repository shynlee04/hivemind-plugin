/**
 * Consolidated Session Writer
 *
 * Produces a single JSON file per session using the V3 schema (ADR-017).
 * All writes are atomic (write to temp, then rename) to prevent corruption.
 *
 * @module event-tracker/consolidated-writer
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Lineage, PurposeClass, SessionV3 } from './types.js'
import { appendHierarchyLink } from '../session-journal/hierarchy-writer.js'

// ============================================================================
// Types
// ============================================================================

/**
 * Input for initializing a new consolidated session (V3 schema).
 */
export interface InitSessionInput {
  sessionId: string
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  parentSessionId?: string | null
}

/**
 * Input for adding a turn to the session.
 */
export interface AddTurnInput {
  sessionId: string
  turn: {
    turnNumber: number
    timestamp: string
    agent: string
    model: string
    duration: number | null
    userMessage: string
    assistantContent: string
  }
}

/**
 * Input for adding an event to the session.
 */
export interface AddEventInput {
  sessionId: string
  event: {
    turnNumber: number
    type: string
    importance: 'high' | 'medium' | 'low'
    timestamp: string
    data: Record<string, unknown>
  }
}

/**
 * Input for adding a diagnostic to the session.
 */
export interface AddDiagnosticInput {
  sessionId: string
  diagnostic: {
    timestamp: string
    level: 'info' | 'warn' | 'error'
    message: string
    context?: Record<string, unknown>
  }
}

/**
 * Counter increment specification.
 * In V3, `turnCount` is a top-level field; others live in `counters`.
 */
export type CounterType =
  | 'userMessageCount'
  | 'assistantOutputCount'
  | 'toolCallCount'
  | 'delegationCount'
  | 'compactionCount'
  | 'turnCount'

// ============================================================================
// Internal Utilities
// ============================================================================

/**
 * Write data to a temp file, then rename to target path.
 * Ensures atomic write operation to prevent corruption.
 * @internal
 */
async function atomicWrite(filePath: string, data: string): Promise<void> {
  const tempPath = `${filePath}.tmp`
  await writeFile(tempPath, data, 'utf8')
  await rename(tempPath, filePath)
}

/**
 * Create directory if it doesn't exist.
 * @internal
 */
async function ensureDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true })
  } catch {
    // Directory exists, ignore
  }
}

function getJourneyEventsDir(sessionDir: string): string {
  return join(sessionDir, 'journey-events')
}

function getLegacySessionPath(sessionDir: string, sessionId: string): string {
  return join(sessionDir, `${sessionId}.json`)
}

function getJourneyEventSessionPath(sessionDir: string, sessionId: string): string {
  return join(getJourneyEventsDir(sessionDir), `${sessionId}.json`)
}

/**
 * Update a session file using a modifier function.
 * Encapsulates the read-modify-write pattern with atomic persistence.
 * @internal
 */
async function modifySession(
  sessionDir: string,
  sessionId: string,
  modifier: (session: SessionV3) => void
): Promise<void> {
  const session = await loadSession(sessionDir, sessionId)
  modifier(session)
  const filePath = getSessionPath(sessionDir, sessionId)
  await atomicWrite(filePath, JSON.stringify(session, null, 2))
}

// ============================================================================
// Public API - Read Operations
// ============================================================================

/**
 * Get the file path for a session file.
 *
 * @param sessionDir - Directory containing session files
 * @param sessionId - Session identifier
 * @returns Full path to the session JSON file
 *
 * @example
 * const path = getSessionPath('/sessions', 'ses_2026-03-25T120000_implementation_hitea')
 * // Returns: '/sessions/journey-events/ses_2026-03-25T120000_implementation_hitea.json'
 */
export function getSessionPath(sessionDir: string, sessionId: string): string {
  return getJourneyEventSessionPath(sessionDir, sessionId)
}

/**
 * Load a session from disk.
 *
 * @param sessionDir - Directory containing session files
 * @param sessionId - Session identifier
 * @returns Parsed session data
 * @throws Error if file doesn't exist or contains invalid JSON
 *
 * @example
 * const session = await loadSession('/sessions', 'ses_2026-03-25T120000_implementation_hitea')
 * console.log(session.status) // 'active'
 */
export async function loadSession(
  sessionDir: string,
  sessionId: string
): Promise<SessionV3> {
  try {
    const content = await readFile(getSessionPath(sessionDir, sessionId), 'utf8')
    return JSON.parse(content) as SessionV3
  } catch (error) {
    const legacyPath = getLegacySessionPath(sessionDir, sessionId)
    if (!existsSync(legacyPath)) {
      throw error
    }

    const content = await readFile(legacyPath, 'utf8')
    return JSON.parse(content) as SessionV3
  }
}

/**
 * Find a session file by its SDK session ID.
 * Since filenames are SDK IDs, this simply checks if the file exists.
 *
 * @param sessionDir - Directory containing session files
 * @param sdkSessionId - The SDK session ID to search for
 * @returns The session ID if the file exists, or null
 *
 * @example
 * const sessionId = await findSessionBySdkId('/sessions', 'ses_test_001')
 * // Returns: 'ses_test_001' or null
 */
export async function findSessionBySdkId(
  sessionDir: string,
  sdkSessionId: string
): Promise<string | null> {
  const filePath = getJourneyEventSessionPath(sessionDir, sdkSessionId)
  if (existsSync(filePath)) {
    return sdkSessionId
  }
  return null
}

// ============================================================================
// Public API - Write Operations (V3 schema)
// ============================================================================

/**
 * Initialize a new consolidated session file.
 *
 * Creates a new session with V3 schema format, zero-initialized counters,
 * and empty table of contents.
 *
 * @param sessionDir - Directory to store session files (created if needed)
 * @param input - Session initialization parameters
 * @returns The generated semantic session ID
 *
 * @example
 * const sessionId = await initSession('/sessions', {
 *   lineage: 'hiveminder',
 *   purposeClass: 'implementation',
 *   agent: 'hitea',
 * })
 * // Returns: 'ses_2026-03-25T120000_implementation_hitea'
 */
export async function initSession(
  sessionDir: string,
  input: InitSessionInput
): Promise<string> {
  const sessionId = input.sessionId
  const now = new Date().toISOString()

  await ensureDir(getJourneyEventsDir(sessionDir))

  const session: SessionV3 = {
    _schema: 'session/v3',
    sessionId,
    semanticSessionId: sessionId,
    parentSessionId: input.parentSessionId ?? null,
    lineage: input.lineage,
    purposeClass: input.purposeClass,
    agent: input.agent,
    startedAt: now,
    endedAt: null,
    turnCount: 0,
    status: 'active',
    summary: '',
    keyFindings: [],
    subsessionIds: [],
    resumable: false,
    counters: {
      userMessageCount: 0,
      assistantOutputCount: 0,
      toolCallCount: 0,
      delegationCount: 0,
      compactionCount: 0,
    },
    toc: [],
  }

  const filePath = getJourneyEventSessionPath(sessionDir, sessionId)
  await atomicWrite(filePath, JSON.stringify(session, null, 2))

  return sessionId
}

/**
 * Add a turn to the session.
 *
 * Increments turnCount and relevant counters. V3 does not store turn bodies
 * in the session file; counters track aggregate statistics.
 *
 * @param sessionDir - Directory containing session files
 * @param input - Turn data with sessionId and turn details
 *
 * @example
 * await addTurn('/sessions', {
 *   sessionId: 'ses_2026-03-25T120000_implementation_hitea',
 *   turn: {
 *     turnNumber: 1,
 *     timestamp: new Date().toISOString(),
 *     agent: 'hitea',
 *     model: 'gpt-4',
 *     duration: 1500,
 *     userMessage: 'Write tests',
 *     assistantContent: 'I will write TDD tests...'
 *   }
 * })
 */
export async function addTurn(
  sessionDir: string,
  input: AddTurnInput
): Promise<void> {
  await modifySession(sessionDir, input.sessionId, (session) => {
    session.turnCount++

    if (input.turn.userMessage && input.turn.userMessage.length > 0) {
      session.counters.userMessageCount++
    }

    if (input.turn.assistantContent && input.turn.assistantContent.length > 0) {
      session.counters.assistantOutputCount++
    }
  })
}

/**
 * Add an event to the session.
 *
 * In V3, events are not stored in the session file. This function is a no-op
 * kept for API compatibility during migration.
 *
 * @param _sessionDir - Directory containing session files (unused in V3)
 * @param _input - Event data (unused in V3)
 */
export async function addEvent(
  _sessionDir: string,
  _input: AddEventInput
): Promise<void> {
  // V3 does not store events in-session; events go to separate files.
  // Kept as no-op for API compatibility.
}

/**
 * Add a diagnostic entry to the session.
 *
 * In V3, diagnostics are not stored in the session file. This function is a no-op
 * kept for API compatibility during migration.
 *
 * @param _sessionDir - Directory containing session files (unused in V3)
 * @param _input - Diagnostic data (unused in V3)
 */
export async function addDiagnostic(
  _sessionDir: string,
  _input: AddDiagnosticInput
): Promise<void> {
  // V3 does not store diagnostics in-session.
  // Kept as no-op for API compatibility.
}

/**
 * Increment a counter in the session.
 *
 * Updates the specified counter by the given amount (default: 1).
 * For `turnCount`, updates the top-level field; for others, updates `counters`.
 *
 * @param sessionDir - Directory containing session files
 * @param sessionId - Session identifier
 * @param counter - Counter type to increment
 * @param amount - Amount to add (default: 1)
 *
 * @example
 * // Increment by 1
 * await incrementCounter('/sessions', sessionId, 'toolCallCount')
 *
 * // Increment by custom amount
 * await incrementCounter('/sessions', sessionId, 'delegationCount', 5)
 */
export async function incrementCounter(
  sessionDir: string,
  sessionId: string,
  counter: CounterType,
  amount: number = 1
): Promise<void> {
  await modifySession(sessionDir, sessionId, (session) => {
    if (counter === 'turnCount') {
      session.turnCount += amount
    } else {
      session.counters[counter] += amount
    }
  })
}

/**
 * Update the session status.
 *
 * Changes the session status. When status is no longer 'active',
 * sets `endedAt` to the current time.
 *
 * @param sessionDir - Directory containing session files
 * @param sessionId - Session identifier
 * @param status - New status value ('abandoned' maps to 'errored' in V3)
 *
 * @example
 * await updateStatus('/sessions', sessionId, 'completed')
 */
export async function updateStatus(
  sessionDir: string,
  sessionId: string,
  status: 'active' | 'completed' | 'abandoned'
): Promise<void> {
  await modifySession(sessionDir, sessionId, (session) => {
    session.status = status === 'abandoned' ? 'errored' : status
    if (session.status !== 'active') {
      session.endedAt = new Date().toISOString()
    }
  })
}

/**
 * Link a child session to a parent session.
 *
 * Updates both sessions: adds childSessionId to parent's subsessionIds array,
 * and sets parentSessionId on the child.
 *
 * @param sessionDir - Directory containing session files
 * @param parentSessionId - Parent session identifier
 * @param childSessionId - Child session identifier
 *
 * @example
 * await linkSubSession('/sessions', parentSessionId, childSessionId)
 */
export async function linkSubSession(
  sessionDir: string,
  parentSessionId: string,
  childSessionId: string
): Promise<void> {
  // Update parent to include child
  await modifySession(sessionDir, parentSessionId, (parent) => {
    if (!parent.subsessionIds.includes(childSessionId)) {
      parent.subsessionIds.push(childSessionId)
    }
  })

  // Update child to reference parent
  await modifySession(sessionDir, childSessionId, (child) => {
    child.parentSessionId = parentSessionId
  })

  // Derive projectRoot from sessionDir (sessionDir = join(projectRoot, '.hivemind', 'sessions'))
  const projectRoot = dirname(dirname(sessionDir))
  await appendHierarchyLink(projectRoot, parentSessionId, childSessionId)
}
