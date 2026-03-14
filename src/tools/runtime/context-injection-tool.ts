import { buildContextInjectionPlan } from '../../hooks/context-injection/index.js'
import type { CompiledPromptPacket } from '../../context/prompt-packet/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeToolInstruction } from './instruction-loader.js'
import type { RuntimeToolDefinition } from './runtime-tool-types.js'

export const contextInjectionTool: RuntimeToolDefinition<
  CompiledPromptPacket,
  ReturnType<typeof buildContextInjectionPlan>
> = {
  id: 'context-injection',
  instructionFile: 'context-injection.txt',
  loadInstruction: () => loadRuntimeToolInstruction('context-injection'),
  async execute(input) {
    const plan = buildContextInjectionPlan(input)
    const instruction = await loadRuntimeToolInstruction('context-injection')
    return success('Built context injection plan', plan, {
      tool: 'context-injection',
      instruction,
    })
  },
}
