import { normalizeProfileLanguage, normalizePreferredUserName } from '../../shared/bootstrap-profile.js'
import type { RuntimeBindingsSnapshot } from '../../shared/runtime-attachment.js'
import type { CommandExecutionInput } from '../../commands/slash-command/command-types.js'
import type {
  ControlPlaneIntakeEvidence,
  ControlPlaneIntakeGateResult,
  ControlPlanePrimitive,
  ControlPlaneProfileFieldId,
  ControlPlaneProfileGroupId,
  ControlPlaneRecommendedPresetId,
} from '../../control-plane/control-plane-types.js'

export const CONTROL_PLANE_PROFILE_GROUP_FIELDS: Record<ControlPlaneProfileGroupId, ControlPlaneProfileFieldId[]> = {
  'identity-language': ['preferredUserName', 'chatLanguage', 'artifactLanguage'],
  'expertise-style': ['expertiseLevel', 'outputStyle'],
  'governance-automation': ['governanceMode', 'automationLevel'],
}

export const CONTROL_PLANE_PROFILE_FIELDS = [
  'preferredUserName',
  'chatLanguage',
  'artifactLanguage',
  'expertiseLevel',
  'outputStyle',
  'governanceMode',
  'automationLevel',
] as const satisfies readonly ControlPlaneProfileFieldId[]

export const CONTROL_PLANE_REQUIRED_PROFILE_FIELDS = [
  'chatLanguage',
  'artifactLanguage',
  'expertiseLevel',
  'outputStyle',
  'governanceMode',
  'automationLevel',
] as const satisfies readonly ControlPlaneProfileFieldId[]

export const CONTROL_PLANE_PROFILE_GROUPS = [
  'identity-language',
  'expertise-style',
  'governance-automation',
] as const satisfies readonly ControlPlaneProfileGroupId[]

const ALL_PROFILE_GROUPS = [...CONTROL_PLANE_PROFILE_GROUPS]
const INIT_REQUIRED_GROUPS = [...CONTROL_PLANE_PROFILE_GROUPS]

export interface ControlPlaneResolvedProfileInput {
  preferredUserName?: string
  language?: string
  artifactLanguage?: string
  expertLevel?: string
  governanceMode?: string
  automationLevel?: string
  outputStyle?: string
}

export interface ControlPlaneIntakeResolution {
  gate: ControlPlaneIntakeGateResult | null
  profileInput: ControlPlaneResolvedProfileInput
}

const GUIDED_ONBOARDING_PRESET: Required<Omit<ControlPlaneResolvedProfileInput, 'preferredUserName'>> = {
  language: 'en',
  artifactLanguage: 'en',
  expertLevel: 'beginner',
  governanceMode: 'assisted',
  automationLevel: 'assisted',
  outputStyle: 'explanatory',
}

function normalizeStringValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function isVietnameseMessage(message: string | undefined): boolean {
  if (!message) {
    return false
  }

  return /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(message)
    || /\b(hay|cho|biet|toi|lam gi|giup)\b/i.test(message)
}

function resolveDisplayLanguage(
  userMessage: string | undefined,
  snapshot: RuntimeBindingsSnapshot | undefined,
  input: CommandExecutionInput,
): string {
  const explicitLanguage = normalizeProfileLanguage(input.language, '')
  if (explicitLanguage) {
    return explicitLanguage
  }

  if (isVietnameseMessage(userMessage)) {
    return 'vi'
  }

  const fallbackLanguage = normalizeProfileLanguage(snapshot?.language, 'en')
  return fallbackLanguage || 'en'
}

function resolvePresetGroups(
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

function resolvePresetProfileInput(
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

function resolveProfileFromInput(
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

function resolveMissingRequiredFields(
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

function hasAnyRequestedSettingDelta(
  input: CommandExecutionInput,
  requestedGroups: readonly ControlPlaneProfileGroupId[],
  presetGroups: readonly ControlPlaneProfileGroupId[],
): boolean {
  return requestedGroups.some((groupId) => {
    if (presetGroups.includes(groupId)) {
      return true
    }

    switch (groupId) {
      case 'identity-language':
        return !!(
          normalizeStringValue(input.preferredUserName)
          || normalizeStringValue(input.language)
          || normalizeStringValue(input.artifactLanguage)
        )
      case 'expertise-style':
        return !!(normalizeStringValue(input.expertLevel) || normalizeStringValue(input.outputStyle))
      case 'governance-automation':
        return !!(normalizeStringValue(input.governanceMode) || normalizeStringValue(input.automationLevel))
    }
  })
}

function normalizeRequestedGroups(
  groups: CommandExecutionInput['requestedSettingsGroups'],
): ControlPlaneProfileGroupId[] {
  if (!groups?.length) {
    return []
  }

  return groups.filter((groupId): groupId is ControlPlaneProfileGroupId => ALL_PROFILE_GROUPS.includes(groupId))
}

export function resolveControlPlaneProfileInput(
  primitiveId: ControlPlanePrimitive['id'],
  input: CommandExecutionInput,
  snapshot?: RuntimeBindingsSnapshot,
): ControlPlaneResolvedProfileInput {
  return resolveProfileFromInput(input, snapshot, primitiveId === 'hm-settings' ? 'settings' : 'bootstrap')
}

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
    const missingFields = resolveMissingRequiredFields(profileInput, INIT_REQUIRED_GROUPS)
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
    const missingFields = resolveMissingRequiredFields(profileInput, requestedGroups)
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
