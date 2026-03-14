import type { RuntimeRiskLevel, StartWorkDecision, StartWorkInput } from './start-work-types.js'
import { classifyPurpose } from './purpose-classifier.js'
import { resolveLineage } from './lineage-router.js'
import { detectSessionState } from './session-state.js'
import { resolveReadinessGates } from './readiness-gates.js'

const AUTO_ROUTE_PURPOSES = new Set([
  'research',
  'planning',
  'implementation',
  'gatekeeping',
  'tdd',
  'course-correction',
])

function resolveRiskLevel(input: StartWorkInput, requiredCommandId?: string): RuntimeRiskLevel {
  if (requiredCommandId === 'hm-init' || requiredCommandId === 'hm-doctor') {
    return 'blocked'
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

export function resolveStartWork(input: StartWorkInput): StartWorkDecision {
  const sessionState = detectSessionState(input)
  const lineage = resolveLineage(input.userMessage, input.activeLineage)
  const purpose = classifyPurpose(input.userMessage, input.attachments)
  const readiness = resolveReadinessGates(input, purpose.purposeClass)
  const requiredCommandId = readiness.find((gate) => gate.commandId)?.commandId
  const recommendedCommandId = requiredCommandId ?? resolveRecommendedCommand(purpose.purposeClass)
  const riskLevel = resolveRiskLevel(input, requiredCommandId)
  const autoRoute = AUTO_ROUTE_PURPOSES.has(purpose.purposeClass) && riskLevel !== 'blocked'

  return {
    sessionId: input.sessionId,
    sessionScope: input.sessionScope,
    sessionState,
    lineage: lineage.lineage,
    purposeClass: purpose.purposeClass,
    confidence: purpose.confidence,
    reasons: [...lineage.reasons, ...purpose.reasons],
    readiness,
    requiredCommandId,
    recommendedCommandId,
    autoRoute,
    riskLevel,
  }
}
