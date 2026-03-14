import type { ToolResponse } from '../shared/tool-response.js'
import type { CompiledPromptPacket } from '../context/prompt-packet/index.js'
import type { RuntimePromptTransformationInput } from '../hooks/prompt-transformation/index.js'
import type { StartWorkInput, StartWorkDecision } from '../hooks/start-work/index.js'
import type { AutoSlashCommandPlan } from '../hooks/auto-slash-command/index.js'
import type { PluginContext } from '../plugin-handlers/index.js'
import type { OpencodeKnowledgeSurface } from '../shared/opencode-knowledge.js'
import type { RuntimePressureContract } from '../shared/pressure-contract.js'
import type { CommandExecutionPreview } from '../commands/slash-command/index.js'

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
  kind: 'hook-bridge' | 'slash-command' | 'agent-tool'
  contractFile: string
  hostEvent: string
  workflowPhase: string
  purposeClasses: string[]
  stateAuthority: string
  pressureContract: RuntimePressureContract
}

export interface PluginRuntimePlan {
  startWork: StartWorkDecision
  autoSlash: AutoSlashCommandPlan
  pluginContext: PluginContext
  opencodeKnowledge: OpencodeKnowledgeSurface[]
  opencodeKnowledgePacket: string
  promptPacket: CompiledPromptPacket
  systemTransform: string
  messageTransform: string
  commandPreview?: CommandExecutionPreview
  runtimeSurfaces: RuntimeSurfaceEntry[]
  hooks: HookDescriptor[]
}

export type PluginRuntimeResponse = ToolResponse<PluginRuntimePlan>
