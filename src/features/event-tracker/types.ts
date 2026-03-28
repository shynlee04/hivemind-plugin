/**
 * Event Tracker Types
 *
 * Type definitions for the session journal / event tracking system.
 * Covers union literal types, sentinel constants, and core interfaces.
 *
 * @module event-tracker/types
 */

// ---------------------------------------------------------------------------
// Union Literal Types
// ---------------------------------------------------------------------------

/** Kinds of events recorded in the session journal. */
export type EventType =
  | 'user_message'
  | 'assistant_output'
  | 'tool_invocation'
  | 'delegation_created'
  | 'delegation_returned'
  | 'compaction'
  | 'session_start'
  | 'session_end'
  | 'injection'
  | 'error'

/** Event importance tier — controls retention and alerting. */
export type Importance = 'high' | 'medium' | 'low'

/** Which subsystem generated the session. */
export type Lineage = 'hivefiver' | 'hiveminder'

/** Classification of the session's purpose. */
export type PurposeClass =
  | 'discovery'
  | 'brainstorming'
  | 'research'
  | 'planning'
  | 'implementation'
  | 'gatekeeping'
  | 'tdd'
  | 'course-correction'

/** Role this turn plays in the delegation tree. */
export type TurnType = 'root' | 'delegation' | 'handoff' | 'correction'

/** How sub-agent work is scheduled. */
export type DelegationMode = 'sequential' | 'parallel' | 'handoff'

/** Lifecycle state of a delegation packet. */
export type DelegationStatus = 'pending' | 'active' | 'completed' | 'failed' | 'timed-out'

// ---------------------------------------------------------------------------
// Sentinel Constants
// ---------------------------------------------------------------------------

/** Every EventType value, in declaration order. */
export const EVENT_TYPES = [
  'user_message',
  'assistant_output',
  'tool_invocation',
  'delegation_created',
  'delegation_returned',
  'compaction',
  'session_start',
  'session_end',
  'injection',
  'error',
] as const

/** Every Importance value, in declaration order. */
export const IMPORTANCE_VALUES = ['high', 'medium', 'low'] as const

/** Every Lineage value, in declaration order. */
export const LINEAGE_VALUES = ['hivefiver', 'hiveminder'] as const

/** Every PurposeClass value, in declaration order. */
export const PURPOSE_CLASS_VALUES = [
  'discovery',
  'brainstorming',
  'research',
  'planning',
  'implementation',
  'gatekeeping',
  'tdd',
  'course-correction',
] as const

/** Every TurnType value, in declaration order. */
export const TURN_TYPE_VALUES = ['root', 'delegation', 'handoff', 'correction'] as const

/** Every DelegationMode value, in declaration order. */
export const DELEGATION_MODE_VALUES = ['sequential', 'parallel', 'handoff'] as const

/** Every DelegationStatus value, in declaration order. */
export const DELEGATION_STATUS_VALUES = [
  'pending',
  'active',
  'completed',
  'failed',
  'timed-out',
] as const

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/** Core immutable identity fields for a session. */
export interface SessionCore {
  sessionId: string
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  created: string
  updated: string
}

/** Relational links to parent and child sessions. */
export interface SessionRelationships {
  parentSessionId: string | null
  childSessionIds: string[]
}

/** Activity counters for a session. */
export interface SessionMetrics {
  userMessageCount: number
  agentOutputCount: number
  delegationCount: number
}

/** Metadata for an entire session journal. */
export type SessionMeta = SessionCore & SessionRelationships & {
  status: 'active' | 'completed' | 'abandoned'
} & SessionMetrics

/** Metadata for a single turn within a session. */
export interface TurnMeta {
  turnNumber: number
  turnType: TurnType
  turnDepth: number
  siblingCount: number
  timestamp: string
  agent: string
  model: string
  duration: number | null
}

/** A single tool call within a turn. */
export interface ToolInvocation {
  toolName: string
  input: string
  outputSummary: string
  timestamp: string
}

/** A single event recorded in the journal. */
export interface EventEntry {
  id: string
  sessionId: string
  turnNumber: number
  type: EventType
  importance: Importance
  timestamp: string
  data: Record<string, unknown>
}

/** All data produced in a single turn. */
export interface TurnEntry {
  meta: TurnMeta
  userMessage: string
  assistantContent: string
  thinking: string | null
  toolInvocations: ToolInvocation[]
  events: EventEntry[]
}

/** Identity fields that uniquely identify a delegation. */
export interface DelegationIdentity {
  packetId: string
  taskId: string
  parentSessionId: string
}

