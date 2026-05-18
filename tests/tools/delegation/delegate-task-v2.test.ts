import { describe, expect, it, vi } from "vitest"
import type { ToolContext } from "@opencode-ai/plugin/tool"

import { createDelegateTaskTool, DelegateTaskV2Schema, UNSUPPORTED_NATIVE_TASK_MESSAGE } from "../../../src/tools/delegation/delegate-task.js"

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
  it("reports runtime-blocked dispatch without registering a fake delegation", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toBe(UNSUPPORTED_NATIVE_TASK_MESSAGE)
    expect(coordinator.dispatch).not.toHaveBeenCalled()
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

  it("preserves validated optional category without pretending runtime dispatch is supported", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "critic", prompt: "review" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("runtime child-session dispatch is blocked")
    expect(coordinator.dispatch).not.toHaveBeenCalled()
  })

  it("does not treat injected nativeTask mocks as runtime proof", async () => {
    const coordinator = createCoordinator()
    const tool = createDelegateTaskTool(coordinator as never)

    const raw = await tool.execute({ agent: "builder", prompt: "build it" } as never, context)
    const result = parse(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("mocked nativeTask injection is test-only evidence")
    expect(coordinator.dispatch).not.toHaveBeenCalled()
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
