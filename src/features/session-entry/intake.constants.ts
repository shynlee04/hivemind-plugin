import type {
  ControlPlaneProfileFieldId,
  ControlPlaneProfileGroupId,
} from '../../control-plane/control-plane-types.js'

/**
 * Maps each profile group to its constituent fields.
 * @example
 * CONTROL_PLANE_PROFILE_GROUP_FIELDS['identity-language'] // ['preferredUserName', 'chatLanguage', 'artifactLanguage']
 */
export const CONTROL_PLANE_PROFILE_GROUP_FIELDS: Record<ControlPlaneProfileGroupId, ControlPlaneProfileFieldId[]> = {
  'identity-language': ['preferredUserName', 'chatLanguage', 'artifactLanguage'],
  'expertise-style': ['expertiseLevel', 'outputStyle'],
  'governance-automation': ['governanceMode', 'automationLevel'],
}

/**
 * All profile field identifiers available for intake.
 */
export const CONTROL_PLANE_PROFILE_FIELDS = [
  'preferredUserName',
  'chatLanguage',
  'artifactLanguage',
  'expertiseLevel',
  'outputStyle',
  'governanceMode',
  'automationLevel',
] as const satisfies readonly ControlPlaneProfileFieldId[]

/**
 * Required fields for completing profile intake.
 */
export const CONTROL_PLANE_REQUIRED_PROFILE_FIELDS = [
  'chatLanguage',
  'artifactLanguage',
  'expertiseLevel',
  'outputStyle',
  'governanceMode',
  'automationLevel',
] as const satisfies readonly ControlPlaneProfileFieldId[]

/**
 * All profile group identifiers.
 */
export const CONTROL_PLANE_PROFILE_GROUPS = [
  'identity-language',
  'expertise-style',
  'governance-automation',
] as const satisfies readonly ControlPlaneProfileGroupId[]

/** All profile groups as a mutable array */
export const ALL_PROFILE_GROUPS = [...CONTROL_PLANE_PROFILE_GROUPS]

/** Groups required for init command */
export const INIT_REQUIRED_GROUPS = [...CONTROL_PLANE_PROFILE_GROUPS]

/**
 * Guided onboarding preset - default values for new users.
 * Shape mirrors ControlPlaneResolvedProfileInput without preferredUserName.
 */
export interface GuidedOnboardingPresetValues {
  language: string
  artifactLanguage: string
  expertLevel: string
  governanceMode: string
  automationLevel: string
  outputStyle: string
}

/**
 * Guided onboarding preset - default values for new users.
 * @example
 * // A new user gets these defaults unless they specify otherwise
 * const defaults = GUIDED_ONBOARDING_PRESET
 * defaults.language // 'en'
 */
export const GUIDED_ONBOARDING_PRESET: GuidedOnboardingPresetValues = {
  language: 'en',
  artifactLanguage: 'en',
  expertLevel: 'beginner',
  governanceMode: 'assisted',
  automationLevel: 'assisted',
  outputStyle: 'explanatory',
}
