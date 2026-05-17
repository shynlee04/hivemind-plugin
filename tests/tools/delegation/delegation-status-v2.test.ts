import { describe, expect, it, vi } from "vitest"

import { createDelegationStatusTool, DelegationControlSchema } from "../../../src/tools/delegation/delegation-status.js"

const now = 1_000_000
const context = { sessionID: "ses_parent" }

function parse(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function activeRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: "dt-123",
    parentSessionId: "ses_parent",
    childSessionId: "ses_child",
    agent: "builder",
    prompt: "build it",
    status: "running",
    createdAt: now - 150_000,
    safetyCeilingMs: 300_000,
    v2: true,
    ...overrides,
  }
}

function createHarness(record = activeRecord()) {
  const manager = {
    canSessionAccessDelegation: vi.fn().mockReturnValue(true),
    getAllDelegations: vi.fn().mockReturnValue([record]),
    getStatus: vi.fn().mockReturnValue(record),
  }
  const lifecycle = {
    isTerminal: vi.fn((status: string) => ["completed", "error", "timeout"].includes(status)),
    markAborted: vi.fn().mockReturnValue({ delegationId: "dt-123", status: "error" }),
    markCancelled: vi.fn().mockReturnValue({ delegationId: "dt-123", status: "error" }),
  }
  const coordinator = {
    dispatch: vi.fn().mockResolvedValue({ delegationId: "dt-new", queueKey: "agent:builder", status: "dispatched" }),
  }
  const terminateChild = vi.fn().mockResolvedValue(undefined)
  const getChildMessageCount = vi.fn().mockResolvedValue(7)
  const getEscalationLevel = vi.fn().mockReturnValue("WARN")
  const tool = createDelegationStatusTool(manager as never, {
    coordinator,
    getChildMessageCount,
    getEscalationLevel,
    lifecycle,
    now: () => now,
    terminateChild,
  })
  return { coordinator, getChildMessageCount, getEscalationLevel, lifecycle, manager, terminateChild, tool }
}

describe("delegation-status v2 tool", () => {
  it("returns full status with progress percent and elapsed time", async () => {
    const { tool } = createHarness()

    const raw = await tool.execute({ delegationId: "dt-123" } as never, context)
    const data = parse(raw).data as Record<string, unknown>

    expect(data).toMatchObject({ delegationId: "dt-123", progressPct: 50, elapsedMs: 150_000, elapsedHuman: "2m 30s", childMessageCount: 7 })
  })

  it("lists all delegations for current session", async () => {
    const { tool } = createHarness()

    const raw = await tool.execute({ action: "list" } as never, context)
    const data = parse(raw).data as Record<string, unknown>[]

    expect(data).toHaveLength(1)
    expect(data[0]?.delegationId).toBe("dt-123")
  })

  it("aborts active delegation by marking aborted and terminating child session", async () => {
    const { lifecycle, terminateChild, tool } = createHarness()

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "abort" } } as never, context)

    expect(parse(raw).kind).toBe("success")
    expect(lifecycle.markAborted).toHaveBeenCalledWith("dt-123")
    expect(terminateChild).toHaveBeenCalledWith("ses_child")
  })

  it("cancels active delegation by marking cancelled without terminating child", async () => {
    const { lifecycle, terminateChild, tool } = createHarness()

    await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "cancel" } } as never, context)

    expect(lifecycle.markCancelled).toHaveBeenCalledWith("dt-123")
    expect(terminateChild).not.toHaveBeenCalled()
  })

  it("restarts active delegation with same agent and prompt", async () => {
    const { coordinator, tool } = createHarness()

    await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "restart" } } as never, context)

    expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({ agent: "builder", prompt: "build it" }))
  })

  it("redirects active delegation with redirectAgent and same prompt", async () => {
    const { coordinator, tool } = createHarness()

    await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "redirect", redirectAgent: "critic" } } as never, context)

    expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({ agent: "critic", prompt: "build it" }))
  })

  it("rejects redirect without redirectAgent", async () => {
    const { coordinator, tool } = createHarness()

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "redirect" } } as never, context)

    expect(parse(raw).kind).toBe("error")
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("rejects control on terminal delegation", async () => {
    const { lifecycle, tool } = createHarness(activeRecord({ status: "completed" }))

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "cancel" } } as never, context)

    expect(parse(raw).message).toContain("cannot control terminal delegation")
    expect(lifecycle.markCancelled).not.toHaveBeenCalled()
  })

  it("DelegationControlSchema validates the 4 supported actions", () => {
    for (const action of ["abort", "cancel", "restart", "redirect"] as const) {
      const input = action === "redirect" ? { action, redirectAgent: "critic" } : { action }
      expect(DelegationControlSchema.safeParse(input).success).toBe(true)
    }
    expect(DelegationControlSchema.safeParse({ action: "pause" }).success).toBe(false)
  })

  it("caps progress calculation at 99 percent", async () => {
    const { tool } = createHarness(activeRecord({ createdAt: now - 999_000, safetyCeilingMs: 300_000 }))

    const data = parse(await tool.execute({ delegationId: "dt-123" } as never, context)).data as Record<string, unknown>

    expect(data.progressPct).toBe(99)
  })

  it("formats elapsed time as human-readable minutes and seconds", async () => {
    const { tool } = createHarness(activeRecord({ createdAt: now - 61_000 }))

    const data = parse(await tool.execute({ delegationId: "dt-123" } as never, context)).data as Record<string, unknown>

    expect(data.elapsedHuman).toBe("1m 1s")
  })
})
