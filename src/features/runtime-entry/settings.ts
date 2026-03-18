import { findControlPlanePrimitive } from '../../control-plane/control-plane-registry.js'
import { resolveControlPlaneIntakeGate } from '../../control-plane/control-plane-intake.js'
import type {
  CommandExecutionInput,
  CommandExecutionResult,
  SlashCommandBundle,
} from '../../commands/slash-command/command-types.js'
import type { LoadedCommandAsset } from '../../hooks/runtime-bridge/instruction-loader.js'
import {
  loadRuntimeBindingsSnapshot,
  saveRuntimeAttachmentSettings,
} from '../../shared/runtime-attachment.js'

import { createQuestionGateResult, resolveEntityBindings } from './handler-shared.js'

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
    return createQuestionGateResult(bundle, asset, input, intakeResolution.gate)
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
      impact_summary: changedFields.map((field) => `updated:${field}`),
      follow_up_needed: changedFields.includes('chatLanguage') || changedFields.includes('artifactLanguage')
        ? ['refresh-session-guidance']
        : [],
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
    },
    entityBindings: resolveEntityBindings(input),
    stateTransitions: changedFields.map((field) => `runtime-setting-updated:${field}`),
    closeoutStatus: 'ready',
    verificationContractId: asset.contract.verificationContract,
    pressureContract: bundle.pressureContract,
  }
}
