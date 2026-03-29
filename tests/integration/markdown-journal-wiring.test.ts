import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { createSessionResolver } from '../../src/features/session-journal/session-resolver.js'

function getJourneyEventJsonPath(projectRoot: string, sessionId: string): string {
  return join(projectRoot, '.hivemind', 'sessions', 'journey-events', `${sessionId}.json`)
}

function getJourneyEventMarkdownPath(projectRoot: string, sessionId: string): string {
  return join(projectRoot, '.hivemind', 'sessions', 'journey-events', `${sessionId}.md`)
}

function getFlatSessionJsonPath(projectRoot: string, sessionId: string): string {
  return join(projectRoot, '.hivemind', 'sessions', `${sessionId}.json`)
}

function getErrorLogPath(projectRoot: string, sessionId: string): string {
  return join(projectRoot, '.hivemind', 'sessions', 'error-logs', `${sessionId}.log`)
}

async function resolveSemanticSessionId(projectRoot: string, sdkSessionId: string): Promise<string> {
  const resolver = createSessionResolver(projectRoot)
  const semanticSessionId = await resolver.resolve(sdkSessionId)
  assert.ok(semanticSessionId, `expected semantic session id for ${sdkSessionId}`)
  return semanticSessionId
}

test('handleTextComplete creates append-only markdown under journey-events', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-md-text-complete-'))

  try {
    const { handleTextComplete } = await import('../../src/hooks/text-complete-handler.js')
    const sdkSessionId = 'ses_markdown_text_complete'

    await handleTextComplete(
      { sessionID: sdkSessionId, messageID: 'msg_001', partID: 'part_001' },
      { text: 'Assistant response for markdown journal.' },
      projectRoot,
    )

    const semanticSessionId = await resolveSemanticSessionId(projectRoot, sdkSessionId)
    const markdownPath = getJourneyEventMarkdownPath(projectRoot, semanticSessionId)
    const jsonPath = getJourneyEventJsonPath(projectRoot, semanticSessionId)

    assert.equal(existsSync(markdownPath), true)
    assert.equal(existsSync(jsonPath), true)
    assert.equal(existsSync(getFlatSessionJsonPath(projectRoot, semanticSessionId)), false)

    const content = await readFile(markdownPath, 'utf8')
    assert.match(content, new RegExp(`# Session: ${semanticSessionId}`))
    assert.match(content, /Assistant Output/)
    assert.match(content, /Assistant response for markdown journal\./)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('chat and tool handlers append user and tool entries to markdown journal', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-md-chat-tool-'))

  try {
    const { handleChatMessage } = await import('../../src/hooks/chat-message-handler.js')
    const { handleToolExecution } = await import('../../src/hooks/tool-execution-handler.js')
    const sdkSessionId = 'ses_markdown_chat_tool'

    await handleChatMessage(
      { sessionID: sdkSessionId, agent: 'hiveminder' },
      { message: { role: 'user', content: 'User prompt for markdown journal.' }, parts: [] },
      projectRoot,
    )

    await handleToolExecution(
      { tool: 'bash', sessionID: sdkSessionId, callID: 'call_001', args: { command: 'pwd' } },
      { title: 'Print working directory', output: '/tmp/worktree', metadata: {} },
      projectRoot,
    )

    const semanticSessionId = await resolveSemanticSessionId(projectRoot, sdkSessionId)
    const content = await readFile(getJourneyEventMarkdownPath(projectRoot, semanticSessionId), 'utf8')

    assert.match(content, /User Message/)
    assert.match(content, /User prompt for markdown journal\./)
    assert.match(content, /Tool Invocation/)
    assert.match(content, /\*\*Tool:\*\* bash/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('handleCompaction appends compaction entry to markdown journal', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-md-compaction-'))

  try {
    const { handleCompaction } = await import('../../src/hooks/compaction-handler.js')
    const sdkSessionId = 'ses_markdown_compaction'

    await handleCompaction(
      { sessionID: sdkSessionId },
      { context: ['alpha', 'beta', 'gamma'], prompt: 'Compact this conversation.' },
      projectRoot,
    )

    const semanticSessionId = await resolveSemanticSessionId(projectRoot, sdkSessionId)
    const content = await readFile(getJourneyEventMarkdownPath(projectRoot, semanticSessionId), 'utf8')

    assert.match(content, /Compaction/)
    assert.match(content, /Compact this conversation\./)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})

test('event handler writes lifecycle markdown and error log files', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'hm-md-events-'))

  try {
    const { createEventHandler } = await import('../../src/hooks/event-handler.js')
    const handler = createEventHandler(projectRoot)
    const sdkSessionId = 'ses_markdown_event_handler'

    await handler({
      event: {
        type: 'session.created',
        properties: {
          sessionID: sdkSessionId,
          lineage: 'hiveminder',
          purposeClass: 'implementation',
          agent: 'hiveminder',
        },
      } as never,
    })

    await handler({
      event: {
        type: 'session.error',
        properties: {
          sessionID: sdkSessionId,
          reason: 'simulated failure',
          code: 'E_TEST',
        },
      } as never,
    })

    await handler({
      event: {
        type: 'session.idle',
        properties: {
          sessionID: sdkSessionId,
        },
      } as never,
    })

    const semanticSessionId = await resolveSemanticSessionId(projectRoot, sdkSessionId)
    const markdownPath = getJourneyEventMarkdownPath(projectRoot, semanticSessionId)
    const errorLogPath = getErrorLogPath(projectRoot, semanticSessionId)
    const markdown = await readFile(markdownPath, 'utf8')
    const errorLog = await readFile(errorLogPath, 'utf8')

    assert.match(markdown, /Session created/i)
    assert.match(markdown, /Error/)
    assert.match(markdown, /Session idle/i)
    assert.match(markdown, /## Diagnostics/)
    assert.match(markdown, /session\.error event received/)
    assert.match(errorLog, /simulated failure/)
    assert.match(errorLog, /E_TEST/)
  } finally {
    await rm(projectRoot, { recursive: true, force: true })
  }
})
