import type { Part } from '@opencode-ai/sdk'

export type MessageLike = {
  info?: {
    id?: string
    role?: string
    sessionID?: string
  }
  parts?: Part[]
}

export function createSyntheticPart(sessionID: string, messageID: string, text: string): Part {
  return {
    id: `prt_hm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionID,
    messageID,
    type: 'text',
    text,
    synthetic: true,
    experimental_providerMetadata: {
      opencode: {
        ui_hidden: true,
      },
    },
  } as Part
}

export function getMessageText(message: MessageLike): string {
  return (message.parts ?? [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text ?? '')
    .join(' ')
}

export function findLastUserMessage(messages: MessageLike[]): MessageLike | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message.info?.role === 'user') {
      return message
    }
  }

  return undefined
}
