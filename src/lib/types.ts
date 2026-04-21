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

export interface Delegation {
  id: string
  parentSessionId: string
  childSessionId: string
  agent: string
  status: DelegationStatus
  result?: string
  error?: string
  createdAt: number
  completedAt?: number
  /** Optional max runtime ceiling — NOT a deadline. Tasks run until dual-signal confirms completion. */
  safetyCeilingMs?: number
  /** Last known message count from child session (for stability tracking) */
  lastMessageCount: number
  /** Number of consecutive stable polls (message count unchanged) */
  stablePollCount: number
  executionMode: "sdk" | "pty" | "headless"
  workingDirectory: string
  ptySessionId?: string
  fallbackReason?: string
  queueKey: string
}

export interface DelegationResult {
  status: DelegationStatus
  result?: string
  error?: string
  delegationId: string
  executionMode?: "sdk" | "pty" | "headless"
  workingDirectory?: string
  ptySessionId?: string
  fallbackReason?: string
  queueKey?: string
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
/** Dual-signal: number of stable polls required to confirm completion */
export const STABILITY_THRESHOLD = 3
/** Dual-signal: interval between stability polls (ms) */
export const STABILITY_POLL_INTERVAL_MS = 3000
export const MAX_DELEGATION_DEPTH = 1
