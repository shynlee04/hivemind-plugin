// ---------------------------------------------------------------------------
// Delegation types (Phase 14) — WaiterModel + Dual-Signal Architecture
// ---------------------------------------------------------------------------
// Extracted from types.ts to maintain the 500 LOC module limit.
// Re-exported from types.ts for backward compatibility — existing imports unchanged.
//
// Architecture: D-02 (always-background WaiterModel), D-04 (dual-signal completion),
// D-13 (no fixed timeouts, safety ceiling only), D-14 (separate status tool)
// ---------------------------------------------------------------------------

export type DelegationStatus =
  | "dispatched"  // Just dispatched, child session created and prompted
  | "running"     // Child session processing, dual-signal monitoring active
  | "completed"   // Dual-signal confirmed completion, result extracted
  | "error"       // Error occurred (child session deleted, SDK error, etc.)
  | "timeout"     // Safety ceiling reached (MAX runtime, not a deadline)

export type DelegationSurface = "agent-delegation" | "command-process"

export type DelegationRecoveryGuarantee = "resumable" | "best-effort" | "non-resumable-after-restart"

export type DelegationTerminalKind =
  | "completed"
  | "error"
  | "timeout"
  | "cancelled"
  | "interrupted-by-signal"
  | "non-resumable-after-restart"

export interface Delegation {
  id: string
  parentSessionId: string
  childSessionId: string
  agent: string
  status: DelegationStatus
  result?: string
  resultTruncated?: boolean
  error?: string
  createdAt: number
  completedAt?: number
  /** Optional max runtime ceiling — NOT a deadline. Tasks run until dual-signal confirms completion. */
  safetyCeilingMs?: number
  /** Last known message count from child session (for stability tracking) */
  lastMessageCount: number
  /** Number of consecutive stable polls (message count unchanged) */
  stablePollCount: number
  /** Nesting depth of this delegation (1 = top-level) */
  nestingDepth: number
  /** Timestamp when grace period cleanup is scheduled (terminal states only) */
  gracePeriodExpiresAt?: number
  /** Timestamp of last observed message count change (for adaptive polling) */
  lastMessageCountChangeAt?: number
  executionMode: "sdk" | "pty" | "headless"
  surface?: DelegationSurface
  recoveryGuarantee?: DelegationRecoveryGuarantee
  workingDirectory: string
  ptySessionId?: string
  fallbackReason?: string
  queueKey: string
  terminalKind?: DelegationTerminalKind
  terminationSignal?: string
  explicitCancellation?: boolean
}

export interface DelegationResult {
  status: DelegationStatus
  result?: string
  resultTruncated?: boolean
  error?: string
  delegationId: string
  executionMode?: "sdk" | "pty" | "headless"
  surface?: DelegationSurface
  recoveryGuarantee?: DelegationRecoveryGuarantee
  workingDirectory?: string
  ptySessionId?: string
  fallbackReason?: string
  queueKey?: string
  terminalKind?: DelegationTerminalKind
  terminationSignal?: string
  explicitCancellation?: boolean
  /** Timestamp when grace period cleanup is scheduled (terminal states only) */
  gracePeriodExpiresAt?: number
  /** Total count of matching delegations (for status tool responses) */
  total?: number
}

export type CommandDelegationParams = {
  parentSessionId: string
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  title?: string
  queueContext?: {
    provider?: string
    model?: string
    agent?: string
    category?: string
  }
  /** Advisory watchdog threshold only — not a fixed completion timeout. */
  safetyCeilingMs?: number
}

/** Safety ceiling — MAX runtime, not a deadline. Tasks may complete faster. */
export const DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000 // 30 minutes
/** Maximum delegation nesting depth (default: 3, overridable via RuntimePolicy) */
export const MAX_DELEGATION_DEPTH = 3

// ---------------------------------------------------------------------------
// Phase 16.2: Grace period, adaptive polling, and nesting depth constants
// ---------------------------------------------------------------------------

/** Grace period before in-memory cleanup of terminal delegations (10 minutes) */
export const TASK_CLEANUP_DELAY_MS = 10 * 60 * 1000
/** Maximum delegations before batch pruning kicks in */
export const MAX_DELEGATIONS_BEFORE_PRUNE = 50
/** Max age for batch pruning of terminal delegations (30 minutes) */
export const DEFAULT_PRUNE_MAX_AGE_MS = 30 * 60 * 1000

/** Adaptive polling: interval when child is actively producing messages */
export const POLL_INTERVAL_ACTIVE_MS = 2000
/** Adaptive polling: interval when child is stable for < 30s */
export const POLL_INTERVAL_BASE_MS = 5000
/** Adaptive polling: interval when child is idle for 30s–5min */
export const POLL_INTERVAL_IDLE_MS = 10000
/** Adaptive polling: interval when child is deeply idle (> 5min) */
export const POLL_INTERVAL_DEEP_IDLE_MS = 30000

/** Minimum time a delegation must run before fast-completion deferral expires */
export const MIN_IDLE_TIME_MS = 5000
/** Activity-based stale timeout (45 minutes) — NOT a fixed deadline */
export const DEFAULT_STALE_TIMEOUT_MS = 45 * 60 * 1000
/** Minimum elapsed time since last message change before stability is declared */
export const MIN_STABILITY_TIME_MS = 10000
/** Number of consecutive stable polls required to confirm completion */
export const STABLE_POLLS_REQUIRED = 3
/** @deprecated Use STABLE_POLLS_REQUIRED instead */
export const STABILITY_THRESHOLD = STABLE_POLLS_REQUIRED
/** @deprecated Use adaptive interval calculation instead */
export const STABILITY_POLL_INTERVAL_MS = POLL_INTERVAL_BASE_MS
