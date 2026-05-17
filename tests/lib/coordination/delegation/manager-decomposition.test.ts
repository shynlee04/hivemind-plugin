import type { Delegation } from "../../../../src/coordination/delegation/types.js"
import { DelegationManager } from "../../../../src/coordination/delegation/manager.js"

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
    },
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
