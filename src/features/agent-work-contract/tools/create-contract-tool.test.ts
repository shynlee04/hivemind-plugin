import assert from 'node:assert/strict'
import { access, readFile, rm } from 'node:fs/promises'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { tool as toolSchema, type ToolContext } from '@opencode-ai/plugin/tool'

import { ContractStore } from '../engine/contract-store.js'
import { agentToolCatalog } from '../../../tools/index.js'
import { HIVEMIND_MANAGED_TOOLS } from '../../../hooks/runtime-loader/tool-governance.js'
import {
  createAgentWorkCreateContractTool,
  HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
  HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
  HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
} from './index.js'

function createContext(root: string) {
  const askCalls: Array<Record<string, unknown>> = []
  const metadataCalls: Array<Record<string, unknown>> = []
  const context: ToolContext = {
    sessionID: 'session-tool-123',
    messageID: 'message-tool-123',
    agent: 'hiveminder-primary-orchestrator',
    directory: join(root, 'nested-directory'),
    worktree: root,
    abort: new AbortController().signal,
    metadata(input) {
      metadataCalls.push(input)
    },
    async ask(input) {
      askCalls.push(input as Record<string, unknown>)
    },
  }

  return { context, askCalls, metadataCalls }
}

function createContextWithoutWorktree(root: string) {
  const base = createContext(root)
  const context: ToolContext = {
    ...base.context,
    worktree: '',
  }

  return {
    context,
    askCalls: base.askCalls,
    metadataCalls: base.metadataCalls,
  }
}

test('CreateContractTool - ids - do not collide with managed or catalogued tool ids', () => {
  assert.equal(HIVEMIND_MANAGED_TOOLS.has(HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID), false)
  assert.equal(
    agentToolCatalog.some((entry) => entry.id === HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID),
    false,
  )
  assert.equal(HIVEMIND_MANAGED_TOOLS.has(HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID), true)
  assert.equal(
    agentToolCatalog.some((entry) => entry.id === HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID),
    true,
  )
  assert.equal(HIVEMIND_MANAGED_TOOLS.has(HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID), true)
  assert.equal(
    agentToolCatalog.some((entry) => entry.id === HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID),
    true,
  )
})

test('CreateContractTool - create - validates args, asks permission, and persists via context worktree', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-contract-project-root-'))
  const contextRoot = await mkdtemp(join(tmpdir(), 'hm-contract-context-root-'))

  try {
    const tool = createAgentWorkCreateContractTool(projectRoot)
    const parsedArgs = toolSchema.schema.object(tool.args).parse({
      action: 'create',
      contractId: 'contract-create-123',
      rawIntent: 'implement the export summary feature',
      workflow: {
        planningPath: '.hivemind/project/planning/export-summary.md',
        phase: 'implementation',
        tasks: [],
      },
      briefing: {
        summary: 'Implement the validated tool path.',
        workflowState: 'implementation',
        followUp: ['run targeted tests'],
      },
    })
    const { context, askCalls, metadataCalls } = createContext(contextRoot)

    const output = await tool.execute(parsedArgs, context)
    const parsed = JSON.parse(output)
    const persisted = await new ContractStore(contextRoot).get('contract-create-123')

    assert.equal(parsed.status, 'success')
    assert.equal(parsed.message, 'Created agent-work contract')
    assert.equal(parsed.data.contract.contractId, 'contract-create-123')
    assert.equal(parsed.data.contract.sessionId, 'session-tool-123')
    assert.equal(parsed.data.contract.userIntent.purposeClass, 'project-driven')
    assert.equal(parsed.data.contract.responseMode, 'broad-search-execute')
    assert.equal(parsed.data.contract.workflow.planningPath, '.hivemind/project/planning/export-summary.md')
    assert.equal(askCalls.length, 1)
    assert.deepEqual(askCalls[0], {
      permission: 'edit',
      patterns: ['.hivemind/agent-work-contract/contract-create-123.json'],
      always: ['*'],
      metadata: {
        toolId: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
        action: 'create',
        contractId: 'contract-create-123',
        sessionID: 'session-tool-123',
        agent: 'hiveminder-primary-orchestrator',
        directory: join(contextRoot, 'nested-directory'),
        worktree: contextRoot,
      },
    })
    const metadataCall = metadataCalls[0] as {
      title: string
      metadata: { worktree: string }
    }

    assert.equal(metadataCalls.length, 1)
    assert.equal(metadataCall.title, 'Agent-work contract created')
    assert.equal(metadataCall.metadata.worktree, contextRoot)
    assert.ok(persisted)
    assert.equal(persisted?.workflow.planningPath, '.hivemind/project/planning/export-summary.md')
    await access(join(contextRoot, '.hivemind', 'agent-work-contract', 'contract-create-123.json'))
    await assert.rejects(access(join(projectRoot, '.hivemind', 'agent-work-contract', 'contract-create-123.json')))
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
    await rm(contextRoot, { recursive: true, force: true })
  }
})

