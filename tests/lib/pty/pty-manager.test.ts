import { beforeEach, describe, expect, it, vi } from "vitest"

import type { PtySpawnRequest } from "../../../src/lib/pty/pty-types.js"

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
    const { PtyManager } = await import("../../../src/lib/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    expect(session.mode).toBe("pty")
    expect(session.cwd).toBe(request.cwd)
    expect(session.pid).toBe(4242)
    expect(manager.getSession(session.id)).toEqual(session)
  })

  it("appends PTY output to a bounded buffer and advances incremental reads", async () => {
    const { PtyManager } = await import("../../../src/lib/pty/pty-manager.js")

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
    const { PtyManager } = await import("../../../src/lib/pty/pty-manager.js")
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
    const { PtyManager } = await import("../../../src/lib/pty/pty-manager.js")

    const manager = new PtyManager()
    const session = manager.spawn(request)

    await manager.terminate(session.id)

    expect(currentPty?.kill).toHaveBeenCalledTimes(1)
    expect(manager.getSession(session.id)).toBeUndefined()
    expect(() => manager.read(session.id, 0)).toThrow(`[Harness] Unknown PTY session: ${session.id}`)
  })

  it("persists exit state on the session record before explicit cleanup", async () => {
    const { PtyManager } = await import("../../../src/lib/pty/pty-manager.js")

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
})
