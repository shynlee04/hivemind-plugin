/**
 * Hivemind session persistence module.
 *
 * Phase 54: persists `TrackedSession` metadata to
 * `.hivemind/state/tmux-sessions/<sessionId>.json` on every state
 * transition (`active → ready → paused → detached → failed`). The on-disk
 * record is the cross-process state channel that lets the harness re-attach
 * to live tmux sessions after a parent process crash (the
 * **kill-parent-restart-recovery** contract — D-54-12).
 *
 * All failure modes return silently — no `throw` crosses the
 * `createSessionPersistence` factory boundary (D-04 silent-fallback mirror
 * from P53 `pane-monitor.ts:206-208`). The in-memory `Map<sessionId,
 * TrackedSession>` in `SessionManager` remains the source of truth during
 * the process lifetime; disk is best-effort and the source of truth across
 * process lifetimes.
 *
 * @module features/tmux/persistence
 */
import { mkdir, writeFile, readFile, readdir, unlink } from "node:fs/promises"
import { join } from "node:path"
import { getRandomValues } from "node:crypto"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Session state-machine vocabulary. Exactly 5 string literals; no other
 * members. D-54-04 + REQ-54-01 acceptance.
 */
export type SessionState = "active" | "ready" | "paused" | "detached" | "failed"

/**
 * The 9-field on-disk record persisted for every tracked session. The shape
 * is forward-compatible: `schemaVersion: 1` (numeric literal, NOT string)
 * permits future migration. D-54-03 + REQ-54-01 acceptance.
 */
export interface PersistedSession {
  schemaVersion: 1
  sessionId: string
  agent: string
  delegationId: string
  directory: string
  paneId: string
  spawnTime: number
  state: SessionState
  lastTransitionAt: number
}

/**
 * Options for {@link createSessionPersistence}.
 */
export interface SessionPersistenceOptions {
  /** Absolute path to the project root; the state root is derived as a subdir. */
  projectDirectory: string
  /**
   * Optional warn logger. Defaults to `console.warn` with the
   * `[Harness] persistence:` prefix. P53 D-04 mirror.
   */
  logWarn?: (msg: string, err?: unknown) => void
}

/**
 * Persistence handle returned by {@link createSessionPersistence}.
 *
 * The four public methods (plus one read-only test seam) form the
 * persistence API surface consumed by `SessionManager` (the 7th
 * optional constructor parameter) and the BATS L1 evidence scenario
 * (slot 56 — kill-parent-restart-recovery).
 */
