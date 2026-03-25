/**
 * RED test: session.idle event logging.
 *
 * Verifies that handleSessionIdleEvent writes a session.idle entry
 * to the session's events array in the consolidated JSON file.
 *
 * This test MUST fail — the function does not exist yet.
 */
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, it, afterAll, beforeAll, expect } from 'vitest'

const HIVEMIND_DIR = '.hivemind'
const SESSIONS_DIR = 'sessions'

describe('handleSessionIdleEvent', () => {
  let testDir: string

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'hm-idle-event-'))
  })

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true })
  })

  it('logs session.idle event to events array', async () => {
    const sessionId = 'ses_test_idle'
    const projectRoot = testDir

    const { handleSessionIdleEvent } = await import(
      '../../src/hooks/event-handler.js'
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

    // Act: fire the session.idle handler
    await handleSessionIdleEvent(
      {
        type: 'session.idle',
        properties: { sessionID: sessionId },
      },
      projectRoot,
    )

    // Assert: events array contains a session.idle entry
    const content = JSON.parse(await readFile(sessionPath, 'utf-8'))

    expect(content.events).toHaveLength(1)
    expect(content.events[0].type).toBe('session.idle')
  })
})
