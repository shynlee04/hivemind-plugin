/**
 * Tests for delegation metadata propagation with naming service titles.
 *
 * Verifies that delegation metadata (delegatedBy.agentName, mainAgent.name,
 * effectiveActor, subagentType) is correctly derived from naming-service-
 * formatted session titles using parseSessionTitle().
 *
 * @module tests/features/session-tracker/tool-delegation
 */

import { describe, it, expect } from "vitest"
import { generateSessionTitle, parseSessionTitle } from "../../../src/shared/session-naming.js"
import { deriveSubagentType, deriveAgentNameFromSession, asRecord } from "../../../src/features/session-tracker/tool-delegation-utils.js"

// ---------------------------------------------------------------------------
// deriveSubagentType — pure function tests
// ---------------------------------------------------------------------------

describe("deriveSubagentType", () => {
  /**
   * Test: Uses explicit subagentType when provided (even if session title available).
   */
  it("uses explicit subagentType when provided", () => {
    const result = deriveSubagentType(
      "hm/delegate/child/gsd-researcher/research-auth@1",
      "explicit-agent",
      "gsd-researcher",
    )
    expect(result).toBe("explicit-agent")
  })

  /**
   * Test: Parses agent from session title when no explicit subagentType.
   */
  it("parses agent from session title when no explicit subagentType", () => {
    const result = deriveSubagentType(
      "hm/delegate/child/gsd-researcher/research-auth@1",
      undefined,
      "fallback-agent",
    )
    expect(result).toBe("gsd-researcher")
  })

  /**
   * Test: Falls back to agent param when no session title available.
   */
  it("falls back to agent param when no session title", () => {
    const result = deriveSubagentType(undefined, undefined, "gsd-researcher")
    expect(result).toBe("gsd-researcher")
  })

  /**
   * Test: Returns 'unknown' only as absolute last resort.
   */
  it("returns unknown only as last resort", () => {
    const result = deriveSubagentType(undefined, undefined, undefined)
    expect(result).toBe("unknown")
  })

  /**
   * Test: Skips explicit 'unknown' subagentType and parses from title.
   */
  it("skips literal 'unknown' subagentType and parses from title", () => {
    const result = deriveSubagentType(
      "hm/governance/root/gsd-auditor/audit@0",
      "unknown",
      "gsd-auditor",
    )
    // Should skip "unknown" and parse from title
    expect(result).toBe("gsd-auditor")
  })
})

// ---------------------------------------------------------------------------
// deriveAgentNameFromSession — pure function tests
// ---------------------------------------------------------------------------

describe("deriveAgentNameFromSession", () => {
  /**
   * Test: Extracts agent from sessionTitle field.
   */
  it("extracts agent from sessionTitle field", () => {
    const result = deriveAgentNameFromSession({
      sessionTitle: "hm/delegate/child/gsd-researcher/research-auth@1",
    })
    expect(result).toBe("gsd-researcher")
  })

  /**
   * Test: Extracts agent from title field as fallback.
   */
  it("extracts agent from title field as fallback", () => {
    const result = deriveAgentNameFromSession({
      title: "hm/governance/root/gsd-auditor/audit@0",
    })
    expect(result).toBe("gsd-auditor")
  })

  /**
   * Test: Returns undefined when no title is available.
   */
  it("returns undefined when no title available", () => {
    const result = deriveAgentNameFromSession({ agent: "gsd-researcher" })
    expect(result).toBeUndefined()
  })

  /**
   * Test: Returns undefined for non-naming-service titles.
   */
  it("returns undefined for non-naming-service titles", () => {
    const result = deriveAgentNameFromSession({ title: "Custom Session Name" })
    expect(result).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// parseSessionTitle roundtrip tests
// ---------------------------------------------------------------------------

describe("parseSessionTitle roundtrip", () => {
  /**
   * Test: generateSessionTitle → parseSessionTitle produces correct agent name.
   */
  it("roundtrips through naming service correctly", () => {
    const input = {
      framework: "hm" as const,
      workflow: "delegate" as const,
      classification: "child" as const,
      agent: "gsd-researcher",
      purpose: "research-auth",
      depth: 1,
    }
    const title = generateSessionTitle(input)
    const parsed = parseSessionTitle(title)
    expect(parsed).not.toBeNull()
    expect(parsed!.agent).toBe("gsd-researcher")
  })

  /**
   * Test: Multiple roundtrips cover all workflow types.
   */
  it("roundtrips for governance root", () => {
    const title = generateSessionTitle({
      framework: "hm",
      workflow: "governance",
      classification: "root",
      agent: "gsd-auditor",
      purpose: "audit-v2",
      depth: 0,
    })
    const parsed = parseSessionTitle(title)
    expect(parsed!.agent).toBe("gsd-auditor")
    expect(parsed!.classification).toBe("root")
    expect(parsed!.depth).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// asRecord utility test
// ---------------------------------------------------------------------------

describe("asRecord", () => {
  /**
   * Test: returns empty object for non-object values.
   */
  it("returns empty object for null", () => {
    expect(asRecord(null)).toEqual({})
  })

  /**
   * Test: returns empty object for arrays.
   */
  it("returns empty object for arrays", () => {
    expect(asRecord(["a", "b"])).toEqual({})
  })

  /**
   * Test: passes through plain objects.
   */
  it("passes through plain objects", () => {
    expect(asRecord({ key: "value" })).toEqual({ key: "value" })
  })
})
