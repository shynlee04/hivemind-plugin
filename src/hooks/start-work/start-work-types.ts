import type { KernelLineage, SessionScope } from '../../context/prompt-packet/prompt-packet-types.js'

export type PurposeClass =
  | 'discovery'
  | 'brainstorming'
  | 'research'
  | 'planning'
  | 'implementation'
  | 'gatekeeping'
  | 'tdd'
  | 'course-correction'

export type SessionStateKind = 'fresh' | 'ongoing' | 'continuation' | 'sub-session'
export type RuntimeRiskLevel = 'none' | 'gated' | 'blocked'

export interface StartWorkInput {
  userMessage: string
  sessionId: string
  sessionScope: SessionScope
  parentSessionId?: string
  attachments?: string[]
  activeLineage?: KernelLineage
  hasHivemind: boolean
  hivemindHealthy: boolean
  hasWorkflow: boolean
  hasHandoff: boolean
}

export interface ReadinessGate {
  blocking: boolean
  commandId?: string
  reason: string
}

export interface StartWorkDecision {
  sessionId: string
  sessionScope: SessionScope
  sessionState: SessionStateKind
  lineage: KernelLineage
  purposeClass: PurposeClass
  confidence: number
  reasons: string[]
  readiness: ReadinessGate[]
  requiredCommandId?: string
  recommendedCommandId?: string
  autoRoute: boolean
  riskLevel: RuntimeRiskLevel
}
