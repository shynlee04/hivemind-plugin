import type { CompletionStatus } from "./types.js"

export type FailureState = {
  readonly maxRetries: number
  retryCount: number
  lastSessionID: string
  idleSinceMs: number | null
  readonly idleTimeoutMs: number
}

export const FAILURE_RETRY_LIMIT = 2
export const IDLE_TIMEOUT_MS = 180_000

export function createFailureState(sessionID: string): FailureState {
  return {
    maxRetries: FAILURE_RETRY_LIMIT,
    retryCount: 0,
    lastSessionID: sessionID,
    idleSinceMs: null,
    idleTimeoutMs: IDLE_TIMEOUT_MS,
  }
}

export function shouldRetry(state: FailureState): boolean {
  return state.retryCount < state.maxRetries
}

export function markIdleStart(state: FailureState, now: number): FailureState {
  return {
    ...state,
    idleSinceMs: now,
  }
}

export function markActivity(state: FailureState): FailureState {
  return {
    ...state,
    idleSinceMs: null,
  }
}

export function checkIdleTimeout(
  state: FailureState,
  now: number,
): { timedOut: boolean; idleDurationMs: number } {
  if (state.idleSinceMs === null) {
    return { timedOut: false, idleDurationMs: 0 }
  }

  const idleDurationMs = Math.max(0, now - state.idleSinceMs)

  return {
    timedOut: idleDurationMs >= state.idleTimeoutMs,
    idleDurationMs,
  }
}

export function incrementRetry(state: FailureState): FailureState {
  return {
    ...state,
    retryCount: state.retryCount + 1,
  }
}

export function isPermanentlyFailed(state: FailureState): boolean {
  return !shouldRetry(state)
}

export function toFailureCompletionStatus(state: FailureState): CompletionStatus {
  return isPermanentlyFailed(state) ? "failed" : "idle"
}
