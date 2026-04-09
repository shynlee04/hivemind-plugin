import { describe, it, expect } from "vitest"
import {
  CATEGORY_DEFAULTS,
  getCategoryConfig,
  resolveModel,
  getToolProfile,
} from "../../src/lib/categories.js"
import { VALID_DELEGATION_CATEGORIES } from "../../src/lib/types.js"

describe("Category system — CATEGORY_DEFAULTS", () => {
  it("has an entry for each DelegationCategory", () => {
    for (const category of VALID_DELEGATION_CATEGORIES) {
      expect(CATEGORY_DEFAULTS).toHaveProperty(category)
    }
  })

  it("each category config has model, fallbackChain, temperature, maxTokens, toolProfile", () => {
    for (const category of VALID_DELEGATION_CATEGORIES) {
      const config = CATEGORY_DEFAULTS[category]
      expect(typeof config.model).toBe("string")
      expect(Array.isArray(config.fallbackChain)).toBe(true)
      expect(typeof config.temperature).toBe("number")
      expect(typeof config.maxTokens).toBe("number")
      expect(typeof config.toolProfile).toBe("string")
    }
  })

  it("research category maps to researcher toolProfile", () => {
    expect(CATEGORY_DEFAULTS.research.toolProfile).toBe("researcher")
  })

  it("implementation category maps to builder toolProfile", () => {
    expect(CATEGORY_DEFAULTS.implementation.toolProfile).toBe("builder")
  })

  it("review category maps to critic toolProfile", () => {
    expect(CATEGORY_DEFAULTS.review.toolProfile).toBe("critic")
  })

  it("visual-engineering category maps to builder toolProfile", () => {
    expect(CATEGORY_DEFAULTS["visual-engineering"].toolProfile).toBe("builder")
  })

  it("deep category maps to researcher toolProfile", () => {
    expect(CATEGORY_DEFAULTS.deep.toolProfile).toBe("researcher")
  })

  it("quick category maps to builder toolProfile", () => {
    expect(CATEGORY_DEFAULTS.quick.toolProfile).toBe("builder")
  })
})

describe("Category system — resolveModel", () => {
  it("returns category default model when no override", () => {
    const model = resolveModel("research")
    expect(model).toBe(CATEGORY_DEFAULTS.research.model)
  })

  it("returns agent override when provided", () => {
    const model = resolveModel("research", "claude-haiku-4-5")
    expect(model).toBe("claude-haiku-4-5")
  })

  it("falls back through chain when primary unavailable (use availableModels filter)", () => {
    const fallback = CATEGORY_DEFAULTS.research.fallbackChain[1]
    // Exclude the primary model so resolution must fall back
    const available = [fallback]
    const model = resolveModel("research", undefined, available)
    expect(model).toBe(fallback)
  })

  it("returns first fallbackChain model that is available", () => {
    const chain = CATEGORY_DEFAULTS.implementation.fallbackChain
    // All models available — should return the first one in the chain
    const model = resolveModel("implementation", undefined, [...chain])
    expect(model).toBe(chain[0])
  })

  it("throws [Harness] when no model available in chain", () => {
    expect(() =>
      resolveModel("review", undefined, ["some-unknown-model"])
    ).toThrow("[Harness]")
  })
})

describe("Category system — getCategoryConfig", () => {
  it("returns config for known category", () => {
    const config = getCategoryConfig("research")
    expect(config).toBe(CATEGORY_DEFAULTS.research)
  })

  it("returns config for all known categories", () => {
    for (const category of VALID_DELEGATION_CATEGORIES) {
      const config = getCategoryConfig(category)
      expect(config).toBe(CATEGORY_DEFAULTS[category])
    }
  })

  it("throws [Harness] for unknown category", () => {
    expect(() => getCategoryConfig("unknown-category")).toThrow("[Harness]")
  })

  it("throws [Harness] for empty string", () => {
    expect(() => getCategoryConfig("")).toThrow("[Harness]")
  })
})

describe("Category system — getToolProfile", () => {
  it("returns correct profile for each category", () => {
    expect(getToolProfile("research")).toBe("researcher")
    expect(getToolProfile("implementation")).toBe("builder")
    expect(getToolProfile("review")).toBe("critic")
    expect(getToolProfile("visual-engineering")).toBe("builder")
  })

  it("visual-engineering maps to builder toolProfile", () => {
    expect(getToolProfile("visual-engineering")).toBe("builder")
  })

  it("deep and quick use the least risky existing profiles", () => {
    expect(getToolProfile("deep")).toBe("researcher")
    expect(getToolProfile("quick")).toBe("builder")
  })
})
