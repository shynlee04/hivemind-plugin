import { describe, it, expect } from "vitest"
import { HivemindConfigsSchema, getDefaultConfigs } from "../../src/schema-kernel/hivemind-configs.schema.js"
import { isToggleEnabled, getDiscussMode } from "../../src/hooks/toggle-gates.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createConfig(workflowOverrides?: Record<string, unknown>): ReturnType<typeof HivemindConfigsSchema.parse> {
  return HivemindConfigsSchema.parse({
    workflow: workflowOverrides ?? {},
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("toggle-gates", () => {
  describe("isToggleEnabled", () => {
    it("Test 1: returns true when config is defined and toggle field is true", () => {
      const config = createConfig({ research: true })

      const result = isToggleEnabled(config, "research")

      expect(result).toBe(true)
    })

    it("Test 2: returns false when config is defined and toggle field is false", () => {
      const config = createConfig({ research: false })

      const result = isToggleEnabled(config, "research")

      expect(result).toBe(false)
    })

    it("Test 3: returns the Zod default value when config is undefined (uses getDefaultConfigs() fallback)", () => {
      const result = isToggleEnabled(undefined, "research")

      // Zod default for "research" is `true`
      expect(result).toBe(true)
    })

    it("Test 4: handles all 5 boolean toggles from BooleanToggle type", () => {
      const config = createConfig({
        research: true,
        plan_check: false,
        verifier: true,
        use_worktrees: false,
        research_before_questions: true,
      })

      expect(isToggleEnabled(config, "research")).toBe(true)
      expect(isToggleEnabled(config, "plan_check")).toBe(false)
      expect(isToggleEnabled(config, "verifier")).toBe(true)
      expect(isToggleEnabled(config, "use_worktrees")).toBe(false)
      expect(isToggleEnabled(config, "research_before_questions")).toBe(true)
    })

    it("Test 5: returns true for plan_check default (true) when config is undefined", () => {
      const result = isToggleEnabled(undefined, "plan_check")
      expect(result).toBe(true)
    })

    it("Test 6: returns false for use_worktrees default (false) when config is undefined", () => {
      const result = isToggleEnabled(undefined, "use_worktrees")
      expect(result).toBe(false)
    })

    it("Test 7: returns false when toggle value is explicitly false", () => {
      const config = createConfig({ research: false })

      const result = isToggleEnabled(config, "research")

      expect(result).toBe(false)
    })

    it("Test 8: use_worktrees (default false) correctly distinguished from toggles that default to true", () => {
      const defaults = getDefaultConfigs()

      // use_worktrees defaults to false, research defaults to true
      expect(isToggleEnabled(defaults, "use_worktrees")).toBe(false)
      expect(isToggleEnabled(defaults, "research")).toBe(true)
      expect(isToggleEnabled(defaults, "verifier")).toBe(true)
    })
  })

  describe("getDiscussMode", () => {
    it("returns discuss_mode value from config", () => {
      const config = createConfig({ discuss_mode: "intensive-phase-discussion" })

      const result = getDiscussMode(config)

      expect(result).toBe("intensive-phase-discussion")
    })

    it("returns 'sufficient-phase-discussion' (Zod default) when config is undefined", () => {
      const result = getDiscussMode(undefined)

      expect(result).toBe("sufficient-phase-discussion")
    })
  })
})
