import { describe, it, expect } from "vitest"
import { findStackableSessions, findResumableSessions } from "../../src/coordination/delegation/session-intelligence.js"

describe("integration — session stacking intelligence", () => {
  it("findStackableSessions returns empty array when no delegations exist", () => {
    const result = findStackableSessions([])
    expect(result).toEqual([])
  })

  it("findStackableSessions filters completed delegations as stackable", () => {
    const delegations = [
      {
        id: "del_001",
        parentSessionId: "ses_parent",
        childSessionId: "ses_child_001",
        agent: "test-agent",
        status: "completed" as const,
        lastMessageCount: 5,
        stablePollCount: 3,
        nestingDepth: 1,
        createdAt: Date.now() - 60000,
        completedAt: Date.now() - 30000,
        executionMode: "sdk" as const,
        result: "done",
      },
    ]
    const result = findStackableSessions(delegations)
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it("findResumableSessions returns sessions with dispatched/running status", () => {
    const delegations = [
      {
        id: "del_resume",
        parentSessionId: "ses_parent",
        childSessionId: "ses_child_002",
        agent: "resume-agent",
        status: "running" as const,
        lastMessageCount: 3,
        stablePollCount: 1,
        nestingDepth: 1,
        createdAt: Date.now() - 30000,
        executionMode: "sdk" as const,
      },
    ]
    const result = findResumableSessions(delegations)
    expect(result.length).toBe(1)
    expect(result[0].agent).toBe("resume-agent")
  })

  it("findStackableSessions excludes running/dispatched sessions", () => {
    const delegations = [
      {
        id: "del_running",
        parentSessionId: "ses_parent",
        childSessionId: "ses_child_003",
        agent: "running-agent",
        status: "running" as const,
        lastMessageCount: 3,
        stablePollCount: 1,
        nestingDepth: 1,
        createdAt: Date.now() - 10000,
        executionMode: "sdk" as const,
      },
    ]
    const result = findStackableSessions(delegations)
    expect(result.length).toBe(0)
  })

  it("findResumableSessions returns empty for terminal-only delegations", () => {
    const delegations = [
      {
        id: "del_complete",
        parentSessionId: "ses_parent",
        childSessionId: "ses_child_004",
        agent: "complete-agent",
        status: "completed" as const,
        lastMessageCount: 10,
        stablePollCount: 5,
        nestingDepth: 1,
        createdAt: Date.now() - 120000,
        completedAt: Date.now() - 60000,
        executionMode: "sdk" as const,
        result: "done",
      },
    ]
    const result = findResumableSessions(delegations)
    expect(result.length).toBe(0)
  })
})
