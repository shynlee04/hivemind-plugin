import { describe, expect, it, vi } from "vitest"
import type { ToolContext } from "@opencode-ai/plugin/tool"

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
  it("dispatches through the coordinator instead of returning runtime-blocked", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("success")
    expect(result.data).toMatchObject({ delegationId: "dt-123", status: "dispatched", agent: "builder" })
    expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      agent: "builder",
      parentSessionId: "ses_parent",
      prompt: "build it",
      queueKey: "agent:builder",
    }))
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

  it("preserves validated optional category during runtime dispatch", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "critic", category: "review", prompt: "review" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("success")
    expect(coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({ category: "review" }))
  })

  it("does not depend on an injected nativeTask mock seam", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("success")
    expect(coordinator.dispatch).toHaveBeenCalledTimes(1)
  })

  it("parses legacy v1 delegation records without requiring a v2 marker", () => {
    const legacy = { id: "old", agent: "builder", status: "completed", prompt: "old prompt" }

    expect(() => DelegateTaskV2Schema.parse({ agent: legacy.agent, prompt: legacy.prompt })).not.toThrow()
  })

  it("plugin ToolContext shape has no task field", () => {
    const pluginContext = {
      abort: new AbortController().signal,
      agent: "builder",
      ask: vi.fn(),
      directory: "/tmp/project",
      messageID: "msg_parent",
      metadata: vi.fn(),
      sessionID: "ses_parent",
      worktree: "/tmp/project",
    } satisfies ToolContext

    expect("task" in pluginContext).toBe(false)
  })
})
