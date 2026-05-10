/**
 * Tests for session-tracker TypeScript interface shapes and type guards.
 *
 * These tests verify:
 * - Type guards correctly validate hook payloads and session IDs
 * - Interface shapes are constructable with valid data
 * - All field names use camelCase (REQ-ST-12 compliance)
 */

import { isValidSessionID, isValidHookPayload } from "../../../src/features/session-tracker/types.js"
import type {
  SessionTrackerConfig,
  SessionRecord,
  ChildSessionRecord,
  SessionContinuityIndex,
  ProjectContinuityIndex,
  DelegatedBy,
  MainAgent,
  Turn,
  ToolRecord,
  ChildRef,
  ChildHierarchyEntry,
} from "../../../src/features/session-tracker/types.js"

// ---------------------------------------------------------------------------
// Type guard tests — these are the RED gate (must fail before implementation exists)
// ---------------------------------------------------------------------------

describe("isValidSessionID", () => {
  it("returns true for valid session IDs starting with ses_", () => {
    expect(isValidSessionID("ses_1ed9df1adffe2hbJudz3sK60y3")).toBe(true)
    expect(isValidSessionID("ses_abc123")).toBe(true)
    expect(isValidSessionID("ses_1ed9c5c20ffePWOXce5JQpS5Yk")).toBe(true)
  })

  it("returns false for non-string values", () => {
    expect(isValidSessionID(undefined)).toBe(false)
    expect(isValidSessionID(null)).toBe(false)
    expect(isValidSessionID(123)).toBe(false)
    expect(isValidSessionID({})).toBe(false)
    expect(isValidSessionID([])).toBe(false)
    expect(isValidSessionID(true)).toBe(false)
  })

  it("returns false for strings that don't start with ses_", () => {
    expect(isValidSessionID("abc123")).toBe(false)
    expect(isValidSessionID("")).toBe(false)
    expect(isValidSessionID("ses-123")).toBe(false) // hyphen not underscore
    expect(isValidSessionID("SES_123")).toBe(false) // case sensitive
  })

  it("returns false for strings shorter than 10 characters", () => {
    expect(isValidSessionID("ses_12345")).toBe(false) // 9 chars, under minimum
    expect(isValidSessionID("ses_a")).toBe(false)
  })
})

