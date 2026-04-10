import { describe, it, expect, vi } from "vitest"
import {
  buildNotificationMessage,
  buildTaskNotificationFromContinuity,
  formatToastMessage,
  notifyParentSession,
} from "../../src/lib/notification-handler.js"
import type { TaskNotification } from "../../src/lib/notification-handler.js"
import type { SessionContinuityRecord } from "../../src/lib/types.js"

describe("buildNotificationMessage", () => {
  it("should build system_reminder for completed task", () => {
    const task: TaskNotification = {
      sessionID: "sess-1",
      description: "Research auth module",
      agent: "researcher",
      status: "completed",
    }

    const result = buildNotificationMessage(task)

    expect(result).toContain("<system_reminder>")
    expect(result).toContain("</system_reminder>")
    expect(result).toContain("Research auth module")
    expect(result).toContain("researcher")
    expect(result).toContain("completed")
  })

  it("should include error message for failed task", () => {
    const task: TaskNotification = {
      sessionID: "sess-2",
      description: "Build feature",
      agent: "builder",
      status: "failed",
      error: "timeout",
    }

    const result = buildNotificationMessage(task)

    expect(result).toContain("Error: timeout")
    expect(result).toContain("failed")
  })

  it("should include result summary for completed task", () => {
    const task: TaskNotification = {
      sessionID: "sess-3",
      description: "Build feature",
      agent: "builder",
      status: "completed",
      resultPreview: "3 files changed",
    }

    const result = buildNotificationMessage(task)

    expect(result).toContain("Result: 3 files changed")
  })

  it("should truncate long result previews", () => {
    const longPreview = "a".repeat(200)
    const task: TaskNotification = {
      sessionID: "sess-4",
      description: "Build feature",
      agent: "builder",
      status: "completed",
      resultPreview: longPreview,
    }

    const result = buildNotificationMessage(task)

    expect(result).toContain("...")
    expect(result).not.toContain(longPreview)
    // Truncated preview should be ~103 chars (100 + "...")
    const resultLine = result.split("\n").find((l) => l.includes("Result:"))
    expect(resultLine).toBeDefined()
    const previewPart = resultLine!.slice(resultLine!.indexOf("Result: ") + "Result: ".length)
    expect(previewPart.length).toBeLessThanOrEqual(103)
  })

  it("should handle missing optional fields gracefully", () => {
    const task: TaskNotification = {
      sessionID: "sess-5",
      description: "Review code",
      agent: "critic",
      status: "completed",
    }

    const result = buildNotificationMessage(task)

    expect(result).toContain("<system_reminder>")
    expect(result).toContain("</system_reminder>")
    expect(result).toContain("Review code")
    expect(result).toContain("critic")
    expect(result).not.toContain("Error:")
    expect(result).not.toContain("Result:")
    expect(result).not.toContain("Duration:")
  })

  it("should include duration when provided", () => {
    const task: TaskNotification = {
      sessionID: "sess-6",
      description: "Research",
      agent: "researcher",
      status: "completed",
      duration: 5432,
    }

    const result = buildNotificationMessage(task)

    expect(result).toContain("Duration: 5.4s")
  })
})

describe("formatToastMessage", () => {
  it("should format a one-line toast for completed task", () => {
    const task: TaskNotification = {
      sessionID: "sess-7",
      description: "Research auth module",
      agent: "researcher",
      status: "completed",
    }

    const result = formatToastMessage(task)

    expect(result).toBe("✓ Research auth module completed (researcher)")
  })

  it("should format a one-line toast for failed task", () => {
    const task: TaskNotification = {
      sessionID: "sess-8",
      description: "Build feature",
      agent: "builder",
      status: "failed",
    }

    const result = formatToastMessage(task)

    expect(result).toBe("✗ Build feature failed (builder)")
  })

  it("should format a one-line toast for cancelled task", () => {
    const task: TaskNotification = {
      sessionID: "sess-9",
      description: "Review code",
      agent: "critic",
      status: "cancelled",
    }

    const result = formatToastMessage(task)

    expect(result).toBe("⊘ Review code cancelled (critic)")
  })
})

