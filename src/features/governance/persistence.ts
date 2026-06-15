/**
 * Governance persistence module — standalone I/O for `.hivemind/state/governance-state.json`.
 *
 * Provides atomic read/write operations for the governance state file.
 * This is a synchronous module using `writeFileSync` + `renameSync` for atomicity.
 * Governance state is cross-cutting (not per-session) and stored independently
 * from the continuity store.
 *
 * REF: REQ-P41B-03
 *
 * @module governance/persistence
 */

import { randomUUID } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { getCanonicalStateDir } from "../../task-management/continuity/index.js"
import type { GovernancePersistenceState } from "../../shared/types.js"

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the state directory, honouring `OPENCODE_HARNESS_STATE_DIR` when set.
 *
 * Mirrors the env-var priority used by `resolveContinuityFilePath` in the
 * continuity store so that tests (and callers) can isolate writes to a temp
 * directory via the environment variable.
 *
 * @param projectRoot - Optional project root directory.
 * @returns Absolute path to the state directory.
 */
function resolveStateDir(projectRoot?: string): string {
  const envDir = process.env.OPENCODE_HARNESS_STATE_DIR?.trim()
  if (envDir && envDir.length > 0) {
    return resolve(envDir)
  }
  return getCanonicalStateDir(projectRoot)
}

/**
 * Resolves the absolute path to the governance state JSON file.
 *
 * @param projectRoot - Optional project root directory. Defaults to `process.cwd()`.
 * @returns Absolute path to `.hivemind/state/governance-state.json`.
 */
export function getGovernanceStatePath(projectRoot?: string): string {
  return resolve(resolveStateDir(projectRoot), "governance-state.json")
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/**
 * Returns an empty governance state with default values.
 *
 * @returns A fresh `GovernancePersistenceState` with no rules or violations.
 */
export function emptyGovernanceState(): GovernancePersistenceState {
  return { rules: [], violations: [], updatedAt: Date.now() }
}

/**
 * Reads and parses the governance state file from disk.
 *
 * If the file does not exist or cannot be parsed, returns an empty state
 * (graceful degradation — never throws for missing/unparseable files).
 *
 * @param projectRoot - Optional project root directory.
 * @returns The parsed governance state, or an empty state on failure.
 */
export function readGovernanceState(projectRoot?: string): GovernancePersistenceState {
  const filePath = getGovernanceStatePath(projectRoot)

  if (!existsSync(filePath)) {
    return emptyGovernanceState()
  }

  try {
    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw) as GovernancePersistenceState

    // Validate shape
    if (!Array.isArray(parsed.rules) || !Array.isArray(parsed.violations) || typeof parsed.updatedAt !== "number") {
      return emptyGovernanceState()
    }

    return parsed
  } catch {
    // Parse failure — return empty state (graceful degradation)
    return emptyGovernanceState()
  }
}

// ---------------------------------------------------------------------------
// Write (atomic)
// ---------------------------------------------------------------------------

/**
 * Atomically writes the governance state to disk.
 *
 * Uses a write-to-temp-file-then-rename pattern to prevent corrupt reads
 * if the process crashes mid-write. Creates the state directory if it
 * does not already exist.
 *
 * @param state - The governance state to persist.
 * @param projectRoot - Optional project root directory.
 */
export function writeGovernanceState(state: GovernancePersistenceState, projectRoot?: string): void {
  const filePath = getGovernanceStatePath(projectRoot)

  // Ensure the parent directory exists
  mkdirSync(dirname(filePath), { recursive: true })

  // Atomic write: write to temp file, then rename
  const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  writeFileSync(tmpFile, `${JSON.stringify(state, null, 2)}\n`, "utf-8")
  renameSync(tmpFile, filePath)
}
