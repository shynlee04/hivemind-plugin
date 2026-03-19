import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import type { Part } from '@opencode-ai/sdk'

import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'

function createPluginInput(directory: string) {
  return {
    directory,
    client: {
      tui: {
        showToast: async () => undefined,
      },
    },
    $: {},
    serverUrl: new URL('http://localhost:4096'),
    project: null,
  } as never
}

function createUserMessage(text: string) {
  return {
    info: {
      id: 'msg_123',
      role: 'user',
      sessionID: 'ses_123',
    },
    parts: [
      {
        id: 'part_123',
        type: 'text',
        text,
      } as Part,
    ],
  }
}

test('plugin assembly keeps only the authoritative runtime hooks', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-assembly-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))

    assert.ok(hooks['chat.message'])
    assert.ok(hooks['experimental.chat.messages.transform'])
    assert.ok(hooks['experimental.session.compacting'])
    assert.equal(hooks['experimental.chat.system.transform'], undefined)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('chat.message only resets turn state and does not inject runtime context parts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-chat-message-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const output = { parts: [] as Part[] }

    await hooks['chat.message']?.({ sessionID: 'ses_123', messageID: 'msg_123' } as never, output as never)

    assert.equal(output.parts.length, 0)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('messages transform injects one unified packet and no legacy packet families', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-messages-transform-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const userMessage = createUserMessage('please plan the runtime cleanup')
    const output = { messages: [userMessage] }

    await hooks['experimental.chat.messages.transform']?.({} as never, output as never)

    const texts = (userMessage.parts ?? [])
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')

    assert.equal(texts.filter((text) => text.startsWith('<hivemind context_version="v1">')).length, 1)
    assert.equal(texts.some((text) => text.includes('<opencode-runtime-knowledge>')), false)
    assert.equal(texts.some((text) => text.includes('<hivemind-lineage-refresh>')), false)
    assert.equal(texts.some((text) => text.includes('<hivemind-route-bridge>')), false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('compaction pushes the same authoritative packet and no duplicate system packet', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-compaction-'))

  try {
    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const output = { context: [] as string[] }

    await hooks['experimental.session.compacting']?.({ sessionID: 'ses_123' } as never, output as never)

    assert.equal(output.context.length, 1)
    assert.equal(output.context[0]?.startsWith('<hivemind context_version="v1">'), true)
    assert.equal(output.context.some((text) => text.includes('<opencode-runtime-knowledge>')), false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
