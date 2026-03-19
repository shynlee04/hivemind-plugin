import { assessTrajectoryEntrySync } from '../../core/trajectory/index.js'
import type { TrajectoryAssessmentAction } from '../../core/trajectory/index.js'
import { inspectWorkflowAuthority } from '../../core/workflow-management/index.js'
import { findControlPlanePrimitive } from '../../control-plane/index.js'
import { resolveOpencodeKnowledgeSurfaces } from '../../shared/opencode-knowledge.js'
import {
  pickRuntimePressureContract,
  type RuntimePressureId,
} from '../../shared/pressure-contract.js'
import { findSlashCommandBundle } from '../../commands/slash-command/index.js'
import {
  buildStartWorkEntryKernel,
  type RuntimeRiskLevel,
  type StartWorkDecision,
  type StartWorkInput,
  type TraversalOutcome,
} from '../../features/session-entry/start-work-types.js'
import { classifyPurpose } from '../../features/session-entry/purpose-classifier.js'
import { resolveLineage } from '../../features/session-entry/lineage-router.js'
import {
  detectContinuityAlerts,
  detectSessionState,
} from '../../features/session-entry/session-state.js'
import { resolveReadinessGates } from '../../features/session-entry/readiness-gates.js'

const AUTO_ROUTE_PURPOSES = new Set([
  'research',
  'planning',
  'implementation',
  'gatekeeping',
  'tdd',
  'course-correction',
])

