/**
 * Unit tests for the session naming service.
 *
 * Covers format correctness, roundtrip stability, edge case handling,
 * and null returns for invalid inputs.
 *
 * @module tests/shared/session-naming
 */

import { describe, it, expect } from "vitest"
import { generateSessionTitle, parseSessionTitle } from "../../src/shared/session-naming.js"

describe("generateSessionTitle", () => {
  /**
   * Test: produces correct format for governance root session.
   */
  it("produces correct format for governance root", () => {
    const result = generateSessionTitle({
      framework: "hm",
      workflow: "governance",
      classification: "root",
      agent: "gsd-auditor",
      purpose: "audit-phase23",
      depth: 0,
    })
    expect(result).toBe("hm/governance/root/gsd-auditor/audit-phase23@0")
  })

  /**
   * Test: produces correct format for delegated child session.
   */
  it("produces correct format for delegated child", () => {
    const result = generateSessionTitle({
      framework: "hm",
      workflow: "delegate",
      classification: "child",
      agent: "gsd-researcher",
      purpose: "research-mcp-patterns",
      depth: 1,
    })
    expect(result).toBe("hm/delegate/child/gsd-researcher/research-mcp-patterns@1")
  })

  /**
   * Test: produces correct format for planning root session.
   */
  it("produces correct format for planning root", () => {
    const result = generateSessionTitle({
      framework: "hm",
      workflow: "planning",
      classification: "root",
      agent: "gsd-planner",
      purpose: "plan-gap-closure",
      depth: 0,
    })
    expect(result).toBe("hm/planning/root/gsd-planner/plan-gap-closure@0")
  })

  /**
   * Test: sanitizes purpose (spaces→hyphens, lowercase).
   */
  it("sanitizes purpose: spaces to hyphens, lowercase", () => {
    const result = generateSessionTitle({
      framework: "hm",
      workflow: "delegate",
      classification: "child",
      agent: "gsd-researcher",
      purpose: "Audit Phase 23",
      depth: 1,
    })
    expect(result).toBe("hm/delegate/child/gsd-researcher/audit-phase-23@1")
  })

  /**
   * Test: handles grandchild depth correctly.
   */
  it("handles grandchild depth", () => {
    const result = generateSessionTitle({
      framework: "hm",
      workflow: "delegate",
      classification: "grandchild",
      agent: "gsd-researcher",
      purpose: "deep-research",
      depth: 2,
    })
    expect(result).toMatch(/@2$/)
  })
})

describe("parseSessionTitle", () => {
  /**
   * Test: correctly reverses governance root title.
   */
  it("correctly reverses governance root", () => {
    const result = parseSessionTitle("hm/governance/root/gsd-auditor/audit-phase23@0")
    expect(result).toEqual({
      framework: "hm",
      workflow: "governance",
      classification: "root",
      agent: "gsd-auditor",
      purpose: "audit-phase23",
      depth: 0,
    })
  })

  /**
   * Test: correctly reverses delegated child title.
   */
  it("correctly reverses delegated child", () => {
    const result = parseSessionTitle("hm/delegate/child/gsd-researcher/research-mcp-patterns@1")
    expect(result).toEqual({
      framework: "hm",
      workflow: "delegate",
      classification: "child",
      agent: "gsd-researcher",
      purpose: "research-mcp-patterns",
      depth: 1,
    })
  })

  /**
   * Test: roundtrip — generate → parse produces original input.
   */
  it("roundtrips generate → parse produces original input", () => {
    const input = {
      framework: "hm",
      workflow: "governance",
      classification: "root",
      agent: "gsd-auditor",
      purpose: "audit-phase23",
      depth: 0,
    }
    const title = generateSessionTitle(input)
    const parsed = parseSessionTitle(title)
    expect(parsed).toEqual(input)
  })

  /**
   * Test: returns null for invalid format (too few segments).
   */
  it("returns null for too few segments", () => {
    expect(parseSessionTitle("hm/governance/root")).toBeNull()
  })

  /**
   * Test: returns null for missing @ separator.
   */
  it("returns null for missing @ separator", () => {
    expect(parseSessionTitle("hm/governance/root/gsd-auditor/noatseparator")).toBeNull()
  })

  /**
   * Test: returns null for non-numeric depth.
   */
  it("returns null for non-numeric depth", () => {
    expect(parseSessionTitle("hm/governance/root/gsd-auditor/test@bad")).toBeNull()
  })

  /**
   * Test: returns null for empty segments.
   */
  it("returns null for empty segments", () => {
    expect(parseSessionTitle("hm//root/gsd-auditor/test@0")).toBeNull()
  })

  /**
   * Test: returns null for empty input.
   */
  it("returns null for empty string", () => {
    expect(parseSessionTitle("")).toBeNull()
  })
})

describe("roundtrip stability", () => {
  /**
   * Test: multiple roundtrips produce consistent results.
   */
  it("multiple roundtrips are consistent", () => {
    const inputs = [
      { framework: "hm", workflow: "governance", classification: "root" as const, agent: "gsd-auditor", purpose: "audit-v2", depth: 0 },
      { framework: "hm", workflow: "delegate", classification: "child" as const, agent: "gsd-researcher", purpose: "research-auth", depth: 1 },
      { framework: "gsd", workflow: "execute", classification: "fork" as const, agent: "gsd-builder", purpose: "build-feature-x", depth: 2 },
      { framework: "hm", workflow: "planning", classification: "grandchild" as const, agent: "hm-l2-planner", purpose: "plan-gap-closure", depth: 2 },
      { framework: "hm", workflow: "spawn", classification: "child" as const, agent: "gsd-researcher", purpose: "spawn-task", depth: 1 },
    ]

    for (const input of inputs) {
      const title = generateSessionTitle(input)
      const parsed = parseSessionTitle(title)
      expect(parsed).toEqual(input)
    }
  })
})
