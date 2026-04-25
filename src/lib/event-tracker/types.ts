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
  startedAt: number | null
  updatedAt: number
  status: "active" | "idle" | "completed"
  counters: SessionJourneyCounters
  actors: string[]
  subSessions: ParsedSubSession[]
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
