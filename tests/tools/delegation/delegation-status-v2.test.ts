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
    projectRoot: "/tmp/nonexistent-test-root-" + Math.random().toString(36).slice(2, 10),
    terminateChild,
  })
  return { coordinator, getChildMessageCount, getEscalationLevel, lifecycle, manager, terminateChild, tool }
}

describe("delegation-status v2 tool", () => {
  it("returns full status with progress percent and elapsed time", async () => {
    const { tool } = createHarness(activeRecord({
      childSessionId: "ses_child",
      evidenceLevel: "accepted-only",
      executionState: "pending",
      finalMessageExcerpt: "waiting for child output",
      firstActionAt: 999_000,
      signalSource: "message",
      toolCallCount: 1,
    }))

    const raw = await tool.execute({ delegationId: "dt-123" } as never, context)
    const data = parse(raw).data as Record<string, unknown>

    expect(data).toMatchObject({
      childSessionId: "ses_child",
      childMessageCount: 7,
      delegationId: "dt-123",
      elapsedHuman: "2m 30s",
      elapsedMs: 150_000,
      evidenceLevel: "accepted-only",
      executionState: "pending",
      finalMessageExcerpt: "waiting for child output",
      firstActionAt: 999_000,
      progressPct: 50,
      signalSource: "message",
      signals: { messageCount: 7, toolCallCount: 1 },
    })
  })

  it("supports get as a backwards-compatible single-status alias", async () => {
    const { tool } = createHarness()

    const raw = await tool.execute({ action: "get", delegationId: "dt-123" } as never, context)

    expect(parse(raw).data).toMatchObject({ delegationId: "dt-123", status: "running" })
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

  it("routes restart to the manager control API with restartPrompt", async () => {
    const { coordinator, manager, tool } = createHarness()
    manager.controlDelegation = vi.fn().mockResolvedValue({ delegationId: "dt-new" })

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "restart", restartPrompt: "try again" } } as never, context)

    expect(parse(raw).kind).toBe("success")
    expect(manager.controlDelegation).toHaveBeenCalledWith(expect.objectContaining({ action: "restart", delegationId: "dt-123", restartPrompt: "try again" }))
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("routes resume to the manager control API with restartPrompt", async () => {
    const { coordinator, manager, tool } = createHarness()
    manager.controlDelegation = vi.fn().mockResolvedValue({ delegationId: "dt-new" })

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "resume", restartPrompt: "continue" } } as never, context)

    expect(parse(raw).kind).toBe("success")
    expect(manager.controlDelegation).toHaveBeenCalledWith(expect.objectContaining({ action: "resume", delegationId: "dt-123", restartPrompt: "continue" }))
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("routes chain to the manager control API with chainParentSessionId", async () => {
    const { coordinator, manager, tool } = createHarness()
    manager.controlDelegation = vi.fn().mockResolvedValue({ delegationId: "dt-new" })

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "chain", chainParentSessionId: "ses_parent" } } as never, context)

    expect(parse(raw).kind).toBe("success")
    expect(manager.controlDelegation).toHaveBeenCalledWith(expect.objectContaining({ action: "chain", delegationId: "dt-123", chainParentSessionId: "ses_parent" }))
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("rejects resume without restartPrompt", async () => {
    const { coordinator, tool } = createHarness()

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "resume" } } as never, context)

    expect(parse(raw).kind).toBe("error")
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("rejects chain without chainParentSessionId", async () => {
    const { coordinator, tool } = createHarness()

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "chain" } } as never, context)

    expect(parse(raw).kind).toBe("error")
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("accepts cancel on terminal delegation", async () => {
    const { lifecycle, tool } = createHarness(activeRecord({ status: "completed" }))

    const raw = await tool.execute({ action: "control", delegationId: "dt-123", control: { action: "cancel" } } as never, context)

    expect(parse(raw).message).toContain("cancelled")
    expect(lifecycle.markCancelled).toHaveBeenCalledTimes(1)
  })

  it("exposes a terminal-safe resume path for completed child sessions without mutating the record", async () => {
    const record = activeRecord({ childSessionId: "ses_child_done", completedAt: now, status: "completed" })
    const { manager, tool } = createHarness(record)

    const raw = await tool.execute({ delegationId: "dt-123" } as never, context)
    const data = parse(raw).data as Record<string, unknown>

    expect(data.resume).toEqual({ childSessionId: "ses_child_done", mode: "continue-child-session" })
    expect(manager.controlDelegation).toBeUndefined()
    expect(record).toMatchObject({ childSessionId: "ses_child_done", status: "completed" })
  })

  it("DelegationControlSchema validates the 5 D-04 control actions (abort, cancel, restart, resume, chain)", () => {
    for (const action of ["abort", "cancel"] as const) {
      expect(DelegationControlSchema.safeParse({ action }).success).toBe(true)
    }
    expect(DelegationControlSchema.safeParse({ action: "restart", restartPrompt: "redo" }).success).toBe(true)
    expect(DelegationControlSchema.safeParse({ action: "resume", restartPrompt: "continue" }).success).toBe(true)
    expect(DelegationControlSchema.safeParse({ action: "chain", chainParentSessionId: "ses_parent" }).success).toBe(true)
    expect(DelegationControlSchema.safeParse({ action: "pause" }).success).toBe(false)
    expect(DelegationControlSchema.safeParse({ action: "redirect" }).success).toBe(false)
  })

  it("DelegationControlSchema requires restartPrompt for restart action", () => {
    expect(DelegationControlSchema.safeParse({ action: "restart", restartPrompt: "do it better" }).success).toBe(true)
    expect(DelegationControlSchema.safeParse({ action: "restart" }).success).toBe(false)
  })

  it("DelegationControlSchema requires restartPrompt for resume action", () => {
    expect(DelegationControlSchema.safeParse({ action: "resume", restartPrompt: "continue from here" }).success).toBe(true)
    expect(DelegationControlSchema.safeParse({ action: "resume" }).success).toBe(false)
  })

  it("DelegationControlSchema requires chainParentSessionId for chain action", () => {
    expect(DelegationControlSchema.safeParse({ action: "chain", chainParentSessionId: "ses_parent" }).success).toBe(true)
    expect(DelegationControlSchema.safeParse({ action: "chain" }).success).toBe(false)
  })

  it("caps running progressPct below completion", async () => {
    const { tool } = createHarness(activeRecord({ createdAt: now - 999_000 }))

    const data = parse(await tool.execute({ delegationId: "dt-123" } as never, context)).data as Record<string, unknown>

    expect(data.progressPct).toBe(99)
  })

  it("formats elapsed time as human-readable minutes and seconds", async () => {
    const { tool } = createHarness(activeRecord({ createdAt: now - 61_000 }))

    const data = parse(await tool.execute({ delegationId: "dt-123" } as never, context)).data as Record<string, unknown>

    expect(data.elapsedHuman).toBe("1m 1s")
  })

  describe("DelegationControlSchema adjust-prompt / change-agent", () => {
    it("accepts adjust-prompt with restartPrompt", () => {
      const r = DelegationControlSchema.safeParse({ action: "adjust-prompt", restartPrompt: "more info" })
      expect(r.success).toBe(true)
    })

    it("rejects adjust-prompt without restartPrompt", () => {
      const r = DelegationControlSchema.safeParse({ action: "adjust-prompt" })
      expect(r.success).toBe(false)
    })

    it("accepts change-agent with agent", () => {
      const r = DelegationControlSchema.safeParse({ action: "change-agent", agent: "gsd-reviewer" })
      expect(r.success).toBe(true)
    })

    it("rejects change-agent without agent", () => {
      const r = DelegationControlSchema.safeParse({ action: "change-agent" })
      expect(r.success).toBe(false)
    })
  })
})
