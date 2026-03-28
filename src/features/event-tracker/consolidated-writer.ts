/**
 * Consolidated Session Writer
 *
 * Produces a single JSON file per session using the v2 schema format.
 * All writes are atomic (write to temp, then rename) to prevent corruption.
 *
 * @module event-tracker/consolidated-writer
 */

import { mkdir, readFile, readdir, rename, symlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PurposeClass, SessionV3 } from './types.js'

// ============================================================================
// Types
// ============================================================================

/**
 * Session v2 schema — the consolidated session file format.
 * Single JSON file that contains all session data.
 */
export interface SessionV2 {
  _schema: 'session/v2'
  sessionId: string
  /** The semantic session ID used as the filename. */
  semanticSessionId?: string
  /** The original SDK session ID, stored for lookup when filenames are semantic. */
  sdkSessionId?: string
  lineage: 'hivefiver' | 'hiveminder'
  purposeClass:
    | 'discovery'
    | 'brainstorming'
    | 'research'
    | 'planning'
    | 'implementation'
    | 'gatekeeping'
    | 'tdd'
    | 'course-correction'
  agent: string
  created: string
  updated: string
  status: 'active' | 'completed' | 'abandoned'
  parentSessionId: string | null
  childSessionIds: string[]
  counters: {
    userMessageCount: number
    assistantOutputCount: number
    toolCallCount: number
    delegationCount: number
    compactionCount: number
    turnCount: number
  }
  turns: unknown[]
  events: unknown[]
  diagnostics: unknown[]
}

/**
 * Input for initializing a new consolidated session.
 */
export interface InitSessionInput {
  lineage: 'hivefiver' | 'hiveminder'
  /** The original SDK session ID for cross-referencing. */
  sdkSessionId?: string
  purposeClass:
    | 'discovery'
    | 'brainstorming'
    | 'research'
    | 'planning'
    | 'implementation'
    | 'gatekeeping'
    | 'tdd'
    | 'course-correction'
  agent: string
  parentSessionId?: string | null
}

/**
 * Input for initializing a new consolidated session V3.
 */
export interface InitSessionV3Input {
  lineage: 'hivefiver' | 'hiveminder'
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
 * Generate a session ID in the format: ses_YYYY-MM-DDTHHmmss_<purpose>_<agent>
 * @internal
 */
function generateSessionId(
  purposeClass: InitSessionInput['purposeClass'],
  agent: string
): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const isoDate = `${year}-${month}-${day}T${hour}${minute}${second}`
  return `ses_${isoDate}_${purposeClass}_${agent}`
}

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

/**
 * Update a session file using a modifier function.
 * Encapsulates the read-modify-write pattern with atomic persistence.
 * @internal
 */
