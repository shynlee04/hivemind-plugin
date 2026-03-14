import { buildContextInjectionPlan } from '../../hooks/context-injection/index.js'
import type { CompiledPromptPacket } from '../../context/prompt-packet/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeHookInstruction } from './instruction-loader.js'
import type { RuntimeHookBridgeDefinition } from './hook-bridge-types.js'

export const contextInjectionHookBridge: RuntimeHookBridgeDefinition<
  CompiledPromptPacket,
  ReturnType<typeof buildContextInjectionPlan>
> = {
  id: 'context-injection',
  instructionFile: 'context-injection.txt',
  loadInstruction: () => loadRuntimeHookInstruction('context-injection'),
  async execute(input) {
    const plan = buildContextInjectionPlan(input)
    const instruction = await loadRuntimeHookInstruction('context-injection')
    return success('Built context injection plan', plan, {
      hook: 'context-injection',
      instruction,
    })
  },
}
