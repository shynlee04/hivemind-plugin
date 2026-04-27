export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "error" | "cancelled" | "interrupt"

export type TaskNotification = {
  sessionID: string
  description: string
  agent: string
  status: "started" | "completed" | "failed" | "cancelled"
  error?: string
  resultPreview?: string
  briefSummary?: string
  outputLink?: string
  duration?: number
  artifacts?: string[]
  commits?: string[]
  metadata?: {
    delegationId: string
    terminalState: DelegationStatus
    recoveryGuarantee?: DelegationRecoveryGuarantee
    summaryPreview?: string
  }
}

export type PendingNotification = TaskNotification & {
  createdAt: number
  delivered: boolean
}

export const MAX_DESCENDANTS_PER_ROOT = 10
export const VALID_DELEGATION_CATEGORIES = [
  "research",
  "implementation",
  "review",
  "visual-engineering",
  "deep",
  "quick",
] as const

export type SpecialistAgent = string
export type DelegationCategory = (typeof VALID_DELEGATION_CATEGORIES)[number]
export type PermissionAction = "allow" | "deny" | "ask"

export type PermissionRule = {
  permission: string
  pattern: string
  action: PermissionAction
}

export type SessionStatusType = "idle" | "busy" | "retry" | string

export type SessionStatus = {
  type: SessionStatusType
  [key: string]: unknown
}

export type RootBudget = {
  descendants: Set<string>
  reserved: number
}

export type LoopWindow = {
  signature: string
  count: number
}

export type ToolCallSummary = {
  tool: string
  args?: string
  output?: string
  status?: string
}

export type CapturedResult = {
  resultText: string
  artifactPaths: string[]
  gitCommits: string[]
  toolCallSummary: ToolCallSummary[]
  messageCount: number
  capturedAt: number
  partial?: boolean
}

export type SessionStats = {
  total: number
  byTool: Record<string, number>
  loop: LoopWindow
  warnings: string[]
}

export type DelegationMeta = {
  rootID: string
  depth: number
  budgetUsed: number
  agent: SpecialistAgent
  category?: DelegationCategory
  model?: string
  queueKey: string
  /** Per-session runtime-policy override from trusted continuity/delegation metadata. */
  runtimePolicyOverride?: SessionPolicyOverride
}

export type CompactionCheckpointData = {
  agent: string | null
  model: string | null
  tools: string[]
  delegationMeta: DelegationMeta | null
  warnings: string[]
  sessionStats: {
    total: number
    byTool: Record<string, number>
    loop: {
      signature: string
      count: number
    }
  }
  capturedAt: number
}

// ---------------------------------------------------------------------------
// Unified lifecycle status model
// ---------------------------------------------------------------------------
// Three overlapping status types exist. HarnessStatus is the canonical superset.
//
// MAPPING TABLE:
// ┌─────────────┬────────────────────────┬──────────────────────────┐
// │ HarnessStatus│ SessionLifecyclePhase  │ DelegationPacketStatus   │
// ├─────────────┼────────────────────────┼──────────────────────────┤
// │ pending     │ created                │ pending                  │
// │ queued      │ queued                 │ pending                  │
// │ dispatching │ dispatching            │ pending                  │
// │ running     │ running                │ running                  │
// │ completed   │ completed              │ completed                │
// │ failed      │ failed                 │ failed                   │
// │ error       │ failed                 │ failed                   │
// │ cancelled   │ failed                 │ failed                   │
// │ interrupt   │ (preserves previous)   │ (preserves previous)     │
// └─────────────┴────────────────────────┴──────────────────────────┘
//
// TaskStatus (8 values, no dispatching) is the continuity-store status.
// SessionLifecyclePhase (6 values, adds dispatching, no interrupt/cancelled).
// DelegationPacketStatus (4 values) is a coarse-grained packet view.
// ---------------------------------------------------------------------------

export type HarnessStatus =
  | "pending"
  | "queued"
  | "dispatching"
  | "running"
  | "completed"
  | "error"
  | "cancelled"
  | "interrupt"
  | "failed"

export type DelegationPacketStatus = "pending" | "running" | "completed" | "failed"

export const HARNESS_STATUS_TO_LIFECYCLE_PHASE: Record<
  Exclude<HarnessStatus, "interrupt">,
  "created" | "queued" | "dispatching" | "running" | "completed" | "failed"
> = {
  pending: "created",
  queued: "queued",
  dispatching: "dispatching",
  running: "running",
  completed: "completed",
  error: "failed",
  cancelled: "failed",
  failed: "failed",
} as const

// ---------------------------------------------------------------------------
// Runtime policy types (RESEARCH D-16: supplements OpenCode built-ins only)
// ---------------------------------------------------------------------------

export type PerKeyConcurrencyPolicy = {
  limit: number
  acquireTimeoutMs?: number
}

export type ConcurrencyPolicy = {
  globalLimit: number
  perKey?: Record<string, PerKeyConcurrencyPolicy>
}

export type BudgetPolicy = {
  maxToolCallsPerSession: number
  repeatedSignatureThreshold: number
  warningCap: number
  resetOnCompact: boolean
}

