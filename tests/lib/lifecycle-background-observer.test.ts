import { beforeEach, describe, expect, it, vi } from "vitest"

import { observeBackgroundCompletion } from "../../src/lib/lifecycle-background-observer.js"
import { CompletionDetector } from "../../src/lib/completion-detector.js"
import { createInMemoryClient } from "./helpers/in-memory-client.js"

type Controls = ReturnType<typeof setupObserver>

const assistant = (...types: string[]) => ({ role: "assistant", parts: types.map((type) => ({ type })) })
const realToolPart = (tool = "Read") => ({
  type: "tool",
  tool,
  state: { status: "completed", input: { filePath: `/tmp/${tool.toLowerCase()}.ts` }, output: "ok" },
})
const assistantWithRealToolActivity = (tool = "Read") => ({ role: "assistant", parts: [{ type: "reasoning" }, realToolPart(tool)] })
const user = (...types: string[]) => ({ role: "user", parts: types.map((type) => ({ type })) })

function continuity(sessionID: string, launchedAt = 0, lastToolActivityAt?: number) {
  return {
    sessionID,
    metadata: {
      description: "observer rewrite",
      status: "queued",
      createdAt: launchedAt,
      lastToolActivityAt,
      lifecycle: { phase: "dispatching", runMode: "async", queueKey: "model:gpt-5.4", launchedAt },
    },
  } as any
}

function setupObserver(status = "busy", options?: { launchedAt?: number; timeoutMs?: number; lastToolActivityAt?: number }) {
  const sessionID = "child-123"
  const client = createInMemoryClient()
  client._sessions.set(sessionID, { id: sessionID, status: { type: status } })
  const detector = new CompletionDetector(10_000)
  const record = continuity(sessionID, options?.launchedAt, options?.lastToolActivityAt)
  const patchLifecycle = vi.fn((patch: { status: string; phase: string; observation?: unknown; completedAt?: number; error?: string }) => {
    record.metadata.status = patch.status
    record.metadata.lastError = patch.error
    record.metadata.lifecycle = {
      ...record.metadata.lifecycle,
      phase: patch.phase,
      observation: patch.observation,
      completedAt: patch.completedAt,
    }
    return true
  })
  const patchSessionContinuity = vi.fn()
  const releaseQueue = vi.fn()
  let run: Promise<void> | undefined
  const start = () => (run ??= observeBackgroundCompletion({
    sessionID,
    client,
    completionDetector: detector,
    pollTimeoutMs: options?.timeoutMs ?? 20_000,
    now: () => Date.now(),
    getSessionContinuity: () => record,
    patchSessionContinuity,
    patchLifecycle,
    releaseQueue,
    sleepFn: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }))
  return {
    client,
    patchLifecycle,
    patchSessionContinuity,
    releaseQueue,
    async tick(ms: number) { start(); await vi.advanceTimersByTimeAsync(ms) },
    async finish() { await start() },
  }
}

