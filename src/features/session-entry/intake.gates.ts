import type { RuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import type { CommandExecutionInput } from '../../commands/slash-command/command-types.js'
import type {
  ControlPlanePrimitive,
  ControlPlaneIntakeGateResult,
} from '../../control-plane/control-plane-types.js'
import type { ControlPlaneIntakeResolution } from './intake.types.js'
import { INIT_REQUIRED_GROUPS, CONTROL_PLANE_REQUIRED_PROFILE_FIELDS } from './intake.constants.js'
import { resolveDisplayLanguage } from './language-resolution.js'
import { resolveProfileFromInput } from './profile-resolution.js'
import { hasAnyRequestedSettingDelta, normalizeRequestedGroups } from './settings-delta.js'
import { resolvePresetGroups } from './profile-resolution.js'

/**
 * Entry point for resolving profile input from control plane primitive.
 * Delegates to profile-resolution with appropriate mode based on primitive ID.
 * @param primitiveId - The control plane primitive identifier
 * @param input - Full command execution input
 * @param snapshot - Optional runtime bindings snapshot
 * @returns Resolved profile input ready for questionnaire or execution
 * @example
 * const profile = resolveControlPlaneProfileInput('hm-init', input, snapshot)
 */
export function resolveControlPlaneProfileInput(
  primitiveId: ControlPlanePrimitive['id'],
  input: CommandExecutionInput,
  snapshot?: RuntimeBindingsSnapshot,
) {
  return resolveProfileFromInput(input, snapshot, primitiveId === 'hm-settings' ? 'settings' : 'bootstrap')
}

/**
 * Builds a human-readable error message for non-interactive intake failures.
 * @param primitive - The control plane primitive that requires intake
 * @param gate - The gate result with missing fields/groups
 * @returns Formatted error message with missing information details
 * @example
 * const error = buildNonInteractiveIntakeError(primitive, gate)
 * console.log(error) // "hm-init requires explicit profile intake before execution. Missing groups: identity-language."
 */
export function buildNonInteractiveIntakeError(
  primitive: ControlPlanePrimitive,
  gate: ControlPlaneIntakeGateResult,
): string {
  const base = `${primitive.id} requires explicit profile intake before execution.`
  const missingGroups = gate.missingGroups.length
    ? ` Missing groups: ${gate.missingGroups.join(', ')}.`
    : ''
  const missingFields = gate.missingFields.length
    ? ` Missing fields: ${gate.missingFields.join(', ')}.`
    : ''
  const presetHint = primitive.recommendedPresetId
    ? ` Supply explicit flags or use --preset ${primitive.recommendedPresetId}.`
    : ' Supply explicit flags.'

  return `${base}${missingGroups}${missingFields}${presetHint}`
}

/**
 * Main gate resolution function - determines if questionnaire is needed.
 * Handles hm-init and hm-settings primitives with different logic paths.
 * @param primitive - The control plane primitive to evaluate
 * @param input - Full command execution input
 * @param snapshot - Optional runtime bindings snapshot
 * @returns Resolution with gate decision and profile input
 * @example
 * const resolution = resolveControlPlaneIntakeGate(primitive, input, snapshot)
 * if (resolution.gate?.blocking) {
 *   // Show questionnaire
 * }
 */
export function resolveControlPlaneIntakeGate(
  primitive: ControlPlanePrimitive,
  input: CommandExecutionInput,
  snapshot?: RuntimeBindingsSnapshot,
): ControlPlaneIntakeResolution {
  const displayLanguage = resolveDisplayLanguage(input.userMessage, snapshot, input)
  const evidence = input.intakeEvidence
  const presetGroups = resolvePresetGroups(input.presetId, evidence)
  const questionnaireId = primitive.questionnaireId
  const profileInput = resolveControlPlaneProfileInput(primitive.id, input, snapshot)

  if (!primitive.requiresQuestionIntake || !questionnaireId) {
    return { gate: null, profileInput }
  }

  if (primitive.id === 'hm-init') {
    const missingFields = resolveMissingRequiredFieldsFromProfile(profileInput, INIT_REQUIRED_GROUPS)
    const completedGroups = evidence?.completedGroups ?? []
    const missingGroups = INIT_REQUIRED_GROUPS.filter((groupId) => !completedGroups.includes(groupId))
    const directExplicitCompletion = missingFields.length === 0
    const wizardCompletion = missingFields.length === 0 && missingGroups.length === 0

    if (wizardCompletion || directExplicitCompletion) {
      return { gate: null, profileInput }
    }

    return {
      gate: {
        blocking: true,
        missingFields,
        missingGroups,
        questionnaireId,
        displayLanguage,
        recommendedPreset: primitive.recommendedPresetId,
        nextAction: 'question-tool:bootstrap-profile-v1',
      },
      profileInput,
    }
  }

  if (primitive.id === 'hm-settings') {
    const requestedGroups = normalizeRequestedGroups(input.requestedSettingsGroups)
    if (!snapshot?.hasRuntimeAttachment || !snapshot.profileComplete) {
      return {
        gate: {
          blocking: true,
          missingFields: snapshot?.missingProfileFields ?? [...CONTROL_PLANE_REQUIRED_PROFILE_FIELDS],
          missingGroups: [...INIT_REQUIRED_GROUPS],
          questionnaireId,
          displayLanguage,
          recommendedPreset: primitive.recommendedPresetId,
          nextAction: 'question-tool:bootstrap-profile-v1',
        },
        profileInput,
      }
    }

    if (requestedGroups.length === 0) {
      return {
        gate: {
          blocking: true,
          missingFields: [],
          missingGroups: [],
          questionnaireId,
          displayLanguage,
          recommendedPreset: primitive.recommendedPresetId,
          nextAction: 'question-tool:settings-profile-v1:select-groups',
        },
        profileInput,
      }
    }

    const completedGroups = evidence?.completedGroups ?? []
    const missingGroups = requestedGroups.filter((groupId) => !completedGroups.includes(groupId))
    const missingFields = resolveMissingRequiredFieldsFromProfile(profileInput, requestedGroups)
    const hasRequestedDelta = hasAnyRequestedSettingDelta(input, requestedGroups, presetGroups)
    const directExplicitCompletion = missingFields.length === 0 && hasRequestedDelta
    const wizardCompletion = missingGroups.length === 0 && missingFields.length === 0 && hasRequestedDelta

    if (wizardCompletion || directExplicitCompletion) {
      return { gate: null, profileInput }
    }

    return {
      gate: {
        blocking: true,
        missingFields: hasRequestedDelta ? missingFields : [],
        missingGroups,
        questionnaireId,
        displayLanguage,
        recommendedPreset: primitive.recommendedPresetId,
        nextAction: missingGroups.length > 0
          ? 'question-tool:settings-profile-v1'
          : 'question-tool:settings-profile-v1:collect-values',
      },
      profileInput,
    }
  }

  return { gate: null, profileInput }
}

// Re-export for convenience
import { resolveMissingRequiredFields as resolveMissingRequiredFieldsFromProfile } from './profile-resolution.js'
