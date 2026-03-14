import type { KernelLineage } from '../../context/prompt-packet/prompt-packet-types.js'
import type { PurposeClass } from '../../hooks/start-work/start-work-types.js'
import type { CommandAssetFrontmatter, CommandRuntimeContract } from '../../hooks/runtime-bridge/instruction-loader.js'
import type { RuntimePressureContract } from '../../shared/pressure-contract.js'

export interface SlashCommandBundle {
  id: string
  title: string
  agent: string
  lineages: KernelLineage[]
  purposeClasses: PurposeClass[]
  commandFile: string
  workflowChain: string[]
  toolGrantIds: string[]
  structuredOutput: string
  continuationMode: 'resume' | 'handoff' | 'iterative'
  autoRouteAllowed: boolean
  workflowPhase: string
  hostEvent: string
  stateAuthority: string
  pressureContract: RuntimePressureContract
}

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

export interface CommandExecutionInput {
  projectRoot: string
  sessionId: string
  sessionScope: 'main' | 'sub-session'
  purposeClass?: PurposeClass
  lineage?: KernelLineage
  trajectoryId?: string
  arguments?: string
  activeAgent?: string
  parentSessionId?: string
  userMessage?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  delegationId?: string
}

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
  executionMode: 'handler' | 'preview'
  contract: CommandRuntimeContract
  report: Record<string, unknown>
  entityBindings?: CommandEntityBindings
  stateTransitions?: string[]
  artifactRefs?: string[]
  closeoutStatus?: 'open' | 'ready' | 'blocked'
  verificationContractId?: string
  pressureContract: RuntimePressureContract
}
