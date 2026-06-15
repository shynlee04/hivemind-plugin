/**
 * Consolidated timing constants for the coordination layer.
 *
 * All hardcoded numeric timing values across `src/coordination/` are
 * consolidated here as named exports for consistency and single-source-of-truth.
 *
 * @module coordination/timing
 */

// ---------------------------------------------------------------------------
// Polling intervals
// ---------------------------------------------------------------------------

/** Active child message polling interval (2s). */
export const POLL_INTERVAL_ACTIVE_MS = 2000
/** Base stable child polling interval (5s). */
export const POLL_INTERVAL_BASE_MS = 5000
/** Idle child polling interval (10s). */
export const POLL_INTERVAL_IDLE_MS = 10000
/** Deep-idle child polling interval (30s). */
export const POLL_INTERVAL_DEEP_IDLE_MS = 30000

/** Command delegation poll interval (250ms). */
export const COMMAND_POLL_INTERVAL_MS = 250

// ---------------------------------------------------------------------------
// Timeouts & thresholds
// ---------------------------------------------------------------------------

/** Minimum runtime before fast-completion deferral expires (5s). */
export const MIN_IDLE_TIME_MS = 5000
/** Activity-based stale timeout (45 minutes) — NOT a fixed deadline. */
export const DEFAULT_STALE_TIMEOUT_MS = 45 * 60 * 1000
/** Safety ceiling for delegation runtime (30 min). */
export const DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000
/** Tool idle threshold before considering completion (5 min). */
export const DEFAULT_TOOL_IDLE_MS = 300_000
/** Stale threshold for session survival kit (5 min). */
export const DEFAULT_STALE_THRESHOLD_MS = 5 * 60 * 1000

/** Stability poll interval for the fallback timer. */
export const STABILITY_POLL_INTERVAL_MS = POLL_INTERVAL_BASE_MS

// ---------------------------------------------------------------------------
// Cleanup & retention
// ---------------------------------------------------------------------------

/** Grace period before in-memory cleanup of terminal delegations (10 min). */
export const TASK_CLEANUP_DELAY_MS = 10 * 60 * 1000
/** Maximum delegations before batch pruning kicks in. */
export const MAX_DELEGATIONS_BEFORE_PRUNE = 50
/** Max age for batch pruning of terminal delegations (30 min). */
export const DEFAULT_PRUNE_MAX_AGE_MS = 30 * 60 * 1000

/** Retry TTL for failed notification delivery (5 min). */
export const NOTIFICATION_RETRY_TTL_MS = 5 * 60 * 1000

// ---------------------------------------------------------------------------
// Batch & throttling windows
// ---------------------------------------------------------------------------

/** Throttle window between notifications per parent session (30s). */
export const NOTIFICATION_THROTTLE_INTERVAL_MS = 30_000
/** Default interval for periodic notifier (30s). */
export const PERIODIC_NOTIFIER_INTERVAL_MS = 30_000
/** Default timeout for completion stability detection (30s). */
export const COMPLETION_STABILITY_TIMEOUT_MS = 30_000

// ---------------------------------------------------------------------------
// SDK session handler specific
// ---------------------------------------------------------------------------

/** Poll idle threshold: stable < 30s returns base interval. */
export const SDK_POLL_IDLE_LOW_MS = 30_000
/** Poll idle threshold: stable 30s–5min returns idle interval. */
export const SDK_POLL_IDLE_HIGH_MS = 300_000
/** Recovery timeout for SDK delegation handler (5s). */
export const SDK_RECOVERY_TIMEOUT_MS = 5000
