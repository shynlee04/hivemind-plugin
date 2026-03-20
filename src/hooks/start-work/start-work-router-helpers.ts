import type { TrajectoryAssessmentAction } from '../../core/trajectory/index.js'
import type {
  RuntimeRiskLevel,
  StartWorkDecision,
  StartWorkInput,
  TraversalOutcome,
} from '../../features/session-entry/start-work-types.js'
import { resolveLineage } from '../../features/session-entry/lineage-router.js'
import type { RuntimePressureId } from '../../shared/pressure-contract.js'

const AUTO_ROUTE_PURPOSES = new Set([
  'research',
  'planning',
  'implementation',
  'gatekeeping',
  'tdd',
  'course-correction',
])

export function resolveRiskLevel(
  input: StartWorkInput,
  requiredControlPlaneId: StartWorkDecision['requiredControlPlaneId'],
  continuityAlerts: string[],
  wrongAgent: boolean,
  trajectoryAction?: TrajectoryAssessmentAction,
): RuntimeRiskLevel {
  if (trajectoryAction === 'refuse-conflict') {
    return 'blocked'
  }

  if (requiredControlPlaneId === 'hm-init' || requiredControlPlaneId === 'hm-doctor') {
    return 'blocked'
  }

  if (wrongAgent || continuityAlerts.length > 0) {
    return 'gated'
  }

  if (input.activeLineage && input.activeLineage !== resolveLineage(input.userMessage, input.activeLineage).lineage) {
    return 'gated'
  }

  return 'none'
}

export function resolveRecommendedCommand(
  purposeClass: StartWorkDecision['purposeClass'],
): string | undefined {
  const commandMap: Record<StartWorkDecision['purposeClass'], string | undefined> = {
    discovery: undefined,
    brainstorming: undefined,
    research: 'hm-research',
    planning: 'hm-plan',
    implementation: 'hm-implement',
    gatekeeping: 'hm-verify',
    tdd: 'hm-tdd',
    'course-correction': 'hm-course-correct',
  }

  return commandMap[purposeClass]
}

export function resolveTraversalOutcome(
  requiredControlPlaneId: StartWorkDecision['requiredControlPlaneId'],
  wrongAgent: boolean,
  trajectoryAction?: TrajectoryAssessmentAction,
): TraversalOutcome {
  if (wrongAgent || trajectoryAction === 'refuse-conflict') {
    return 'refuse'
  }

  if (requiredControlPlaneId === 'hm-init') {
    return 'bootstrap'
  }

  if (requiredControlPlaneId === 'hm-doctor') {
    return 'repair'
  }

  return 'route'
}

export function resolveRouteDisposition(
  trajectoryAction: TrajectoryAssessmentAction | undefined,
): StartWorkDecision['routeDisposition'] {
  if (trajectoryAction === 'attach-active') {
    return 'attach'
  }

  if (trajectoryAction === 'resume-closed') {
    return 'resume'
  }

  if (trajectoryAction === 'defer-pending') {
    return 'defer'
  }

  if (trajectoryAction === 'refuse-conflict') {
    return 'refuse'
  }

  return 'create'
}

export function isAttachOrResumeAction(
  trajectoryAction: TrajectoryAssessmentAction | undefined,
): boolean {
  return trajectoryAction === 'attach-active' || trajectoryAction === 'resume-closed'
}

export function resolvePressureSignals(
  input: StartWorkInput,
  readinessPressureIds: RuntimePressureId[],
  trajectoryAction: TrajectoryAssessmentAction | undefined,
  wrongAgent: boolean,
): RuntimePressureId[] {
  const pressureSignals = new Set<RuntimePressureId>(readinessPressureIds)

  if (trajectoryAction === 'attach-active' || trajectoryAction === 'resume-closed') {
    pressureSignals.add('trajectory-continuation')
  }

  if (trajectoryAction === 'refuse-conflict' || wrongAgent) {
    pressureSignals.add('active-trajectory-conflict')
  }

  if (input.sessionScope === 'sub-session' || input.hasHandoff) {
    pressureSignals.add('delegated-handoff')
  }

  if (pressureSignals.size === 0) {
    pressureSignals.add('steady-state')
  }

  return [...pressureSignals]
}

export function shouldAutoRoute(input: {
  purposeClass: StartWorkDecision['purposeClass']
  purposeReasons: string[]
  confidence: number
  traversalOutcome: TraversalOutcome
  riskLevel: RuntimeRiskLevel
  programmaticInitiationRequired: boolean
}): boolean {
  if (input.programmaticInitiationRequired) {
    return true
  }

  return input.traversalOutcome === 'route'
    && AUTO_ROUTE_PURPOSES.has(input.purposeClass)
    && !input.purposeReasons.includes('mixed-intent')
    && input.confidence >= 0.5
    && input.riskLevel === 'none'
}
