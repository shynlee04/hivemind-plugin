import { beforeEach, describe, expect, it, vi } from "vitest"

import { observeBackgroundCompletion } from "../../src/lib/lifecycle-background-observer.js"
import { CompletionDetector } from "../../src/lib/completion-detector.js"
import { createInMemoryClient } from "./helpers/in-memory-client.js"

type Controls = ReturnType<typeof setupObserver>

const assistant = (...types: string[]) => ({ role: "assistant", parts: types.map((type) => ({ type })) })
const user = (...types: string[]) => ({ role: "user", parts: types.map((type) => ({ type })) })

function continuity(sessionID: string, launchedAt = 0) {
  return { sessionID, metadata: { description: "observer rewrite", lifecycle: { launchedAt } } } as any
}

function setupObserver(status = "busy", options?: { launchedAt?: number; timeoutMs?: number }) {
  const sessionID = "child-123"
  const client = createInMemoryClient()
  client._sessions.set(sessionID, { id: sessionID, status: { type: status } })
  const detector = new CompletionDetector(10_000)
  const patchLifecycle = vi.fn()
  const releaseQueue = vi.fn()
  const record = continuity(sessionID, options?.launchedAt)
  let run: Promise<void> | undefined
  const start = () => (run ??= observeBackgroundCompletion({
    sessionID,
    client,
    completionDetector: detector,
    pollTimeoutMs: options?.timeoutMs ?? 20_000,
    now: () => Date.now(),
    getSessionContinuity: () => record,
    patchLifecycle,
    releaseQueue,
    sleepFn: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }))
  return {
    client,
    patchLifecycle,
    releaseQueue,
    async tick(ms: number) { start(); await vi.advanceTimersByTimeAsync(ms) },
    async finish() { await start() },
  }
}

async function expectError(control: Controls, detail: string, text: RegExp) {
  await control.finish()
  expect(control.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({
    status: "error", phase: "failed", error: expect.stringMatching(text), observation: expect.objectContaining({ detail }),
  }))
}

describe("observeBackgroundCompletion", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  /* WHY: Core completion path must wait for actual assistant output before declaring success.
   * WHAT: busy → idle with assistant evidence becomes completed after the stability window.
   * HOW: seed busy session, add assistant output, flip idle, then advance poll + detector timers.
   * CONNECTS TO: D-20, D-21, D-24 */
  it("completes when session goes idle after producing assistant output", async () => {
    const c = setupObserver()
    c.client._addMessage("child-123", assistant("text", "tool-call"))
    c.tick(0)
    c.client._setStatus("child-123", "idle")
    await c.tick(3000)
    await c.tick(10_000)
    await c.finish()
    expect(c.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", phase: "completed" }))
  })

  /* WHY: Bug D-17 regressed by treating the original user prompt as work evidence.
   * WHAT: idle with only user messages must keep polling instead of completing.
   * HOW: add a user-only message, flip idle, and let the poll deadline expire.
   * CONNECTS TO: D-17, D-24 */
  it("does NOT complete when session is idle but has no assistant messages", async () => {
    const c = setupObserver(undefined, { timeoutMs: 5000 })
    c.client._addMessage("child-123", user("text"))
    c.client._setStatus("child-123", "idle")
    await c.tick(6000)
    await expectError(c, "background-completion-poll-timeout", /timed out/i)
  })

  /* WHY: Deleted child sessions must surface an explicit failure instead of hanging forever.
   * WHAT: missing session records transition lifecycle state to error.
   * HOW: inject a getSession failure so lookup and fallback both treat the child as gone.
   * CONNECTS TO: D-20, D-24 */
  it("reports error when session is deleted during observation", async () => {
    const c = setupObserver()
    c.client._sessions.delete("child-123")
    await expectError(c, "background-completion-poll-deleted", /deleted/i)
  })

  /* WHY: Retry state means the child hit a terminal failure path that the parent must see.
   * WHAT: retry status produces a failed lifecycle patch with retry details.
   * HOW: mutate the in-memory session status to retry before the first poll resolves.
   * CONNECTS TO: D-21, D-24 */
  it("reports error when session enters retry state", async () => {
    const c = setupObserver("retry")
    await expectError(c, "background-completion-poll-retry", /retry/i)
  })

  /* WHY: Stuck busy sessions must fail deterministically so queues can recover.
   * WHAT: observer times out when no terminal state arrives before the deadline.
   * HOW: leave the in-memory session busy and advance fake timers past pollTimeoutMs.
   * CONNECTS TO: D-21, D-24 */
  it("times out when poll deadline expires", async () => {
    const c = setupObserver(undefined, { timeoutMs: 5000 })
    await c.tick(6000)
    await expectError(c, "background-completion-poll-timeout", /timed out/i)
  })

  /* WHY: Bug D-16 came from treating unknown statuses as busy and marking seenBusy too early.
   * WHAT: unknown → idle can complete only after the startup window and assistant evidence exist.
   * HOW: seed unknown status, provide assistant output, then advance past the first poll interval.
   * CONNECTS TO: D-16, D-24 */
  it("does not set seenBusy for unknown status", async () => {
    const c = setupObserver("unknown", { launchedAt: 0 })
    c.client._addMessage("child-123", assistant("text"))
    await c.tick(3000)
    c.client._setStatus("child-123", "idle")
    await c.tick(3000)
    await c.tick(10_000)
    await c.finish()
    expect(c.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", phase: "completed" }))
  })

  /* WHY: Queue release is the cleanup contract that prevents deadlocked delegated-session slots.
   * WHAT: each terminal path releases concurrency exactly once.
   * HOW: execute completed, retry, and timeout flows independently and assert one release per run.
   * CONNECTS TO: D-21, D-24 */
  it("releases concurrency queue on completion", async () => {
    const completed = setupObserver()
    completed.client._addMessage("child-123", assistant("text"))
    completed.client._setStatus("child-123", "idle")
    await completed.tick(3000)
    await completed.tick(10_000)
    await completed.finish()

    const retry = setupObserver("retry")
    await retry.finish()

    const timeout = setupObserver(undefined, { timeoutMs: 5000 })
    await timeout.tick(6000)
    await timeout.finish()

    expect(completed.releaseQueue).toHaveBeenCalledTimes(1)
    expect(retry.releaseQueue).toHaveBeenCalledTimes(1)
    expect(timeout.releaseQueue).toHaveBeenCalledTimes(1)
  })
})
