/**
 * Intent-lock gate — dual-layer store.
 *
 * Mirrors `src/features/agent-work-contracts/store.ts` and
 * `src/task-management/continuity/store-cache.ts`: a module-level `Map`
 * provides hot reads while a JSON file on disk is the durable source of
 * truth. Writes go through atomic temp+rename. Corrupt files are
 * quarantined so the gate can keep serving a default state.
 *
 * The store is the ONLY writer of `.hivemind/intent-lock/{sessionId}.json`.
 * All public functions are synchronous because the hook is the only async
 * caller; the store itself does no I/O beyond `node:fs` synchronous calls.
 */

import { randomUUID } from "node:crypto"
import { execSync } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import { z } from "zod"

import { assertPathWithinRoot } from "../../shared/security/path-scope.js"
import { IntentState, type IntentLockHistoryEntry, type IntentLockState } from "./types.js"

const STORE_VERSION = "1.0.0" as const

/**
 * In-memory cache keyed by `sessionId`. Module-level singleton — the hook
 * relies on it to avoid round-tripping through disk on every tool call.
 */
const cache = new Map<string, IntentLockState>()

/**
 * Local Zod schema for parse-validation of disk-resident state.
 *
 * The `state`, `from`, and `to` fields use `z.nativeEnum(IntentState)` so
 * any unknown or corrupt enum value (e.g. `"PWNED"`) is REJECTED at parse
 * time and the file is quarantined — preventing type-system bypass via
 * on-disk tampering. Historical migration is handled by the version bump
 * in `STORE_VERSION` rather than by silent string acceptance.
 *
 * `allowedSurfaces` (added 2026-06-10, P27.1-03) is optional because it
 * was not present in pre-fix persisted files.
 *
 * `checkpointEvidence` (added 2026-06-10, P27.1-T8) is optional with a
 * `{}` default so pre-T8 persisted files continue to parse.
 */
const IntentLockStateSchema = z.object({
  sessionId: z.string().min(1),
  state: z.nativeEnum(IntentState),
  intentId: z.string().optional(),
  phaseId: z.string().optional(),
  isCodeChange: z.boolean().optional(),
  summary: z.string().optional(),
  allowedSurfaces: z.array(z.string()).optional(),
  checkpointEvidence: z.record(z.string(), z.array(z.string().min(1))).default({}),
  lastTransitionAt: z.number(),
  trajectoryId: z.string().optional(),
  inheritedFrom: z.string().optional(),
  history: z.array(
    z.object({
      from: z.nativeEnum(IntentState),
      to: z.nativeEnum(IntentState),
      at: z.number(),
      commitHash: z.string().optional(),
    }),
  ),
})

/**
 * Returns the on-disk path for a session's intent-lock state file.
 *
 * Path: `{projectRoot}/.hivemind/intent-lock/{sessionId}.json`.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Session identifier; must be path-safe.
 * @returns Absolute path inside the `.hivemind/intent-lock` boundary.
 * @throws {Error} When `sessionId` would resolve outside the boundary.
 */
export function getIntentLockFilePath(projectRoot: string, sessionId: string): string {
  const dir = resolve(projectRoot, ".hivemind", "intent-lock")
  return assertPathWithinRoot(dir, `${sessionId}.json`, "intent lock state")
}

/**
 * Read a session's intent-lock state, lazy-creating a default if absent.
 *
 * Cache-hit returns a deep clone (per `.hivemind/AGENTS.md` §8). Cache-miss
 * falls through to disk; on parse failure the corrupt file is quarantined
 * and a default state is returned.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Session identifier.
 * @returns A deep-cloned `IntentLockState`.
 */
export function readIntentLockState(projectRoot: string, sessionId: string): IntentLockState {
  const cached = cache.get(sessionId)
  if (cached) {
    return cloneState(cached)
  }

  const filePath = getIntentLockFilePath(projectRoot, sessionId)
  if (!existsSync(filePath)) {
    return createDefaultState(sessionId)
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(readFileSync(filePath, "utf-8"))
  } catch {
    quarantineCorruptState(filePath)
    return createDefaultState(sessionId)
  }

  const parsed = IntentLockStateSchema.safeParse(parsedJson)
  if (!parsed.success) {
    quarantineCorruptState(filePath)
    return createDefaultState(sessionId)
  }

  const state = parsedToState(parsed.data)
  cache.set(sessionId, state)
  return cloneState(state)
}

