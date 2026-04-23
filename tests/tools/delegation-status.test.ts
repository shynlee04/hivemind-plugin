import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { Delegation } from "../../src/lib/types.js"
import { createDelegationStatusTool } from "../../src/tools/delegation-status.js"

const mockCtx = {
  sessionID: "parent-session",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "del-001",
    parentSessionId: "parent-session",
    childSessionId: "child-session",
    agent: "builder",
    status: "running",
    createdAt: Date.now(),
    safetyCeilingMs: 180_000,
    lastMessageCount: 0,
    stablePollCount: 0,
    executionMode: "headless",
    surface: "command-process",
    recoveryGuarantee: "non-resumable-after-restart",
    workingDirectory: process.cwd(),
    queueKey: "agent:builder",
    explicitCancellation: false,
    ...overrides,
  }
}

type ManagerStub = {
  getStatus: ReturnType<typeof vi.fn>
  getAllDelegations: ReturnType<typeof vi.fn>
}

function createManagerStub(delegations: Delegation[] = []): ManagerStub {
  const byId = new Map(delegations.map(d => [d.id, d]))
  return {
    getStatus: vi.fn((id: string) => byId.get(id)),
    getAllDelegations: vi.fn(() => delegations),
  }
}

describe("delegation-status tool", () => {
  let previousStateDir: string | undefined

  beforeEach(() => {
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
  })

  afterEach(() => {
    vi.restoreAllMocks()
    if (previousStateDir === undefined) {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    } else {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    }
  })

  // ---------------------------------------------------------------------------
  // Single delegation lookup
  // ---------------------------------------------------------------------------

  it("returns delegation status when given valid delegationId", async () => {
    const delegation = makeDelegation({ id: "del-001", status: "running" })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-001" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(manager.getStatus).toHaveBeenCalledWith("del-001")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("running")
    expect(data.delegationId).toBe("del-001")
  })

  it("returns error when delegationId not found", async () => {
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "nonexistent" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("not found")
  })

  it("returns result text when delegation is completed", async () => {
    const delegation = makeDelegation({
      id: "del-done",
      status: "completed",
      result: "The task was completed successfully.",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-done" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("completed")
    expect(data.result).toBe("The task was completed successfully.")
  })

  it("returns error message when delegation has error status", async () => {
    const delegation = makeDelegation({
      id: "del-err",
      status: "error",
      error: "Child session crashed",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-err" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("error")
    expect(data.error).toBe("Child session crashed")
  })

  it("returns timeout error for timed-out delegations", async () => {
    const delegation = makeDelegation({
      id: "del-timeout",
      status: "timeout",
      error: "[Harness] Delegation safety ceiling reached",
      completedAt: Date.now(),
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-timeout" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Record<string, unknown>
    expect(data.status).toBe("timeout")
    expect(data.error).toContain("safety ceiling")
  })

  it("includes createdAt and completedAt timestamps in response", async () => {
    const now = Date.now()
    const delegation = makeDelegation({
      id: "del-ts",
      status: "completed",
      result: "done",
      createdAt: now - 5000,
      completedAt: now,
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-ts" } as never, mockCtx)
    const result = parseResult(raw)

    const data = result.data as Record<string, unknown>
    expect(data.createdAt).toBe(now - 5000)
    expect(data.completedAt).toBe(now)
  })

  it("includes execution metadata fields in single-delegation responses", async () => {
    const delegation = makeDelegation({
      id: "del-runtime",
      executionMode: "pty",
      surface: "command-process",
      recoveryGuarantee: "best-effort",
      workingDirectory: "/tmp/runtime-child",
      ptySessionId: "pty-123",
      fallbackReason: "pty unsupported",
      queueKey: "provider:anthropic:model:claude-3-5-sonnet",
    })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-runtime" } as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(data.executionMode).toBe("pty")
    expect(data.surface).toBe("command-process")
    expect(data.recoveryGuarantee).toBe("best-effort")
    expect(data.workingDirectory).toBe("/tmp/runtime-child")
    expect(data.ptySessionId).toBe("pty-123")
    expect(data.fallbackReason).toBe("pty unsupported")
    expect(data.queueKey).toBe("provider:anthropic:model:claude-3-5-sonnet")
    expect(data.explicitCancellation).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // List all delegations
  // ---------------------------------------------------------------------------

  it("lists all delegations when no delegationId provided", async () => {
    const delegations = [
      makeDelegation({ id: "del-001", status: "running" }),
      makeDelegation({ id: "del-002", status: "dispatched" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(manager.getAllDelegations).toHaveBeenCalled()
    const data = result.data as Delegation[]
    expect(data).toHaveLength(2)
  })

  it("handles empty delegation list", async () => {
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(result.message).toContain("0 delegation")
    const data = result.data as Delegation[]
    expect(data).toHaveLength(0)
  })

  it("filters by status when status parameter provided", async () => {
    const delegations = [
      makeDelegation({ id: "del-001", status: "running" }),
      makeDelegation({ id: "del-002", status: "completed", result: "done" }),
      makeDelegation({ id: "del-003", status: "running" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ status: "running" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Delegation[]
    expect(data).toHaveLength(2)
    expect(data.every(d => d.status === "running")).toBe(true)
  })

  it("returns empty list when filter matches no delegations", async () => {
    const delegations = [
      makeDelegation({ id: "del-001", status: "running" }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ status: "completed" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    const data = result.data as Delegation[]
    expect(data).toHaveLength(0)
  })

  it("includes execution metadata fields in list responses", async () => {
    const delegations = [
      makeDelegation({
        id: "del-list-runtime",
        executionMode: "headless",
        surface: "command-process",
        recoveryGuarantee: "non-resumable-after-restart",
        workingDirectory: "/tmp/list-child",
        fallbackReason: "pty unavailable",
        queueKey: "provider:anthropic:model:gpt-5-mini",
      }),
    ]
    const manager = createManagerStub(delegations)
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({} as never, mockCtx)
    const result = parseResult(raw)
    const data = result.data as Array<Record<string, unknown>>

    expect(data[0]?.executionMode).toBe("headless")
    expect(data[0]?.surface).toBe("command-process")
    expect(data[0]?.recoveryGuarantee).toBe("non-resumable-after-restart")
    expect(data[0]?.workingDirectory).toBe("/tmp/list-child")
    expect(data[0]?.fallbackReason).toBe("pty unavailable")
    expect(data[0]?.queueKey).toBe("provider:anthropic:model:gpt-5-mini")
    expect(data[0]?.explicitCancellation).toBe(false)
  })

  // ---------------------------------------------------------------------------
  // Schema validation
  // ---------------------------------------------------------------------------

  it("validates delegationId format — rejects empty string", async () => {
    const manager = createManagerStub([])
    const tool = createDelegationStatusTool(manager as never)

    await expect(
      tool.execute({ delegationId: "" } as never, mockCtx),
    ).rejects.toHaveProperty("name", "ZodError")
  })

  it("accepts both delegationId and status filter together", async () => {
    // When both are provided, delegationId takes precedence (single lookup)
    const delegation = makeDelegation({ id: "del-both", status: "running" })
    const manager = createManagerStub([delegation])
    const tool = createDelegationStatusTool(manager as never)

    const raw = await tool.execute({ delegationId: "del-both", status: "completed" } as never, mockCtx)
    const result = parseResult(raw)

    // delegationId lookup takes priority — returns the delegation regardless of status filter
    expect(result.kind).toBe("success")
    expect(manager.getStatus).toHaveBeenCalledWith("del-both")
  })
})
