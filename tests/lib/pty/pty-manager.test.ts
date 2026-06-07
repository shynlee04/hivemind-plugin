import { beforeEach, describe, expect, it, vi } from "vitest"

import type { PtySpawnRequest } from "../../../src/features/background-command/pty/pty-types.js"

type ExitListener = (event: { exitCode: number; signal?: number | string }) => void
type DataListener = (data: string) => void

type MockPty = {
  pid: number
  write: ReturnType<typeof vi.fn>
  kill: ReturnType<typeof vi.fn>
  onData: ReturnType<typeof vi.fn>
  onExit: ReturnType<typeof vi.fn>
}

let currentPty: MockPty | undefined
let dataListener: DataListener | undefined
let exitListener: ExitListener | undefined
let outputOnPidRead: string | undefined

vi.mock("bun-pty", () => ({
  spawn: vi.fn((_command: string, _args: string[], _options: Record<string, unknown>) => {
    dataListener = undefined
    exitListener = undefined

    currentPty = {
      get pid() {
        const output = outputOnPidRead
        outputOnPidRead = undefined
        if (output && dataListener) {
          dataListener(output)
        }
        return 4242
      },
      write: vi.fn(),
      kill: vi.fn(),
      onData: vi.fn((listener: DataListener) => {
        dataListener = listener
        return { dispose: vi.fn() }
      }),
      onExit: vi.fn((listener: ExitListener) => {
        exitListener = listener
        return { dispose: vi.fn() }
      }),
    }

    return currentPty
  }),
}))

function emitData(chunk: string): void {
  if (!dataListener) throw new Error("PTY data listener was not registered")
  dataListener(chunk)
}

function emitExit(exitCode: number): void {
  if (!exitListener) throw new Error("PTY exit listener was not registered")
  exitListener({ exitCode })
}

describe("PtyManager", () => {
  const request: PtySpawnRequest = {
    command: "bash",
    args: ["-lc", "echo hello"],
    cwd: "/tmp/harness",
    env: { TERM: "xterm-256color" },
    cols: 100,
    rows: 30,
  }

  beforeEach(() => {
    vi.resetModules()
    dataListener = undefined
    exitListener = undefined
    currentPty = undefined
    outputOnPidRead = undefined
  })

  it("registers a PTY session record with mode, cwd, and pid", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    expect(session.mode).toBe("pty")
    expect(session.cwd).toBe(request.cwd)
    expect(session.pid).toBe(4242)
    expect(manager.getSession(session.id)).toEqual(session)
  })

  it("appends PTY output to a bounded buffer and advances incremental reads", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager({ maxBufferChars: 5 })
    const session = manager.spawn(request)

    emitData("abc")
    expect(manager.read(session.id, 0)).toEqual({
      content: "abc",
      nextOffset: 3,
      truncated: false,
    })

    emitData("def")
    expect(manager.read(session.id, 3)).toEqual({
      content: "def",
      nextOffset: 6,
      truncated: true,
    })
    expect(manager.read(session.id, 0)).toEqual({
      content: "bcdef",
      nextOffset: 6,
      truncated: true,
    })
  })

  it("captures PTY output emitted before session metadata is returned", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")
    outputOnPidRead = "early-output\r\n"

    const manager = new PtyManager()
    const session = manager.spawn(request)

    expect(manager.read(session.id, 0)).toEqual({
      content: "early-output\r\n",
      nextOffset: 14,
      truncated: false,
    })
  })

  it("terminate kills the PTY process and removes the session from the registry", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    await manager.terminate(session.id)

    expect(currentPty?.kill).toHaveBeenCalledTimes(1)
    expect(manager.getSession(session.id)).toBeUndefined()
    expect(() => manager.read(session.id, 0)).toThrow(`[Hivemind] Unknown PTY session: ${session.id}`)
  })

  it("persists exit state on the session record before explicit cleanup", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    emitExit(17)

    expect(manager.getSession(session.id)).toEqual(
      expect.objectContaining({
        id: session.id,
        exitCode: 17,
      }),
    )

    await manager.terminate(session.id)
    expect(manager.getSession(session.id)).toBeUndefined()
  })

  it("write delegates to the underlying PTY process.write()", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    manager.write(session.id, "ls -la\n")

    expect(currentPty?.write).toHaveBeenCalledWith("ls -la\n")
  })

  it("listSessions returns all active sessions with correct metadata", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()
    const session1 = manager.spawn(request)
    const session2 = manager.spawn({ ...request, command: "zsh" })

    const sessions = manager.listSessions()

    expect(sessions).toHaveLength(2)
    expect(sessions.map((s) => s.id).sort()).toEqual([session1.id, session2.id].sort())
    expect(sessions.find((s) => s.id === session1.id)).toEqual(
      expect.objectContaining({ mode: "pty", cwd: request.cwd, command: "bash" }),
    )
    expect(sessions.find((s) => s.id === session2.id)).toEqual(
      expect.objectContaining({ mode: "pty", command: "zsh" }),
    )
  })

  it("listSessions returns empty array when no sessions exist", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()

    expect(manager.listSessions()).toEqual([])
  })

  it("terminate on a non-existent session ID does not throw", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()

    await expect(manager.terminate("pty-nonexistent-id")).resolves.toBeUndefined()
  })

  it("terminate called twice on the same session is a no-op on the second call", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    await manager.terminate(session.id)
    expect(currentPty?.kill).toHaveBeenCalledTimes(1)

    // Second terminate should be a no-op — no throw, no additional kill
    await expect(manager.terminate(session.id)).resolves.toBeUndefined()
    expect(currentPty?.kill).toHaveBeenCalledTimes(1)
  })

  it("read on a terminated session throws an error", async () => {
    const { PtyManager } = await import("../../../src/features/background-command/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    await manager.terminate(session.id)

    expect(() => manager.read(session.id, 0)).toThrow(`[Hivemind] Unknown PTY session: ${session.id}`)
  })
})
