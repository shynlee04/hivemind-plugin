import { describe, expect, it, vi } from "vitest"

import { runAutoLoop } from "../../src/coordination/spawner/auto-loop.js"
import type { AutoLoopVerification } from "../../src/coordination/spawner/auto-loop.js"
import { runRalphLoop } from "../../src/coordination/spawner/ralph-loop.js"
import type { RalphValidation } from "../../src/coordination/spawner/ralph-loop.js"

/**
 * Phase 39 conformance — composing auto-loop with ralph-loop. Failed
 * verifications inside auto-loop kick into ralph-loop's correction
 * cycle. Passed verifications complete the auto-loop. An exhausted
 * ralph-loop surfaces as a failed auto-loop iteration.
 */
describe("Phase 39 conformance — auto-loop + ralph-loop composition", () => {
  it("runs ralph-loop inside the verifier and reports completed when ralph passes", async () => {
    let dispatchCount = 0
    const dispatcher = vi.fn(async () => `result-${++dispatchCount}`)

    const verifier = vi.fn(
      async (initialResult: string, attempt: number): Promise<AutoLoopVerification<string>> => {
        const validations: RalphValidation[] = [
          { outcome: "failed", reason: "lint failed", fixPrompt: "fix lint" },
          { outcome: "passed" },
        ]
        let calls = 0
        const ralph = await runRalphLoop({
          initialResult,
          maxCorrectionCycles: 3,
          validator: async () => validations[calls++]!,
          fixer: async (fixPrompt: string) => `${initialResult}+${fixPrompt}`,
        })
        if (ralph.status === "passed") {
          return { outcome: "completed", result: ralph.finalResult }
        }
        return {
          outcome: "failed",
          result: ralph.finalResult,
          error: `[Hivemind] auto-loop attempt ${attempt} ralph exhausted: ${ralph.errors.join("; ")}`,
        }
      },
    )

    const result = await runAutoLoop({
      initialPrompt: "do work",
      maxIterations: 3,
      dispatcher,
      verifier,
    })

    expect(result.status).toBe("completed")
    expect(result.iterations).toBe(1)
    expect(result.finalResult).toBe("result-1+fix lint")
  })

  it("surfaces an exhausted ralph-loop as auto-loop failure", async () => {
    const dispatcher = vi.fn(async () => "broken")

    const verifier = vi.fn(
      async (initialResult: string, attempt: number): Promise<AutoLoopVerification<string>> => {
        const ralph = await runRalphLoop({
          initialResult,
          maxCorrectionCycles: 3,
          validator: async (): Promise<RalphValidation> => ({
            outcome: "failed",
            reason: "always broken",
            fixPrompt: "fix it",
          }),
          fixer: async () => "still broken",
        })
        if (ralph.status === "passed") {
          return { outcome: "completed", result: ralph.finalResult }
        }
        return {
          outcome: "failed",
          result: ralph.finalResult,
          error: `[Hivemind] auto-loop attempt ${attempt} ralph exhausted after ${ralph.cycles} cycles`,
        }
      },
    )

    const result = await runAutoLoop({
      initialPrompt: "do work",
      maxIterations: 3,
      dispatcher,
      verifier,
    })

    expect(result.status).toBe("failed")
    expect(result.error).toMatch(/^\[Hivemind\] auto-loop attempt 1 ralph exhausted after 3 cycles/)
    expect(result.iterations).toBe(1)
  })
})
