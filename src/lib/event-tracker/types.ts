export type JourneyEventType =
  | "session_start"
  | "session_updated"
  | "session_idle"
  | "session_end"
  | "session_event"

export type SessionJourneyEvent = {
  id: string
  sessionId: string
  rootSessionId?: string
  artifactStem: string
  type: JourneyEventType
  actor: "system" | "agent" | "human" | "tool"
  title: string
  summary: string
  timestamp: number
  source: string
  stateRole: "audit trail"
  toolUsage?: SessionJourneyToolUsage
  delegation?: SessionJourneyDelegation
}

export type SessionJourneyToolUsage = {
  toolName: string
  status: string
  summary: string
  timestamp: number
}

export type SessionJourneyDelegation = {
  packetId: string | null
  subSessionId: string | null
  delegatedTo: string
  description: string
  subagentType: string
  status: string
}

export type SessionJourneyCounters = {
  eventCount: number
  sessionStartCount: number
  sessionEndCount: number
}

export type SessionJourneyTocEntry = {
  index: number
  timestamp: number
  actor: string
  type: JourneyEventType
  summary: string
}

export type SessionJourneyDocument = {
  _schema: "harness/event-tracker/v1"
  sessionId: string
  semanticSessionId: string
  artifactStem: string
  mainSessionId: string | null
  lineage: string[]
  purposeClass: string
  keyFindings: string[]
  resumable: boolean
  startedAt: number | null
  updatedAt: number
  status: "active" | "idle" | "completed"
  counters: SessionJourneyCounters
  actors: string[]
  subSessions: ParsedSubSession[]
  delegations: SessionJourneyDelegation[]
  toolsUsed: SessionJourneyToolUsage[]
  lastMessageOutput: string
  exportMeta: ParsedSessionExportMeta | null
  toc: SessionJourneyTocEntry[]
  events: SessionJourneyEvent[]
}

export type JourneyEventHookInput = {
  event: unknown
  timestamp?: number
  source?: string
}

export type EventTrackerArtifactPaths = {
  dir: string
  jsonPath: string
  markdownPath: string
  artifactStem: string
}

export type EventTrackerFileSystem = {
  existsSync(path: string): boolean
  mkdirSync(path: string, options: { recursive: true }): void
  readFileSync(path: string, encoding: BufferEncoding): string
  readdirSync?: (path: string) => string[]
  writeFileSync(path: string, data: string, encoding: BufferEncoding): void
}

export type WriteSessionJourneyArtifactsInput = {
  projectRoot: string
  event: SessionJourneyEvent
  fs?: EventTrackerFileSystem
}

export type WriteSessionJourneyArtifactsResult = {
  paths: EventTrackerArtifactPaths
  document: SessionJourneyDocument
  written: boolean
}

export type CleanupEventTrackerArtifactsInput = {
  projectRoot: string
  keepArtifactStems: string[]
}

export type CleanupEventTrackerArtifactsResult = {
  dir: string
  kept: string[]
  removed: string[]
}

export type CreateEventTrackerArtifactsFromHookInput = {
  projectRoot: string
  hook: JourneyEventHookInput
  fs?: EventTrackerFileSystem
}

export type ParsedSessionJourneyMeta = {
  sessionId: string
  artifactStem: string
  status: SessionJourneyDocument["status"]
  counters: SessionJourneyCounters
  eventTypes: JourneyEventType[]
}

export type ParsedSessionHeader = {
  title: string
  sessionId: string
  created: string
  updated: string
}

export type ParsedToolInvocation = {
  toolName: string
  input: string
  outputSummary: string
}

export type ParsedDelegationTarget = {
  packetId: string | null
  subSessionId: string | null
  delegatedTo: string
  description: string
  subagentType: string
}

export type ParsedSubSession = {
  sessionId: string
  role: string
  delegatedTo: string
  sourceSessionId: string
  description: string
}