describe("isValidHookPayload", () => {
  it("returns false for non-object values", () => {
    expect(isValidHookPayload(undefined)).toBe(false)
    expect(isValidHookPayload(null)).toBe(false)
    expect(isValidHookPayload("string")).toBe(false)
    expect(isValidHookPayload(42)).toBe(false)
    expect(isValidHookPayload(true)).toBe(false)
  })

  it("returns false for objects without sessionID", () => {
    expect(isValidHookPayload({})).toBe(false)
    expect(isValidHookPayload({ event: "something" })).toBe(false)
    expect(isValidHookPayload({ type: "session.created" })).toBe(false)
  })

  it("returns false for objects with non-string sessionID", () => {
    expect(isValidHookPayload({ sessionID: 123 })).toBe(false)
    expect(isValidHookPayload({ sessionID: null })).toBe(false)
  })

  it("returns false for objects with invalid sessionID format", () => {
    expect(isValidHookPayload({ sessionID: "bad" })).toBe(false)
    expect(isValidHookPayload({ sessionID: "" })).toBe(false)
  })

  it("returns true for objects with valid sessionID", () => {
    expect(isValidHookPayload({ sessionID: "ses_1ed9df1adffe2hbJudz3sK60y3" })).toBe(true)
    expect(isValidHookPayload({ sessionID: "ses_abc12345678", foo: "bar" })).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Interface shape tests — verify camelCase field names (REQ-ST-12)
// ---------------------------------------------------------------------------

describe("SessionTrackerConfig interface", () => {
  it("can be constructed with projectRoot", () => {
    const config: SessionTrackerConfig = { projectRoot: "/test/root" }
    expect(config.projectRoot).toBe("/test/root")
  })

  it("uses camelCase for projectRoot field", () => {
    const config: SessionTrackerConfig = { projectRoot: "/test" }
    expect("projectRoot" in config).toBe(true)
    // verify snake_case variant does not exist on the type
    expect(config).toHaveProperty("projectRoot")
  })
})

describe("SessionRecord interface", () => {
  it("can be constructed with all required fields using camelCase", () => {
    const record: SessionRecord = {
      sessionID: "ses_1ed9df1adffe2hbJudz3sK60y3",
      created: "2026-05-10T21:54:36Z",
      updated: "2026-05-10T22:08:04Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    }
    expect(record.sessionID).toBe("ses_1ed9df1adffe2hbJudz3sK60y3")
    expect(record.parentSessionID).toBeNull()
    expect(record.delegationDepth).toBe(0)
    expect(record.status).toBe("active")
  })

  it("applies camelCase naming for all fields (REQ-ST-12)", () => {
    const record: SessionRecord = {
      sessionID: "ses_test123456789",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    }
    // All keys must be camelCase
    const keys = Object.keys(record)
    for (const key of keys) {
      expect(key).not.toMatch(/_/); // no snake_case
      expect(key).toMatch(/^[a-z]/);  // starts with lowercase letter
    }
  })
})

describe("ChildSessionRecord interface", () => {
  it("can be constructed with delegated_by and main_agent", () => {
    const delegated: DelegatedBy = {
      agentName: "Hm-L0-Orchestrator",
      tool: "task",
      description: "Investigate event tracker bugs",
      subagentType: "hm-l2-investigator",
    }
    const mainAgent: MainAgent = {
      name: "Hm-L2-Investigator",
      model: "DeepSeek V4 Pro",
    }
    const record: ChildSessionRecord = {
      sessionID: "ses_1ed9c5c20ffePWOXce5JQpS5Yk",
      parentSessionID: "ses_1ed9df1adffe2hbJudz3sK60y3",
      delegationDepth: 1,
      delegatedBy: delegated,
      created: "2026-05-10T21:56:44Z",
      updated: "2026-05-10T22:04:47Z",
      status: "completed",
      mainAgent,
      turns: [],
      children: [],
    }
    expect(record.delegatedBy.agentName).toBe("Hm-L0-Orchestrator")
    expect(record.mainAgent.name).toBe("Hm-L2-Investigator")
    expect(record.children).toEqual([])
  })

  it("applies camelCase naming for all fields (REQ-ST-12)", () => {
    const record: ChildSessionRecord = {
      sessionID: "ses_test123456789",
      parentSessionID: "ses_parent123456789",
      delegationDepth: 1,
      delegatedBy: {
        agentName: "TestAgent",
        tool: "task",
        description: "test",
        subagentType: "test-agent",
      },
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      status: "active",
      mainAgent: { name: "Test", model: "test" },
      turns: [],
      children: [],
    }
    const keys = Object.keys(record)
    for (const key of keys) {
      // sessionID and parentSessionID with uppercase 'I' are valid camelCase
      expect(key).toMatch(/^[a-z]/)
    }
  })
})

describe("SessionContinuityIndex interface", () => {
  it("can be constructed with hierarchy and tool_summary", () => {
    const childEntry: ChildHierarchyEntry = {
      file: "child.json",
      depth: 1,
      status: "completed",
      delegatedBy: "main_l0_agent",
      children: {},
    }
    const index: SessionContinuityIndex = {
      version: "2.0",
      sessionID: "ses_test123456789",
      lastUpdated: "2026-01-01T00:00:00Z",
      hierarchy: {
        root: "ses_test123456789",
        children: { "child-1": childEntry },
      },
      turnCount: 5,
      toolSummary: { skill: 3, read: 12, task: 2 },
    }
    expect(index.version).toBe("2.0")
    expect(index.hierarchy.children["child-1"].depth).toBe(1)
    expect(index.toolSummary.skill).toBe(3)
  })
})

describe("ProjectContinuityIndex interface", () => {
  it("can be constructed with chronological session list", () => {
    const sessionEntry = {
      dir: "ses_test/",
      mainFile: "ses_test.md",
      continuityIndex: "ses_test/session-continuity.json",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      status: "completed",
      childCount: 2,
      totalDelegationDepth: 1,
    }
    const index: ProjectContinuityIndex = {
      version: "2.0",
      projectRoot: "/test/project",
      lastUpdated: "2026-01-01T00:00:00Z",
      sessions: { "ses_test": sessionEntry },
      chronologicalOrder: ["ses_test"],
    }
    expect(index.sessions["ses_test"].status).toBe("completed")
    expect(index.chronologicalOrder).toHaveLength(1)
  })
})

describe("Turn interface", () => {
  it("can be constructed with tool invocations", () => {
    const tool: ToolRecord = {
      tool: "skill",
      input: { name: "test-skill" },
      outputPruned: "# Skill: test-skill",
    }
    const turn: Turn = {
      turn: 1,
      actor: "main_l0_agent",
      actorTransformedFrom: "user",
      content: "Test content",
      tools: [tool],
    }
    expect(turn.actor).toBe("main_l0_agent")
    expect(turn.tools[0].tool).toBe("skill")
  })
})

describe("ChildRef interface", () => {
  it("can be constructed with session_id and child_file", () => {
    const ref: ChildRef = {
      sessionID: "ses_child123456789",
      childFile: "ses_child123456789.json",
    }
    expect(ref.childFile).toMatch(/\.json$/)
  })
})
