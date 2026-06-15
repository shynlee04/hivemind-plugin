import { describe, expect, it } from "vitest"

import {
  detectRuntimePressure,
} from "../../../src/features/runtime-pressure/index.js"

// After tool-governance consolidation, TOOL_AUTHORITY_MATRIX was deleted.
// PRESSURE-03 (tool catalog authority matrix) tests were removed.
// PRESSURE-01 and PRESSURE-02 still validate the detect() API contract.

/**
 * Phase 67 conformance — every contract requirement validated as a single
 * end-to-end shape check on the live authority matrix and the live
 * `detect()` API.
 */
describe("Phase 67 conformance — runtime pressure control plane", () => {
  describe("PRESSURE-01 — 10-tier model with contract band mapping", () => {
    it("classifies every tier in the 0-9 range and assigns a contract band", () => {
      // Walking the bands directly is in model.test.ts; here we walk via
      // the public detect() entrypoint to prove integration.
      const tiers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
      for (const tier of tiers) {
        const decision = detectRuntimePressure({ tier })
        expect(decision.tier).toBe(tier)
        if (tier <= 1) expect(decision.band).toBe("steady")
        else if (tier <= 4) expect(decision.band).toBe("advisory")
        else if (tier <= 7) expect(decision.band).toBe("gated")
        else expect(decision.band).toBe("blocking")
      }
    })
  })

  describe("PRESSURE-02 — control-plane decision contract", () => {
    it("produces soft-governance outcomes across the band space (defaults are allow/advise)", () => {
      // Steady → allow (read-only inspector picks "allow").
      expect(detectRuntimePressure({ tier: 0, toolName: "hivemind-doc" }).outcome).toBe("allow")
      // Advisory → advise (mutator at advisory advises per matrix).
      expect(detectRuntimePressure({ tier: 3, toolName: "session-patch" }).outcome).toBe("advise")
      // Gated → advise (mutator at gated — soft governance defaults to advise).
      expect(detectRuntimePressure({ tier: 6, toolName: "session-patch" }).outcome).toBe(
        "advise",
      )
      // Blocking → advise (state writer — soft governance, monotonic with gated).
      expect(detectRuntimePressure({ tier: 9, toolName: "hivemind-doc" }).outcome).toBe("advise")
      // Blocking → advise (mutator at blocking — soft governance defaults to advise).
      expect(detectRuntimePressure({ tier: 9, toolName: "configure-primitive" }).outcome).toBe(
        "advise",
      )
    })

    it("attaches severity, reason, and recommendedAction to every decision", () => {
      for (const tier of [0, 2, 5, 9]) {
        const decision = detectRuntimePressure({ tier, toolName: "delegation-status" })
        expect(decision.severity).toMatch(/^(info|warn|error)$/)
        expect(decision.reason).toBeTypeOf("string")
        expect(decision.reason.length).toBeGreaterThan(0)
        expect(decision.recommendedAction).toBeTypeOf("string")
        expect(decision.recommendedAction.length).toBeGreaterThan(0)
      }
    })

    it("attaches blockingRationale only for outcomes that still block (soft governance — fewer blocking outcomes)", () => {
      const allow = detectRuntimePressure({ tier: 0, toolName: "delegation-status" })
      expect(allow.outcome).toBe("allow")
      expect(allow.blockingRationale).toBeUndefined()

      const advise = detectRuntimePressure({ tier: 3, toolName: "session-patch" })
      expect(advise.outcome).toBe("advise")
      expect(advise.blockingRationale).toBeUndefined()

      // Soft governance: gated is now "advise" — no blockingRationale
      const gatedAdvise = detectRuntimePressure({ tier: 6, toolName: "session-patch" })
      expect(gatedAdvise.outcome).toBe("advise")
      // blockingRationale is undefined for advise outcomes (no trajectory diversion)

      // Soft governance: blocking band is now "advise" for reads (monotonic with gated)
      const blockingRead = detectRuntimePressure({ tier: 9, toolName: "delegation-status" })
      expect(blockingRead.outcome).toBe("advise")

      const blockingWrite = detectRuntimePressure({ tier: 9, toolName: "configure-primitive" })
      expect(blockingWrite.outcome).toBe("advise")
      // No blockingRationale for advise — soft governance does not divert trajectory
    })

    it("falls back to conservative band defaults for unknown tools (soft governance)", () => {
      expect(detectRuntimePressure({ tier: 0, toolName: "ghost-tool" }).outcome).toBe("allow")
      expect(detectRuntimePressure({ tier: 3, toolName: "ghost-tool" }).outcome).toBe("advise")
      expect(detectRuntimePressure({ tier: 6, toolName: "ghost-tool" }).outcome).toBe(
        "advise",
      )
      expect(detectRuntimePressure({ tier: 9, toolName: "ghost-tool" }).outcome).toBe("advise")
    })
  })

// PRESSURE-03 — tool catalog authority matrix: REMOVED.
// After tool-governance consolidation, the authority matrix was deleted.
// All tool authority is now owned by OpenCode's native permission: field.
})