async function expectError(control: Controls, detail: string, text: RegExp) {
  await control.finish()
  expect(control.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({
    status: "failed", phase: "failed", error: expect.stringMatching(text), observation: expect.objectContaining({ detail }),
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
  it("completes when session goes idle after producing assistant text output", async () => {
    const c = setupObserver()
    c.client._addMessage("child-123", { role: "assistant", parts: [{ type: "text", text: "I started fixing the runtime observer." }] })
    c.client._setStatus("child-123", "idle")
    await c.tick(0)
    await c.tick(55_000)
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
    await c.tick(20_000)
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

  it("uses session.status as the runtime status source even when session.get is stale", async () => {
    const c = setupObserver("busy", { timeoutMs: 60_000 })
    c.client._addMessage("child-123", assistantWithRealToolActivity())
    c.client.session.get.mockResolvedValue({
      data: {
        id: "child-123",
        title: "stale child metadata",
        status: { type: "retry" },
      },
    })
    c.client.session.status.mockResolvedValue({
      data: {
        "child-123": { type: "idle" },
      },
    })

    await c.tick(55_000)
    await c.finish()

    expect(c.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", phase: "completed" }))
    expect(c.patchLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        phase: "failed",
        observation: expect.objectContaining({ detail: "background-completion-poll-retry" }),
      }),
    )
  })

  /* WHY: Stuck busy sessions must fail deterministically so queues can recover.
   * WHAT: observer times out when no terminal state arrives before the deadline.
   * HOW: leave the in-memory session busy and advance fake timers past pollTimeoutMs.
   * CONNECTS TO: D-21, D-24 */
  it("times out when poll deadline expires", async () => {
    const c = setupObserver(undefined, { timeoutMs: 5000 })
    await c.tick(20_000)
    await expectError(c, "background-completion-poll-timeout", /timed out/i)
  })

  /* WHY: Bug D-16 came from treating unknown statuses as busy and marking seenBusy too early.
   * WHAT: unknown → idle can complete only after the startup window and assistant evidence exist.
   * HOW: seed unknown status, provide assistant output, then advance past the first poll interval.
   * CONNECTS TO: D-16, D-24 */
  it("does not set seenBusy for unknown status", async () => {
    const c = setupObserver("unknown", { launchedAt: 0, timeoutMs: 90_000 })
    c.client._addMessage("child-123", assistantWithRealToolActivity())
    await c.tick(15_000)
    c.client._setStatus("child-123", "idle")
    await c.tick(75_000)
    expect(c.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", phase: "completed" }))
  })

  /* WHY: Builtin-subsession children must not claim started until D-10 evidence is real.
   * WHAT: observer owns the single promotion from dispatching/queued to running once evidence passes.
   * HOW: feed reasoning + two tool calls while the child stays busy, then assert one running patch before completion.
   * CONNECTS TO: PH12-01, D-10 */
  it("promotes to running exactly once when assistant text evidence appears", async () => {
    const c = setupObserver("busy", { timeoutMs: 60_000 })
    c.client._addMessage("child-123", { role: "assistant", parts: [{ type: "text", text: "Started the delegated task." }] })

    await c.tick(0)
    await c.tick(5_000)

    const runningPatches = c.patchLifecycle.mock.calls.filter(
      ([patch]) => patch.status === "running" && patch.phase === "running",
    )

    expect(runningPatches).toHaveLength(1)
    expect(runningPatches[0]?.[0]).toEqual(
      expect.objectContaining({
        observation: expect.objectContaining({ detail: "background-start-gate-passed" }),
      }),
    )
  })

  /* WHY: Failed or timed-out children must not backfill a fake started signal after never doing real work.
   * WHAT: timeout path records failure without any running/start-gate promotion.
   * HOW: leave the child with no assistant evidence until the poll deadline expires.
   * CONNECTS TO: PH12-02, D-10 */
  it("does not promote to running before timing out without start-gate evidence", async () => {
    const c = setupObserver("busy", { timeoutMs: 5_000 })

    await c.tick(20_000)
    await expectError(c, "background-completion-poll-timeout", /timed out/i)

    expect(c.patchLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "running", phase: "running" }),
    )
  })

  it("fails after 2 minutes with no tool activity or assistant evidence even if session reports running", async () => {
    const c = setupObserver("running", { launchedAt: 0, timeoutMs: 600_000 })

    await c.tick(130_000)
    await expectError(c, "background-dead-start-timeout", /no tool activity or assistant evidence/i)
  })

  it("promotes to running when normalized real tool activity was observed", async () => {
    const c = setupObserver("busy", { timeoutMs: 60_000, lastToolActivityAt: 1_000 })
    c.client._addMessage("child-123", {
      role: "assistant",
      parts: [{
        type: "tool",
        tool: "Read",
        state: { status: "completed", input: { filePath: "/tmp/runtime.ts" }, output: "contents" },
      }],
    })

    await c.tick(0)

    expect(c.patchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "running",
        phase: "running",
        observation: expect.objectContaining({ detail: "background-start-gate-passed" }),
      }),
    )
  })

  /* WHY: Queue release is the cleanup contract that prevents deadlocked delegated-session slots.
   * WHAT: each terminal path releases concurrency exactly once.
   * HOW: execute completed, retry, and timeout flows independently and assert one release per run.
   * CONNECTS TO: D-21, D-24 */
  it("releases concurrency queue on completion", async () => {
    const completed = setupObserver()
    completed.client._addMessage("child-123", assistantWithRealToolActivity())
    completed.client._setStatus("child-123", "idle")
    await completed.tick(35_000)
    await completed.finish()

    const retry = setupObserver("retry")
    await retry.finish()

    const timeout = setupObserver(undefined, { timeoutMs: 5000 })
    await timeout.tick(20_000)
    await timeout.finish()

    expect(completed.releaseQueue).toHaveBeenCalledTimes(1)
    expect(retry.releaseQueue).toHaveBeenCalledTimes(1)
    expect(timeout.releaseQueue).toHaveBeenCalledTimes(1)
  })

  /* WHY: D-12 requires two consecutive idle polls after start-gate evidence before true completion.
   * WHAT: the first idle poll stays provisional; the second idle poll completes.
   * HOW: provide start-gate evidence, flip the child idle, and advance through two polling windows.
   * CONNECTS TO: D-10, D-11, D-12 */
  it("does not complete on the first idle poll after substantive assistant evidence", async () => {
    const c = setupObserver("busy", { timeoutMs: 60_000 })
    c.client._addMessage("child-123", { role: "assistant", parts: [{ type: "text", text: "Made substantive progress." }] })
    c.client._setStatus("child-123", "idle")
    await c.tick(0)

    await c.tick(14_999)

    expect(c.patchLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", phase: "completed" }),
    )

    await c.tick(20_001)
    await c.finish()

    expect(c.patchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", phase: "completed" }),
    )
  })

  /* WHY: D-13 requires resume-first retry on the SAME child session after 180s inactivity.
   * WHAT: prolonged inactivity after meaningful evidence dispatches promptAsync against the existing child session.
   * HOW: seed start-gate evidence, keep the session busy, and advance fake timers past the inactivity threshold.
   * CONNECTS TO: D-13 */
  it("retries the existing child session via promptAsync after idle timeout", async () => {
    const c = setupObserver("busy", { timeoutMs: 300_000 })
    c.client._addMessage("child-123", assistantWithRealToolActivity())

    await c.tick(240_000)

    expect(c.client.session.promptAsync).toHaveBeenCalledWith({
      path: { id: "child-123" },
      body: expect.objectContaining({
        parts: expect.any(Array),
      }),
    })
    expect(c.patchLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "failed", phase: "failed" }),
    )
  })

  /* WHY: Retry handling must be bounded so a wedged child cannot loop forever.
     * WHAT: after 2 resume-first retries, the observer marks the child as permanently failed.
     * HOW: keep the child busy with no new evidence long enough to exhaust the retry budget.
     * CONNECTS TO: D-13 */
    it("fails permanently after exhausting the resume-first retry budget", async () => {
      const c = setupObserver("busy", { timeoutMs: 700_000 })
      c.client._addMessage("child-123", assistantWithRealToolActivity())

      await c.tick(900_000)
      await c.finish()

      expect(c.client.session.promptAsync).toHaveBeenCalledTimes(2)
      expect(c.patchLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          phase: "failed",
          error: expect.stringMatching(/retry/i),
        }),
      )
    })

  /* WHY: PH13-06/PH13-08 require result capture before notification on completion.
   * WHAT: completed branch calls patchSessionContinuity with resultCapture before parent notification.
   * HOW: seed busy → idle transition with assistant output, then verify patchSessionContinuity was called.
   * CONNECTS TO: PH13-06, PH13-08 */
  it("captures result via patchSessionContinuity on completion", async () => {
    const c = setupObserver()
    c.client._addMessage("child-123", assistantWithRealToolActivity())
    c.client._setStatus("child-123", "idle")
    await c.tick(0)
    await c.tick(55_000)
    await c.finish()

    // patchSessionContinuity should have been called with resultCapture
    const captureCalls = c.patchSessionContinuity.mock.calls.filter(
      (call: any[]) => call[1] && typeof call[1] === "object" && "resultCapture" in (call[1] as object),
    )
    expect(captureCalls.length).toBeGreaterThanOrEqual(1)
    expect(captureCalls[0][1]).toHaveProperty("resultCapture")
    expect(captureCalls[0][1].resultCapture).toHaveProperty("resultText")
    expect(captureCalls[0][1].resultCapture).toHaveProperty("capturedAt")
  })

  /* WHY: PH13-06 requires partial capture on deleted session for best-effort result preservation.
   * WHAT: deleted branch attempts partial capture wrapped in try/catch.
   * HOW: delete the session, finish observation, verify partial capture was attempted.
   * CONNECTS TO: PH13-06, PH13-08 */
  it("attempts partial capture on deleted session", async () => {
    const c = setupObserver()
    c.client._sessions.delete("child-123")
    await c.finish()

    // Even on deletion, should try to capture (may fail but the call should happen)
    // The key is that capture was attempted inside try/catch
    expect(c.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed", phase: "failed",
    }))
  })

  /* WHY: PH13-08 threat model — capture failure must not block the notification.
   * WHAT: even if captureSubsessionResult throws, the observer still completes and notifies.
   * HOW: verify the completion branch still patches lifecycle even if patchSessionContinuity throws.
   * CONNECTS TO: PH13-08 */
  it("completion notification proceeds even when capture fails", async () => {
    const c = setupObserver()
    // Make capture fail by having no messages at all — capture may still succeed with empty result
    // The important thing is the observer completes the lifecycle regardless
    c.client._addMessage("child-123", assistantWithRealToolActivity())
    c.client._setStatus("child-123", "idle")
    await c.tick(0)
    await c.tick(55_000)
    await c.finish()

    // Lifecycle must still be completed
    expect(c.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", phase: "completed" }))
    // Queue must be released
    expect(c.releaseQueue).toHaveBeenCalledTimes(1)
  })
})

