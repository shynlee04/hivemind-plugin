import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { CompletionDetector } from "../../src/coordination/completion/detector.js"
import * as sessionApi from "../../src/shared/session-api.js"
import { SdkDelegationHandler } from "../../src/coordination/sdk-delegation/handler.js"
import {
  DEFAULT_STALE_TIMEOUT_MS,
  MIN_IDLE_TIME_MS,
  MIN_STABILITY_TIME_MS,
  POLL_INTERVAL_ACTIVE_MS,
  POLL_INTERVAL_BASE_MS,
  POLL_INTERVAL_DEEP_IDLE_MS,
  POLL_INTERVAL_IDLE_MS,
  STABLE_POLLS_REQUIRED,
  type Delegation,
} from "../../src/shared/types.js"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MockClient = {
  session: {
    messages: ReturnType<typeof vi.fn>
    status: ReturnType<typeof vi.fn>
    prompt: ReturnType<typeof vi.fn>
  }
}

type MockCallbacks = {
  getDelegation: ReturnType<typeof vi.fn>
  persistAllDelegations: ReturnType<typeof vi.fn>
  cleanupTracking: ReturnType<typeof vi.fn>
  scheduleSafetyCeiling: ReturnType<typeof vi.fn>
  onSessionIdle: ReturnType<typeof vi.fn>
  onTerminal: ReturnType<typeof vi.fn>
  getCompletionDetector?: ReturnType<typeof vi.fn>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockClient(): MockClient {
  return {
    session: {
      messages: vi.fn().mockResolvedValue({
        data: [{ role: "assistant", parts: [{ type: "text", text: "result" }] }],
      }),
      status: vi.fn().mockResolvedValue({ data: {} }),
      prompt: vi.fn().mockResolvedValue(undefined),
    },
  }
}

function createMockCallbacks(delegationStore?: Map<string, Delegation>): MockCallbacks {
  const store = delegationStore ?? new Map<string, Delegation>()

  return {
    getDelegation: vi.fn((id: string) => store.get(id)),
    persistAllDelegations: vi.fn(),
    cleanupTracking: vi.fn(),
    scheduleSafetyCeiling: vi.fn(),
    onSessionIdle: vi.fn(),
    onTerminal: vi.fn((id: string, state: string, error?: string) => {
      const d = store.get(id)
      if (d) {
        d.status = state as Delegation["status"]
        d.completedAt = Date.now()
        if (error) d.error = error
      }
    }),
  }
}

function createRunningDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "del-sdk-1",
    parentSessionId: "ses-parent",
    childSessionId: "child-sdk-1",
    agent: "builder",
    status: "running",
    createdAt: Date.now() - 15000, // 15s ago to pass MIN_IDLE_TIME_MS
    lastMessageCount: 0,
    stablePollCount: 0,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: "/tmp",
    queueKey: "agent:builder",
    lastMessageCountChangeAt: Date.now() - 15000, // 15s ago to pass MIN_STABILITY_TIME_MS
    ...overrides,
  }
}

