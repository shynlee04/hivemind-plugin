import type {
  CompiledPromptPacket,
  PromptPacketState,
  SessionScope,
} from './prompt-packet-types.js'
import { normalizePromptPacketState } from './prompt-packet-normalize.js'
import {
  renderMainMessagePacket,
  renderMainSystemPacket,
  renderSubsessionMessagePacket,
  renderSubsessionSystemPacket,
} from './prompt-packet-renderers.js'

/**
 * Compile main/sub-session packets without replaying the full main packet
 * for delegated sub-sessions.
 */
export function compilePromptPacket(
  state: PromptPacketState,
  scope: SessionScope,
): CompiledPromptPacket {
  const normalized = normalizePromptPacketState(state, scope)

  if (scope === 'sub-session') {
    return {
      sessionScope: scope,
      systemPacket: renderSubsessionSystemPacket(normalized),
      messagePacket: renderSubsessionMessagePacket(normalized),
    }
  }

  return {
    sessionScope: scope,
    systemPacket: renderMainSystemPacket(normalized),
    messagePacket: renderMainMessagePacket(normalized),
  }
}
