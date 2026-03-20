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
import type { RuntimeStatus } from '../../shared/contracts/runtime-status.js'
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

export interface HivemindRuntimeLatestSessionContractSummary {
  contractId: string
  sessionId: string
  updatedAt: string
  delegationExportSessionId?: string
  continuityId?: string
  continuityKey?: string
  continuityPhase?: string
  continuityCurrentSessionId?: string
  continuityPriorSessionId?: string
  continuityTurnOutputRefs?: string[]
  planningPath?: string
  responseMode: string
  workflowPhase: string
  activeTaskIds: string[]
  pendingTaskIds: string[]
  briefingSummary: string
  followUp: string[]
  recentAnchorDescriptions: string[]
  compactionAction: string
}

export interface HivemindRuntimeStatusPayload extends RuntimeStatus {
  runtimeState: {
    sessionID: string
    attachmentMode: string
    runtimeAuthority: string
    runtimeInstanceId?: string
    serverBaseUrl?: string
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
  latestSessionContract: HivemindRuntimeLatestSessionContractSummary | null
  workflowGateState: {
    availableCommands: string[]
  }
}