export interface SessionPersistence {
  /** Persist a single session record to disk. */
  persist(record: PersistedSession): Promise<void>
  /** Remove a session record by id. Idempotent — no throw if missing. */
  remove(sessionId: string): Promise<void>
  /**
   * Restore all session records whose state is `paused` or `detached`,
   * sorted by `spawnTime` ascending. Returns `[]` for missing or empty
   * state root. Malformed records are skipped with `logWarn`.
   */
  restoreAll(): Promise<PersistedSession[]>
  /**
   * Generate a fresh UUIDv7 string. RFC 9562 — 48-bit timestamp +
   * 80 random bits, version 7 + variant 10xx. Lexicographic sort
   * matches creation order. P20 invariant — no `uuid` package.
   */
  generateId(): string
  /** Read-only test seam exposing the resolved state root for vitest/BATS. */
  readonly __stateRoot: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * States eligible for restore. D-54-06: only `paused` and `detached` mean
 * a tmux pane is still alive on a separate OS process after the harness
 * parent died. `active`, `ready`, and `failed` records are excluded.
 */
const ALIVE_STATES: ReadonlySet<SessionState> = new Set(["paused", "detached"])

// ---------------------------------------------------------------------------
// UUIDv7 generator (D-54-07, REQ-54-04)
// ---------------------------------------------------------------------------

/**
 * Generate an RFC-9562 UUIDv7 string. Format: `xxxxxxxx-xxxx-7xxx-yxxx-
 * xxxxxxxxxxxx` where the 3rd group starts with `7` (version bits
 * 48-51 = `0b0111`) and the 4th group starts with `8`, `9`, `a`, or `b`
 * (variant bits 64-65 = `0b10`). The 48 most-significant bits hold
 * `Date.now()` (Unix ms), making the IDs sortable by creation time.
 *
 * P20 invariant: no `uuid` package; uses `node:crypto.getRandomValues`
 * (Node 20+ built-in).
 *
 * @returns A fresh UUIDv7 string in lowercase canonical form.
 */
export function generateUuidV7(): string {
  // 48-bit big-endian ms timestamp → 12 hex chars
  const ts = Date.now()
  const tsHex = ts.toString(16).padStart(12, "0")
  // 80 random bits (10 bytes) — Node 20+ CSPRNG
  const rand = new Uint8Array(10)
  getRandomValues(rand)
  // Set version bits 48-51 = 0b0111 (version 7) → byte 6 high nibble = 7
  rand[6] = ((rand[6] ?? 0) & 0x0f) | 0x70
  // Set variant bits 64-65 = 0b10 (RFC 4122) → byte 8 high 2 bits = 10
  rand[8] = ((rand[8] ?? 0) & 0x3f) | 0x80
  const randHex = Array.from(rand, (b) => b.toString(16).padStart(2, "0")).join("")
  // Format: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
  // randHex layout (20 chars, 2 per byte):
  //   chars  0-11: bytes 0-5 (random)
  //   chars 12-13: byte 6 (version bits in high nibble → "7")
  //   chars 14-15: byte 7 (random)
  //   chars 16-17: byte 8 (variant bits in high 2 bits → 8/9/a/b)
  //   chars 18-19: byte 9 (random)
  return (
    `${tsHex.slice(0, 8)}-${tsHex.slice(8, 12)}-` +
    `7${randHex.slice(13, 16)}-` +
    `${randHex.slice(16, 20)}-` +
    `${randHex.slice(8, 12)}${randHex.slice(0, 8)}`
  )
}

// ---------------------------------------------------------------------------
// Path-traversal guard (T-54-01)
// ---------------------------------------------------------------------------

/**
 * Returns true if `sessionId` contains characters that would allow
 * directory traversal outside the state root. Defensive guard against
 * malicious event payloads (T-54-01 threat model).
 */
function hasUnsafeSessionIdChars(sessionId: string): boolean {
  return (
    sessionId.includes("/") ||
    sessionId.includes("\\") ||
    sessionId.includes("..") ||
    sessionId.includes("\0")
  )
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Type predicate for the 5-literal `SessionState` union.
 */
function isValidSessionState(s: unknown): s is SessionState {
  return (
    s === "active" ||
    s === "ready" ||
    s === "paused" ||
    s === "detached" ||
    s === "failed"
  )
}

/**
 * Type predicate for the 9-field `PersistedSession` shape. Malformed
 * records (missing fields, wrong types) are rejected so `restoreAll`
 * can skip them with a `logWarn` (D-04 mirror).
 */
function isValidPersistedSession(r: unknown): r is PersistedSession {
  if (typeof r !== "object" || r === null) return false
  const o = r as Record<string, unknown>
  return (
    typeof o.sessionId === "string" &&
    typeof o.agent === "string" &&
    typeof o.delegationId === "string" &&
    typeof o.directory === "string" &&
    typeof o.paneId === "string" &&
    typeof o.spawnTime === "number" &&
    isValidSessionState(o.state) &&
    typeof o.lastTransitionAt === "number" &&
    o.schemaVersion === 1
  )
}

/**
 * Returns true if `err` is a Node `EEXIST` error (file already exists).
 */
function isEEXIST(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "EEXIST"
  )
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a session-persistence handle that writes per-session JSON records
 * to `<projectDirectory>/.hivemind/state/tmux-sessions/<sessionId>.json`.
 *
 * The factory mirrors the P53 `createPaneMonitorHook(opts)` shape:
 * closure-captured `logWarn` with the `[Harness] persistence:` prefix,
 * `mkdir({recursive: true})` on first call, and a returned handle with
 * the persistence API surface.
 *
 * All four public methods follow D-04 silent-fallback: filesystem
 * errors are caught and routed to `logWarn`; the `Promise` resolves
 * normally. The in-memory `TrackedSession` map in `SessionManager`
 * remains the source of truth during the process lifetime; the disk
 * records are best-effort.
 *
 * @param opts - {@link SessionPersistenceOptions}.
 * @returns A {@link SessionPersistence} handle.
 *
 * @example
 * ```typescript
 * const p = createSessionPersistence({ projectDirectory: process.cwd() })
 * await p.persist({
 *   schemaVersion: 1,
 *   sessionId: p.generateId(),
 *   agent: "gsd-executor",
 *   delegationId: "del-1",
 *   directory: process.cwd(),
 *   paneId: "%1",
 *   spawnTime: Date.now(),
 *   state: "ready",
 *   lastTransitionAt: Date.now(),
 * })
 * const alive = await p.restoreAll() // paused + detached only
 * ```
 */
export function createSessionPersistence(
  opts: SessionPersistenceOptions,
): SessionPersistence {
  const logWarn = opts.logWarn ?? ((msg: string, err?: unknown): void => {
    console.warn(`[Harness] persistence: ${msg}`, err)
  })
  const stateRoot = join(opts.projectDirectory, ".hivemind", "state", "tmux-sessions")

  // Idempotent dir creation (RECURSIVE). Stored as a promise so every
  // method that touches stateRoot can await it — eliminating the race
  // between the factory's background mkdir and the first `persist()` /
  // `restoreAll()` call. Errors are caught and logged (D-04 mirror);
  // subsequent defensive `mkdir` calls in `persist` will retry.
  const dirReady = mkdir(stateRoot, { recursive: true }).catch((err) => {
    logWarn(`mkdir failed for stateRoot=${stateRoot}`, err)
  })

  /**
   * Atomic write: try `flag: "wx"` (exclusive create — never clobber an
   * existing record). On `EEXIST`, fall through to `flag: "w"` (truncate
   * and overwrite with the latest state). D-54-10.
   */
  async function writeRecord(filePath: string, record: PersistedSession): Promise<void> {
    const content = JSON.stringify(record, null, 2)
    try {
      await writeFile(filePath, content, { encoding: "utf-8", flag: "wx" })
    } catch (err) {
      if (isEEXIST(err)) {
        // D-54-10: file already exists from a prior persist — overwrite
        // with the latest state. The new state supersedes the old.
        await writeFile(filePath, content, { encoding: "utf-8", flag: "w" })
        return
      }
      throw err
    }
  }

  /**
   * Persist a single session record. Sets `lastTransitionAt` to the
   * current time if the caller did not supply it, and defensively sets
   * `schemaVersion: 1`. Errors are caught and logged (D-04 mirror).
   */
  async function persist(record: PersistedSession): Promise<void> {
    try {
      // Defensive — ensure on-disk contract regardless of caller shape.
      record.lastTransitionAt = record.lastTransitionAt ?? Date.now()
      record.schemaVersion = 1
      if (!isValidSessionState(record.state)) {
        logWarn(
          `persist: invalid state literal: ${String(record.state)} for sessionId=${record.sessionId}`,
        )
        return
      }
      // Path-traversal guard (T-54-01)
      if (hasUnsafeSessionIdChars(record.sessionId)) {
        logWarn(
          `persist: rejected unsafe sessionId: "${record.sessionId}" (T-54-01 path-traversal guard)`,
        )
        return
      }
      // Await the factory's initial mkdir (idempotent — safe to await
      // multiple times). If it failed, retry once defensively.
      await dirReady
      const filePath = join(stateRoot, `${record.sessionId}.json`)
      await writeRecord(filePath, record)
    } catch (err) {
      logWarn(
        `persist failed for sessionId=${record.sessionId} state=${record.state}`,
        err,
      )
    }
  }

  /**
   * Remove a session record by id. Idempotent — already-missing files
   * resolve normally (EEXIST/ENOENT handled). Other errors are logged
   * (D-04 mirror). P54 has no call site for `remove`; it is part of the
   * interface for future phases (per CONTEXT deferred §2 — orphaned
   * `failed` records are cleaned up by a downstream phase).
   */
  async function remove(sessionId: string): Promise<void> {
    try {
      if (hasUnsafeSessionIdChars(sessionId)) {
        logWarn(
          `remove: rejected unsafe sessionId: "${sessionId}" (T-54-01 path-traversal guard)`,
        )
        return
      }
      await dirReady
      await unlink(join(stateRoot, `${sessionId}.json`))
    } catch (err) {
      if (isEEXIST(err)) {
        // Already gone — idempotent
        return
      }
      const code = (err as { code?: string }).code
      if (code === "ENOENT") {
        // Already gone — idempotent
        return
      }
      logWarn(`remove failed for sessionId=${sessionId}`, err)
    }
  }

  /**
   * Scan the state root, parse every `*.json` file, filter to records
   * whose state is `paused` or `detached` (D-54-06), and return the
   * filtered array sorted by `spawnTime` ascending. Malformed records
   * are skipped with `logWarn` (D-04 mirror). Missing state root
   * resolves to `[]` without throwing (fresh project case).
   */
  async function restoreAll(): Promise<PersistedSession[]> {
    // Ensure the state directory exists before scanning. If the factory
    // mkdir failed, dirReady resolves (logged) and readdir will ENOENT
    // — caught below as the fresh-project case.
    await dirReady
    let files: string[]
    try {
      files = await readdir(stateRoot)
    } catch {
      // Fresh project — state root does not exist yet. Not an error.
      return []
    }
    const records: PersistedSession[] = []
    for (const file of files) {
      if (!file.endsWith(".json")) continue
      const filePath = join(stateRoot, file)
      try {
        const raw = await readFile(filePath, "utf-8")
        const parsed: unknown = JSON.parse(raw)
        if (!isValidPersistedSession(parsed)) {
          logWarn(`restoreAll: skipping malformed record (missing/invalid fields): ${file}`)
          continue
        }
        if (ALIVE_STATES.has(parsed.state)) {
          records.push(parsed)
        }
      } catch (err) {
        logWarn(`restoreAll: skipping unreadable/malformed JSON: ${file}`, err)
      }
    }
    records.sort((a, b) => a.spawnTime - b.spawnTime)
    return records
  }

  return {
    persist,
    remove,
    restoreAll,
    generateId: generateUuidV7,
    __stateRoot: stateRoot,
  }
}
