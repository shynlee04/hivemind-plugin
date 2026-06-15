/**
 * Canonical PTY runtime contracts for delegated child execution.
 *
 * These types define the request/result/session interfaces used by the PTY
 * manager, spawner, and downstream orchestration layers. They are the single
 * source of truth for PTY execution mode, spawn requests, session records,
 * and read results.
 *
 * @module pty-types
 */

// ---------------------------------------------------------------------------
// Execution mode
// ---------------------------------------------------------------------------

/** Supported execution modes for delegated child sessions. */
export type PtyExecutionMode = "pty" | "headless"

// ---------------------------------------------------------------------------
// Spawn request
// ---------------------------------------------------------------------------

/** Request payload for spawning a PTY-backed child process. */
export interface PtySpawnRequest {
  /** Shell command to execute. */
  command: string
  /** Positional arguments to the command. */
  args: string[]
  /** Working directory for the child process. */
  cwd: string
  /** Environment variables forwarded to the child process. */
  env: Record<string, string>
  /** Optional shared-session metadata for delegation/tool provenance. */
  metadata?: {
    source: "delegation" | "tool"
    title?: string
    parentSessionId?: string
    delegationId?: string
  }
  /** Initial terminal column width (optional). */
  cols?: number
  /** Initial terminal row height (optional). */
  rows?: number
}

// ---------------------------------------------------------------------------
// Session record
// ---------------------------------------------------------------------------

/** Persistent record of a PTY session's lifecycle. */
export interface PtySessionRecord {
  /** Unique session identifier. */
  id: string
  /** Chosen execution mode (may differ from request if fallback occurred). */
  mode: PtyExecutionMode
  /** Working directory the session was started in. */
  cwd: string
  /** Original command invoked for this PTY session. */
  command?: string
  /** Original args invoked for this PTY session. */
  args?: string[]
  /** Provenance marker so delegations and tools share one registry truthfully. */
  source?: "delegation" | "tool"
  /** Optional human-facing label/title. */
  title?: string
  parentSessionId?: string
  delegationId?: string
  /** Epoch timestamp (ms) when the session was created. */
  startedAt: number
  /** OS process ID of the child (when available). */
  pid?: number
  /** Exit code captured when the child process terminated. */
  exitCode?: number
  /** Signal captured when the child process terminated. */
  exitSignal?: string
  /** True when termination was explicitly requested by the user/tool surface. */
  explicitCancellation?: boolean
  /** Human-readable reason when headless fallback was chosen. */
  fallbackReason?: string
}

// ---------------------------------------------------------------------------
// Read result
// ---------------------------------------------------------------------------

/** Result of reading output from a PTY session buffer. */
export interface PtyReadResult {
  /** Captured output content. */
  content: string
  /** Byte/character offset to use for the next incremental read. */
  nextOffset: number
  /** Whether the content was truncated to fit a size limit. */
  truncated: boolean
}

// ---------------------------------------------------------------------------
// Spawn result
// ---------------------------------------------------------------------------

/** Result returned after attempting to spawn a PTY session. */
export interface PtySpawnResult {
  /** Identifier of the created PTY session. */
  sessionId: string
  /** Actual execution mode (may be headless if PTY init failed). */
  mode: PtyExecutionMode
  /** OS process ID of the child (when available). */
  pid?: number
  /** Human-readable reason when headless fallback was chosen. */
  fallbackReason?: string
}
