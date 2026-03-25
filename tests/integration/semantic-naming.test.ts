import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readdirSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'

const TEST_DIR = join(process.cwd(), '.test-semantic-naming')

describe('Session file naming', () => {
  beforeEach(() => {
    mkdirSync(join(TEST_DIR, '.hivemind', 'sessions'), { recursive: true })
  })

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true })
  })

  it('creates session file with semantic naming format', async () => {
    const projectRoot = TEST_DIR

    const { handleTextComplete } = await import(
      '../../src/hooks/text-complete-handler.js'
    )

    const sessionId = 'ses_test_semantic'
    await handleTextComplete(
      { sessionID: sessionId, messageID: 'msg_1', partID: 'part_1' } as any,
      { text: 'Test content' },
      projectRoot
    )

    const sessionsDir = join(projectRoot, '.hivemind', 'sessions')
    const files = readdirSync(sessionsDir)

    // Find the session file
    const sessionFile = files.find(f => f.includes('ses_test_semantic'))
    expect(sessionFile, `Expected a session file containing 'ses_test_semantic', found: ${JSON.stringify(files)}`).toBeDefined()

    // Verify it's a JSON file
    expect(sessionFile).toMatch(/\.json$/)

    // Verify semantic format: ses_<timestamp>_<purpose>_<agent>.json
    // A semantic filename must contain at least 3 underscore-separated segments
    // after removing the .json extension
    const basename = sessionFile!.replace(/\.json$/, '')
    const segments = basename.split('_')

    expect(segments.length, `Expected at least 4 segments (ses_<timestamp>_<purpose>_<agent>), got: '${basename}'`).toBeGreaterThanOrEqual(4)

    // First segment must be 'ses'
    expect(segments[0]).toBe('ses')

    // Second segment must look like a timestamp (contains digits and T or dashes)
    expect(segments[1], `Expected timestamp segment, got: '${segments[1]}'`).toMatch(/[\dT-]/)

    // Third segment must be a purpose class (not an opaque hex string)
    const purpose = segments[2]
    expect(purpose, `Purpose segment should be a readable word, got: '${purpose}'`).toMatch(/^[a-z]{3,20}$/)

    // Fourth segment must be an agent name (not an opaque hex string)
    const agent = segments[3]
    expect(agent, `Agent segment should be a readable word, got: '${agent}'`).toMatch(/^[a-z][a-z0-9_-]{1,30}$/)
  })
})
