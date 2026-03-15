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

/** Core session identity and classification */
export interface StartWorkCore {
  sessionId: string
  sessionScope: SessionScope
  sessionState: SessionStateKind
  lineage: KernelLineage
  purposeClass: PurposeClass
  confidence: number
  reasons: string[]
}

/** Routing and traversal decisions */
export interface StartWorkRouting {
  traversalOutcome: TraversalOutcome
  routeDisposition?: 'attach' | 'resume' | 'create' | 'defer' | 'refuse'
  nextTransition?: string
  commandAgent?: string
  autoRoute: boolean
  programmaticInitiationRequired: boolean
}

/** Downstream context — readiness, workflow, trajectory state */
export interface StartWorkContext {
  readiness: ReadinessGate[]
  continuityAlerts: string[]
  workflowAuthority?: WorkflowAuthorityStatus
  trajectoryAssessment?: TrajectoryAssessment
  opencodeKnowledge: OpencodeKnowledgeSurface[]
}

/** Meta signals — pressure, risk, control plane */
export interface StartWorkMeta {
  riskLevel: RuntimeRiskLevel
  pressureSignals: RuntimePressureId[]
  pressureContract: RuntimePressureContract
  requiredControlPlaneId?: ControlPlanePrimitiveId
  recommendedControlPlaneId?: ControlPlanePrimitiveId
  requiredCommandId?: string
  recommendedCommandId?: string
}

/** Full start-work decision — composed via intersection for backward compatibility */
export type StartWorkDecision = StartWorkCore
  & StartWorkRouting
  & StartWorkContext
  & StartWorkMeta
