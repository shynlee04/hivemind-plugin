import { describe, it, expect } from "vitest"
import {
  resolveIntake,
  PURPOSE_TO_ROUTING_TARGET,
  createRegistryValidator,
  type IntakeResult,
  type RegistryValidator,
} from "../../../src/routing/session-entry/intake-gate.js"

describe("resolveIntake", () => {
  // ── SEI-03: Intake gate resolution ──────────────────────────────────

  describe("full intake pipeline", () => {
    it("returns a complete IntakeResult with all fields", () => {
      const result = resolveIntake("implement the caching layer")
      expect(result).toHaveProperty("purpose")
      expect(result).toHaveProperty("language")
      expect(result).toHaveProperty("profile")
      expect(result).toHaveProperty("routingTarget")
      expect(result).toHaveProperty("warnings")
      expect(result.purpose.purpose).toBeDefined()
      expect(result.language.script).toBeDefined()
      expect(result.profile.communicationStyle).toBeDefined()
      expect(typeof result.routingTarget).toBe("string")
      expect(Array.isArray(result.warnings)).toBe(true)
    })

    it("routes implementation requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("build the API endpoint")
      expect(result.purpose.purpose).toBe("implementation")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
    })

    it("routes discovery requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("explore the codebase structure")
      expect(result.purpose.purpose).toBe("discovery")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
    })

    it("routes brainstorming requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("let's brainstorm ideas for the UI")
      expect(result.purpose.purpose).toBe("brainstorming")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
    })

    it("routes research requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("research the best database options")
      expect(result.purpose.purpose).toBe("research")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
    })

    it("routes planning requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("plan the implementation for auth")
      expect(result.purpose.purpose).toBe("planning")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
    })

    it("routes gatekeeping requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("verify the implementation passes gates")
      expect(result.purpose.purpose).toBe("gatekeeping")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
    })

    it("routes tdd requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("write tests using tdd approach")
      expect(result.purpose.purpose).toBe("tdd")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
    })

    it("routes course-correction requests to hm-l0-orchestrator", () => {
      const result = resolveIntake("there's a bug in the system")
      expect(result.purpose.purpose).toBe("course-correction")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
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
      expect(result.warnings).toEqual([])
    })

    it("handles whitespace-only input gracefully", () => {
      const result = resolveIntake("   ")
      expect(result.purpose).toBeDefined()
      expect(result.routingTarget).toBeDefined()
    })
  })

  // ── Registry validation ─────────────────────────────────────────────

  describe("registry validation", () => {
    it("returns empty warnings when no validator is provided", () => {
      const result = resolveIntake("implement the feature")
      expect(result.warnings).toEqual([])
    })

    it("returns empty warnings when target exists in registry", () => {
      const primitives = new Map([
        ["agent:hm-l0-orchestrator", { name: "hm-l0-orchestrator", type: "agent" }],
      ])
      const validator = createRegistryValidator(primitives)

      const result = resolveIntake("implement the feature", undefined, validator)
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
      expect(result.warnings).toEqual([])
    })

    it("adds warning when target is not found in registry", () => {
      const primitives = new Map<string, unknown>() // empty registry
      const validator = createRegistryValidator(primitives)

      const result = resolveIntake("implement the feature", undefined, validator)
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
      // Still routes, but with a warning
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain("hm-l0-orchestrator")
      expect(result.warnings[0]).toContain("not found in primitive registry")
    })

    it("adds warning with error details when validator encounters an error", () => {
      const errorValidator: RegistryValidator = (_target: string) => ({
        exists: false,
        error: "filesystem unavailable",
      })

      const result = resolveIntake("implement the feature", undefined, errorValidator)
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain("filesystem unavailable")
    })

    it("handles validator throwing an exception gracefully", () => {
      const throwingValidator: RegistryValidator = () => {
        throw new Error("registry crash")
      }

      const result = resolveIntake("implement the feature", undefined, throwingValidator)
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0]).toContain("Registry validation failed")
      expect(result.warnings[0]).toContain("registry crash")
    })

    it("still routes correctly even when registry warns", () => {
      const emptyValidator = createRegistryValidator(new Map())

      const result = resolveIntake("write tests using tdd approach", undefined, emptyValidator)
      expect(result.purpose.purpose).toBe("tdd")
      expect(result.routingTarget).toBe("hm-l0-orchestrator")
      expect(result.warnings.length).toBeGreaterThan(0)
      // Routing still happens despite warnings
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

describe("createRegistryValidator", () => {
  it("returns exists: true when agent primitive is present", () => {
    const primitives = new Map([
      ["agent:gsd-executor", { name: "gsd-executor" }],
      ["agent:hm-l2-critic", { name: "hm-l2-critic" }],
    ])
    const validator = createRegistryValidator(primitives)

    expect(validator("gsd-executor").exists).toBe(true)
    expect(validator("hm-l2-critic").exists).toBe(true)
  })

  it("returns exists: false when agent primitive is absent", () => {
    const primitives = new Map([
      ["skill:other", { name: "other" }],
    ])
    const validator = createRegistryValidator(primitives)

    expect(validator("gsd-executor").exists).toBe(false)
  })

  it("returns exists: false for empty registry", () => {
    const validator = createRegistryValidator(new Map())

    expect(validator("any-agent").exists).toBe(false)
  })
})
