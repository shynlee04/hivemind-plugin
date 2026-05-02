import { describe, it, expect } from "vitest"
import {
  resolveIntake,
  PURPOSE_TO_ROUTING_TARGET,
  type IntakeResult,
} from "../../../src/lib/session-entry/intake-gate.js"

describe("resolveIntake", () => {
  // ── SEI-03: Intake gate resolution ──────────────────────────────────

  describe("full intake pipeline", () => {
    it("returns a complete IntakeResult with all fields", () => {
      const result = resolveIntake("implement the caching layer")
      expect(result).toHaveProperty("purpose")
      expect(result).toHaveProperty("language")
      expect(result).toHaveProperty("profile")
      expect(result).toHaveProperty("routingTarget")
      expect(result.purpose.purpose).toBeDefined()
      expect(result.language.script).toBeDefined()
      expect(result.profile.communicationStyle).toBeDefined()
      expect(typeof result.routingTarget).toBe("string")
    })

    it("routes implementation requests to gsd-executor", () => {
      const result = resolveIntake("build the API endpoint")
      expect(result.purpose.purpose).toBe("implementation")
      expect(result.routingTarget).toBe("gsd-executor")
    })

    it("routes discovery requests to hm-l2-scout", () => {
      const result = resolveIntake("explore the codebase structure")
      expect(result.purpose.purpose).toBe("discovery")
      expect(result.routingTarget).toBe("hm-l2-scout")
    })

    it("routes brainstorming requests to hm-l2-brainstorm", () => {
      const result = resolveIntake("let's brainstorm ideas for the UI")
      expect(result.purpose.purpose).toBe("brainstorming")
      expect(result.routingTarget).toBe("hm-l2-brainstorm")
    })

    it("routes research requests to hm-l3-research-chain", () => {
      const result = resolveIntake("research the best database options")
      expect(result.purpose.purpose).toBe("research")
      expect(result.routingTarget).toBe("hm-l3-research-chain")
    })

    it("routes planning requests to gsd-planner", () => {
      const result = resolveIntake("plan the implementation for auth")
      expect(result.purpose.purpose).toBe("planning")
      expect(result.routingTarget).toBe("gsd-planner")
    })

    it("routes gatekeeping requests to hm-l2-critic", () => {
      const result = resolveIntake("verify the implementation passes gates")
      expect(result.purpose.purpose).toBe("gatekeeping")
      expect(result.routingTarget).toBe("hm-l2-critic")
    })

    it("routes tdd requests to hm-l2-test-driven-execution", () => {
      const result = resolveIntake("write tests using tdd approach")
      expect(result.purpose.purpose).toBe("tdd")
      expect(result.routingTarget).toBe("hm-l2-test-driven-execution")
    })

    it("routes course-correction requests to gsd-debugger", () => {
      const result = resolveIntake("there's a bug in the system")
      expect(result.purpose.purpose).toBe("course-correction")
      expect(result.routingTarget).toBe("gsd-debugger")
    })
  })

  describe("context-aware routing", () => {
    it("accepts optional context for profile resolution", () => {
      const result = resolveIntake("implement the feature", {
        messageLength: 50,
        technicalTerms: ["api"],
      })
      expect(result.profile).toBeDefined()
      expect(result.profile.communicationStyle).toBeDefined()
    })

    it("works without context", () => {
      const result = resolveIntake("implement the feature")
      expect(result.profile).toBeDefined()
    })
  })

  describe("language detection in intake", () => {
    it("detects Latin script in English input", () => {
      const result = resolveIntake("implement the feature")
      expect(result.language.script).toBe("latin")
    })

    it("detects CJK script in Chinese input", () => {
      const result = resolveIntake("实现这个功能")
      expect(result.language.script).toBe("cjk")
    })

    it("detects Arabic script in Arabic input", () => {
      const result = resolveIntake("تنفيذ هذه الميزة")
      expect(result.language.script).toBe("arabic")
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles empty input gracefully", () => {
      const result = resolveIntake("")
      expect(result.purpose).toBeDefined()
      expect(result.language).toBeDefined()
      expect(result.profile).toBeDefined()
      expect(result.routingTarget).toBeDefined()
    })

    it("handles whitespace-only input gracefully", () => {
      const result = resolveIntake("   ")
      expect(result.purpose).toBeDefined()
      expect(result.routingTarget).toBeDefined()
    })
  })
})

describe("PURPOSE_TO_ROUTING_TARGET", () => {
  it("maps all 8 purpose classes to routing targets", () => {
    const requiredMappings = [
      "discovery",
      "brainstorming",
      "research",
      "planning",
      "implementation",
      "gatekeeping",
      "tdd",
      "course-correction",
    ] as const

    for (const purpose of requiredMappings) {
      expect(PURPOSE_TO_ROUTING_TARGET).toHaveProperty(purpose)
      expect(typeof PURPOSE_TO_ROUTING_TARGET[purpose]).toBe("string")
      expect(PURPOSE_TO_ROUTING_TARGET[purpose].length).toBeGreaterThan(0)
    }
  })
})
