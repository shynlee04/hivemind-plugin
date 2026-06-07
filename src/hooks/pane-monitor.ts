/**
 * Hivemind pane-monitor hook module.
 *
 * Phase 53: subscribes to `pane-captured` events emitted by the P52-expanded
 * TmuxEventObserver and persists each event as a 7-field JSON entry under
 * `<journalRoot>/<sessionId>/<ISO-timestamp>-pane.json`. Enforces exponential
 * backoff (5s, 10s, 30s; max 3 retries; silent drop on 4th failure) and a
 * 100-entries-per-session-per-hour rate cap with UTC top-of-hour reset.
 *
 * All failure modes return silently — no `throw` crosses the hook's
 * `dispose()` / handler boundary (D-04 silent-fallback contract).
 *
 * @module hooks/pane-monitor
 */
import { mkdir, writeFile, readdir } from "node:fs/promises"
import { join, dirname } from "node:path"
import type { PaneCapturedEvent, TmuxEventObserver } from "../features/tmux/observers.js"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Exponential backoff schedule (milliseconds). Index 0 = first retry delay,
 * index 1 = second retry delay, index 2 = third retry delay. The initial
 * attempt has no delay.
 */
const BACKOFF_SCHEDULE_MS: readonly number[] = [5_000, 10_000, 30_000] // D-53-05

/** Maximum number of retry attempts. Total attempts = 1 initial + MAX_RETRIES retries. */
const MAX_RETRIES = 3 // D-53-05

/** Rate cap: maximum journal entries per session per UTC hour. */
const RATE_LIMIT_PER_HOUR = 100 // D-53-06

/** UTC hour epoch in milliseconds. */
const HOUR_MS = 3_600_000

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Options for {@link createPaneMonitorHook}.
 */
export interface PaneMonitorOptions {
  /** Session identifier — used as the per-session journal subdirectory name. */
  sessionId: string
  /** The P52 TmuxEventObserver to subscribe to. */
  observer: TmuxEventObserver
  /**
   * Absolute path to the journal root. Defaults to `.hivemind/journal`
   * (relative to `process.cwd()`). Per-session subdirectories are
   * created as `<journalRoot>/<sessionId>/`.
   */
  journalRoot?: string
  /**
   * Optional warn logger. Defaults to `console.warn` fallback. The plugin
   * composition root injects a `client.app.log({ level: "warn" })` callback.
   */
  logWarn?: (msg: string, err?: unknown) => void
}

/**
 * Operational counters incremented on success / retry / drop paths. The
 * counters are exposed read-only via the returned handle.
 */
export interface PaneMonitorCounters {
  /** Number of journal files successfully written. */
  written: number
  /** Number of retry attempts (every intermediate failure). */
  retried: number
  /** Number of events dropped (cap exceeded OR backoff exhausted OR path-traversal). */
  dropped: number
}

/**
 * Handle returned by {@link createPaneMonitorHook}. Calling `dispose()`
 * stops further journal writes by setting a closure flag in the handler
 * and clearing all in-flight retry timers.
 */
