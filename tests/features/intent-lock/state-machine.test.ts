import { describe, expect, it } from "vitest"

import {
  ALLOWED_TRANSITIONS,
  canTransition,
  completeIntent,
  isTerminalState,
  lockIntentCodeChange,
  lockIntentNonCode,
  transitionToExecuting,
  transitionToPhaseAuthorized,
  transitionToPhaseReady,
  validateTransition,
} from "../../../src/features/intent-lock/state-machine.js"
import {
  IntentLockStateTransitionError,
  IntentState,
  type IntentLockState,
} from "../../../src/features/intent-lock/types.js"

/**
 * Build a fresh UNLOCKED state for a session.
 */
function makeUnlockedState(sessionId = "ses_test"): IntentLockState {
  return {
    sessionId,
    state: IntentState.UNLOCKED,
    lastTransitionAt: 0,
    history: [],
  }
}

describe("src/features/intent-lock/state-machine", () => {
  describe("ALLOWED_TRANSITIONS", () => {
    it("matches SPEC §2 — UNLOCKED has two outgoing edges", () => {
      expect(ALLOWED_TRANSITIONS[IntentState.UNLOCKED]).toEqual([
        IntentState.LOCKED_NON_CODE,
        IntentState.LOCKED_CODE_CHANGE,
      ])
    })

    it("marks LOCKED_NON_CODE as terminal", () => {
      expect(ALLOWED_TRANSITIONS[IntentState.LOCKED_NON_CODE]).toEqual([])
    })

    it("marks COMPLETED as terminal", () => {
      expect(ALLOWED_TRANSITIONS[IntentState.COMPLETED]).toEqual([])
    })

    it("chains LOCKED_CODE_CHANGE → PHASE_READY → PHASE_AUTHORIZED → EXECUTING → COMPLETED", () => {
      expect(ALLOWED_TRANSITIONS[IntentState.LOCKED_CODE_CHANGE]).toEqual([IntentState.PHASE_READY])
      expect(ALLOWED_TRANSITIONS[IntentState.PHASE_READY]).toEqual([IntentState.PHASE_AUTHORIZED])
      expect(ALLOWED_TRANSITIONS[IntentState.PHASE_AUTHORIZED]).toEqual([IntentState.EXECUTING])
      expect(ALLOWED_TRANSITIONS[IntentState.EXECUTING]).toEqual([IntentState.COMPLETED])
    })
  })

  describe("isTerminalState", () => {
    it("returns true for LOCKED_NON_CODE and COMPLETED", () => {
      expect(isTerminalState(IntentState.LOCKED_NON_CODE)).toBe(true)
      expect(isTerminalState(IntentState.COMPLETED)).toBe(true)
    })

    it("returns false for every non-terminal state", () => {
      expect(isTerminalState(IntentState.UNLOCKED)).toBe(false)
      expect(isTerminalState(IntentState.LOCKED_CODE_CHANGE)).toBe(false)
      expect(isTerminalState(IntentState.PHASE_READY)).toBe(false)
      expect(isTerminalState(IntentState.PHASE_AUTHORIZED)).toBe(false)
      expect(isTerminalState(IntentState.EXECUTING)).toBe(false)
    })
  })

  describe("canTransition", () => {
    it("returns true for valid transitions", () => {
      expect(canTransition(IntentState.UNLOCKED, IntentState.LOCKED_CODE_CHANGE)).toBe(true)
      expect(canTransition(IntentState.LOCKED_CODE_CHANGE, IntentState.PHASE_READY)).toBe(true)
    })

    it("returns false for invalid transitions", () => {
      expect(canTransition(IntentState.UNLOCKED, IntentState.EXECUTING)).toBe(false)
      expect(canTransition(IntentState.LOCKED_NON_CODE, IntentState.LOCKED_CODE_CHANGE)).toBe(false)
      expect(canTransition(IntentState.COMPLETED, IntentState.UNLOCKED)).toBe(false)
    })
  })

  describe("validateTransition", () => {
    it("does not throw for valid transitions", () => {
      expect(() => validateTransition(IntentState.UNLOCKED, IntentState.LOCKED_CODE_CHANGE, "s1")).not.toThrow()
    })

    it("throws IntentLockStateTransitionError with [Hivemind] prefix for invalid transitions", () => {
      try {
        validateTransition(IntentState.UNLOCKED, IntentState.PHASE_READY, "ses_test")
        expect.fail("expected throw")
      } catch (err) {
        expect(err).toBeInstanceOf(IntentLockStateTransitionError)
        expect((err as Error).message.startsWith("[Hivemind]")).toBe(true)
        expect((err as Error).message).toContain("UNLOCKED→PHASE_READY")
        expect((err as Error).message).toContain("ses_test")
      }
    })
  })

  describe("lockIntentNonCode", () => {
    it("transitions UNLOCKED → LOCKED_NON_CODE and sets intentId + isCodeChange=false", () => {
      const initial = makeUnlockedState()
      const next = lockIntentNonCode(initial, "INT-20260610-aaaaaa", "Research brainstorm")
      expect(next.state).toBe(IntentState.LOCKED_NON_CODE)
      expect(next.intentId).toBe("INT-20260610-aaaaaa")
      expect(next.summary).toBe("Research brainstorm")
      expect(next.isCodeChange).toBe(false)
      expect(next.lastTransitionAt).toBeGreaterThan(0)
      expect(next.history).toHaveLength(1)
      expect(next.history[0]?.from).toBe(IntentState.UNLOCKED)
      expect(next.history[0]?.to).toBe(IntentState.LOCKED_NON_CODE)
    })

    it("throws when current state is not UNLOCKED", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.LOCKED_CODE_CHANGE,
        lastTransitionAt: 0,
        history: [],
      }
      expect(() => lockIntentNonCode(initial, "INT-20260610-aaaaaa", "summary")).toThrow(
        IntentLockStateTransitionError,
      )
    })
  })

  describe("lockIntentCodeChange", () => {
    it("transitions UNLOCKED → LOCKED_CODE_CHANGE and sets isCodeChange=true", () => {
      const initial = makeUnlockedState()
      const next = lockIntentCodeChange(initial, "INT-20260610-bbbbbb", "Implement feature", ["src/foo.ts"])
      expect(next.state).toBe(IntentState.LOCKED_CODE_CHANGE)
      expect(next.intentId).toBe("INT-20260610-bbbbbb")
      expect(next.summary).toBe("Implement feature")
      expect(next.isCodeChange).toBe(true)
      expect(next.history).toHaveLength(1)
      expect(next.history[0]?.to).toBe(IntentState.LOCKED_CODE_CHANGE)
    })

    it("throws when current state is already LOCKED_NON_CODE", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.LOCKED_NON_CODE,
        lastTransitionAt: 0,
        history: [],
      }
      expect(() => lockIntentCodeChange(initial, "INT-20260610-cccccc", "x", [])).toThrow(
        IntentLockStateTransitionError,
      )
    })
  })

  describe("transitionToPhaseReady", () => {
    it("transitions LOCKED_CODE_CHANGE → PHASE_READY and records commit hash", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.LOCKED_CODE_CHANGE,
        lastTransitionAt: 0,
        history: [],
      }
      const next = transitionToPhaseReady(initial, "P27-routing", "a".repeat(40))
      expect(next.state).toBe(IntentState.PHASE_READY)
      expect(next.phaseId).toBe("P27-routing")
      expect(next.history[0]?.commitHash).toBe("a".repeat(40))
    })

    it("throws on UNLOCKED → PHASE_READY", () => {
      const initial = makeUnlockedState()
      expect(() => transitionToPhaseReady(initial, "P27-x", "a".repeat(40))).toThrow(
        IntentLockStateTransitionError,
      )
    })
  })

  describe("transitionToPhaseAuthorized", () => {
    it("transitions PHASE_READY → PHASE_AUTHORIZED", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.PHASE_READY,
        lastTransitionAt: 0,
        history: [],
      }
      const next = transitionToPhaseAuthorized(initial, "b".repeat(40))
      expect(next.state).toBe(IntentState.PHASE_AUTHORIZED)
      expect(next.history[0]?.commitHash).toBe("b".repeat(40))
    })

    it("throws on LOCKED_CODE_CHANGE → PHASE_AUTHORIZED (must go through PHASE_READY first)", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.LOCKED_CODE_CHANGE,
        lastTransitionAt: 0,
        history: [],
      }
      expect(() => transitionToPhaseAuthorized(initial, "c".repeat(40))).toThrow(
        IntentLockStateTransitionError,
      )
    })
  })

  describe("transitionToExecuting", () => {
    it("transitions PHASE_AUTHORIZED → EXECUTING", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.PHASE_AUTHORIZED,
        lastTransitionAt: 0,
        history: [],
      }
      const next = transitionToExecuting(initial, "d".repeat(40))
      expect(next.state).toBe(IntentState.EXECUTING)
      expect(next.history[0]?.commitHash).toBe("d".repeat(40))
    })

    it("throws on PHASE_READY → EXECUTING (must be authorized first)", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.PHASE_READY,
        lastTransitionAt: 0,
        history: [],
      }
      expect(() => transitionToExecuting(initial, "e".repeat(40))).toThrow(
        IntentLockStateTransitionError,
      )
    })
  })

  describe("completeIntent", () => {
    it("transitions EXECUTING → COMPLETED", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.EXECUTING,
        lastTransitionAt: 0,
        history: [],
      }
      const next = completeIntent(initial)
      expect(next.state).toBe(IntentState.COMPLETED)
      expect(next.history[0]?.from).toBe(IntentState.EXECUTING)
    })

    it("throws on EXECUTING → UNLOCKED (no rollback)", () => {
      const initial: IntentLockState = {
        sessionId: "ses_test",
        state: IntentState.EXECUTING,
        lastTransitionAt: 0,
        history: [],
      }
      expect(() => {
        // direct call to validateTransition; completeIntent is the wrong target
        validateTransition(IntentState.EXECUTING, IntentState.UNLOCKED, "ses_test")
      }).toThrow(IntentLockStateTransitionError)
    })
  })

  describe("history append-only", () => {
    it("appends an entry on every successful transition", () => {
      let s = makeUnlockedState()
      s = lockIntentCodeChange(s, "INT-20260610-ddddd0", "summary", ["src"])
      s = transitionToPhaseReady(s, "P27-routing", "a".repeat(40))
      s = transitionToPhaseAuthorized(s, "b".repeat(40))
      s = transitionToExecuting(s, "c".repeat(40))
      s = completeIntent(s)
      expect(s.history).toHaveLength(5)
      expect(s.history.map((h) => h.to)).toEqual([
        IntentState.LOCKED_CODE_CHANGE,
        IntentState.PHASE_READY,
        IntentState.PHASE_AUTHORIZED,
        IntentState.EXECUTING,
        IntentState.COMPLETED,
      ])
    })
  })
})
