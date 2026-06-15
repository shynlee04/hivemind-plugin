/**
 * Intent-lock gate — structured guidance tests (AC-38, AC-39, AC-48).
 *
 * Verifies that `IntentLockBlockedError` exposes a `guidance` property with
 * the four required fields, that the populated guidance matches the
 * state-to-guidance map, and that the formatted message contains an
 * actionable State/Reason/Fix/Hint pattern (P27.2 per AC-39).
 *
 * Evidence label: transport-mocked — real hook + error class through
 * public seam with classifier and store replaced by in-process mocks.
 *
 * Test size: small (single unit, public seam, focused command).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { IntentLockBlockedError, IntentState } from "../../../src/features/intent-lock/types.js"
import {
  createIntentLockGateHook,
  resetSoftStartTracking,
} from "../../../src/hooks/guards/intent-lock-gate.js"

import type { IntentLockGateDeps } from "../../../src/hooks/guards/intent-lock-gate.js"

/** All gated states that must produce guidance. */
const GATED_STATES: IntentState[] = [
  IntentState.UNLOCKED,
  IntentState.LOCKED_CODE_CHANGE,
  IntentState.PHASE_READY,
  IntentState.PHASE_AUTHORIZED,
  IntentState.EXECUTING,
]

/** Build mock deps with sensible defaults. */
function buildMockDeps(overrides: Partial<IntentLockGateDeps> = {}): IntentLockGateDeps {
  return {
    projectRoot: "/project",
    getConfig: () => ({ enabled: true }),
    readIntentLockState: vi.fn().mockReturnValue({
      state: IntentState.UNLOCKED,
      phaseId: undefined,
      intentId: undefined,
      summary: undefined,
    }),
    classifier: {
      classify: vi.fn().mockResolvedValue({ kind: "root", gate: "sdk" }),
    },
    getSessionSafely: vi.fn().mockResolvedValue({}),
    stateFileExists: () => true,
    logWarn: vi.fn(),
    ...overrides,
  }
}

beforeEach(() => {
  resetSoftStartTracking()
})

afterEach(() => {
  resetSoftStartTracking()
})

/** Trigger the gate and return the thrown IntentLockBlockedError. */
async function triggerBlock(state: IntentState): Promise<IntentLockBlockedError> {
  const deps = buildMockDeps({
    readIntentLockState: vi.fn().mockReturnValue({
      state,
      phaseId: state === IntentState.UNLOCKED ? undefined : "P27.1-test",
      intentId: state === IntentState.UNLOCKED ? undefined : "INT-20260610-abcdef",
      summary: state === IntentState.UNLOCKED ? undefined : "test",
    }),
  })
  const hook = createIntentLockGateHook(deps)
  // Use a tool that's NOT in any gated state's allowed set, so the resolver
  // always denies. `custom-blocked-tool` is not a read-only bypass, not in
  // any matrix entry, and is denied in every gated state.
  try {
    await hook(
      { tool: "custom-blocked-tool", sessionID: "ses_test_guidance" },
      { args: {} },
    )
    throw new Error("Hook should have thrown")
  } catch (err) {
    if (!(err instanceof IntentLockBlockedError)) {
      throw err
    }
    return err
  }
}

