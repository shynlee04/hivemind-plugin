import type { KernelLineage } from '../../context/prompt-packet/prompt-packet-types.js'
import type {
  ControlPlaneIntakeEvidence,
  ControlPlanePrimitiveId,
  ControlPlaneProfileGroupId,
  ControlPlaneRecommendedPresetId,
} from '../../control-plane/index.js'
import type { PurposeClass } from '../../features/session-entry/start-work-types.js'
import type { CommandAssetFrontmatter, CommandRuntimeContract } from '../../features/runtime-entry/instruction-loader.js'
import type { RuntimeInvocationV1 } from '../../features/runtime-entry/invocation.js'
import type {
  TurnExportProjectionV1,
  TurnOutputEnvelopeV1,
} from '../../features/runtime-entry/turn-output.js'
import type { RuntimePressureContract } from '../../shared/pressure-contract.js'

/** Core command identity */
export interface SlashCommandCore {
  id: string
  title: string
  agent: string
  commandFile: string
  lineages: KernelLineage[]
  purposeClasses: PurposeClass[]
}

/** Routing and execution behavior */
export interface SlashCommandRouting {
  controlPlanePrimitiveId?: ControlPlanePrimitiveId
  continuationMode: 'resume' | 'handoff' | 'iterative'
  autoRouteAllowed: boolean
  workflowPhase: string
  hostEvent: string
}

/** Runtime contracts and grants */
export interface SlashCommandContracts {
  workflowChain: string[]
  toolGrantIds: string[]
  structuredOutput: string
  stateAuthority: string
  pressureContract: RuntimePressureContract
}

/** Full slash command bundle — composed via intersection for backward compatibility */
export type SlashCommandBundle = SlashCommandCore
  & SlashCommandRouting
  & SlashCommandContracts

export interface CommandExecutionPreview {
  commandId: string
  title: string
  commandFile: string
  frontmatter: CommandAssetFrontmatter
  body: string
  contract: CommandRuntimeContract
  workflowChain: string[]
  toolGrantIds: string[]
  structuredOutput: string
  continuationMode: SlashCommandBundle['continuationMode']
  pressureContract: RuntimePressureContract
}

/** Core execution input — session and identity */
export interface CommandInputCore {
  projectRoot: string
  sessionId: string
  sessionScope: 'main' | 'sub-session'
  purposeClass?: PurposeClass
  lineage?: KernelLineage
  activeAgent?: string
  userMessage?: string
}

/** Profile preferences for execution */
export interface CommandInputProfile {
  preferredUserName?: string
  language?: string
  artifactLanguage?: string
  governanceMode?: string
  automationLevel?: string
  expertLevel?: string
  outputStyle?: string
}

/** Entity bindings for execution */
export interface CommandInputBindings {
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  delegationId?: string
  parentSessionId?: string
}

/** Control plane overrides */
export interface CommandInputOverrides {
  presetId?: ControlPlaneRecommendedPresetId
  intakeEvidence?: ControlPlaneIntakeEvidence
  requestedSettingsGroups?: ControlPlaneProfileGroupId[]
  arguments?: string
  entryKernelAction?: 'auto-init' | 'auto-doctor'
}

/** Full command execution input — composed via intersection for backward compatibility */
export type CommandExecutionInput = CommandInputCore
  & CommandInputProfile
  & CommandInputBindings
  & CommandInputOverrides

export interface CommandEntityBindings {
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  delegationId?: string
}

export interface CommandExecutionResult {
  commandId: string
  title: string
  agent: string
  executionMode: 'handler' | 'preview' | 'question-gate'
  contract: CommandRuntimeContract
  report: Record<string, unknown>
  entityBindings?: CommandEntityBindings
  stateTransitions?: string[]
  artifactRefs?: string[]
  closeoutStatus?: 'open' | 'ready' | 'blocked' | 'qa-pending'
  verificationContractId?: string
  pressureContract: RuntimePressureContract
  runtimeInvocation?: RuntimeInvocationV1
  turnOutput?: TurnOutputEnvelopeV1
  turnOutputProjection?: TurnExportProjectionV1
}
