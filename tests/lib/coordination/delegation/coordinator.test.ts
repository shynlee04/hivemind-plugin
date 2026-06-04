import { describe, expect, it, vi } from "vitest"

import { DelegationCoordinator } from "../../../../src/coordination/delegation/coordinator.js"
import type { DelegationResult } from "../../../../src/coordination/delegation/types.js"
import { getSessionMessages } from "../../../../src/shared/session-api.js"

vi.mock("../../../../src/shared/session-api.js", () => ({
  getSessionMessages: vi.fn().mockResolvedValue([]),
}))

const baseDispatchParams = {
  agent: "gsd-executor",
  category: "implementation",
  currentDepth: 1,
  parentSessionId: "parent-1",
  queueKey: "agent:gsd-executor:category:implementation",
  surface: "agent-delegation" as const,
}

function createDeps() {
  const records = new Map<string, DelegationResult & Record<string, unknown>>()
  const slotHandle = {
    queueKey: baseDispatchParams.queueKey,
    release: vi.fn(),
    sessionId: baseDispatchParams.parentSessionId,
  }
  const dispatcher = {
    preflightCheck: vi.fn().mockResolvedValue({
      queueKey: baseDispatchParams.queueKey,
      slotHandle,
      validatedAgent: { name: "gsd-executor", tools: { read: true } },
    }),
  }
  const monitor = {
    start: vi.fn(),
    stop: vi.fn(),
    onCompletion: vi.fn(),
  }
  const notificationRouter = {
    deregister: vi.fn(),
    register: vi.fn(),
    route: vi.fn(),
  }
  const lifecycle = {
    getStatus: vi.fn((delegationId: string) => records.get(delegationId)),
    isTerminal: vi.fn((status: string) => ["completed", "error", "timeout"].includes(status)),
    list: vi.fn(() => Array.from(records.values())),
    markTimeout: vi.fn((delegationId: string): DelegationResult => ({ delegationId, status: "timeout" })),
    register: vi.fn((record: DelegationResult & Record<string, unknown>) => { records.set(record.id as string, record) }),
    transition: vi.fn((delegationId: string, status: DelegationResult["status"]): DelegationResult => {
      const record = records.get(delegationId)
      if (record) record.status = status
      return { delegationId, status }
    }),
  }
  const callbacksByDetector = new Map<string, (result: DelegationResult) => void>()
  const detector = {
    signalCompletionEvent: vi.fn(),
    signalTerminalStatus: vi.fn((delegationId: string, status: DelegationResult["status"]) => {
      callbacksByDetector.get(delegationId)?.({ delegationId, status })
    }),
    unwatch: vi.fn(),
    watchDualSignal: vi.fn((delegationId: string, _session: string, callback: (result: DelegationResult) => void) => {
      callbacksByDetector.set(delegationId, callback)
    }),
  }
  return { detector, dispatcher, lifecycle, monitor, notificationRouter, slotHandle }
}

// Import Zod schema and extraction functions for unit testing
import { sdkMessageSchema, extractSdkMessageRole, extractSdkMessageError } from "../../../../src/coordination/delegation/coordinator.js"

