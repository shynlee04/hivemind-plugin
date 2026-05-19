import { describe, expect, it, vi } from "vitest"

import { DelegationManager } from "../../src/coordination/delegation/manager.js"
import type { PtyManager } from "../../src/features/background-command/pty/pty-manager.js"
import { createRunBackgroundCommandTool } from "../../src/tools/hivemind/run-background-command.js"
import type { Delegation } from "../../src/shared/types.js"

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

const mockCtx = {
  sessionID: "ses-parent-tool",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

function createPtyManagerStub() {
  return {
    read: vi.fn().mockReturnValue({ content: "hello\n", nextOffset: 6, truncated: false }),
    write: vi.fn(),
    terminate: vi.fn().mockResolvedValue(undefined),
    listSessions: vi.fn().mockReturnValue([
      {
        id: "pty-shared-1",
        mode: "pty",
        cwd: "/tmp/shared",
        command: "echo",
        args: ["hello"],
        source: "delegation",
        startedAt: Date.now(),
      },
    ]),
  }
}

function createDelegationManagerStub() {
  const ownedDelegation: Delegation = {
    id: "delegation-command-1",
    parentSessionId: "ses-parent-tool",
    childSessionId: "pty:pty-shared-1",
    agent: "command-runner",
    status: "running",
    createdAt: Date.now(),
    lastMessageCount: 0,
    stablePollCount: 0,
    nestingDepth: 1,
    executionMode: "pty",
    workingDirectory: "/tmp/shared",
    ptySessionId: "pty-shared-1",
    queueKey: "agent:command-runner",
  }
  const foreignDelegation: Delegation = {
    ...ownedDelegation,
    id: "delegation-foreign-command",
    parentSessionId: "ses-foreign-parent",
    childSessionId: "pty:pty-foreign-1",
    ptySessionId: "pty-foreign-1",
  }
  return {
    dispatchCommand: vi.fn().mockResolvedValue({
      status: "running",
      delegationId: "delegation-command-1",
      executionMode: "pty",
      surface: "command-process",
      recoveryGuarantee: "best-effort",
      workingDirectory: "/tmp/shared",
      ptySessionId: "pty-shared-1",
      queueKey: "category:command",
      explicitCancellation: false,
    }),
    markCommandCancellationForPtySession: vi.fn().mockResolvedValue({
      status: "running",
      delegationId: "delegation-command-1",
      executionMode: "pty",
      surface: "command-process",
      recoveryGuarantee: "best-effort",
      workingDirectory: "/tmp/shared",
      ptySessionId: "pty-shared-1",
      queueKey: "category:command",
      terminalKind: "cancelled",
      explicitCancellation: true,
    }),
    getDelegationForPtySession: vi.fn((ptySessionId: string) => {
      if (ptySessionId === "pty-shared-1") return ownedDelegation
      if (ptySessionId === "pty-foreign-1") return foreignDelegation
      return undefined
    }),
    canSessionAccessDelegation: vi.fn((callerSessionId: string | undefined, delegation: Delegation | undefined) => (
      Boolean(callerSessionId && delegation && delegation.parentSessionId === callerSessionId)
    )),
  }
}

describe("run-background-command tool", () => {
  it("routes run through DelegationManager.dispatchCommand and returns shared session metadata", async () => {
    const delegationManager = createDelegationManagerStub()
    const ptyManager = createPtyManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    const raw = await tool.execute({ action: "run", command: "echo", args: ["hello"] } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(delegationManager.dispatchCommand).toHaveBeenCalledWith(expect.objectContaining({
      parentSessionId: "ses-parent-tool",
      command: "echo",
      args: ["hello"],
    }))
    expect(result.kind).toBe("success")
    expect(data.executionMode).toBe("pty")
    expect(data.surface).toBe("command-process")
    expect(data.recoveryGuarantee).toBe("best-effort")
    expect(data.ptySessionId).toBe("pty-shared-1")
    expect(data.explicitCancellation).toBe(false)
  })

  it("returns actionable guidance for unsupported start and read actions", async () => {
    const delegationManager = createDelegationManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: createPtyManagerStub() as unknown as PtyManager,
    })

    const startResult = parseResult(await tool.execute({ action: "start", command: "echo" } as never, mockCtx))
    const readResult = parseResult(await tool.execute({ action: "read", sessionId: "pty-shared-1" } as never, mockCtx))

    expect(startResult.kind).toBe("error")
    expect(startResult.message).toContain("Use run instead of start")
    expect(readResult.kind).toBe("error")
    expect(readResult.message).toContain("output instead of read")
    expect(delegationManager.dispatchCommand).not.toHaveBeenCalled()
  })

  it("rejects accidental shell strings before dispatch", async () => {
    const delegationManager = createDelegationManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: createPtyManagerStub() as unknown as PtyManager,
    })

    const shellResult = parseResult(await tool.execute({ action: "run", command: "echo one && echo two" } as never, mockCtx))
    const bashStringResult = parseResult(await tool.execute({ action: "run", command: "bash -c \"echo one\"" } as never, mockCtx))

    expect(shellResult.kind).toBe("error")
    expect(shellResult.message).toContain("expects an executable plus args")
    expect(bashStringResult.kind).toBe("error")
    expect(bashStringResult.message).toContain('command: "bash"')
    expect(delegationManager.dispatchCommand).not.toHaveBeenCalled()
  })

  it("routes run through DelegationManager.dispatchCommand when PTY manager is unavailable", async () => {
    const delegationManager = createDelegationManagerStub()
    delegationManager.dispatchCommand.mockResolvedValue({
      status: "running",
      delegationId: "delegation-headless-1",
      executionMode: "headless",
      surface: "command-process",
      recoveryGuarantee: "non-resumable-after-restart",
      workingDirectory: "/tmp/shared",
      fallbackReason: "[Harness] PTY runtime unavailable in current environment",
      queueKey: "category:command",
      explicitCancellation: false,
    })
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: null,
    })

    const raw = await tool.execute({ action: "run", command: "echo", args: ["hello"] } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(result.kind).toBe("success")
    expect(delegationManager.dispatchCommand).toHaveBeenCalledWith(expect.objectContaining({ command: "echo" }))
    expect(data.executionMode).toBe("headless")
  })

  it("returns explicit PTY unavailable errors for interactive actions when no PTY manager exists", async () => {
    const delegationManager = createDelegationManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: null,
    })

    const raw = await tool.execute({ action: "output", sessionId: "pty-missing" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("[Harness] PTY not available")
    expect(delegationManager.dispatchCommand).not.toHaveBeenCalled()
  })

  it("returns incremental output for a shared PTY session", async () => {
    const ptyManager = createPtyManagerStub()
    ptyManager.read.mockReturnValue({ content: "Line 1\nLine 2\n", nextOffset: 14, truncated: false })
    const tool = createRunBackgroundCommandTool({
      delegationManager: createDelegationManagerStub() as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    const raw = await tool.execute({ action: "output", sessionId: "pty-shared-1", offset: 0 } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(result.kind).toBe("success")
    expect(data.content).toContain("Line 1")
    expect(data.nextOffset).toBe(14)
  })

  it("lists sessions from the canonical shared PTY manager", async () => {
    const tool = createRunBackgroundCommandTool({
      delegationManager: createDelegationManagerStub() as unknown as DelegationManager,
      ptyManager: createPtyManagerStub() as unknown as PtyManager,
    })

    const raw = await tool.execute({ action: "list" } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Array<Record<string, unknown>>

    expect(result.kind).toBe("success")
    expect(data[0]?.id).toBe("pty-shared-1")
  })

  it("denies output for foreign PTY sessions before reading", async () => {
    const ptyManager = createPtyManagerStub()
    const delegationManager = createDelegationManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    const raw = await tool.execute({ action: "output", sessionId: "pty-foreign-1", offset: 0 } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("[Harness] Access denied for PTY session")
    expect(ptyManager.read).not.toHaveBeenCalled()
  })

  it("denies input and terminate for foreign PTY sessions before manager mutation", async () => {
    const ptyManager = createPtyManagerStub()
    const delegationManager = createDelegationManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    const inputRaw = await tool.execute({ action: "input", sessionId: "pty-foreign-1", input: "x" } as never, mockCtx)
    const terminateRaw = await tool.execute({ action: "terminate", sessionId: "pty-foreign-1" } as never, mockCtx)

    expect(parseResult(inputRaw).kind).toBe("error")
    expect(parseResult(terminateRaw).kind).toBe("error")
    expect(ptyManager.write).not.toHaveBeenCalled()
    expect(ptyManager.terminate).not.toHaveBeenCalled()
    expect(delegationManager.markCommandCancellationForPtySession).not.toHaveBeenCalled()
  })

  it("denies non-run PTY operations when caller session ID is missing", async () => {
    const ptyManager = createPtyManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: createDelegationManagerStub() as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })
    const missingContext = { ...mockCtx, sessionID: undefined }

    const raw = await tool.execute({ action: "output", sessionId: "pty-shared-1", offset: 0 } as never, missingContext)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("[Harness] Missing caller session ID for run-background-command output")
    expect(ptyManager.read).not.toHaveBeenCalled()
  })

  it("filters list output to caller-owned PTY sessions", async () => {
    const ptyManager = createPtyManagerStub()
    ptyManager.listSessions.mockReturnValue([
      { id: "pty-shared-1", mode: "pty", cwd: "/tmp/shared", startedAt: Date.now() },
      { id: "pty-foreign-1", mode: "pty", cwd: "/tmp/foreign", startedAt: Date.now() },
    ])
    const tool = createRunBackgroundCommandTool({
      delegationManager: createDelegationManagerStub() as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    const raw = await tool.execute({ action: "list" } as never, mockCtx)
    const result = parseResult(raw)

    expect((result.data as Array<{ id: string }>).map((session) => session.id)).toEqual(["pty-shared-1"])
  })

  it("sends interactive input and terminates through the shared PTY manager", async () => {
    const ptyManager = createPtyManagerStub()
    const delegationManager = createDelegationManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    await tool.execute({ action: "input", sessionId: "pty-shared-1", input: "y\n" } as never, mockCtx)
    const terminateRaw = await tool.execute({ action: "terminate", sessionId: "pty-shared-1" } as never, mockCtx)
    const terminateResult = parseResult(terminateRaw)
    const terminateData = terminateResult.data as Record<string, unknown>

    expect(ptyManager.write).toHaveBeenCalledWith("pty-shared-1", "y\n")
    expect(delegationManager.markCommandCancellationForPtySession).toHaveBeenCalledWith("pty-shared-1")
    expect(ptyManager.terminate).toHaveBeenCalledWith("pty-shared-1")
    expect(
      delegationManager.markCommandCancellationForPtySession.mock.invocationCallOrder[0],
    ).toBeLessThan(ptyManager.terminate.mock.invocationCallOrder[0])
    expect(terminateResult.kind).toBe("success")
    expect(terminateData.explicitCancellation).toBe(true)
    expect(terminateData.terminalKind).toBe("cancelled")
  })

  it("preserves cancellation wording when terminate deletes the PTY session before poll finalization", async () => {
    vi.useFakeTimers()
    try {
      let sessionExists = true
      const client = {
        session: {
          prompt: vi.fn().mockResolvedValue({}),
        },
      }
      const ptyManager = {
        isSupported: vi.fn().mockReturnValue(true),
        spawn: vi.fn().mockReturnValue({
          id: "pty-delete-on-terminate",
          mode: "pty" as const,
          cwd: "/tmp/shared",
          command: "sleep",
          args: ["10"],
          source: "delegation" as const,
          startedAt: Date.now(),
        }),
        getSession: vi.fn(() => sessionExists
          ? {
              id: "pty-delete-on-terminate",
              mode: "pty" as const,
              cwd: "/tmp/shared",
              command: "sleep",
              args: ["10"],
              source: "delegation" as const,
              startedAt: Date.now(),
            }
          : undefined),
        read: vi.fn().mockReturnValue({ content: "", nextOffset: 0, truncated: false }),
        write: vi.fn(),
        terminate: vi.fn().mockImplementation(() => {
          sessionExists = false
          return Promise.resolve()
        }),
        listSessions: vi.fn().mockReturnValue([]),
      }
      const delegationManager = new DelegationManager(
        client as never,
        { ptyManager: ptyManager as unknown as PtyManager },
      )
      const tool = createRunBackgroundCommandTool({
        delegationManager,
        ptyManager: ptyManager as unknown as PtyManager,
      })

      const runRaw = await tool.execute({ action: "run", command: "sleep", args: ["10"] } as never, mockCtx)
      const runResult = parseResult(runRaw)
      const runData = runResult.data as Record<string, unknown>
      const delegationId = runData.delegationId as string

      const terminateRaw = await tool.execute({ action: "terminate", sessionId: "pty-delete-on-terminate" } as never, mockCtx)
      const terminateResult = parseResult(terminateRaw)
      const terminateData = terminateResult.data as Record<string, unknown>

      expect(delegationManager.markCommandCancellationForPtySession("pty-delete-on-terminate")).toEqual(
        expect.objectContaining({
          terminalKind: "cancelled",
          explicitCancellation: true,
        }),
      )
      expect(terminateResult.kind).toBe("success")
      expect(terminateData.terminalKind).toBe("cancelled")
      expect(terminateData.explicitCancellation).toBe(true)

      await vi.advanceTimersByTimeAsync(250)

      const finalDelegation = delegationManager.getStatus(delegationId)
      expect(finalDelegation?.error).toBe("[Harness] Command cancelled by user")
      expect(finalDelegation?.error).not.toContain("PTY session disappeared before completion")
      expect(finalDelegation?.terminalKind).toBe("cancelled")
      expect(finalDelegation?.explicitCancellation).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("run action dispatches even when abort signal is already aborted", async () => {
    const delegationManager = createDelegationManagerStub()
    const ptyManager = createPtyManagerStub()
    const tool = createRunBackgroundCommandTool({
      delegationManager: delegationManager as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    const abortedController = new AbortController()
    abortedController.abort()
    const abortedCtx = { ...mockCtx, abort: abortedController.signal }

    const raw = await tool.execute({ action: "run", command: "echo", args: ["hello"] } as never, abortedCtx)
    const result = parseResult(raw)

    // Current behavior: abort signal does not block dispatch.
    // Abort propagation to the delegation manager is a future enhancement —
    // the tool currently ignores context.abort entirely.
    expect(result.kind).toBe("success")
    expect(delegationManager.dispatchCommand).toHaveBeenCalled()
  })
})
