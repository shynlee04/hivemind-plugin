import {
  transformRuntimePrompt,
  type RuntimePromptTransformationInput,
} from '../hooks/prompt-transformation/index.js'

export function createMessagesTransform(input: RuntimePromptTransformationInput): string {
  return transformRuntimePrompt(input).messagePacket
}
