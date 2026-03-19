import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'
import { createMockPluginInput } from './helpers/mock-sdk.js'

function count(text: string, needle: string): number {
  return text.split(needle).length - 1
}

function collectText(values: unknown[]): string {
  return values
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
}

describe('plugin runtime detox baseline', () => {
  it('injects exactly one authoritative hivemind packet into message history', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-runtime-'))

    try {
      const { input } = createMockPluginInput({ directory, worktree: directory })
      const hooks = await HiveMindPlugin(input)
      const output = {
        messages: [
          {
            info: {
              id: 'msg_runtime',
              role: 'user',
              sessionID: 'ses_runtime',
            },
            parts: [
              {
                type: 'text',
                text: 'plan the runtime detox migration',
              },
            ],
          },
        ],
      }

      await hooks['experimental.chat.messages.transform']?.({} as never, output as never)

      const partText = collectText(
        (output.messages[0]?.parts ?? []).map((part) =>
          part && typeof part === 'object' && 'text' in part ? part.text : undefined,
        ),
      )

      assert.equal(count(partText, '<hivemind context_version="v1">'), 1)
      assert.equal(partText.includes('<hivemind-kernel-packet>'), false)
      assert.equal(partText.includes('<hivemind-lineage-refresh>'), false)
      assert.equal(partText.includes('<opencode-runtime-knowledge>'), false)
      assert.equal(partText.includes('<hivemind-route-bridge>'), false)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('treats chat.message as turn lifecycle reset work, not a packet emitter', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-chat-message-'))

    try {
      const { input } = createMockPluginInput({ directory, worktree: directory })
      const hooks = await HiveMindPlugin(input)
      const output = { parts: [] as Array<{ text?: string }> }

      await hooks['chat.message']?.({
        sessionID: 'ses_runtime',
        messageID: 'msg_runtime',
      } as never, output as never)

      assert.equal(output.parts.length, 0, 'chat.message should not inject baseline runtime packets')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it('stores a single authoritative packet during compaction', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-compaction-'))

    try {
      const { input } = createMockPluginInput({ directory, worktree: directory })
      const hooks = await HiveMindPlugin(input)
      const output = { context: [] as string[] }

      await hooks['experimental.session.compacting']?.({
        sessionID: 'ses_runtime',
      } as never, output as never)

      const contextText = collectText(output.context)

      assert.equal(count(contextText, '<hivemind context_version="v1">'), 1)
      assert.equal(contextText.includes('<hivemind-kernel-packet>'), false)
      assert.equal(contextText.includes('<opencode-runtime-knowledge>'), false)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
