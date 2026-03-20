import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { tool as toolSchema, type ToolContext } from '@opencode-ai/plugin/tool'

import { ContractStore } from '../engine/contract-store.js'
import {
  createAgentWorkExportContractTool,
  HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
} from './export-contract-tool.js'

function createContext(root: string) {
  const metadataCalls: Array<Record<string, unknown>> = []
  const context: ToolContext = {
    sessionID: 'session-export-123',
    messageID: 'message-export-123',
    agent: 'hiveminder-primary-orchestrator',
    directory: join(root, 'nested-directory'),
    worktree: root,
    abort: new AbortController().signal,
    metadata(input) {
      metadataCalls.push(input)
    },
    async ask() {
      throw new Error('export-contract tool should not request edit permission')
    },
  }

  return { context, metadataCalls }
}

async function seedContract(root: string): Promise<void> {
  const store = new ContractStore(root)
  await store.create({
    contractId: 'contract-export-123',
    sessionId: 'session-export-123',
    delegationExportSessionId: 'delegation-export-456',
    createdAt: '2026-03-20T10:00:00.000Z',
    updatedAt: '2026-03-20T10:10:00.000Z',
    userIntent: {
      raw: 'implement export contract tool',
      confidence: 0.95,
      purposeClass: 'project-driven',
      requiresPlan: true,
      requiresGovernance: true,
    },
    responseMode: 'broad-search-execute',
    workflow: {
      phase: 'implementation',
      tasks: [
        {
          id: 'task-export-1',
          title: 'Export contract',
          status: 'active',
        },
      ],
    },
    chainActions: {
      onTaskComplete: 'next-task',
      onWorkflowEnd: 'archive',
      onDelegation: 'handoff-packet',
      onCompaction80: 'export-summary',
    },
    briefing: {
      summary: 'Export the validated packet.',
      workflowState: 'implementation',
      followUp: ['share summary'],
    },
    anchors: [
      {
        timestamp: '2026-03-20T10:09:00.000Z',
        kind: 'stage-shift',
        description: 'Moved into export validation.',
      },
    ],
  })
}

test('ExportContractTool - execute - exports full validated contract payload', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-export-project-root-'))
  const contextRoot = await mkdtemp(join(tmpdir(), 'hm-export-context-root-'))

  try {
    await seedContract(contextRoot)
    const tool = createAgentWorkExportContractTool(projectRoot)
    const parsedArgs = toolSchema.schema.object(tool.args).parse({
      contractId: 'contract-export-123',
      format: 'contract',
    })
    const { context, metadataCalls } = createContext(contextRoot)

    const output = await tool.execute(parsedArgs, context)
    const parsed = JSON.parse(output)

    assert.equal(parsed.status, 'success')
    assert.equal(parsed.data.format, 'contract')
    assert.equal(parsed.data.payload.contractId, 'contract-export-123')
    assert.equal(parsed.data.payload.briefing.summary, 'Export the validated packet.')
    assert.equal(parsed.data.contract.contractId, 'contract-export-123')
    assert.equal(parsed.data.summary.contractId, 'contract-export-123')
    assert.equal(parsed.data.summary.compactionAction, 'export-summary')
    assert.equal(metadataCalls.length, 1)
    assert.deepEqual(metadataCalls[0], {
      title: 'Agent-work contract exported',
      metadata: {
        toolId: HIVEMIND_AGENT_WORK_EXPORT_CONTRACT_TOOL_ID,
        contractId: 'contract-export-123',
        format: 'contract',
        sessionID: 'session-export-123',
        agent: 'hiveminder-primary-orchestrator',
        directory: join(contextRoot, 'nested-directory'),
        worktree: contextRoot,
      },
    })
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
    await rm(contextRoot, { recursive: true, force: true })
  }
})

test('ExportContractTool - execute - exports compaction-safe summary payload', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hm-export-summary-root-'))

  try {
    await seedContract(root)
    const tool = createAgentWorkExportContractTool(root)
    const parsedArgs = toolSchema.schema.object(tool.args).parse({
      contractId: 'contract-export-123',
      format: 'summary',
    })
    const { context } = createContext(root)

    const output = await tool.execute(parsedArgs, context)
    const parsed = JSON.parse(output)

    assert.equal(parsed.status, 'success')
    assert.equal(parsed.data.format, 'summary')
    assert.equal(parsed.data.payload.contractId, 'contract-export-123')
    assert.equal(parsed.data.payload.compactionAction, 'export-summary')
    assert.deepEqual(parsed.data.payload.activeTaskIds, ['task-export-1'])
    assert.equal(parsed.data.contract.contractId, 'contract-export-123')
    assert.equal(parsed.data.contract.workflow.phase, 'implementation')
    assert.equal(parsed.data.summary.contractId, 'contract-export-123')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('ExportContractTool - execute - returns JSON error when contract is missing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'hm-export-missing-root-'))

  try {
    const tool = createAgentWorkExportContractTool(root)
    const parsedArgs = toolSchema.schema.object(tool.args).parse({
      contractId: 'missing-contract',
      format: 'summary',
    })
    const { context, metadataCalls } = createContext(root)

    const output = await tool.execute(parsedArgs, context)
    const parsed = JSON.parse(output)

    assert.equal(parsed.status, 'error')
    assert.match(parsed.message, /missing-contract/)
    assert.equal(metadataCalls.length, 0)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('ExportContractTool - execute - returns JSON error for malformed stored payloads and uses factory root without worktree', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-export-malformed-project-root-'))
  const contextRoot = await mkdtemp(join(tmpdir(), 'hm-export-malformed-context-root-'))

  try {
    await mkdir(join(projectRoot, '.hivemind', 'agent-work-contract'), { recursive: true })
    await writeFile(
      join(projectRoot, '.hivemind', 'agent-work-contract', 'contract-bad-123.json'),
      JSON.stringify({ contractId: 'contract-bad-123', sessionId: 'session-export-123' }),
      'utf-8',
    )

    const tool = createAgentWorkExportContractTool(projectRoot)
    const parsedArgs = toolSchema.schema.object(tool.args).parse({
      contractId: 'contract-bad-123',
      format: 'contract',
    })
    const { context, metadataCalls } = createContext(contextRoot)
    const noWorktreeContext: ToolContext = { ...context, worktree: '' }

    const output = JSON.parse(await tool.execute(parsedArgs, noWorktreeContext))

    assert.equal(output.status, 'error')
    assert.match(output.message, /userIntent|responseMode|workflow|chainActions/)
    assert.equal(metadataCalls.length, 0)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
    await rm(contextRoot, { recursive: true, force: true })
  }
})
