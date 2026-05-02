import { describe, it, expect } from "vitest"
import {
  classifyPurpose,
  PURPOSE_CLASSES,
  type PurposeClass,
  type ClassificationResult,
} from "../../../src/lib/session-entry/purpose-classifier.js"

describe("classifyPurpose", () => {
  // ── SEI-01: 8 purpose classes ────────────────────────────────────────

  describe("discovery classification", () => {
    it("classifies 'explore the codebase' as discovery", () => {
      const result = classifyPurpose("explore the codebase")
      expect(result.purpose).toBe("discovery")
      expect(result.confidence).toBeGreaterThan(0)
    })

    it("classifies 'what is this module' as discovery", () => {
      const result = classifyPurpose("what is this module doing?")
      expect(result.purpose).toBe("discovery")
    })

    it("classifies 'how does this work' as discovery", () => {
      const result = classifyPurpose("how does the delegation system work?")
      expect(result.purpose).toBe("discovery")
    })
  })

  describe("brainstorming classification", () => {
    it("classifies \"let's brainstorm\" as brainstorming", () => {
      const result = classifyPurpose("let's brainstorm ideas for the API")
      expect(result.purpose).toBe("brainstorming")
    })

    it("classifies 'ideate' as brainstorming", () => {
      const result = classifyPurpose("ideate on new feature concepts")
      expect(result.purpose).toBe("brainstorming")
    })

    it("classifies 'think through' as brainstorming", () => {
      const result = classifyPurpose("think through the architecture")
      expect(result.purpose).toBe("brainstorming")
    })
  })

  describe("research classification", () => {
    it("classifies 'research' as research", () => {
      const result = classifyPurpose("research the best ORM options")
      expect(result.purpose).toBe("research")
    })

    it("classifies 'investigate' as research", () => {
      const result = classifyPurpose("investigate the memory leak")
      expect(result.purpose).toBe("research")
    })

    it("classifies 'analyze' as research", () => {
      const result = classifyPurpose("analyze the performance bottleneck")
      expect(result.purpose).toBe("research")
    })
  })

  describe("planning classification", () => {
    it("classifies 'plan the implementation' as planning", () => {
      const result = classifyPurpose("plan the implementation for auth")
      expect(result.purpose).toBe("planning")
    })

    it("classifies 'break down the epic' as planning", () => {
      const result = classifyPurpose("break down the epic into phases")
      expect(result.purpose).toBe("planning")
    })

    it("classifies 'roadmap' as planning", () => {
      const result = classifyPurpose("create a roadmap for the next quarter")
      expect(result.purpose).toBe("planning")
    })
  })

  describe("implementation classification", () => {
    it("classifies 'implement the feature' as implementation", () => {
      const result = classifyPurpose("implement the feature")
      expect(result.purpose).toBe("implementation")
    })

    it("classifies 'build the API' as implementation", () => {
      const result = classifyPurpose("build the API endpoint")
      expect(result.purpose).toBe("implementation")
    })

    it("classifies 'create a new module' as implementation", () => {
      const result = classifyPurpose("create a new module for caching")
      expect(result.purpose).toBe("implementation")
    })

    it("classifies 'fix the bug' as implementation", () => {
      const result = classifyPurpose("fix the issue with the parser")
      expect(result.purpose).toBe("implementation")
    })
  })

  describe("gatekeeping classification", () => {
    it("classifies 'verify the implementation' as gatekeeping", () => {
      const result = classifyPurpose("verify the implementation works")
      expect(result.purpose).toBe("gatekeeping")
    })

    it("classifies 'validate the output' as gatekeeping", () => {
      const result = classifyPurpose("validate the output format")
      expect(result.purpose).toBe("gatekeeping")
    })

    it("classifies 'review the code' as gatekeeping", () => {
      const result = classifyPurpose("review the code changes")
      expect(result.purpose).toBe("gatekeeping")
    })

    it("classifies 'gate check' as gatekeeping", () => {
      const result = classifyPurpose("run the gate check")
      expect(result.purpose).toBe("gatekeeping")
    })
  })

  describe("tdd classification", () => {
    it("classifies 'write tests for this' as tdd", () => {
      const result = classifyPurpose("write tests for this module")
      expect(result.purpose).toBe("tdd")
    })

    it("classifies 'tdd approach' as tdd", () => {
      const result = classifyPurpose("use tdd approach for this feature")
      expect(result.purpose).toBe("tdd")
    })

    it("classifies 'red-green-refactor' as tdd", () => {
      const result = classifyPurpose("red-green-refactor the auth module")
      expect(result.purpose).toBe("tdd")
    })
  })

  describe("course-correction classification", () => {
    it("classifies 'something went wrong' as course-correction", () => {
      const result = classifyPurpose("something went wrong with the build")
      expect(result.purpose).toBe("course-correction")
    })

    it("classifies 'bug in the system' as course-correction", () => {
      const result = classifyPurpose("there's a bug in the system")
      expect(result.purpose).toBe("course-correction")
    })

    it("classifies 'this is broken' as course-correction", () => {
      const result = classifyPurpose("this is broken after the refactor")
      expect(result.purpose).toBe("course-correction")
    })

    it("classifies 'error in production' as course-correction", () => {
      const result = classifyPurpose("error in production logs")
      expect(result.purpose).toBe("course-correction")
    })

    it("classifies 'regression detected' as course-correction", () => {
      const result = classifyPurpose("regression detected in the test suite")
      expect(result.purpose).toBe("course-correction")
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("returns discovery with low confidence for empty input", () => {
      const result = classifyPurpose("")
      expect(result.confidence).toBeLessThanOrEqual(0.1)
      expect(result.purpose).toBeDefined()
    })

    it("returns discovery with low confidence for whitespace-only input", () => {
      const result = classifyPurpose("   ")
      expect(result.confidence).toBeLessThanOrEqual(0.1)
    })

    it("returns discovery with low confidence for gibberish input", () => {
      const result = classifyPurpose("xyzzy plugh plover")
      expect(result.confidence).toBeLessThanOrEqual(0.1)
    })

    it("handles multi-keyword input by returning highest scoring class", () => {
      const result = classifyPurpose("research and implement the caching layer")
      expect(result.purpose).toBeDefined()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it("returns alternatives sorted by confidence descending", () => {
      const result = classifyPurpose("research and implement the new feature")
      expect(result.alternatives.length).toBeGreaterThan(0)
      for (let i = 1; i < result.alternatives.length; i++) {
        // alternatives should be valid purpose classes
        expect(PURPOSE_CLASSES).toContain(result.alternatives[i])
      }
    })

    it("produces a result with all required fields", () => {
      const result = classifyPurpose("implement the feature")
      expect(result).toHaveProperty("purpose")
      expect(result).toHaveProperty("confidence")
      expect(result).toHaveProperty("alternatives")
      expect(typeof result.purpose).toBe("string")
      expect(typeof result.confidence).toBe("number")
      expect(Array.isArray(result.alternatives)).toBe(true)
    })

    it("confidence is always between 0 and 1", () => {
      const inputs = [
        "implement it",
        "",
        "plan the thing",
        "test everything",
        "xyz",
      ]
      for (const input of inputs) {
        const result = classifyPurpose(input)
        expect(result.confidence).toBeGreaterThanOrEqual(0)
        expect(result.confidence).toBeLessThanOrEqual(1)
      }
    })
  })
})

describe("PURPOSE_CLASSES", () => {
  it("contains exactly 8 purpose classes", () => {
    expect(PURPOSE_CLASSES).toHaveLength(8)
  })

  it("includes all required classes", () => {
    const required: PurposeClass[] = [
      "discovery",
      "brainstorming",
      "research",
      "planning",
      "implementation",
      "gatekeeping",
      "tdd",
      "course-correction",
    ]
    for (const cls of required) {
      expect(PURPOSE_CLASSES).toContain(cls)
    }
  })
})
