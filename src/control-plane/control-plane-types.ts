import type { PurposeClass, StartWorkInput } from '../features/session-entry/start-work-types.js'
import type { RuntimePressureContract } from '../shared/pressure-contract.js'

export type ControlPlanePrimitiveId = 'hm-init' | 'hm-doctor' | 'hm-harness' | 'hm-settings'
export type ControlPlaneCliCommand = 'init' | 'doctor' | 'harness' | 'settings'
export type ControlPlaneQuestionnaireId = 'bootstrap-profile-v1' | 'settings-profile-v1'
export type ControlPlaneRecommendedPresetId = 'guided-onboarding'
export type ControlPlaneProfileFieldId =
  | 'preferredUserName'
  | 'chatLanguage'
  | 'artifactLanguage'
  | 'expertiseLevel'
  | 'outputStyle'
  | 'governanceMode'
  | 'automationLevel'
export type ControlPlaneProfileGroupId = 'identity-language' | 'expertise-style' | 'governance-automation'

export interface ControlPlaneIntakeEvidence {
  source: 'question-tool' | 'cli-flags' | 'runtime-tool' | 'preset'
  questionnaireId: ControlPlaneQuestionnaireId
  displayLanguage: string
  completedGroups: ControlPlaneProfileGroupId[]
  usedRecommendedPresetGroups?: ControlPlaneProfileGroupId[]
}

export interface ControlPlaneIntakeGateResult {
  blocking: boolean
  missingFields: ControlPlaneProfileFieldId[]
  missingGroups: ControlPlaneProfileGroupId[]
  questionnaireId: ControlPlaneQuestionnaireId
  displayLanguage: string
  recommendedPreset?: ControlPlaneRecommendedPresetId
  nextAction: string
}

export interface ControlPlaneGateDecision {
  primitiveId: ControlPlanePrimitiveId
  blocking: boolean
  reason: string
}

export interface ControlPlanePrimitive {
  id: ControlPlanePrimitiveId
  title: string
  adapterCommandId: ControlPlanePrimitiveId
  cliCommand: ControlPlaneCliCommand
  binaryAliases: string[]
  workflowPhase: string
  hostEvent: string
  purposeClasses: PurposeClass[]
  stateAuthority: string
  pressureContract: RuntimePressureContract
  initiationMode: 'programmatic-required'
  manualStateWritesForbidden: boolean
  requiredRuntimeTool: 'hivemind_runtime_command'
  evidenceArtifacts: string[]
  requiresQuestionIntake: boolean
  questionnaireId?: ControlPlaneQuestionnaireId
  nonInteractiveMode: 'flags-or-preset-required' | 'allow-explicit-values'
  recommendedPresetId?: ControlPlaneRecommendedPresetId
  detect(input: StartWorkInput, purposeClass: PurposeClass): ControlPlaneGateDecision | null
}
