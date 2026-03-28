/**
 * Types for the hivemind_hm_setting tool.
 * Handles configuration group reads and proposed changes.
 */

export type HmSettingGroup =
  | 'language'
  | 'expertise'
  | 'governance'
  | 'operation-mode'
  | 'all'

export interface HmSettingToolArgs {
  /** Configuration group to modify */
  group: HmSettingGroup
  /** Specific key within group */
  key?: string
  /** New value (JSON string for complex values) */
  value?: string
}

export interface HmSettingProposedChange {
  group: HmSettingGroup
  key: string
  currentValue: unknown
  value: string
}

export interface HmSettingResult {
  group: HmSettingGroup
  currentConfig: Record<string, unknown>
  proposedChange: HmSettingProposedChange | null
  authorizationRequired: boolean
  written: boolean
}
