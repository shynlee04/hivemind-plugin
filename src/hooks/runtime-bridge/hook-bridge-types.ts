import type { ToolResponse } from '../../shared/tool-response.js'

export interface RuntimeHookBridgeDefinition<TInput = unknown, TOutput = unknown> {
  id: string
  instructionFile: string
  loadInstruction(): Promise<string>
  execute(input: TInput): Promise<ToolResponse<TOutput>>
}
