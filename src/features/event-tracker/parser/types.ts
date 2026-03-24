/**
 * Parser-specific type definitions.
 *
 * @module event-tracker/parser/types
 */

export interface ParsedHeader {
  title: string
  timestamp: string
  sessionId: string
  created: string
  updated: string
}

export interface ParsedTurn {
  turnNumber: number
  userMessage: string
  assistantContent: string
  thinking: string | null
  agentName: string
  model: string
  duration: number | null
  isCompaction: boolean
  delegationTargets: ParsedDelegation[]
  timestamp?: string
  beforeSummary?: string
  afterSummary?: string
}

export interface ParsedDelegation {
  delegatedTo: string
  description: string
  subagentType: string
  packetId: string | null
}

export interface TurnCounters {
  userMessageCount: number
  agentOutputCount: number
  delegationCount: number
}

export interface ParsedSession {
  header: ParsedHeader
  turns: ParsedTurn[]
  counters: TurnCounters
  delegations: ParsedDelegation[]
}

export function createEmptyHeader(): ParsedHeader {
  return {
    title: 'N/A',
    timestamp: 'N/A',
    sessionId: 'N/A',
    created: 'N/A',
    updated: 'N/A',
  }
}