describe("IntentLockBlockedError guidance (AC-38, AC-39, AC-48)", () => {
  describe.each(GATED_STATES)("state %s produces structured guidance", (state) => {
    it("AC-38: guidance property is an object with all 4 fields", async () => {
      const err = await triggerBlock(state)
      expect(err.guidance).toBeDefined()
      expect(typeof err.guidance).toBe("object")
    })

    it("AC-38: guidance.currentState is a non-empty string matching the state", async () => {
      const err = await triggerBlock(state)
      expect(err.guidance.currentState).toBe(state)
      expect(typeof err.guidance.currentState).toBe("string")
      expect(err.guidance.currentState.length).toBeGreaterThan(0)
    })

    it("AC-38: guidance.requiredEvidence is a non-empty string[]", async () => {
      const err = await triggerBlock(state)
      expect(Array.isArray(err.guidance.requiredEvidence)).toBe(true)
      expect(err.guidance.requiredEvidence.length).toBeGreaterThan(0)
      for (const item of err.guidance.requiredEvidence) {
        expect(typeof item).toBe("string")
        expect(item.length).toBeGreaterThan(0)
      }
    })

    it("AC-38: guidance.suggestedActions is a non-empty string[]", async () => {
      const err = await triggerBlock(state)
      expect(Array.isArray(err.guidance.suggestedActions)).toBe(true)
      expect(err.guidance.suggestedActions.length).toBeGreaterThan(0)
      for (const item of err.guidance.suggestedActions) {
        expect(typeof item).toBe("string")
        expect(item.length).toBeGreaterThan(0)
      }
    })

    it("AC-38: guidance.checkpointDescription is a non-empty string", async () => {
      const err = await triggerBlock(state)
      expect(typeof err.guidance.checkpointDescription).toBe("string")
      expect(err.guidance.checkpointDescription.length).toBeGreaterThan(0)
    })
  })

  it("AC-39: error message includes actionable Fix: numbered action steps pattern", async () => {
    const err = await triggerBlock(IntentState.LOCKED_CODE_CHANGE)
    // P27.2 format: State/Reason/Fix/Hint with numbered fix steps
    expect(err.message).toMatch(/Fix:\s+\d+\.\s+\w+/)
    // At least one fix step must be present in guidance
    const fixStep = err.guidance.fixSteps![0]
    expect(fixStep).toBeDefined()
    expect(fixStep).toMatch(/^\d+\.\s+\w+/)
    // The fix step must appear in the message
    expect(err.message).toContain(fixStep)
  })

  it("AC-48: requiredEvidence is programmatically parseable as string[] (not embedded in message)", async () => {
    const err = await triggerBlock(IntentState.PHASE_READY)
    expect(Array.isArray(err.guidance.requiredEvidence)).toBe(true)
    // Test does NOT parse the message string — only the typed array
    expect(err.guidance.requiredEvidence.length).toBeGreaterThanOrEqual(1)
  })

  it("AC-48: suggestedActions is programmatically parseable as string[] (not embedded in message)", async () => {
    const err = await triggerBlock(IntentState.PHASE_AUTHORIZED)
    expect(Array.isArray(err.guidance.suggestedActions)).toBe(true)
    expect(err.guidance.suggestedActions.length).toBeGreaterThanOrEqual(1)
  })

  it("AC-38: guidance is included in JSON-serializable error shape", () => {
    const guidance = {
      currentState: IntentState.EXECUTING,
      requiredEvidence: ["Test results"],
      suggestedActions: ["Run tests"],
      checkpointDescription: "Need test evidence",
    }
    const err = new IntentLockBlockedError({
      toolName: "write",
      currentState: IntentState.EXECUTING,
      reason: "test reason",
      guidance,
    })
    expect(err.guidance).toEqual(guidance)
  })
})

/**
 * T10 (AC-39): guidance.suggestedActions and fixSteps must reference the
 * `hm-intent-checkpoint` tool so the agent knows how to advance:
 * - LOCKED_CODE_CHANGE / PHASE_READY / PHASE_AUTHORIZED → submit reference
 * - EXECUTING → confirm reference (at critical transition)
 */
