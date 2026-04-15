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
export const VALID_AGENTS = [
  "researcher", "builder", "critic", "general",
] as const
export const VALID_DELEGATION_CATEGORIES = [
  "research",
  "implementation",
  "review",
  "visual-engineering",
  "deep",
  "quick",
] as const

export type SpecialistAgent = (typeof VALID_AGENTS)[number]
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

export const LIFECYCLE_PHASE_TO_PACKET_STATUS: Record<SessionLifecyclePhase, DelegationPacketStatus> = {
  created: "pending",
  queued: "pending",
  dispatching: "pending",
  running: "running",
  completed: "completed",
  failed: "failed",
} as const

export type DelegationExecutionCharacteristics = {
  isParallel: boolean
  isInteractive: boolean
  isResearch: boolean
  isHeadless: boolean
  runInBackground: boolean
}

export type DelegationExecutionCapabilityEvidence = {
  hasTmux: boolean
  projectRoot: string
}

export type DelegationExecutionMetadata = {
  family: "visible-worker" | "built-in"
  submode: "tmux-pane" | "builtin-subsession" | "builtin-process"
  rationale: string
  characteristics: DelegationExecutionCharacteristics
  capabilityEvidence: DelegationExecutionCapabilityEvidence
}

export type DelegationPacket = {
  id: string
  spec: string
  plan: string | null
  artifacts: string[]
  commits: string[]
  parentChain: readonly string[]
  status: DelegationPacketStatus
  createdAt: number
  updatedAt: number
}

export type DelegationRouteResolution = {
  requestedCategory?: DelegationCategory
  category?: DelegationCategory
  requestedAgent?: SpecialistAgent
  effectiveAgent: SpecialistAgent
  presetKey: string
  requestedModel?: string
  effectiveModel?: string
  temperature: number
  fallbackUsed: boolean
  rationale: string
  guidanceText?: string
  modelSource: "explicit" | "category" | "none"
  agentSource: "explicit" | "category" | "signal"
  temperatureSource: "category" | "agent"
  warnings: string[]
}

export type SessionToolProfile = {
  permissionRules: PermissionRule[]
  compatibleTools: string[]
}

export type SessionPromptParams = {
  agent: SpecialistAgent
  category?: DelegationCategory
  model?: string
  temperature?: number
  guidanceText?: string
  tools: string[]
}

export type SessionLifecyclePhase =
  | "created"
  | "queued"
  | "dispatching"
  | "running"
  | "completed"
  | "failed"

export type SessionLifecycleQueueState = {
  active: number
  pending: number
  limit: number
  acquiredAt?: number
  releasedAt?: number
}

export type SessionLifecycleObservation = {
  source: string
  observedAt: number
  detail?: string
  statusType?: string
  sessionStatusType?: string
}

export type SessionLifecycleCleanup = {
  scheduledAt?: number
  completedAt?: number
  reason?: string
}

export type SessionLifecycleState = {
  phase: SessionLifecyclePhase
  runMode: "sync" | "async"
  queueKey: string
  launchedAt?: number
  completedAt?: number
  queue?: SessionLifecycleQueueState
  observation?: SessionLifecycleObservation
  cleanup?: SessionLifecycleCleanup
}

export type SessionContinuityMetadata = {
  parentSessionID: string
  rootSessionID: string
  delegation: DelegationMeta
  compactionCheckpoint?: CompactionCheckpointData
  delegationPacket?: DelegationPacket
  execution?: DelegationExecutionMetadata
  title: string
  description: string
  category?: DelegationCategory
  route?: DelegationRouteResolution
  scope?: string
  constraints: string[]
  runInBackground: boolean
  status: TaskStatus
  createdAt: number
  updatedAt: number
  lastObservedAt?: number
  lastToolActivityAt?: number
  lastError?: string
  lifecycle?: SessionLifecycleState
  pendingNotifications?: PendingNotification[]
  /** Launch-time dispatch config (09-04: explicit async contract) */
  defaultDispatchMode?: "async" | "sync"
  tmuxAvailability?: "auto" | "enabled" | "disabled"
  pollIntervalMs?: number
  resultCapture?: CapturedResult
}

export type SessionContinuityRecord = {
  sessionID: string
  toolProfile: SessionToolProfile
  promptParams: SessionPromptParams
  metadata: SessionContinuityMetadata
}

export type ContinuityStoreFile = {
  version: 1
  updatedAt: number
  sessions: Record<string, SessionContinuityRecord>
  governance?: GovernancePersistenceState
}

export type GovernanceScope = "tool.execute.before"

export type GovernanceCondition = {
  toolNames?: string[]
  sessionIDs?: string[]
}

export type GovernanceEscalation = {
  channel: "parent" | "session"
  severity: "low" | "medium" | "high"
}

export type GovernanceActionType = "warn" | "escalate" | "block"

export type GovernanceAction = {
  type: GovernanceActionType
  message: string
  escalation?: GovernanceEscalation
}

export type GovernanceRule = {
  id: string
  scope: GovernanceScope
  condition: GovernanceCondition
  action: GovernanceAction
  createdAt: number
  updatedAt: number
  source: string
}

export type GovernanceViolation = {
  id: string
  ruleID: string
  scope: GovernanceScope
  sessionID: string
  toolName?: string
  actionType: GovernanceActionType
  message: string
  escalation?: GovernanceEscalation
  createdAt: number
}

export type GovernancePersistenceState = {
  rules: GovernanceRule[]
  violations: GovernanceViolation[]
  updatedAt: number
}

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

export type RuntimePolicy = {
  concurrency: ConcurrencyPolicy
  budget: BudgetPolicy
}

export type SessionBudgetOverride = Partial<BudgetPolicy>

export type SessionConcurrencyOverride = {
  globalLimit?: number
  perKey?: Record<string, PerKeyConcurrencyPolicy>
}

export type SessionPolicyOverride = {
  concurrency?: SessionConcurrencyOverride
  budget?: SessionBudgetOverride
}

export type ResolvedConcurrencyPolicy = {
  limit: number
  acquireTimeoutMs?: number
}

export type ResolvedBudgetPolicy = BudgetPolicy
