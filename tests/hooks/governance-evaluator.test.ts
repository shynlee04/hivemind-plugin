import { describe, it, expect, beforeEach } from "vitest"
import { evaluateGovernance } from "../../src/features/governance-engine/evaluator.js"
import type { GovernanceRule } from "../../src/shared/types.js"
import { getGovernancePersistenceState, recordGovernancePersistenceState } from "../../src/task-management/continuity/index.js"

describe("evaluateGovernance", () => {
  beforeEach(() => {
    // Reset violations in persistence state before each test
    const state = getGovernancePersistenceState()
    state.violations = []
    recordGovernancePersistenceState(state)
  })

  it("returns no blocks/warnings/escalations when rules are empty", () => {
    const result = evaluateGovernance("read", "ses_test", [])
    expect(result.blocked).toBe(false)
    expect(result.blocks).toHaveLength(0)
    expect(result.warnings).toHaveLength(0)
    expect(result.escalations).toHaveLength(0)
  })

  it("ignores disabled rules", () => {
    const rules: GovernanceRule[] = [
      {
        id: "rule-1",
        condition: { toolNames: ["read"] },
        action: { type: "block" },
        enabled: false,
      },
    ]

    const result = evaluateGovernance("read", "ses_test", rules)
    expect(result.blocked).toBe(false)
    expect(result.blocks).toHaveLength(0)

    const state = getGovernancePersistenceState()
    expect(state.violations).toHaveLength(0)
  })

  it("blocks and records violation when block rule matches tool name", () => {
    const rules: GovernanceRule[] = [
      {
        id: "rule-block-read",
        condition: { toolNames: ["read"] },
        action: { type: "block" },
        enabled: true,
      },
    ]

    const result = evaluateGovernance("read", "ses_test", rules)
    expect(result.blocked).toBe(true)
    expect(result.blocks).toContain("Rule rule-block-read triggered on tool read for session ses_test")

    const state = getGovernancePersistenceState()
    expect(state.violations).toHaveLength(1)
    expect(state.violations[0].ruleId).toBe("rule-block-read")
    expect(state.violations[0].sessionID).toBe("ses_test")
  })

  it("warns and records violation when warn rule matches tool name", () => {
    const rules: GovernanceRule[] = [
      {
        id: "rule-warn-write",
        condition: { toolNames: ["write"] },
        action: { type: "warn" },
        enabled: true,
      },
    ]

    const result = evaluateGovernance("write", "ses_test", rules)
    expect(result.blocked).toBe(false)
    expect(result.warnings).toContain("Rule rule-warn-write triggered on tool write for session ses_test")

    const state = getGovernancePersistenceState()
    expect(state.violations).toHaveLength(1)
    expect(state.violations[0].ruleId).toBe("rule-warn-write")
  })

  it("escalates when escalate rule matches session ID", () => {
    const rules: GovernanceRule[] = [
      {
        id: "rule-escalate-session",
        condition: { sessionIDs: ["ses_special"] },
        action: { type: "escalate", escalation: { channel: "slack", priority: "high" } },
        enabled: true,
      },
    ]

    const result = evaluateGovernance("write", "ses_special", rules)
    expect(result.blocked).toBe(false)
    expect(result.escalations).toHaveLength(1)
    expect(result.escalations[0]).toEqual({
      ruleId: "rule-escalate-session",
      escalation: { channel: "slack", priority: "high" },
    })

    const state = getGovernancePersistenceState()
    expect(state.violations).toHaveLength(1)
    expect(state.violations[0].escalation).toEqual({ channel: "slack", priority: "high" })
  })

  it("matches only when both tool name and session ID match if both are specified", () => {
    const rules: GovernanceRule[] = [
      {
        id: "rule-both",
        condition: { toolNames: ["write"], sessionIDs: ["ses_admin"] },
        action: { type: "block" },
        enabled: true,
      },
    ]

    // Only tool matches -> no trigger
    let result = evaluateGovernance("write", "ses_user", rules)
    expect(result.blocked).toBe(false)

    // Only session matches -> no trigger
    result = evaluateGovernance("read", "ses_admin", rules)
    expect(result.blocked).toBe(false)

    // Both match -> triggers block
    result = evaluateGovernance("write", "ses_admin", rules)
    expect(result.blocked).toBe(true)

    const state = getGovernancePersistenceState()
    expect(state.violations).toHaveLength(1)
  })
})
