/**
 * @fileoverview Recovery state repairer (REC-04).
 *
 * Repairs corrupted or inconsistent canonical harness state under
 * `.hivemind/state/`. Two strategies are supported:
 *  - `quarantine-and-reset` — move the corrupt continuity file aside and
 *    write a fresh empty store.
 *  - `checkpoint` — restore the continuity store from a snapshot produced by
 *    {@link ./create-checkpoint.ts | createRecoveryCheckpoint}.
 *
 * @module recovery/repair-state
 */

import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

import { assertPathWithinRoot } from "../security/path-scope.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type RepairStatus = "repaired" | "noop" | "failed"
export type RepairSource = "checkpoint" | "quarantine-and-reset" | "none"

export interface RepairOptions {
  readonly sessionId: string
  readonly projectRoot: string
  /** Optional checkpoint to restore from. Must live inside `.hivemind/state/`. */
  readonly checkpointPath?: string
}

export interface RepairResult {
  readonly status: RepairStatus
  readonly recoveredFrom: RepairSource
  readonly repairedFiles: readonly string[]
  readonly errors?: readonly string[]
}

// ---------------------------------------------------------------------------
// repairRecoveryState
// ---------------------------------------------------------------------------

const CONTINUITY_FILE = "session-continuity.json"
const STORE_VERSION = 1 as const

/**
 * Repair canonical harness state for a session.
 *
 * @param options - Repair inputs (session, project root, optional checkpoint).
 * @returns Repair result describing what changed.
 *
 * @example
 * ```typescript
 * const result = await repairRecoveryState({ sessionId: 'sess', projectRoot })
 * if (result.status === 'repaired') { ... }
 * ```
 */
export async function repairRecoveryState(options: RepairOptions): Promise<RepairResult> {
  const { sessionId, projectRoot, checkpointPath } = options
  if (!sessionId || sessionId.trim().length === 0) {
    throw new Error("[Harness] recovery REC-04: sessionId must be a non-empty string")
  }

  const stateDir = resolve(projectRoot, ".hivemind", "state")
  mkdirSync(stateDir, { recursive: true })
  const continuityPath = assertPathWithinRoot(stateDir, CONTINUITY_FILE, "continuity state")

  if (checkpointPath !== undefined) {
    return restoreFromCheckpoint({ checkpointPath, stateDir, continuityPath })
  }

  return repairContinuityIfCorrupt(continuityPath)
}

// ---------------------------------------------------------------------------
// Strategy: restore from a recovery checkpoint
// ---------------------------------------------------------------------------

interface CheckpointPayload {
  sessionId: string
  timestamp: string
  stateVersion: string
  snapshot: { sessions?: Record<string, unknown> }
}

function restoreFromCheckpoint(args: {
  checkpointPath: string
  stateDir: string
  continuityPath: string
}): RepairResult {
  let resolvedCheckpoint: string
  try {
    resolvedCheckpoint = assertPathWithinRoot(args.stateDir, args.checkpointPath, "recovery checkpoint")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[Harness] recovery REC-04: invalid checkpoint path — ${message}`)
  }

  if (!existsSync(resolvedCheckpoint)) {
    return {
      status: "failed",
      recoveredFrom: "none",
      repairedFiles: [],
      errors: [`checkpoint not found: ${resolvedCheckpoint}`],
    }
  }

  let payload: CheckpointPayload
  try {
    const raw = JSON.parse(readFileSync(resolvedCheckpoint, "utf-8")) as unknown
    payload = normalizeCheckpoint(raw)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      status: "failed",
      recoveredFrom: "none",
      repairedFiles: [],
      errors: [`failed to parse checkpoint: ${message}`],
    }
  }

  writeContinuityAtomically(args.continuityPath, {
    version: STORE_VERSION,
    sessions: payload.snapshot.sessions ?? {},
  })

  return {
    status: "repaired",
    recoveredFrom: "checkpoint",
    repairedFiles: [CONTINUITY_FILE],
  }
}

function normalizeCheckpoint(raw: unknown): CheckpointPayload {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("checkpoint payload is not an object")
  }
  const candidate = raw as Partial<CheckpointPayload>
  return {
    sessionId: typeof candidate.sessionId === "string" ? candidate.sessionId : "",
    timestamp: typeof candidate.timestamp === "string" ? candidate.timestamp : new Date().toISOString(),
    stateVersion: typeof candidate.stateVersion === "string" ? candidate.stateVersion : String(STORE_VERSION),
    snapshot: typeof candidate.snapshot === "object" && candidate.snapshot !== null
      ? { sessions: extractSessions(candidate.snapshot as { sessions?: unknown }) }
      : { sessions: {} },
  }
}

function extractSessions(value: { sessions?: unknown }): Record<string, unknown> {
  if (typeof value.sessions !== "object" || value.sessions === null) return {}
  return value.sessions as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Strategy: repair corrupt continuity in place
// ---------------------------------------------------------------------------

function repairContinuityIfCorrupt(continuityPath: string): RepairResult {
  if (!existsSync(continuityPath)) {
    return { status: "noop", recoveredFrom: "none", repairedFiles: [] }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(continuityPath, "utf-8")) as unknown
  } catch {
    quarantineCorruptFile(continuityPath)
    writeContinuityAtomically(continuityPath, { version: STORE_VERSION, sessions: {} })
    return {
      status: "repaired",
      recoveredFrom: "quarantine-and-reset",
      repairedFiles: [CONTINUITY_FILE],
    }
  }

  if (typeof parsed !== "object" || parsed === null) {
    quarantineCorruptFile(continuityPath)
    writeContinuityAtomically(continuityPath, { version: STORE_VERSION, sessions: {} })
    return {
      status: "repaired",
      recoveredFrom: "quarantine-and-reset",
      repairedFiles: [CONTINUITY_FILE],
    }
  }

  return { status: "noop", recoveredFrom: "none", repairedFiles: [] }
}

// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------

function quarantineCorruptFile(filePath: string): string {
  const quarantinePath = `${filePath}.corrupt-${Date.now()}-${process.pid}-${randomUUID()}`
  renameSync(filePath, quarantinePath)
  return quarantinePath
}

function writeContinuityAtomically(filePath: string, payload: unknown): void {
  const tmpPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8")
  renameSync(tmpPath, filePath)
}
