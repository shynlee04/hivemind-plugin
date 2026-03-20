import assert from 'node:assert/strict'
import test from 'node:test'
import { join } from 'node:path'
import { tool as toolSchema, type ToolContext } from '@opencode-ai/plugin/tool'

import {
  createAgentWorkClassifyIntentTool,
  HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
} from './classify-intent-tool.js'

function createContext(root: string) {
  const metadataCalls: Array<Record<string, unknown>> = []
  const context: ToolContext = {
    sessionID: 'session-intent-123',
    messageID: 'message-intent-123',
    agent: 'hiveminder-primary-orchestrator',
    directory: join(root, 'nested-directory'),
    worktree: root,
    abort: new AbortController().signal,
    metadata(input) {
      metadataCalls.push(input)
    },
    async ask() {
      throw new Error('classify-intent tool should not request edit permission')
    },
  }

  return { context, metadataCalls }
}

test('ClassifyIntentTool - args schema - rejects empty raw intent', () => {
  const tool = createAgentWorkClassifyIntentTool('/unused')
  const parsed = toolSchema.schema.object(tool.args).safeParse({ rawIntent: '' })

  assert.equal(parsed.success, false)
})

test('ClassifyIntentTool - execute - returns validated JSON classification and records metadata', async () => {
  const tool = createAgentWorkClassifyIntentTool('/unused')
  const parsedArgs = toolSchema.schema.object(tool.args).parse({
    rawIntent: 'implement the official sdk create contract tool',
  })
  const { context, metadataCalls } = createContext('/tmp/hm-classify-root')

  const output = await tool.execute(parsedArgs, context)
  const parsed = JSON.parse(output)

  assert.equal(parsed.status, 'success')
  assert.equal(parsed.message, 'Classified agent-work intent')
  assert.equal(parsed.data.classification.intent.purposeClass, 'project-driven')
  assert.equal(parsed.data.classification.suggestedResponseMode, 'broad-search-execute')
  assert.equal(metadataCalls.length, 1)
  assert.deepEqual(metadataCalls[0], {
    title: 'Agent-work intent classified',
    metadata: {
      toolId: HIVEMIND_AGENT_WORK_CLASSIFY_INTENT_TOOL_ID,
      sessionID: 'session-intent-123',
      agent: 'hiveminder-primary-orchestrator',
      directory: '/tmp/hm-classify-root/nested-directory',
      worktree: '/tmp/hm-classify-root',
      purposeClass: 'project-driven',
      responseMode: 'broad-search-execute',
    },
  })
})
