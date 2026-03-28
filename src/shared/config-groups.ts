/**
 * Config Groups — Manages 4 independent configuration categories
 * built on top of the UserPreferences schema from schema-kernel.
 *
 * @module shared/config-groups
 */

import {
  UserPreferences,
  UserExpertLevel,
  GovernanceLevel,
  OperationMode,
} from '../schema-kernel/config-records.js'

import type { UserPreferences as UserPreferencesType } from '../schema-kernel/config-records.js'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfigGroupDefinition {
  /** Keys that belong to this group */
  keys: string[]
  /** For enum keys, the list of valid values */
  validValues?: Record<string, string[]>
}

export type ConfigGroupName = 'language' | 'expertise' | 'governance' | 'operation-mode'

export interface ConfigGroupResult {
  status: 'success' | 'error'
  values?: Record<string, unknown>
  error?: string
}

export interface ConfigValidationResult {
  status: 'success' | 'error'
  error?: string
}

export interface ConfigApplyResult {
  status: 'success' | 'error'
  preferences?: UserPreferencesType
  error?: string
}

// ---------------------------------------------------------------------------
// Group Definitions
// ---------------------------------------------------------------------------

/** Maps group name → its schema keys and valid values */
export const CONFIG_GROUPS: Record<ConfigGroupName, ConfigGroupDefinition> = {
  language: {
    keys: ['communication_language', 'document_language'],
  },
  expertise: {
    keys: ['expert_level'],
    validValues: {
      expert_level: UserExpertLevel.options,
    },
  },
  governance: {
    keys: ['governance_level'],
    validValues: {
      governance_level: GovernanceLevel.options,
    },
  },
  'operation-mode': {
    keys: ['operation_mode'],
    validValues: {
      operation_mode: OperationMode.options,
    },
  },
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Returns the current (default) values for a named config group.
 *
 * @param name - Group name
 * @returns Object with group values or an error
 */
export function getConfigGroup(name: string): ConfigGroupResult {
  const group = CONFIG_GROUPS[name as ConfigGroupName]
  if (!group) {
    return { status: 'error', error: `Unknown config group: "${name}"` }
  }

  const defaults = UserPreferences.parse({})
  const values: Record<string, unknown> = {}
  for (const key of group.keys) {
    values[key] = defaults[key as keyof UserPreferencesType]
  }

  return { status: 'success', values }
}

/**
 * Validates that a proposed key/value is acceptable for the given group.
 *
 * @param group - Group name
 * @param key - Config key within the group
 * @param value - Proposed new value
 * @returns Success or error result
 */
export function validateConfigUpdate(
  group: string,
  key: string,
  value: string,
): ConfigValidationResult {
  const groupDef = CONFIG_GROUPS[group as ConfigGroupName]
  if (!groupDef) {
    return { status: 'error', error: `Unknown config group: "${group}"` }
  }

  if (!groupDef.keys.includes(key)) {
    return {
      status: 'error',
      error: `Key "${key}" not in group "${group}". Valid keys: ${groupDef.keys.join(', ')}`,
    }
  }

  // Enum validation
  if (groupDef.validValues && groupDef.validValues[key]) {
    if (!groupDef.validValues[key].includes(value)) {
      return {
        status: 'error',
        error: `Invalid value "${value}" for "${key}". Valid values: ${groupDef.validValues[key].join(', ')}`,
      }
    }
  }

  // Zod schema validation — catches type-level issues
  const defaults = UserPreferences.parse({})
  const merged = { ...defaults, [key]: value }
  const parsed = UserPreferences.safeParse(merged)
  if (!parsed.success) {
    return {
      status: 'error',
      error: `Zod validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    }
  }

  return { status: 'success' }
}

/**
 * Returns a new UserPreferences object with the update applied on top of
 * either the provided base or the schema defaults. Does NOT write to disk.
 *
 * @param group - Group name
 * @param key - Config key
 * @param value - New value
 * @param base - Optional existing preferences to merge onto
 * @returns Merged preferences or error
 */
export function applyConfigUpdate(
  group: string,
  key: string,
  value: string,
  base?: UserPreferencesType,
): ConfigApplyResult {
  // Validate first
  const validation = validateConfigUpdate(group, key, value)
  if (validation.status === 'error') {
    return { status: 'error', error: validation.error }
  }

  const current = base ?? UserPreferences.parse({})
  const merged = { ...current, [key]: value }

  const parsed = UserPreferences.safeParse(merged)
  if (!parsed.success) {
    return {
      status: 'error',
      error: `Zod validation failed: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
    }
  }

  return { status: 'success', preferences: parsed.data }
}
