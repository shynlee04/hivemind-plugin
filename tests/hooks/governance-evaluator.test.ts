import { afterAll, beforeAll, describe, it, expect, beforeEach, vi } from "vitest"
import { evaluateGovernance } from "../../src/features/governance-engine/evaluator.js"
import type { GovernanceRule } from "../../src/shared/types.js"
import { readGovernanceState, writeGovernanceState } from "../../src/features/governance/persistence.js"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

// Mock getDelegationMeta for depth-based tests
vi.mock("../../src/shared/state.js", () => ({
  getDelegationMeta: vi.fn(),
}))

import { getDelegationMeta } from "../../src/shared/state.js"
const mockGetDelegationMeta = vi.mocked(getDelegationMeta)

describe("evaluateGovernance", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeAll(() => {
    stateDir = mkdtempSync(join(tmpdir(), "hivemind-gov-test-"))
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterAll(() => {
    if (previousStateDir) {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    } else {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    }
    rmSync(stateDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    // Reset violations in governance persistence before each test
    const state = readGovernanceState()
    state.violations = []
    writeGovernanceState(state)
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

    const state = readGovernanceState()
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

    const state = readGovernanceState()
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

    const state = readGovernanceState()
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

    const state = readGovernanceState()
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

    const state = readGovernanceState()
    expect(state.violations).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Depth-based governance rules (SR-05-02)
// ---------------------------------------------------------------------------

describe("evaluateGovernance — depth-based matching", () => {
  let stateDir: string
  let previousStateDir: string | undefined

  beforeAll(() => {
    stateDir = mkdtempSync(join(tmpdir(), "hivemind-gov-depth-test-"))
    previousStateDir = process.env.OPENCODE_HARNESS_STATE_DIR
    process.env.OPENCODE_HARNESS_STATE_DIR = stateDir
  })

  afterAll(() => {
    if (previousStateDir) {
      process.env.OPENCODE_HARNESS_STATE_DIR = previousStateDir
    } else {
      delete process.env.OPENCODE_HARNESS_STATE_DIR
    }
    rmSync(stateDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    const state = readGovernanceState()
    state.violations = []
    writeGovernanceState(state)
    mockGetDelegationMeta.mockReset()
  })

  const depthRules: GovernanceRule[] = [
    {
      id: "gov-delegate-task-subagent-only",
      condition: { toolNames: ["delegate-task"], depth: { max: 0 } },
      action: { type: "block" },
      enabled: true,
    },
    {
      id: "gov-write-depth-warn",
      condition: { toolNames: ["write", "edit"], depth: { min: 2 } },
      action: { type: "warn" },
      enabled: true,
    },
    {
      id: "gov-delegate-task-depth-block",
      condition: { toolNames: ["delegate-task"], depth: { min: 3 } },
      action: { type: "block" },
      enabled: true,
    },
    {
      id: "gov-create-session-naming-warn",
      condition: { toolNames: ["create-governance-session"] },
      action: { type: "warn" },
      enabled: true,
    },
    {
      id: "gov-unsafe-tools-escalate",
      condition: { toolNames: ["bash"], depth: { min: 1 } },
      action: { type: "escalate", escalation: { reason: "bash in child session" } },
      enabled: true,
    },
  ]

  it("blocks delegate-task at depth=0 (Rule 1: max 0)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 0 } as any)
    const result = evaluateGovernance("delegate-task", "ses_child_1", depthRules)
    expect(result.blocked).toBe(true)
    expect(result.blocks.some(b => b.includes("gov-delegate-task-subagent-only"))).toBe(true)
  })

  it("does NOT block delegate-task at depth=1 (above max)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 1 } as any)
    const result = evaluateGovernance("delegate-task", "ses_child_1", depthRules)
    // Should not be blocked by Rule 1 (depth > max), but Rule 3 blocks at depth >= 3
    expect(result.blocked).toBe(false)
  })

  it("warns on write at depth=2 (Rule 2: min 2)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 2 } as any)
    const result = evaluateGovernance("write", "ses_grandchild_1", depthRules)
    expect(result.blocked).toBe(false)
    expect(result.warnings.some(w => w.includes("gov-write-depth-warn"))).toBe(true)
  })

  it("does NOT warn on write at depth=1 (below min)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 1 } as any)
    const result = evaluateGovernance("write", "ses_child_1", depthRules)
    expect(result.warnings).toHaveLength(0)
  })

  it("blocks delegate-task at depth=3 (Rule 3: min 3)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 3 } as any)
    const result = evaluateGovernance("delegate-task", "ses_deep_1", depthRules)
    expect(result.blocked).toBe(true)
    expect(result.blocks.some(b => b.includes("gov-delegate-task-depth-block"))).toBe(true)
  })

  it("warns on create-governance-session at any depth (Rule 4: no depth condition)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 0 } as any)
    const result = evaluateGovernance("create-governance-session", "ses_any", depthRules)
    expect(result.blocked).toBe(false)
    expect(result.warnings.some(w => w.includes("gov-create-session-naming-warn"))).toBe(true)
  })

  it("escalates bash at depth=1 (Rule 5: min 1)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 1 } as any)
    const result = evaluateGovernance("bash", "ses_child_1", depthRules)
    expect(result.escalations.some(e => e.ruleId === "gov-unsafe-tools-escalate")).toBe(true)
  })

  it("does NOT escalate bash at depth=0 (below min)", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 0 } as any)
    const result = evaluateGovernance("bash", "ses_root", depthRules)
    expect(result.escalations).toHaveLength(0)
  })

  it("returns no blocks/warnings for unmatched tool", () => {
    mockGetDelegationMeta.mockReturnValue({ depth: 0 } as any)
    const result = evaluateGovernance("read", "ses_any", depthRules)
    expect(result.blocked).toBe(false)
    expect(result.warnings).toHaveLength(0)
    expect(result.escalations).toHaveLength(0)
  })

  it("returns no blocks when rules array is empty", () => {
    const result = evaluateGovernance("any-tool", "ses_any", [])
    expect(result.blocked).toBe(false)
  })

  it("defaults depth to 0 when getDelegationMeta returns undefined", () => {
    mockGetDelegationMeta.mockReturnValue(undefined)
    const result = evaluateGovernance("delegate-task", "ses_unknown", depthRules)
    // depth=0 matches Rule 1 (max: 0) → blocked
    expect(result.blocked).toBe(true)
  })
})
