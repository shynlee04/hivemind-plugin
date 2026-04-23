import { describe, expect, it, vi } from "vitest"

import type { DelegationManager } from "../../src/lib/delegation-manager.js"
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
    const tool = createRunBackgroundCommandTool({
      delegationManager: createDelegationManagerStub() as unknown as DelegationManager,
      ptyManager: ptyManager as unknown as PtyManager,
    })

    await tool.execute({ action: "input", sessionId: "pty-shared-1", input: "y\n" } as never, mockCtx)
    await tool.execute({ action: "terminate", sessionId: "pty-shared-1" } as never, mockCtx)

    expect(ptyManager.write).toHaveBeenCalledWith("pty-shared-1", "y\n")
    expect(ptyManager.terminate).toHaveBeenCalledWith("pty-shared-1")
  })
})
