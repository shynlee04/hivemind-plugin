import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it } from 'node:test'

import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'
import { createMockPluginInput } from './helpers/mock-sdk.js'

function readTexts(parts: Array<{ text?: string }> | undefined): string[] {
  return (parts ?? [])
    .map((part) => part.text)
    .filter((text): text is string => typeof text === 'string')
}

function count(text: string, needle: string): number {
  return text.split(needle).length - 1
}

describe('plugin context detox baseline', () => {
  it('keeps one authoritative packet family across a single turn', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-detox-'))

    try {
      const { input } = createMockPluginInput({ directory, worktree: directory })
      const hooks = await HiveMindPlugin(input)

      const chatOutput = { parts: [] as Array<{ text?: string }> }
      const messageOutput = {
        messages: [
          {
            info: { id: 'msg_detox', role: 'user', sessionID: 'ses_detox' },
            parts: [{ type: 'text', text: 'continue the runtime detox work' }],
          },
        ],
      }
      const compactionOutput = { context: [] as string[] }

      await hooks['chat.message']?.({
        sessionID: 'ses_detox',
        messageID: 'msg_detox',
      } as never, chatOutput as never)
      await hooks['experimental.chat.messages.transform']?.({} as never, messageOutput as never)
      await hooks['experimental.session.compacting']?.({
        sessionID: 'ses_detox',
      } as never, compactionOutput as never)

      const combined = [
        ...readTexts(chatOutput.parts),
        ...readTexts(messageOutput.messages[0]?.parts),
        ...compactionOutput.context,
      ].join('\n')

      assert.equal(count(combined, '<hivemind context_version="v1">'), 2)
      assert.equal(combined.includes('<opencode-runtime-knowledge>'), false)
      assert.equal(combined.includes('<hivemind-session-context>'), false)
      assert.equal(combined.includes('<hivemind-kernel-packet>'), false)
      assert.equal(combined.includes('<hivemind-lineage-refresh>'), false)
      assert.equal(combined.includes('<hivemind-route-bridge>'), false)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
