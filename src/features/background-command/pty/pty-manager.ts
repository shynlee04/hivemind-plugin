import { spawn } from "bun-pty"
import type { IDisposable, IExitEvent, IPty, IPtyForkOptions } from "bun-pty"

import { createPtyBuffer } from "./pty-buffer.js"
import type { PtyReadResult, PtySessionRecord, PtySpawnRequest } from "./pty-types.js"

type PtySessionState = {
  record: PtySessionRecord
  buffer: ReturnType<typeof createPtyBuffer>
  process: IPty
  dataSubscription: IDisposable
  exitSubscription: IDisposable
}

type PtyManagerOptions = {
  maxBufferChars?: number
}

function extractExitSignal(event: IExitEvent): string | undefined {
  const candidates = [
    (event as IExitEvent & { signal?: unknown }).signal,
    (event as IExitEvent & { signalCode?: unknown }).signalCode,
    (event as IExitEvent & { signalName?: unknown }).signalName,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate
    }
    if (typeof candidate === "number" && candidate > 0) {
      return `SIG${candidate}`
    }
  }

  return undefined
}

export class PtyManager {
  private readonly sessions = new Map<string, PtySessionState>()
  private readonly maxBufferChars: number

  constructor(options: PtyManagerOptions = {}) {
    this.maxBufferChars = options.maxBufferChars ?? 20000
  }

  isSupported(): boolean {
    return typeof spawn === "function" && "Bun" in globalThis
  }

  spawn(request: PtySpawnRequest): PtySessionRecord {
    const sessionId = `pty-${crypto.randomUUID()}`
    const buffer = createPtyBuffer(this.maxBufferChars)

    const process = spawn(request.command, request.args, this.buildOptions(request))

    const dataSubscription = process.onData((chunk: string) => {
      buffer.append(chunk)
    })

    const record: PtySessionRecord = {
      id: sessionId,
      mode: "pty",
      cwd: request.cwd,
      command: request.command,
      args: [...request.args],
      source: request.metadata?.source,
      title: request.metadata?.title,
      parentSessionId: request.metadata?.parentSessionId,
      delegationId: request.metadata?.delegationId,
      startedAt: Date.now(),
      pid: process.pid,
    }

    const exitSubscription = process.onExit((event: IExitEvent) => {
      const activeSession = this.sessions.get(sessionId)
      if (!activeSession) {
        return
      }

      activeSession.record.exitCode = event.exitCode
      activeSession.record.exitSignal = extractExitSignal(event)
    })

    this.sessions.set(sessionId, {
      record,
      buffer,
      process,
      dataSubscription,
      exitSubscription,
    })

    return { ...record }
  }

  write(sessionId: string, input: string): void {
    const session = this.requireSession(sessionId)
    session.process.write(input)
  }

  read(sessionId: string, offset = 0): PtyReadResult {
    const session = this.requireSession(sessionId)
    return session.buffer.readSince(offset)
  }

  async terminate(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return
    }

    session.record.explicitCancellation = true
    session.dataSubscription.dispose()
    session.exitSubscription.dispose()
    session.process.kill()
    this.sessions.delete(sessionId)
  }

  getSession(sessionId: string): PtySessionRecord | undefined {
    const session = this.sessions.get(sessionId)
    return session ? { ...session.record } : undefined
  }

  listSessions(): PtySessionRecord[] {
    return Array.from(this.sessions.values()).map((session) => ({ ...session.record }))
  }

  private requireSession(sessionId: string): PtySessionState {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`[Hivemind] Unknown PTY session: ${sessionId}`)
    }

    return session
  }

  private buildOptions(request: PtySpawnRequest): IPtyForkOptions {
    return {
      name: request.env.TERM ?? "xterm-256color",
      cols: request.cols ?? 80,
      rows: request.rows ?? 24,
      cwd: request.cwd,
      env: request.env,
    }
  }
}