export type TrustedRuntimePolicy = {
  /**
   * Whether the host runtime is explicitly trusted to keep builtin async child
   * sessions alive beyond the immediate parent call lifecycle.
   */
  builtinAsyncBackgroundChildSessions: boolean
}

export type RuntimePolicy = {
  concurrency: ConcurrencyPolicy
  budget: BudgetPolicy
  trustedRuntime: TrustedRuntimePolicy
  categoryGate?: CategoryGatePolicy
  /** Maximum delegation nesting depth (default: 3) */
  maxDelegationDepth?: number
}

export type CategoryGateSurface = "agent-delegation" | "command-process"

/** Narrowing-only delegation category gate policy. */
export type CategoryGatePolicy = {
  denyUnknownCategories: boolean
  readonlyCategories: readonly string[]
  commandCategory: string
}

/** Auditable category gate allow/deny decision. */
export type CategoryGateDecision = {
  allowed: boolean
  reason: string
  category?: string
  audit: {
    gate: "category"
    denyReason?: string
  }
}

export type SessionBudgetOverride = Partial<BudgetPolicy>

export type SessionConcurrencyOverride = {
  globalLimit?: number
  perKey?: Record<string, PerKeyConcurrencyPolicy>
}

export type SessionPolicyOverride = {
  concurrency?: SessionConcurrencyOverride
  budget?: SessionBudgetOverride
  trustedRuntime?: Partial<TrustedRuntimePolicy>
  /** Override for max delegation nesting depth */
  maxDelegationDepth?: number
}

export type ResolvedConcurrencyPolicy = {
  limit: number
  acquireTimeoutMs?: number
}

export type ResolvedBudgetPolicy = BudgetPolicy

// ---------------------------------------------------------------------------
// Lifecycle state types
// ---------------------------------------------------------------------------

export type SessionLifecyclePhase =
  | "created"
  | "queued"
  | "dispatching"
  | "running"
  | "completed"
  | "failed"

export type SessionLifecycleState = {
  phase: SessionLifecyclePhase
  launchedAt?: number
  completedAt?: number
  runMode?: string
  queue?: { active: number; limit: number; pending: number }
  observation?: { source: string; observedAt: number; detail: string }
  error?: string
}

// ---------------------------------------------------------------------------
// Continuity store types
// ---------------------------------------------------------------------------

export type SessionPromptParams = {
  agent?: string
  category?: string
  tools?: string[]
  [key: string]: unknown
}

export type SessionToolProfile = {
  allowed?: string[]
  denied?: string[]
  [key: string]: unknown
}

export type DelegationPacket = {
  id: string
  createdAt: number
  spec: string
  plan?: string
  artifacts: string[]
  commits: string[]
  parentChain: string[]
  status: DelegationPacketStatus
  updatedAt: number
}

export type SessionContinuityMetadata = {
  status: TaskStatus
  description: string
  delegation: DelegationMeta | null
  category?: string
  constraints: string[]
  lifecycle?: SessionLifecycleState
  pendingNotifications: PendingNotification[]
  resultCapture?: CapturedResult
  compactionCheckpoint?: CompactionCheckpointData
  delegationPacket?: DelegationPacket
  route?: string
  lastToolActivityAt?: number
  updatedAt: number
}

export type SessionContinuityRecord = {
  sessionID: string
  promptParams: SessionPromptParams
  toolProfile?: SessionToolProfile
  metadata: SessionContinuityMetadata
}

// ---------------------------------------------------------------------------
// Governance persistence types
// ---------------------------------------------------------------------------

export type GovernanceRule = {
  id: string
  condition: { toolNames?: string[]; sessionIDs?: string[]; [key: string]: unknown }
  action: { type: string; escalation?: Record<string, unknown>; [key: string]: unknown }
  enabled: boolean
}

export type GovernanceViolation = {
  ruleId: string
  sessionID: string
  timestamp: number
  detail: string
  escalation?: Record<string, unknown>
}

export type GovernancePersistenceState = {
  rules: GovernanceRule[]
  violations: GovernanceViolation[]
  updatedAt: number
}

export type ContinuityStoreFile = {
  version: number
  updatedAt: number
  sessions: Record<string, SessionContinuityRecord>
  governance: GovernancePersistenceState
}

// ---------------------------------------------------------------------------
// Checkpoint data type (for compaction lifecycle)
// ---------------------------------------------------------------------------

export type CheckpointData = CompactionCheckpointData

// ---------------------------------------------------------------------------
// Delegation types (Phase 14) — WaiterModel + Dual-Signal Architecture
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Config workflow state machine types (Phase 16.5 fix)
// Extracted to config-workflow/workflow-types.ts to maintain 500 LOC limit.
// Re-exported here for backward compatibility — existing imports unchanged.
// ---------------------------------------------------------------------------

export type {
  ConfigWorkflowState,
  WorkflowTurn,
  WorkflowTurnRecord,
  WorkflowTurnStatus,
  WorkflowResumeResult,
} from "./config-workflow/workflow-types.js"

export { WORKFLOW_TURNS } from "./config-workflow/workflow-types.js"
