/**
 * GAP G-3: TUI crash recovery from malformed tool responses
 *
 * Task ID: 08-02-04
 * Requirement: notification-handler must gracefully handle malformed/invalid
 * data without propagating errors to the TUI.
 *
 * Observed failure: When tools return malformed data, the error propagates up
 * to the TUI layer and crashes the entire interface.
 *
 * Root cause hypothesis: buildTaskNotificationFromContinuity() accesses
 * continuity.metadata.delegation?.agent, continuity.metadata.description,
 * continuity.metadata.lifecycle, etc. If the continuity record is malformed
 * (e.g., metadata missing, delegation is not an object, lifecycle has
 * non-numeric timestamps), these access patterns could throw.
 *
 * Also: formatDuration() doesn't handle NaN/Infinity/undefined duration.
 *
 * These tests verify behavioral resilience — no uncaught exceptions, graceful
 * degradation when data is malformed.
 */
import { describe, it, expect, vi } from "vitest"
import {
  buildNotificationMessage,
  buildTaskNotificationFromContinuity,
  formatToastMessage,
  notifyParentSession,
} from "../../src/lib/notification-handler.js"
import type { TaskNotification } from "../../src/lib/notification-handler.js"
import type { SessionContinuityRecord } from "../../src/lib/types.js"

// ---------------------------------------------------------------------------
// Minimal valid continuity record for baseline
// ---------------------------------------------------------------------------

function createValidContinuity(overrides: Record<string, unknown> = {}): SessionContinuityRecord {
  return {
    sessionID: "sess-valid",
    toolProfile: { permissionRules: [], compatibleTools: [] },
    promptParams: { agent: "researcher", tools: [] },
    metadata: {
      parentSessionID: "parent-1",
      rootSessionID: "root-1",
      delegation: {
        rootID: "root-1",
        depth: 1,
        budgetUsed: 1,
        agent: "researcher",
        queueKey: "test-key",
      },
      description: "Test task",
      title: "Test task",
      constraints: [],
      runInBackground: true,
      status: "running" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    ...overrides,
  } as SessionContinuityRecord
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildTaskNotificationFromContinuity: malformed data resilience", () => {
  it("handles missing delegation metadata gracefully", () => {
    const continuity = createValidContinuity()
    // Simulate corrupted record where delegation is undefined
    delete (continuity.metadata as Record<string, unknown>).delegation

    // Should not throw — agent falls back to "unknown"
    const notification = buildTaskNotificationFromContinuity(continuity, "completed")

    expect(notification.agent).toBe("unknown")
    expect(notification.sessionID).toBe("sess-valid")
    expect(notification.status).toBe("completed")
  })

  it("handles delegation as non-object (string instead of object)", () => {
    const continuity = createValidContinuity()
    ;(continuity.metadata as Record<string, unknown>).delegation = "corrupted" as unknown

    // Optional chaining on non-object delegation — agent should fallback
    const notification = buildTaskNotificationFromContinuity(continuity, "completed")

    // delegation?.agent → undefined (string doesn't have .agent), falls to "unknown"
    expect(notification.agent).toBe("unknown")
    expect(notification.sessionID).toBe("sess-valid")
  })

  it("handles delegation as null", () => {
    const continuity = createValidContinuity()
    ;(continuity.metadata as Record<string, unknown>).delegation = null

    const notification = buildTaskNotificationFromContinuity(continuity, "completed")

    expect(notification.agent).toBe("unknown")
  })

  it("handles delegation.agent as number (wrong type) — coerced to string", () => {
    const continuity = createValidContinuity()
    const delegation = continuity.metadata.delegation as Record<string, unknown>
    delegation.agent = 42 as unknown as "researcher"

    // Previously: agent.charAt(0) threw TypeError when agent was non-string.
    // Fixed: String(agent) coercion at notification-handler.ts:110-113.
    const notification = buildTaskNotificationFromContinuity(continuity, "completed")
    expect(notification.agent).toBe("42")
    expect(notification.briefSummary).toContain("42 completed work on")
  })

  it("handles missing description gracefully", () => {
    const continuity = createValidContinuity()
    delete (continuity.metadata as Record<string, unknown>).description

    const notification = buildTaskNotificationFromContinuity(continuity, "completed")

    // Falls back to "Delegated task"
    expect(notification.description).toBe("Delegated task")
  })

  it("handles missing lifecycle timestamps (duration undefined)", () => {
    const continuity = createValidContinuity()
    delete (continuity.metadata as Record<string, unknown>).lifecycle

    const notification = buildTaskNotificationFromContinuity(continuity, "completed")

    // launchedAt is undefined → duration should be undefined
    expect(notification.duration).toBeUndefined()
  })

  it("handles lifecycle with non-numeric launchedAt", () => {
    const continuity = createValidContinuity()
    ;((continuity.metadata as Record<string, unknown>).lifecycle as Record<string, unknown>) = {
      launchedAt: "not-a-number",
      completedAt: Date.now(),
    }

    const notification = buildTaskNotificationFromContinuity(continuity, "completed")

    // "not-a-number" - Date.now() = NaN, but duration will be computed
    // The function does: completedAt - launchedAt (string minus number = NaN)
    // This produces NaN duration — verify no crash
    expect(notification.duration).toBeNaN()
  })

  it("handles completely empty metadata", () => {
    const continuity = {
      sessionID: "sess-empty",
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher" as const, tools: [] },
      metadata: {} as Record<string, unknown>,
    } as unknown as SessionContinuityRecord

    // This tests the extreme case where metadata has none of the expected fields
    const notification = buildTaskNotificationFromContinuity(continuity, "failed", "Something broke")

    expect(notification.agent).toBe("unknown")
    expect(notification.description).toBe("Delegated task")
    expect(notification.status).toBe("failed")
    expect(notification.error).toBe("Something broke")
  })

  it("generates correct briefSummary for research category with malformed data", () => {
    const continuity = createValidContinuity()
    ;(continuity.metadata as Record<string, unknown>).category = "research"
    delete (continuity.metadata as Record<string, unknown>).description

    const notification = buildTaskNotificationFromContinuity(continuity, "completed")

    expect(notification.briefSummary).toContain("completed research")
    expect(notification.description).toBe("Delegated task")
    expect(notification.briefSummary).toBeDefined()
    expect(typeof notification.briefSummary).toBe("string")
  })

  it("generates correct briefSummary for cancelled status", () => {
    const continuity = createValidContinuity()

    const notification = buildTaskNotificationFromContinuity(continuity, "cancelled")

    expect(notification.briefSummary).toBe("Task was cancelled.")
  })

  it("generates correct briefSummary for failed status with no error", () => {
    const continuity = createValidContinuity()

    const notification = buildTaskNotificationFromContinuity(continuity, "failed")

    expect(notification.briefSummary).toContain("Task failed")
    expect(notification.briefSummary).toContain("unknown error")
  })
})

