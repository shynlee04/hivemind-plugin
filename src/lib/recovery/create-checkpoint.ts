/**
 * @fileoverview Recovery checkpoint creator (REC-03).
 *
 * Captures a snapshot of canonical harness state under
 * `.hivemind/state/checkpoints/` so callers can later restore the session
 * via {@link ../recovery-engine.ts | recovery-engine.repair}.
 *
 * @module recovery/create-checkpoint
 */

import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { assertPathWithinRoot } from "../security/path-scope.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Persisted recovery checkpoint metadata.
 */
export interface RecoveryCheckpoint {
  /** Session identifier the checkpoint was created for. */
  readonly sessionId: string
  /** ISO-8601 timestamp of checkpoint creation. */
  readonly timestamp: string
  /** Absolute path to the snapshot JSON on disk. */
  readonly snapshotPath: string
  /** Schema version of the checkpoint payload. */
  readonly stateVersion: string
}

// ---------------------------------------------------------------------------
// createRecoveryCheckpoint
// ---------------------------------------------------------------------------

const CONTINUITY_FILE = "session-continuity.json"
const CHECKPOINT_DIR = "checkpoints"
const CHECKPOINT_VERSION = "1"

/**
 * Capture a recovery checkpoint for `sessionId`.
 *
 * Reads canonical state files under `.hivemind/state/` and writes a
 * timestamped snapshot to `.hivemind/state/checkpoints/`.
 *
 * @param sessionId - Session identifier to label the checkpoint with.
 * @param projectRoot - Trusted project root that owns `.hivemind/state`.
 * @returns Metadata describing the persisted checkpoint.
 *
 * @example
 * ```typescript
 * const checkpoint = await createRecoveryCheckpoint('sess-abc', '/repo')
 * // checkpoint.snapshotPath -> /repo/.hivemind/state/checkpoints/sess-abc-...json
 * ```
 */
export async function createRecoveryCheckpoint(
  sessionId: string,
  projectRoot: string,
): Promise<RecoveryCheckpoint> {
  assertSafeSessionId(sessionId)

  const stateDir = resolve(projectRoot, ".hivemind", "state")
  const checkpointDir = assertPathWithinRoot(stateDir, CHECKPOINT_DIR, "recovery checkpoint dir")
  mkdirSync(checkpointDir, { recursive: true })

  const continuityPath = assertPathWithinRoot(stateDir, CONTINUITY_FILE, "continuity state")
  const snapshot = readContinuitySnapshot(continuityPath)

  const timestamp = new Date().toISOString()
  const fileName = formatCheckpointFileName(sessionId, timestamp)
  const snapshotPath = assertPathWithinRoot(checkpointDir, fileName, "recovery checkpoint")

  const payload = {
    sessionId,
    timestamp,
    stateVersion: CHECKPOINT_VERSION,
    snapshot,
  }

  writeCheckpointAtomically(snapshotPath, payload)

  return {
    sessionId,
    timestamp,
    snapshotPath,
    stateVersion: CHECKPOINT_VERSION,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertSafeSessionId(sessionId: string): void {
  if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
    throw new Error("[Harness] recovery REC-03: sessionId must be a non-empty string")
  }
  if (sessionId.includes("/") || sessionId.includes("\\") || sessionId.includes("..")) {
    throw new Error("[Harness] recovery REC-03: sessionId must not contain path separators or '..'")
  }
}

interface ContinuitySnapshot {
  readonly sessions: Record<string, unknown>
  readonly raw: unknown
}

function readContinuitySnapshot(continuityPath: string): ContinuitySnapshot {
  if (!existsSync(continuityPath)) {
    return { sessions: {}, raw: null }
  }
  try {
    const parsed = JSON.parse(readFileSync(continuityPath, "utf-8")) as unknown
    return {
      sessions: extractSessions(parsed),
      raw: parsed,
    }
  } catch {
    return { sessions: {}, raw: null }
  }
}

function extractSessions(parsed: unknown): Record<string, unknown> {
  if (typeof parsed !== "object" || parsed === null) return {}
  const sessions = (parsed as { sessions?: unknown }).sessions
  if (typeof sessions !== "object" || sessions === null) return {}
  return sessions as Record<string, unknown>
}

function formatCheckpointFileName(sessionId: string, timestamp: string): string {
  const safeTimestamp = timestamp.replace(/[:.]/g, "-")
  const suffix = randomUUID().slice(0, 8)
  return `${sessionId}-${safeTimestamp}-${suffix}.json`
}

function writeCheckpointAtomically(snapshotPath: string, payload: unknown): void {
  const tmpPath = `${snapshotPath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8")
  renameSync(tmpPath, snapshotPath)
}
