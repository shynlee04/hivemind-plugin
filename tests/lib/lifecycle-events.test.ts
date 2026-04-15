import { afterEach, describe, expect, it } from "vitest"

import { CompletionDetector } from "../../src/lib/completion-detector.js"
import { deleteSessionContinuity, getSessionContinuity, recordSessionContinuity } from "../../src/lib/continuity.js"
import { handleEvent, noteObservedActivity } from "../../src/lib/lifecycle-events.js"

describe("lifecycle event reconciliation", () => {
  const sessionID = "session-failed-should-stay-failed"
  const queuedSessionID = "session-queued-should-stay-queued"

  afterEach(() => {
    deleteSessionContinuity(sessionID)
    deleteSessionContinuity(queuedSessionID)
  })

  it("does not resurrect a failed async session back to running on later status events", () => {
    recordSessionContinuity({
      sessionID,
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher", tools: [] },
      metadata: {
        parentSessionID: "parent-session",
        rootSessionID: "parent-session",
        delegation: {
          rootID: "parent-session",
          depth: 1,
          budgetUsed: 1,
          agent: "researcher",
          queueKey: "agent:researcher",
        },
        title: "failed child",
        description: "failed child",
        constraints: [],
        runInBackground: true,
        status: "failed",
        lastError: "Background polling timed out",
        createdAt: 1,
        updatedAt: 1,
        lifecycle: {
          phase: "failed",
          runMode: "async",
          queueKey: "agent:researcher",
          launchedAt: 1,
        },
      },
    })

    handleEvent({
      event: { properties: { status: { type: "running" } } },
      eventType: "session.status",
      sessionID,
      completionDetector: new CompletionDetector(),
    })

    const record = getSessionContinuity(sessionID)
    expect(record?.metadata.status).toBe("failed")
    expect(record?.metadata.lifecycle?.phase).toBe("failed")
    expect(record?.metadata.lastError).toBe("Background polling timed out")
  })

  it("does not promote a queued child to running from transport status alone", () => {
    recordSessionContinuity({
      sessionID: queuedSessionID,
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher", tools: [] },
      metadata: {
        parentSessionID: "parent-session",
        rootSessionID: "parent-session",
        delegation: {
          rootID: "parent-session",
          depth: 1,
          budgetUsed: 1,
          agent: "researcher",
          queueKey: "agent:researcher",
        },
        title: "queued child",
        description: "queued child",
        constraints: [],
        runInBackground: true,
        status: "queued",
        createdAt: 1,
        updatedAt: 1,
        lifecycle: {
          phase: "queued",
          runMode: "async",
          queueKey: "agent:researcher",
          launchedAt: 1,
        },
      },
    })

    handleEvent({
      event: { properties: { status: { type: "running" } } },
      eventType: "session.updated",
      sessionID: queuedSessionID,
      completionDetector: new CompletionDetector(),
    })

    const record = getSessionContinuity(queuedSessionID)
    expect(record?.metadata.status).toBe("queued")
    expect(record?.metadata.lifecycle?.phase).toBe("queued")
    expect(record?.metadata.lastToolActivityAt).toBeUndefined()
  })

  it("records lastToolActivityAt when tool activity is observed", () => {
    recordSessionContinuity({
      sessionID,
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher", tools: [] },
      metadata: {
        parentSessionID: "parent-session",
        rootSessionID: "parent-session",
        delegation: {
          rootID: "parent-session",
          depth: 1,
          budgetUsed: 1,
          agent: "researcher",
          queueKey: "agent:researcher",
        },
        title: "active child",
        description: "active child",
        constraints: [],
        runInBackground: true,
        status: "queued",
        createdAt: 1,
        updatedAt: 1,
        lifecycle: {
          phase: "dispatching",
          runMode: "async",
          queueKey: "agent:researcher",
          launchedAt: 1,
        },
      },
    })

    noteObservedActivity(sessionID, "tool.execute.after")

    const record = getSessionContinuity(sessionID)
    expect(record?.metadata.lastToolActivityAt).toBeTypeOf("number")
    expect(record?.metadata.status).toBe("running")
    expect(record?.metadata.lifecycle?.phase).toBe("running")
  })

  /* -------------------------------------------------------------------------- */
  /* Task 3: Terminal truth preservation and noteObservedActivity authoritativeness */
  /* -------------------------------------------------------------------------- */

  it("noteObservedActivity preserves failed status and does not resurrect to running", () => {
    recordSessionContinuity({
      sessionID,
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher", tools: [] },
      metadata: {
        parentSessionID: "parent-session",
        rootSessionID: "parent-session",
        delegation: {
          rootID: "parent-session",
          depth: 1,
          budgetUsed: 1,
          agent: "researcher",
          queueKey: "agent:researcher",
        },
        title: "failed child",
        description: "failed child",
        constraints: [],
        runInBackground: true,
        status: "failed",
        lastError: "dead-start: no evidence of activity within 120000ms",
        createdAt: 1,
        updatedAt: 1,
        lifecycle: {
          phase: "failed",
          runMode: "async",
          queueKey: "agent:researcher",
          launchedAt: 1,
        },
      },
    })

    noteObservedActivity(sessionID, "tool.execute.after")

    const record = getSessionContinuity(sessionID)
    expect(record?.metadata.status).toBe("failed")
    expect(record?.metadata.lifecycle?.phase).toBe("failed")
    expect(record?.metadata.lastError).toBe("dead-start: no evidence of activity within 120000ms")
    expect(record?.metadata.lastToolActivityAt).toBeTypeOf("number")
  })

  it("noteObservedActivity preserves completed status and does not resurrect", () => {
    const completedSessionID = "session-completed-stays-completed"

    recordSessionContinuity({
      sessionID: completedSessionID,
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher", tools: [] },
      metadata: {
        parentSessionID: "parent-session",
        rootSessionID: "parent-session",
        delegation: {
          rootID: "parent-session",
          depth: 1,
          budgetUsed: 1,
          agent: "researcher",
          queueKey: "agent:researcher",
        },
        title: "completed child",
        description: "completed child",
        constraints: [],
        runInBackground: true,
        status: "completed",
        createdAt: 1,
        updatedAt: 1,
        lifecycle: {
          phase: "completed",
          runMode: "async",
          queueKey: "agent:researcher",
          launchedAt: 1,
          completedAt: 100,
        },
      },
    })

    noteObservedActivity(completedSessionID, "tool.execute.after")

    const record = getSessionContinuity(completedSessionID)
    expect(record?.metadata.status).toBe("completed")
    expect(record?.metadata.lifecycle?.phase).toBe("completed")

    deleteSessionContinuity(completedSessionID)
  })

  it("terminal failure is preserved across multiple handleEvent calls with conflicting statuses", () => {
    recordSessionContinuity({
      sessionID,
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher", tools: [] },
      metadata: {
        parentSessionID: "parent-session",
        rootSessionID: "parent-session",
        delegation: {
          rootID: "parent-session",
          depth: 1,
          budgetUsed: 1,
          agent: "researcher",
          queueKey: "agent:researcher",
        },
        title: "failed child",
        description: "failed child",
        constraints: [],
        runInBackground: true,
        status: "failed",
        lastError: "Background polling timed out",
        createdAt: 1,
        updatedAt: 1,
        lifecycle: {
          phase: "failed",
          runMode: "async",
          queueKey: "agent:researcher",
          launchedAt: 1,
        },
      },
    })

    handleEvent({
      event: { properties: { status: { type: "running" } } },
      eventType: "session.updated",
      sessionID,
      completionDetector: new CompletionDetector(),
    })

    handleEvent({
      event: { properties: { status: { type: "busy" } } },
      eventType: "session.updated",
      sessionID,
      completionDetector: new CompletionDetector(),
    })

    handleEvent({
      event: { properties: { status: { type: "idle" } } },
      eventType: "session.updated",
      sessionID,
      completionDetector: new CompletionDetector(),
    })

    const record = getSessionContinuity(sessionID)
    expect(record?.metadata.status).toBe("failed")
    expect(record?.metadata.lifecycle?.phase).toBe("failed")
    expect(record?.metadata.lastError).toBe("Background polling timed out")
  })

  it("handleEvent does not set lastToolActivityAt from transport status alone", () => {
    recordSessionContinuity({
      sessionID: queuedSessionID,
      toolProfile: { permissionRules: [], compatibleTools: [] },
      promptParams: { agent: "researcher", tools: [] },
      metadata: {
        parentSessionID: "parent-session",
        rootSessionID: "parent-session",
        delegation: {
          rootID: "parent-session",
          depth: 1,
          budgetUsed: 1,
          agent: "researcher",
          queueKey: "agent:researcher",
        },
        title: "queued child",
        description: "queued child",
        constraints: [],
        runInBackground: true,
        status: "queued",
        createdAt: 1,
        updatedAt: 1,
        lifecycle: {
          phase: "queued",
          runMode: "async",
          queueKey: "agent:researcher",
          launchedAt: 1,
        },
      },
    })

    handleEvent({
      event: { properties: { status: { type: "busy" } } },
      eventType: "session.updated",
      sessionID: queuedSessionID,
      completionDetector: new CompletionDetector(),
    })

    const record = getSessionContinuity(queuedSessionID)
    expect(record?.metadata.lastToolActivityAt).toBeUndefined()
  })
})
