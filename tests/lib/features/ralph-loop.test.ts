import { DelegationCoordinator } from "../../../src/coordination/delegation/coordinator.js"
import { RalphLoopEngine } from "../../../src/features/ralph-loop/index.js"

function createCoordinator(results: Array<{ status: "completed" | "error"; result?: string; error?: string; terminalKind?: "runtime-dispatch-unsupported" }>) {
  return {
    dispatch: vi.fn(async () => {
      const next = results.shift()
      if (!next) throw new Error("unexpected dispatch")
      return { delegationId: `dt-${Math.random()}`, queueKey: "ralph", ...next }
    }),
  }
}

describe("RalphLoopEngine", () => {
  it("rotates through two agents across four cycles", async () => {
    const coordinator = createCoordinator([
      { status: "completed", result: "a1" },
      { status: "completed", result: "b1" },
      { status: "completed", result: "a2" },
      { status: "completed", result: "b2" },
    ])

    const result = await new RalphLoopEngine(coordinator).run({ agents: ["A", "B"], initialPrompt: "review", maxCycles: 4 })

    expect(coordinator.dispatch.mock.calls.map(([call]) => call.agent)).toEqual(["A", "B", "A", "B"])
    expect(result.agentResults.A).toHaveLength(2)
    expect(result.agentResults.B).toHaveLength(2)
  })

  it("rejects an empty agent list", async () => {
    await expect(new RalphLoopEngine(createCoordinator([])).run({ agents: [], initialPrompt: "review", maxCycles: 1 })).rejects.toThrow("agents")
  })

  it("feeds each iteration result into the next prompt", async () => {
    const coordinator = createCoordinator([
      { status: "completed", result: "architect result" },
      { status: "completed", result: "reviewer result" },
    ])

    await new RalphLoopEngine(coordinator).run({ agents: ["architect", "reviewer"], initialPrompt: "review", maxCycles: 2 })

    expect(coordinator.dispatch.mock.calls[1][0].prompt).toContain("Previous result: architect result")
  })

  it("preserves per-agent runtime-blocked failure and stops rotation", async () => {
    const coordinator = createCoordinator([
      { status: "error", error: "runtime dispatch blocked", terminalKind: "runtime-dispatch-unsupported" },
      { status: "completed", result: "must not run" },
    ])

    const result = await new RalphLoopEngine(coordinator).run({ agents: ["architect", "reviewer"], initialPrompt: "review", maxCycles: 2 })

    expect(coordinator.dispatch).toHaveBeenCalledTimes(1)
    expect(result.status).toBe("failed")
    expect(result.agentResults.architect?.[0]?.terminalKind).toBe("runtime-dispatch-unsupported")
    expect(result.agentResults.reviewer).toHaveLength(0)
  })
})

describe("DelegationCoordinator chaining", () => {
  function createDeps(statuses: Array<"completed" | "error">) {
    const releases: string[] = []
    return {
      dispatcher: { preflightCheck: vi.fn(async (params) => ({ queueKey: params.queueKey, slotHandle: { key: params.queueKey, release: () => releases.push(params.queueKey) }, validatedAgent: { name: params.agent, allowedTools: [] } })) },
      lifecycle: { isTerminal: vi.fn(), markTimeout: vi.fn(), transition: vi.fn((_id, status) => ({ delegationId: _id, status })) },
      monitor: { onCompletion: vi.fn(), start: vi.fn(), stop: vi.fn() },
      notificationRouter: { deregister: vi.fn(), register: vi.fn(), route: vi.fn() },
      detector: { unwatch: vi.fn(), watchDualSignal: vi.fn() },
      retryHandler: { persistWithRetry: vi.fn() },
      statuses,
    }
  }

  it("auto-triggers step B with step A result as context", async () => {
    const deps = createDeps(["completed", "completed"])
    const coordinator = new DelegationCoordinator(deps)
    const dispatch = vi.spyOn(coordinator, "dispatch")
      .mockResolvedValueOnce({ delegationId: "dt-a", queueKey: "chain:A:0", result: "A result", status: "completed" })
      .mockResolvedValueOnce({ delegationId: "dt-b", queueKey: "chain:B:1", result: "B result", status: "completed" })

    const results = await coordinator.chain([
      { agent: "A", prompt: "first" },
      { agent: "B", prompt: "second", usePreviousResult: true },
    ])

    expect(results).toHaveLength(2)
    expect(dispatch.mock.calls[1][0].prompt).toContain("Previous result: A result")
    expect(dispatch.mock.calls[1][0].agent).toBe("B")
  })

  it("stops a chain when a delegation fails", async () => {
    const deps = createDeps(["error", "completed"])
    const coordinator = new DelegationCoordinator(deps)
    const dispatch = vi.spyOn(coordinator, "dispatch")
      .mockResolvedValueOnce({ delegationId: "dt-a", error: "failed", queueKey: "chain:A:0", status: "error" })

    const results = await coordinator.chain([
      { agent: "A", prompt: "first" },
      { agent: "B", prompt: "second", usePreviousResult: true },
    ])

    expect(results).toHaveLength(1)
    expect(dispatch).toHaveBeenCalledTimes(1)
  })

  it("stops a chain when dispatch is runtime-blocked", async () => {
    const deps = createDeps(["error", "completed"])
    const coordinator = new DelegationCoordinator(deps)
    const dispatch = vi.spyOn(coordinator, "dispatch")
      .mockResolvedValueOnce({ delegationId: "dt-a", error: "runtime dispatch blocked", queueKey: "chain:A:0", status: "error", terminalKind: "runtime-dispatch-unsupported" })

    const results = await coordinator.chain([
      { agent: "A", prompt: "first" },
      { agent: "B", prompt: "second", usePreviousResult: true },
    ])

    expect(results).toHaveLength(1)
    expect(results[0]?.terminalKind).toBe("runtime-dispatch-unsupported")
    expect(dispatch).toHaveBeenCalledTimes(1)
  })
})