describe("formatDuration: malformed input resilience", () => {
  it("handles NaN duration without crashing in buildNotificationMessage", () => {
    const task: TaskNotification = {
      sessionID: "sess-dur",
      description: "Duration test",
      agent: "builder",
      status: "completed",
      duration: NaN,
    }

    // formatDuration(NaN) — all comparisons with NaN are false,
    // so it falls through to the last branch (hours)
    // NaN / 3600000 = NaN → Math.floor(NaN) = NaN → "NaNh NaNm"
    // This is not ideal but should not throw
    const result = buildNotificationMessage(task)

    expect(result).toContain("<system_reminder>")
    expect(result).toContain("Duration:")
    // No crash — that's the key assertion
  })

  it("handles Infinity duration without crashing", () => {
    const task: TaskNotification = {
      sessionID: "sess-inf",
      description: "Infinity test",
      agent: "builder",
      status: "completed",
      duration: Infinity,
    }

    // Infinity < 1000 is false, Infinity < 60000 is false, Infinity < 3600000 is false
    // Falls through to hours branch: Infinity / 3600000 = Infinity
    // Math.floor(Infinity) = Infinity → "Infinityh NaNm"
    const result = buildNotificationMessage(task)

    expect(result).toContain("<system_reminder>")
    expect(result).toContain("Duration:")
  })

  it("handles zero duration", () => {
    const task: TaskNotification = {
      sessionID: "sess-zero",
      description: "Zero test",
      agent: "builder",
      status: "completed",
      duration: 0,
    }

    const result = buildNotificationMessage(task)
    expect(result).toContain("Duration: 0ms")
  })

  it("handles negative duration", () => {
    const task: TaskNotification = {
      sessionID: "sess-neg",
      description: "Negative test",
      agent: "builder",
      status: "completed",
      duration: -5000,
    }

    // -5000 < 1000 is true → "-5000ms"
    const result = buildNotificationMessage(task)
    expect(result).toContain("Duration: -5000ms")
  })
})

