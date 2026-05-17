import { AutoLoopEngine } from "../../../src/features/auto-loop/index.js"

function createCoordinator(results: Array<{ status: "completed" | "error" | "timeout"; result?: string; error?: string }>) {
  return {
    dispatch: vi.fn(async () => {
      const next = results.shift()
      if (!next) throw new Error("unexpected dispatch")
      return { delegationId: `dt-${Math.random()}`, queueKey: "auto:builder", ...next }
    }),
  }
}

describe("AutoLoopEngine", () => {
  it("runs three sequential delegations for the same agent", async () => {
    const coordinator = createCoordinator([
      { status: "completed", result: "one" },
      { status: "completed", result: "two" },
      { status: "completed", result: "three" },
    ])

    const result = await new AutoLoopEngine(coordinator).run({ agent: "builder", initialPrompt: "build", maxIterations: 3 })

    expect(coordinator.dispatch).toHaveBeenCalledTimes(3)
    expect(coordinator.dispatch.mock.calls.map(([call]) => call.agent)).toEqual(["builder", "builder", "builder"])
    expect(result.results).toHaveLength(3)
  })

  it("rejects maxIterations=0", async () => {
    await expect(new AutoLoopEngine(createCoordinator([])).run({ agent: "builder", initialPrompt: "build", maxIterations: 0 })).rejects.toThrow("maxIterations")
  })

  it("injects the previous iteration result into the next prompt", async () => {
    const coordinator = createCoordinator([
      { status: "completed", result: "first result" },
      { status: "completed", result: "second result" },
    ])

    await new AutoLoopEngine(coordinator).run({ agent: "builder", initialPrompt: "build", maxIterations: 2 })

    expect(coordinator.dispatch.mock.calls[1][0].prompt).toContain("Previous result: first result")
  })

  it("terminates early when a terminal failure result is returned", async () => {
    const coordinator = createCoordinator([
      { status: "completed", result: "ok" },
      { status: "error", error: "failed" },
      { status: "completed", result: "must not run" },
    ])

    const result = await new AutoLoopEngine(coordinator).run({ agent: "builder", initialPrompt: "build", maxIterations: 3 })

    expect(coordinator.dispatch).toHaveBeenCalledTimes(2)
    expect(result.status).toBe("failed")
  })
})
