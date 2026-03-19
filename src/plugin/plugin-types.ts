import type { ToolResponse } from '../shared/tool-response.js'
import type { CompiledPromptPacket } from '../context/prompt-packet/index.js'
import type { RuntimePromptTransformationInput } from '../hooks/prompt-transformation/index.js'
import type {
  StartWorkEntryKernel,
  StartWorkInput,
  StartWorkDecision,
} from '../features/session-entry/start-work-types.js'
import type { AutoSlashCommandPlan } from '../hooks/auto-slash-command/index.js'
import type { PluginContext } from '../plugin-handlers/index.js'
import type { OpencodeKnowledgeSurface } from '../shared/opencode-knowledge.js'
import type { RuntimePressureContract } from '../shared/pressure-contract.js'
import type { CommandExecutionPreview } from '../commands/slash-command/index.js'
import type { RuntimeAttachmentEntryKernel } from '../shared/runtime-attachment.js'
import type { RuntimeInvocationV1 } from '../shared/runtime-invocation.js'
import type { TurnExportProjectionV1 } from '../shared/turn-output.js'

export interface PluginRuntimeInput {
  startWork: StartWorkInput
  promptState: RuntimePromptTransformationInput
}

export interface HookDescriptor {
  name: string
  stage: 'start-work' | 'transform' | 'routing'
  description: string
}

export interface RuntimeSurfaceEntry {
  id: string
  kind: 'hook-bridge' | 'slash-command' | 'agent-tool' | 'control-plane-primitive'
  contractFile: string
  hostEvent: string
  workflowPhase: string
  purposeClasses: string[]
  stateAuthority: string
  pressureContract: RuntimePressureContract
}

export interface PluginRuntimePlan {
  startWork: StartWorkDecision
  entryKernel: RuntimeEntryKernelContract
  autoSlash: AutoSlashCommandPlan
  pluginContext: PluginContext
  opencodeKnowledge: OpencodeKnowledgeSurface[]
  opencodeKnowledgePacket: string
  promptPacket: CompiledPromptPacket
  systemTransform: string
  messageTransform: string
  commandPreview?: CommandExecutionPreview
  runtimeInvocation: RuntimeInvocationV1
  turnOutputProjection: TurnExportProjectionV1
  runtimeSurfaces: RuntimeSurfaceEntry[]
  hooks: HookDescriptor[]
}

export interface RuntimeEntryKernelFieldOwnership {
  session: 'start-work'
  routing: 'start-work'
  safety: 'start-work'
  defaults: 'runtime-attachment'
  profile: 'runtime-attachment'
  bindings: 'runtime-attachment'
}

export interface RuntimeEntryKernelContract {
  version: 'v1'
  fieldOwnership: RuntimeEntryKernelFieldOwnership
  session: StartWorkEntryKernel['session']
  routing: StartWorkEntryKernel['routing']
  safety: StartWorkEntryKernel['safety']
  defaults: RuntimeAttachmentEntryKernel['defaults']
  profile: RuntimeAttachmentEntryKernel['profile']
  bindings: RuntimeAttachmentEntryKernel['bindings']
}

export type PluginRuntimeResponse = ToolResponse<PluginRuntimePlan>