/**
 * Atomically persist a state to disk.
 *
 * Write order: `tmpFile = {filePath}.{pid}.{uuid}.tmp`, `writeFileSync`,
 * `renameSync`. The cache is updated AFTER disk write succeeds so a crash
 * mid-write leaves the cache stale (next read reloads from disk) but the
 * disk state is always the source of truth.
 *
 * The persisted JSON includes a top-level `schemaVersion` field per
 * `.hivemind/AGENTS.md` §8 — every state JSON file MUST declare its
 * schema version for future migration tooling.
 *
 * @param projectRoot - Trusted project root.
 * @param state - The state to persist.
 */
export function persistIntentLockState(projectRoot: string, state: IntentLockState): void {
  const filePath = getIntentLockFilePath(projectRoot, state.sessionId)
  mkdirSync(dirname(filePath), { recursive: true })

  const tmpFile = `${filePath}.${process.pid}.${randomUUID()}.tmp`
  const payload = {
    schemaVersion: STORE_VERSION,
    ...state,
    lastTransitionAt: state.lastTransitionAt,
  }
  const serialized = `${JSON.stringify(payload, null, 2)}\n`
  writeFileSync(tmpFile, serialized, "utf-8")
  renameSync(tmpFile, filePath)
  cache.set(state.sessionId, cloneState(state))
}

/**
 * Read the on-disk schema version. Exposed for future migration tooling.
 */
export function getIntentLockStoreVersion(): string {
  return STORE_VERSION
}

/**
 * Convenience upsert: persist and return a deep clone of the input.
 *
 * @param projectRoot - Trusted project root.
 * @param state - The state to persist.
 * @returns A deep-cloned copy of the input state.
 */
export function upsertIntentLockState(
  projectRoot: string,
  state: IntentLockState,
): IntentLockState {
  persistIntentLockState(projectRoot, state)
  return cloneState(state)
}

/**
 * Submit a trajectory ID for a session's intent-lock state (P27.2 T12, REQ-9).
 *
 * Sets `state.trajectoryId` immutably (deep-clone-on-write per
 * `.hivemind/AGENTS.md` §8), persists via the existing dual-layer store.
 * Validates `trajectoryId` is a non-empty string.
 *
 * @param projectRoot - Trusted project root.
 * @param state - The current state (not mutated).
 * @param trajectoryId - The trajectory ID to set. Must be non-empty.
 * @returns A new state with `trajectoryId` set (persisted).
 * @throws {Error} When `trajectoryId` is empty (prefixed `[Hivemind]`).
 */
export function submitTrajectoryId(
  projectRoot: string,
  state: IntentLockState,
  trajectoryId: string,
): IntentLockState {
  if (typeof trajectoryId !== "string" || trajectoryId.trim().length === 0) {
    throw new Error(`[Hivemind] submitTrajectoryId: trajectoryId must be a non-empty string`)
  }

  // Deep clone via cloneState, then set trajectoryId.
  const cloned = cloneState(state)
  cloned.trajectoryId = trajectoryId

  // Persist via the dual-layer store.
  persistIntentLockState(projectRoot, cloned)
  return cloned
}

/**
 * Atomically write a file to `.planning/intent-locks/{intentId}.md` and
 * git-commit it (P27.2 T9, REQ-7).
 *
 * Uses a temp+rename pattern for POSIX-atomic writes:
 *   1. Write content to `{targetPath}.tmp`.
 *   2. `fs.renameSync` to `{targetPath}` (atomic on POSIX).
 *   3. `git add` + `git commit` via `execSync`.
 *   4. Return the new commit SHA.
 *
 * On git failure, the .tmp file is cleaned up and a `[Hivemind]` error is
 * thrown. The target file (if it was renamed) is left in place — the caller
 * can retry the git operation manually.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param intentId - Intent identifier (used as filename stem).
 * @param content - File content to write (YAML/Markdown frontmatter).
 * @returns The 40-char hex commit SHA.
 * @throws {Error} When git operations fail (prefixed `[Hivemind]`).
 */
