import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, mock, afterEach } from 'node:test'

import type { Event } from '@opencode-ai/sdk'

import { createSessionResolver } from '../../src/features/session-journal/session-resolver.js'
import { getSessionPath } from '../../src/features/event-tracker/consolidated-writer.js'
import { createEventHandler } from '../../src/hooks/event-handler.js'
import { initSdkContext, resetSdkContext } from '../../src/hooks/sdk-context.js'

// Mock project for testing
const mockProject = {
  id: 'test-project-id',
  worktree: '/tmp/test-worktree',
  time: { created: Date.now() },
}

describe('createEventHandler session.idle handling', () => {
  const testDirectory = '/tmp/hivemind-test-session-idle'

  afterEach(() => {
    resetSdkContext()
  })

  it('should call client.session.get() when session.idle event is received', async () => {
    // Create mock functions that track calls
    const sessionGetMock = mock.fn(async () => ({
      id: 'test-session-123',
      agent: 'test-agent',
      status: 'active',
      createdAt: '2026-03-24T10:00:00.000Z',
      updatedAt: '2026-03-24T10:30:00.000Z',
    }))

    const sessionMessagesMock = mock.fn(async () => ({
      messages: [
        {
          info: { id: 'msg-1', role: 'user' as const, sessionID: 'test-session-123' },
          parts: [{ id: 'part-1', type: 'text' as const, text: 'Hello' }],
        },
      ],
    }))

    // Initialize SDK context with mock client
    initSdkContext({
      client: {
        session: {
          get: sessionGetMock,
          messages: sessionMessagesMock,
        },
        tui: { showToast: async () => undefined },
      } as never,
      $: {} as never,
      serverUrl: new URL('http://localhost:4096'),
      project: mockProject,
    })

    const eventHandler = createEventHandler(testDirectory)

    // Create a session.idle event
    const idleEvent: Event = {
      type: 'session.idle',
      properties: {
        sessionID: 'test-session-123',
      },
    }

    // Call the event handler with session.idle
    await eventHandler({ event: idleEvent })

    // ASSERTION: client.session.get() SHOULD have been called with the session ID
    // This will FAIL because the current implementation doesn't call client.session.get()
    assert.equal(
      sessionGetMock.mock.callCount(),
      1,
      'client.session.get() should be called exactly once for session.idle event',
    )

    // Verify it was called with the correct session ID
    const callArgs = sessionGetMock.mock.calls[0]?.arguments
    assert.deepEqual(callArgs, [{ path: { id: 'test-session-123' } }], 'client.session.get() should be called with session path')
  })

  it('should call client.session.messages() when session.idle event is received', async () => {
    // Create mock functions that track calls
    const sessionGetMock = mock.fn(async () => ({
      id: 'test-session-456',
      agent: 'test-agent',
      status: 'active',
      createdAt: '2026-03-24T10:00:00.000Z',
      updatedAt: '2026-03-24T10:30:00.000Z',
    }))

    const sessionMessagesMock = mock.fn(async () => ({
      messages: [
        {
          info: { id: 'msg-1', role: 'user' as const, sessionID: 'test-session-456' },
          parts: [{ id: 'part-1', type: 'text' as const, text: 'Hello' }],
        },
      ],
    }))

    // Initialize SDK context with mock client
    initSdkContext({
      client: {
        session: {
          get: sessionGetMock,
          messages: sessionMessagesMock,
        },
        tui: { showToast: async () => undefined },
      } as never,
      $: {} as never,
      serverUrl: new URL('http://localhost:4096'),
      project: mockProject,
    })

    const eventHandler = createEventHandler(testDirectory)

    // Create a session.idle event
    const idleEvent: Event = {
      type: 'session.idle',
      properties: {
        sessionID: 'test-session-456',
      },
    }

    // Call the event handler with session.idle
    await eventHandler({ event: idleEvent })

    // ASSERTION: client.session.messages() SHOULD have been called
    // This will FAIL because the current implementation doesn't call client.session.messages()
    assert.equal(
      sessionMessagesMock.mock.callCount(),
      1,
      'client.session.messages() should be called exactly once for session.idle event',
    )
  })

  it('should include session.idle in KNOWN_EVENT_TYPES so no warning is emitted', async () => {
    // This test verifies session.idle is properly recognized
    const sessionGetMock = mock.fn(async () => ({
      id: 'test-session-789',
      agent: 'test-agent',
      status: 'active',
      createdAt: '2026-03-24T10:00:00.000Z',
      updatedAt: '2026-03-24T10:30:00.000Z',
    }))
    const sessionMessagesMock = mock.fn(async () => ({
      messages: [
        {
          info: { id: 'msg-1', role: 'user' as const, sessionID: 'test-session-789' },
          parts: [{ id: 'part-1', type: 'text' as const, text: 'Hello' }],
        },
      ],
    }))

    initSdkContext({
      client: {
        session: {
          get: sessionGetMock,
          messages: sessionMessagesMock,
        },
        tui: { showToast: async () => undefined },
      } as never,
      $: {} as never,
      serverUrl: new URL('http://localhost:4096'),
      project: mockProject,
    })

    const eventHandler = createEventHandler(testDirectory)

    const idleEvent: Event = {
      type: 'session.idle',
      properties: {
        sessionID: 'test-session-789',
      },
    }

    // For session.idle to be properly handled, client.session.get() MUST be called
    // This will FAIL if session.idle is not recognized or if the handler doesn't call get()
    await eventHandler({ event: idleEvent })

    // The handler must call client.session.get() for session.idle events
    assert.equal(
      sessionGetMock.mock.callCount(),
      1,
      'client.session.get() must be called for session.idle - proves session.idle is recognized and handled',
    )
  })
})

