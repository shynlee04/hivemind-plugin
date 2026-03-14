import {
  transformRuntimePrompt,
  type RuntimePromptTransformationInput,
} from '../../hooks/prompt-transformation/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeToolInstruction } from './instruction-loader.js'
import type { RuntimeToolDefinition } from './runtime-tool-types.js'

export const promptTransformationTool: RuntimeToolDefinition<
  RuntimePromptTransformationInput,
  ReturnType<typeof transformRuntimePrompt>
> = {
  id: 'prompt-transformation',
  instructionFile: 'prompt-transformation.txt',
  loadInstruction: () => loadRuntimeToolInstruction('prompt-transformation'),
  async execute(input) {
    const packet = transformRuntimePrompt(input)
    const instruction = await loadRuntimeToolInstruction('prompt-transformation')
    return success('Transformed runtime prompt into packet', packet, {
      tool: 'prompt-transformation',
      instruction,
    })
  },
}
