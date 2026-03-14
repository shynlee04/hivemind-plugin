import {
  resolveRuntimeLoadStage,
  type RuntimeLoadInput,
} from '../../hooks/runtime-loader/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeToolInstruction } from './instruction-loader.js'
import type { RuntimeToolDefinition } from './runtime-tool-types.js'

export const runtimeLoaderTool: RuntimeToolDefinition<
  RuntimeLoadInput,
  { stage: ReturnType<typeof resolveRuntimeLoadStage> }
> = {
  id: 'runtime-loader',
  instructionFile: 'runtime-loader.txt',
  loadInstruction: () => loadRuntimeToolInstruction('runtime-loader'),
  async execute(input) {
    const stage = resolveRuntimeLoadStage(input)
    const instruction = await loadRuntimeToolInstruction('runtime-loader')
    return success('Resolved runtime load stage', { stage }, {
      tool: 'runtime-loader',
      instruction,
    })
  },
}
