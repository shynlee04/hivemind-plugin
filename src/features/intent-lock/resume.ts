/**
 * Intent-lock gate — session resume / state inheritance.
 *
 * On session start, the hook (plan 03) calls `resolveContinuedSession` to
 * check whether the new session should inherit a previous root session's
 * intent-lock state. Inheritance is **fail-safe**: uncertain or stale entries
 * are skipped, and only `LOCKED_CODE_CHANGE` through `EXECUTING` states are
 * inherited.
 *
 * All I/O is injected via `ResumeDeps` for pure-unit testability.
 *
 * @see 27.1-SPEC.md §10.1-10.3
 */

import { IntentState, type IntentLockState } from "./types.js"

/**
 * Shape of a continuity-store entry consumed by the resume function.
 *
 * Mirrors the subset of fields from
 * `src/task-management/continuity/index.ts` that the resume logic needs.
 */
export interface ContinuityEntry {
  sessionId: string
  kind: "root" | "child" | "unknownSub"
  endedAt?: number
  phaseId?: string
  state?: IntentState
  intentId?: string
  summary?: string
}

/**
 * Injected dependencies for `resolveContinuedSession`.
 *
 * Production wiring (in the plan 03 hook) maps each field to the real
 * implementation. Tests inject mocks.
 */
export interface ResumeDeps {
  /** Read the continuity store and return all session entries. */
  readContinuityStore: (
    projectRoot: string,
  ) => { sessions: ContinuityEntry[] }
  /** Persist an intent-lock state to the dual-layer store. */
  upsertIntentLockState: (
    projectRoot: string,
    state: IntentLockState,
  ) => IntentLockState
  /** Best-effort toast notification; failure is caught and logged. */
  showToast?: (message: string, variant: "info" | "warning") => Promise<unknown>
  /** Warning logger for fail-safe skips. */
  logWarn?: (message: string, meta?: unknown) => void
  /** Config knobs that gate resume behaviour. */
  config: Pick<import("./types.js").IntentLockConfig, "resumeInheritsLock" | "notifyResume">
}

/** Return type of `resolveContinuedSession`. */
export interface ResumeResult {
  state: IntentState
  inheritedFrom?: string
  notify?: { message: string; variant: "info" }
}

/** States eligible for inheritance (inclusive range). */
const INHERITABLE_STATES: ReadonlySet<IntentState> = new Set([
  IntentState.LOCKED_CODE_CHANGE,
  IntentState.PHASE_READY,
  IntentState.PHASE_AUTHORIZED,
  IntentState.EXECUTING,
])

/**
 * Resume a new root session by inheriting the intent-lock state from the most
 * recent previous root session (if any) in the continuity store.
 *
 * Inheritance is **fail-safe**:
 * - If the most recent root has `kind: "unknownSub"`, inheritance is SKIPPED
 *   (warning logged). This prevents a stale or out-of-band entry from
 *   unlocking tools without going through the 4-step progression.
 * - If the most recent root has a terminal state (UNLOCKED, LOCKED_NON_CODE,
 *   COMPLETED), the new session starts UNLOCKED.
 * - Only `LOCKED_CODE_CHANGE` through `EXECUTING` states are inherited.
 *
 * The toast notification is a best-effort side-effect — failure does NOT
 * propagate. See SPEC §10.2 for the exact toast format.
 *
 * @see 27.1-SPEC.md §10.1-10.3
 */
export async function resolveContinuedSession(
  newSessionId: string,
  projectRoot: string,
  deps: ResumeDeps,
): Promise<ResumeResult> {
  // Config gate: if resume inheritance is disabled, start fresh.
  if (!deps.config.resumeInheritsLock) {
    return { state: IntentState.UNLOCKED }
  }

  const store = deps.readContinuityStore(projectRoot)

  // Find the most recent root entry (sort by endedAt desc, take first).
  const rootEntries = store.sessions
    .filter((entry) => entry.kind === "root" || entry.kind === "unknownSub")
    .sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0))

  const mostRecent = rootEntries[0]
  if (mostRecent === undefined) {
    return { state: IntentState.UNLOCKED }
  }

  // Fail-safe: unknownSub entries are never inherited.
  if (mostRecent.kind === "unknownSub") {
    deps.logWarn?.(
      `[Hivemind] resume: most recent root session ${mostRecent.sessionId} has kind="unknownSub" — skipping inheritance (fail-safe default)`,
    )
    return { state: IntentState.UNLOCKED }
  }

  // Only inherit inheritable states (LOCKED_CODE_CHANGE through EXECUTING).
  const previousState = mostRecent.state
  if (previousState === undefined || !INHERITABLE_STATES.has(previousState)) {
    return { state: IntentState.UNLOCKED }
  }

  // Require phaseId and intentId for a valid inheritance.
  if (mostRecent.phaseId === undefined || mostRecent.intentId === undefined) {
    return { state: IntentState.UNLOCKED }
  }

  // Build the new state mirroring the old session's lock.
  const now = Date.now()
  const newState: IntentLockState = {
    sessionId: newSessionId,
    state: previousState,
    intentId: mostRecent.intentId,
    phaseId: mostRecent.phaseId,
    isCodeChange: true,
    summary: mostRecent.summary,
    lastTransitionAt: now,
    history: [
      {
        from: IntentState.UNLOCKED,
        to: previousState,
        at: now,
      },
    ],
  }

  deps.upsertIntentLockState(projectRoot, newState)

  // Best-effort toast notification (SPEC §10.2 format).
  const toastMessage = `Resuming from ${mostRecent.sessionId}, locked phase ${mostRecent.phaseId} (intent: ${mostRecent.summary ?? "unknown"})`

  if (deps.config.notifyResume && deps.showToast !== undefined) {
    try {
      await deps.showToast(toastMessage, "info")
    } catch (err) {
      deps.logWarn?.(
        `[Hivemind] resume: toast notification failed (non-fatal)`,
        err,
      )
    }
  }

  return {
    state: previousState,
    inheritedFrom: mostRecent.sessionId,
    notify: { message: toastMessage, variant: "info" },
  }
}
