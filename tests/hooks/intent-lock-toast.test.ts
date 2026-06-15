/**
 * Intent-lock toast handler tests (AC-40, AC-41).
 *
 * Verifies the PostToolUse handler:
 * - Fires a `warning` toast when an `IntentLockBlockedError` is on the
 *   output (AC-41), with a message containing the blocked tool name and
 *   required evidence.
 * - Does NOT fire a toast when the output has no error.
 * - `activateGateToast` fires an `info` toast with the state name (AC-40).
 *
 * Evidence label: transport-mocked — handler + showTuiToast with the
 * showToast transport replaced by an in-process mock.
 *
 * Test size: small (single unit, public seam, focused command).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  IntentLockBlockedError,
  IntentState,
  type IntentLockGuidance,
} from "../../src/features/intent-lock/types.js"

// Mock showTuiToast — replace it with a vi.fn() we can inspect.
// vi.mock is hoisted by vitest; the imported reference below IS the mock.
vi.mock("../../src/shared/session-api.js", () => ({
  showTuiToast: vi.fn().mockResolvedValue(undefined),
}))

import { showTuiToast, type OpenCodeClient } from "../../src/shared/session-api.js"
import {
  activateGateToast,
  createIntentLockToastHandler,
} from "../../src/hooks/handlers/intent-lock-toast-handler.js"

/** Build a minimal client stub — only the surface the handler needs. */
function buildMockClient(): OpenCodeClient {
  return {} as OpenCodeClient
}

beforeEach(() => {
  vi.mocked(showTuiToast).mockClear()
})

afterEach(() => {
  vi.mocked(showTuiToast).mockReset()
})

describe("createIntentLockToastHandler (PostToolUse chain)", () => {
  it("AC-41: fires a 'warning' toast when IntentLockBlockedError is on output", async () => {
    const client = buildMockClient()
    const handler = createIntentLockToastHandler(client)

    const guidance: IntentLockGuidance = {
      currentState: IntentState.LOCKED_CODE_CHANGE,
      requiredEvidence: ["Committed landscape artifact", "Phase ROADMAP/STATE alignment"],
      suggestedActions: ["Run hm-phase-researcher"],
      checkpointDescription: "Intent declared and locked.",
    }
    const error = new IntentLockBlockedError({
      toolName: "write",
      currentState: IntentState.LOCKED_CODE_CHANGE,
      reason: "tool not allowed in this state",
      guidance,
    })

    await handler({ tool: "write" }, { error })

    expect(showTuiToast).toHaveBeenCalledTimes(1)
    const firstCall = vi.mocked(showTuiToast).mock.calls[0]
    expect(firstCall).toBeDefined()
    const [calledClient, message, variant] = firstCall!
    expect(calledClient).toBe(client)
    expect(message).toContain("Gate blocked")
    expect(message).toContain("write")
    expect(message).toContain("Committed landscape artifact")
    expect(variant).toBe("warning")
  })

  it("AC-41: toast message joins all requiredEvidence items", async () => {
    const client = buildMockClient()
    const handler = createIntentLockToastHandler(client)

    const guidance: IntentLockGuidance = {
      currentState: IntentState.PHASE_READY,
      requiredEvidence: ["ROADMAP.md sync", "STATE.md sync"],
      suggestedActions: ["Sync docs"],
      checkpointDescription: "Sync planning documents.",
    }
    const error = new IntentLockBlockedError({
      toolName: "edit",
      currentState: IntentState.PHASE_READY,
      reason: "test",
      guidance,
    })

    await handler({ tool: "edit" }, { error })

    const firstCall = vi.mocked(showTuiToast).mock.calls[0]
    expect(firstCall).toBeDefined()
    const message = firstCall![1] as string
    expect(message).toContain("ROADMAP.md sync")
    expect(message).toContain("STATE.md sync")
  })

  it("does NOT fire a toast when output has no error", async () => {
    const client = buildMockClient()
    const handler = createIntentLockToastHandler(client)

    await handler({ tool: "write" }, { args: {} })

    expect(showTuiToast).not.toHaveBeenCalled()
  })

  it("does NOT fire a toast when output has a non-IntentLockBlockedError", async () => {
    const client = buildMockClient()
    const handler = createIntentLockToastHandler(client)

    await handler({ tool: "write" }, { error: new Error("some other error") })

    expect(showTuiToast).not.toHaveBeenCalled()
  })

  it("does NOT fire a toast when output is missing", async () => {
    const client = buildMockClient()
    const handler = createIntentLockToastHandler(client)

    await handler({ tool: "write" }, undefined)

    expect(showTuiToast).not.toHaveBeenCalled()
  })
})

describe("activateGateToast (AC-40)", () => {
  it("AC-40: fires an 'info' toast with state name on gate activation", async () => {
    const client = buildMockClient()

    await activateGateToast(client, IntentState.LOCKED_CODE_CHANGE)

    expect(showTuiToast).toHaveBeenCalledTimes(1)
    const firstCall = vi.mocked(showTuiToast).mock.calls[0]
    expect(firstCall).toBeDefined()
    const [calledClient, message, variant] = firstCall!
    expect(calledClient).toBe(client)
    expect(message).toContain("Intent Lock Gate active")
    expect(message).toContain(IntentState.LOCKED_CODE_CHANGE)
    expect(variant).toBe("info")
  })

  it("AC-40: works for any state value", async () => {
    const client = buildMockClient()

    await activateGateToast(client, IntentState.UNLOCKED)

    const firstCall = vi.mocked(showTuiToast).mock.calls[0]
    expect(firstCall).toBeDefined()
    const message = firstCall![1] as string
    expect(message).toContain(IntentState.UNLOCKED)
  })
})
