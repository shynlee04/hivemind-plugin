/**
 * hm-intent-checkpoint tool tests (AC-42, AC-43, AC-45, AC-46, AC-47).
 *
 * Verifies the tool's three actions:
 * - `submit`: validates + persists checkpoint evidence via store, shows toast.
 * - `confirm`: presents user questions at critical transitions, shows toast.
 * - `status`: returns current checkpoint info.
 *
 * Evidence label: transport-mocked — tool + showTuiToast with the
 * showToast transport replaced by an in-process mock.
 *
 * Test size: small (single unit, public seam, focused command).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { IntentState } from "../../../src/features/intent-lock/types.js"
import type { OpenCodeClient } from "../../../src/shared/session-api.js"

// Mock showTuiToast (handler under test) — replace with vi.fn()
vi.mock("../../../src/shared/session-api.js", () => ({
  showTuiToast: vi.fn().mockResolvedValue(undefined),
}))

// Mock the store's submitCheckpointEvidence + readIntentLockState
vi.mock("../../../src/features/intent-lock/store.js", () => ({
  submitCheckpointEvidence: vi.fn(),
  readIntentLockState: vi.fn(),
}))

import { showTuiToast } from "../../../src/shared/session-api.js"
import {
  readIntentLockState,
  submitCheckpointEvidence,
} from "../../../src/features/intent-lock/store.js"
import { createIntentCheckpointTool } from "../../../src/tools/hivemind/hm-intent-checkpoint.js"

/** Build a minimal client stub. */
function buildMockClient(): OpenCodeClient {
  return {} as OpenCodeClient
}

/** Invoke the tool with a given arg shape. Returns the tool's output. */
async function invoke(
  toolInstance: ReturnType<typeof createIntentCheckpointTool>,
  args: Record<string, unknown>,
  context: { sessionID?: string; directory?: string; projectRoot?: string } = {
    sessionID: "ses_test_cp",
    projectRoot: "/tmp/test",
  },
): Promise<Record<string, unknown>> {
  // The tool is a factory result; call its execute function directly.
  // Tool signature: execute(args, context)
  const toolRecord = toolInstance as unknown as {
    execute: (a: unknown, c: unknown) => Promise<unknown>
  }
  const raw = await toolRecord.execute(args, context)
  // renderToolResult wraps output as JSON string
  if (typeof raw === "string") {
    return JSON.parse(raw) as Record<string, unknown>
  }
  return raw as Record<string, unknown>
}

beforeEach(() => {
  vi.mocked(showTuiToast).mockClear().mockResolvedValue(undefined)
  vi.mocked(submitCheckpointEvidence).mockReset()
  vi.mocked(readIntentLockState).mockReset()
})

afterEach(() => {
  vi.mocked(showTuiToast).mockReset()
  vi.mocked(submitCheckpointEvidence).mockReset()
  vi.mocked(readIntentLockState).mockReset()
})

describe("hm-intent-checkpoint — submit action (AC-45, AC-42)", () => {
  it("AC-45: submit with valid evidence returns ACCEPTED + success toast", async () => {
    vi.mocked(submitCheckpointEvidence).mockReturnValue({
      accepted: true,
      checkpointId: "pre_executing",
    })
    vi.mocked(readIntentLockState).mockReturnValue({
      sessionId: "ses_test_cp",
      state: IntentState.PHASE_AUTHORIZED,
      lastTransitionAt: 0,
      history: [],
      checkpointEvidence: {},
    })

    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = await invoke(toolInstance, {
      action: "submit",
      checkpoint: "pre_executing",
      evidence: ["committed PLAN.md", "tests pass"],
    })

    expect(result.status).toBe("ACCEPTED")
    expect(result.checkpointId).toBe("pre_executing")
    expect(submitCheckpointEvidence).toHaveBeenCalledWith(
      "/tmp/test",
      "ses_test_cp",
      "pre_executing",
      ["committed PLAN.md", "tests pass"],
    )
    // AC-42: success toast on checkpoint pass
    expect(showTuiToast).toHaveBeenCalledTimes(1)
    const firstCall = vi.mocked(showTuiToast).mock.calls[0]
    expect(firstCall).toBeDefined()
    const [client, message, variant] = firstCall!
    expect(client).toBeDefined()
    expect(message).toContain("Checkpoint")
    expect(message).toContain("pre_executing")
    expect(message).toContain("passed")
    expect(variant).toBe("success")
  })

  it("AC-45: submit with empty evidence returns REJECTED + no toast", async () => {
    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "submit",
      checkpoint: "pre_executing",
      evidence: [],
    }))

    expect(result.status).toBe("REJECTED")
    expect(result.reason).toBe("Evidence required")
    expect(submitCheckpointEvidence).not.toHaveBeenCalled()
    expect(showTuiToast).not.toHaveBeenCalled()
  })

  it("AC-45: submit when store returns REJECTED surfaces reason + no toast", async () => {
    vi.mocked(submitCheckpointEvidence).mockReturnValue({
      accepted: false,
      reason: "Evidence items must be non-empty strings",
    })

    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "submit",
      checkpoint: "pre_executing",
      evidence: [""],
    }))

    expect(result.status).toBe("REJECTED")
    expect(result.reason).toBe("Evidence items must be non-empty strings")
    expect(showTuiToast).not.toHaveBeenCalled()
  })
})