describe("notifyParentSession", () => {
  it("should call client.session.prompt with noReply and system_reminder", async () => {
    const mockPrompt = vi.fn().mockResolvedValue({ data: {} })
    const client = { session: { prompt: mockPrompt } }
    const task: TaskNotification = {
      sessionID: "child-1",
      description: "Research auth module",
      agent: "researcher",
      status: "completed",
    }

    await notifyParentSession(client, "parent-1", task)

    expect(mockPrompt).toHaveBeenCalledTimes(1)
    const callArgs = mockPrompt.mock.calls[0][0]
    expect(callArgs.path).toEqual({ id: "parent-1" })
    expect(callArgs.body.noReply).toBe(true)
    expect(callArgs.body.parts).toHaveLength(1)
    expect(callArgs.body.parts[0].type).toBe("text")
    expect(callArgs.body.parts[0].text).toContain("<system_reminder>")
    expect(callArgs.body.parts[0].text).toContain("Research auth module")
  })

  it("should not throw if prompt fails (best-effort notification)", async () => {
    const mockPrompt = vi.fn().mockRejectedValue(new Error("session not found"))
    const client = { session: { prompt: mockPrompt } }
    const task: TaskNotification = {
      sessionID: "child-2",
      description: "Build feature",
      agent: "builder",
      status: "completed",
    }

    await expect(notifyParentSession(client, "parent-2", task)).resolves.toBe(false)
  })

  it("should call toastFn if provided", async () => {
    const mockPrompt = vi.fn().mockResolvedValue({ data: {} })
    const mockToast = vi.fn()
    const client = { session: { prompt: mockPrompt } }
    const task: TaskNotification = {
      sessionID: "child-3",
      description: "Review code",
      agent: "critic",
      status: "completed",
    }

    await notifyParentSession(client, "parent-3", task, mockToast)

    expect(mockToast).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith("✓ Review code completed (critic)")
  })

  it("should not throw if toastFn throws", async () => {
    const mockPrompt = vi.fn().mockResolvedValue({ data: {} })
    const mockToast = vi.fn().mockImplementation(() => {
      throw new Error("toast failed")
    })
    const client = { session: { prompt: mockPrompt } }
    const task: TaskNotification = {
      sessionID: "child-4",
      description: "Research",
      agent: "researcher",
      status: "completed",
    }

    await expect(notifyParentSession(client, "parent-4", task, mockToast)).resolves.toBe(true)
  })

  it("should still call toastFn even if prompt fails", async () => {
    const mockPrompt = vi.fn().mockRejectedValue(new Error("session not found"))
    const mockToast = vi.fn()
    const client = { session: { prompt: mockPrompt } }
    const task: TaskNotification = {
      sessionID: "child-5",
      description: "Build",
      agent: "builder",
      status: "failed",
      error: "timeout",
    }

    await notifyParentSession(client, "parent-5", task, mockToast)

    expect(mockToast).toHaveBeenCalledTimes(1)
    expect(mockToast).toHaveBeenCalledWith("✗ Build failed (builder)")
  })
})

describe("Bug 1 regression: started status notification (D-15)", () => {
  it('uses "started work on" summary text for started status', () => {
    const continuity: SessionContinuityRecord = {
      sessionID: "ses_123",
      metadata: {
        description: "research task",
        delegation: {
          agent: "researcher",
        } as SessionContinuityRecord["metadata"]["delegation"],
        lifecycle: {
          launchedAt: 1000,
        },
      } as SessionContinuityRecord["metadata"],
    } as SessionContinuityRecord

    const result = buildTaskNotificationFromContinuity(continuity, "started")

    expect(result.briefSummary).toContain("started work on")
    expect(result.briefSummary).not.toContain("completed")
  })
})
