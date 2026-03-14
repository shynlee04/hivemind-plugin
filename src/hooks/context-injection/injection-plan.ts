import type { CompiledPromptPacket } from '../../context/prompt-packet/index.js'

export interface ContextInjectionPlan {
  systemText: string
  messageText: string | null
  sessionScope: 'main' | 'sub-session'
}

export function buildContextInjectionPlan(packet: CompiledPromptPacket): ContextInjectionPlan {
  return {
    systemText: packet.systemPacket,
    messageText: packet.messagePacket || null,
    sessionScope: packet.sessionScope,
  }
}
