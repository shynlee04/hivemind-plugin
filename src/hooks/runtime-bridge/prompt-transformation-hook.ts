import {
  transformRuntimePrompt,
  type RuntimePromptTransformationInput,
} from '../../hooks/prompt-transformation/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeHookInstruction } from './instruction-loader.js'
import type { RuntimeHookBridgeDefinition } from './hook-bridge-types.js'

export const promptTransformationHookBridge: RuntimeHookBridgeDefinition<
  RuntimePromptTransformationInput,
  ReturnType<typeof transformRuntimePrompt>
> = {
  id: 'prompt-transformation',
  instructionFile: 'prompt-transformation.txt',
  loadInstruction: () => loadRuntimeHookInstruction('prompt-transformation'),
  async execute(input) {
    const packet = transformRuntimePrompt(input)
    const instruction = await loadRuntimeHookInstruction('prompt-transformation')
    return success('Transformed runtime prompt into packet', packet, {
      hook: 'prompt-transformation',
      instruction,
    })
  },
}
