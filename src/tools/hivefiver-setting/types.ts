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
  /** Optional locale for localized UI copy */
  locale?: string
  /** Output presentation mode */
  renderMode?: 'json' | 'tui'
}

export interface HmSettingLanguageOptionDescriptor {
  value: string
  label: string
  nativeLabel: string
}

export interface HmSettingLanguageFieldDescriptor {
  key: 'communication_language' | 'document_language'
  label: string
  description: string
  currentValue: string | null
  options: HmSettingLanguageOptionDescriptor[]
}

export interface HmSettingLanguageSelectorDescriptor {
  locale: string
  title: string
  description: string
  fields: HmSettingLanguageFieldDescriptor[]
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
  localizedMessage?: string
  languageSelector?: HmSettingLanguageSelectorDescriptor
}

export interface HmSettingDashboardPane40 {
  title: string
  sessionId: string
  runtimeAuthority: string
  attachmentMode: string
  workflowId?: string
  trajectoryId?: string
  gateSummary: string
  healthSummary: string
  recentEvents: string[]
}

export interface HmSettingDashboardPane60 {
  title: string
  group: HmSettingGroup
  changedFields: string[]
  impactSummary: string[]
  nextAction: string
  guidance: string[]
  currentSettings: Record<string, unknown>
}

export interface HmSettingDashboardProof {
  mode: 'question-gate' | 'settings'
  pane40: HmSettingDashboardPane40
  pane60: HmSettingDashboardPane60
  rendered?: string
}
