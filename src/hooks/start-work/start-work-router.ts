import { assessTrajectoryEntrySync } from '../../core/trajectory/index.js'
import type { TrajectoryAssessmentAction } from '../../core/trajectory/index.js'
import { inspectWorkflowAuthority } from '../../core/workflow-management/index.js'
import { findSlashCommandBundle } from '../../tools/slash-command/index.js'
import type { RuntimeRiskLevel, StartWorkDecision, StartWorkInput, TraversalOutcome } from './start-work-types.js'
import { classifyPurpose } from './purpose-classifier.js'
import { resolveLineage } from './lineage-router.js'
import { detectContinuityAlerts, detectSessionState } from './session-state.js'
import { resolveReadinessGates } from './readiness-gates.js'

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
  requiredCommandId: string | undefined,
  continuityAlerts: string[],
  wrongAgent: boolean,
  trajectoryAction?: TrajectoryAssessmentAction,
): RuntimeRiskLevel {
  if (trajectoryAction === 'refuse-conflict') {
    return 'blocked'
  }

  if (requiredCommandId === 'hm-init' || requiredCommandId === 'hm-doctor') {
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
  requiredCommandId: string | undefined,
  wrongAgent: boolean,
  trajectoryAction?: TrajectoryAssessmentAction,
): TraversalOutcome {
  if (wrongAgent || trajectoryAction === 'refuse-conflict') {
    return 'refuse'
  }

  if (requiredCommandId === 'hm-init') {
    return 'bootstrap'
  }

  if (requiredCommandId === 'hm-doctor') {
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
  const requiredCommandId = readiness.find((gate) => gate.commandId)?.commandId
  const recommendedCommandId = requiredCommandId ?? resolveRecommendedCommand(purpose.purposeClass)
  const commandAgent = recommendedCommandId
    ? findSlashCommandBundle(recommendedCommandId)?.agent
    : undefined
  const wrongAgent = !!(enrichedInput.activeAgent && commandAgent && enrichedInput.activeAgent !== commandAgent)
  const riskLevel = resolveRiskLevel(
    enrichedInput,
    requiredCommandId,
    continuityAlerts,
    wrongAgent,
    trajectoryAssessment?.action,
  )
  const traversalOutcome = resolveTraversalOutcome(requiredCommandId, wrongAgent, trajectoryAssessment?.action)
  const autoRoute = traversalOutcome === 'route'
    && AUTO_ROUTE_PURPOSES.has(purpose.purposeClass)
    && riskLevel !== 'blocked'

  return {
    sessionId: input.sessionId,
    sessionScope: input.sessionScope,
    sessionState,
    lineage: route.lineage,
    purposeClass: purpose.purposeClass,
    confidence: purpose.confidence,
    reasons: [...route.reasons, ...purpose.reasons, ...continuityAlerts, ...(trajectoryAssessment?.reasons ?? [])],
    readiness,
    traversalOutcome,
    commandAgent,
    continuityAlerts,
    workflowAuthority,
    trajectoryAssessment,
    routeDisposition: resolveRouteDisposition(trajectoryAssessment?.action),
    nextTransition: trajectoryAssessment?.resumeTarget
      ?? (requiredCommandId ? `command:${requiredCommandId}` : recommendedCommandId ? `command:${recommendedCommandId}` : undefined),
    requiredCommandId,
    recommendedCommandId,
    autoRoute,
    riskLevel,
  }
}
