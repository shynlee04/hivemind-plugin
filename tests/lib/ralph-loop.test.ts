import { describe, expect, it, vi } from "vitest"

import {
  escalationMessage,
  runRalphLoop,
} from "../../src/coordination/spawner/ralph-loop.js"
import type { RalphValidation } from "../../src/coordination/spawner/ralph-loop.js"

describe("ralph-loop — PH39-02 validate-fix-redispatch cycle", () => {
  it("returns passed with zero cycles when initial validation succeeds", async () => {
    const validator = vi.fn(async (): Promise<RalphValidation> => ({ outcome: "passed" }))
    const fixer = vi.fn()

    const result = await runRalphLoop({
      initialResult: { text: "first" },
      maxCorrectionCycles: 3,
      validator,
      fixer,
    })

    expect(result.status).toBe("passed")
    expect(result.cycles).toBe(0)
    expect(result.finalResult).toEqual({ text: "first" })
    expect(result.errors).toEqual([])
    expect(validator).toHaveBeenCalledTimes(1)
    expect(fixer).not.toHaveBeenCalled()
  })

  it("loops fix-validate up to maxCorrectionCycles", async () => {
    const validations: RalphValidation[] = [
      { outcome: "failed", reason: "missing import", fixPrompt: "add import" },
      { outcome: "failed", reason: "still missing", fixPrompt: "add it again" },
      { outcome: "passed" },
    ]
    let validatorCalls = 0
    const validator = vi.fn(async (): Promise<RalphValidation> => validations[validatorCalls++]!)
    const fixer = vi.fn(async (prompt: string, cycle: number) => `fixed-${cycle}-${prompt}`)

    const result = await runRalphLoop({
      initialResult: "original",
      maxCorrectionCycles: 3,
      validator,
      fixer,
    })

    expect(result.status).toBe("passed")
    expect(result.cycles).toBe(2)
    expect(result.finalResult).toBe("fixed-2-add it again")
    expect(result.errors).toEqual(["missing import", "still missing"])
    expect(fixer).toHaveBeenCalledTimes(2)
    expect(fixer).toHaveBeenNthCalledWith(1, "add import", 1)
    expect(fixer).toHaveBeenNthCalledWith(2, "add it again", 2)
  })
})

describe("ralph-loop — PH39-03 max 3 correction cycles + escalation", () => {
  it("returns exhausted with cycles === maxCorrectionCycles when never passes", async () => {
    const validator = vi.fn(
      async (): Promise<RalphValidation> => ({
        outcome: "failed",
        reason: "still wrong",
        fixPrompt: "try again",
      }),
    )
    const fixer = vi.fn(async (prompt: string, cycle: number) => `attempt-${cycle}`)

    const result = await runRalphLoop({
      initialResult: "first",
      maxCorrectionCycles: 3,
      validator,
      fixer,
    })

    expect(result.status).toBe("exhausted")
    expect(result.cycles).toBe(3)
    expect(result.errors).toHaveLength(4) // initial + 3 correction cycles
    expect(result.errors.every((e) => e === "still wrong")).toBe(true)
    expect(fixer).toHaveBeenCalledTimes(3)
  })

  it("does not throw on exhaustion — caller decides escalation", async () => {
    const validator = vi.fn(
      async (): Promise<RalphValidation> => ({
        outcome: "failed",
        reason: "permanent",
        fixPrompt: "fix",
      }),
    )
    const fixer = vi.fn(async () => "x")

    await expect(
      runRalphLoop({
        initialResult: "y",
        maxCorrectionCycles: 1,
        validator,
        fixer,
      }),
    ).resolves.toMatchObject({ status: "exhausted", cycles: 1 })
  })

  it("returns error status when validator throws", async () => {
    const validator = vi.fn(async () => {
      throw new Error("validator crashed")
    })
    const fixer = vi.fn()

    const result = await runRalphLoop({
      initialResult: "z",
      maxCorrectionCycles: 3,
      validator,
      fixer,
    })

    expect(result.status).toBe("error")
    expect(result.cycles).toBe(0)
    expect(result.errors[0]).toMatch(/validator crashed/)
    expect(fixer).not.toHaveBeenCalled()
  })

  it("returns error status when fixer throws mid-cycle", async () => {
    const validator = vi.fn(
      async (): Promise<RalphValidation> => ({
        outcome: "failed",
        reason: "needs fix",
        fixPrompt: "do it",
      }),
    )
    const fixer = vi.fn(async () => {
      throw new Error("fixer crashed")
    })

    const result = await runRalphLoop({
      initialResult: "z",
      maxCorrectionCycles: 3,
      validator,
      fixer,
    })

    expect(result.status).toBe("error")
    expect(result.errors).toContain("needs fix")
    expect(result.errors.some((e) => /fixer crashed/.test(e))).toBe(true)
  })

  it("rejects non-positive maxCorrectionCycles with a [Harness] error", async () => {
    await expect(
      runRalphLoop({
        initialResult: "x",
        maxCorrectionCycles: 0,
        validator: vi.fn(),
        fixer: vi.fn(),
      }),
    ).rejects.toThrow(/^\[Harness\] ralph-loop maxCorrectionCycles/)
  })

  it("escalationMessage carries the [Harness] prefix and reason summary", () => {
    const message = escalationMessage({
      status: "exhausted",
      cycles: 3,
      finalResult: "x",
      errors: ["import missing", "still missing", "now broken", "really broken"],
    })

    expect(message).toMatch(/^\[Harness\]/)
    expect(message).toMatch(/3 correction cycles/)
    expect(message).toMatch(/import missing/)
  })
})
