/**
 * Behavioral profile barrel — public API re-exports.
 *
 * @module behavioral-profile
 * @description Re-exports all public types, the static lookup table,
 * and resolution functions from the behavioral-profile subsystem.
 */

// Types — all type-only exports for verbatimModuleSyntax compliance
export type {
  GuardrailLevel,
  DelegationMode,
  ToolAccessPattern,
  SkillFilter,
  BehavioralProfile,
  ResolvedBehavioralProfile,
  BehavioralOverrides,
} from "./types.js"

// Static lookup table
export { BehavioralProfiles } from "./profiles.js"

// Resolution functions
export {
  resolveBehavioralProfile,
  invalidateBehavioralProfile,
  clearAllBehavioralProfiles,
  mapLevelToExpertise,
} from "./resolve-behavioral-profile.js"
