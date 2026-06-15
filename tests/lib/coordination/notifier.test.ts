/**
 * Tests for NotificationDeliverer — REQ-01: stream reactivation before sendPromptAsync.
 *
 * F-008 (P1 regression): state-machine.ts:307 calls notifyDelegationTerminal
 * fire-and-forget. When parent stream is stopped, sendPromptAsync throws.
 * The error handler queues the notification into the continuity store but
 * never calls reactivateSessionStream() (which exists at notifier.ts:368 but
 * has 0 callers). Result: completion notification never reaches parent.
 *
 * This test asserts the post-fix contract:
 * - reactivateSessionStream is called BEFORE sendPromptAsync inside notifyDelegationTerminal
 * - The parent stream is reawakened even when sendPromptAsync initially fails
 *
 * RED: test fails because the current code does NOT call reactivateSessionStream
 * before sendPromptAsync. After REQ-01 fix (insert 1 line at notifier.ts:343-344),
 * this test will turn GREEN.
 *
 * Evidence label: transport-mocked (real NotificationDeliverer class, mocked SDK transport)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

import { NotificationDeliverer } from "../../../src/coordination/notifier.js"
import { sendPromptAsync, showTuiToast } from "../../../src/shared/session-api.js"
import type { Delegation } from "../../../src/shared/types.js"

// Mock the SDK transport layer — real sendPromptAsync would hit a live OpenCode server.
vi.mock("../../../src/shared/session-api.js", async () => {
  const actual = await vi.importActual<typeof import("../../../src/shared/session-api.js")>(
    "../../../src/shared/session-api.js"
  )
  return {
    ...actual,
    sendPromptAsync: vi.fn(),
    showTuiToast: vi.fn().mockResolvedValue(undefined),
  }
})

// Mock continuity store to avoid filesystem side effects when queuePending fires.
vi.mock("../../../src/task-management/continuity/index.js", () => ({
  getSessionContinuity: vi.fn().mockReturnValue(undefined),
  patchSessionContinuity: vi.fn(),
  recordSessionContinuity: vi.fn(),
}))

function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "delg_req01_001",
    agent: "researcher",
    childSessionId: "ses_child_001",
    parentSessionId: "ses_parent_001",
    status: "completed",
    createdAt: Date.now() - 60_000,
    completedAt: Date.now(),
    lastMessageCount: 0,
    stablePollCount: 0,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: process.cwd(),
    queueKey: "agent:test",
    recoveryGuarantee: "best-effort",
    explicitCancellation: false,
    ...overrides,
  }
}

describe("REQ-01: NotificationDeliverer.notifyDelegationTerminal reactivates parent stream", () => {
  let deliverer: NotificationDeliverer

  beforeEach(() => {
    vi.clearAllMocks()
    deliverer = new NotificationDeliverer()
  })

  it("calls reactivateSessionStream before sendPromptAsync when parent stream is stopped", async () => {
    // Track call order to assert reactivation precedes injection.
    const callOrder: string[] = []

    // Simulate "stream not active" — sendPromptAsync throws on the first attempt.
    // After fix, reactivateSessionStream should fire first; if reactivation succeeds,
    // the second sendPromptAsync may succeed. We only assert ordering here.
    vi.mocked(sendPromptAsync).mockImplementation(async () => {
      callOrder.push("sendPromptAsync")
      throw new Error("[Hivemind] stream not active")
    })

    // Spy on reactivateSessionStream — replace it with a tracking stub.
    // The real implementation also calls sendPromptAsync internally; we replace it
    // entirely to isolate the call-order assertion from internal SDK behavior.
    const reactivateSpy = vi
      .spyOn(deliverer, "reactivateSessionStream")
      .mockImplementation(async () => {
        callOrder.push("reactivateSessionStream")
      })

    await deliverer.notifyDelegationTerminal({} as never, makeDelegation())

    // RED: reactivateSessionStream must have been called.
    expect(reactivateSpy).toHaveBeenCalled()
    // RED: reactivation must precede the sendPromptAsync injection attempt.
    const reactivateIdx = callOrder.indexOf("reactivateSessionStream")
    const sendIdx = callOrder.indexOf("sendPromptAsync")
    expect(reactivateIdx).toBeGreaterThanOrEqual(0)
    expect(sendIdx).toBeGreaterThanOrEqual(0)
    expect(reactivateIdx).toBeLessThan(sendIdx)
  })

  it("reactivates parent stream with the correct parent session id", async () => {
    vi.mocked(sendPromptAsync).mockRejectedValue(new Error("[Hivemind] stream not active"))
    const reactivateSpy = vi.spyOn(deliverer, "reactivateSessionStream").mockResolvedValue()

    const delegation = makeDelegation({ parentSessionId: "ses_parent_specific" })
    await deliverer.notifyDelegationTerminal({} as never, delegation)

    // RED: reactivation must target the actual parent session id of the delegation.
    expect(reactivateSpy).toHaveBeenCalledWith(expect.anything(), "ses_parent_specific")
  })
})
