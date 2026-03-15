import type { KernelLineage, SessionScope } from '../../context/prompt-packet/prompt-packet-types.js'
import type { ControlPlanePrimitiveId } from '../../control-plane/index.js'
import type { TrajectoryAssessment } from '../../core/trajectory/index.js'
import type { WorkflowAuthorityStatus } from '../../core/workflow-management/index.js'
import type { OpencodeKnowledgeSurface } from '../../shared/opencode-knowledge.js'
import type {
  RuntimePressureContract,
  RuntimePressureId,
} from '../../shared/pressure-contract.js'

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
export type TraversalOutcome = 'bootstrap' | 'repair' | 'route' | 'refuse'

export interface StartWorkInput {
  userMessage: string
  sessionId: string
  sessionScope: SessionScope
  projectRoot?: string
  workflowId?: string
  taskIds?: string[]
  parentSessionId?: string
  attachments?: string[]
  activeLineage?: KernelLineage
  activeAgent?: string
  turnCount?: number
  hasRuntimeAttachment?: boolean
  profileComplete?: boolean
  hasHivemind?: boolean
  hivemindHealthy?: boolean
  hasWorkflow?: boolean
  hasHandoff?: boolean
}

export interface ReadinessGate {
  blocking: boolean
  primitiveId?: ControlPlanePrimitiveId
  commandId?: string
  reason: string
  pressureId?: RuntimePressureId
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
  traversalOutcome: TraversalOutcome
  commandAgent?: string
  continuityAlerts: string[]
  workflowAuthority?: WorkflowAuthorityStatus
  trajectoryAssessment?: TrajectoryAssessment
  routeDisposition?: 'attach' | 'resume' | 'create' | 'defer' | 'refuse'
  nextTransition?: string
  requiredControlPlaneId?: ControlPlanePrimitiveId
  recommendedControlPlaneId?: ControlPlanePrimitiveId
  requiredCommandId?: string
  recommendedCommandId?: string
  programmaticInitiationRequired: boolean
  autoRoute: boolean
  riskLevel: RuntimeRiskLevel
  opencodeKnowledge: OpencodeKnowledgeSurface[]
  pressureSignals: RuntimePressureId[]
  pressureContract: RuntimePressureContract
}