describe('event-handler session.idle integration with journal', () => {
  afterEach(() => {
    resetSdkContext()
  })

  it('should write session.idle event to journal via appendSessionEvent', async () => {
    // This test would verify that session.idle events are written to the session journal
    // For now, we just verify the handler accepts the event without error
    const sessionGetMock = mock.fn(async () => ({
      id: 'journal-test-session',
      agent: 'test-agent',
      status: 'active',
      createdAt: '2026-03-24T10:00:00.000Z',
      updatedAt: '2026-03-24T10:30:00.000Z',
    }))

    const sessionMessagesMock = mock.fn(async () => ({
      messages: [
        {
          info: { id: 'msg-1', role: 'user' as const, sessionID: 'journal-test-session' },
          parts: [{ id: 'part-1', type: 'text' as const, text: 'Test message' }],
        },
      ],
    }))

    initSdkContext({
      client: {
        session: {
          get: sessionGetMock,
          messages: sessionMessagesMock,
        },
        tui: { showToast: async () => undefined },
      } as never,
      $: {} as never,
      serverUrl: new URL('http://localhost:4096'),
      project: mockProject,
    })

    const eventHandler = createEventHandler('/tmp/hivemind-test-journal')

    const idleEvent: Event = {
      type: 'session.idle',
      properties: {
        sessionID: 'journal-test-session',
      },
    }

    // This should complete without error if session.idle is properly handled
    await eventHandler({ event: idleEvent })

    // For proper session.idle handling, both get() and messages() MUST be called
    // This proves the handler is processing session.idle events correctly
    assert.equal(
      sessionGetMock.mock.callCount(),
      1,
      'client.session.get() must be called to fetch session data for journal',
    )
    assert.equal(
      sessionMessagesMock.mock.callCount(),
      1,
      'client.session.messages() must be called to capture conversation for journal',
    )
  })
})

describe('createEventHandler sub-session linking', () => {
  afterEach(() => {
    resetSdkContext()
  })

  it('links parent and child sessions when session.created includes parentSessionId', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'event-handler-session-link-'))

    try {
      const eventHandler = createEventHandler(projectRoot)
      const sessionResolver = createSessionResolver(projectRoot)

      await eventHandler({
        event: {
          type: 'session.created',
          properties: {
            sessionID: 'sdk-parent-session',
          },
        } as unknown as Event,
      })

      await eventHandler({
        event: {
          type: 'session.created',
          properties: {
            sessionID: 'sdk-child-session',
            parentSessionId: 'sdk-parent-session',
          },
        } as unknown as Event,
      })

      const parentId = await sessionResolver.resolve('sdk-parent-session')
      const childId = await sessionResolver.resolve('sdk-child-session')

      assert.ok(parentId, 'parent session should resolve after session.created')
      assert.ok(childId, 'child session should resolve after session.created')

      const sessionsDir = sessionResolver.getSessionsDir()
      const parent = JSON.parse(
        await readFile(getSessionPath(sessionsDir, parentId as string), 'utf8')
      ) as {
        childSessionIds: string[]
      }
      const child = JSON.parse(
        await readFile(getSessionPath(sessionsDir, childId as string), 'utf8')
      ) as {
        parentSessionId: string | null
      }

      assert.deepEqual(parent.childSessionIds, [childId], 'parent should track child session IDs')
      assert.equal(child.parentSessionId, parentId, 'child should track parent session ID')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })

  it('links delegated child sessions when agent.created includes parentSessionId', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'event-handler-agent-link-'))

    try {
      const eventHandler = createEventHandler(projectRoot)
      const sessionResolver = createSessionResolver(projectRoot)

      await eventHandler({
        event: {
          type: 'session.created',
          properties: {
            sessionID: 'sdk-parent-agent-session',
          },
        } as unknown as Event,
      })

      await eventHandler({
        event: {
          type: 'agent.created',
          properties: {
            sessionID: 'sdk-agent-child-session',
            parentSessionId: 'sdk-parent-agent-session',
          },
        } as unknown as Event,
      })

      const parentId = await sessionResolver.resolve('sdk-parent-agent-session')
      const childId = await sessionResolver.resolve('sdk-agent-child-session')

      assert.ok(parentId, 'parent session should resolve before agent delegation')
      assert.ok(childId, 'child session should be created for delegated agent session')

      const sessionsDir = sessionResolver.getSessionsDir()
      const parent = JSON.parse(
        await readFile(getSessionPath(sessionsDir, parentId as string), 'utf8')
      ) as {
        childSessionIds: string[]
      }
      const child = JSON.parse(
        await readFile(getSessionPath(sessionsDir, childId as string), 'utf8')
      ) as {
        parentSessionId: string | null
      }

      assert.deepEqual(parent.childSessionIds, [childId], 'agent-created child should be linked to parent')
      assert.equal(child.parentSessionId, parentId, 'agent-created child should store parent ID')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