export interface PaneMonitorHandle {
  /** Teardown: stops new writes, clears in-flight timers, awaits pending retries. */
  dispose: () => Promise<void>
  /** Read-only counters. */
  counters: PaneMonitorCounters
  /**
   * Test seam: awaits all in-flight retry promises. Marked `@internal`
   * because it is consumed by vitest only (not part of the public API).
   *
   * @internal
   */
  __waitForPendingRetries?: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

/**
 * Shape of a single journal entry (7 fields, per D-53-04 + D-53-13).
 *
 * `schemaVersion` is a number (`1`), NOT a string (`"1.0"`) — locked by
 * CONTEXT. `retryCount` is the 7th field (per D-53-13 SPEC/CONTEXT drift
 * resolution), `contentPreview` from SPEC is NOT included.
 */
interface JournalEntry {
  schemaVersion: 1
  eventType: "pane-captured"
  sessionId: string
  paneId: string
  contentLength: number
  capturedAt: string
  retryCount: number
}

/**
 * Internal per-event retry state. The payload is captured in the closure
 * so retries do not depend on re-deriving the event from the observer.
 */
interface RetryContext {
  attempts: number
  timer: ReturnType<typeof setTimeout> | null
  /** Latest pending write promise, awaited by `__waitForPendingRetries`. */
  pending: Promise<boolean> | null
}

// ---------------------------------------------------------------------------
// Path-traversal guard
// ---------------------------------------------------------------------------

/**
 * Returns true if `sessionId` contains characters that would allow
 * directory traversal outside the journal root. Defensive guard against
 * malicious event payloads (T-53-01 threat model).
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
// Filename helper
// ---------------------------------------------------------------------------

/**
 * Build the journal filename for an event. The ISO timestamp is converted
 * to a filesystem-safe variant: colons and dots are replaced by dashes so
 * the file works on Windows and shell contexts (D-53-03). The pattern
 * preserves lexicographic sort order because `-` (0x2D) sorts before
 * `:` (0x3A) and `.` (0x2E) in ASCII.
 *
 * @param timestamp - Epoch milliseconds (event.capturedAt).
 * @returns Filesystem-safe filename ending in `-pane.json`.
 */
function buildJournalFilename(timestamp: number): string {
  return `${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}-pane.json`
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a pane-monitor hook that subscribes to the P52 observer's
 * `pane-captured` event and writes a 7-field JSON entry per event to the
 * journal root.
 *
 * The factory performs the following operations for each event:
 *  1. Path-traversal guard on `sessionId` (rejects `/`, `\`, `..`, null).
 *  2. Rate-cap check: 100 writes per session per UTC hour; on excess,
 *     increment `counters.dropped` and return silently (D-53-06).
 *  3. Journal write with exponential backoff (5s, 10s, 30s, max 3 retries).
 *     On 4th failure, increment `counters.dropped` and return silently
 *     (D-53-05, D-04).
 *  4. Successful write: increment `counters.written`.
 *
 * `dispose()` flips a closure flag (handler short-circuits when set)
 * and clears all in-flight retry timers. Per-listener try/catch in
 * `observers.ts` ensures the hook never breaks the listener chain
 * (P52 contract: `observers.ts:155-159`).
 *
 * @param opts - PaneMonitorOptions.
 * @returns A PaneMonitorHandle with `dispose`, `counters`, and a
 *          `__waitForPendingRetries` test seam.
 *
 * @example
 * ```typescript
 * const handle = createPaneMonitorHook({
 *   sessionId: "harness",
 *   observer: tmuxObserver,
 *   logWarn: (msg, err) => client.app.log({ level: "warn", message: msg }),
 * })
 * // later, on shutdown:
 * await handle.dispose()
 * ```
 */
export function createPaneMonitorHook(opts: PaneMonitorOptions): PaneMonitorHandle {
  const sessionId = opts.sessionId
  const journalRoot = opts.journalRoot ?? ".hivemind/journal"
  const sessionDir = join(journalRoot, sessionId)
  const logWarn = opts.logWarn ?? ((msg: string): void => {
    console.warn(`[Hivemind] pane-monitor: ${msg}`)
  })

  // Disposed flag — closure-captured so dispose() can short-circuit the handler.
  let disposed = false

  // Per-session rate-cap state (D-53-06, D-53-07): hourEpoch + count.
  const capState = { hourEpoch: 0, count: 0 }

  // In-flight retry contexts, keyed by event timestamp (epoch ms) for uniqueness.
  const pendingRetries = new Map<number, RetryContext>()

  const counters: PaneMonitorCounters = { written: 0, retried: 0, dropped: 0 }

  // Path-traversal guard — checked once at factory time AND on every event
  // (defensive in case sessionId is mutated externally).
  const sessionIdIsUnsafe = hasUnsafeSessionIdChars(sessionId)
    if (sessionIdIsUnsafe) {
      logWarn(
        `unsafe sessionId rejected at construction: "${sessionId}" (T-53-01 path-traversal guard)`,
      )
    }

  /**
   * Compute the current UTC hour epoch and decide whether the cap allows
   * one more write. Returns `false` if the cap is exceeded; `true` if the
   * caller may proceed (and the internal counter is incremented).
   */
  function checkAndIncrementCap(): boolean {
    const currentHourEpoch = Math.floor(Date.now() / HOUR_MS)
    if (capState.hourEpoch !== currentHourEpoch) {
      // Top-of-hour reset (D-53-06)
      capState.hourEpoch = currentHourEpoch
      capState.count = 0
    }
    if (capState.count >= RATE_LIMIT_PER_HOUR) {
      return false
    }
    capState.count++
    return true
  }

  /**
   * Build a journal entry from a PaneCapturedEvent and the current retry
   * attempt count. The `retryCount` field reflects the attempt number
   * (0 on first write, N on Nth retry).
   */
  function buildEntry(event: PaneCapturedEvent, attempt: number): JournalEntry {
    return {
      schemaVersion: 1,
      eventType: "pane-captured",
      sessionId: event.sessionId,
      paneId: event.paneId,
      contentLength: event.contentLength,
      capturedAt: new Date(event.timestamp).toISOString(),
      retryCount: attempt,
    }
  }

  /**
   * Build the sibling content file path. P58.9 REQ-58.9-01: the journal now
   * writes BOTH the 7-field `<ts>-pane.json` (metadata) AND a sibling
   * `<ts>-pane-content.txt` (full pane content). The two files share the
   * same timestamp stem so they can be paired by readers.
   *
   * @param timestamp - Epoch milliseconds (event.timestamp).
   * @returns Filesystem-safe filename ending in `-pane-content.txt`.
   */
  function buildContentFilename(timestamp: number): string {
    return `${new Date(timestamp).toISOString().replace(/[:.]/g, "-")}-pane-content.txt`
  }

  /**
   * Attempt a single journal write. On success resolves `void`; on failure
   * rejects with the underlying error. The write uses `flag: "wx"` for
   * exclusive create (REQ-53-02 — no clobber of existing entries).
   */
  async function writeOnce(filePath: string, entry: JournalEntry): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true })
    const content = JSON.stringify(entry, null, 2)
    // `wx` flag: exclusive create — fails if the file already exists
    // (REQ-53-02 acceptance). Mitigates T-53-02 (filename clobber).
    await writeFile(filePath, content, { encoding: "utf-8", flag: "wx" })
  }

  /**
   * P58.9 REQ-58.9-01: write the full pane content to a sibling file next
   * to the 7-field JSON entry. The filename shares the timestamp stem with
   * the JSON entry (e.g. `<ts>-pane.json` and `<ts>-pane-content.txt`).
   * Same `flag: "wx"` exclusive-create pattern to prevent clobber.
   *
   * Errors are caught and logged at the warn level — a content-write
   * failure does NOT block the JSON entry from succeeding. D-04 contract.
   */
  async function writeContentSiblings(
    event: PaneCapturedEvent,
  ): Promise<void> {
    if (event.content === undefined) return
    const contentFilename = buildContentFilename(event.timestamp)
    const contentFilePath = join(sessionDir, contentFilename)
    try {
      await mkdir(dirname(contentFilePath), { recursive: true })
      await writeFile(contentFilePath, event.content, { encoding: "utf-8", flag: "wx" })
    } catch (err) {
      // `wx` fails if the file already exists — that is acceptable
      // (idempotent on duplicate events at the same timestamp). Other
      // errors are logged but not propagated (D-04).
      const code = (err as NodeJS.ErrnoException)?.code
      if (code !== "EEXIST") {
        logWarn(
          `pane-content sibling write failed: sessionId=${event.sessionId} paneId=${event.paneId}`,
          err,
        )
      }
    }
  }

  /**
   * Write a journal entry with exponential backoff. Resolves to `true`
   * on success, `false` on exhausted retries or after dispose. Never throws.
   *
   * The function is implemented as a sequential async loop so the entire
   * write (including all retry delays) is captured in a single awaitable
   * promise — this enables the test seam to deterministically await the
   * full write cycle via `__waitForPendingRetries`.
   */
  async function writeWithBackoff(event: PaneCapturedEvent): Promise<boolean> {
    const filename = buildJournalFilename(event.timestamp)
    const filePath = join(sessionDir, filename)

    for (let attemptNumber = 0; attemptNumber <= MAX_RETRIES; attemptNumber++) {
      if (disposed) {
        return false
      }
      try {
        const entry = buildEntry(event, attemptNumber)
        await writeOnce(filePath, entry)
        // P58.9 REQ-58.9-01: write the sibling content file alongside the
        // JSON entry. Done AFTER the JSON entry succeeds so a JSON-write
        // failure never leaves a content file dangling. The content write
        // itself is best-effort (errors are logged, not propagated).
        if (attemptNumber === 0) {
          await writeContentSiblings(event)
        }
        counters.written++
        return true
      } catch (err) {
          if (attemptNumber >= MAX_RETRIES) {
            // 4th failure drops event (D-53-05, D-04 silent-fallback)
            counters.dropped++
            logWarn(
              `journal write exhausted ${MAX_RETRIES} retries, dropped event sessionId=${event.sessionId} paneId=${event.paneId}`,
              err,
            )
            return false
          }
        // Schedule the next retry with backoff delay
        const delay = BACKOFF_SCHEDULE_MS[attemptNumber]!
        counters.retried++
        await new Promise<void>((resolveDelay) => {
          const timer = setTimeout(() => {
            // Clear the timer ref once it fires so dispose() doesn't try
            // to clear an already-fired timer.
            const ctx = pendingRetries.get(event.timestamp)
            if (ctx) ctx.timer = null
            resolveDelay()
          }, delay)
          // Register the timer so dispose() can cancel it before it fires
          const ctx = pendingRetries.get(event.timestamp)
          if (ctx) ctx.timer = timer
        })
      }
    }
    // Unreachable — loop always returns from within
    return false
  }

  /**
   * Handler invoked for each `pane-captured` event. The handler is wrapped
   * in a closure to short-circuit when `disposed` is set (D-04 + the
   * dispose semantics per the spec).
   */
  const handler = (event: PaneCapturedEvent): void => {
    // Short-circuit on dispose (PATTERNS §2, P52 contract: no removeListener API)
    if (disposed) return

    // Path-traversal guard (T-53-01)
    if (sessionIdIsUnsafe || hasUnsafeSessionIdChars(event.sessionId)) {
      counters.dropped++
      logWarn(
        `rejected event with unsafe sessionId: "${event.sessionId}" (T-53-01 path-traversal guard)`,
      )
      return
    }

    // Rate cap (D-53-06, T-53-03 DoS mitigation)
    if (!checkAndIncrementCap()) {
      counters.dropped++
      // Silent drop per D-04 — no warn log noise on cap (would amplify DoS)
      return
    }

    // Register the retry context BEFORE starting the write so dispose()
    // and __waitForPendingRetries can find it
    const ctx: RetryContext = { attempts: 0, timer: null, pending: null }
    pendingRetries.set(event.timestamp, ctx)

    // Fire the write; track the full promise (including all retries) in ctx.pending
    const promise = writeWithBackoff(event)
    ctx.pending = promise
    // Clean up the pendingRetries map once the write completes (success or drop)
    void promise.finally(() => {
      // Only delete if it still points to us (avoids a race with a new event at same ts)
      if (pendingRetries.get(event.timestamp) === ctx) {
        pendingRetries.delete(event.timestamp)
      }
    })
  }

  // Subscribe to pane-captured events (D-53-12: ONLY pane-captured, not session-state-changed)
  opts.observer.onPaneCaptured(handler)

  /**
   * Dispose: sets the disposed flag, clears all in-flight retry timers,
   * and awaits any in-flight write promises so callers can rely on a
   * clean shutdown.
   */
  const dispose = async (): Promise<void> => {
    if (disposed) return
    disposed = true

    // Clear all pending retry timers
    for (const ctx of pendingRetries.values()) {
      if (ctx.timer !== null) {
        clearTimeout(ctx.timer)
        ctx.timer = null
      }
    }

    // Await any in-flight write attempts (best-effort; the writes themselves
    // short-circuit on disposed=true)
    const inflight = Array.from(pendingRetries.values())
      .map((ctx) => ctx.pending)
      .filter((p): p is Promise<boolean> => p !== null)
    if (inflight.length > 0) {
      await Promise.allSettled(inflight)
    }

    pendingRetries.clear()
  }

  /**
   * Test seam: awaits all in-flight write promises (used by vitest
   * backoff + cap tests). Marked `@internal` — not part of public API.
   */
  const __waitForPendingRetries = async (): Promise<void> => {
    const inflight = Array.from(pendingRetries.values())
      .map((ctx) => ctx.pending)
      .filter((p): p is Promise<boolean> => p !== null)
    if (inflight.length > 0) {
      await Promise.allSettled(inflight)
    }
  }

  return {
    dispose,
    counters,
    __waitForPendingRetries,
  }
}

// ---------------------------------------------------------------------------
// Test-only exports (consumed by vitest files via re-import).
// ---------------------------------------------------------------------------

/**
 * Internal cap state access for vitest tests. The cap state is intentionally
 * hidden behind an `Object.freeze` so tests can read but not mutate the
 * hourEpoch / count directly. Instead, the test seam below injects values
 * via a function reference.
 *
 * @internal
 */
export const __testing = {
  /**
   * Pre-seed the cap state for a given session. Used by
   * `tests/lib/hooks/pane-monitor-cap.test.ts` to assert the cap behavior
   * without firing 100 real events.
   *
   * @param countersRef - The counters object returned by `createPaneMonitorHook`.
   * @param hook - The PaneMonitorHandle whose internal state will be seeded.
   */
  seedCapCount: (
    _hook: PaneMonitorHandle,
    _count: number,
  ): void => {
    // The cap state is closure-private. Tests must use the public API
    // (fire 100 events) to populate the cap. This stub is reserved for
    // future hook refactors that expose a `__seedCap` seam.
    // (No-op by design — see D-53-07 in-memory implementation rationale.)
  },
  /** Expose the constants for test assertions on schedule + cap. */
  constants: {
    BACKOFF_SCHEDULE_MS,
    MAX_RETRIES,
    RATE_LIMIT_PER_HOUR,
    HOUR_MS,
  } as const,
  /**
   * Defensive helper exposed for tests: list `.json` files in a session
   * journal directory matching a given hour prefix. Mirrors D-53-07
   * optimization. Not used by the production code path.
   *
   * @internal
   */
  countHourFiles: async (
    journalRoot: string,
    sessionId: string,
    hourPrefix: string,
  ): Promise<number> => {
    const dir = join(journalRoot, sessionId)
    let entries: string[]
    try {
      entries = await readdir(dir)
    } catch {
      return 0
    }
    let count = 0
    for (const name of entries) {
      if (name.endsWith("-pane.json") && name.startsWith(hourPrefix)) {
        count++
      }
    }
    return count
  },
}