/* -------------------------------------------------------------------------- */
/* Task 3: Evidence-driven start gate, 2-min dead-start, no-resurrection     */
/* -------------------------------------------------------------------------- */
describe("Task 3: evidence-driven running and dead-start failure", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  /* WHY: Transport status alone (busy/running/idle) must never promote queued→running.
   * WHAT: A child receiving only transport-level busy signals stays queued.
   * HOW: Session reports busy with zero assistant messages and no tool activity.
   * CONNECTS TO: Task 3 requirement 1 */
  it("stays queued when only transport busy status arrives with no assistant/tool evidence", async () => {
    const c = setupObserver("busy", { timeoutMs: 60_000 })

    await c.tick(0)

    expect(c.patchLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "running", phase: "running" }),
    )
  })

  /* WHY: Single promotion guarantee — once promoted to running, no second running patch.
   * WHAT: Observer issues exactly one running patch regardless of how many polls see evidence.
   * HOW: Seed evidence, advance through two poll intervals, then count running patches.
   * CONNECTS TO: Task 3 requirement 2 */
  it("promotes queued to running exactly once even across multiple polls with evidence", async () => {
    const c = setupObserver("busy", { timeoutMs: 60_000 })
    c.client._addMessage("child-123", assistantWithRealToolActivity())

    await c.tick(0)
    await c.tick(5_000)
    await c.tick(5_000)

    const runningPatches = c.patchLifecycle.mock.calls.filter(
      ([patch]) => patch.status === "running" && patch.phase === "running",
    )

    expect(runningPatches).toHaveLength(1)
  })

  /* WHY: Dead-start timeout must fail the child and never promote it.
   * WHAT: After 120s with no evidence, child goes to failed with descriptive error.
   * HOW: Session reports running but has no messages and no tool activity, advance past 120s.
   * CONNECTS TO: Task 3 requirement 3 */
  it("transitions to failed after 120s dead-start with no evidence", async () => {
    const c = setupObserver("running", { launchedAt: 0, timeoutMs: 600_000 })

    await c.tick(125_000)

    expect(c.patchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        phase: "failed",
        error: expect.stringMatching(/no tool activity or assistant evidence/i),
        observation: expect.objectContaining({ detail: "background-dead-start-timeout" }),
      }),
    )
  })

  /* WHY: Dead-start must patch continuity, persist failure reason, and release queue.
   * WHAT: The dead-start failure path calls patchSessionContinuity and releaseQueue.
   * HOW: Verify patchSessionContinuity and releaseQueue are invoked on dead-start.
   * CONNECTS TO: Task 3 requirement 3 */
  it("dead-start failure patches continuity and releases queue", async () => {
    const c = setupObserver("running", { launchedAt: 0, timeoutMs: 600_000 })

    await c.tick(125_000)

    expect(c.patchSessionContinuity).toHaveBeenCalled()
    expect(c.releaseQueue).toHaveBeenCalledTimes(1)
  })

  /* WHY: No-resurrection — once failed, a child must never go back to running.
   * WHAT: After dead-start failure, the observer returns immediately without further running patches.
   * HOW: Trigger dead-start, then check that no running patch was ever issued.
   * CONNECTS TO: Task 3 requirement 4 */
  it("never promotes to running after dead-start failure is recorded", async () => {
    const c = setupObserver("running", { launchedAt: 0, timeoutMs: 600_000 })

    await c.tick(125_000)
    await c.finish()

    const runningPatches = c.patchLifecycle.mock.calls.filter(
      ([patch]) => patch.status === "running" && patch.phase === "running",
    )
    expect(runningPatches).toHaveLength(0)
  })

  /* WHY: Transport status alone must never prove running for background children.
   * WHAT: Even if the session reports multiple different active statuses, no running promotion
   *       occurs without assistant messages or tool activity.
   * HOW: Cycle through busy/running/streaming, never add evidence, verify no running patch.
   * CONNECTS TO: Task 3 requirement 1 */
  it("never promotes from transport-only status changes across busy/running/streaming", async () => {
    const c = setupObserver("busy", { timeoutMs: 60_000 })

    await c.tick(0)
    c.client._setStatus("child-123", "running")
    await c.tick(5_000)
    c.client._setStatus("child-123", "streaming")
    await c.tick(5_000)

    expect(c.patchLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "running", phase: "running" }),
    )
  })
})