export function commitIntentLockArtifact(
  projectRoot: string,
  intentId: string,
  content: string,
): string {
  const dir = resolve(projectRoot, ".planning", "intent-locks")
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const targetPath = resolve(dir, `${intentId}.md`)
  const tmpPath = targetPath + ".tmp"

  try {
    // 1. Write to temp file
    writeFileSync(tmpPath, content, "utf-8")

    // 2. Atomic rename (POSIX)
    renameSync(tmpPath, targetPath)

    // 3. Git add + commit
    const addCmd = `git -C "${projectRoot}" add "${targetPath}"`
    execSync(addCmd, { encoding: "utf-8", stdio: "pipe", timeout: 10000 })

    const commitCmd = `git -C "${projectRoot}" commit -m "intent(${intentId}): lock intent artifact"`
    execSync(commitCmd, { encoding: "utf-8", stdio: "pipe", timeout: 10000 })

    // 4. Return SHA
    const shaCmd = `git -C "${projectRoot}" rev-parse HEAD`
    const sha = execSync(shaCmd, { encoding: "utf-8", stdio: "pipe", timeout: 5000 }).trim()

    return sha
  } catch (err) {
    // Clean up .tmp on failure
    try {
      if (existsSync(tmpPath)) unlinkSync(tmpPath)
    } catch {
      // Best-effort cleanup — not a secondary error
    }

    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`[Hivemind] commitIntentLockArtifact failed for ${intentId}: ${message}`)
  }
}

/**
 * Read (and lazily create) a session's intent-lock state.
 *
 * Currently a thin alias for `readIntentLockState` because that function
 * already creates a default state on cache-miss. Kept as a separate export
 * for readability at the hook call site.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Session identifier.
 * @returns A deep-cloned `IntentLockState`.
 */
export function getOrCreateIntentLockState(
  projectRoot: string,
  sessionId: string,
): IntentLockState {
  return readIntentLockState(projectRoot, sessionId)
}

/**
 * Clear the in-memory cache.
 *
 * Test-isolation helper; mirrors `resetStoreCache` in
 * `src/task-management/continuity/store-cache.ts:46-48`.
 */
export function clearIntentLockCache(): void {
  cache.clear()
}

// ---------------------------------------------------------------------------
// Session-scoped override (T5, F-5)
// ---------------------------------------------------------------------------

/** Shape of a session override file. */
export interface SessionOverride {
  disabled: boolean
  createdAt: number
}

/**
 * Read a session-scoped override file.
 *
 * If present with `{ disabled: true }`, the gate bypasses ALL checks for
 * this session (identical to `enabled: false` in config).
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Session identifier.
 * @returns Override data if file exists with `disabled: true`, else `undefined`.
 */
export function readSessionOverride(
  projectRoot: string,
  sessionId: string,
): SessionOverride | undefined {
  const overridePath = getOverrideFilePath(projectRoot, sessionId)
  if (!existsSync(overridePath)) return undefined
  try {
    const raw = JSON.parse(readFileSync(overridePath, "utf-8"))
    if (raw && typeof raw === "object" && raw.disabled === true) {
      return { disabled: true, createdAt: raw.createdAt ?? Date.now() }
    }
    return undefined
  } catch {
    return undefined
  }
}

/**
 * Delete a session override file (best-effort cleanup on session end).
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Session identifier.
 */
export function deleteSessionOverride(
  projectRoot: string,
  sessionId: string,
): void {
  const overridePath = getOverrideFilePath(projectRoot, sessionId)
  try {
    if (existsSync(overridePath)) unlinkSync(overridePath)
  } catch {
    // Best-effort — ignore cleanup failures
  }
}

/**
 * Returns the on-disk path for a session override file.
 *
 * Path: `{projectRoot}/.hivemind/intent-lock/{sessionId}.override.json`.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Session identifier.
 * @returns Absolute path inside the `.hivemind/intent-lock` boundary.
 */
function getOverrideFilePath(projectRoot: string, sessionId: string): string {
  const dir = resolve(projectRoot, ".hivemind", "intent-lock")
  return assertPathWithinRoot(dir, `${sessionId}.override.json`, "intent lock override")
}

// ---------------------------------------------------------------------------
// Internal helpers (not exported)
// ---------------------------------------------------------------------------

/**
 * Build a fresh `UNLOCKED` state for a new session.
 */
function createDefaultState(sessionId: string): IntentLockState {
  return {
    sessionId,
    state: IntentState.UNLOCKED,
    lastTransitionAt: Date.now(),
    history: [],
    checkpointEvidence: {},
  }
}

/**
 * Move a corrupt disk file aside and return the path it was moved to.
 *
 * File name: `{filePath}.corrupt-{epochMs}-{pid}-{uuid}`.
 */
