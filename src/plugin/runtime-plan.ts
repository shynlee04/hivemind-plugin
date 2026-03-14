import { buildContextInjectionPlan } from '../hooks/context-injection/index.js'
import { createAutoSlashCommandPlan } from '../hooks/auto-slash-command/index.js'
import { resolveStartWork } from '../hooks/start-work/index.js'
import { buildPluginContext } from '../plugin-handlers/index.js'
import { renderOpencodeKnowledgePacket } from '../shared/opencode-knowledge.js'
import { success } from '../shared/tool-response.js'
import { previewSlashCommandBundle } from '../commands/slash-command/index.js'
import type { PluginRuntimeInput, PluginRuntimeResponse } from './plugin-types.js'
import { createMessagesTransform } from './messages-transform.js'
import { createSystemTransform } from './system-transform.js'
import { createRuntimeSurfaceRegistry } from './surface-registry.js'
import { createCoreHooks } from './create-core-hooks.js'

export async function createPluginRuntimePlan(input: PluginRuntimeInput): Promise<PluginRuntimeResponse> {
  const startWork = resolveStartWork(input.startWork)
  const autoSlash = createAutoSlashCommandPlan(startWork)
  const pluginContext = buildPluginContext(startWork)
  const opencodeKnowledgePacket = renderOpencodeKnowledgePacket(startWork.opencodeKnowledge)
  const promptPacket = {
    sessionScope: input.promptState.sessionScope,
    systemPacket: createSystemTransform(input.promptState),
    messagePacket: createMessagesTransform(input.promptState),
  }
  const commandPreview = autoSlash.commandBinding.bundle
    ? await previewSlashCommandBundle(autoSlash.commandBinding.bundle)
    : undefined

  return success('Built plugin runtime orchestration plan', {
    startWork,
    autoSlash,
    pluginContext,
    opencodeKnowledge: startWork.opencodeKnowledge,
    opencodeKnowledgePacket,
    promptPacket,
    systemTransform: promptPacket.systemPacket,
    messageTransform: promptPacket.messagePacket,
    commandPreview,
    runtimeSurfaces: createRuntimeSurfaceRegistry(),
    hooks: createCoreHooks(),
  }, {
    injectionPlan: buildContextInjectionPlan(promptPacket),
  })
}