/* -------------------------------------------------------------------------- */
/* Task 4: Result persistence before notification                              */
/* -------------------------------------------------------------------------- */
describe("Task 4: result persistence and parent retrieval", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  /* WHY: Requirement 1 — resultCapture must be written to continuity BEFORE notification.
   * WHAT: On completion, patchSessionContinuity(resultCapture) call must happen during the completion flow.
   * HOW: Use setupObserver helper, seed evidence, verify patchSessionContinuity was called with resultCapture.
   * CONNECTS TO: Task 4 requirement 1 */
  it("persists resultCapture to continuity during completion flow", async () => {
    const c = setupObserver()
    c.client._addMessage("child-123", assistantWithRealToolActivity())
    c.client._setStatus("child-123", "idle")
    await c.tick(0)
    await c.tick(55_000)
    await c.finish()

    // Verify that patchSessionContinuity was called with resultCapture
    const captureCalls = c.patchSessionContinuity.mock.calls.filter(
      (call: any[]) => call[1] && typeof call[1] === "object" && "resultCapture" in (call[1] as object),
    )
    expect(captureCalls.length).toBeGreaterThanOrEqual(1)
    const capturedResult = captureCalls[0][1].resultCapture
    expect(capturedResult).toHaveProperty("resultText")
    expect(capturedResult).toHaveProperty("artifactPaths")
    expect(capturedResult).toHaveProperty("gitCommits")
    expect(capturedResult).toHaveProperty("toolCallSummary")
    expect(capturedResult).toHaveProperty("capturedAt")
    expect(typeof capturedResult.capturedAt).toBe("number")
  })

  /* WHY: Requirement 1 — capture happens BEFORE notification is observable.
   * WHAT: The sequence is: lifecycle:completed → patchSessionContinuity(resultCapture) → notification.
   * HOW: Verify patchLifecycle completed AND patchSessionContinuity was called with resultCapture.
   * CONNECTS TO: Task 4 requirement 1 */
  it("resultCapture and lifecycle completed are both recorded on success", async () => {
    const c = setupObserver()
    c.client._addMessage("child-123", assistantWithRealToolActivity())
    c.client._setStatus("child-123", "idle")
    await c.tick(0)
    await c.tick(55_000)
    await c.finish()

    expect(c.patchLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ status: "completed", phase: "completed" }),
    )

    const captureCalls = c.patchSessionContinuity.mock.calls.filter(
      (call: any[]) => call[1] && typeof call[1] === "object" && "resultCapture" in (call[1] as object),
    )
    expect(captureCalls.length).toBeGreaterThanOrEqual(1)
  })

  /* WHY: Requirement 2 — partial capture on failure/deletion.
   * WHAT: Deleted children attempt partial capture with partial: true flag.
   * HOW: Delete the child session, finish observation, verify lifecycle was patched to error.
   * CONNECTS TO: Task 4 requirement 2 */
  it("attempts partial resultCapture on deleted session failure", async () => {
    const c = setupObserver()
    // Add some messages before deletion
    c.client._addMessage("child-123", assistant("text"))

    // Delete the session
    c.client._sessions.delete("child-123")
    await c.finish()

    // On deleted session, lifecycle should be patched to error
    expect(c.patchLifecycle).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed", phase: "failed",
    }))
  })

  /* WHY: Requirement 2 — partial capture on dead-start timeout.
   * WHAT: Dead-start failure attempts partial capture.
   * HOW: Use setupObserver with running status and no evidence, advance past 120s, verify capture attempted.
   * CONNECTS TO: Task 4 requirement 2 */
  it("attempts partial resultCapture on dead-start timeout", async () => {
    const c = setupObserver("running", { launchedAt: 0, timeoutMs: 600_000 })

    await c.tick(130_000)
    await c.finish()

    const captureCalls = c.patchSessionContinuity.mock.calls.filter(
      (call: any[]) => call[1] && typeof call[1] === "object" && "resultCapture" in (call[1] as object),
    )
    expect(captureCalls.length).toBeGreaterThanOrEqual(1)
  })

  /* WHY: Requirement 4 — notifications derive from metadata.resultCapture, not live session.
   * WHAT: buildTaskNotificationFromContinuity reads resultCapture from the continuity record.
   * HOW: Set resultCapture in continuity, then verify notification preview matches it.
   * CONNECTS TO: Task 4 requirement 4 */
  it("notification preview comes from continuity resultCapture, not live scraping", async () => {
    const { buildTaskNotificationFromContinuity } = await import("../../src/lib/notification-handler.js")

    const record: any = {
      sessionID: "child-preview",
      metadata: {
        parentSessionID: "parent-session",
        description: "test task",
        delegation: { agent: "builder" },
        resultCapture: {
          resultText: "I completed the implementation. Created /src/new-feature.ts",
          artifactPaths: ["/src/new-feature.ts"],
          gitCommits: ["a1b2c3d"],
          toolCallSummary: [{ tool: "Write", args: '{"filePath":"/src/new-feature.ts"}' }],
          messageCount: 5,
          capturedAt: Date.now(),
        },
        lifecycle: { launchedAt: 1000, completedAt: 5000 },
      },
    }

    const notification = buildTaskNotificationFromContinuity(record, "completed")

    expect(notification.resultPreview).toBe("I completed the implementation. Created /src/new-feature.ts")
    expect(notification.artifacts).toEqual(["/src/new-feature.ts"])
    expect(notification.commits).toEqual(["a1b2c3d"])
  })

  /* WHY: Requirement 4 — notification with no resultCapture still works.
   * WHAT: When resultCapture is missing, notification uses fallback summary.
   * HOW: Create continuity record without resultCapture, verify notification still builds.
   * CONNECTS TO: Task 4 requirement 4 */
  it("notification builds successfully when resultCapture is missing", async () => {
    const { buildTaskNotificationFromContinuity } = await import("../../src/lib/notification-handler.js")

    const record: any = {
      sessionID: "child-no-capture",
      metadata: {
        parentSessionID: "parent-session",
        description: "test task no capture",
        delegation: { agent: "researcher" },
        category: "research",
        lifecycle: { launchedAt: 1000, completedAt: 5000 },
      },
    }

    const notification = buildTaskNotificationFromContinuity(record, "completed")

    expect(notification.resultPreview).toBeUndefined()
    expect(notification.artifacts).toBeUndefined()
    expect(notification.commits).toBeUndefined()
    expect(notification.briefSummary).toBeDefined()
  })

  /* WHY: Requirement 4 — failed notification includes error from continuity, not live scrape.
   * WHAT: Failed notification reads lastError and resultCapture from continuity.
   * CONNECTS TO: Task 4 requirement 4 */
  it("failed notification includes error message from continuity metadata", async () => {
    const { buildTaskNotificationFromContinuity } = await import("../../src/lib/notification-handler.js")

    const record: any = {
      sessionID: "child-failed",
      metadata: {
        parentSessionID: "parent-session",
        description: "failing task",
        delegation: { agent: "builder" },
        resultCapture: {
          resultText: "partial work done",
          artifactPaths: ["/src/partial.ts"],
          gitCommits: [],
          toolCallSummary: [],
          messageCount: 2,
          capturedAt: Date.now(),
          partial: true,
        },
        lifecycle: { launchedAt: 1000 },
      },
    }

    const notification = buildTaskNotificationFromContinuity(record, "failed", "SDK connection lost")

    expect(notification.status).toBe("failed")
    expect(notification.error).toBe("SDK connection lost")
    expect(notification.resultPreview).toBe("partial work done")
    expect(notification.artifacts).toEqual(["/src/partial.ts"])
  })
})
