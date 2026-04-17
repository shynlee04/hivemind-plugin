import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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
  delegateSync: ReturnType<typeof vi.fn>
  delegateAsync: ReturnType<typeof vi.fn>
}

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

function createManagerStub(): ToolManagerStub {
  return {
    delegateSync: vi.fn().mockResolvedValue({
      status: "completed",
      result: "assistant text result",
      delegationId: "delegation-sync",
    }),
    delegateAsync: vi.fn().mockResolvedValue({ delegationId: "delegation-async" }),
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

  it("validates required agent parameter", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    await expect(tool.execute({ prompt: "work" } as never, mockCtx)).rejects.toHaveProperty("name", "ZodError")
  })

  it("validates required prompt parameter", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    await expect(tool.execute({ agent: "builder" } as never, mockCtx)).rejects.toHaveProperty("name", "ZodError")
  })

  it("defaults async to false and routes to delegateSync", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    const raw = await tool.execute({ agent: "builder", prompt: "ship it" } as never, mockCtx)
    const result = parseResult(raw)

    expect(manager.delegateSync).toHaveBeenCalledWith({
      parentSessionId: "parent-session",
      agent: "builder",
      prompt: "ship it",
      title: undefined,
      timeoutMs: undefined,
    })
    expect(manager.delegateAsync).not.toHaveBeenCalled()
    expect(result.kind).toBe("success")
    expect(result.data).toEqual({
      status: "completed",
      result: "assistant text result",
      delegationId: "delegation-sync",
    })
  })

  it("returns dispatched response path for async mode", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    const raw = await tool.execute({ agent: "critic", prompt: "review this", async: true } as never, mockCtx)
    const result = parseResult(raw)

    expect(manager.delegateAsync).toHaveBeenCalledWith({
      parentSessionId: "parent-session",
      agent: "critic",
      prompt: "review this",
      title: undefined,
      timeoutMs: undefined,
    })
    expect(result.kind).toBe("success")
    expect(result.data).toEqual({
      status: "dispatched",
      delegationId: "delegation-async",
      message: "Async delegation dispatched to critic",
    })
  })

  it("validates timeoutMs range", () => {
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", timeoutMs: 999 })).toThrow()
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", timeoutMs: 1_800_001 })).toThrow()
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", timeoutMs: 1_000 })).not.toThrow()
  })
})
