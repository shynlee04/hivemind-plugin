import { describe, expect, it, vi } from "vitest"

import { createDelegateTaskTool, DelegateTaskV2Schema } from "../../../src/tools/delegation/delegate-task.js"

const context = { sessionID: "ses_parent", directory: "/tmp/project", worktree: "/tmp/project" }

function parse(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function createCoordinator() {
  return {
    dispatch: vi.fn().mockResolvedValue({ delegationId: "dt-123", queueKey: "agent:builder", status: "dispatched" }),
  }
}

describe("delegate-task v2 tool", () => {
  it("validates valid input, dispatches coordinator, and returns delegation ID immediately", async () => {
    const coordinator = createCoordinator()
    const nativeTask = vi.fn().mockResolvedValue(undefined)
    const tool = createDelegateTaskTool(coordinator as never, { nativeTask })

    const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
    const result = parse(raw)

    expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      agent: "builder",
      currentDepth: 0,
      parentSessionId: "ses_parent",
      prompt: "build it",
      queueKey: "agent:builder",
      safetyCeilingMs: 300_000,
    }))
    expect(result.kind).toBe("success")
    expect((result.data as Record<string, unknown>).delegationId).toBe("dt-123")
  })

  it("rejects missing agent before coordinator dispatch", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ prompt: "build it" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("error")
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("rejects missing prompt before coordinator dispatch", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "builder" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("error")
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("defaults safetyCeilingMs to 300000 when omitted", () => {
    const result = DelegateTaskV2Schema.parse({ agent: "builder", prompt: "build it" })

    expect(result.safetyCeilingMs).toBe(300_000)
  })

  it("dispatches without optional category", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "critic", prompt: "review" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("success")
    expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({ category: undefined }))
  })

  it("returns an error response when coordinator preflight fails", async () => {
    const coordinator = { dispatch: vi.fn().mockRejectedValue(new Error("[Harness] category gate denied")) }
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("category gate denied")
  })

  it("dispatches native Task with agent, prompt, and recursive delegation tools disabled", async () => {
    const coordinator = createCoordinator()
    const nativeTask = vi.fn().mockResolvedValue(undefined)
    const tool = createDelegateTaskTool(coordinator as never, { nativeTask })

    await tool.execute({ agent: "builder", prompt: "build it" } as never, context)

    expect(nativeTask).toHaveBeenCalledWith({
      agent: "builder",
      prompt: "build it",
      disabledTools: ["delegate-task", "task"],
    })
  })

  it("parses legacy v1 delegation records without requiring a v2 marker", () => {
    const legacy = { id: "old", agent: "builder", status: "completed", prompt: "old prompt" }

    expect(() => DelegateTaskV2Schema.parse({ agent: legacy.agent, prompt: legacy.prompt })).not.toThrow()
  })

  it("response data includes delegationId, status, agent, and safetyCeilingMs", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
    const data = parse(raw).data as Record<string, unknown>

    expect(data).toMatchObject({ delegationId: "dt-123", status: "dispatched", agent: "builder", safetyCeilingMs: 300_000 })
  })
})
