import { describe, it, expect, vi } from "vitest"
import {
  buildNotificationMessage,
  formatToastMessage,
  notifyParentSession,
  notifyDelegationTerminal,
  reactivateSessionStream,
} from "../../src/coordination/completion/notification-handler.js"
import type { TaskNotification } from "../../src/shared/types.js"
import type { Delegation } from "../../src/shared/types.js"

/**
 * Stateful fake client that records sent prompts and toasts.
 * Matches the OpenCode SDK v1.14.44 shape.
 *
 * Step 1 changes:
 * - Adds `promptAsync` tracking (fire-and-forget context injection)
 * - Adds `showToast` tracking (user-visible toast)
 * - Removes `appendPrompt` (BUG — pollutes user input)
 */
function createFakeClient() {
  const sentPrompts: Array<{ sessionID: string; body: unknown }> = []
  const sentAsyncPrompts: Array<{ sessionID: string; body: unknown }> = []
  const sentToasts: Array<{ message: string; variant?: string }> = []
  return {
    session: {
      prompt: vi.fn(async (request: { path: { id: string }; body: unknown }) => {
        sentPrompts.push({ sessionID: request.path.id, body: request.body })
        // Return data-wrapped response that unwrapData extracts
        return { data: "{}" }
      }),
      promptAsync: vi.fn(async (request: { path: { id: string }; body: unknown }) => {
        sentAsyncPrompts.push({ sessionID: request.path.id, body: request.body })
        // promptAsync returns 204 No Content — void
      }),
      // getSessionMessages uses client.session.messages(params)
      messages: vi.fn(async () => ({ data: { messages: [] } })),
    },
    tui: {
      showToast: vi.fn(async (request: { body: { message: string; variant?: string } }) => {
        sentToasts.push({ message: request.body.message, variant: request.body.variant })
        return { data: true }
      }),
    },
    app: {
      log: vi.fn(),
    },
    getSentPrompts: () => sentPrompts,
    getSentAsyncPrompts: () => sentAsyncPrompts,
    getSentToasts: () => sentToasts,
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

describe("notifyParentSession (Step 1 — toast + async context injection)", () => {
  it("shows toast and injects context via promptAsync for any status", async () => {
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

    // 1. Toast was shown
    const toasts = client.getSentToasts()
    expect(toasts.length).toBe(1)
    expect(toasts[0].message).toContain("completed")
    expect(toasts[0].message).toContain("builder")
    expect(toasts[0].variant).toBe("success")

    // 2. Context injected via promptAsync (fire-and-forget)
    const asyncPrompts = client.getSentAsyncPrompts()
    expect(asyncPrompts.length).toBe(1)
    const body = asyncPrompts[0].body as { parts: Array<{ text: string }>; noReply: boolean }
    expect(body.noReply).toBe(true)
    expect(body.parts[0].text).toContain("completed")
    expect(body.parts[0].text).toContain("builder")
  })

  it("shows info toast + async context for non-terminal (started) status", async () => {
    const client = createFakeClient()
    const task: TaskNotification = {
      delegationId: "delg_102",
      agent: "builder",
      title: "Silent test",
      status: "started",
      description: "Silent progress update",
      sessionID: "child_ses",
    }

    await notifyParentSession(
      client as never,
      "ses_parent_003",
      task
    )

    // Toast with info variant
    const toasts = client.getSentToasts()
    expect(toasts.length).toBe(1)
    expect(toasts[0].variant).toBe("info")
    expect(toasts[0].message).toContain("▶")
    expect(toasts[0].message).toContain("Silent progress update")

    // Async context injection
    const asyncPrompts = client.getSentAsyncPrompts()
    expect(asyncPrompts.length).toBe(1)
    const body = asyncPrompts[0].body as { noReply: boolean }
    expect(body.noReply).toBe(true)
  })

  it("shows error toast + async context for failed status", async () => {
    const client = createFakeClient()
    const task: TaskNotification = {
      delegationId: "delg_103",
      agent: "builder",
      title: "Urgent test",
      status: "failed",
      description: "Failed task notification",
      sessionID: "child_ses",
    }

    await notifyParentSession(
      client as never,
      "ses_parent_004",
      task
    )

    // Toast with error variant — NOT appendTuiPrompt (removed in Step 1)
    const toasts = client.getSentToasts()
    expect(toasts.length).toBe(1)
    expect(toasts[0].variant).toBe("error")
    expect(toasts[0].message).toContain("Failed task notification")

    // Async context injection
    const asyncPrompts = client.getSentAsyncPrompts()
    expect(asyncPrompts.length).toBe(1)
    const body = asyncPrompts[0].body as { noReply: boolean; parts: Array<{ text: string }> }
    expect(body.noReply).toBe(true)
    expect(body.parts[0].text).toContain("failed")
  })

  it("returns false when promptAsync fails (toast still best-effort)", async () => {
    const client = {
      session: {
        promptAsync: vi.fn(async () => {
          throw new Error("Connection lost")
        }),
      },
      tui: {
        showToast: vi.fn(async () => ({ data: true })),
      },
      app: { log: vi.fn() },
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

describe("reactivateSessionStream", () => {
  it("sends empty prompt via promptAsync with noReply:true", async () => {
    const client = createFakeClient()
    await reactivateSessionStream(client as never, "ses_parent_stream")

    const asyncPrompts = client.getSentAsyncPrompts()
    expect(asyncPrompts.length).toBe(1)
    const body = asyncPrompts[0].body as { parts: Array<{ type: string; text: string }>; noReply: boolean }
    expect(body.noReply).toBe(true)
    expect(body.parts[0].type).toBe("text")
    expect(body.parts[0].text).toBe("")
  })

  it("does not throw when promptAsync fails", async () => {
    const client = {
      session: {
        promptAsync: vi.fn(async () => {
          throw new Error("Connection lost")
        }),
      },
    }
    await expect(reactivateSessionStream(client as never, "ses_parent_stream_fail")).resolves.toBeUndefined()
  })
})

describe("notifyDelegationTerminal", () => {
  it("shows toast + sends notification via sendPromptAsync", async () => {
    const client = createFakeClient()
    const delegation: Delegation = {
      id: "delg_term_001",
      agent: "researcher",
      childSessionId: "ses_child_term",
      parentSessionId: "ses_parent_term",
      status: "completed",
      createdAt: Date.now() - 60000,
      completedAt: Date.now(),
      queueKey: null,
      recoveryGuarantee: "none",
      explicitCancellation: false,
    }

    await notifyDelegationTerminal(client as never, delegation)

    // 1. Toast shown to user
    const toasts = client.getSentToasts()
    expect(toasts.length).toBe(1)
    expect(toasts[0].variant).toBe("success")
    expect(toasts[0].message).toContain("completed")

    // 2. Stream reactivation via empty sendPromptAsync
    const asyncPrompts = client.getSentAsyncPrompts()
    expect(asyncPrompts.length).toBe(2)
    // First prompt = stream reactivation (empty text)
    const reactivateBody = asyncPrompts[0].body as { parts: Array<{ text: string }>; noReply: boolean }
    expect(reactivateBody.parts[0].text).toBe("")

    // 3. Context injection via sendPromptAsync (fire-and-forget)
    const notifBody = asyncPrompts[1].body as { parts: Array<{ text: string }>; noReply: boolean }
    expect(asyncPrompts[1].sessionID).toBe("ses_parent_term")
    expect(notifBody.noReply).toBe(true)
    expect(notifBody.parts[0].text).toContain("completed")
    expect(notifBody.parts[0].text).toContain("researcher")
  })
})
