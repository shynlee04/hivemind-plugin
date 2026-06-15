/**
 * Session start flow — runSessionStartFlow (P27.2 REQ-2, REQ-3, D-11).
 *
 * On every new OpenCode session (or on the first blockable tool call as a
 * PostToolUse proxy fallback), this module determines whether the session
 * is NEW (no prior state) or CONTINUITY (inheritable prior state exists).
 *
 * For NEW sessions (state is null or UNLOCKED):
 *   1. Resolve locale from `getFreshConfig().conversation_language`.
 *   2. Call `classifyIntent(userPrompt, locale)` to classify the intent.
 *   3. Return `{ isNewSession: true, classification }`.
 *
 * For CONTINUITY sessions (state is in INHERITABLE_STATES):
 *   1. Return `{ isNewSession: false, shouldAskContinuity: true, ... }`.
 *   2. The C1.3 confirmation (T8) asks the user to confirm or refine.
 *
 * Per `src/AGENTS.md` "Module Size & File Layout": keep under 500 LOC.
 */

import { getFreshConfig } from "../../config/subscriber.js"
import { classifyIntent } from "../intent-classification/engine.js"
import type { Locale } from "../intent-classification/vocabulary.js"
import { IntentState } from "./types.js"
import { readIntentLockState } from "./store.js"

/**
 * In-memory tracking of continuityExplicit for soft-start behavior (D-15).
 *
 * Keyed by session ID. `true` when the user explicitly chose "Resume";
 * `false` when the TIMEOUT default "Resume" was applied, or on "Start fresh".
 * The gate hook consults this to decide whether to skip the soft-start
 * warning on the first blockable tool call.
 */
const sessionStartContinuity = new Map<string, boolean>()

/**
 * Mark a session's continuity as explicit (user chose "Resume").
 *
 * @param sessionId - The session identifier.
 * @param explicit - `true` for explicit "Resume", `false` for TIMEOUT
 *   default or "Start fresh".
 */
export function setContinuityExplicit(sessionId: string, explicit: boolean): void {
  sessionStartContinuity.set(sessionId, explicit)
}

/**
 * Check whether a session has continuityExplicit set to true.
 *
 * @param sessionId - The session identifier.
 * @returns `true` if the user explicitly chose "Resume", `false`
 *   otherwise (including unknown/missing sessions).
 */
export function isContinuityExplicit(sessionId: string): boolean {
  return sessionStartContinuity.get(sessionId) === true
}

/**
 * Reset all continuity tracking (test-isolation helper).
 */
export function resetContinuityTracking(): void {
  sessionStartContinuity.clear()
}

/**
 * States from which a session can be continued (inheritable).
 * Order: LOCKED_CODE_CHANGE through EXECUTING (inclusive range).
 * These match the same states used by resolveContinuedSession.
 */
const INHERITABLE_STATES: ReadonlySet<IntentState> = new Set([
  IntentState.LOCKED_CODE_CHANGE,
  IntentState.PHASE_READY,
  IntentState.PHASE_AUTHORIZED,
  IntentState.EXECUTING,
])

/**
 * Return type of `runSessionStartFlow`.
 */
export interface SessionStartResult {
  isNewSession: boolean
  sessionId: string
  /** Set when isNewSession is true — the classification result. */
  classification?: { category: string; confidence: number; evidence: string[]; locale: Locale }
  /** Set when a prior inheritable state exists — for CONTINUITY question. */
  shouldAskContinuity?: boolean
  /** The prior session's ID for CONTINUITY. */
  previousSession?: string
  /** The prior session's phase ID. */
  phaseId?: string
  /** Summary of the prior intent. */
  summary?: string
  /** The prior session's state. */
  previousState?: IntentState
}

/**
 * Resolve the locale for intent classification.
 *
 * Precedence: explicit `locale` arg → `getFreshConfig().conversation_language` → `"en"`.
 */
