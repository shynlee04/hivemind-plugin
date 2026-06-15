/**
 * Tests for session-intelligence module — proactive session stacking recommendations.
 * @module tests/lib/session-intelligence.test
 */
import { describe, it, expect } from "vitest"
import {
  findStackableSessions,
  findResumableSessions,
  getRetryRecommendation,
  buildStackOnContext,
  buildStackingGuidanceBanner,
} from "../../src/coordination/delegation/session-intelligence.js"
import type { Delegation } from "../../src/coordination/delegation/types.js"

function makeDelegation(overrides: Partial<Delegation> = {}): Delegation {
  return {
    id: "dt-1234",
    parentSessionId: "ses-parent",
    childSessionId: "ses-child-001",
    agent: "gsd-executor",
    prompt: "Execute the task",
    status: "completed",
    createdAt: Date.now() - 60_000,
    completedAt: Date.now() - 10_000,
    lastMessageCount: 5,
    stablePollCount: 3,
    nestingDepth: 1,
    executionMode: "sdk",
    workingDirectory: "/tmp",
    queueKey: "agent:gsd-executor",
    ...overrides,
  }
}

describe("findStackableSessions", () => {
  it("returns terminal sessions sorted by recency", () => {
    const delegations = [
      makeDelegation({ id: "dt-old", childSessionId: "ses-old", status: "error", completedAt: Date.now() - 60_000 }),
      makeDelegation({ id: "dt-new", childSessionId: "ses-new", status: "completed", completedAt: Date.now() - 5_000 }),
      makeDelegation({ id: "dt-timeout", childSessionId: "ses-timeout", status: "timeout", completedAt: Date.now() - 30_000 }),
    ]

    const result = findStackableSessions(delegations)

    expect(result).toHaveLength(3)
    expect(result[0].childSessionId).toBe("ses-new")
    expect(result[1].childSessionId).toBe("ses-timeout")
    expect(result[2].childSessionId).toBe("ses-old")
  })

  it("excludes non-terminal sessions", () => {
    const delegations = [
      makeDelegation({ status: "running" }),
      makeDelegation({ status: "dispatched" }),
      makeDelegation({ id: "dt-done", childSessionId: "ses-done", status: "completed" }),
    ]

    const result = findStackableSessions(delegations)

    expect(result).toHaveLength(1)
    expect(result[0].childSessionId).toBe("ses-done")
  })

  it("filters by agent name", () => {
    const delegations = [
      makeDelegation({ agent: "gsd-executor", childSessionId: "ses-1", status: "completed" }),
      makeDelegation({ agent: "gsd-planner", childSessionId: "ses-2", status: "error" }),
    ]

    const result = findStackableSessions(delegations, "gsd-executor")

    expect(result).toHaveLength(1)
    expect(result[0].agent).toBe("gsd-executor")
  })

  it("filters by parent session", () => {
    const delegations = [
      makeDelegation({ parentSessionId: "ses-parent-1", childSessionId: "ses-1", status: "completed" }),
      makeDelegation({ parentSessionId: "ses-parent-2", childSessionId: "ses-2", status: "error" }),
    ]

    const result = findStackableSessions(delegations, undefined, "ses-parent-1")

    expect(result).toHaveLength(1)
    expect(result[0].childSessionId).toBe("ses-1")
  })

  it("excludes sessions without childSessionId", () => {
    const delegations = [
      makeDelegation({ childSessionId: "", status: "completed" }),
    ]

    const result = findStackableSessions(delegations)

    expect(result).toHaveLength(0)
  })

  it("includes taskCommand and delegateTaskCommand in output", () => {
    const delegations = [makeDelegation({ status: "error" })]

    const result = findStackableSessions(delegations)

    expect(result[0].taskCommand).toContain("task_id")
    expect(result[0].taskCommand).toContain("ses-child-001")
    expect(result[0].delegateTaskCommand).toContain("stackOnSessionId")
    expect(result[0].delegateTaskCommand).toContain("ses-child-001")
  })
})

