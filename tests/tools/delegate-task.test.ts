import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DelegationManager } from "../../src/coordination/delegation/manager.js"
import { HarnessControlPlane } from "../../src/plugin.js"
import { createDelegateTaskTool, DelegateTaskInputSchema } from "../../src/tools/delegation/delegate-task.js"

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
      executionMode: "sdk",
      workingDirectory: "/tmp/harness-child",
      queueKey: "provider:anthropic:model:claude-3-5-sonnet",
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

  // ---------------------------------------------------------------------------
  // Plugin registration
  // ---------------------------------------------------------------------------

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

  // ---------------------------------------------------------------------------
  // Dispatch behavior
  // ---------------------------------------------------------------------------

  it("dispatches to DelegationManager.dispatch() and returns delegationId", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    const raw = await tool.execute({ agent: "builder", prompt: "ship it" } as never, mockCtx)
    const result = parseResult(raw)

    expect(manager.dispatch).toHaveBeenCalledWith(expect.objectContaining({
      parentSessionId: "parent-session",
      agent: "builder",
      prompt: "ship it",
      currentDepth: 0,
      queueKey: "agent:builder",
      safetyCeilingMs: 300_000,
      surface: "agent-delegation",
    }))
    expect(result.kind).toBe("success")
    expect(result.data).toMatchObject({
      status: "dispatched",
      delegationId: "delegation-dispatch-123",
      executionMode: "sdk",
      workingDirectory: "/tmp/harness-child",
      queueKey: "provider:anthropic:model:claude-3-5-sonnet",
      agent: "builder",
      safetyCeilingMs: 300_000,
    })
  })

  it("extracts parentSessionId from context.sessionID first", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)
    const ctx = { ...mockCtx, sessionID: "ctx-session-id" }

    await tool.execute({ agent: "builder", prompt: "work" } as never, ctx)

    expect(manager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ parentSessionId: "ctx-session-id" }),
    )
  })

  it("falls back to process.env.OPENCODE_SESSION_ID when context.sessionID is undefined", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)
    const ctxNoSession = { ...mockCtx, sessionID: undefined }
    const previousEnv = process.env.OPENCODE_SESSION_ID
    process.env.OPENCODE_SESSION_ID = "env-session-id"

    try {
      await tool.execute({ agent: "builder", prompt: "work" } as never, ctxNoSession)

      expect(manager.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ parentSessionId: "env-session-id" }),
      )
    } finally {
      if (previousEnv === undefined) {
        delete process.env.OPENCODE_SESSION_ID
      } else {
        process.env.OPENCODE_SESSION_ID = previousEnv
      }
    }
  })

  // ---------------------------------------------------------------------------
  // Schema validation
  // ---------------------------------------------------------------------------

  it("validates required agent parameter (min 1 char)", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    const result = parseResult(await tool.execute({ prompt: "work" } as never, mockCtx))
    expect(result.kind).toBe("error")
  })

  it("validates required prompt parameter (min 1 char)", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    const result = parseResult(await tool.execute({ agent: "builder" } as never, mockCtx))
    expect(result.kind).toBe("error")
  })

  it("ignores removed title parameter and dispatches v2 params", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    await tool.execute({ agent: "builder", prompt: "work", title: "My Task" } as never, mockCtx)

    expect(manager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ agent: "builder", prompt: "work", queueKey: "agent:builder" }),
    )
  })

  it("passes optional safetyCeilingMs parameter through (60000-3600000 range)", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    await tool.execute({ agent: "critic", prompt: "review this", safetyCeilingMs: 120_000 } as never, mockCtx)

    expect(manager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ safetyCeilingMs: 120_000 }),
    )
  })

  it("validates safetyCeilingMs range — positive integer capped at 300000", () => {
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", safetyCeilingMs: 0 })).toThrow()
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", safetyCeilingMs: 300_001 })).toThrow()
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", safetyCeilingMs: 60_000 })).not.toThrow()
    expect(() => DelegateTaskInputSchema.parse({ agent: "builder", prompt: "work", safetyCeilingMs: 300_000 })).not.toThrow()
  })

  it("has no async parameter in schema — sync/async split removed", () => {
    const shape = DelegateTaskInputSchema.shape
    expect(shape).not.toHaveProperty("async")
    expect(shape).not.toHaveProperty("isAsync")
    expect(shape).not.toHaveProperty("sync")
  })

  // ---------------------------------------------------------------------------
  // Response structure
  // ---------------------------------------------------------------------------

  it("returns structured success response with delegationId and agent name in message", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)

    const raw = await tool.execute({ agent: "builder", prompt: "do the thing" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(result.message).toContain("builder")
    expect((result.data as Record<string, unknown>)?.delegationId).toBe("delegation-dispatch-123")
    expect((result.data as Record<string, unknown>)?.status).toBe("dispatched")
    expect((result.data as Record<string, unknown>)?.executionMode).toBe("sdk")
    expect((result.data as Record<string, unknown>)?.workingDirectory).toBe("/tmp/harness-child")
    expect((result.data as Record<string, unknown>)?.queueKey).toBe("provider:anthropic:model:claude-3-5-sonnet")
  })

  it("surfaces truthful sdk execution metadata through the public delegate-task tool using a real DelegationManager", async () => {
    const client = {
      session: {
        create: vi.fn().mockResolvedValue({ data: { id: "child-real-sdk" } }),
        prompt: vi.fn().mockResolvedValue(undefined),
        status: vi.fn().mockResolvedValue({ data: {} }),
        messages: vi.fn().mockResolvedValue({
          data: [{ role: "assistant", parts: [{ type: "text", text: "done" }] }],
        }),
      },
      app: {
        agents: vi.fn().mockResolvedValue({
          data: [
            {
              name: "builder",
              provider: "anthropic",
              model: "claude-3-5-sonnet",
              category: "implementation",
            },
          ],
        }),
      },
    }
    const manager = new DelegationManager(client as never)
    const tool = createDelegateTaskTool(manager)

    const raw = await tool.execute({ agent: "builder", prompt: "ship truthful sdk metadata" } as never, {
      ...mockCtx,
      sessionID: "ses-parent-sdk",
    })
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(result.kind).toBe("success")
    expect(data.executionMode).toBe("sdk")
    expect(data.surface).toBe("agent-delegation")
    expect(data.recoveryGuarantee).toBe("resumable")
    expect(data.explicitCancellation).toBe(false)
    expect(data.queueKey).toBe("provider:anthropic:model:claude-3-5-sonnet")
    expect(manager.getStatus(String(data.delegationId))?.ptySessionId).toBeUndefined()
  })

  it("surfaces queueKey through the public delegate-task tool using a real DelegationManager", async () => {
    const client = {
      session: {
        create: vi.fn().mockResolvedValue({ data: { id: "child-real-queue" } }),
        prompt: vi.fn().mockResolvedValue(undefined),
        status: vi.fn().mockResolvedValue({ data: {} }),
        messages: vi.fn().mockResolvedValue({
          data: [{ role: "assistant", parts: [{ type: "text", text: "done" }] }],
        }),
      },
      app: {
        agents: vi.fn().mockResolvedValue({
          data: [
            {
              name: "builder",
              provider: "anthropic",
              model: "claude-3-5-sonnet",
              category: "implementation",
            },
          ],
        }),
      },
    }
    const manager = new DelegationManager(client as never)
    const tool = createDelegateTaskTool(manager)
    const integrationCtx = { ...mockCtx, sessionID: "ses-parent-session" }

    const raw = await tool.execute({ agent: "builder", prompt: "ship queue key" } as never, integrationCtx)
    const result = parseResult(raw)
    const data = result.data as Record<string, unknown>

    expect(result.kind).toBe("success")
    expect(data.queueKey).toBe("provider:anthropic:model:claude-3-5-sonnet")
    expect(manager.getStatus(String(data.delegationId))?.queueKey).toBe("provider:anthropic:model:claude-3-5-sonnet")
  })

  it("returns error response when DelegationManager.dispatch() throws with [Harness] prefix", async () => {
    const manager = createManagerStub()
    manager.dispatch = vi.fn().mockRejectedValue(new Error('[Harness] Invalid agent: "nonexistent"'))

    const tool = createDelegateTaskTool(manager as never)
    const raw = await tool.execute({ agent: "nonexistent", prompt: "work" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toContain("Invalid agent")
    expect(result.message).toContain("[Harness]")
  })

  it("returns error when parentSessionId unavailable from both context and env", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    const ctxWithoutSession = { ...mockCtx, sessionID: undefined }
    const previousEnv = process.env.OPENCODE_SESSION_ID
    const previousState = process.env.OPENCODE_HARNESS_STATE_DIR
    delete process.env.OPENCODE_SESSION_ID
    delete process.env.OPENCODE_HARNESS_STATE_DIR

    try {
      const raw = await tool.execute({ agent: "builder", prompt: "work" } as never, ctxWithoutSession)
      const result = parseResult(raw)

      expect(result.kind).toBe("error")
      expect(result.message).toContain("requires an OpenCode plugin runtime environment")
      expect(result.message).toContain("native task/subagent tool")
    } finally {
      if (previousEnv) process.env.OPENCODE_SESSION_ID = previousEnv
      else delete process.env.OPENCODE_SESSION_ID
      if (previousState) process.env.OPENCODE_HARNESS_STATE_DIR = previousState
      else delete process.env.OPENCODE_HARNESS_STATE_DIR
    }
  })

  it("returns error response for non-Error thrown values", async () => {
    const manager = createManagerStub()
    manager.dispatch = vi.fn().mockRejectedValue("string error")

    const tool = createDelegateTaskTool(manager as never)
    const raw = await tool.execute({ agent: "builder", prompt: "work" } as never, mockCtx)
    const result = parseResult(raw)

    expect(result.kind).toBe("error")
    expect(result.message).toBe("string error")
  })

  // ---------------------------------------------------------------------------
  // Honest runtime detection — R-RUNTIME-01
  // ---------------------------------------------------------------------------

  it("returns actionable error when no OpenCode runtime is detected and no session context exists", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    const ctxNoSession = { ...mockCtx, sessionID: undefined }
    const previousEnvSession = process.env.OPENCODE_SESSION_ID
    const previousEnvState = process.env.OPENCODE_HARNESS_STATE_DIR
    delete process.env.OPENCODE_SESSION_ID
    delete process.env.OPENCODE_HARNESS_STATE_DIR

    try {
      const raw = await tool.execute({ agent: "builder", prompt: "work" } as never, ctxNoSession)
      const result = parseResult(raw)

      expect(result.kind).toBe("error")
      expect(result.message).toContain("requires an OpenCode plugin runtime environment")
      expect(result.message).toContain("native task/subagent tool")
    } finally {
      if (previousEnvSession) process.env.OPENCODE_SESSION_ID = previousEnvSession
      else delete process.env.OPENCODE_SESSION_ID
      if (previousEnvState) process.env.OPENCODE_HARNESS_STATE_DIR = previousEnvState
      else delete process.env.OPENCODE_HARNESS_STATE_DIR
    }
  })

  it("returns framework-failure error when OpenCode env exists but session ID is still missing", async () => {
    const tool = createDelegateTaskTool(createManagerStub() as never)
    const ctxNoSession = { ...mockCtx, sessionID: undefined }
    const previousEnvSession = process.env.OPENCODE_SESSION_ID
    delete process.env.OPENCODE_SESSION_ID
    process.env.OPENCODE_HARNESS_STATE_DIR = "/tmp/harness-state"

    try {
      const raw = await tool.execute({ agent: "builder", prompt: "work" } as never, ctxNoSession)
      const result = parseResult(raw)

      expect(result.kind).toBe("error")
      expect(result.message).toContain("framework-level context injection failure")
    } finally {
      if (previousEnvSession) process.env.OPENCODE_SESSION_ID = previousEnvSession
      else delete process.env.OPENCODE_SESSION_ID
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    }
  })

  it("dispatches successfully when OpenCode session ID is available from environment", async () => {
    const manager = createManagerStub()
    const tool = createDelegateTaskTool(manager as never)
    const ctxNoSession = { ...mockCtx, sessionID: undefined }
    const previousEnv = process.env.OPENCODE_SESSION_ID
    process.env.OPENCODE_SESSION_ID = "env-session-id"

    try {
      const raw = await tool.execute({ agent: "builder", prompt: "work" } as never, ctxNoSession)
      const result = parseResult(raw)

      expect(result.kind).toBe("success")
      expect(manager.dispatch).toHaveBeenCalledWith(
        expect.objectContaining({ parentSessionId: "env-session-id" }),
      )
    } finally {
      if (previousEnv === undefined) delete process.env.OPENCODE_SESSION_ID
      else process.env.OPENCODE_SESSION_ID = previousEnv
    }
  })
})

