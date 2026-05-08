import { vi } from "vitest"

import type { OpenCodeClient } from "../../../src/shared/session-api.js"

type SessionRecord = { id: string; status?: { type?: string } } & Record<string, unknown>

type InMemoryClient = OpenCodeClient & {
  _sessions: Map<string, SessionRecord>
  _messages: Map<string, unknown[]>
  _setStatus: (sessionID: string, type: string) => void
  _addMessage: (sessionID: string, message: unknown) => void
  _setGetSessionError: (error: Error | undefined) => void
}

export function createInMemoryClient(): InMemoryClient {
  const sessions = new Map<string, SessionRecord>()
  const messages = new Map<string, unknown[]>()
  let getSessionError: Error | undefined
  let nextID = 1
  const client = {
    session: {
      get: vi.fn(async ({ path }: { path: { id: string } }) => {
        if (getSessionError) throw getSessionError
        const session = sessions.get(path.id)
        if (!session) throw new Error(`[Harness] Session ${path.id} not found`)
        return { data: session }
      }),
      create: vi.fn(async ({ body }: { body: Record<string, unknown> }) => {
        const id = `ses_${nextID++}`
        const session = { id, status: { type: "idle" }, ...body }
        sessions.set(id, session)
        return { data: session }
      }),
      messages: vi.fn(async ({ path }: { path: { id: string } }) => ({ data: messages.get(path.id) ?? [] })),
      status: vi.fn(async () => ({
        data: Object.fromEntries(Array.from(sessions.entries()).map(([id, session]) => [id, { type: session.status?.type ?? "unknown" }])),
      })),
      prompt: vi.fn(async () => ({ data: {} })),
      promptAsync: vi.fn(async () => ({ status: 204 })),
      abort: vi.fn(async () => ({ data: {} })),
    },
    tui: { showToast: vi.fn() },
    _sessions: sessions,
    _messages: messages,
    _setStatus(sessionID: string, type: string) {
      const session = sessions.get(sessionID)
      if (session) session.status = { type }
    },
    _addMessage(sessionID: string, message: unknown) {
      messages.set(sessionID, [...(messages.get(sessionID) ?? []), message])
    },
    _setGetSessionError(error: Error | undefined) {
      getSessionError = error
    },
  }

  return client as InMemoryClient
}