function resolveRiskLevel(
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

function resolveRecommendedCommand(purposeClass: StartWorkDecision['purposeClass']): string | undefined {
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

function resolveTraversalOutcome(
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

function resolveRouteDisposition(
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

function isAttachOrResumeAction(trajectoryAction: TrajectoryAssessmentAction | undefined): boolean {
  return trajectoryAction === 'attach-active' || trajectoryAction === 'resume-closed'
}

function resolvePressureSignals(
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

/**
 * Resolve the authoritative start-work decision for an incoming user turn.
 *
 * @param input The entry context used to classify purpose, lineage, readiness, and trajectory continuity.
 * @returns A unified routing decision with pressure, safety, and evidence expectations attached.
 */
export function resolveStartWork(input: StartWorkInput): StartWorkDecision {
  const route = resolveLineage(input.userMessage, input.activeLineage)
  const purpose = classifyPurpose(input.userMessage, input.attachments)
  const trajectoryAssessment = input.projectRoot
    ? assessTrajectoryEntrySync(input.projectRoot, {
        userMessage: input.userMessage,
        lineage: route.lineage,
        purposeClass: purpose.purposeClass,
        sessionScope: input.sessionScope,
        workflowId: input.workflowId,
        taskIds: input.taskIds,
      })
    : undefined
  const workflowAuthority = input.projectRoot
    ? inspectWorkflowAuthority(input.projectRoot, {
        workflowId: input.workflowId,
        taskIds: input.taskIds,
        sessionScope: input.sessionScope,
        purposeClass: purpose.purposeClass,
        lineage: route.lineage,
      })
    : undefined
  const enrichedInput: StartWorkInput = {
    ...input,
    hasHivemind: input.hasHivemind ?? workflowAuthority?.exists ?? false,
    hivemindHealthy: input.hivemindHealthy ?? workflowAuthority?.healthy ?? false,
    hasWorkflow: input.hasWorkflow ?? false,
    hasHandoff: input.hasHandoff ?? (input.sessionScope === 'sub-session' && !!input.parentSessionId),
  }
  const continuityAlerts = detectContinuityAlerts(enrichedInput)
  let sessionState = continuityAlerts.includes('missing-task-link')
    ? 'fresh'
    : detectSessionState(enrichedInput)
  if (trajectoryAssessment?.action === 'attach-active' && sessionState === 'fresh') {
    sessionState = 'ongoing'
  }
  if (trajectoryAssessment?.action === 'resume-closed') {
    sessionState = 'continuation'
  }
  const readiness = resolveReadinessGates(enrichedInput, purpose.purposeClass)
  const routeDisposition = resolveRouteDisposition(trajectoryAssessment?.action)
  const requiredControlPlaneIdFromReadiness = readiness.find((gate) => gate.primitiveId)?.primitiveId
  const preferAttachOrResume = isAttachOrResumeAction(trajectoryAssessment?.action)
    && requiredControlPlaneIdFromReadiness === 'hm-init'
    && enrichedInput.hivemindHealthy
  const effectiveReadiness = preferAttachOrResume
    ? readiness.filter((gate) => gate.primitiveId !== 'hm-init')
    : readiness
  const readinessPressureIds = effectiveReadiness
    .map((gate) => gate.pressureId)
    .filter((pressureId): pressureId is RuntimePressureId => pressureId !== undefined)
  const requiredControlPlaneId = effectiveReadiness.find((gate) => gate.primitiveId)?.primitiveId
  const recommendedControlPlaneId = requiredControlPlaneId
  const requiredCommandId = requiredControlPlaneId
    ? findControlPlanePrimitive(requiredControlPlaneId)?.adapterCommandId ?? requiredControlPlaneId
    : effectiveReadiness.find((gate) => gate.commandId)?.commandId
  const recommendedCommandId = requiredCommandId ?? resolveRecommendedCommand(purpose.purposeClass)
  const commandAgent = (requiredControlPlaneId
    ? findControlPlanePrimitive(requiredControlPlaneId)?.adapterCommandId
    : recommendedCommandId)
    ? findSlashCommandBundle(requiredControlPlaneId
      ? findControlPlanePrimitive(requiredControlPlaneId)?.adapterCommandId ?? recommendedCommandId!
      : recommendedCommandId!,
    )?.agent
    : undefined
  const wrongAgent = !!(enrichedInput.activeAgent && commandAgent && enrichedInput.activeAgent !== commandAgent)
  const riskLevel = resolveRiskLevel(
    enrichedInput,
    requiredControlPlaneId,
    continuityAlerts,
    wrongAgent,
    trajectoryAssessment?.action,
  )
  const traversalOutcome = resolveTraversalOutcome(requiredControlPlaneId, wrongAgent, trajectoryAssessment?.action)
  const programmaticInitiationRequired = !!requiredControlPlaneId
  const autoRoute = programmaticInitiationRequired
    || (traversalOutcome === 'route'
      && AUTO_ROUTE_PURPOSES.has(purpose.purposeClass)
      && !purpose.reasons.includes('mixed-intent')
      && purpose.confidence >= 0.5
      && riskLevel !== 'blocked')
  const pressureSignals = resolvePressureSignals(
    enrichedInput,
    readinessPressureIds,
    trajectoryAssessment?.action,
    wrongAgent,
  )
  const pressureContract = pickRuntimePressureContract(pressureSignals)

  const decision: StartWorkDecision = {
    sessionId: input.sessionId,
    sessionScope: input.sessionScope,
    sessionState,
    lineage: route.lineage,
    purposeClass: purpose.purposeClass,
    confidence: purpose.confidence,
    reasons: [
      ...route.reasons,
      ...purpose.reasons,
      ...continuityAlerts,
      ...(trajectoryAssessment?.reasons ?? []),
      ...(preferAttachOrResume ? ['prefer-attach-or-resume-over-bootstrap'] : []),
    ],
    readiness: effectiveReadiness,
    traversalOutcome,
    commandAgent,
    continuityAlerts,
    workflowAuthority,
    trajectoryAssessment,
    routeDisposition,
    nextTransition: trajectoryAssessment?.resumeTarget
      ?? (requiredCommandId ? `command:${requiredCommandId}` : recommendedCommandId ? `command:${recommendedCommandId}` : undefined),
    requiredControlPlaneId,
    recommendedControlPlaneId,
    requiredCommandId,
    recommendedCommandId,
    programmaticInitiationRequired,
    autoRoute,
    riskLevel,
    opencodeKnowledge: resolveOpencodeKnowledgeSurfaces(purpose.purposeClass, input.userMessage),
    pressureSignals,
    pressureContract,
  }

  const entryKernel = buildStartWorkEntryKernel(decision)

  return {
    ...decision,
    sessionId: entryKernel.session.sessionId,
    sessionScope: entryKernel.session.sessionScope,
    sessionState: entryKernel.session.sessionState,
    lineage: entryKernel.routing.lineage,
    purposeClass: entryKernel.routing.purposeClass,
    traversalOutcome: entryKernel.routing.traversalOutcome,
    routeDisposition: entryKernel.routing.routeDisposition,
    nextTransition: entryKernel.routing.nextTransition,
    commandAgent: entryKernel.routing.commandAgent,
    autoRoute: entryKernel.routing.autoRoute,
    programmaticInitiationRequired: entryKernel.routing.programmaticInitiationRequired,
    requiredCommandId: entryKernel.routing.requiredCommandId,
    recommendedCommandId: entryKernel.routing.recommendedCommandId,
    riskLevel: entryKernel.safety.riskLevel,
    readiness: entryKernel.safety.readiness,
    continuityAlerts: entryKernel.safety.continuityAlerts,
    pressureSignals: entryKernel.safety.pressureSignals,
    pressureContract: entryKernel.safety.pressureContract,
    requiredControlPlaneId: entryKernel.safety.requiredControlPlaneId,
    recommendedControlPlaneId: entryKernel.safety.recommendedControlPlaneId,
  }
}
