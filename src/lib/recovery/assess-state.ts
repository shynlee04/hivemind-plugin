/**
 * @fileoverview Recovery state assessor (REC-02).
 *
 * Evaluates a session's persisted state under `.hivemind/state/` and recommends
 * a recovery action. Pure read-only inspection — no writes, no mutations.
 *
 * @module recovery/assess-state
 */

import { existsSync, readFileSync, readdirSync } from "node:fs"
import { resolve } from "node:path"

import { assertPathWithinRoot } from "../../shared/security/path-scope.js"
import { classifyFailure, type FailureClass } from "./failure-classes.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Severity of a recovery situation.
 *
 * - `recoverable` — session is intact, retry will likely succeed.
 * - `partial-loss` — some state lost but a viable recovery path exists.
 * - `unrecoverable` — no automatic recovery path; fresh start or manual fix.
 */
export type RecoverySeverity = "recoverable" | "partial-loss" | "unrecoverable"

/**
 * Recommended next step for the caller.
 *
 * - `retry` — re-run the failed operation.
 * - `checkpoint-restore` — restore from a recovery checkpoint.
 * - `fresh-start` — discard local state and begin a new session.
 * - `manual-intervention` — operator must fix state by hand.
 */
export type RecoveryAction =
  | "retry"
  | "checkpoint-restore"
  | "fresh-start"
  | "manual-intervention"

/**
 * Snapshot of recovery analysis for one session.
 */
export interface RecoveryAssessment {
  /** Session identifier the assessment was computed for. */
  readonly sessionId: string
  /** Best-fit failure class derived from on-disk inspection. */
  readonly failureClass: FailureClass
  /** Severity of the recovery situation. */
  readonly severity: RecoverySeverity
  /** Recommended next action. */
  readonly recommendedAction: RecoveryAction
  /** Filesystem resources implicated in the assessment (relative paths). */
  readonly affectedResources: readonly string[]
  /** ISO timestamp the assessment was generated. */
  readonly assessedAt: string
}

/**
 * Optional inputs for {@link assessRecoveryState}.
 */
export interface AssessRecoveryStateOptions {
  /**
   * When `false`, skip the checkpoint scan and treat absence of recoverable
   * artifacts as `manual-intervention` rather than `fresh-start`.
   * Defaults to `true`.
   */
  readonly considerCheckpoints?: boolean
}

// ---------------------------------------------------------------------------
// assessRecoveryState
// ---------------------------------------------------------------------------

const CONTINUITY_FILE = "session-continuity.json"
const CHECKPOINT_DIR = "checkpoints"

/**
 * Inspect persisted state and recommend a recovery action.
 *
 * Reads only — never mutates state. Designed to be safe to call repeatedly.
 *
 * @param sessionId - Session under inspection.
 * @param projectRoot - Trusted project root that owns `.hivemind/state`.
 * @param options - Optional toggles for the assessment heuristics.
 * @returns Recovery assessment snapshot.
 *
 * @example
 * ```typescript
 * const assessment = await assessRecoveryState('sess-abc', '/repo')
 * if (assessment.recommendedAction === 'checkpoint-restore') { ... }
 * ```
 */
export async function assessRecoveryState(
  sessionId: string,
  projectRoot: string,
  options: AssessRecoveryStateOptions = {},
): Promise<RecoveryAssessment> {
  const considerCheckpoints = options.considerCheckpoints ?? true
  const stateDir = resolve(projectRoot, ".hivemind", "state")
  const continuityPath = assertPathWithinRoot(stateDir, CONTINUITY_FILE, "continuity state")
  const checkpointDir = assertPathWithinRoot(stateDir, CHECKPOINT_DIR, "recovery checkpoint dir")

  const affected: string[] = []
  let failureClass: FailureClass = "unknown"
  let continuityHasSession = false

  if (existsSync(continuityPath)) {
    affected.push(CONTINUITY_FILE)
    try {
      const parsed = JSON.parse(readFileSync(continuityPath, "utf-8")) as unknown
      continuityHasSession = continuityContainsSession(parsed, sessionId)
    } catch (error) {
      failureClass = classifyFailure(error instanceof Error ? error : "state-corruption: invalid json")
      if (failureClass === "unknown") failureClass = "state-corruption"
    }
  }

  const checkpointMatch = considerCheckpoints
    ? findCheckpointForSession(checkpointDir, sessionId)
    : undefined
  if (checkpointMatch) affected.push(`checkpoints/${checkpointMatch}`)

  const { severity, recommendedAction } = decideAction({
    continuityHasSession,
    failureClass,
    hasCheckpoint: checkpointMatch !== undefined,
    considerCheckpoints,
  })

  return {
    sessionId,
    failureClass,
    severity,
    recommendedAction,
    affectedResources: affected,
    assessedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function continuityContainsSession(parsed: unknown, sessionId: string): boolean {
  if (typeof parsed !== "object" || parsed === null) return false
  const sessions = (parsed as { sessions?: unknown }).sessions
  if (typeof sessions !== "object" || sessions === null) return false
  return Object.prototype.hasOwnProperty.call(sessions, sessionId)
}

function findCheckpointForSession(checkpointDir: string, sessionId: string): string | undefined {
  if (!existsSync(checkpointDir)) return undefined
  let entries: string[]
  try {
    entries = readdirSync(checkpointDir)
  } catch {
    return undefined
  }
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue
    const fullPath = resolve(checkpointDir, entry)
    try {
      const data = JSON.parse(readFileSync(fullPath, "utf-8")) as unknown
      if (checkpointMatchesSession(data, sessionId)) return entry
    } catch {
      // Ignore unreadable checkpoint files; assessor is read-only.
      continue
    }
  }
  return undefined
}

function checkpointMatchesSession(data: unknown, sessionId: string): boolean {
  if (typeof data !== "object" || data === null) return false
  const idMatches = (data as { sessionId?: unknown }).sessionId === sessionId
  if (idMatches) return true
  const snapshot = (data as { snapshot?: unknown }).snapshot
  if (typeof snapshot === "object" && snapshot !== null) {
    const sessions = (snapshot as { sessions?: unknown }).sessions
    if (typeof sessions === "object" && sessions !== null) {
      return Object.prototype.hasOwnProperty.call(sessions, sessionId)
    }
  }
  return false
}

interface DecisionInput {
  readonly continuityHasSession: boolean
  readonly failureClass: FailureClass
  readonly hasCheckpoint: boolean
  readonly considerCheckpoints: boolean
}

function decideAction(input: DecisionInput): { severity: RecoverySeverity; recommendedAction: RecoveryAction } {
  if (input.failureClass === "state-corruption") {
    if (input.hasCheckpoint || input.considerCheckpoints) {
      return { severity: "partial-loss", recommendedAction: "checkpoint-restore" }
    }
    return { severity: "unrecoverable", recommendedAction: "manual-intervention" }
  }

  if (input.continuityHasSession) {
    return { severity: "recoverable", recommendedAction: "retry" }
  }

  if (input.hasCheckpoint) {
    return { severity: "partial-loss", recommendedAction: "checkpoint-restore" }
  }

  if (!input.considerCheckpoints) {
    return { severity: "unrecoverable", recommendedAction: "manual-intervention" }
  }

  return { severity: "unrecoverable", recommendedAction: "fresh-start" }
}
