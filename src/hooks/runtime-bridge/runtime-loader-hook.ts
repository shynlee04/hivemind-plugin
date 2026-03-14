import {
  resolveRuntimeLoadStage,
  type RuntimeLoadInput,
} from '../../hooks/runtime-loader/index.js'
import { success } from '../../shared/tool-response.js'
import { loadRuntimeHookInstruction } from './instruction-loader.js'
import type { RuntimeHookBridgeDefinition } from './hook-bridge-types.js'

export const runtimeLoaderHookBridge: RuntimeHookBridgeDefinition<
  RuntimeLoadInput,
  { stage: ReturnType<typeof resolveRuntimeLoadStage> }
> = {
  id: 'runtime-loader',
  instructionFile: 'runtime-loader.txt',
  loadInstruction: () => loadRuntimeHookInstruction('runtime-loader'),
  async execute(input) {
    const stage = resolveRuntimeLoadStage(input)
    const instruction = await loadRuntimeHookInstruction('runtime-loader')
    return success('Resolved runtime load stage', { stage }, {
      hook: 'runtime-loader',
      instruction,
    })
  },
}