/** Target of the delegation. */
export interface DelegationTarget {
  subSessionId: string | null
  delegatedTo: string
  description: string
  subagentType: string
}

/** Outcome and lifecycle fields for a delegation. */
export interface DelegationOutcome {
  delegationMode: DelegationMode
  status: DelegationStatus
  createdAt: string
  returnedAt: string | null
  duration: number | null
  artifacts: string[]
}

/** A delegation packet and its resulting sub-session record. */
export type DelegationRecord = DelegationIdentity & DelegationTarget & DelegationOutcome

// ---------------------------------------------------------------------------
// Session Writer Input Contracts
// ---------------------------------------------------------------------------

/** Input for creating or updating session.json metadata. */
export type SessionMetadataInput = {
  sessionId: string
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  timestamp: string
  status?: SessionMeta['status']
  parentSessionId?: string | null
}

/** Input for appending a delegation block to delegation.md. */
export type SessionDelegationAppendInput = {
  sessionId: string
  timestamp: string
  packetId: string
  delegatedTo: string
  status: string
  summary: string
  details?: string
}

/** Input for appending an injection block to injection.md. */
export type SessionInjectionAppendInput = {
  sessionId: string
  timestamp: string
  source: string
  summary: string
  payload: string
}

// ---------------------------------------------------------------------------
// Index + Synthesis Read-Model Projections
// ---------------------------------------------------------------------------

/**
 * Read-model projection of SessionMeta for the master index.
 * Flattened summary — not a persistence contract.
 */
export interface IndexEntry {
  sessionId: string
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  status: SessionMeta['status']
  created: string
  updated: string
  turnCount: number
  delegationCount: number
  parentSessionId: string | null
}

/**
 * Read-model projection of TurnMeta for synthesis display.
 * Adds delegationCount and userMessagePreview; drops turnType/depth/siblingCount.
 */
export interface SynthesisTurnSummary {
  turnNumber: number
  agent: string
  model: string
  duration: number | null
  delegationCount: number
  userMessagePreview: string
}

/**
 * Read-model projection of DelegationRecord for synthesis display.
 * Display-only — 5 fields vs 12 in full DelegationRecord.
 */
export interface SynthesisDelegationEntry {
  packetId: string
  delegatedTo: string
  subagentType: string
  status: DelegationStatus
  description: string
}

/**
 * Read-model projection of EventEntry for synthesis display.
 * Summary-only — 3 fields vs 7 in full EventEntry.
 */
export interface SynthesisEventEntry {
  turnNumber: number
  type: EventType
  summary: string
}

/**
 * Read-model projection for generating a session synthesis artifact.
 * Composes summary projections of TurnMeta, DelegationRecord, EventEntry.
 */
export interface SynthesisInput {
  sessionId: string
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  status: SessionMeta['status']
  created: string
  updated: string
  turns: SynthesisTurnSummary[]
  delegations: SynthesisDelegationEntry[]
  highImportanceEvents: SynthesisEventEntry[]
  compactionCount: number
}

/**
 * Recursive tree node for session hierarchy.
 * Authoritative location for SessionTreeNode — do not redefine inline.
 */
export interface SessionTreeNode {
  entry: IndexEntry
  children: SessionTreeNode[]
}

// ---------------------------------------------------------------------------
// Session V3 (ADR-017)
// ---------------------------------------------------------------------------

/** Activity counters for a SessionV3 record. */
export interface SessionV3Counters {
  userMessageCount: number
  assistantOutputCount: number
  toolCallCount: number
  delegationCount: number
  compactionCount: number
}

/** A single entry in the session's auto-generated table of contents. */
export interface TableOfContentsEntry {
  turnNumber: number
  timestamp: string
  type: 'user_message' | 'assistant_output' | 'delegation' | 'compaction' | 'error'
  summary: string
}

/**
 * Session V3 record schema (ADR-017).
 * The canonical persisted shape for session.json going forward.
 */
export interface SessionV3 {
  _schema: 'session/v3'
  sessionId: string
  semanticSessionId: string
  parentSessionId: string | null
  lineage: Lineage
  purposeClass: PurposeClass
  agent: string
  startedAt: string
  endedAt: string | null
  turnCount: number
  status: 'active' | 'completed' | 'errored'
  summary: string
  keyFindings: string[]
  subsessionIds: string[]
  resumable: boolean
  counters: SessionV3Counters
  toc: TableOfContentsEntry[]
}
