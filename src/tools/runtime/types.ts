/**
 * Runtime tool types — extracted from inline definitions in opencode-plugin.ts
 */

export interface HivemindRuntimeCommandArgs {
  command: string
  arguments?: string
  userMessage?: string
  preferredUserName?: string
  language?: string
  artifactLanguage?: string
  governanceMode?: string
  automationLevel?: string
  expertLevel?: string
  outputStyle?: string
  presetId?: 'guided-onboarding'
  requestedSettingsGroups?: ('identity-language' | 'expertise-style' | 'governance-automation')[]
  intakeEvidence?: {
    source: 'question-tool' | 'cli-flags' | 'runtime-tool' | 'preset'
    questionnaireId: 'bootstrap-profile-v1' | 'settings-profile-v1'
    displayLanguage: string
    completedGroups: ('identity-language' | 'expertise-style' | 'governance-automation')[]
    usedRecommendedPresetGroups?: ('identity-language' | 'expertise-style' | 'governance-automation')[]
  }
}
