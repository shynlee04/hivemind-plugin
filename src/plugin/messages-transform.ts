import {
  transformRuntimePrompt,
  type RuntimePromptTransformationInput,
} from './runtime-prompt.js'

export function createMessagesTransform(input: RuntimePromptTransformationInput): string {
  return transformRuntimePrompt(input).messagePacket
}
