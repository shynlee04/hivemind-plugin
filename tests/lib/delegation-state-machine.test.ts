import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  DelegationStateMachine,
  VALID_DELEGATION_TRANSITIONS,
  canTransitionDelegationStatus,
  deriveDelegationSurface,
  deriveRecoveryGuarantee,
  withContractDefaults,
  buildDelegationResult,
} from "../../src/coordination/delegation/state-machine.js"
import type { Delegation, DelegationStatus } from "../../src/shared/types.js"

// ---------------------------------------------------------------------------
// Mocks — only I/O and SDK boundaries
// ---------------------------------------------------------------------------

vi.mock("../../src/task-management/continuity/delegation-persistence.js", () => ({
  persistDelegations: vi.fn(),
}))

vi.mock("../../src/coordination/completion/notification-handler.js", () => ({
  notifyDelegationTerminal: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("../../src/shared/session-api.js", () => ({
  abortSession: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "del_1",
    parentSessionId: "parent_1",
    childSessionId: "child_1",
    agent: "test-agent",
    status: "dispatched",
    createdAt: Date.now(),
    lastMessageCount: 0,
    stablePollCount: 0,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: "/tmp",
    queueKey: "test-queue",
    ...overrides,
  }
}

function makeStateMachine(
  overrides: { clearExternalTimers?: (id: string) => void } = {},
): DelegationStateMachine {
  const client = { app: { log: vi.fn() } } as any
  return new DelegationStateMachine({
    client,
    clearExternalTimers: overrides.clearExternalTimers,
  })
}

// ===========================================================================
// 1. Pure helper functions
// ===========================================================================

describe("delegation-state-machine (pure helpers)", () => {
  // --- VALID_DELEGATION_TRANSITIONS ---

  describe("VALID_DELEGATION_TRANSITIONS", () => {
    it("should list all 7 delegation statuses as keys", () => {
      const statuses = Object.keys(VALID_DELEGATION_TRANSITIONS)
      expect(statuses).toHaveLength(7)
      expect(statuses).toContain("dispatched")
      expect(statuses).toContain("running")
      expect(statuses).toContain("completed")
      expect(statuses).toContain("error")
      expect(statuses).toContain("timeout")
      expect(statuses).toContain("aborted")
      expect(statuses).toContain("cancelled")
    })

    it("should mark all terminal statuses as having no outgoing transitions", () => {
      expect(VALID_DELEGATION_TRANSITIONS.completed).toEqual([])
      expect(VALID_DELEGATION_TRANSITIONS.error).toEqual([])
      expect(VALID_DELEGATION_TRANSITIONS.timeout).toEqual([])
      expect(VALID_DELEGATION_TRANSITIONS.aborted).toEqual([])
      expect(VALID_DELEGATION_TRANSITIONS.cancelled).toEqual([])
    })

    it("should allow dispatched to transition to running, completed, error, timeout, aborted, and cancelled", () => {
      expect(VALID_DELEGATION_TRANSITIONS.dispatched).toEqual([
        "running",
        "completed",
        "error",
        "timeout",
        "aborted",
        "cancelled",
      ])
    })

    it("should allow running to transition to completed, error, timeout, aborted, and cancelled", () => {
      expect(VALID_DELEGATION_TRANSITIONS.running).toEqual([
        "completed",
        "error",
        "timeout",
        "aborted",
        "cancelled",
      ])
    })
  })

  // --- canTransitionDelegationStatus ---

  describe("canTransitionDelegationStatus", () => {
    it("should allow dispatched → running", () => {
      expect(canTransitionDelegationStatus("dispatched", "running")).toBe(true)
    })

    it("should allow dispatched → completed", () => {
      expect(canTransitionDelegationStatus("dispatched", "completed")).toBe(true)
    })

    it("should allow running → completed", () => {
      expect(canTransitionDelegationStatus("running", "completed")).toBe(true)
    })

    it("should allow running → error", () => {
      expect(canTransitionDelegationStatus("running", "error")).toBe(true)
    })

    it("should allow running → timeout", () => {
      expect(canTransitionDelegationStatus("running", "timeout")).toBe(true)
    })

    it("should reject completed → running (terminal reversal)", () => {
      expect(canTransitionDelegationStatus("completed", "running")).toBe(false)
    })

    it("should reject error → completed (terminal reversal)", () => {
      expect(canTransitionDelegationStatus("error", "completed")).toBe(false)
    })

    it("should reject timeout → running (terminal reversal)", () => {
      expect(canTransitionDelegationStatus("timeout", "running")).toBe(false)
    })

    it("should reject same-status transitions (dispatched → dispatched)", () => {
      expect(canTransitionDelegationStatus("dispatched", "dispatched")).toBe(false)
    })

    it("should return false for an unknown source status", () => {
      expect(canTransitionDelegationStatus("unknown" as DelegationStatus, "running")).toBe(false)
    })
  })

  // --- deriveDelegationSurface ---

  describe("deriveDelegationSurface", () => {
    it("should return agent-delegation for sdk mode", () => {
      expect(deriveDelegationSurface("sdk")).toBe("agent-delegation")
    })

    it("should return command-process for pty mode", () => {
      expect(deriveDelegationSurface("pty")).toBe("command-process")
    })

    it("should return command-process for headless mode", () => {
      expect(deriveDelegationSurface("headless")).toBe("command-process")
    })
  })

  // --- deriveRecoveryGuarantee ---

  describe("deriveRecoveryGuarantee", () => {
    it("should return resumable for sdk mode", () => {
      expect(deriveRecoveryGuarantee("sdk")).toBe("resumable")
    })

    it("should return best-effort for pty mode", () => {
      expect(deriveRecoveryGuarantee("pty")).toBe("best-effort")
    })

    it("should return non-resumable-after-restart for headless mode", () => {
      expect(deriveRecoveryGuarantee("headless")).toBe("non-resumable-after-restart")
    })
  })

  // --- withContractDefaults ---

  describe("withContractDefaults", () => {
    it("should fill surface from executionMode when missing", () => {
      const d = makeDelegation({ executionMode: "sdk", surface: undefined })
      delete (d as any).surface
      const result = withContractDefaults(d)
      expect(result.surface).toBe("agent-delegation")
    })

    it("should fill recoveryGuarantee from executionMode when missing", () => {
      const d = makeDelegation({ executionMode: "pty", recoveryGuarantee: undefined })
      delete (d as any).recoveryGuarantee
      const result = withContractDefaults(d)
      expect(result.recoveryGuarantee).toBe("best-effort")
    })

    it("should default explicitCancellation to false when missing", () => {
      const d = makeDelegation({ explicitCancellation: undefined })
      delete (d as any).explicitCancellation
      const result = withContractDefaults(d)
      expect(result.explicitCancellation).toBe(false)
    })

    it("should preserve existing surface, recoveryGuarantee, and explicitCancellation", () => {
      const d = makeDelegation({
        executionMode: "sdk",
        surface: "command-process",
        recoveryGuarantee: "best-effort",
        explicitCancellation: true,
      })
      const result = withContractDefaults(d)
      expect(result.surface).toBe("command-process")
      expect(result.recoveryGuarantee).toBe("best-effort")
      expect(result.explicitCancellation).toBe(true)
    })
  })

  // --- buildDelegationResult ---

  describe("buildDelegationResult", () => {
    it("should project delegation fields onto DelegationResult shape", () => {
      const d = makeDelegation({
        status: "completed",
        result: "test output",
        resultTruncated: false,
        executionMode: "sdk",
        workingDirectory: "/workspace",
        queueKey: "q-1",
      })
      const hydrated = withContractDefaults(d)
      const result = buildDelegationResult(d)

      expect(result.status).toBe("completed")
      expect(result.result).toBe("test output")
      expect(result.delegationId).toBe("del_1")
      expect(result.executionMode).toBe("sdk")
      expect(result.surface).toBe(hydrated.surface)
      expect(result.recoveryGuarantee).toBe(hydrated.recoveryGuarantee)
      expect(result.workingDirectory).toBe("/workspace")
      expect(result.queueKey).toBe("q-1")
    })

    it("should include error and terminal fields when present", () => {
      const d = makeDelegation({
        status: "error",
        error: "something broke",
        terminalKind: "error",
        terminationSignal: "SIGTERM",
        explicitCancellation: true,
      })
      const result = buildDelegationResult(d)

      expect(result.error).toBe("something broke")
      expect(result.terminalKind).toBe("error")
      expect(result.terminationSignal).toBe("SIGTERM")
      expect(result.explicitCancellation).toBe(true)
    })
  })
})

// ===========================================================================
// 2. DelegationStateMachine class
// ===========================================================================

describe("DelegationStateMachine", () => {
  let sm: DelegationStateMachine

  beforeEach(() => {
    vi.useFakeTimers()
    sm = makeStateMachine()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // --- registerDelegation + get ---

  describe("registerDelegation + get", () => {
    it("should register a delegation and retrieve it by id", () => {
      const d = makeDelegation()
      sm.registerDelegation(d, false)
      expect(sm.get("del_1")).toBeDefined()
      expect(sm.get("del_1")!.status).toBe("dispatched")
    })

    it("should hydrate contract defaults on registration", () => {
      const d = makeDelegation({ executionMode: "sdk" })
      delete (d as any).surface
      delete (d as any).recoveryGuarantee
      sm.registerDelegation(d, false)
      const stored = sm.get("del_1")!
      expect(stored.surface).toBe("agent-delegation")
      expect(stored.recoveryGuarantee).toBe("resumable")
    })

    it("should register session mapping via delegationsBySession", () => {
      const d = makeDelegation()
      sm.registerDelegation(d, false)
      expect(sm.getDelegationIdForSession("child_1")).toBe("del_1")
    })

    it("should return undefined for unknown delegation id", () => {
      expect(sm.get("nonexistent")).toBeUndefined()
    })

    it("should return undefined for unknown session id", () => {
      expect(sm.getDelegationIdForSession("nonexistent")).toBeUndefined()
    })
  })

  // --- getAll ---

  describe("getAll", () => {
    it("should return empty array when no delegations registered", () => {
      expect(sm.getAll()).toEqual([])
    })

    it("should return all registered delegations", () => {
      sm.registerDelegation(makeDelegation({ id: "d1", childSessionId: "c1" }), false)
      sm.registerDelegation(makeDelegation({ id: "d2", childSessionId: "c2" }), false)
      const all = sm.getAll()
      expect(all).toHaveLength(2)
      const ids = all.map((d) => d.id)
      expect(ids).toContain("d1")
      expect(ids).toContain("d2")
    })
  })

  // --- transition (non-terminal) ---

  describe("transition", () => {
    it("should transition dispatched → running and return true", () => {
      sm.registerDelegation(makeDelegation({ status: "dispatched" }), false)
      const result = sm.transition("del_1", "running")
      expect(result).toBe(true)
      expect(sm.get("del_1")!.status).toBe("running")
    })

    it("should reject terminal → non-terminal transitions and return false", () => {
      sm.registerDelegation(makeDelegation({ status: "completed" }), false)
      const result = sm.transition("del_1", "running")
      expect(result).toBe(false)
      expect(sm.get("del_1")!.status).toBe("completed")
    })

    it("should return false for same-status transition", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), false)
      const result = sm.transition("del_1", "running")
      expect(result).toBe(false)
    })

    it("should return false for unknown delegation id", () => {
      const result = sm.transition("nonexistent", "running")
      expect(result).toBe(false)
    })
  })

  // --- transitionToTerminal ---

  describe("transitionToTerminal", () => {
    it("should transition running → completed with side effects", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), true)
      sm.transitionToTerminal("del_1", "completed")

      const d = sm.get("del_1")
      expect(d).toBeDefined()
      expect(d!.status).toBe("completed")
      expect(d!.completedAt).toBeTypeOf("number")
      // Error should be cleared on completion
      expect(d!.error).toBeUndefined()
    })

    it("should transition dispatched → error and set error message", () => {
      sm.registerDelegation(makeDelegation({ status: "dispatched" }), true)
      sm.transitionToTerminal("del_1", "error", "test error")

      const d = sm.get("del_1")
      expect(d!.status).toBe("error")
      expect(d!.error).toBe("test error")
      expect(d!.completedAt).toBeTypeOf("number")
    })

    it("should set terminalKind and terminationSignal from terminalDetail", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), false)
      sm.transitionToTerminal("del_1", "timeout", undefined, {
        terminalKind: "timeout",
        terminationSignal: "SIGTERM",
        explicitCancellation: false,
      })

      const d = sm.get("del_1")
      expect(d!.terminalKind).toBe("timeout")
      expect(d!.terminationSignal).toBe("SIGTERM")
      expect(d!.explicitCancellation).toBe(false)
    })

    it("should be a no-op for already-terminal delegations", () => {
      sm.registerDelegation(makeDelegation({ status: "completed", completedAt: 100 }), false)
      sm.transitionToTerminal("del_1", "error", "should not apply")

      const d = sm.get("del_1")
      expect(d!.status).toBe("completed")
      expect(d!.error).toBeUndefined()
    })

    it("should be a no-op for unknown delegation id", () => {
      expect(() => sm.transitionToTerminal("nonexistent", "completed")).not.toThrow()
    })

    it("should clear error field when transitioning to completed", () => {
      sm.registerDelegation(makeDelegation({ status: "running", error: "transient" }), false)
      sm.transitionToTerminal("del_1", "completed")

      expect(sm.get("del_1")!.error).toBeUndefined()
    })

    it("should remove childSession mapping via cleanupTracking", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), false)
      expect(sm.getDelegationIdForSession("child_1")).toBe("del_1")

      sm.transitionToTerminal("del_1", "completed")

      expect(sm.getDelegationIdForSession("child_1")).toBeUndefined()
    })

    it("should log the transition to stderr", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), false)
      sm.transitionToTerminal("del_1", "completed")

      expect((sm as any).client.app.log).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            message: expect.stringContaining("[Harness] Delegation del_1 transitioned: running → completed"),
          }),
        }),
      )
    })
  })

  // --- safety timer ---

  describe("safety ceiling timer", () => {
    it("should arm a safety timer when registerDelegation is called with scheduleSafetyCeiling=true", () => {
      sm.registerDelegation(makeDelegation({ status: "dispatched" }), true)
      expect(sm.safetyTimers.has("del_1")).toBe(true)
    })

    it("should NOT arm a safety timer when scheduleSafetyCeiling=false", () => {
      sm.registerDelegation(makeDelegation({ status: "dispatched" }), false)
      expect(sm.safetyTimers.has("del_1")).toBe(false)
    })

    it("should clear safety timer when delegation transitions to terminal", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), true)
      expect(sm.safetyTimers.has("del_1")).toBe(true)

      sm.transitionToTerminal("del_1", "completed")
      expect(sm.safetyTimers.has("del_1")).toBe(false)
    })

    it("should transition to timeout when safety ceiling fires", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {})
      const safetyCeilingMs = 5000
      const pastCreatedAt = Date.now() - safetyCeilingMs - 1000
      sm.registerDelegation(
        makeDelegation({
          status: "running",
          safetyCeilingMs,
          createdAt: pastCreatedAt,
        }),
        true,
      )

      // The timer should fire almost immediately since remaining = max(1, ceiling - elapsed) ~ 1ms
      vi.advanceTimersByTime(50)

      // Let microtasks flush (handleSafetyCeiling is async, calls transitionToTerminal
      // which is synchronous, then calls abortSession which is async)
      await vi.runAllTimersAsync()

      // The delegation is removed from memory after grace period cleanup fires.
      // Verify the side effects: safety timer consumed, session mapping removed,
      // and the transition was logged.
      expect(sm.safetyTimers.has("del_1")).toBe(false)
      expect(sm.getDelegationIdForSession("child_1")).toBeUndefined()
    })

    it("should abort the child session when safety ceiling fires", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {})
      const sessionApi = await import("../../src/shared/session-api.js")
      const mockAbort = sessionApi.abortSession as ReturnType<typeof vi.fn>
      mockAbort.mockClear()

      const safetyCeilingMs = 5000
      const pastCreatedAt = Date.now() - safetyCeilingMs - 1000
      sm.registerDelegation(
        makeDelegation({
          status: "running",
          safetyCeilingMs,
          createdAt: pastCreatedAt,
        }),
        true,
      )

      vi.advanceTimersByTime(50)
      await vi.runAllTimersAsync()

      expect(mockAbort).toHaveBeenCalledTimes(1)
      expect(mockAbort).toHaveBeenCalledWith(expect.anything(), "child_1")
    })
  })

  // --- grace period cleanup ---

  describe("grace period cleanup", () => {
    it("should remove delegation from memory after grace period expires", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), false)
      sm.transitionToTerminal("del_1", "completed")

      // Delegation exists immediately after terminal transition
      expect(sm.get("del_1")).toBeDefined()

      // Advance past TASK_CLEANUP_DELAY_MS (10 minutes)
      vi.advanceTimersByTime(10 * 60 * 1000 + 100)

      // Should have been removed from memory
      expect(sm.get("del_1")).toBeUndefined()
    })

    it("should persist gracePeriodExpiresAt when scheduling cleanup", async () => {
      const types = await import("../../src/shared/types.js")
      const TASK_CLEANUP_DELAY_MS = types.TASK_CLEANUP_DELAY_MS as number
      sm.registerDelegation(makeDelegation({ status: "running" }), false)
      sm.transitionToTerminal("del_1", "completed")

      const d = sm.get("del_1")
      expect(d!.gracePeriodExpiresAt).toBeTypeOf("number")
      expect(d!.gracePeriodExpiresAt! - Date.now()).toBeLessThanOrEqual((TASK_CLEANUP_DELAY_MS as number) + 10)
    })
  })

  // --- clearAllTimers ---

  describe("clearAllTimers", () => {
    it("should call clearExternalTimers callback for the delegation id", () => {
      const clearExternal = vi.fn()
      const localSm = makeStateMachine({ clearExternalTimers: clearExternal })
      localSm.registerDelegation(makeDelegation({ status: "running" }), true)

      localSm.clearAllTimers("del_1")

      expect(clearExternal).toHaveBeenCalledWith("del_1")
      expect(localSm.safetyTimers.has("del_1")).toBe(false)
    })
  })

  // --- pruneCompletedDelegations ---

  describe("pruneCompletedDelegations", () => {
    it("should prune old terminal delegations past maxAgeMs", () => {
      const oldTimestamp = Date.now() - 60 * 60 * 1000 // 1 hour ago
      sm.registerDelegation(
        makeDelegation({
          id: "old_del",
          childSessionId: "old_child",
          status: "completed",
          completedAt: oldTimestamp,
        }),
        false,
      )
      sm.registerDelegation(
        makeDelegation({
          id: "fresh_del",
          childSessionId: "fresh_child",
          status: "running",
        }),
        false,
      )

      const pruned = sm.pruneCompletedDelegations(30 * 60 * 1000) // 30 minute threshold

      expect(pruned).toBe(1)
      expect(sm.get("old_del")).toBeUndefined()
      expect(sm.get("fresh_del")).toBeDefined()
    })

    it("should NOT prune delegations within maxAgeMs", () => {
      const recentTimestamp = Date.now() - 1000 // 1 second ago
      sm.registerDelegation(
        makeDelegation({
          status: "completed",
          completedAt: recentTimestamp,
        }),
        false,
      )

      const pruned = sm.pruneCompletedDelegations(30 * 60 * 1000)

      expect(pruned).toBe(0)
      expect(sm.get("del_1")).toBeDefined()
    })

    it("should NOT prune non-terminal delegations even if old", () => {
      const oldTimestamp = Date.now() - 60 * 60 * 1000
      sm.registerDelegation(
        makeDelegation({
          status: "running",
          createdAt: oldTimestamp,
        }),
        false,
      )

      const pruned = sm.pruneCompletedDelegations(30 * 60 * 1000)

      expect(pruned).toBe(0)
      expect(sm.get("del_1")).toBeDefined()
    })

    it("should clean up session tracking when pruning", () => {
      const oldTimestamp = Date.now() - 60 * 60 * 1000
      sm.registerDelegation(
        makeDelegation({
          id: "old_del",
          childSessionId: "old_child",
          status: "completed",
          completedAt: oldTimestamp,
        }),
        false,
      )
      expect(sm.getDelegationIdForSession("old_child")).toBe("old_del")

      sm.pruneCompletedDelegations(30 * 60 * 1000)

      expect(sm.getDelegationIdForSession("old_child")).toBeUndefined()
    })

    it("should return 0 and not persist when nothing to prune", async () => {
      const delegationPersistence = await import("../../src/task-management/continuity/delegation-persistence.js")
      const mockPersist = delegationPersistence.persistDelegations as ReturnType<typeof vi.fn>
      mockPersist.mockClear()
      sm.registerDelegation(
        makeDelegation({ status: "running" }),
        false,
      )

      const pruned = sm.pruneCompletedDelegations(30 * 60 * 1000)

      expect(pruned).toBe(0)
      expect(mockPersist).not.toHaveBeenCalled()
    })
  })

  // --- hydrateFromPersistence + trackSession ---

  describe("hydrateFromPersistence + trackSession", () => {
    it("should hydrate a delegation without scheduling timers", () => {
      const d = makeDelegation({ status: "completed" })
      sm.hydrateFromPersistence(d)

      expect(sm.get("del_1")).toBeDefined()
      expect(sm.get("del_1")!.status).toBe("completed")
      // No safety timer should be scheduled
      expect(sm.safetyTimers.has("del_1")).toBe(false)
    })

    it("should track session mapping independently via trackSession", () => {
      sm.trackSession("recovered_child", "recovered_del")

      expect(sm.getDelegationIdForSession("recovered_child")).toBe("recovered_del")
    })
  })

  // --- persistAll ---

  describe("persistAll", () => {
    it("should call persistDelegations with current delegation values", async () => {
      const delegationPersistence = await import("../../src/task-management/continuity/delegation-persistence.js")
      const mockPersist = delegationPersistence.persistDelegations as ReturnType<typeof vi.fn>
      mockPersist.mockClear()

      sm.registerDelegation(makeDelegation(), false)
      sm.persistAll()

      expect(mockPersist).toHaveBeenCalledTimes(1)
      const arg = mockPersist.mock.calls[0][0] as Delegation[]
      expect(arg).toHaveLength(1)
      expect(arg[0].id).toBe("del_1")
    })

    it("should prune before persisting when over MAX_DELEGATIONS_BEFORE_PRUNE threshold", async () => {
      const types = await import("../../src/shared/types.js")
      const delegationPersistence = await import("../../src/task-management/continuity/delegation-persistence.js")
      const MAX_DELEGATIONS_BEFORE_PRUNE = types.MAX_DELEGATIONS_BEFORE_PRUNE as number
      const mockPersist = delegationPersistence.persistDelegations as ReturnType<typeof vi.fn>
      mockPersist.mockClear()

      // Register more than threshold delegations (all terminal and old so prune removes them)
      for (let i = 0; i < MAX_DELEGATIONS_BEFORE_PRUNE + 1; i++) {
        sm.registerDelegation(
          makeDelegation({
            id: `del_${i}`,
            childSessionId: `child_${i}`,
            status: "completed",
            completedAt: Date.now() - 60 * 60 * 1000,
          }),
          false,
        )
      }

      sm.persistAll()

      // Should have pruned before persisting
      const persistedArg = mockPersist.mock.calls[0][0] as Delegation[]
      expect(persistedArg.length).toBeLessThan(MAX_DELEGATIONS_BEFORE_PRUNE + 1)
    })
  })

  // --- markCommandCancellationForPtySession ---

  describe("markCommandCancellationForPtySession", () => {
    it("should mark delegation as cancelled when PTY session matches active delegation", () => {
      sm.registerDelegation(
        makeDelegation({ status: "running", ptySessionId: "pty_abc" }),
        false,
      )

      const result = sm.markCommandCancellationForPtySession("pty_abc")

      expect(result).toBeDefined()
      expect(result!.explicitCancellation).toBe(true)
      expect(result!.terminalKind).toBe("cancelled")
      // Status should still be running — markCommandCancellation only sets flags
      expect(sm.get("del_1")!.explicitCancellation).toBe(true)
      expect(sm.get("del_1")!.terminalKind).toBe("cancelled")
    })

    it("should return current result without mutation when PTY session matches terminal delegation", () => {
      sm.registerDelegation(
        makeDelegation({
          status: "completed",
          ptySessionId: "pty_abc",
          terminalKind: "completed",
        }),
        false,
      )

      const result = sm.markCommandCancellationForPtySession("pty_abc")

      expect(result).toBeDefined()
      expect(result!.status).toBe("completed")
      // Should NOT have been mutated to cancelled
      expect(sm.get("del_1")!.terminalKind).toBe("completed")
    })

    it("should return undefined for unknown PTY session id", () => {
      sm.registerDelegation(
        makeDelegation({ status: "running", ptySessionId: "pty_abc" }),
        false,
      )

      const result = sm.markCommandCancellationForPtySession("pty_nonexistent")

      expect(result).toBeUndefined()
    })
  })

  // --- findByPtySession ---

  describe("findByPtySession", () => {
    it("should return delegation matching PTY session id", () => {
      sm.registerDelegation(
        makeDelegation({ ptySessionId: "pty_xyz" }),
        false,
      )

      const found = sm.findByPtySession("pty_xyz")
      expect(found).toBeDefined()
      expect(found!.id).toBe("del_1")
    })

    it("should return undefined when no delegation matches the PTY session id", () => {
      sm.registerDelegation(
        makeDelegation({ ptySessionId: "pty_xyz" }),
        false,
      )

      expect(sm.findByPtySession("pty_other")).toBeUndefined()
    })

    it("should return undefined when delegation has no ptySessionId", () => {
      sm.registerDelegation(makeDelegation(), false)

      expect(sm.findByPtySession("pty_anything")).toBeUndefined()
    })
  })

  // --- edge cases ---

  describe("edge cases", () => {
    it("should handle duplicate delegation id registration (overwrite)", () => {
      sm.registerDelegation(makeDelegation({ status: "dispatched" }), false)
      sm.registerDelegation(makeDelegation({ status: "running" }), false)

      const d = sm.get("del_1")
      expect(d!.status).toBe("running")
      // Should still only have one delegation
      expect(sm.getAll()).toHaveLength(1)
    })

    it("should handle cleanupTracking for delegation with no safety timer", () => {
      sm.registerDelegation(makeDelegation({ status: "running" }), false)
      // No safety timer, but cleanupTracking should not throw
      expect(() => sm.cleanupTracking("del_1", "child_1")).not.toThrow()
      expect(sm.getDelegationIdForSession("child_1")).toBeUndefined()
    })

    it("should handle scheduleGracePeriodCleanup for unknown delegation id", () => {
      // Grace period cleanup for nonexistent delegation should be a no-op
      expect(() => sm.scheduleGracePeriodCleanup("nonexistent")).not.toThrow()
    })
  })
})
