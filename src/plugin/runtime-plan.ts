import { buildContextInjectionPlan } from '../hooks/context-injection/index.js'
import { createAutoSlashCommandPlan } from '../hooks/auto-slash-command/index.js'
import { resolveStartWork } from '../hooks/start-work/index.js'
import { buildPluginContext } from '../plugin-handlers/index.js'
import { success } from '../shared/tool-response.js'
import { previewSlashCommandBundle } from '../tools/slash-command/index.js'
import type { PluginRuntimeInput, PluginRuntimeResponse } from './plugin-types.js'
import { createMessagesTransform } from './messages-transform.js'
import { createSystemTransform } from './system-transform.js'
import { createToolRegistry } from './tool-registry.js'
import { createCoreHooks } from './create-core-hooks.js'

export async function createPluginRuntimePlan(input: PluginRuntimeInput): Promise<PluginRuntimeResponse> {
  const startWork = resolveStartWork(input.startWork)
  const autoSlash = createAutoSlashCommandPlan(startWork)
  const pluginContext = buildPluginContext(startWork)
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
    promptPacket,
    systemTransform: promptPacket.systemPacket,
    messageTransform: promptPacket.messagePacket,
    commandPreview,
    toolRegistry: createToolRegistry(),
    hooks: createCoreHooks(),
  }, {
    injectionPlan: buildContextInjectionPlan(promptPacket),
  })
}
