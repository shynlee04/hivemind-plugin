import type { ToolResponse } from '../shared/tool-response.js'
import type { CompiledPromptPacket } from '../context/prompt-packet/index.js'
import type { RuntimePromptTransformationInput } from '../hooks/prompt-transformation/index.js'
import type { StartWorkInput, StartWorkDecision } from '../hooks/start-work/index.js'
import type { AutoSlashCommandPlan } from '../hooks/auto-slash-command/index.js'
import type { PluginContext } from '../plugin-handlers/index.js'
import type { CommandExecutionPreview } from '../tools/slash-command/index.js'

export interface PluginRuntimeInput {
  startWork: StartWorkInput
  promptState: RuntimePromptTransformationInput
}

export interface HookDescriptor {
  name: string
  stage: 'start-work' | 'transform' | 'routing'
  description: string
}

export interface ToolRegistryEntry {
  id: string
  kind: 'runtime-tool' | 'slash-command'
  contractFile: string
}

export interface PluginRuntimePlan {
  startWork: StartWorkDecision
  autoSlash: AutoSlashCommandPlan
  pluginContext: PluginContext
  promptPacket: CompiledPromptPacket
  systemTransform: string
  messageTransform: string
  commandPreview?: CommandExecutionPreview
  toolRegistry: ToolRegistryEntry[]
  hooks: HookDescriptor[]
}

export type PluginRuntimeResponse = ToolResponse<PluginRuntimePlan>
