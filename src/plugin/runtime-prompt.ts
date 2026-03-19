import {
  compilePromptPacket,
  type CompiledPromptPacket,
  type PromptPacketState,
  type SessionScope,
} from '../context/prompt-packet/index.js'

export interface RuntimePromptTransformationInput extends PromptPacketState {
  sessionScope: SessionScope
}

export function transformRuntimePrompt(
  input: RuntimePromptTransformationInput,
): CompiledPromptPacket {
  return compilePromptPacket(input, input.sessionScope)
}