describe("formatToastMessage: malformed data resilience", () => {
  it("handles NaN duration without crashing", () => {
    const task: TaskNotification = {
      sessionID: "sess-toast",
      description: "Toast test",
      agent: "builder",
      status: "completed",
      duration: NaN,
    }

    // Should not throw — formatDuration(NaN) produces a string
    const result = formatToastMessage(task)
    expect(result).toContain("Toast test")
    expect(result).toContain("completed")
  })
})

describe("notifyParentSession: malformed data in notification flow", () => {
  it("does not propagate error when notification has malformed data", async () => {
    const mockPrompt = vi.fn().mockResolvedValue({ data: {} })
    const client = { session: { prompt: mockPrompt } }

    // Create notification with edge-case data
    const task: TaskNotification = {
      sessionID: "sess-malformed",
      description: "", // empty
      agent: "" as "builder", // empty agent
      status: "completed",
      duration: NaN,
    }

    // Should not throw
    const result = await notifyParentSession(
      client as unknown as Parameters<typeof notifyParentSession>[0],
      "parent-malformed",
      task,
    )

    expect(result).toBe(true)
    expect(mockPrompt).toHaveBeenCalledTimes(1)
    // Verify the message was still delivered (best-effort)
    const callArgs = mockPrompt.mock.calls[0][0]
    expect(callArgs.body.parts[0].text).toContain("<system_reminder>")
  })

  it("still calls toastFn even when notification data is malformed", async () => {
    const mockPrompt = vi.fn().mockResolvedValue({ data: {} })
    const mockToast = vi.fn()
    const client = { session: { prompt: mockPrompt } }

    const task: TaskNotification = {
      sessionID: "sess-toast-malformed",
      description: "a".repeat(10000), // oversized description
      agent: "researcher",
      status: "failed",
      error: "e".repeat(5000), // oversized error
    }

    await notifyParentSession(
      client as unknown as Parameters<typeof notifyParentSession>[0],
      "parent-toast",
      task,
      mockToast,
    )

    expect(mockToast).toHaveBeenCalledTimes(1)
    // Toast message should contain the status even with oversized data
    expect(mockToast.mock.calls[0][0]).toContain("failed")
  })

  it("returns false when client.prompt throws with malformed continuity data", async () => {
    const mockPrompt = vi.fn().mockRejectedValue(new Error("Invalid JSON"))
    const client = { session: { prompt: mockPrompt } }

    const task: TaskNotification = {
      sessionID: "sess-client-error",
      description: "Client error test",
      agent: "builder",
      status: "completed",
    }

    const result = await notifyParentSession(
      client as unknown as Parameters<typeof notifyParentSession>[0],
      "parent-error",
      task,
    )

    // Should return false (delivery failed) but not throw
    expect(result).toBe(false)
  })
})

describe("buildNotificationMessage: edge cases with malformed fields", () => {
  it("handles very long description without crashing", () => {
    const task: TaskNotification = {
      sessionID: "sess-long",
      description: "x".repeat(100000),
      agent: "builder",
      status: "completed",
    }

    const result = buildNotificationMessage(task)
    expect(result).toContain("<system_reminder>")
    expect(result).toContain("</system_reminder>")
  })

  it("handles very long error message without crashing", () => {
    const task: TaskNotification = {
      sessionID: "sess-err",
      description: "Error test",
      agent: "builder",
      status: "failed",
      error: "E".repeat(50000),
    }

    const result = buildNotificationMessage(task)
    expect(result).toContain("Error:")
    expect(result).toContain("<system_reminder>")
  })

  it("handles resultPreview exactly at boundary (100 chars)", () => {
    const task: TaskNotification = {
      sessionID: "sess-boundary",
      description: "Boundary test",
      agent: "builder",
      status: "completed",
      resultPreview: "a".repeat(100),
    }

    const result = buildNotificationMessage(task)
    // Exactly 100 chars — should NOT be truncated (only > 100 gets truncated)
    expect(result).toContain("a".repeat(100))
    expect(result).not.toContain("...")
  })

  it("handles resultPreview at 101 chars (just over boundary)", () => {
    const task: TaskNotification = {
      sessionID: "sess-over",
      description: "Over boundary test",
      agent: "builder",
      status: "completed",
      resultPreview: "a".repeat(101),
    }

    const result = buildNotificationMessage(task)
    expect(result).toContain("...")
    // Should have truncated to 100 + "..."
    const resultLine = result.split("\n").find((l) => l.includes("Result:"))!
    const previewPart = resultLine.slice(resultLine.indexOf("Result: ") + "Result: ".length)
    expect(previewPart.length).toBe(103) // 100 + "..."
  })
})
