import { describe, expect, it, vi } from "vitest"

import { runLifecycleSubsessionTask } from "../../src/lib/lifecycle-process-runner.js"

describe("runLifecycleSubsessionTask sync envelope", () => {
  it("returns parsed JSON with an output field that decodes to the assistant text", async () => {
    const patchLifecycle = vi.fn(() => true)
    const releaseQueue = vi.fn()

    const result = await runLifecycleSubsessionTask({
      sessionID: "child-sync",
      parentSessionID: "parent-sync",
      rootID: "root-sync",
      childDepth: 1,
      agent: "builder",
      category: "implementation",
      model: "claude-sonnet-4-6",
      description: "sync envelope contract",
      route: { family: "built-in", submode: "builtin-subsession" },
      body: { prompt: "Do the task" },
      runInBackground: false,
      client: {
        session: {
          prompt: vi.fn(async () => ({
            data: {
              parts: [{ type: "text", text: "sync runner output" }],
            },
          })),
        },
      } as never,
      completionDetector: {} as never,
      pollTimeoutMs: 50,
      getSessionContinuity: vi.fn(() => undefined),
      patchLifecycle,
      getLifecycleSnapshot: vi.fn(() => undefined),
      releaseQueue,
      queueSnapshot: { active: 0, pending: 0, limit: 1 },
      budgetUsed: 0,
      launchedAt: 1,
      now: () => 123,
    })

    const parsed = JSON.parse(result) as { output?: string; mode?: string; ok?: boolean }

    expect(parsed.ok).toBe(true)
    expect(parsed.mode).toBe("sync")
    expect(parsed.output).toBeTypeOf("string")
    expect(Buffer.from(parsed.output ?? "", "base64").toString("utf8")).toBe("sync runner output")
    expect(patchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionID: "child-sync",
        status: "completed",
        phase: "completed",
      }),
    )
    expect(releaseQueue).toHaveBeenCalledWith("sync-complete")
  })
})
