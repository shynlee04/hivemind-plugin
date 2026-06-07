import { describe, expect, it, vi } from "vitest"

import { runAutoLoop } from "../../src/coordination/spawner/auto-loop.js"
import type { AutoLoopVerification } from "../../src/coordination/spawner/auto-loop.js"

describe("auto-loop — PH39-01 self-referential dev loop", () => {
  it("returns completed when the first dispatch satisfies the verifier", async () => {
    const dispatcher = vi.fn().mockResolvedValue({ text: "done" })
    const verifier = vi.fn(
      async (result: { text: string }): Promise<AutoLoopVerification<{ text: string }>> => ({
        outcome: "completed",
        result,
      }),
    )

    const result = await runAutoLoop({
      initialPrompt: "do the thing",
      maxIterations: 5,
      dispatcher,
      verifier,
    })

    expect(result.status).toBe("completed")
    expect(result.iterations).toBe(1)
    expect(result.finalResult).toEqual({ text: "done" })
    expect(dispatcher).toHaveBeenCalledTimes(1)
    expect(dispatcher).toHaveBeenCalledWith("do the thing", 1)
    expect(verifier).toHaveBeenCalledTimes(1)
  })

  it("loops needs_continuation responses until the verifier reports completed", async () => {
    const dispatcher = vi.fn(async (prompt: string, attempt: number) => `result-${attempt}-${prompt}`)
    let calls = 0
    const verifier = vi.fn(
      async (result: string): Promise<AutoLoopVerification<string>> => {
        calls += 1
        if (calls < 3) {
          return { outcome: "needs_continuation", result, nextPrompt: `continue-${calls}` }
        }
        return { outcome: "completed", result }
      },
    )

    const result = await runAutoLoop({
      initialPrompt: "start",
      maxIterations: 5,
      dispatcher,
      verifier,
    })

    expect(result.status).toBe("completed")
    expect(result.iterations).toBe(3)
    expect(dispatcher).toHaveBeenNthCalledWith(1, "start", 1)
    expect(dispatcher).toHaveBeenNthCalledWith(2, "continue-1", 2)
    expect(dispatcher).toHaveBeenNthCalledWith(3, "continue-2", 3)
  })

  it("returns exhausted when maxIterations is reached without completion", async () => {
    const dispatcher = vi.fn(async () => "result")
    const verifier = vi.fn(
      async (result: string): Promise<AutoLoopVerification<string>> => ({
        outcome: "needs_continuation",
        result,
        nextPrompt: "again",
      }),
    )

    const result = await runAutoLoop({
      initialPrompt: "start",
      maxIterations: 3,
      dispatcher,
      verifier,
    })

    expect(result.status).toBe("exhausted")
    expect(result.iterations).toBe(3)
    expect(result.finalResult).toBe("result")
    expect(dispatcher).toHaveBeenCalledTimes(3)
  })

  it("returns failed when the verifier reports task-level failure", async () => {
    const dispatcher = vi.fn(async () => "partial")
    const verifier = vi.fn(
      async (result: string): Promise<AutoLoopVerification<string>> => ({
        outcome: "failed",
        result,
        error: "task validation failed",
      }),
    )

    const result = await runAutoLoop({
      initialPrompt: "start",
      maxIterations: 5,
      dispatcher,
      verifier,
    })

    expect(result.status).toBe("failed")
    expect(result.error).toBe("task validation failed")
    expect(result.finalResult).toBe("partial")
    expect(result.iterations).toBe(1)
  })

  it("propagates dispatcher rejection as a [Hivemind]-prefixed throw", async () => {
    const dispatcher = vi.fn(async () => {
      throw new Error("session spawn failed")
    })
    const verifier = vi.fn()

    await expect(
      runAutoLoop({
        initialPrompt: "start",
        maxIterations: 3,
        dispatcher,
        verifier,
      }),
    ).rejects.toThrow(/^\[Harness\] auto-loop dispatcher failed/)
    expect(verifier).not.toHaveBeenCalled()
  })

  it("propagates verifier rejection as a [Hivemind]-prefixed throw (matches dispatcher pattern)", async () => {
    const dispatcher = vi.fn().mockResolvedValue({ text: "result" })
    const verifier = vi.fn(async () => {
      throw new Error("verifier crashed")
    })

    await expect(
      runAutoLoop({
        initialPrompt: "start",
        maxIterations: 3,
        dispatcher,
        verifier,
      }),
    ).rejects.toThrow(/^\[Harness\] auto-loop verifier failed on attempt 1: verifier crashed/)
    expect(dispatcher).toHaveBeenCalledTimes(1)
  })

  it("rejects non-positive maxIterations with a [Hivemind] error", async () => {
    await expect(
      runAutoLoop({
        initialPrompt: "x",
        maxIterations: 0,
        dispatcher: vi.fn(),
        verifier: vi.fn(),
      }),
    ).rejects.toThrow(/^\[Harness\] auto-loop maxIterations/)
  })

  it("passes the attempt index to both dispatcher and verifier", async () => {
    const dispatcher = vi.fn(async () => "x")
    const verifier = vi.fn(async (result: string, attempt: number): Promise<AutoLoopVerification<string>> => {
      if (attempt < 2) return { outcome: "needs_continuation", result, nextPrompt: "next" }
      return { outcome: "completed", result }
    })

    await runAutoLoop({ initialPrompt: "p", maxIterations: 5, dispatcher, verifier })

    expect(verifier).toHaveBeenNthCalledWith(1, "x", 1)
    expect(verifier).toHaveBeenNthCalledWith(2, "x", 2)
  })
})
