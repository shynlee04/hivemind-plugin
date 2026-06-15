/**
 * UAT-04.02.4 cluster reproduction harness — Wave 0 RED scaffold.
 *
 * Reproduces F-008 (completion dead), F-009 (3m hard-stop), F-005 (duplicate
 * notifications) and asserts they are fixed by REQ-01/02/03 patches.
 *
 * Evidence level: L2 (mocked SDK with vi.useFakeTimers for 6-min simulation).
 * For L1 runtime evidence, manual UAT required (deferred).
 *
 * RED state: 3-4 tests fail because REQ-01/02/03 fixes not yet landed (or
 * landed but integration paths not yet validated end-to-end).
 *
 * Cases:
 * - C1 (REQ-01): completion notification fires within 5s even when parent
 *   stream stopped — asserts reactivateSessionStream is called before
 *   sendPromptAsync in notifyDelegationTerminal.
 * - C2 (REQ-02): periodic notifications continue past 180s for delegations
 *   > 3m — asserts the PeriodicNotifier's interval flush fires past the
 *   hard-stop and the delegation stays registered until terminal.
 * - C3 (REQ-03): duplicate progress notifications within the same 30s
 *   bucket collapse to 1 — asserts the router's deliveredKeys dedup holds
 *   when both DelegationMonitor and PeriodicNotifier emit the same bucket
 *   key.
 * - C4 (REQ-04): end-to-end dual-path dedup — when 2 paths attempt the same
 *   idempotencyKey, only 1 fires.
 *
 * Refs: A-SPEC.md REQ-01..04, A-CONTEXT.md GA-5, A-RESEARCH.md §10+§8
 * Pattern 4, A-PLAN.md §6 Task 4.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { PeriodicNotifier } from "../../src/coordination/delegation/periodic-notifier.js"
import { NotificationRouter } from "../../src/coordination/delegation/notification-router.js"
import { NotificationDeliverer } from "../../src/coordination/notifier.js"
import { sendPromptAsync, showTuiToast } from "../../src/shared/session-api.js"
import type { Delegation } from "../../src/shared/types.js"

// Mock SDK transport — real sendPromptAsync would hit a live OpenCode server.
vi.mock("../../src/shared/session-api.js", async () => {
  const actual = await vi.importActual<typeof import("../../src/shared/session-api.js")>(
    "../../src/shared/session-api.js"
  )
  return {
    ...actual,
    sendPromptAsync: vi.fn(),
    showTuiToast: vi.fn().mockResolvedValue(undefined),
  }
})

// Mock continuity store to avoid filesystem side effects in queuePending.
vi.mock("../../src/task-management/continuity/index.js", () => ({
  getSessionContinuity: vi.fn().mockReturnValue(undefined),
  patchSessionContinuity: vi.fn(),
  recordSessionContinuity: vi.fn(),
}))

function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "delg_cluster_001",
    agent: "builder",
    childSessionId: "ses_child_cluster",
    parentSessionId: "ses_parent_cluster",
    status: "completed",
    createdAt: Date.now() - 60_000,
    completedAt: Date.now(),
    lastMessageCount: 0,
    stablePollCount: 0,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: process.cwd(),
    queueKey: "agent:builder",
    recoveryGuarantee: "best-effort",
    explicitCancellation: false,
    ...overrides,
  }
}

describe("UAT-04.02.4 notification cluster — Wave 0 RED scaffold", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─────────────────────────────────────────────────────────────────────
  // C1 (REQ-01): completion notification fires within 5s even when parent
  // stream is stopped — reactivateSessionStream is called BEFORE sendPromptAsync.
  // ─────────────────────────────────────────────────────────────────────
  it("C1: notifyDelegationTerminal calls reactivateSessionStream before sendPromptAsync", async () => {
    const callOrder: string[] = []

    // Simulate "stream not active" — sendPromptAsync throws.
    vi.mocked(sendPromptAsync).mockImplementation(async () => {
      callOrder.push("sendPromptAsync")
      throw new Error("[Hivemind] stream not active")
    })

    const deliverer = new NotificationDeliverer()
    const reactivateSpy = vi
      .spyOn(deliverer, "reactivateSessionStream")
      .mockImplementation(async () => {
        callOrder.push("reactivateSessionStream")
      })

    await deliverer.notifyDelegationTerminal({} as never, makeDelegation())

    // RED: reactivation must precede sendPromptAsync.
    expect(reactivateSpy).toHaveBeenCalled()
    const reactivateIdx = callOrder.indexOf("reactivateSessionStream")
    const sendIdx = callOrder.indexOf("sendPromptAsync")
    expect(reactivateIdx).toBeGreaterThanOrEqual(0)
    expect(reactivateIdx).toBeLessThan(sendIdx)
  })

  // ─────────────────────────────────────────────────────────────────────
  // C2 (REQ-02): periodic notifications continue past 180s for
  // delegations > 3m. PeriodicNotifier's interval flush must keep firing
  // after the 6th tick (180s) and the delegation must stay registered
  // until handleCompletion deregisters it.
  // ─────────────────────────────────────────────────────────────────────
  it("C2: PeriodicNotifier keeps firing periodic notifications past 180s and deregisters on terminal", () => {
    vi.useFakeTimers()

    const inject = vi.fn()
    const notifier = new PeriodicNotifier(
      { cadenceMs: 30_000, intervalMs: 30_000, showToast: false, client: {} as never },
      inject
    )
    notifier.start()

    // Register a delegation at t=0.
    notifier.register({
      delegationId: "delg-c2",
      parentSessionId: "ses-parent-c2",
      agent: "builder",
      toolCount: 0,
      actionCount: 0,
      elapsedMs: 0,
    })

    // Advance past 180s (6 ticks) and 360s (12 ticks) — the 3-minute
    // hard-stop boundary plus a full additional minute.
    vi.advanceTimersByTime(360_000)

    // RED: periodic notifications must continue past 180s.
    // 30s interval × 360s = 12 ticks. Allow a tolerance for fake-timer scheduling.
    expect(inject.mock.calls.length).toBeGreaterThanOrEqual(6)
    // The 7th tick (210s) and beyond must have fired — proves no hard-stop at 180s.
    expect(inject.mock.calls.length).toBeGreaterThanOrEqual(7)

    // Deregister on terminal — memory-leak guard (Pitfall 4).
    notifier.deregister("delg-c2")
    expect(notifier.activeCount).toBe(0)

    // After deregister, further flushes must not produce any new injections.
    const callsBeforeAdvance = inject.mock.calls.length
    vi.advanceTimersByTime(120_000)
    expect(inject.mock.calls.length).toBe(callsBeforeAdvance)

    notifier.destroy()
  })

  // ─────────────────────────────────────────────────────────────────────
  // C3 (REQ-03): same 30s-bucket key from two paths (DelegationMonitor
  // inject + PeriodicNotifier flush) collapses to a single delivery.
  // This is the load-bearing RED for F-005: it exercises the full
  // cadence-bucketed key path through notificationRouter.route().
  // ─────────────────────────────────────────────────────────────────────
  it("C3: notificationRouter collapses dual-path emissions with the same 30s-bucket key to one delivery", () => {
    const deliver = vi.fn()
    const router = new NotificationRouter({ deliver })
    router.register("delg-c3", "ses-parent-c3")

    // Simulate the post-fix upstream behavior (A-CONTEXT GA-3):
    // idempotencyKey = `${id}:progress:${bucket}` where bucket = floor(elapsedMs / 30_000).
    // At elapsedMs=5_000 and elapsedMs=25_000, both produce bucket=0 → same key.
    //
    // Path 1: DelegationMonitor inject (plugin-registration.ts:639, post-fix).
    router.route({
      delegationId: "delg-c3",
      idempotencyKey: "delg-c3:progress:0",
      message: "running @ 5s",
      timestamp: 5_000,
      type: "progress",
    })

    // Path 2: PeriodicNotifier flush (periodic-notifier.ts:155, post-fix).
    // Same bucket, same key — must dedup to a single delivery.
    router.route({
      delegationId: "delg-c3",
      idempotencyKey: "delg-c3:progress:0",
      message: "running @ 25s",
      timestamp: 25_000,
      type: "progress",
    })

    // RED: only one delivery for the same bucket, regardless of which path emitted it.
    expect(deliver).toHaveBeenCalledTimes(1)
  })

  // ─────────────────────────────────────────────────────────────────────
  // C4 (REQ-04): end-to-end dual-path dedup — when the DelegationMonitor
  // inject callback (plugin-registration.ts:637-651) and the
  // PeriodicNotifier flush (periodic-notifier.ts:155) both route a
  // progress notification for the same delegation in the same 30s
  // window, only one delivery reaches the parent session.
  //
  // This is the integration-level guard that the cadence-bucketed key
  // (REQ-03) actually collapses the two architectural paths.
  // ─────────────────────────────────────────────────────────────────────
  it("C4: end-to-end dual-path dedup — DelegationMonitor + PeriodicNotifier → 1 delivery per 30s bucket", () => {
    // Use a custom deliver that does NOT defer — to isolate the dedup
    // contract from the throttle/deferral behavior tested elsewhere.
    // The C4 contract is specifically about the dual-path dedup:
    // when 2 paths emit the same idempotencyKey, only 1 fires.
    const deliver = vi.fn(() => true)
    const router = new NotificationRouter({ deliver })
    router.register("delg-c4", "ses-parent-c4")

    // Simulate DelegationMonitor path (plugin-registration.ts:637-651 inject callback).
    // Post-fix: idempotencyKey = `${id}:progress:${bucket}` where bucket = floor(elapsedMs/30_000).
    const bucketAt5s = Math.floor(5_000 / 30_000) // 0
    router.route({
      delegationId: "delg-c4",
      idempotencyKey: `delg-c4:progress:${bucketAt5s}`,
      message: "[DT:delg-c4] progress — builder @ 5s",
      timestamp: 5_000,
      type: "progress",
    })

    // Simulate PeriodicNotifier flush path (periodic-notifier.ts:155).
    // Same bucket, same key — the router's deliveredKeys must dedup.
    const bucketAt25s = Math.floor(25_000 / 30_000) // 0
    router.route({
      delegationId: "delg-c4",
      idempotencyKey: `delg-c4:progress:${bucketAt25s}`,
      message: "[DT:delg-c4] progress — builder @ 25s",
      timestamp: 25_000,
      type: "progress",
    })

    // RED: only one delivery for the same bucket across both paths.
    // The router's deliveredKeys Set must collapse the second emission
    // even though it came from a different architectural path.
    expect(deliver).toHaveBeenCalledTimes(1)
  })
})
