import { describe, expect, it, vi } from "vitest"

import { DelegationManager } from "../../src/lib/delegation-manager.js"
import type { PtyManager } from "../../src/lib/pty/pty-manager.js"
import { createRunBackgroundCommandTool } from "../../src/tools/run-background-command.js"

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

  it("returns incremental output for a shared PTY session", async () => {
    const tool = createRunBackgroundCommandTool({
      delegationManager: createDelegationManagerStub() as unknown as DelegationManager,
      ptyManager: createPtyManagerStub() as unknown as PtyManager,
    })

    const raw = await tool.execute({ action: "output", sessionId: "pty-shared-1", offset: 0 } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(result.kind).toBe("success")
    expect(data.content).toBe("hello\n")
    expect(data.nextOffset).toBe(6)
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
})
