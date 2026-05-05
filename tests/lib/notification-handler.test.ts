import { describe, it, expect, vi } from "vitest"
import {
  buildNotificationMessage,
  formatToastMessage,
  notifyParentSession,
} from "../../src/lib/notification-handler.js"
import type { TaskNotification } from "../../src/lib/types.js"

/**
 * Stateful fake client that records sent prompts.
 * Matches the OpenCode SDK shape: session.prompt takes
 * { path: { id: string }, body: unknown }.
 */
function createFakeClient() {
  const sentPrompts: Array<{ sessionID: string; body: unknown }> = []
  return {
    session: {
      prompt: vi.fn(async (request: { path: { id: string }; body: unknown }) => {
        sentPrompts.push({ sessionID: request.path.id, body: request.body })
        // Return data-wrapped response that unwrapData extracts
        return { data: "{}" }
      }),
      // getSessionMessages uses client.session.messages(params)
      messages: vi.fn(async () => ({ data: { messages: [] } })),
    },
    getSentPrompts: () => sentPrompts,
  }
}

describe("buildNotificationMessage", () => {
  it('contains "started" label for started status', () => {
    const task: TaskNotification = {
      delegationId: "delg_001",
      agent: "builder",
      title: "Test delegation",
      status: "started",
      description: "Building components",
      sessionID: "ses_001",
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain("started")
    expect(message).toContain("builder")
    expect(message).toContain("Building components")
    expect(message).toContain("<system_reminder>")
    expect(message).toContain("</system_reminder>")
  })

  it('contains "completed" label for completed status', () => {
    const task: TaskNotification = {
      delegationId: "delg_002",
      agent: "researcher",
      title: "Research task",
      status: "completed",
      description: "Researching patterns",
      sessionID: "ses_002",
      resultPreview: "Found 3 patterns",
      briefSummary: "Research complete.",
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain("completed")
    expect(message).toContain("Found 3 patterns")
    expect(message).toContain("Research complete.")
  })

  it('contains "failed" label and error details for failed status', () => {
    const task: TaskNotification = {
      delegationId: "delg_003",
      agent: "builder",
      title: "Failed task",
      status: "failed",
      description: "Building module",
      sessionID: "ses_003",
      error: "TypeError: Cannot read property of undefined",
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain("failed")
    expect(message).toContain("TypeError: Cannot read property of undefined")
  })

  it('contains "cancelled" label for cancelled status', () => {
    const task: TaskNotification = {
      delegationId: "delg_004",
      agent: "builder",
      title: "Cancelled task",
      status: "cancelled",
      description: "Building canceled work",
      sessionID: "ses_004",
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain("cancelled")
  })

  it("truncates result preview >500 characters", () => {
    const longResult = "x".repeat(600)
    const task: TaskNotification = {
      delegationId: "delg_005",
      agent: "builder",
      title: "Long result",
      status: "completed",
      description: "Task with long result",
      sessionID: "ses_005",
      resultPreview: longResult,
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain("...")
    // Should contain truncated content (500 chars + "...")
    expect(message).not.toContain("x".repeat(501))
  })

  it("handles result preview exactly at 500 chars without truncation", () => {
    const exactResult = "y".repeat(500)
    const task: TaskNotification = {
      delegationId: "delg_006",
      agent: "builder",
      title: "Exact result",
      status: "completed",
      description: "Exact length result",
      sessionID: "ses_006",
      resultPreview: exactResult,
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain(exactResult)
    // Should NOT have truncation "..." after the result
    const resultIdx = message.indexOf(exactResult)
    const afterResult = message.slice(resultIdx + exactResult.length)
    expect(afterResult).not.toContain("...")
  })

  it("includes outputLink when provided", () => {
    const task: TaskNotification = {
      delegationId: "delg_007",
      agent: "builder",
      title: "Linked task",
      status: "completed",
      description: "Task with link",
      sessionID: "ses_007",
      outputLink: "session://ses_007",
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain("session://ses_007")
  })

  it("includes metadata JSON when provided", () => {
    const task: TaskNotification = {
      delegationId: "delg_008",
      agent: "builder",
      title: "Metadata task",
      status: "completed",
      description: "Task with metadata",
      sessionID: "ses_008",
      metadata: { customKey: "customValue" },
    }
    const message = buildNotificationMessage(task)
    expect(message).toContain('"customKey"')
    expect(message).toContain('"customValue"')
  })
})

describe("formatToastMessage", () => {
  it("produces single-line started summary", () => {
    const task: TaskNotification = {
      delegationId: "delg_010",
      agent: "builder",
      title: "Toast test",
      status: "started",
      description: "Building toast",
      sessionID: "ses_010",
    }
    const toast = formatToastMessage(task)
    expect(toast).toContain("▶")
    expect(toast).toContain("started")
    expect(toast).toContain("builder")
    // Single line
    expect(toast).not.toContain("\n")
  })

  it("produces single-line completed summary with duration", () => {
    const task: TaskNotification = {
      delegationId: "delg_011",
      agent: "researcher",
      title: "Toast complete",
      status: "completed",
      description: "Research done",
      sessionID: "ses_011",
      duration: 5000,
    }
    const toast = formatToastMessage(task)
    expect(toast).toContain("✓")
    expect(toast).toContain("completed")
    expect(toast).toContain("5.0s")
  })
})

describe("notifyParentSession (integration with fake client)", () => {
  it("sends prompt to parent session via fake client", async () => {
    const client = createFakeClient()
    const task: TaskNotification = {
      delegationId: "delg_100",
      agent: "builder",
      title: "Integration test",
      status: "completed",
      description: "Integration task",
      sessionID: "child_ses",
    }

    const delivered = await notifyParentSession(
      client as never,
      "ses_parent_001",
      task
    )

    expect(delivered).toBe(true)
    const prompts = client.getSentPrompts()
    expect(prompts.length).toBe(1)
    expect(prompts[0].sessionID).toBe("ses_parent_001")
    // Body should contain notification message
    const body = prompts[0].body as { parts: Array<{ text: string }> }
    expect(body.parts[0].text).toContain("completed")
    expect(body.parts[0].text).toContain("builder")
  })

  it("returns false when sendPrompt fails", async () => {
    const client = {
      session: {
        prompt: vi.fn(async () => {
          throw new Error("Connection lost")
        }),
      },
    }
    const task: TaskNotification = {
      delegationId: "delg_101",
      agent: "builder",
      title: "Fail test",
      status: "completed",
      description: "Should fail",
      sessionID: "child_ses",
    }

    const delivered = await notifyParentSession(
      client as never,
      "ses_parent_002",
      task
    )

    expect(delivered).toBe(false)
  })
})
