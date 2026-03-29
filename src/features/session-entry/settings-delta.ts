import type { ControlPlaneProfileGroupId } from '../../control-plane/control-plane-types.js'
import type { CommandExecutionInput } from '../../commands/slash-command/command-types.js'
import { ALL_PROFILE_GROUPS } from './intake.constants.js'
import { normalizeStringValue } from '../../shared/bootstrap-profile.js'

/**
 * Checks if any of the requested groups have explicit delta in the input.
 * A delta exists when user provides explicit values for at least one field in the group.
 * @param input - Command execution input with user-provided values
 * @param requestedGroups - Groups being requested for settings update
 * @param presetGroups - Groups already covered by preset
 * @returns true if any requested group has explicit user values
 * @example
 * const hasDelta = hasAnyRequestedSettingDelta(input, ['identity-language'], presetGroups)
 */
export function hasAnyRequestedSettingDelta(
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

/**
 * Normalizes requested settings groups, filtering to valid group IDs only.
 * @param groups - Raw groups array from command input
 * @returns Array of valid ControlPlaneProfileGroupId values
 * @example
 * const groups = normalizeRequestedGroups(['identity-language', 'invalid-group']) // ['identity-language']
 */
export function normalizeRequestedGroups(
  groups: CommandExecutionInput['requestedSettingsGroups'],
): ControlPlaneProfileGroupId[] {
  if (!groups?.length) {
    return []
  }

  return groups.filter((groupId): groupId is ControlPlaneProfileGroupId => ALL_PROFILE_GROUPS.includes(groupId))
}
