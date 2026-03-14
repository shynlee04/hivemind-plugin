/**
 * Toast Throttle Utility — Prevents toast noise cascade.
 *
 * Implements cooldown-based throttling and session-level limits
 * to prevent redundant toast notifications from overwhelming the user.
 *
 * Design goals:
 *   - Max 1 toast per event type per 60 seconds (cooldown)
 *   - Max 5 toasts per event type per session (quota)
 *   - Centralized tracking across all hooks
 */

/** Default cooldown period in milliseconds (60 seconds) */
const DEFAULT_COOLDOWN_MS = 60_000

/** Default maximum toasts per event type per session */
const DEFAULT_MAX_PER_SESSION = 5

interface ToastEventRecord {
  lastEmitTime: number
  emitCount: number
}

/** Global map for tracking toast emissions across hooks */
const toastRecords = new Map<string, ToastEventRecord>()

/** Session start time for quota reset detection */
let sessionStartTime = Date.now()

export interface ToastThrottleConfig {
  cooldownMs: number
  maxPerSession: number
}

const defaultConfig: ToastThrottleConfig = {
  cooldownMs: DEFAULT_COOLDOWN_MS,
  maxPerSession: DEFAULT_MAX_PER_SESSION,
}

/**
 * Checks if a toast should be emitted based on throttle rules.
 *
 * @param eventType - The category of toast (e.g., "drift", "governance", "compaction")
 * @param key - Specific identifier within the event type (e.g., tool name, severity)
 * @param config - Optional config override
 * @returns true if toast should be emitted, false if throttled
 */
export function shouldEmitToast(
  eventType: string,
  key: string,
  config: Partial<ToastThrottleConfig> = {}
): boolean {
  const { cooldownMs, maxPerSession } = { ...defaultConfig, ...config }
  const compositeKey = `${eventType}:${key}`
  const now = Date.now()

  // Reset session if significant time has passed (new session detection)
  if (now - sessionStartTime > 24 * 60 * 60 * 1000) {
    resetAllThrottles()
    sessionStartTime = now
  }

  const record = toastRecords.get(compositeKey)

  if (!record) {
    return true
  }

  // Check cooldown
  if (now - record.lastEmitTime < cooldownMs) {
    return false
  }

  // Check session quota
  if (record.emitCount >= maxPerSession) {
    return false
  }

  return true
}

/**
 * Records a toast emission for throttle tracking.
 *
 * @param eventType - The category of toast
 * @param key - Specific identifier within the event type
 */
export function recordToastEmit(eventType: string, key: string): void {
  const compositeKey = `${eventType}:${key}`
  const now = Date.now()
  const record = toastRecords.get(compositeKey)

  if (record) {
    record.lastEmitTime = now
    record.emitCount += 1
  } else {
    toastRecords.set(compositeKey, {
      lastEmitTime: now,
      emitCount: 1,
    })
  }
}

/**
 * Resets throttle state for a specific event type.
 *
 * @param eventType - The event type to reset, or "*" for all
 */
export function resetThrottle(eventType: string): void {
  if (eventType === "*") {
    toastRecords.clear()
    sessionStartTime = Date.now()
    return
  }

  for (const key of toastRecords.keys()) {
    if (key.startsWith(`${eventType}:`)) {
      toastRecords.delete(key)
    }
  }
}

/**
 * Resets all throttle state. Called on new session start.
 */
export function resetAllThrottles(): void {
  toastRecords.clear()
  sessionStartTime = Date.now()
}

/**
 * Gets current throttle statistics for debugging.
 */
export function getThrottleStats(): {
  activeKeys: string[]
  sessionStartTime: number
} {
  return {
    activeKeys: Array.from(toastRecords.keys()),
    sessionStartTime,
  }
}

/**
 * Combined check-and-record helper for convenience.
 *
 * @param eventType - The category of toast
 * @param key - Specific identifier within the event type
 * @param config - Optional config override
 * @returns true if toast was recorded (should emit), false if throttled
 */
export function checkAndRecordToast(
  eventType: string,
  key: string,
  config: Partial<ToastThrottleConfig> = {}
): boolean {
  if (shouldEmitToast(eventType, key, config)) {
    recordToastEmit(eventType, key)
    return true
  }
  return false
}
