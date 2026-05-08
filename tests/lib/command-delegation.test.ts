import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { spawnHeadlessMock, getLastHeadlessHandlers, clearHandlers } = vi.hoisted(() => {
  const allHandlers: Array<Record<string, Function>> = []

  const createMockChildProcess = () => {
    const handlers: Record<string, Function> = {}
    allHandlers.push(handlers)
    return {
      stdout: {
        on: vi.fn((event: string, handler: Function) => {
          handlers[`stdout:${event}`] = handler
        }),
      },
      stderr: {
        on: vi.fn((event: string, handler: Function) => {
          handlers[`stderr:${event}`] = handler
        }),
      },
      on: vi.fn((event: string, handler: Function) => {
        handlers[event] = handler
      }),
    }
  }

  return {
    spawnHeadlessMock: vi.fn(createMockChildProcess),
    getLastHeadlessHandlers: () => allHandlers[allHandlers.length - 1],
    clearHandlers: () => { allHandlers.length = 0 },
  }
})

vi.mock("node:child_process", () => ({
  spawn: spawnHeadlessMock,
}))

import { CommandDelegationHandler } from "../../src/lib/command-delegation.js"
import type { Delegation, DelegationResult } from "../../src/lib/types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MockPtyManager = {
  isSupported: ReturnType<typeof vi.fn>
  spawn: ReturnType<typeof vi.fn>
  getSession: ReturnType<typeof vi.fn>
  read: ReturnType<typeof vi.fn>
  terminate: ReturnType<typeof vi.fn>
}

type MockCallbacks = {
  getDelegation: ReturnType<typeof vi.fn>
  registerDelegation: ReturnType<typeof vi.fn>
  persistAllDelegations: ReturnType<typeof vi.fn>
  buildResult: ReturnType<typeof vi.fn>
  cleanupTracking: ReturnType<typeof vi.fn>
  onTerminal: ReturnType<typeof vi.fn>
}