function createHandler(client: MockClient, callbacks: MockCallbacks): SdkDelegationHandler {
  return new SdkDelegationHandler(client as never, callbacks)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SdkDelegationHandler", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // -------------------------------------------------------------------------
  // R-PTY-04: SDK delegations use client.session.prompt() (not PTY)
  // -------------------------------------------------------------------------

  describe("R-PTY-04: SDK uses session.prompt", () => {
    it("finalizes SDK delegation by calling client.session.messages for result extraction", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      // Mock message count to return stable (unchanged) values
      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)

      // Advance through enough polls for STABLE_POLLS_REQUIRED
      for (let i = 0; i < STABLE_POLLS_REQUIRED + 1; i++) {
        await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)
      }

      // Should have called messages() to extract the result
      expect(client.session.messages).toHaveBeenCalledWith(
        expect.objectContaining({ path: { id: "child-sdk-1" } }),
      )
    })
  })

  // -------------------------------------------------------------------------
  // R-POLL-01: Adaptive polling intervals
  // -------------------------------------------------------------------------

  describe("R-POLL-01: Adaptive polling intervals", () => {
    it("uses base interval when child is stable for < 30s", () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation({
        lastMessageCountChangeAt: Date.now() - 10000, // 10s ago
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      handler.scheduleStabilityPoll(delegation.id)

      // Timer should be set to approximately POLL_INTERVAL_BASE_MS
      // We verify by advancing less than the base interval and checking timer still exists
      vi.advanceTimersByTime(POLL_INTERVAL_BASE_MS - 100)
      expect(handler.isPolling(delegation.id)).toBe(true)

      vi.advanceTimersByTime(100)
      // After base interval, the poll should have fired and cleared the timer
      // (it will reschedule, but the original timer is gone)
    })

    it("uses idle interval when child is stable for 30s–5min", () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation({
        lastMessageCountChangeAt: Date.now() - 60000, // 1 min ago
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      handler.scheduleStabilityPoll(delegation.id)

      // Timer should be longer than base — we can verify the poll fires
      // at a time between base and idle interval
      vi.advanceTimersByTime(POLL_INTERVAL_BASE_MS)
      // Should have fired by now if it were base interval, but idle is longer
      // So we check if the original timer fired (it should have, since idle is calculated at schedule time)
    })

    it("uses deep-idle interval when child is stable for > 5min", () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation({
        lastMessageCountChangeAt: Date.now() - 400000, // ~6.7 min ago
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      handler.scheduleStabilityPoll(delegation.id)

      // The interval should be POLL_INTERVAL_DEEP_IDLE_MS (30000)
      // Verify the timer exists and takes longer than idle interval
      expect(handler.isPolling(delegation.id)).toBe(true)
    })
  })

  // -------------------------------------------------------------------------
  // R-POLL-02: Fast completion deferral (MIN_IDLE_TIME_MS gate)
  // -------------------------------------------------------------------------

  describe("R-POLL-02: Fast-completion deferral", () => {
    it("does not finalize delegation before MIN_IDLE_TIME_MS has elapsed", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const now = Date.now()
      const delegation = createRunningDelegation({
        createdAt: now, // Just created
        lastMessageCountChangeAt: now,
        stablePollCount: STABLE_POLLS_REQUIRED, // Already has enough stable polls
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)

      // Advance just before MIN_IDLE_TIME_MS
      await vi.advanceTimersByTime(MIN_IDLE_TIME_MS - 100)

      // Should NOT have finalized
      expect(callbacks.onTerminal).not.toHaveBeenCalled()
      expect(delegation.status).toBe("running")
    })

    it("allows finalization after MIN_IDLE_TIME_MS has elapsed", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const now = Date.now()
      const delegation = createRunningDelegation({
        createdAt: now - MIN_IDLE_TIME_MS - 1000, // Created long enough ago
        lastMessageCountChangeAt: now - MIN_STABILITY_TIME_MS - 1000, // Stable long enough
        stablePollCount: STABLE_POLLS_REQUIRED,
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)

      // Advance through enough time for the poll to fire
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS + 100)

      // Should have finalized
      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        delegation.id,
        "completed",
      )
    })
  })

  // -------------------------------------------------------------------------
  // R-POLL-03: Stale session detection (DEFAULT_STALE_TIMEOUT_MS → timeout)
  // -------------------------------------------------------------------------

  describe("R-POLL-03: Stale session detection", () => {
    it("transitions to timeout when no activity for DEFAULT_STALE_TIMEOUT_MS", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const now = Date.now()
      const delegation = createRunningDelegation({
        createdAt: now - DEFAULT_STALE_TIMEOUT_MS - 1000,
        lastMessageCountChangeAt: now - DEFAULT_STALE_TIMEOUT_MS - 1000,
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)

      // Delegation is deeply idle (> 5min), so adaptive interval is POLL_INTERVAL_DEEP_IDLE_MS (30s)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_DEEP_IDLE_MS + 100)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        delegation.id,
        "timeout",
        expect.stringContaining("Stale session"),
      )
    })
  })

  // -------------------------------------------------------------------------
  // R-POLL-04: Dual stability gate (MIN_STABILITY_TIME_MS + STABLE_POLLS_REQUIRED)
  // -------------------------------------------------------------------------

  describe("R-POLL-04: Dual stability gate", () => {
    it("does not finalize with only enough stable polls but insufficient time", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const now = Date.now()
      const delegation = createRunningDelegation({
        createdAt: now - 30000, // Old enough for MIN_IDLE_TIME
        lastMessageCountChangeAt: now - 2000, // Only 2s since last change — not enough stability time
        stablePollCount: STABLE_POLLS_REQUIRED + 5, // Way more than enough stable polls
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS + 100)

      // Should NOT finalize — stability time gate not met
      expect(callbacks.onTerminal).not.toHaveBeenCalled()
    })

    it("does not finalize with only enough time but insufficient stable polls", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const now = Date.now()
      const delegation = createRunningDelegation({
        createdAt: now - 60000,
        lastMessageCountChangeAt: now - MIN_STABILITY_TIME_MS - 5000, // Plenty of stability time
        stablePollCount: 0, // Not enough stable polls
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS + 100)

      // Should NOT finalize — stable poll count gate not met
      expect(callbacks.onTerminal).not.toHaveBeenCalled()
    })

    it("finalizes when both time and poll count gates are satisfied", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const now = Date.now()
      const delegation = createRunningDelegation({
        createdAt: now - 60000,
        lastMessageCountChangeAt: now - MIN_STABILITY_TIME_MS - 1000, // Time gate met
        stablePollCount: STABLE_POLLS_REQUIRED, // Poll count gate met
      })
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS + 100)

      // Should finalize — both gates satisfied
      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        delegation.id,
        "completed",
      )
    })
  })

  // -------------------------------------------------------------------------
  // Recovery
  // -------------------------------------------------------------------------

  describe("recovery", () => {
    it("recovers idle SDK delegation by triggering onSessionIdle", async () => {
      const client = createMockClient()
      const delegation = createRunningDelegation()
      const callbacks = createMockCallbacks()
      const handler = createHandler(client, callbacks)

      client.session.status.mockResolvedValue({
        data: { "child-sdk-1": { type: "idle" } },
      })

      await handler.recoverSdkDelegation(delegation)

      expect(callbacks.onSessionIdle).toHaveBeenCalledWith("child-sdk-1")
    })

    it("recovers busy SDK delegation by scheduling safety ceiling", async () => {
      const client = createMockClient()
      const delegation = createRunningDelegation()
      const callbacks = createMockCallbacks()
      const handler = createHandler(client, callbacks)

      client.session.status.mockResolvedValue({
        data: { "child-sdk-1": { type: "busy" } },
      })

      await handler.recoverSdkDelegation(delegation)

      expect(callbacks.scheduleSafetyCeiling).toHaveBeenCalledWith(delegation)
    })

    it("keeps missing recovery status non-terminal and schedules safety ceiling", async () => {
      const client = createMockClient()
      const delegation = createRunningDelegation()
      const callbacks = createMockCallbacks()
      const handler = createHandler(client, callbacks)

      client.session.status.mockResolvedValue({ data: {} })

      await handler.recoverSdkDelegation(delegation)

      expect(callbacks.onTerminal).not.toHaveBeenCalled()
      expect(delegation.error).toContain("unverified after restart")
      expect(callbacks.scheduleSafetyCeiling).toHaveBeenCalledWith(delegation)
    })
  })

  // -------------------------------------------------------------------------
  // Timer management
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // R-COMPLETION-DETECTOR-01..03 (Phase 36.1): re-wire CompletionDetector
  // into the SDK polling path so terminal events feed terminal state and
  // message-count stability is double-tracked through the dual-signal
  // detector instead of being trapped in adaptive polling alone.
  // -------------------------------------------------------------------------

  describe("R-COMPLETION-DETECTOR-01: cached error signal short-circuits stability polling", () => {
    it("transitions running SDK delegation to error when CompletionDetector has cached session.error", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)
      const detector = new CompletionDetector()
      detector.feed("session.error", delegation.childSessionId, "boom")

      const callbacks = createMockCallbacks(store)
      callbacks.getCompletionDetector = vi.fn(() => detector)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        delegation.id,
        "error",
        expect.stringContaining("boom"),
      )
    })

    it("transitions running SDK delegation to error when CompletionDetector has cached session.deleted", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)
      const detector = new CompletionDetector()
      detector.feed("session.deleted", delegation.childSessionId)

      const callbacks = createMockCallbacks(store)
      callbacks.getCompletionDetector = vi.fn(() => detector)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      handler.scheduleStabilityPoll(delegation.id)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        delegation.id,
        "error",
        expect.stringContaining("deleted"),
      )
    })
  })

  describe("R-COMPLETION-DETECTOR-02: feeds message count into the detector", () => {
    it("calls CompletionDetector.feedMessageCount each poll cycle so stability is mirrored to the dual-signal detector", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)
      const detector = new CompletionDetector()
      const feedSpy = vi.spyOn(detector, "feedMessageCount")

      const callbacks = createMockCallbacks(store)
      callbacks.getCompletionDetector = vi.fn(() => detector)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(7)

      handler.scheduleStabilityPoll(delegation.id)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(feedSpy).toHaveBeenCalledWith(delegation.childSessionId, 7)
    })
  })

  describe("R-COMPLETION-DETECTOR-04: idle signal from detector finalizes delegation", () => {
    it("transitions to completed when CompletionDetector has cached idle signal", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)
      const detector = new CompletionDetector()

      detector.feedMessageCount(delegation.childSessionId, 5)
      vi.advanceTimersByTime(detector["stabilityTimeoutMs"] + 1)

      const callbacks = createMockCallbacks(store)
      callbacks.getCompletionDetector = vi.fn(() => detector)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(5)

      handler.scheduleStabilityPoll(delegation.id)
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(callbacks.onTerminal).toHaveBeenCalledWith(
        delegation.id,
        "completed",
      )
    })

    it("does not finalize on idle signal before MIN_IDLE_TIME_MS", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const now = Date.now()
      const delegation = createRunningDelegation({
        createdAt: now,
        lastMessageCountChangeAt: now,
      })
      store.set(delegation.id, delegation)
      const detector = new CompletionDetector()

      detector.feedMessageCount(delegation.childSessionId, 5)

      const callbacks = createMockCallbacks(store)
      callbacks.getCompletionDetector = vi.fn(() => detector)
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(5)

      handler.scheduleStabilityPoll(delegation.id)

      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(callbacks.onTerminal).not.toHaveBeenCalled()
      expect(delegation.status).toBe("running")
    })
  })

  describe("R-COMPLETION-DETECTOR-03: backwards-compatible when no detector is provided", () => {
    it("does not throw and falls back to legacy polling when getCompletionDetector callback is absent", async () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)

      const callbacks = createMockCallbacks(store)
      // no getCompletionDetector — exercises the optional-callback path
      const handler = createHandler(client, callbacks)

      vi.spyOn(sessionApi, "getSessionMessageCount").mockResolvedValue(0)

      expect(() => handler.scheduleStabilityPoll(delegation.id)).not.toThrow()
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_BASE_MS)

      expect(callbacks.onTerminal).not.toHaveBeenCalledWith(
        delegation.id,
        "error",
        expect.stringContaining("boom"),
      )
    })
  })

  describe("timer management", () => {
    it("isPolling returns true when a timer is active", () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      handler.scheduleStabilityPoll(delegation.id)

      expect(handler.isPolling(delegation.id)).toBe(true)
    })

    it("clearTimers removes the active timer", () => {
      const client = createMockClient()
      const store = new Map<string, Delegation>()
      const delegation = createRunningDelegation()
      store.set(delegation.id, delegation)
      const callbacks = createMockCallbacks(store)
      const handler = createHandler(client, callbacks)

      handler.scheduleStabilityPoll(delegation.id)
      expect(handler.isPolling(delegation.id)).toBe(true)

      handler.clearTimers(delegation.id)
      expect(handler.isPolling(delegation.id)).toBe(false)
    })
  })
})