export type ParsedSessionExportMeta = {
  title: string
  artifactStem: string
  created: string
  updated: string
  turnCount: number
}

export type ParsedSessionTurn = {
  turnNumber: number
  userMessage: string
  assistantContent: string
  thinking: string | null
  agentName: string
  model: string
  durationMs: number | null
  toolInvocations: ParsedToolInvocation[]
  delegations: ParsedDelegationTarget[]
}

export type ParsedSessionCounters = {
  userMessageCount: number
  assistantOutputCount: number
  toolCallCount: number
  delegationCount: number
}

export type ParsedSessionArtifact = {
  header: ParsedSessionHeader
  turns: ParsedSessionTurn[]
  counters: ParsedSessionCounters
  actors: string[]
  mainSessionId: string
  subSessions: ParsedSubSession[]
  lastMessageOutput: string
  meta: ParsedSessionExportMeta
}

export type MergeSessionExportMarkdownArtifactsInput = {
  projectRoot: string
  markdown: string
  source?: string
  fs?: EventTrackerFileSystem
}

/**
 * The 10 classified event types for the enhanced event tracker.
 *
 * These represent a higher-level taxonomy than {@link JourneyEventType},
 * focused on semantic categorization rather than hook-derived session phases.
 */
export const CLASSIFIED_EVENT_TYPES = [
  "user_message",
  "assistant_output",
  "tool_invocation",
  "delegation_created",
  "delegation_returned",
  "compaction",
  "session_start",
  "session_end",
  "injection",
  "error",
] as const

/** Union of the 10 classified event type strings. */
export type ClassifiedEventType = (typeof CLASSIFIED_EVENT_TYPES)[number]

/**
 * A classified event produced by the classification pipeline.
 *
 * Wraps the original raw event with a determined type and classification timestamp.
 *
 * @example
 * ```ts
 * const classified: ClassifiedEvent = {
 *   type: "user_message",
 *   original: { role: "user", content: "hello" },
 *   classifiedAt: Date.now(),
 * }
 * ```
 */
export type ClassifiedEvent = {
  /** The determined classified event type, or 'unknown' if no pattern matched. */
  type: ClassifiedEventType | "unknown"
  /** The original raw event data that was classified. */
  original: unknown
  /** Timestamp when the classification was performed. */
  classifiedAt: number
}

/** Valid delegation evidence state values. */
export const DELEGATION_EVIDENCE_STATES = ["partial", "blocked", "complete"] as const

/** Union type for delegation evidence states. */
export type DelegationEvidenceState = (typeof DELEGATION_EVIDENCE_STATES)[number]

/**
 * A delegation evidence record tracking the lifecycle state of a delegation.
 *
 * Records are immutable once created and stored in chronological order per delegation ID.
 *
 * @example
 * ```ts
 * const record: DelegationEvidenceRecord = {
 *   id: "del_001::partial::1700000000000",
 *   delegationId: "del_001",
 *   state: "partial",
 *   evidence: { toolCallsCompleted: 3, toolCallsTotal: 10 },
 *   timestamp: Date.now(),
 * }
 * ```
 */
export type DelegationEvidenceRecord = {
  /** Deterministic record identifier derived from delegationId, state, and timestamp. */
  id: string
  /** The delegation identifier this evidence record belongs to. */
  delegationId: string
  /** The current lifecycle state of the delegation. */
  state: DelegationEvidenceState
  /** Arbitrary evidence data associated with this state transition. */
  evidence: Record<string, unknown>
  /** Timestamp when this evidence record was created. */
  timestamp: number
}

/**
 * Filesystem adapter for dual persistence, extending the base tracker FS with append.
 *
 * Used by {@link createDualPersistence} to write both atomic JSON and append-only Markdown.
 */
export type DualPersistenceFileSystem = EventTrackerFileSystem & {
  /** Append data to a file, creating it if it does not exist. */
  appendFileSync(path: string, data: string, encoding: BufferEncoding): void
}
