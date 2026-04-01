export const MAX_DESCENDANTS_PER_ROOT = 10

export const VALID_AGENTS = ["researcher", "builder", "critic"] as const
export const VALID_DELEGATION_CATEGORIES = [
  "research",
  "implementation",
  "review",
  "visual-engineering",
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
}

export type DelegationRouteResolution = {
  requestedCategory?: DelegationCategory
  category?: DelegationCategory
  requestedAgent?: SpecialistAgent
  effectiveAgent: SpecialistAgent
  requestedModel?: string
  effectiveModel?: string
  temperature: number
  guidanceText?: string
  modelSource: "explicit" | "category" | "none"
  agentSource: "explicit" | "category"
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
  title: string
  description: string
  category?: DelegationCategory
  route?: DelegationRouteResolution
  scope?: string
  constraints: string[]
  runInBackground: boolean
  status: "created" | "running" | "completed" | "failed"
  createdAt: number
  updatedAt: number
  lastObservedAt?: number
  lastError?: string
  lifecycle?: SessionLifecycleState
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
}