describe("hm-intent-checkpoint references in guidance (AC-39, T10)", () => {
  const SUBMIT_STATES: IntentState[] = [
    IntentState.LOCKED_CODE_CHANGE,
    IntentState.PHASE_READY,
    IntentState.PHASE_AUTHORIZED,
  ]

  it.each(SUBMIT_STATES)(
    "state %s guidance.suggestedActions includes hm-intent-checkpoint submit reference",
    async (state) => {
      const err = await triggerBlock(state)
      const hasSubmitRef = err.guidance.suggestedActions.some(
        (a) => /hm-intent-checkpoint.*action\s*=\s*['"]submit['"]/.test(a),
      )
      expect(hasSubmitRef).toBe(true)
    },
  )

  it("EXECUTING guidance.suggestedActions includes hm-intent-checkpoint confirm reference", async () => {
    const err = await triggerBlock(IntentState.EXECUTING)
    const hasConfirmRef = err.guidance.suggestedActions.some(
      (a) => /hm-intent-checkpoint.*action\s*=\s*['"]confirm['"]/.test(a),
    )
    expect(hasConfirmRef).toBe(true)
  })

  it("UNLOCKED guidance includes hm-intent-checkpoint for intent declaration (REQ-4)", async () => {
    const err = await triggerBlock(IntentState.UNLOCKED)
    const hasRef = err.guidance.suggestedActions.some(
      (a) => /hm-intent-checkpoint/.test(a),
    )
    // P27.3 REQ-4: UNLOCKED guidance now references hm-intent-checkpoint to let
    // agents declare intent via submit action (intent_locked checkpoint triggers
    // auto-transition to LOCKED_CODE_CHANGE).
    expect(hasRef).toBe(true)

    // P27.3 Gap-2: UNLOCKED guidance includes question tool override suggestion
    const hasOverrideRef = err.guidance.suggestedActions.some(
      (a) => /gate override/.test(a),
    )
    expect(hasOverrideRef).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// P27.2 T2: AC-XX — Error feedback pattern (fixSteps, hint)
// Evidence: transport-mocked — real hook + error class through public seam.
// ---------------------------------------------------------------------------

describe("P27.2: error feedback pattern (fixSteps, hint)", () => {
  it("guidance includes fixSteps field with fix instructions", async () => {
    const err = await triggerBlock(IntentState.UNLOCKED)
    expect(err.guidance.fixSteps).toBeDefined()
    expect(Array.isArray(err.guidance.fixSteps)).toBe(true)
    expect(err.guidance.fixSteps!.length).toBeGreaterThan(0)
    for (const step of err.guidance.fixSteps!) {
      expect(typeof step).toBe("string")
      expect(step.length).toBeGreaterThan(0)
    }
  })

  it("guidance includes hint field for next unlock step", async () => {
    const err = await triggerBlock(IntentState.UNLOCKED)
    expect(err.guidance.hint).toBeDefined()
    expect(typeof err.guidance.hint).toBe("string")
    expect(err.guidance.hint!.length).toBeGreaterThan(0)
  })

  it.each([
    IntentState.UNLOCKED,
    IntentState.LOCKED_CODE_CHANGE,
    IntentState.PHASE_READY,
    IntentState.PHASE_AUTHORIZED,
    IntentState.EXECUTING,
  ])("state %s includes both fixSteps and hint in guidance", async (state) => {
    const err = await triggerBlock(state)
    expect(err.guidance.fixSteps).toBeDefined()
    expect(err.guidance.hint).toBeDefined()
    expect(err.guidance.fixSteps!.length).toBeGreaterThan(0)
    expect(err.guidance.hint!.length).toBeGreaterThan(0)
  })

  it("formatBlockMessage produces State/Reason/Fix/Hint sections", () => {
    const err = new IntentLockBlockedError({
      toolName: "write",
      currentState: IntentState.UNLOCKED,
      reason: "intent not classified yet",
      guidance: {
        currentState: IntentState.UNLOCKED,
        requiredEvidence: ["Classified intent"],
        suggestedActions: ["Classify via hm-intent-loop"],
        checkpointDescription: "No intent declared",
        fixSteps: [
          "1. Use task hm-intent-loop to classify the user's prompt",
          "2. Get user confirmation via question tool at C1.3 checkpoint",
          "3. Submit hm-intent-checkpoint submit checkpoint:c1_3",
        ],
        hint: "The orchestrator will automatically transition to SL-2 after C1.3 passes",
      },
    })
    // Must contain the new 3-field pattern
    expect(err.message).toContain("State:")
    expect(err.message).toContain("Reason:")
    expect(err.message).toContain("Fix:")
    expect(err.message).toContain("Hint:")
    // Must contain actionable guidance
    expect(err.message).toContain("hm-intent-loop")
    expect(err.message).toContain("C1.3")
  })

  it("formatBlockMessage State field includes state name and one-line why", () => {
    const err = new IntentLockBlockedError({
      toolName: "write",
      currentState: IntentState.UNLOCKED,
      reason: "intent not classified",
      guidance: {
        currentState: IntentState.UNLOCKED,
        requiredEvidence: ["Evidence"],
        suggestedActions: ["Action"],
        checkpointDescription: "desc",
        fixSteps: ["1. Fix it"],
        hint: "Try X",
      },
    })
    expect(err.message).toMatch(/State:\s*UNLOCKED/)
  })
})