describe("findResumableSessions", () => {
  it("returns active sessions only", () => {
    const delegations = [
      makeDelegation({ status: "running", childSessionId: "ses-running" }),
      makeDelegation({ status: "dispatched", childSessionId: "ses-dispatched" }),
      makeDelegation({ status: "completed", childSessionId: "ses-completed" }),
      makeDelegation({ status: "error", childSessionId: "ses-error" }),
    ]

    const result = findResumableSessions(delegations)

    expect(result).toHaveLength(2)
    expect(result.map(r => r.status)).toEqual(expect.arrayContaining(["running", "dispatched"]))
  })

  it("filters by parent session", () => {
    const delegations = [
      makeDelegation({ parentSessionId: "ses-p1", status: "running", childSessionId: "ses-1" }),
      makeDelegation({ parentSessionId: "ses-p2", status: "running", childSessionId: "ses-2" }),
    ]

    const result = findResumableSessions(delegations, "ses-p1")

    expect(result).toHaveLength(1)
    expect(result[0].childSessionId).toBe("ses-1")
  })
})

describe("getRetryRecommendation", () => {
  it("returns recommendation for failed delegation", () => {
    const delegation = makeDelegation({ status: "error", error: "SDK dispatch failed" })

    const result = getRetryRecommendation(delegation)

    expect(result).not.toBeNull()
    expect(result!.childSessionId).toBe("ses-child-001")
    expect(result!.agent).toBe("gsd-executor")
    expect(result!.originalError).toBe("SDK dispatch failed")
    expect(result!.guidance).toContain("STACK-ON RECOMMENDED")
    expect(result!.taskCommand).toContain("task_id")
    expect(result!.delegateTaskCommand).toContain("stackOnSessionId")
  })

  it("returns recommendation for completed delegation", () => {
    const delegation = makeDelegation({ status: "completed" })

    const result = getRetryRecommendation(delegation)

    expect(result).not.toBeNull()
    expect(result!.guidance).toContain("completed")
  })

  it("returns recommendation for timed out delegation", () => {
    const delegation = makeDelegation({ status: "timeout" })

    const result = getRetryRecommendation(delegation)

    expect(result).not.toBeNull()
    expect(result!.guidance).toContain("timeout")
  })

  it("returns null for active delegation", () => {
    const delegation = makeDelegation({ status: "running" })

    const result = getRetryRecommendation(delegation)

    expect(result).toBeNull()
  })

  it("returns null for dispatched delegation", () => {
    const delegation = makeDelegation({ status: "dispatched" })

    const result = getRetryRecommendation(delegation)

    expect(result).toBeNull()
  })

  it("returns null for delegation without childSessionId", () => {
    const delegation = makeDelegation({ status: "error", childSessionId: "" })

    const result = getRetryRecommendation(delegation)

    expect(result).toBeNull()
  })

  it("uses custom retry prompt when provided", () => {
    const delegation = makeDelegation({ status: "error" })

    const result = getRetryRecommendation(delegation, "Fix the broken test")

    expect(result).not.toBeNull()
    expect(result!.retryPrompt).toBe("Fix the broken test")
  })
})

describe("buildStackOnContext", () => {
  it("returns valid JSON with parentSessionId", () => {
    const result = buildStackOnContext("ses-abc-123")

    expect(JSON.parse(result)).toEqual({ parentSessionId: "ses-abc-123" })
  })
})

describe("buildStackingGuidanceBanner", () => {
  it("shows both stackable and resumable counts", () => {
    const result = buildStackingGuidanceBanner(3, 1)

    expect(result).toContain("3 terminal session(s)")
    expect(result).toContain("1 active session(s)")
    expect(result).toContain("STACKING")
    expect(result).toContain("RESUMED")
  })

  it("shows only stackable when no resumable", () => {
    const result = buildStackingGuidanceBanner(2, 0)

    expect(result).toContain("2 terminal session(s)")
    expect(result).not.toContain("active session")
  })

  it("shows appropriate message when nothing found", () => {
    const result = buildStackingGuidanceBanner(0, 0)

    expect(result).toContain("No stackable or resumable sessions found")
    expect(result).toContain("new dispatch is appropriate")
  })
})
