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
  | "restarted"
  | "runtime-dispatch-unsupported"
  | "interrupted-by-signal"
  | "non-resumable-after-restart"

export type DelegationExecutionState = "pending" | "confirmed" | "unconfirmed" | "stalled"
export type DelegationSignalSource = "action" | "event" | "message" | "polling" | "tool"
export type DelegationEvidenceLevel = "accepted-only" | "status-only" | "message" | "tool" | "message-and-tool" | "file-change"

export interface Delegation {
  id: string
  parentSessionId: string
  childSessionId: string
  agent: string
  prompt?: string
  status: DelegationStatus
  result?: string
  resultTruncated?: boolean
  error?: string
  createdAt: number
  completedAt?: number
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
  redirectedFrom?: string
  restartedFrom?: string
  executionState?: DelegationExecutionState
  firstActionAt?: number
  signalSource?: DelegationSignalSource
  actionCount?: number
  messageCount?: number
  toolCallCount?: number
  evidenceLevel?: DelegationEvidenceLevel
  finalMessageExcerpt?: string
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
  childSessionId?: string
  executionState?: DelegationExecutionState
  firstActionAt?: number
  signalSource?: DelegationSignalSource
  actionCount?: number
  messageCount?: number
  toolCallCount?: number
  evidenceLevel?: DelegationEvidenceLevel
  finalMessageExcerpt?: string
}

/** Notification types emitted by the delegate-task v2 routing layer. */
export type DelegationNotificationType = "success" | "failure" | "progress" | "timeout"

/** Failure checkpoint levels for progressive delegation monitoring. */
export type FailureLevel = 0 | 1 | 2 | 3 | 4

/** Result emitted when a failure checkpoint detects no action progress. */
export interface FailureCheckpointResult {
  delegationId: string
  level: FailureLevel
  elapsedSeconds: number
  actionCountAtCheckpoint: number
  actionCountAtPreviousCheckpoint: number
  isFinal: boolean
  isAutoAbort?: boolean
}

/** Per-delegation checkpoint state tracked during monitoring. */
export interface DelegationCheckpointState {
  lastCheckpointActionCount: number
  failureLevel: FailureLevel
  injectionStopped: boolean
  completed: boolean
}

export const POLLING_CADENCE = [30, 45, 60, 90, 120, 180] as const
export type PollingCadence = typeof POLLING_CADENCE

export const FAILURE_CHECKPOINTS = [60, 120, 180, 300] as const
export type FailureCheckpointThresholds = typeof FAILURE_CHECKPOINTS

/** @deprecated Use FAILURE_CHECKPOINTS — kept for backward compatibility */
export const ESCALATION_THRESHOLDS = FAILURE_CHECKPOINTS
/** @deprecated Use FailureCheckpointThresholds — kept for backward compatibility */
export type EscalationThresholds = FailureCheckpointThresholds

/** @deprecated Legacy escalation level — maps to failure checkpoint semantics */
export type EscalationLevel = "WARN" | "NUDGE" | "ALERT" | "TERMINATE"

/** Legacy icon constants — kept for backward compatibility with existing tests and consumers */
export const ESCALATION_ICONS = ["⚠", "⚠", "🔴", "⛔", "🛑"] as const

/** Compact notification payload routed back to the parent session. */
export interface DelegationNotification {
  idempotencyKey?: string
  type: DelegationNotificationType
  delegationId: string
  message: string
  timestamp: number
}

/** Snapshot of active delegation slots for a parent session. */
export interface SlotInfo {
  acquired: number
  maxSlots: number
  perKeyUsage: Map<string, number>
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
  }
}

export const DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000 // 30 minutes
export const MAX_DELEGATION_DEPTH = 3

/** Grace period before in-memory cleanup of terminal delegations (10 minutes) */
export const TASK_CLEANUP_DELAY_MS = 10 * 60 * 1000
/** Maximum delegations before batch pruning kicks in */
export const MAX_DELEGATIONS_BEFORE_PRUNE = 50
/** Max age for batch pruning of terminal delegations (30 minutes) */
export const DEFAULT_PRUNE_MAX_AGE_MS = 30 * 60 * 1000

/** Active child message polling interval. */
export const POLL_INTERVAL_ACTIVE_MS = 2000
/** Base stable child polling interval. */
export const POLL_INTERVAL_BASE_MS = 5000
/** Idle child polling interval. */
export const POLL_INTERVAL_IDLE_MS = 10000
/** Deep-idle child polling interval. */
export const POLL_INTERVAL_DEEP_IDLE_MS = 30000

/** Minimum runtime before fast-completion deferral expires. */
export const MIN_IDLE_TIME_MS = 5000
/** Activity-based stale timeout (45 minutes) — NOT a fixed deadline. */
export const DEFAULT_STALE_TIMEOUT_MS = 45 * 60 * 1000
/** Minimum elapsed time since last message change before stability. */
export const MIN_STABILITY_TIME_MS = 10000
/** Number of stable polls required to confirm completion. */
export const STABLE_POLLS_REQUIRED = 3
export const STABILITY_THRESHOLD = STABLE_POLLS_REQUIRED
export const STABILITY_POLL_INTERVAL_MS = POLL_INTERVAL_BASE_MS