test('CreateContractTool - create - falls back to factory root when worktree is missing and generates a strong id', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-contract-fallback-root-'))
  const contextRoot = await mkdtemp(join(tmpdir(), 'hm-contract-unused-context-root-'))

  try {
    const tool = createAgentWorkCreateContractTool(projectRoot)
    const parsedArgs = toolSchema.schema.object(tool.args).parse({
      action: 'create',
      rawIntent: 'implement safer fallback persistence for contracts',
    })
    const { context, askCalls } = createContextWithoutWorktree(contextRoot)

    const output = await tool.execute(parsedArgs, context)
    const parsed = JSON.parse(output)
    const contractId = parsed.data.contract.contractId as string

    assert.equal(parsed.status, 'success')
    assert.match(contractId, /^awc-session-tool-123-\d+-[0-9a-f-]{36}$/)
    assert.equal(askCalls.length, 1)
    assert.deepEqual(askCalls[0], {
      permission: 'edit',
      patterns: [`.hivemind/agent-work-contract/${contractId}.json`],
      always: ['*'],
      metadata: {
        toolId: HIVEMIND_AGENT_WORK_CREATE_CONTRACT_TOOL_ID,
        action: 'create',
        contractId,
        sessionID: 'session-tool-123',
        agent: 'hiveminder-primary-orchestrator',
        directory: join(contextRoot, 'nested-directory'),
        worktree: '',
      },
    })

    const persistedContent = JSON.parse(
      await readFile(join(projectRoot, '.hivemind', 'agent-work-contract', `${contractId}.json`), 'utf-8'),
    )

    assert.equal(persistedContent.contractId, contractId)
    await assert.rejects(access(join(contextRoot, '.hivemind', 'agent-work-contract', `${contractId}.json`)))
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
    await rm(contextRoot, { recursive: true, force: true })
  }
})

test('CreateContractTool - update - replaces validated contract fields and reclassifies raw intent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hm-contract-update-root-'))

  try {
    const store = new ContractStore(root)
    await store.create({
      contractId: 'contract-update-123',
      sessionId: 'session-tool-123',
      createdAt: '2026-03-20T10:00:00.000Z',
      updatedAt: '2026-03-20T10:00:00.000Z',
      userIntent: {
        raw: 'fix the typo',
        confidence: 0.4,
        purposeClass: 'quick-action',
        requiresPlan: false,
        requiresGovernance: false,
      },
      responseMode: 'broad-search-execute',
      workflow: { tasks: [] },
      chainActions: {
        onTaskComplete: 'next-task',
        onWorkflowEnd: 'archive',
        onDelegation: 'handoff-packet',
        onCompaction80: 'launch-context-agent',
      },
    })

    const tool = createAgentWorkCreateContractTool(root)
    const parsedArgs = toolSchema.schema.object(tool.args).parse({
      action: 'update',
      contractId: 'contract-update-123',
      rawIntent: 'research options for compaction packet formatting',
      workflow: {
        phase: 'review',
        tasks: [
          {
            id: 'task-review-1',
            title: 'Review compaction packet',
            status: 'active',
          },
        ],
      },
    })
    const { context, askCalls, metadataCalls } = createContext(root)

    const output = await tool.execute(parsedArgs, context)
    const parsed = JSON.parse(output)
    const persisted = await store.get('contract-update-123')

    assert.equal(parsed.status, 'success')
    assert.equal(parsed.message, 'Updated agent-work contract')
    assert.equal(parsed.data.contract.userIntent.purposeClass, 'research-brainstorm')
    assert.equal(parsed.data.contract.responseMode, 'interactive-qa')
    assert.equal(parsed.data.contract.workflow.phase, 'review')
    assert.equal(askCalls.length, 1)
    assert.equal((metadataCalls[0] as { title: string }).title, 'Agent-work contract updated')
    assert.equal(persisted?.userIntent.purposeClass, 'research-brainstorm')
    assert.equal(persisted?.responseMode, 'interactive-qa')
    assert.equal(persisted?.workflow.phase, 'review')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('CreateContractTool - execute - returns JSON error when action-specific fields are missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hm-contract-error-root-'))

  try {
    const tool = createAgentWorkCreateContractTool(root)
    const { context } = createContext(root)

    const createOutput = JSON.parse(await tool.execute(toolSchema.schema.object(tool.args).parse({
      action: 'create',
    }), context))
    const updateOutput = JSON.parse(await tool.execute(toolSchema.schema.object(tool.args).parse({
      action: 'update',
      contractId: 'contract-missing-fields',
    }), context))

    assert.equal(createOutput.status, 'error')
    assert.match(createOutput.message, /rawIntent is required/)
    assert.equal(updateOutput.status, 'error')
    assert.match(updateOutput.message, /At least one update field is required/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('CreateContractTool - execute - returns JSON error when store update fails', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hm-contract-store-failure-root-'))

  try {
    const tool = createAgentWorkCreateContractTool(root)
    const { context } = createContext(root)
    const output = JSON.parse(await tool.execute(toolSchema.schema.object(tool.args).parse({
      action: 'update',
      contractId: 'missing-contract',
      responseMode: 'interactive-qa',
    }), context))

    assert.equal(output.status, 'error')
    assert.match(output.message, /missing-contract/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