describe("sdkMessageSchema", () => {
  it("validates a message with info-wrapped role and error", () => {
    const result = sdkMessageSchema.safeParse({
      info: { role: "assistant", error: { message: "fail" } },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(extractSdkMessageRole(result.data)).toBe("assistant")
      expect(extractSdkMessageError(result.data)).toBe("fail")
    }
  })

  it("validates a message with top-level role and error", () => {
    const result = sdkMessageSchema.safeParse({
      role: "user",
      error: "string error",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(extractSdkMessageRole(result.data)).toBe("user")
      expect(extractSdkMessageError(result.data)).toBe("string error")
    }
  })

  it("prefers info-wrapped role over top-level role", () => {
    const result = sdkMessageSchema.safeParse({
      info: { role: "assistant" },
      role: "user",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(extractSdkMessageRole(result.data)).toBe("assistant")
    }
  })

  it("returns undefined for role when no role field is present", () => {
    const result = sdkMessageSchema.safeParse({ error: "something" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(extractSdkMessageRole(result.data)).toBeUndefined()
    }
  })

  it("returns undefined for error when no error field is present", () => {
    const result = sdkMessageSchema.safeParse({ role: "assistant" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(extractSdkMessageError(result.data)).toBeUndefined()
    }
  })

  it("extracts error message from object with .message property", () => {
    const result = sdkMessageSchema.safeParse({
      info: { error: { message: "Internal server error" } },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(extractSdkMessageError(result.data)).toBe("Internal server error")
    }
  })

  it("returns String(errorField) for object without .message (no JSON.stringify)", () => {
    const result = sdkMessageSchema.safeParse({
      error: { code: 500 },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      const extracted = extractSdkMessageError(result.data)
      expect(extracted).toBe("[object Object]")
    }
  })

  it("returns String(errorField) for primitive error", () => {
    const result = sdkMessageSchema.safeParse({
      error: 42,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(extractSdkMessageError(result.data)).toBe("42")
    }
  })

  it("rejects null input", () => {
    const result = sdkMessageSchema.safeParse(null)
    expect(result.success).toBe(false)
  })

  it("rejects non-object input", () => {
    const result = sdkMessageSchema.safeParse("string")
    expect(result.success).toBe(false)
  })
})

describe("DelegationCoordinator", () => {
  it("executes preflight, creates a record, starts monitoring, and returns the delegation id", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)

    const result = await coordinator.dispatch(baseDispatchParams)

    expect(result.delegationId).toMatch(/^dt-\d+-[a-z0-9]+$/)
    expect(result.status).toBe("dispatched")
    expect(deps.dispatcher.preflightCheck).toHaveBeenCalledWith(baseDispatchParams)
    expect(deps.lifecycle.transition).toHaveBeenCalledWith(result.delegationId, "dispatched")
    expect(deps.notificationRouter.register).toHaveBeenCalledWith(result.delegationId, "parent-1")
    expect(deps.monitor.start).toHaveBeenCalledWith(result.delegationId, "parent-1")
    expect(deps.detector.watchDualSignal).toHaveBeenCalledWith(result.delegationId, expect.any(String), expect.any(Function))
  })

  it("keeps promptAsync acceptance separate from execution confirmation", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)

    const result = await coordinator.dispatch(baseDispatchParams)
    const registered = deps.lifecycle.register.mock.calls[0]?.[0]

    expect(result).toMatchObject({ evidenceLevel: "accepted-only", executionState: "pending" })
    expect(registered).toMatchObject({ executionState: "pending", actionCount: 0, messageCount: 0, toolCallCount: 0 })
    expect(registered.firstActionAt).toBeUndefined()
  })

  it("records the first action signal before marking execution confirmed", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const result = await coordinator.dispatch(baseDispatchParams)

    coordinator.recordExecutionSignal(result.delegationId, { source: "tool", observedAt: 123, messageDelta: 2, toolDelta: 1 })

    expect(deps.lifecycle.getStatus(result.delegationId)).toMatchObject({
      actionCount: 1,
      executionState: "confirmed",
      firstActionAt: 123,
      messageCount: 2,
      signalSource: "tool",
      toolCallCount: 1,
    })
  })

  it("marks execution unconfirmed without routing a parent-facing notification", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const result = await coordinator.dispatch(baseDispatchParams)

    await coordinator.markExecutionUnconfirmed(result.delegationId, 30)

    expect(deps.lifecycle.getStatus(result.delegationId)).toMatchObject({ executionState: "unconfirmed" })
    expect(deps.notificationRouter.route).not.toHaveBeenCalled()
  })

  it("does not create records or start monitoring when preflight rejects the request", async () => {
    const deps = createDeps()
    deps.dispatcher.preflightCheck.mockRejectedValueOnce(new Error("[Harness] category denied"))
    const coordinator = new DelegationCoordinator(deps)

    await expect(coordinator.dispatch(baseDispatchParams)).rejects.toThrow("[Harness] category denied")

    expect(deps.lifecycle.transition).not.toHaveBeenCalled()
    expect(deps.notificationRouter.register).not.toHaveBeenCalled()
    expect(deps.monitor.start).not.toHaveBeenCalled()
  })

  it("dispatches three delegations sequentially and isolates each completion callback", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const completions: Array<(result: DelegationResult) => void> = []
    deps.detector.watchDualSignal.mockImplementation((_id: string, _session: string, callback: (result: DelegationResult) => void) => {
      completions.push(callback)
    })

    const first = await coordinator.dispatch({ ...baseDispatchParams, parentSessionId: "parent-a", queueKey: "key-a" })
    const second = await coordinator.dispatch({ ...baseDispatchParams, parentSessionId: "parent-b", queueKey: "key-b" })
    const third = await coordinator.dispatch({ ...baseDispatchParams, parentSessionId: "parent-c", queueKey: "key-c" })

    completions[0]?.({ delegationId: first.delegationId, status: "completed", result: "one" })
    completions[1]?.({ delegationId: second.delegationId, status: "error", error: "two" })
    completions[2]?.({ delegationId: third.delegationId, status: "completed", result: "three" })

    expect(deps.monitor.start).toHaveBeenNthCalledWith(1, first.delegationId, "parent-a")
    expect(deps.monitor.start).toHaveBeenNthCalledWith(2, second.delegationId, "parent-b")
    expect(deps.monitor.start).toHaveBeenNthCalledWith(3, third.delegationId, "parent-c")
    expect(deps.notificationRouter.route).toHaveBeenCalledWith(expect.objectContaining({ delegationId: first.delegationId, type: "success" }))
    expect(deps.notificationRouter.route).toHaveBeenCalledWith(expect.objectContaining({ delegationId: second.delegationId, type: "failure" }))
    expect(deps.notificationRouter.route).toHaveBeenCalledWith(expect.objectContaining({ delegationId: third.delegationId, type: "success" }))
  })

  it("routes completion, stops monitoring, deregisters notification routing, and releases the slot", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const dispatched = await coordinator.dispatch(baseDispatchParams)

    coordinator.handleCompletion(dispatched.delegationId, { delegationId: dispatched.delegationId, status: "completed", result: "done" })

    expect(deps.monitor.onCompletion).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.lifecycle.transition).toHaveBeenCalledWith(dispatched.delegationId, "completed")
    expect(deps.notificationRouter.route).toHaveBeenCalledWith(expect.objectContaining({ delegationId: dispatched.delegationId, type: "success" }))
    expect(deps.notificationRouter.deregister).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.slotHandle.release).toHaveBeenCalledOnce()
  })

  it("extracts completion evidence into the parent-facing result payload", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const dispatched = await coordinator.dispatch(baseDispatchParams)

    coordinator.handleCompletion(dispatched.delegationId, {
      childSessionId: "child-final",
      delegationId: dispatched.delegationId,
      evidenceLevel: "message-and-tool",
      finalMessageExcerpt: "implemented the requested behavior",
      result: "completed summary",
      signalSource: "message",
      status: "completed",
      toolCallCount: 1,
    })

    expect(deps.lifecycle.getStatus(dispatched.delegationId)).toMatchObject({
      childSessionId: "child-final",
      evidenceLevel: "message-and-tool",
      finalMessageExcerpt: "implemented the requested behavior",
      result: "completed summary",
      toolCallCount: 1,
    })
    expect(deps.notificationRouter.route).toHaveBeenCalledWith(expect.objectContaining({ message: "completed summary" }))
  })

  it("marks timeout, routes timeout notification, deregisters routing, and releases the slot", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const dispatched = await coordinator.dispatch(baseDispatchParams)

    coordinator.handleTimeout(dispatched.delegationId)

    expect(deps.lifecycle.markTimeout).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.notificationRouter.route).toHaveBeenCalledWith(expect.objectContaining({ delegationId: dispatched.delegationId, type: "timeout" }))
    expect(deps.notificationRouter.deregister).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.slotHandle.release).toHaveBeenCalledOnce()
  })

  it("cleans up coordinator resources when native Task dispatch fails after registration", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const dispatched = await coordinator.dispatch(baseDispatchParams)

    coordinator.failDispatch(dispatched.delegationId, new Error("native failed"))

    expect(deps.lifecycle.transition).toHaveBeenCalledWith(dispatched.delegationId, "error")
    expect(deps.monitor.onCompletion).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.detector.unwatch).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.notificationRouter.deregister).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.slotHandle.release).toHaveBeenCalledOnce()
  })

  it("maps hook session events to the matching child delegation", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const dispatched = await coordinator.dispatch(baseDispatchParams)
    coordinator.attachChildSession(dispatched.delegationId, "child-real")

    coordinator.handleSessionIdle("child-real")

    expect(deps.detector.unwatch).toHaveBeenCalledWith(dispatched.delegationId)
    expect(deps.lifecycle.transition).toHaveBeenCalledWith(dispatched.delegationId, "completed")
  })

  it("handles concurrent delegations independently without cross-talk", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const callbacks = new Map<string, (result: DelegationResult) => void>()
    deps.detector.watchDualSignal.mockImplementation((delegationId: string, _session: string, callback: (result: DelegationResult) => void) => {
      callbacks.set(delegationId, callback)
    })

    const [left, right] = await Promise.all([
      coordinator.dispatch({ ...baseDispatchParams, parentSessionId: "parent-left", queueKey: "key-left" }),
      coordinator.dispatch({ ...baseDispatchParams, parentSessionId: "parent-right", queueKey: "key-right" }),
    ])

    callbacks.get(right.delegationId)?.({ delegationId: right.delegationId, status: "completed", result: "right" })

    expect(deps.notificationRouter.route).toHaveBeenCalledTimes(1)
    expect(deps.notificationRouter.route).toHaveBeenCalledWith(expect.objectContaining({ delegationId: right.delegationId }))
    expect(deps.notificationRouter.route).not.toHaveBeenCalledWith(expect.objectContaining({ delegationId: left.delegationId }))
  })

  describe("chain with append", () => {
    it("first step dispatches normally and subsequent steps append via sendPromptAsync", async () => {
      const deps = createDeps()
      const coordinator = new DelegationCoordinator(deps)
      const sendPromptAsync = vi.fn().mockResolvedValue(undefined)
      const results = await coordinator.chain([
        { agent: "builder", prompt: "step 1" },
        { agent: "reviewer", prompt: "step 2" },
      ], sendPromptAsync)
      expect(deps.dispatcher.preflightCheck).toHaveBeenCalledTimes(1) // first step only
      expect(results).toHaveLength(2)
    })

    it("second step reuses childSessionId from first step and sets chainedFrom", async () => {
      const deps = createDeps()
      const coordinator = new DelegationCoordinator(deps)
      const sendPromptAsync = vi.fn().mockResolvedValue(undefined)
      const results = await coordinator.chain([
        { agent: "builder", prompt: "step 1" },
        { agent: "reviewer", prompt: "step 2" },
      ], sendPromptAsync)
      // First result: childSessionId from dispatch
      expect(results[0].childSessionId).toBeTruthy()
      // Second result: same childSessionId
      expect(results[1].childSessionId).toBe(results[0].childSessionId)
      // Second result: chainedFrom set
      expect(results[1].chainedFrom).toBe(results[0].delegationId)
      // sendPromptAsync called for step 2
      expect(sendPromptAsync).toHaveBeenCalledWith(results[0].childSessionId, "step 2")
    })

    it("falls back to dispatch for all steps when sendPromptAsync is not provided", async () => {
      const deps = createDeps()
      const coordinator = new DelegationCoordinator(deps)
      const results = await coordinator.chain([
        { agent: "builder", prompt: "step 1" },
        { agent: "reviewer", prompt: "step 2" },
      ])
      expect(deps.dispatcher.preflightCheck).toHaveBeenCalledTimes(2)
      expect(results[1].childSessionId).not.toBe(results[0].childSessionId) // different sessions
    })
  })

  it("invokes onChildSessionId early and registers mapping before starter completes", async () => {
    const deps = createDeps()
    const startSpy = vi.fn().mockImplementation(async (params) => {
      params.onChildSessionId?.("child-early-id")
      return { childSessionId: "child-early-id" }
    })
    const depsWithStarter = {
      ...deps,
      childSessionStarter: {
        start: startSpy,
      },
    }
    const coordinator = new DelegationCoordinator(depsWithStarter)

    const dispatched = await coordinator.dispatch(baseDispatchParams)

    coordinator.recordChildMessageSignal("child-early-id", Date.now(), "hello early session")

    const record = deps.lifecycle.getStatus(dispatched.delegationId)
    expect(record).toBeDefined()
    expect(record.finalMessageExcerpt).toBe("hello early session")
  })

  it("falls back to searching active records if childSessionId is not in the map", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const dispatched = await coordinator.dispatch(baseDispatchParams)

    const active = (coordinator as any).active.get(dispatched.delegationId)
    expect(active).toBeDefined()
    active.record.childSessionId = "child-fallback-id"
    ;(coordinator as any).delegationByChildSession.delete("child-fallback-id")

    coordinator.recordChildMessageSignal("child-fallback-id", Date.now(), "hello fallback session")

    const record = deps.lifecycle.getStatus(dispatched.delegationId)
    expect(record).toBeDefined()
    expect(record.finalMessageExcerpt).toBe("hello fallback session")
    expect((coordinator as any).delegationByChildSession.get("child-fallback-id")).toBe(dispatched.delegationId)
  })

  it("inherits model and provider configuration from parent session history", async () => {
    const deps = createDeps()
    const mockClient = {} as any
    const depsWithClient = { ...deps, client: mockClient }

    vi.mocked(getSessionMessages).mockImplementation(async (client, sessionId) => {
      if (sessionId === "parent-with-model") {
        return [
          { info: { role: "user" } },
          { info: { role: "assistant", modelID: "claude-3-5", providerID: "anthropic" } }
        ] as any
      }
      return []
    })

    const startSpy = vi.fn().mockResolvedValue({ childSessionId: "child-model-id" })
    depsWithClient.childSessionStarter = { start: startSpy }

    const coordinator = new DelegationCoordinator(depsWithClient)
    await coordinator.dispatch({
      ...baseDispatchParams,
      parentSessionId: "parent-with-model",
    })

    expect(getSessionMessages).toHaveBeenCalledWith(mockClient, "parent-with-model")
    expect(startSpy).toHaveBeenCalledWith(expect.objectContaining({
      model: { modelID: "claude-3-5", providerID: "anthropic" }
    }))
  })

  it("proactively detects error messages in child session messages and fails early", async () => {
    const deps = createDeps()
    const mockClient = {} as any
    const depsWithClient = { ...deps, client: mockClient }

    vi.mocked(getSessionMessages).mockImplementation(async (client, sessionId) => {
      if (sessionId === "child-err-id") {
        return [
          { info: { role: "assistant", error: { message: "Internal server error" } } }
        ] as any
      }
      return []
    })

    const coordinator = new DelegationCoordinator(depsWithClient)
    const dispatched = await coordinator.dispatch(baseDispatchParams)

    // Set childSessionId manually to trigger check
    const active = (coordinator as any).active.get(dispatched.delegationId)
    active.record.childSessionId = "child-err-id"

    await coordinator.markExecutionUnconfirmed(dispatched.delegationId, 10)

    const record = deps.lifecycle.getStatus(dispatched.delegationId)
    expect(record.status).toBe("error")
    expect(record.executionState).toBe("stalled")
    expect(record.error).toContain("Child session assistant error: Internal server error")
  })

  it("proactively stalls delegation when 60s timeout is reached", async () => {
    const deps = createDeps()
    const coordinator = new DelegationCoordinator(deps)
    const dispatched = await coordinator.dispatch(baseDispatchParams)

    const handleTimeoutSpy = vi.spyOn(coordinator as any, "handleTimeout")

    await coordinator.markExecutionUnconfirmed(dispatched.delegationId, 60)

    const record = deps.lifecycle.getStatus(dispatched.delegationId)
    expect(record.executionState).toBe("stalled")
    expect(handleTimeoutSpy).toHaveBeenCalledWith(dispatched.delegationId)
  })

  describe("S5b tmux panel-spawn fallback", () => {
    it("invokes tmuxIntegration.adapter.onSessionCreated with synthesized event after dispatch", async () => {
      const deps = createDeps()
      const onSessionCreated = vi.fn().mockResolvedValue(undefined)
      deps.childSessionStarter = {
        start: vi.fn().mockResolvedValue({
          childSessionId: "child-tmux-1",
          title: "hm-delegate-child-gsd-executor-fix-bug",
          workingDirectory: "/tmp/proj",
        }),
      }
      deps.tmuxIntegration = { adapter: { onSessionCreated } as never }

      const coordinator = new DelegationCoordinator(deps)
      await coordinator.dispatch({ ...baseDispatchParams, parentSessionId: "parent-tmux-1", workingDirectory: "/tmp/proj" })

      // Yield to the microtask so the void promise's `.catch` resolves.
      await new Promise((resolve) => setImmediate(resolve))

      expect(onSessionCreated).toHaveBeenCalledTimes(1)
      const event = onSessionCreated.mock.calls[0]?.[0] as {
        type: string
        properties: { info: { id: string; parentID: string | undefined; title: string; directory: string } }
        hivemindMeta?: { agent: string; delegationId: string; depth: number }
      }
      expect(event.type).toBe("session.created")
      expect(event.properties.info.id).toBe("child-tmux-1")
      expect(event.properties.info.parentID).toBe("parent-tmux-1")
      expect(event.properties.info.title).toBe("hm-delegate-child-gsd-executor-fix-bug")
      expect(event.properties.info.directory).toBe("/tmp/proj")
      expect(event.hivemindMeta).toEqual({
        agent: "gsd-executor",
        delegationId: "child-tmux-1",
        depth: 1,
      })
    })

    it("does NOT call the adapter when tmuxIntegration is not wired", async () => {
      const deps = createDeps()
      const onSessionCreated = vi.fn().mockResolvedValue(undefined)
      deps.childSessionStarter = {
        start: vi.fn().mockResolvedValue({
          childSessionId: "child-no-tmux",
          title: "hm-delegate-child-gsd-executor-task",
          workingDirectory: "/tmp/proj",
        }),
      }
      // No tmuxIntegration — must silently no-op, no throw.
      const coordinator = new DelegationCoordinator(deps)
      await expect(coordinator.dispatch(baseDispatchParams)).resolves.toBeDefined()
      expect(onSessionCreated).not.toHaveBeenCalled()
    })

    it("swallows adapter errors so the delegation keeps running (D-04 silent-fallback)", async () => {
      const deps = createDeps()
      const adapterError = new Error("tmux split-window failed")
      const onSessionCreated = vi.fn().mockRejectedValue(adapterError)
      deps.childSessionStarter = {
        start: vi.fn().mockResolvedValue({
          childSessionId: "child-tmux-fail",
          title: "hm-delegate-child-gsd-executor-fail",
          workingDirectory: "/tmp/proj",
        }),
      }
      deps.tmuxIntegration = { adapter: { onSessionCreated } as never }
      deps.client = { app: { log: vi.fn().mockResolvedValue(undefined) } } as never

      const coordinator = new DelegationCoordinator(deps)
      const result = await coordinator.dispatch(baseDispatchParams)

      // Delegation still completes — error is logged not thrown.
      expect(result.childSessionId).toBe("child-tmux-fail")
      // Yield so the .catch handler runs.
      await new Promise((resolve) => setImmediate(resolve))
      expect(deps.client!.app!.log).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            service: "delegation",
            level: "warn",
            message: expect.stringContaining("tmux adapter.onSessionCreated failed for child-tmux-fail"),
          }),
        }),
      )
    })
  })
})
