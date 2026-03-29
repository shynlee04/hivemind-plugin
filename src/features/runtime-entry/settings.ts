import { findControlPlanePrimitive } from '../../control-plane/control-plane-registry.js'
import { resolveControlPlaneIntakeGate } from '../../control-plane/control-plane-intake.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'
import {
  loadRuntimeBindingsSnapshot,
  saveRuntimeAttachmentSettings,
} from '../../shared/runtime-attachment.js'
import { buildRuntimeStatusSnapshot } from '../../sdk-supervisor/runtime-status.js'
import { buildHmSettingDashboardProof } from '../../tools/hivefiver-setting/index.js'

import { createQuestionGateResult, resolveEntityBindings } from './handler-shared.js'
import type { LoadedCommandAsset } from './instruction-loader.js'

function serializeCurrentSettings(input: {
  preferredUserName?: string
  language: string
  artifactLanguage: string
  expertLevel: string
  governanceMode: string
  automationLevel: string
  outputStyle: string
}): Record<string, unknown> {
  return {
    preferredUserName: input.preferredUserName ?? null,
    chatLanguage: input.language,
    artifactLanguage: input.artifactLanguage,
    expertiseLevel: input.expertLevel,
    governanceMode: input.governanceMode,
    automationLevel: input.automationLevel,
    outputStyle: input.outputStyle,
  }
}

export async function runSettingsHandler(
  bundle: SlashCommandBundle,
  asset: LoadedCommandAsset,
  input: CommandExecutionInput,
): Promise<CommandExecutionResult> {
  const primitive = findControlPlanePrimitive('hm-settings')
  const snapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)
  const intakeResolution = primitive
    ? resolveControlPlaneIntakeGate(primitive, input, snapshot)
    : { gate: null, profileInput: {} }
  if (intakeResolution.gate) {
    const statusSnapshot = await buildRuntimeStatusSnapshot({
      projectRoot: input.projectRoot,
      sessionId: input.sessionId,
      agentId: bundle.agent,
      snapshot,
    })
    const baseResult = createQuestionGateResult(bundle, asset, input, intakeResolution.gate)
    const dashboard = buildHmSettingDashboardProof({
      mode: 'question-gate',
      group: 'all',
      sessionId: input.sessionId,
      snapshot,
      statusSnapshot,
      changedFields: [],
      impactSummary: [],
      nextAction: 'answer-intake-gate',
      guidance: [
        ...intakeResolution.gate.missingGroups.map((groupId) => `group:${groupId}`),
        ...intakeResolution.gate.missingFields.map((fieldId) => `field:${fieldId}`),
      ],
      currentSettings: serializeCurrentSettings(snapshot),
    })

    return {
      ...baseResult,
      report: {
        ...baseResult.report,
        dashboard,
      },
    }
  }

  const updatedSettings = await saveRuntimeAttachmentSettings(input.projectRoot, {
    preferredUserName: intakeResolution.profileInput.preferredUserName,
    language: intakeResolution.profileInput.language,
    artifactLanguage: intakeResolution.profileInput.artifactLanguage,
    expertLevel: intakeResolution.profileInput.expertLevel,
    governanceMode: intakeResolution.profileInput.governanceMode,
    automationLevel: intakeResolution.profileInput.automationLevel,
    outputStyle: intakeResolution.profileInput.outputStyle,
  })
  const changedFields = [
    updatedSettings.preferredUserName !== snapshot.preferredUserName ? 'preferredUserName' : null,
    updatedSettings.language !== snapshot.language ? 'chatLanguage' : null,
    updatedSettings.artifactLanguage !== snapshot.artifactLanguage ? 'artifactLanguage' : null,
    updatedSettings.expertLevel !== snapshot.expertLevel ? 'expertiseLevel' : null,
    updatedSettings.outputStyle !== snapshot.outputStyle ? 'outputStyle' : null,
    updatedSettings.governanceMode !== snapshot.governanceMode ? 'governanceMode' : null,
    updatedSettings.automationLevel !== snapshot.automationLevel ? 'automationLevel' : null,
  ].filter((field): field is string => field !== null)
  const updatedSnapshot = await loadRuntimeBindingsSnapshot(input.projectRoot)
  const statusSnapshot = await buildRuntimeStatusSnapshot({
    projectRoot: input.projectRoot,
    sessionId: input.sessionId,
    agentId: bundle.agent,
    snapshot: updatedSnapshot,
  })
  const impactSummary = changedFields.map((field) => `updated:${field}`)
  const followUpNeeded = changedFields.includes('chatLanguage') || changedFields.includes('artifactLanguage')
    ? ['refresh-session-guidance']
    : []
  const dashboard = buildHmSettingDashboardProof({
    mode: 'settings',
    group: 'all',
    sessionId: input.sessionId,
    snapshot: updatedSnapshot,
    statusSnapshot,
    changedFields,
    impactSummary,
    nextAction: followUpNeeded[0] ?? 'none',
    guidance: input.intakeEvidence
      ? [`intake:${input.intakeEvidence.questionnaireId}`]
      : ['settings-updated'],
    currentSettings: serializeCurrentSettings(updatedSettings),
  })

  return {
    commandId: bundle.id,
    title: bundle.title,
    agent: bundle.agent,
    executionMode: 'handler',
    contract: asset.contract,
    report: {
      updated_settings: {
        preferredUserName: updatedSettings.preferredUserName ?? null,
        chatLanguage: updatedSettings.language,
        artifactLanguage: updatedSettings.artifactLanguage,
        expertiseLevel: updatedSettings.expertLevel,
        governanceMode: updatedSettings.governanceMode,
        automationLevel: updatedSettings.automationLevel,
        outputStyle: updatedSettings.outputStyle,
      },
      changed_fields: changedFields,
      impact_summary: impactSummary,
      follow_up_needed: followUpNeeded,
      safetyLevel: bundle.pressureContract.safety.level,
      failureBehavior: bundle.pressureContract.failureBehavior,
      expectedEvidence: bundle.pressureContract.evidence.requiredArtifacts,
      intake: input.intakeEvidence
        ? {
            questionnaireId: input.intakeEvidence.questionnaireId,
            completedGroups: input.intakeEvidence.completedGroups,
            usedRecommendedPresetGroups: input.intakeEvidence.usedRecommendedPresetGroups ?? [],
            displayLanguage: input.intakeEvidence.displayLanguage,
          }
        : undefined,
      dashboard,
    },
    entityBindings: resolveEntityBindings(input),
    stateTransitions: changedFields.map((field) => `runtime-setting-updated:${field}`),
    closeoutStatus: 'ready',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}