async function modifySession(
  sessionDir: string,
  sessionId: string,
  modifier: (session: SessionV2) => void
): Promise<void> {
  const session = await loadSession(sessionDir, sessionId)
  modifier(session)
  session.updated = new Date().toISOString()
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
 * // Returns: '/sessions/ses_2026-03-25T120000_implementation_hitea.json'
 */
export function getSessionPath(sessionDir: string, sessionId: string): string {
  return join(sessionDir, `${sessionId}.json`)
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
): Promise<SessionV2> {
  const filePath = getSessionPath(sessionDir, sessionId)
  const content = await readFile(filePath, 'utf8')
  return JSON.parse(content) as SessionV2
}

/**
 * Find a session file by its SDK session ID.
 * Scans all .json files in the session directory and returns the
 * semantic session ID whose file contains a matching `sdkSessionId` field.
 *
 * @param sessionDir - Directory containing session files
 * @param sdkSessionId - The SDK session ID to search for
 * @returns The semantic session ID if found, or null
 *
 * @example
 * const semanticId = await findSessionBySdkId('/sessions', 'ses_test_001')
 * // Returns: 'ses_2026-03-25T120000_implementation_hiveminder' or null
 */
export async function findSessionBySdkId(
  sessionDir: string,
  sdkSessionId: string
): Promise<string | null> {
  try {
    const files = await readdir(sessionDir)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      try {
        const content = await readFile(join(sessionDir, file), 'utf8')
        const session = JSON.parse(content) as SessionV2
        if (session.sdkSessionId === sdkSessionId) {
          return session.semanticSessionId ?? session.sessionId
        }
      } catch {
        // Skip corrupted files
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
  return null
}

/**
 * Create a backwards-compatibility symlink from SDK session ID to semantic filename.
 * This allows tests and code that reference `${sdkId}.json` to find the semantic file.
 *
 * @param sessionDir - Directory containing session files
 * @param sdkSessionId - The SDK session ID (used as symlink name)
 * @param semanticSessionId - The semantic session ID (target of symlink)
 *
 * @example
 * await createSdkSymlink('/sessions', 'ses_test_001', 'ses_2026-03-25T120000_implementation_hiveminder_ses_test_001')
 * // Creates: /sessions/ses_test_001.json → /sessions/ses_2026-03-25T120000_implementation_hiveminder_ses_test_001.json
 */
export async function createSdkSymlink(
  sessionDir: string,
  sdkSessionId: string,
  semanticSessionId: string
): Promise<void> {
  if (sdkSessionId === semanticSessionId) return

  const sdkPath = getSessionPath(sessionDir, sdkSessionId)
  const semanticFilename = `${semanticSessionId}.json`

  try {
    await symlink(semanticFilename, sdkPath)
  } catch {
    // Symlink already exists or error — ignore
  }
}

// ============================================================================
// Public API - Write Operations
// ============================================================================

/**
 * Initialize a new consolidated session file.
 *
 * Creates a new session with v2 schema format, zero-initialized counters,
 * and empty arrays for turns, events, and diagnostics.
 *
 * When `sdkSessionId` is provided, it is appended to the semantic filename
 * to enable discovery (e.g., `ses_<timestamp>_<purpose>_<agent>_<sdkId>.json`).
 *
 * @param sessionDir - Directory to store session files (created if needed)
 * @param input - Session initialization parameters
 * @returns The generated session ID
 *
 * @example
 * const sessionId = await initSession('/sessions', {
 *   lineage: 'hiveminder',
 *   purposeClass: 'implementation',
 *   agent: 'hitea'
 * })
 * // Returns: 'ses_2026-03-25T120000_implementation_hitea'
 *
 * @example
 * const sessionId = await initSession('/sessions', {
 *   lineage: 'hiveminder',
 *   purposeClass: 'implementation',
 *   agent: 'hitea',
 *   sdkSessionId: 'ses_test_001'
 * })
 * // Returns: 'ses_2026-03-25T120000_implementation_hitea_ses_test_001'
 */
export async function initSession(
  sessionDir: string,
  input: InitSessionInput
): Promise<string> {
  await ensureDir(sessionDir)

  const semanticName = generateSessionId(input.purposeClass, input.agent)
  let filename = semanticName
  if (input.sdkSessionId) {
    filename = `${semanticName}_${input.sdkSessionId}`
  }
  const now = new Date().toISOString()

  const session: SessionV2 = {
    _schema: 'session/v2',
    sessionId: input.sdkSessionId ?? filename,
    semanticSessionId: filename,
    sdkSessionId: input.sdkSessionId,
    lineage: input.lineage,
    purposeClass: input.purposeClass,
    agent: input.agent,
    created: now,
    updated: now,
    status: 'active',
    parentSessionId: input.parentSessionId ?? null,
    childSessionIds: [],
    counters: {
      userMessageCount: 0,
      assistantOutputCount: 0,
      toolCallCount: 0,
      delegationCount: 0,
      compactionCount: 0,
      turnCount: 0,
    },
    turns: [],
    events: [],
    diagnostics: [],
  }

  const filePath = getSessionPath(sessionDir, filename)
  await atomicWrite(filePath, JSON.stringify(session, null, 2))

  return filename
}

/**
 * Add a turn to the session.
 *
 * Appends the turn to the turns array and increments turnCount.
 * Also increments userMessageCount and assistantOutputCount if content is present.
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
    session.turns.push(input.turn)
    session.counters.turnCount++

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
 * Appends the event to the events array for tracking tool invocations,
 * delegations, and other session events.
 *
 * @param sessionDir - Directory containing session files
 * @param input - Event data with sessionId and event details
 *
 * @example
 * await addEvent('/sessions', {
 *   sessionId: 'ses_2026-03-25T120000_implementation_hitea',
 *   event: {
 *     turnNumber: 1,
 *     type: 'tool_invocation',
 *     importance: 'medium',
 *     timestamp: new Date().toISOString(),
 *     data: { toolName: 'hivemind_task', action: 'create' }
 *   }
 * })
 */
export async function addEvent(
  sessionDir: string,
  input: AddEventInput
): Promise<void> {
  await modifySession(sessionDir, input.sessionId, (session) => {
    session.events.push(input.event)
  })
}

/**
 * Add a diagnostic entry to the session.
 *
 * Appends diagnostic information for debugging and monitoring purposes.
 *
 * @param sessionDir - Directory containing session files
 * @param input - Diagnostic data with sessionId and diagnostic details
 *
 * @example
 * await addDiagnostic('/sessions', {
 *   sessionId: 'ses_2026-03-25T120000_implementation_hitea',
 *   diagnostic: {
 *     timestamp: new Date().toISOString(),
 *     level: 'warn',
 *     message: 'Rate limit approaching',
 *     context: { remainingCalls: 10 }
 *   }
 * })
 */
export async function addDiagnostic(
  sessionDir: string,
  input: AddDiagnosticInput
): Promise<void> {
  await modifySession(sessionDir, input.sessionId, (session) => {
    session.diagnostics.push(input.diagnostic)
  })
}

/**
 * Increment a counter in the session.
 *
 * Updates the specified counter by the given amount (default: 1).
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
    session.counters[counter] += amount
  })
}

/**
 * Update the session status.
 *
 * Changes the session status to active, completed, or abandoned.
 *
 * @param sessionDir - Directory containing session files
 * @param sessionId - Session identifier
 * @param status - New status value
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
    session.status = status
  })
}

/**
 * Link a child session to a parent session.
 *
 * Updates both sessions: adds childSessionId to parent's childSessionIds array,
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
    parent.childSessionIds.push(childSessionId)
  })

  // Update child to reference parent
  await modifySession(sessionDir, childSessionId, (child) => {
    child.parentSessionId = parentSessionId
  })
}

// ============================================================================
// Public API - V3 Write Operations (ADR-017)
// ============================================================================

/**
 * Initialize a new consolidated session using the V3 directory-based schema.
 *
 * Creates a directory `{semanticSessionId}/` containing `session.json` with
 * the V3 schema format. When `parentSessionId` is set, the directory is
 * created under `{parentDir}/subsessions/{childSemanticId}/` instead.
 *
 * @param sessionsDir - Root directory for all session directories
 * @param input - Session initialization parameters
 * @returns The generated semantic session ID
 *
 * @example
 * const id = await initSessionV3('/sessions', {
 *   lineage: 'hiveminder',
 *   purposeClass: 'implementation',
 *   agent: 'hitea',
 * })
 * // Creates: /sessions/ses_2026-03-27T120000_implementation_hitea/session.json
 * // Returns: 'ses_2026-03-27T120000_implementation_hitea'
 */
export async function initSessionV3(
  sessionsDir: string,
  input: InitSessionV3Input
): Promise<string> {
  const semanticSessionId = generateSessionId(input.purposeClass, input.agent)
  const now = new Date().toISOString()

  // Determine directory path: root or subsession
  let sessionDir: string
  if (input.parentSessionId) {
    sessionDir = join(
      sessionsDir,
      input.parentSessionId,
      'subsessions',
      semanticSessionId
    )
  } else {
    sessionDir = join(sessionsDir, semanticSessionId)
  }

  await mkdir(sessionDir, { recursive: true })

  const session: SessionV3 = {
    _schema: 'session/v3',
    sessionId: semanticSessionId,
    semanticSessionId,
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

  const filePath = join(sessionDir, 'session.json')
  await atomicWrite(filePath, JSON.stringify(session, null, 2))

  return semanticSessionId
}