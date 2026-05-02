import { describe, it, expect } from "vitest"
import {
  resolveProfile,
  type ProfileMatch,
} from "../../../src/lib/session-entry/profile-resolver.js"

describe("resolveProfile", () => {
  // ── SEI-04: Profile resolution ──────────────────────────────────────

  describe("default profile", () => {
    it("returns a default profile when no context provided", () => {
      const result = resolveProfile()
      expect(result.communicationStyle).toBeDefined()
      expect(result.decisionSpeed).toBeDefined()
      expect(result.expertise).toBeDefined()
      expect(result.matchConfidence).toBeGreaterThanOrEqual(0)
      expect(result.matchConfidence).toBeLessThanOrEqual(1)
    })

    it("returns a default profile when empty context provided", () => {
      const result = resolveProfile({})
      expect(result.communicationStyle).toBeDefined()
      expect(result.decisionSpeed).toBeDefined()
      expect(result.expertise).toBeDefined()
    })
  })

  describe("communication style detection", () => {
    it("infers concise from short technical messages", () => {
      const result = resolveProfile({
        messageLength: 20,
        technicalTerms: ["api", "sdk"],
      })
      expect(result.communicationStyle).toBe("concise")
    })

    it("infers detailed from long messages", () => {
      const result = resolveProfile({
        messageLength: 500,
        technicalTerms: ["api"],
      })
      expect(result.communicationStyle).toBe("detailed")
    })

    it("infers mixed from medium-length messages", () => {
      const result = resolveProfile({
        messageLength: 120,
        technicalTerms: ["api", "sdk", "tdd"],
      })
      expect(result.communicationStyle).toBe("mixed")
    })
  })

  describe("decision speed inference", () => {
    it("infers fast when context indicates quick decisions", () => {
      const result = resolveProfile({
        averageResponseTime: 5,
        totalInteractions: 10,
      })
      expect(result.decisionSpeed).toBe("fast")
    })

    it("infers deliberate from longer response times", () => {
      const result = resolveProfile({
        averageResponseTime: 120,
        totalInteractions: 10,
      })
      expect(result.decisionSpeed).toBe("deliberate")
    })
  })

  describe("expertise level inference", () => {
    it("infers senior from many technical terms", () => {
      const result = resolveProfile({
        technicalTerms: [
          "api", "sdk", "tdd", "ci/cd", "microservices",
          "event-driven", "cqrs", "domain-driven-design",
        ],
      })
      expect(result.expertise).toBe("senior")
    })

    it("infers junior from few or no technical terms", () => {
      const result = resolveProfile({
        technicalTerms: [],
      })
      expect(result.expertise).toBe("junior")
    })

    it("infers mid from moderate technical terms", () => {
      const result = resolveProfile({
        technicalTerms: ["api", "sdk", "testing"],
      })
      expect(result.expertise).toBe("mid")
    })
  })

  // ── Edge cases ──────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("produces a result with all required fields", () => {
      const result = resolveProfile({ someKey: "someValue" })
      expect(result).toHaveProperty("communicationStyle")
      expect(result).toHaveProperty("decisionSpeed")
      expect(result).toHaveProperty("expertise")
      expect(result).toHaveProperty("matchConfidence")
    })

    it("returns valid enum values for all fields", () => {
      const result = resolveProfile()
      expect(["concise", "detailed", "mixed"]).toContain(result.communicationStyle)
      expect(["fast", "deliberate"]).toContain(result.decisionSpeed)
      expect(["junior", "mid", "senior"]).toContain(result.expertise)
    })

    it("matchConfidence is always between 0 and 1", () => {
      const contexts = [
        undefined,
        {},
        { messageLength: 0 },
        { messageLength: 1000, technicalTerms: ["api"] },
        { averageResponseTime: 10 },
      ]
      for (const ctx of contexts) {
        const result = resolveProfile(ctx)
        expect(result.matchConfidence).toBeGreaterThanOrEqual(0)
        expect(result.matchConfidence).toBeLessThanOrEqual(1)
      }
    })
  })
})
