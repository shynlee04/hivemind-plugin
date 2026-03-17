/**
 * Runtime tool types — extracted from inline definitions in opencode-plugin.ts
 */

import type {
  ArtifactFreshnessRegistryRecord,
  EntryKernelStateRecord,
  RuntimeInvocationRecord,
  SessionRegistryRecord,
  SupervisorInstanceRegistryRecord,
  WorkflowExecutionGraphRecord,
  WorkflowGuardStateRecord,
  WorkflowWaveStateRecord,
} from '../../schema-kernel/index.js'
import type { SupervisorHealthSummary } from '../../sdk-supervisor/index.js'

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

export interface HivemindRuntimeStatusPayload {
  entryState: {
    state: string
    interactiveBootstrapRequired: boolean
    recommendedNext: string
  }
  qaState: {
    state: string
    releaseState: string
  }
  runtimeState: {
    sessionID: string
    attachmentMode: string
    hasRuntimeAttachment: boolean
    hasHivemind: boolean
    hivemindHealthy: boolean
    hasWorkflow: boolean
    profileComplete: boolean
    missingProfileFields: string[]
    bootstrapProfile: unknown
  }
  kernelState: {
    entry: EntryKernelStateRecord
    runtimeInvocation: RuntimeInvocationRecord
    sessionRegistry: SessionRegistryRecord
    workflowGraph: WorkflowExecutionGraphRecord | null
    workflowWave: WorkflowWaveStateRecord | null
    workflowGuard: WorkflowGuardStateRecord | null
    freshnessRegistry: ArtifactFreshnessRegistryRecord
  }
  supervisorState: {
    registry: SupervisorInstanceRegistryRecord
    health: SupervisorHealthSummary
  }
  lineageSessionState: {
    lineage: string
    purposeClass: string
    trajectoryId?: string
    workflowId?: string
    taskIds: string[]
    subtaskIds: string[]
    checkpointId?: string
  }
  workflowGateState: {
    availableCommands: string[]
  }
}
