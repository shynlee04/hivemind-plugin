import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import type { Part } from '@opencode-ai/sdk'

import { ContractStore } from '../src/features/agent-work-contract/engine/contract-store.js'
import {
  HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
  HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
  HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
} from '../src/features/agent-work-contract/tools/index.js'
import { HiveMindPlugin } from '../src/plugin/opencode-plugin.js'
import { resolveDefaultAgent, initSkillInjection } from '../src/plugin/skill-exposure-map.js'

function createContract(overrides: Record<string, unknown> = {}) {
  return {
    contractId: 'contract-123',
    sessionId: 'ses_123',
    delegationExportSessionId: 'delegation-789',
    createdAt: '2026-03-20T10:00:00.000Z',
    updatedAt: '2026-03-20T10:10:00.000Z',
    userIntent: {
      raw: 'Preserve contract context during compaction',
      confidence: 0.98,
      purposeClass: 'project-driven' as const,
      requiresPlan: true,
      requiresGovernance: true,
    },
    responseMode: 'broad-search-execute' as const,
    workflow: {
      phase: 'implementation',
      tasks: [
        {
          id: 'task-active',
          title: 'Keep one hook registration',
          status: 'active' as const,
        },
        {
          id: 'task-pending',
          title: 'Verify runtime wiring',
          status: 'pending' as const,
        },
      ],
    },
    chainActions: {
      onTaskComplete: 'next-task' as const,
      onWorkflowEnd: 'archive' as const,
      onDelegation: 'handoff-packet' as const,
      onCompaction80: 'launch-context-agent' as const,
    },
    briefing: {
      summary: 'Continue plugin wiring safely.',
      workflowState: 'implementation',
      followUp: ['extend inline compaction hook'],
    },
    anchors: [
      {
        timestamp: '2026-03-20T10:01:00.000Z',
        kind: 'planning-shift' as const,
        description: 'Verified single compaction registration.',
      },
    ],
    ...overrides,
  }
}

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

test('plugin assembly keeps exactly one root event hook, one inline compaction hook, and the existing tool catalog', async () => {
  const hooks = await HiveMindPlugin(createPluginInput('/tmp/hivemind-plugin-assembly'))
  const registeredToolIds = Object.keys(hooks.tool ?? {}).sort()
  const hookKeys = Object.keys(hooks)

  assert.equal(typeof hooks.event, 'function')
  assert.equal(typeof hooks['experimental.session.compacting'], 'function')
    assert.equal(hookKeys.filter((key) => key === 'event').length, 1)
    assert.equal(hookKeys.filter((key) => key === 'experimental.session.compacting').length, 1)
    assert.deepEqual(registeredToolIds, [
      'hivemind_agent_work_create_contract',
      'hivemind_agent_work_export_contract',
      'hivemind_doc',
      'hivemind_handoff',
      'hivemind_hm_doctor',
      'hivemind_hm_init',
      'hivemind_hm_setting',
      'hivemind_journal',
      'hivemind_runtime_command',
      'hivemind_runtime_status',
      'hivemind_task',
      'hivemind_trajectory',
    ].sort())
    assert.equal(registeredToolIds.length, 12, 'plugin should register exactly 12 tools')
    assert.equal(registeredToolIds.includes(HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID), false)
    assert.equal(registeredToolIds.includes(HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID), true)
    assert.equal(registeredToolIds.includes(HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID), true)
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

test('compaction extends the existing inline packet with validated agent-work context when a contract exists', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-compaction-contract-'))

  try {
    const store = new ContractStore(directory)
    await store.create(createContract())

    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const output = { context: [] as string[] }

    await hooks['experimental.session.compacting']?.({ sessionID: 'ses_123' } as never, output as never)

    assert.equal(output.context.length, 1)
    assert.match(output.context[0] ?? '', /contract_id="contract-123"/)
    assert.match(output.context[0] ?? '', /response_mode="broad-search-execute"/)
    assert.match(output.context[0] ?? '', /compaction_action="launch-context-agent"/)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('compaction skips malformed stored contracts instead of aborting the inline hook', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'hm-plugin-compaction-malformed-'))

  try {
    const store = new ContractStore(directory)
    await store.create(createContract())
    await writeFile(
      join(directory, '.hivemind', 'agent-work-contract', 'broken-contract.json'),
      '{"contractId":',
      'utf-8',
    )

    const hooks = await HiveMindPlugin(createPluginInput(directory))
    const output = { context: [] as string[] }

    await hooks['experimental.session.compacting']?.({ sessionID: 'ses_123' } as never, output as never)

    assert.equal(output.context.length, 1)
    assert.match(output.context[0] ?? '', /contract_id="contract-123"/)
    assert.equal(output.context[0]?.includes('broken-contract'), false)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

test('resolveDefaultAgent returns hiveminder when no config is loaded', () => {
  // initSkillInjection may or may not have been called; resolveDefaultAgent
  // must still return a safe fallback of 'hiveminder'
  const agent = resolveDefaultAgent()
  assert.equal(agent, 'hiveminder', 'default agent should be hiveminder when no config is loaded')
})
