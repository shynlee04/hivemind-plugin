import {
  transformRuntimePrompt,
  type RuntimePromptTransformationInput,
} from './runtime-prompt.js'

export function createSystemTransform(input: RuntimePromptTransformationInput): string {
  return transformRuntimePrompt(input).systemPacket
}