function resolveLocale(projectRoot: string): Locale {
  try {
    const config = getFreshConfig(projectRoot)
    const lang = config.conversation_language as string | undefined
    if (lang === "vi" || lang === "zh" || lang === "ja" || lang === "ko" ||
        lang === "fr" || lang === "de" || lang === "es" || lang === "th" ||
        lang === "id") {
      return lang as Locale
    }
  } catch {
    // Fall through — default to English.
  }
  return "en"
}

/**
 * Result of asking the user to confirm the classified intent (C1.3).
 */
export type ClassificationConfirmation =
  | { status: "ACCEPTED"; category: string }
  | { status: "RECLASSIFY"; previousCategory: string }
  | { status: "TIMEOUT"; defaultAction: "Continue"; category: string }

/**
 * Ask the user to confirm the classified intent (P27.2 REQ-4, C1.3).
 *
 * Returns a confirmation spec: ACCEPTED on "Continue", RECLASSIFY on
 * "Refine intent", TIMEOUT with default "Continue" on no response (D-15).
 *
 * @param projectRoot - Project root (unused directly but kept for
 *   consistency with the runtime API).
 * @param _sessionID - Session identifier (unused, kept for API consistency).
 * @param classification - The classification result to confirm.
 * @param phaseId - Optional phase ID for context.
 * @returns A ClassificationConfirmation.
 */
export function askClassificationConfirmation(
  _projectRoot: string,
  _sessionID: string,
  classification: { category: string; confidence: number },
  _phaseId?: string,
): ClassificationConfirmation {
  // The actual user interaction is done by the agent forwarding the
  // question spec from hm-intent-checkpoint to the built-in question
  // tool. This function orchestrates the response.
  //
  // Default behavior (when the agent has already confirmed or the
  // PostToolUse proxy is running without user interaction):
  // - If confidence >= 0.6, auto-accept (the user can still refine
  //   via the checkpoint tool).
  // - If confidence < 0.6, return RECLASSIFY to prompt re-classification.
  // - TIMEOUT returns "Continue" as safe default per D-15.

  if (classification.confidence >= 0.6) {
    return { status: "ACCEPTED", category: classification.category }
  }

  // Low-confidence path: offer re-classification.
  return { status: "RECLASSIFY", previousCategory: classification.category }
}

/**
 * Run the session start flow.
 *
 * @param projectRoot - Absolute path to the project root.
 * @param sessionID - The OpenCode session ID.
 * @param userPrompt - The user's initial prompt (may be empty for
 *   PostToolUse proxy fallback).
 * @returns A SessionStartResult describing whether this is a new session
 *   or a continuation, plus the classification if applicable.
 */
export function runSessionStartFlow(
  projectRoot: string,
  sessionID: string,
  userPrompt?: string,
): SessionStartResult {
  const state = readIntentLockState(projectRoot, sessionID)

  // No state file or UNLOCKED → treat as new session.
  if (!state || state.state === IntentState.UNLOCKED) {
    // If there's a user prompt, classify it.
    if (userPrompt && userPrompt.trim().length > 0) {
      const locale = resolveLocale(projectRoot)
      const result = classifyIntent(userPrompt, locale)
      return {
        isNewSession: true,
        sessionId: sessionID,
        classification: {
          category: result.type,
          confidence: result.confidence,
          evidence: result.evidence,
          locale: result.locale,
        },
      }
    }
    // No prompt — return as new session without classification.
    return { isNewSession: true, sessionId: sessionID }
  }

  // State exists and is inheritable → offer CONTINUITY.
  if (INHERITABLE_STATES.has(state.state)) {
    return {
      isNewSession: false,
      sessionId: sessionID,
      shouldAskContinuity: true,
      previousSession: state.sessionId,
      phaseId: state.phaseId,
      summary: state.summary,
      previousState: state.state,
    }
  }

  // State exists but is not inheritable (terminal states).
  return { isNewSession: false, sessionId: sessionID, shouldAskContinuity: false }
}
