/**
 * RED test: tool invocation tracking via tool.execute.after hook.
 *
 * Verifies that handleToolExecution writes a tool_invocation entry
 * to the session's events array in the consolidated JSON file.
 *
 * This test MUST fail — the function does not exist yet.
 */
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, afterAll, beforeAll, expect } from 'vitest'

const HIVEMIND_DIR = '.hivemind'
const SESSIONS_DIR = 'sessions'

describe('handleToolExecution', () => {
  let testDir: string

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'hm-tool-invoke-'))
  })

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('logs tool invocation to events array when tool.execute.after fires', async () => {
    const sessionId = 'ses_test_tool_invocation'
    const projectRoot = testDir

    // Import the tool execution handler (does not exist yet - this is RED)
    const { handleToolExecution } = await import(
      '../../src/hooks/tool-execution-handler.js'
    )

    // Pre-create session file so handler can load and modify it
    const sessionsDir = join(projectRoot, HIVEMIND_DIR, SESSIONS_DIR)
    await mkdir(sessionsDir, { recursive: true })
    const sessionPath = join(sessionsDir, `${sessionId}.json`)
    await writeFile(
      sessionPath,
      JSON.stringify(
        {
          _schema: 'session/v2',
          sessionId,
          events: [],
        },
        null,
        2,
      ),
      'utf-8',
    )

    // Act: fire the tool.execute.after handler with real SDK input shape
    await handleToolExecution(
      {
        tool: 'bash',
        sessionID: sessionId,
        callID: 'call_001',
        args: { command: 'ls' },
      },
      {
        title: 'List files',
        output: 'file1.ts\nfile2.ts',
        metadata: {},
      },
      projectRoot,
    )

    // Assert: tool invocation event exists in the session file
    const raw = await readFile(sessionPath, 'utf-8')
    const content = JSON.parse(raw)

    const toolEvents = content.events.filter(
      (e: any) => e.type === 'tool_invocation',
    )
    expect(toolEvents).toHaveLength(1)
    expect(toolEvents[0].toolName).toBe('bash')
    expect(toolEvents[0].callID).toBe('call_001')
  })
})
