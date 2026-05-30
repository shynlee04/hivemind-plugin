/**
 * Canonical spawner contracts for delegated child sessions.
 *
 * These types define the request/result interfaces used by the spawner
 * subsystem to create background child sessions with bounded permissions.
 * The spawner owns session construction, PTY setup, and working-directory
 * resolution — it does NOT own completion detection or lifecycle coordination.
 *
 * @module spawner-types
 */

import type { PtyExecutionMode } from "../../features/background-command/pty/pty-types.js"

export type DelegationExecutionMode = "sdk" | PtyExecutionMode

// ---------------------------------------------------------------------------
// Permission profiles
// ---------------------------------------------------------------------------

/**
 * Permission profile for delegated child sessions.
 *
 * Profiles are derived from selected agent primitive permission metadata when
 * available, then conservatively reduced by task intent. Unknown agents fall
 * back to read-only tools instead of broad write-capable defaults.
 */
export interface DelegationPermissionProfile {
  /** Coarse permission posture used for reporting and tests. */
  mode: "read-only" | "review-only" | "write-capable"
  /** Prompt-time OpenCode tool identifiers allowed for the child session. */
  tools: readonly string[]
}

// ---------------------------------------------------------------------------
// Spawn request
// ---------------------------------------------------------------------------

/**
 * Request payload for spawning a delegated child session.
 *
 * The spawner uses this to create a parent-linked child session with the
 * specified execution mode, safety ceiling, and permission profile.
 */
export interface DelegationSpawnRequest {
  /** Session ID of the parent that initiated the delegation. */
  parentSessionId: string
  /** Agent name to use for the child session. */
  agent: string
  /** Human-readable title for the delegated task. */
  title: string
  /** Prompt text to send to the child session. */
  prompt: string
  /** Working directory for the child session. */
  workingDirectory: string
  /** Execution mode: PTY by default, headless as fallback. */
  executionMode: DelegationExecutionMode
  /** Permission profile controlling the child's tool access. */
  permissionProfile: DelegationPermissionProfile
}

// ---------------------------------------------------------------------------
// Spawn result
// ---------------------------------------------------------------------------

/**
 * Result returned after a delegated child session has been spawned.
 *
 * Captures the execution mode that was actually used (which may differ from
 * the request if PTY initialization failed and headless fallback was chosen).
 */
export interface DelegationSpawnResult {
  /** Session ID of the created child session. */
  childSessionId: string
  /** Actual execution mode used for this delegation. */
  executionMode: DelegationExecutionMode
  /** Working directory the child session was started in. */
  workingDirectory: string
  /** PTY session ID (when PTY mode was used). */
  ptySessionId?: string
  /** Human-readable reason when headless fallback was chosen. */
  fallbackReason?: string
}
