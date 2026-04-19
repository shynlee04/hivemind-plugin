import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DelegationManager } from "../../src/lib/delegation-manager.js"
import { HarnessControlPlane } from "../../src/plugin.js"
import { createDelegateTaskTool, DelegateTaskInputSchema } from "../../src/tools/delegate-task.js"

const mockCtx = {
  sessionID: "parent-session",
  agent: "builder",
  directory: process.cwd(),
  worktree: process.cwd(),
  abort: new AbortController().signal,
  metadata: () => ({}),
  ask: async () => ({ state: "approved" as const }),
}

type ToolManagerStub = {
  dispatch: ReturnType<typeof vi.fn>
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function createManagerStub(): ToolManagerStub {
  return {
    dispatch: vi.fn().mockResolvedValue({
      status: "dispatched",
      delegationId: "delegation-dispatch-123",
    }),
  }
}

function createPluginClient() {
  return {
    session: {
      status: vi.fn().mockResolvedValue({ data: {} }),
    },
  }
}

describe("delegate-task tool", () => {
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

  it("is registered in the plugin tool surface as delegate-task", async () => {
    const plugin = await HarnessControlPlane({ client: createPluginClient() } as never)
    expect(plugin.tool["delegate-task"]).toBeDefined()
  })

  it("routes session.idle events using canonical lifecycle event session IDs", async () => {
    const idleSpy = vi.spyOn(DelegationManager.prototype, "handleSessionIdle")
    const plugin = await HarnessControlPlane({ client: createPluginClient() } as never)

    await plugin.event({
      event: {
        type: "session.idle",
        properties: {
          info: { id: "child-from-info-id" },
        },
      },
    })

    expect(idleSpy).toHaveBeenCalledWith("child-from-info-id")
  })

  it("validates required agent parameter", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    await expect(tool.execute({ prompt: "work" } as never, mockCtx)).rejects.toHaveProperty("name", "ZodError")
  })

  it("validates required prompt parameter", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    await expect(tool.execute({ agent: "builder" } as never, mockCtx)).rejects.toHaveProperty("name", "ZodError")
  })

  it("dispatches delegation and returns dispatched result", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    const raw = await tool.execute({ agent: "builder", prompt: "ship it" } as never, mockCtx)
    const result = parseResult(raw)

    expect(manager.dispatch).toHaveBeenCalledWith({
      parentSessionId: "parent-session",
      agent: "builder",
      prompt: "ship it",
      title: undefined,
      safetyCeilingMs: undefined,
    })
    expect(result.kind).toBe("success")
    expect(result.data).toEqual({
      status: "dispatched",
      delegationId: "delegation-dispatch-123",
    })
  })

  it("passes safetyCeilingMs to dispatch when provided", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    await tool.execute({ agent: "critic", prompt: "review this", safetyCeilingMs: 60_000 } as never, mockCtx)

    expect(manager.dispatch).toHaveBeenCalledWith({
      parentSessionId: "parent-session",
      agent: "critic",
      prompt: "review this",
      title: undefined,
      safetyCeilingMs: 60_000,
    })
  })

  it("validates safetyCeilingMs range", () => {
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", safetyCeilingMs: 999 })).toThrow()
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", safetyCeilingMs: 1_800_001 })).toThrow()
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", safetyCeilingMs: 1_000 })).not.toThrow()
  })
})
