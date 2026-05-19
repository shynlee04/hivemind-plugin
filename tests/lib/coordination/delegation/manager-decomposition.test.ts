import type { Delegation } from "../../../../src/coordination/delegation/types.js"
import { DelegationManager, type DelegationControlRequest } from "../../../../src/coordination/delegation/manager.js"

const baseDelegation: Delegation = {
  agent: "builder",
  childSessionId: "child-1",
  createdAt: 1,
  executionMode: "sdk",
  id: "dt-1",
  lastMessageCount: 0,
  nestingDepth: 1,
  parentSessionId: "parent-1",
  queueKey: "agent:builder",
  stablePollCount: 0,
  status: "running",
  workingDirectory: "/tmp/project",
}

function createCompletedDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    ...baseDelegation,
    childSessionId: "ses_child",
    id: "dt-123",
    status: "completed",
    ...overrides,
  }
}

function createFacadeDeps(overrides: Partial<ConstructorParameters<typeof DelegationManager>[1]> = {}) {
  return {
    coordinator: {
      dispatch: vi.fn(async () => ({ delegationId: "dt-1", queueKey: "agent:builder", status: "dispatched" as const })),
      chain: vi.fn(),
    },
    lifecycle: {
      getStatus: vi.fn(() => baseDelegation),
      list: vi.fn(() => [baseDelegation, { ...baseDelegation, id: "dt-2", parentSessionId: "parent-2" }]),
      markAborted: vi.fn(() => ({ delegationId: "dt-1", status: "error" as const, error: "[Harness] Delegation aborted" })),
      markCancelled: vi.fn(() => ({ delegationId: "dt-1", status: "error" as const, error: "[Harness] Delegation cancelled" })),
      getChildSessionId: vi.fn(() => "child-1"),
      register: vi.fn(),
    },
    sendPromptAsync: vi.fn(async (_sessionId: string, _prompt: string) => {}),
    ...overrides,
  }
}

describe("DelegationManager decomposition facade", () => {
  it("delegates dispatchDelegation to coordinator.dispatch while preserving the public result", async () => {
    const deps = createFacadeDeps()
    const manager = new DelegationManager(undefined, deps)

    const result = await manager.dispatchDelegation(undefined, {
      agent: "builder",
      currentDepth: 0,
      parentSessionId: "parent-1",
      queueKey: "agent:builder",
      surface: "agent-delegation",
    })

    expect(deps.coordinator.dispatch).toHaveBeenCalledWith(expect.objectContaining({ agent: "builder" }))
    expect(result).toEqual({ delegationId: "dt-1", queueKey: "agent:builder", status: "dispatched" })
  })

  it("reads getStatus from the lifecycle module", () => {
    const deps = createFacadeDeps()
    const manager = new DelegationManager(undefined, deps)

    expect(manager.getStatus("dt-1")).toBe(baseDelegation)
    expect(deps.lifecycle.getStatus).toHaveBeenCalledWith("dt-1")
  })

  it("returns a filtered delegation list without changing the public record shape", () => {
    const manager = new DelegationManager(undefined, createFacadeDeps())

    expect(manager.listDelegations("parent-1")).toEqual([baseDelegation])
  })

  it("delegates abortDelegation to lifecycle.markAborted", () => {
    const deps = createFacadeDeps()
    const manager = new DelegationManager(undefined, deps)

    expect(manager.abortDelegation("dt-1")).toEqual({
      delegationId: "dt-1",
      error: "[Harness] Delegation aborted",
      status: "error",
    })
    expect(deps.lifecycle.markAborted).toHaveBeenCalledWith("dt-1")
  })
})

