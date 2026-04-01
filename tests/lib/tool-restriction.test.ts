import { describe, it, expect } from "vitest"
import { isToolRestrictedForAgent } from "../../src/lib/helpers.js"

describe("tool restriction enforcement (PERM-007)", () => {
  describe("researcher agent", () => {
    const deniedTools = ["edit", "write", "bash", "task", "skill", "webfetch", "websearch"]
    const allowedTools = ["read", "glob", "grep"]

    for (const tool of deniedTools) {
      it(`should deny ${tool} for researcher`, () => {
        expect(isToolRestrictedForAgent(tool, "researcher")).toBe(true)
      })
    }

    for (const tool of allowedTools) {
      it(`should allow ${tool} for researcher`, () => {
        expect(isToolRestrictedForAgent(tool, "researcher")).toBe(false)
      })
    }
  })

  describe("critic agent", () => {
    const deniedTools = ["edit", "write", "task", "skill"]
    const allowedTools = ["read", "glob", "grep", "bash"]

    for (const tool of deniedTools) {
      it(`should deny ${tool} for critic`, () => {
        expect(isToolRestrictedForAgent(tool, "critic")).toBe(true)
      })
    }

    for (const tool of allowedTools) {
      it(`should allow ${tool} for critic`, () => {
        expect(isToolRestrictedForAgent(tool, "critic")).toBe(false)
      })
    }
  })

  describe("builder agent", () => {
    const allTools = ["edit", "write", "bash", "task", "read", "glob", "grep", "skill"]

    for (const tool of allTools) {
      it(`should allow ${tool} for builder`, () => {
        expect(isToolRestrictedForAgent(tool, "builder")).toBe(false)
      })
    }
  })

  it("should return false for unknown agent", () => {
    expect(isToolRestrictedForAgent("edit", "unknown_agent")).toBe(false)
  })
})