describe("hm-intent-checkpoint — confirm action (AC-46, AC-47, AC-43)", () => {
  it("AC-46: confirm pre_executing returns PENDING_CONFIRMATION with question payload", async () => {
    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "confirm",
      checkpoint: "pre_executing",
    }))

    // When client interaction is unavailable, return PENDING_CONFIRMATION
    // with a guidance payload the agent can use to invoke the built-in
    // question tool.
    expect(result.status).toBe("PENDING_CONFIRMATION")
    expect(result.checkpointId).toBe("pre_executing")
    const guidance = result.guidance as string
    expect(guidance).toContain("question")
    // Pre_executing options
    expect(guidance).toContain("Proceed to execution")
    expect(guidance).toContain("Review intent first")
  })

  it("AC-47: confirm pre_verifying returns PENDING_CONFIRMATION with question payload", async () => {
    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "confirm",
      checkpoint: "pre_verifying",
    }))

    expect(result.status).toBe("PENDING_CONFIRMATION")
    expect(result.checkpointId).toBe("pre_verifying")
    const guidance = result.guidance as string
    expect(guidance).toContain("question")
    expect(guidance).toContain("Begin verification")
    expect(guidance).toContain("Continue implementation")
  })

  it("AC-46: confirm with unknown checkpoint returns REJECTED", async () => {
    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "confirm",
      checkpoint: "unknown_checkpoint",
    }))

    expect(result.status).toBe("REJECTED")
    expect(result.reason as string).toContain("Unknown confirmation checkpoint")
    expect(showTuiToast).not.toHaveBeenCalled()
  })
})

describe("hm-intent-checkpoint — status action", () => {
  it("returns current state, hasEvidence, and evidence array", async () => {
    vi.mocked(readIntentLockState).mockReturnValue({
      sessionId: "ses_test_cp",
      state: IntentState.EXECUTING,
      lastTransitionAt: 0,
      history: [],
      checkpointEvidence: {
        pre_executing: ["committed PLAN.md", "tests pass"],
      },
    })

    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "status",
      checkpoint: "pre_executing",
    }))

    expect(result.checkpoint).toBe("pre_executing")
    expect(result.currentState).toBe(IntentState.EXECUTING)
    expect(result.hasEvidence).toBe(true)
    expect(result.evidence).toEqual(["committed PLAN.md", "tests pass"])
  })

  it("returns hasEvidence=false when no evidence for the checkpoint", async () => {
    vi.mocked(readIntentLockState).mockReturnValue({
      sessionId: "ses_test_cp",
      state: IntentState.LOCKED_CODE_CHANGE,
      lastTransitionAt: 0,
      history: [],
      checkpointEvidence: {},
    })

    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "status",
      checkpoint: "pre_executing",
    }))

    expect(result.hasEvidence).toBe(false)
    expect(result.evidence).toEqual([])
  })
})

describe("hm-intent-checkpoint — unknown action", () => {
  it("returns REJECTED for an unrecognized action", async () => {
    const toolInstance = createIntentCheckpointTool(buildMockClient())
    const result = (await invoke(toolInstance, {
      action: "nonsense",
      checkpoint: "x",
    }))

    expect(result.status).toBe("REJECTED")
    expect(result.reason as string).toContain("Unknown action")
  })
})
