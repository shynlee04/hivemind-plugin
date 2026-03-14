import {
  transformRuntimePrompt,
  type RuntimePromptTransformationInput,
} from '../hooks/prompt-transformation/index.js'

export function createSystemTransform(input: RuntimePromptTransformationInput): string {
  return transformRuntimePrompt(input).systemPacket
}