type CommandParams = {
  parentSessionId: string
  command: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  title?: string
  queueContext?: {
    provider?: string
    model?: string
    agent?: string
    category?: string
  }
  safetyCeilingMs?: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockPtyManager(): MockPtyManager {
  return {
    isSupported: vi.fn().mockReturnValue(true),
    spawn: vi.fn().mockReturnValue({
      id: "pty-session-1",
      mode: "pty" as const,
      cwd: "/tmp",
      startedAt: Date.now(),
      pid: 12345,
    }),
    getSession: vi.fn().mockReturnValue(undefined),
    read: vi.fn().mockReturnValue({ content: "output text", nextOffset: 11, truncated: false }),
    terminate: vi.fn().mockResolvedValue(undefined),
  }
}

function createMockCallbacks(): MockCallbacks {
  const store = new Map<string, Delegation>()

  return {
    getDelegation: vi.fn((id: string) => store.get(id)),
    registerDelegation: vi.fn((d: Delegation) => { store.set(d.id, d) }),
    persistAllDelegations: vi.fn(),
    buildResult: vi.fn((d: Delegation): DelegationResult => ({
      status: d.status,
      delegationId: d.id,
      executionMode: d.executionMode,
      workingDirectory: d.workingDirectory,
      ptySessionId: d.ptySessionId,
      fallbackReason: d.fallbackReason,
      queueKey: d.queueKey,
    })),
    cleanupTracking: vi.fn(),
    onTerminal: vi.fn(),
  }
}

function createHandler(ptyManager: MockPtyManager | null, callbacks: MockCallbacks): CommandDelegationHandler {
  return new CommandDelegationHandler(ptyManager, callbacks)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CommandDelegationHandler", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    spawnHeadlessMock.mockClear()
    clearHandlers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // R-PTY-01: Command delegations route through PTY as primary path
  // -------------------------------------------------------------------------

  describe("R-PTY-01: PTY primary routing", () => {
    it("routes command delegation through PTY when PTY is available", async () => {
      const pty = createMockPtyManager()
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-pty",
          command: "echo",
          args: ["hello"],
          cwd: "/tmp",
        },
        "agent:builder",
        1,
      )

      expect(pty.spawn).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "echo",
          args: ["hello"],
          cwd: "/tmp",
        }),
      )
      expect(result.executionMode).toBe("pty")
      expect(result.ptySessionId).toBe("pty-session-1")
    })

    it("falls back to headless when PTY manager is null", async () => {
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-no-pty",
          command: "echo",
          args: ["hello"],
          cwd: "/tmp",
        },
        "agent:builder",
        1,
      )

      expect(result.executionMode).toBe("headless")
      expect(result.fallbackReason).toBeTruthy()
      expect(result.ptySessionId).toBeUndefined()
    })

    it("falls back to headless when PTY isSupported returns false", async () => {
      const pty = createMockPtyManager()
      pty.isSupported.mockReturnValue(false)
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-pty-unsupported",
          command: "echo",
          args: ["hello"],
        },
        "agent:builder",
        1,
      )

      expect(result.executionMode).toBe("headless")
      expect(result.fallbackReason).toBeTruthy()
    })

    it("falls back to headless when PTY spawn throws", async () => {
      const pty = createMockPtyManager()
      pty.spawn.mockImplementation(() => { throw new Error("PTY spawn error") })
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-pty-spawn-fail",
          command: "echo",
          args: ["hello"],
        },
        "agent:builder",
        1,
      )

      expect(result.executionMode).toBe("headless")
      expect(result.fallbackReason).toContain("PTY spawn error")
    })
  })

  describe("headless env isolation", () => {
    const secretKey = "HIVEMIND_TEST_SECRET_TOKEN"
    const originalSecret = process.env[secretKey]
    const originalPath = process.env.PATH

    afterEach(() => {
      if (originalSecret === undefined) {
        delete process.env[secretKey]
      } else {
        process.env[secretKey] = originalSecret
      }
      if (originalPath === undefined) {
        delete process.env.PATH
      } else {
        process.env.PATH = originalPath
      }
    })

    it("does not pass parent sentinel secrets to headless spawn env", async () => {
      process.env[secretKey] = "sentinel-secret-value"
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-headless-secret",
          command: "echo",
          args: ["hello"],
        },
        "agent:builder",
        1,
      )

      expect(spawnHeadlessMock).toHaveBeenCalledOnce()
      const spawnOptions = spawnHeadlessMock.mock.calls[0]?.[2]
      expect(spawnOptions?.env).not.toHaveProperty(secretKey)
    })

    it("passes explicit caller env values to headless spawn env", async () => {
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-headless-explicit",
          command: "echo",
          env: { EXPLICIT_ALLOWED: "yes" },
        },
        "agent:builder",
        1,
      )

      const spawnOptions = spawnHeadlessMock.mock.calls[0]?.[2]
      expect(spawnOptions?.env).toMatchObject({ EXPLICIT_ALLOWED: "yes" })
    })

    it("preserves PATH for headless command lookup", async () => {
      process.env.PATH = "/usr/local/bin:/usr/bin"
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-headless-path",
          command: "echo",
        },
        "agent:builder",
        1,
      )

      const spawnOptions = spawnHeadlessMock.mock.calls[0]?.[2]
      expect(spawnOptions?.env).toMatchObject({ PATH: "/usr/local/bin:/usr/bin" })
    })
  })

  // -------------------------------------------------------------------------
  // R-PTY-02: PTY output captured as delegation result
  // -------------------------------------------------------------------------

  describe("R-PTY-02: PTY output capture", () => {
    it("captures PTY output as delegation result text", async () => {
      const pty = createMockPtyManager()
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-output",
          command: "echo",
          args: ["captured output"],
        },
        "agent:builder",
        1,
      )

      expect(result.status).toBe("running")
      // Verify the delegation was registered with ptySessionId
      expect(callbacks.registerDelegation).toHaveBeenCalledWith(
        expect.objectContaining({
          executionMode: "pty",
          ptySessionId: "pty-session-1",
        }),
        false,
      )
    })
  })

  // -------------------------------------------------------------------------
  // R-PTY-03: PTY lifecycle → delegation status transitions
  // -------------------------------------------------------------------------

  describe("R-PTY-03: PTY lifecycle status transitions", () => {
    it("starts at running status when PTY spawns successfully", async () => {
      const pty = createMockPtyManager()
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-lifecycle",
          command: "echo",
          args: ["lifecycle"],
        },
        "agent:builder",
        1,
      )

      expect(result.status).toBe("running")
    })

    it("transitions to completed when PTY session exits with code 0", async () => {
      const pty = createMockPtyManager()
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-complete",
          command: "echo",
          args: ["done"],
        },
        "agent:builder",
        1,
      )

      // Simulate PTY session exiting with code 0 on next poll
      pty.getSession.mockReturnValue({
        id: "pty-session-1",
        mode: "pty",
        cwd: "/tmp",
        startedAt: Date.now(),
        exitCode: 0,
      })
      pty.read.mockReturnValue({ content: "command output", nextOffset: 14, truncated: false })

      // Advance timers to trigger poll
      await vi.advanceTimersByTimeAsync(500)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        expect.any(String),
        "completed",
        undefined,
        expect.objectContaining({
          terminalKind: "completed",
          explicitCancellation: false,
        }),
      )
    })

    it("polls PTY session until exitCode is available", async () => {
      const pty = createMockPtyManager()
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-poll",
          command: "long-task",
        },
        "agent:builder",
        1,
      )

      // First poll: still running (no exitCode)
      pty.getSession.mockReturnValue({
        id: "pty-session-1",
        mode: "pty",
        cwd: "/tmp",
        startedAt: Date.now(),
      })
      await vi.advanceTimersByTimeAsync(250)

      // Should NOT have finalized yet — no exitCode
      expect(callbacks.onTerminal).not.toHaveBeenCalled()

      // Second poll: now exited with code 0
      pty.getSession.mockReturnValue({
        id: "pty-session-1",
        mode: "pty",
        cwd: "/tmp",
        startedAt: Date.now(),
        exitCode: 0,
      })
      pty.read.mockReturnValue({ content: "result", nextOffset: 6, truncated: false })
      await vi.advanceTimersByTimeAsync(250)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        expect.any(String),
        "completed",
        undefined,
        expect.objectContaining({
          terminalKind: "completed",
          explicitCancellation: false,
        }),
      )
    })
  })

  // -------------------------------------------------------------------------
  // R-PTY-05: PTY failures propagate exit code + stderr
  // -------------------------------------------------------------------------

  describe("R-PTY-05: PTY failure propagation", () => {
    it("transitions to error with exit code when PTY exits non-zero", async () => {
      const pty = createMockPtyManager()
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-fail",
          command: "false",
        },
        "agent:builder",
        1,
      )

      // Simulate PTY session exiting with non-zero code
      pty.getSession.mockReturnValue({
        id: "pty-session-1",
        mode: "pty",
        cwd: "/tmp",
        startedAt: Date.now(),
        exitCode: 1,
      })
      pty.read.mockReturnValue({ content: "error output", nextOffset: 12, truncated: false })

      await vi.advanceTimersByTimeAsync(500)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        expect.any(String),
        "error",
        expect.stringContaining("exited with code 1"),
        expect.objectContaining({
          terminalKind: "error",
          explicitCancellation: false,
        }),
      )
    })

    it("transitions to error when PTY session disappears", async () => {
      const pty = createMockPtyManager()
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-disappear",
          command: "volatile",
        },
        "agent:builder",
        1,
      )

      // Session disappears — getSession returns undefined
      pty.getSession.mockReturnValue(undefined)

      await vi.advanceTimersByTimeAsync(500)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        expect.any(String),
        "error",
        expect.stringContaining("PTY session disappeared"),
        expect.objectContaining({
          terminalKind: "error",
          explicitCancellation: false,
        }),
      )
    })
  })

  // -------------------------------------------------------------------------
  // Timer cleanup
  // -------------------------------------------------------------------------

  describe("timer cleanup", () => {
    it("clearTimers removes the poll timer for a delegation", async () => {
      const pty = createMockPtyManager()
      pty.getSession.mockReturnValue({
        id: "pty-session-1",
        mode: "pty",
        cwd: "/tmp",
        startedAt: Date.now(),
      })
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-clear",
          command: "echo",
        },
        "agent:builder",
        1,
      )

      // Clear timers before the poll fires
      handler.clearTimers(result.delegationId)

      // Advance timers — no poll should fire
      await vi.advanceTimersByTimeAsync(500)

      // onTerminal should NOT have been called since we cleared the timer
      expect(callbacks.onTerminal).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------------------------
  // R-PTY-RECOVERY: PTY recovery is honest about non-resumability
  //
  // Audit 2026-04-30 (delegation-async-pty-lifecycle-audit) §F1: the previous
  // path emitted `terminalKind: "error"` with message
  // "PTY session not found on recovery", which is misleading — PTY OS
  // processes cannot survive a harness restart at all. The amended
  // requirement R-PTY-03-AMENDED in Phase 16.2.1 says recovery must
  // surface `terminalKind: "non-resumable-after-restart"` so observers
  // can distinguish "we crashed" from "this kind of process is just not
  // resumable, full stop".
  // -------------------------------------------------------------------------

  describe("R-PTY-RECOVERY: truthful non-resumable terminal state on missing PTY session", () => {
    it("emits terminalKind=non-resumable-after-restart when the PTY session is absent on recovery", () => {
      const pty = createMockPtyManager()
      pty.getSession.mockReturnValue(undefined)
      const callbacks = createMockCallbacks()
      const handler = createHandler(pty, callbacks)

      const delegation: Delegation = {
        id: "deleg-recover-1",
        parentSessionId: "ses-parent-recover",
        childSessionId: "pty:pty-session-gone",
        agent: "command-runner",
        status: "running",
        createdAt: Date.now(),
        lastMessageCount: 0,
        stablePollCount: 0,
        nestingDepth: 1,
        executionMode: "pty",
        workingDirectory: "/tmp",
        ptySessionId: "pty-session-gone",
        queueKey: "category:command",
      }

      handler.recoverPtyDelegation(delegation)

      expect(callbacks.onTerminal).toHaveBeenCalledTimes(1)
      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        "deleg-recover-1",
        "error",
        expect.stringContaining("non-resumable-after-restart"),
        expect.objectContaining({
          terminalKind: "non-resumable-after-restart",
        }),
      )
    })

    it("emits terminalKind=non-resumable-after-restart when no ptyManager is configured", () => {
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      const delegation: Delegation = {
        id: "deleg-recover-2",
        parentSessionId: "ses-parent-recover-no-pty",
        childSessionId: "pty:pty-session-vanished",
        agent: "command-runner",
        status: "running",
        createdAt: Date.now(),
        lastMessageCount: 0,
        stablePollCount: 0,
        nestingDepth: 1,
        executionMode: "pty",
        workingDirectory: "/tmp",
        ptySessionId: "pty-session-vanished",
        queueKey: "category:command",
      }

      handler.recoverPtyDelegation(delegation)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        "deleg-recover-2",
        "error",
        expect.stringContaining("non-resumable-after-restart"),
        expect.objectContaining({
          terminalKind: "non-resumable-after-restart",
        }),
      )
    })
  })

  // -------------------------------------------------------------------------
  // Headless child process event flows
  // -------------------------------------------------------------------------

  describe("headless child process event flows", () => {
    it("captures headless process stdout and stderr data in delegation result", async () => {
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-headless-data",
          command: "echo",
          args: ["hello"],
        },
        "agent:builder",
        1,
      )

      const handlers = getLastHeadlessHandlers()
      handlers["stdout:data"](Buffer.from("hello "))
      handlers["stderr:data"](Buffer.from("world"))
      handlers["exit"](0, null)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        result.delegationId,
        "completed",
        undefined,
        expect.objectContaining({
          terminalKind: "completed",
          explicitCancellation: false,
        }),
      )

      const delegation = callbacks.getDelegation(result.delegationId)
      expect(delegation?.result).toContain("hello world")
    })

    it("finalizes headless delegation with error status on process error event", async () => {
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-headless-error",
          command: "nonexistent-command",
        },
        "agent:builder",
        1,
      )

      const handlers = getLastHeadlessHandlers()
      handlers["error"](new Error("spawn failed"))

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        result.delegationId,
        "error",
        expect.stringContaining("spawn failed"),
        expect.objectContaining({
          terminalKind: "error",
          explicitCancellation: false,
        }),
      )
    })

    it("finalizes headless delegation with exit code on process exit event", async () => {
      const callbacks = createMockCallbacks()
      const handler = createHandler(null, callbacks)

      const result = await handler.dispatchCommand(
        {
          parentSessionId: "ses-parent-headless-exit",
          command: "false",
        },
        "agent:builder",
        1,
      )

      const handlers = getLastHeadlessHandlers()
      handlers["exit"](1, null)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        result.delegationId,
        "error",
        expect.stringContaining("exited with code 1"),
        expect.objectContaining({
          terminalKind: "error",
          explicitCancellation: false,
        }),
      )
    })
  })
})
