import { describe, expect, it } from "vitest"

import { resolveCategoryGateDecision, checkSkillFilterAdvisory } from "../../src/coordination/delegation/category-gates.js"

describe("category gate", () => {
  it("allows implementation category with write-capable tools", () => {
    expect(resolveCategoryGateDecision({ category: "implementation", surface: "agent-delegation", toolProfileMode: "write-capable" }))
      .toMatchObject({ allowed: true, category: "implementation" })
  })

  it("denies review and research categories with write-capable tools", () => {
    expect(resolveCategoryGateDecision({ category: "review", surface: "agent-delegation", toolProfileMode: "write-capable" }))
      .toMatchObject({ allowed: false, reason: 'category "review" cannot use write-capable tools' })
    expect(resolveCategoryGateDecision({ category: "research", surface: "agent-delegation", toolProfileMode: "write-capable" }))
      .toMatchObject({ allowed: false, reason: 'category "research" cannot use write-capable tools' })
  })

  it("denies unknown categories with auditable reason", () => {
    expect(resolveCategoryGateDecision({ category: "unknown", surface: "agent-delegation", toolProfileMode: "read-only" }))
      .toMatchObject({ allowed: false, reason: "unknown delegation category", audit: { gate: "category", askReason: "unknown delegation category" } })
  })

  it("allows command category only for command-process dispatch", () => {
    expect(resolveCategoryGateDecision({ category: "command", surface: "command-process", toolProfileMode: "write-capable" }).allowed).toBe(true)
    expect(resolveCategoryGateDecision({ category: "command", surface: "agent-delegation", toolProfileMode: "read-only" }).allowed).toBe(false)
  })
})

describe("checkSkillFilterAdvisory", () => {
  it("returns advisory string when skillFilter is curated", () => {
    const result = checkSkillFilterAdvisory("curated", "hm-brainstorm")
    expect(result).toBeDefined()
    expect(result).toContain("[Harness] Advisory")
    expect(result).toContain("curated")
    expect(result).toContain("hm-brainstorm")
  })

  it("returns undefined when skillFilter is all", () => {
    const result = checkSkillFilterAdvisory("all", "hm-brainstorm")
    expect(result).toBeUndefined()
  })

  it("advisory string includes the skill name", () => {
    const result = checkSkillFilterAdvisory("curated", "gsd-debug")
    expect(result).toContain("gsd-debug")
  })
})
