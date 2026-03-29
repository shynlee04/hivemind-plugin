/**
 * Session Entry Intake Module
 *
 * This module provides the intake/gate resolution logic for control plane primitives.
 * Decomposed into focused modules:
 * - `intake.constants.ts` - Control plane constants
 * - `intake.types.ts` - Type definitions
 * - `language-resolution.ts` - Language detection utilities
 * - `profile-resolution.ts` - Profile input resolution
 * - `settings-delta.ts` - Settings delta detection
 * - `intake.gates.ts` - Gate resolution functions
 */

// Re-export all public APIs from decomposed modules
export {
  CONTROL_PLANE_PROFILE_GROUP_FIELDS,
  CONTROL_PLANE_PROFILE_FIELDS,
  CONTROL_PLANE_REQUIRED_PROFILE_FIELDS,
  CONTROL_PLANE_PROFILE_GROUPS,
  ALL_PROFILE_GROUPS,
  INIT_REQUIRED_GROUPS,
  GUIDED_ONBOARDING_PRESET,
  type GuidedOnboardingPresetValues,
} from './intake.constants.js'

export type {
  ControlPlaneResolvedProfileInput,
  ControlPlaneIntakeResolution,
} from './intake.types.js'

export {
  isVietnameseMessage,
  resolveDisplayLanguage,
} from './language-resolution.js'

export { normalizeStringValue } from '../../shared/bootstrap-profile.js'

export {
  resolvePresetGroups,
  resolvePresetProfileInput,
  resolveProfileFromInput,
  resolveMissingRequiredFields,
} from './profile-resolution.js'

export {
  hasAnyRequestedSettingDelta,
  normalizeRequestedGroups,
} from './settings-delta.js'

export {
  resolveControlPlaneProfileInput,
  buildNonInteractiveIntakeError,
  resolveControlPlaneIntakeGate,
} from './intake.gates.js'