function quarantineCorruptState(filePath: string): string {
  const target = `${filePath}.corrupt-${Date.now()}-${process.pid}-${randomUUID()}`
  renameSync(filePath, target)
  return target
}

/**
 * Deep-clone an `IntentLockState` via manual spread.
 *
 * The history array and every history entry are independently copied so
 * callers cannot mutate the cache by mutating the returned object.
 * `allowedSurfaces` is also cloned to preserve the deep-clone-on-read
 * discipline. `checkpointEvidence` is shallow-copied — the inner arrays
 * are not deep-cloned, which is acceptable because `submitCheckpointEvidence`
 * always REPLACES the value for a given key (immutable update), so the
 * stored array reference is never mutated in-place.
 */
function cloneState(state: IntentLockState): IntentLockState {
  return {
    sessionId: state.sessionId,
    state: state.state,
    intentId: state.intentId,
    phaseId: state.phaseId,
    isCodeChange: state.isCodeChange,
    summary: state.summary,
    allowedSurfaces: state.allowedSurfaces ? [...state.allowedSurfaces] : undefined,
    checkpointEvidence: state.checkpointEvidence ? { ...state.checkpointEvidence } : {},
    lastTransitionAt: state.lastTransitionAt,
    trajectoryId: state.trajectoryId,
    inheritedFrom: state.inheritedFrom,
    history: state.history.map(cloneHistoryEntry),
  }
}

function cloneHistoryEntry(entry: IntentLockHistoryEntry): IntentLockHistoryEntry {
  return {
    from: entry.from,
    to: entry.to,
    at: entry.at,
    commitHash: entry.commitHash,
    worktree: entry.worktree,
    trajectoryId: entry.trajectoryId,
  }
}

/**
 * Convert a Zod-validated parsed JSON object into a typed `IntentLockState`.
 *
 * The Zod schema enforces the `state`/`from`/`to` fields against the
 * `IntentState` enum, so the result is already a fully-typed value — no
 * unsafe cast is needed. Defensive copy of the history array keeps the
 * cache isolated from any caller that may mutate the returned object.
 */
function parsedToState(parsed: z.infer<typeof IntentLockStateSchema>): IntentLockState {
  return {
    sessionId: parsed.sessionId,
    state: parsed.state,
    intentId: parsed.intentId,
    phaseId: parsed.phaseId,
    isCodeChange: parsed.isCodeChange,
    summary: parsed.summary,
    allowedSurfaces: parsed.allowedSurfaces,
    checkpointEvidence: { ...parsed.checkpointEvidence },
    lastTransitionAt: parsed.lastTransitionAt,
    trajectoryId: parsed.trajectoryId,
    inheritedFrom: parsed.inheritedFrom,
    history: parsed.history.map((entry) => ({
      from: entry.from,
      to: entry.to,
      at: entry.at,
      commitHash: entry.commitHash,
    })),
  }
}

/**
 * Submit evidence for a checkpoint (AC-44, AC-45).
 *
 * Validates that evidence is a non-empty array of non-empty strings, then
 * persists the evidence to the state file under the given checkpoint ID.
 * Latest submission REPLACES any prior evidence for the same checkpoint ID.
 *
 * @param projectRoot - Trusted project root.
 * @param sessionId - Session identifier.
 * @param checkpointId - Checkpoint identifier (e.g., `"pre_executing"`).
 * @param evidence - Array of evidence strings (non-empty, non-whitespace).
 * @returns `{ accepted: true, checkpointId }` on success,
 *   `{ accepted: false, reason }` on validation failure.
 */
export function submitCheckpointEvidence(
  projectRoot: string,
  sessionId: string,
  checkpointId: string,
  evidence: string[],
):
  | { accepted: true; checkpointId: string }
  | { accepted: false; reason: string } {
  if (!Array.isArray(evidence) || evidence.length === 0) {
    return { accepted: false, reason: "Evidence required" }
  }
  if (evidence.some((e) => typeof e !== "string" || e.trim().length === 0)) {
    return { accepted: false, reason: "Evidence items must be non-empty strings" }
  }

  const state = readIntentLockState(projectRoot, sessionId)
  state.checkpointEvidence = {
    ...state.checkpointEvidence,
    [checkpointId]: evidence,
  }
  persistIntentLockState(projectRoot, state)
  return { accepted: true, checkpointId }
}
