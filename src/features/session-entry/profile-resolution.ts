import { normalizeProfileLanguage, normalizePreferredUserName } from '../../shared/bootstrap-profile.js'
import type { RuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import type { CommandExecutionInput } from '../../commands/slash-command/command-types.js'
import type {
  ControlPlaneIntakeEvidence,
  ControlPlaneRecommendedPresetId,
} from '../../control-plane/control-plane-types.js'
import type { ControlPlaneResolvedProfileInput } from './intake.types.js'
import {
  CONTROL_PLANE_PROFILE_GROUP_FIELDS,
  GUIDED_ONBOARDING_PRESET,
  ALL_PROFILE_GROUPS,
  CONTROL_PLANE_REQUIRED_PROFILE_FIELDS,
} from './intake.constants.js'
import { normalizeStringValue } from '../../shared/bootstrap-profile.js'
import type { ControlPlaneProfileGroupId, ControlPlaneProfileFieldId } from '../../control-plane/control-plane-types.js'

/**
 * Resolves which profile groups should be presented based on preset and evidence.
 * @param presetId - The preset identifier (e.g., 'guided-onboarding')
 * @param evidence - Intake evidence from previous questionnaire completion
 * @returns Array of profile group IDs to present
 * @example
 * const groups = resolvePresetGroups('guided-onboarding', evidence) // All groups if no evidence
 */
export function resolvePresetGroups(
  presetId: ControlPlaneRecommendedPresetId | undefined,
  evidence: ControlPlaneIntakeEvidence | undefined,
): ControlPlaneProfileGroupId[] {
  if (!presetId) {
    return []
  }

  return evidence?.usedRecommendedPresetGroups?.length
    ? [...evidence.usedRecommendedPresetGroups]
    : [...ALL_PROFILE_GROUPS]
}

/**
 * Builds preset profile input for 'guided-onboarding' preset.
 * Maps preset group fields to their default values.
 * @param presetId - The preset identifier
 * @param presetGroups - Groups to include from preset
 * @returns Profile input with preset default values
 * @example
 * const input = resolvePresetProfileInput('guided-onboarding', ['identity-language'])
 */
export function resolvePresetProfileInput(
  presetId: ControlPlaneRecommendedPresetId | undefined,
  presetGroups: readonly ControlPlaneProfileGroupId[],
): ControlPlaneResolvedProfileInput {
  if (presetId !== 'guided-onboarding') {
    return {}
  }

  const profileInput: ControlPlaneResolvedProfileInput = {}
  for (const groupId of presetGroups) {
    for (const fieldId of CONTROL_PLANE_PROFILE_GROUP_FIELDS[groupId]) {
      switch (fieldId) {
        case 'chatLanguage':
          profileInput.language = GUIDED_ONBOARDING_PRESET.language
          break
        case 'artifactLanguage':
          profileInput.artifactLanguage = GUIDED_ONBOARDING_PRESET.artifactLanguage
          break
        case 'expertiseLevel':
          profileInput.expertLevel = GUIDED_ONBOARDING_PRESET.expertLevel
          break
        case 'governanceMode':
          profileInput.governanceMode = GUIDED_ONBOARDING_PRESET.governanceMode
          break
        case 'automationLevel':
          profileInput.automationLevel = GUIDED_ONBOARDING_PRESET.automationLevel
          break
        case 'outputStyle':
          profileInput.outputStyle = GUIDED_ONBOARDING_PRESET.outputStyle
          break
        case 'preferredUserName':
          break
      }
    }
  }

  return profileInput
}

/**
 * Resolves complete profile input from multiple sources with priority order.
 * Priority: explicit CLI flags > preset defaults > runtime snapshot
 * @param input - Command execution input with explicit values
 * @param snapshot - Runtime bindings snapshot for fallback
 * @param mode - 'bootstrap' (init) or 'settings' (hm-settings)
 * @returns Merged profile input with normalized values
 * @example
 * const profile = resolveProfileFromInput(input, snapshot, 'bootstrap')
 */
export function resolveProfileFromInput(
  input: CommandExecutionInput,
  snapshot?: RuntimeBindingsSnapshot,
  mode: 'bootstrap' | 'settings' = 'bootstrap',
): ControlPlaneResolvedProfileInput {
  const evidence = input.intakeEvidence
  const presetGroups = resolvePresetGroups(input.presetId, evidence)
  const presetProfile = resolvePresetProfileInput(input.presetId, presetGroups)
  const baseProfile: ControlPlaneResolvedProfileInput = mode === 'settings' && snapshot
    ? {
        preferredUserName: snapshot.preferredUserName,
        language: snapshot.language,
        artifactLanguage: snapshot.artifactLanguage,
        expertLevel: snapshot.expertLevel,
        governanceMode: snapshot.governanceMode,
        automationLevel: snapshot.automationLevel,
        outputStyle: snapshot.outputStyle,
      }
    : {}

  return {
    ...baseProfile,
    ...presetProfile,
    preferredUserName: normalizePreferredUserName(input.preferredUserName ?? baseProfile.preferredUserName),
    language: normalizeStringValue(input.language)
      ? normalizeProfileLanguage(input.language, baseProfile.language ?? presetProfile.language ?? 'en')
      : baseProfile.language ?? presetProfile.language,
    artifactLanguage: normalizeStringValue(input.artifactLanguage)
      ? normalizeProfileLanguage(
          input.artifactLanguage,
          input.language
            ? normalizeProfileLanguage(input.language, baseProfile.language ?? presetProfile.language ?? 'en')
            : baseProfile.artifactLanguage ?? presetProfile.artifactLanguage ?? baseProfile.language ?? presetProfile.language ?? 'en',
        )
      : baseProfile.artifactLanguage ?? presetProfile.artifactLanguage,
    expertLevel: normalizeStringValue(input.expertLevel) ?? baseProfile.expertLevel ?? presetProfile.expertLevel,
    governanceMode: normalizeStringValue(input.governanceMode) ?? baseProfile.governanceMode ?? presetProfile.governanceMode,
    automationLevel: normalizeStringValue(input.automationLevel) ?? baseProfile.automationLevel ?? presetProfile.automationLevel,
    outputStyle: normalizeStringValue(input.outputStyle) ?? baseProfile.outputStyle ?? presetProfile.outputStyle,
  }
}

/**
 * Identifies required profile fields that are missing from the input.
 * @param profileInput - The resolved profile input to validate
 * @param selectedGroups - Profile groups that are in scope for this intake
 * @returns Array of missing required field IDs
 * @example
 * const missing = resolveMissingRequiredFields(profile, ['identity-language', 'governance-automation'])
 */
export function resolveMissingRequiredFields(
  profileInput: ControlPlaneResolvedProfileInput,
  selectedGroups: readonly ControlPlaneProfileGroupId[],
): ControlPlaneProfileFieldId[] {
  const missing = new Set<ControlPlaneProfileFieldId>()
  const requiredFields = selectedGroups.length === ALL_PROFILE_GROUPS.length
    ? CONTROL_PLANE_REQUIRED_PROFILE_FIELDS
    : CONTROL_PLANE_REQUIRED_PROFILE_FIELDS.filter((fieldId) =>
        selectedGroups.some((groupId) => CONTROL_PLANE_PROFILE_GROUP_FIELDS[groupId].includes(fieldId)),
      )

  for (const fieldId of requiredFields) {
    switch (fieldId) {
      case 'chatLanguage':
        if (!normalizeStringValue(profileInput.language)) {
          missing.add(fieldId)
        }
        break
      case 'artifactLanguage':
        if (!normalizeStringValue(profileInput.artifactLanguage)) {
          missing.add(fieldId)
        }
        break
      case 'expertiseLevel':
        if (!normalizeStringValue(profileInput.expertLevel)) {
          missing.add(fieldId)
        }
        break
      case 'governanceMode':
        if (!normalizeStringValue(profileInput.governanceMode)) {
          missing.add(fieldId)
        }
        break
      case 'automationLevel':
        if (!normalizeStringValue(profileInput.automationLevel)) {
          missing.add(fieldId)
        }
        break
      case 'outputStyle':
        if (!normalizeStringValue(profileInput.outputStyle)) {
          missing.add(fieldId)
        }
        break
    }
  }

  return [...missing]
}