describe("controlDelegation resume/chain/adjust-prompt/change-agent", () => {
  it("resume on completed delegation reuses childSessionId and creates new record with resumedFrom", async () => {
    const completed = createCompletedDelegation()
    const register = vi.fn()
    const sendPromptAsync = vi.fn(async () => {})
    const getStatus = vi.fn(() => completed)

    const manager = new DelegationManager(undefined, {
      coordinator: { dispatch: vi.fn(), chain: vi.fn() },
      lifecycle: {
        getStatus,
        list: vi.fn(() => [completed]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_child"),
        register,
      },
      sendPromptAsync,
    })

    const result = await manager.controlDelegation({
      action: "resume",
      delegationId: "dt-123",
      restartPrompt: "continue the work",
    })

    // Should have called sendPromptAsync with the reused childSessionId
    expect(sendPromptAsync).toHaveBeenCalledWith("ses_child", "continue the work")
    // Should have created a new delegation record
    expect(register).toHaveBeenCalledTimes(1)
    const newRecord = register.mock.calls[0][0] as Delegation
    expect(newRecord.childSessionId).toBe("ses_child")
    expect(newRecord.resumedFrom).toBe("dt-123")
    expect(newRecord.chainedFrom).toBeUndefined()
    // Result should reference the NEW delegation id with reused childSessionId
    expect(result.delegationId).not.toBe("dt-123")
    expect(result.childSessionId).toBe("ses_child")
    expect(result.status).toBe("running")
  })

  it("chain on completed delegation returns same childSessionId with chainedFrom", async () => {
    const completed = createCompletedDelegation()
    const register = vi.fn()
    const sendPromptAsync = vi.fn(async () => {})

    const manager = new DelegationManager(undefined, {
      coordinator: { dispatch: vi.fn(), chain: vi.fn() },
      lifecycle: {
        getStatus: vi.fn(() => completed),
        list: vi.fn(() => [completed]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_child"),
        register,
      },
      sendPromptAsync,
    })

    const result = await manager.controlDelegation({
      action: "chain",
      delegationId: "dt-123",
      restartPrompt: "next step please",
    })

    expect(sendPromptAsync).toHaveBeenCalledWith("ses_child", "next step please")
    expect(register).toHaveBeenCalledTimes(1)
    const newRecord = register.mock.calls[0][0] as Delegation
    expect(newRecord.childSessionId).toBe("ses_child")
    expect(newRecord.chainedFrom).toBe("dt-123")
    expect(newRecord.resumedFrom).toBeUndefined()
    expect(result.delegationId).not.toBe("dt-123")
    expect(result.childSessionId).toBe("ses_child")
    expect(result.status).toBe("running")
  })

  it("adjust-prompt on running delegation calls sendPromptAsync and returns same delegation id", async () => {
    const running = { ...baseDelegation, childSessionId: "ses_active", id: "dt-456", status: "running" as const }
    const sendPromptAsync = vi.fn(async () => {})

    const manager = new DelegationManager(undefined, {
      coordinator: { dispatch: vi.fn(), chain: vi.fn() },
      lifecycle: {
        getStatus: vi.fn(() => running),
        list: vi.fn(() => [running]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_active"),
      },
      sendPromptAsync,
    })

    const result = await manager.controlDelegation({
      action: "adjust-prompt",
      delegationId: "dt-456",
      restartPrompt: "consider edge cases",
    })

    // Should have called sendPromptAsync on the running session
    expect(sendPromptAsync).toHaveBeenCalledWith("ses_active", "consider edge cases")
    // Should return SAME delegation id (not creating a new record)
    expect(result.delegationId).toBe("dt-456")
    expect(result.childSessionId).toBe("ses_active")
    expect(result.status).toBe("running")
  })

  it("change-agent on running delegation calls sendPromptAsync with new agent assigned", async () => {
    const running = { ...baseDelegation, childSessionId: "ses_active", id: "dt-789", status: "running" as const }
    const abortDelegation = vi.fn(() => ({ delegationId: "dt-789", error: "aborted", status: "error" as const }))
    const sendPromptAsync = vi.fn(async () => {})

    const manager = new DelegationManager(undefined, {
      coordinator: {
        dispatch: vi.fn(),
        chain: vi.fn(),
        abortDelegation,
      },
      lifecycle: {
        getStatus: vi.fn(() => running),
        list: vi.fn(() => [running]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_active"),
      },
      sendPromptAsync,
    })

    const result = await manager.controlDelegation({
      action: "change-agent",
      delegationId: "dt-789",
      restartPrompt: "do the thing with new agent",
      agent: "gsd-reviewer",
    })

    // Should have aborted first
    expect(abortDelegation).toHaveBeenCalledWith("dt-789", expect.stringContaining("change-agent"))
    // Should have called sendPromptAsync
    expect(sendPromptAsync).toHaveBeenCalledWith("ses_active", "do the thing with new agent")
    // Should return same delegation id
    expect(result.delegationId).toBe("dt-789")
    expect(result.childSessionId).toBe("ses_active")
    expect(result.status).toBe("running")
  })

  it("restart on completed delegation still throws terminal guard error", async () => {
    const completed = createCompletedDelegation()

    const manager = new DelegationManager(undefined, {
      coordinator: { dispatch: vi.fn(), chain: vi.fn() },
      lifecycle: {
        getStatus: vi.fn(() => completed),
        list: vi.fn(() => [completed]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_child"),
      },
      sendPromptAsync: vi.fn(),
    })

    await expect(
      manager.controlDelegation({ action: "restart", delegationId: "dt-123", restartPrompt: "try again" })
    ).rejects.toThrow("[Harness] cannot control terminal delegation")
  })

  it("adjust-prompt on completed delegation throws error", async () => {
    const completed = createCompletedDelegation()

    const manager = new DelegationManager(undefined, {
      coordinator: { dispatch: vi.fn(), chain: vi.fn() },
      lifecycle: {
        getStatus: vi.fn(() => completed),
        list: vi.fn(() => [completed]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_child"),
      },
      sendPromptAsync: vi.fn(),
    })

    await expect(
      manager.controlDelegation({ action: "adjust-prompt", delegationId: "dt-123", restartPrompt: "more info" })
    ).rejects.toThrow("[Harness]")
  })

  it("change-agent without agent throws error", async () => {
    const running = { ...baseDelegation, childSessionId: "ses_active", id: "dt-789", status: "running" as const }

    const manager = new DelegationManager(undefined, {
      coordinator: { dispatch: vi.fn(), chain: vi.fn() },
      lifecycle: {
        getStatus: vi.fn(() => running),
        list: vi.fn(() => [running]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_active"),
      },
      sendPromptAsync: vi.fn(),
    })

    await expect(
      manager.controlDelegation({ action: "change-agent", delegationId: "dt-789", restartPrompt: "do it" } as DelegationControlRequest)
    ).rejects.toThrow("[Harness] change-agent requires an agent name")
  })

  it("resume without sendPromptAsync falls back to abort+dispatch path", async () => {
    const completed = createCompletedDelegation()
    const dispatch = vi.fn(async () => ({ delegationId: "dt-new", childSessionId: "ses_new", status: "dispatched" as const }))
    const abortDelegation = vi.fn(() => ({ delegationId: "dt-123", error: "aborted", status: "error" as const, terminalKind: "restarted" as const }))

    const getStatus = vi.fn(() => completed)
    const manager = new DelegationManager(undefined, {
      coordinator: { dispatch, chain: vi.fn(), abortDelegation },
      lifecycle: {
        getStatus,
        list: vi.fn(() => [completed]),
        markAborted: vi.fn(),
        markCancelled: vi.fn(),
        getChildSessionId: vi.fn(() => "ses_child"),
      },
      // No sendPromptAsync — should fall back
    })

    const result = await manager.controlDelegation({
      action: "resume",
      delegationId: "dt-123",
      restartPrompt: "continue",
    })

    // Should have taken abort+dispatch path
    expect(abortDelegation).toHaveBeenCalledWith("dt-123", expect.any(String))
    expect(dispatch).toHaveBeenCalled()
    // Result comes from dispatch
    expect(result.delegationId).toBe("dt-new")
  })
})