describe("contract-based tests", () => {
  it("rejects empty agent name via Zod validation", () => {
    const result = DelegateTaskInputSchema.safeParse({
      agent: "",
      prompt: "do work",
      parentSessionId: "ses_parent",
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty prompt via Zod validation", () => {
    const result = DelegateTaskInputSchema.safeParse({
      agent: "builder",
      prompt: "",
      parentSessionId: "ses_parent",
    })
    expect(result.success).toBe(false)
  })

  it("accepts valid input with required fields", () => {
    const result = DelegateTaskInputSchema.safeParse({
      agent: "builder",
      prompt: "build component",
      parentSessionId: "ses_parent",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.agent).toBe("builder")
      expect(result.data.prompt).toBe("build component")
    }
  })

  it("rejects missing required fields", () => {
    const result = DelegateTaskInputSchema.safeParse({
      agent: "builder",
    })
    expect(result.success).toBe(false)
  })

  it("delegation record created on successful dispatch via stub manager", async () => {
    const manager = createManagerStub()
    const client = createPluginClient()
    const tool = createDelegateTaskTool(manager as never, client as never)
    const ctx = {
      ...mockCtx,
      sessionID: "ses_contract",
    }

    const raw = await tool.execute(
      { agent: "builder", prompt: "build component" } as never,
      ctx,
    )
    const result = parseResult(raw)

    expect(result.kind).toBe("success")
    expect(manager.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        agent: "builder",
        prompt: "build component",
      })
    )
  })
})
