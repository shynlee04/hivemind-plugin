import { describe, expect, it } from "vitest"

import {
  detectRuntimePressure,
  inspectToolAuthorityCatalog,
} from "../../../src/features/runtime-pressure/index.js"
import type {
  ToolEvidenceAttachment,
  ToolStateSurface,
} from "../../../src/features/runtime-pressure/types.js"

const STATE_SURFACES = new Set<ToolStateSurface>([
  "hivemind-state",
  "opencode-primitive",
  "read-only",
  "external-command",
])

const EVIDENCE_ATTACHMENTS = new Set<ToolEvidenceAttachment>([
  "trajectory-ledger",
  "session-journal",
  "execution-lineage",
  "none",
])

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
    it("produces all five outcomes across the band space", () => {
      // Steady → allow (read-only inspector picks "allow").
      expect(detectRuntimePressure({ tier: 0, toolName: "hivemind-doc" }).outcome).toBe("allow")
      // Advisory → advise (mutator at advisory advises per matrix).
      expect(detectRuntimePressure({ tier: 3, toolName: "session-patch" }).outcome).toBe("advise")
      // Gated → require_approval (mutator at gated requires approval).
      expect(detectRuntimePressure({ tier: 6, toolName: "session-patch" }).outcome).toBe(
        "require_approval",
      )
      // Blocking → block (state writer blocks at blocking).
      expect(detectRuntimePressure({ tier: 9, toolName: "hivemind-doc" }).outcome).toBe("block")
      // Blocking → block (mutator at blocking blocks).
      expect(detectRuntimePressure({ tier: 9, toolName: "configure-primitive" }).outcome).toBe(
        "block",
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

    it("attaches blockingRationale exactly when the outcome diverts the trajectory", () => {
      const allow = detectRuntimePressure({ tier: 0, toolName: "delegation-status" })
      expect(allow.outcome).toBe("allow")
      expect(allow.blockingRationale).toBeUndefined()

      const advise = detectRuntimePressure({ tier: 3, toolName: "session-patch" })
      expect(advise.outcome).toBe("advise")
      expect(advise.blockingRationale).toBeUndefined()

      const requireApproval = detectRuntimePressure({ tier: 6, toolName: "session-patch" })
      expect(requireApproval.outcome).toBe("require_approval")
      expect(requireApproval.blockingRationale).toBeTypeOf("string")
      expect(requireApproval.blockingRationale!.length).toBeGreaterThan(0)

      const defer = detectRuntimePressure({ tier: 9, toolName: "delegation-status" })
      expect(defer.outcome).toBe("defer")
      expect(defer.blockingRationale).toBeTypeOf("string")
      expect(defer.blockingRationale!.length).toBeGreaterThan(0)

      const block = detectRuntimePressure({ tier: 9, toolName: "configure-primitive" })
      expect(block.outcome).toBe("block")
      expect(block.blockingRationale).toBeTypeOf("string")
      expect(block.blockingRationale!.length).toBeGreaterThan(0)
    })

    it("falls back to conservative band defaults for unknown tools", () => {
      expect(detectRuntimePressure({ tier: 0, toolName: "ghost-tool" }).outcome).toBe("allow")
      expect(detectRuntimePressure({ tier: 3, toolName: "ghost-tool" }).outcome).toBe("advise")
      expect(detectRuntimePressure({ tier: 6, toolName: "ghost-tool" }).outcome).toBe(
        "require_approval",
      )
      expect(detectRuntimePressure({ tier: 9, toolName: "ghost-tool" }).outcome).toBe("block")
    })
  })

  describe("PRESSURE-03 — tool catalog authority matrix", () => {
    it("populates every contract field on every entry", () => {
      const catalog = inspectToolAuthorityCatalog()
      expect(catalog.length).toBeGreaterThan(0)
      for (const entry of catalog) {
        expect(entry.name).toBeTypeOf("string")
        expect(entry.name.length).toBeGreaterThan(0)
        expect(["read", "write", "execute", "state"]).toContain(entry.authority)
        expect(typeof entry.mutatesState).toBe("boolean")
        expect(typeof entry.canExecute).toBe("boolean")
        expect(STATE_SURFACES.has(entry.stateSurface)).toBe(true)
        expect(EVIDENCE_ATTACHMENTS.has(entry.evidenceAttachment)).toBe(true)
        expect(entry.reason).toBeTypeOf("string")
        expect(entry.reason.length).toBeGreaterThan(0)
        expect(entry.pressureBehavior.steady).toBeTypeOf("string")
        expect(entry.pressureBehavior.advisory).toBeTypeOf("string")
        expect(entry.pressureBehavior.gated).toBeTypeOf("string")
        expect(entry.pressureBehavior.blocking).toBeTypeOf("string")
      }
    })

    it("distinguishes the four state-surface classes per contract", () => {
      const catalog = inspectToolAuthorityCatalog()
      const surfaces = new Set(catalog.map((entry) => entry.stateSurface))
      expect(surfaces.has("hivemind-state")).toBe(true)
      expect(surfaces.has("opencode-primitive")).toBe(true)
      expect(surfaces.has("read-only")).toBe(true)
      expect(surfaces.has("external-command")).toBe(true)
    })

    it("keeps pressureBehavior monotonic — blocking is never more permissive than steady", () => {
      const order: Record<string, number> = {
        allow: 0,
        advise: 1,
        require_approval: 2,
        defer: 2,
        block: 3,
      }
      const catalog = inspectToolAuthorityCatalog()
      for (const entry of catalog) {
        const steadyRank = order[entry.pressureBehavior.steady]
        const advisoryRank = order[entry.pressureBehavior.advisory]
        const gatedRank = order[entry.pressureBehavior.gated]
        const blockingRank = order[entry.pressureBehavior.blocking]
        expect(advisoryRank).toBeGreaterThanOrEqual(steadyRank)
        expect(gatedRank).toBeGreaterThanOrEqual(advisoryRank)
        expect(blockingRank).toBeGreaterThanOrEqual(gatedRank)
      }
    })

    it("makes hivemind-state writers and external commands strict at blocking", () => {
      const catalog = inspectToolAuthorityCatalog()
      for (const entry of catalog) {
        if (entry.stateSurface === "hivemind-state" || entry.stateSurface === "external-command") {
          expect(["block", "defer", "require_approval"]).toContain(entry.pressureBehavior.blocking)
        }
      }
    })

    it("defends mutator tools against blocking-band allow leakage", () => {
      const catalog = inspectToolAuthorityCatalog()
      for (const entry of catalog) {
        if (entry.mutatesState || entry.canExecute) {
          expect(entry.pressureBehavior.blocking).not.toBe("allow")
        }
      }
    })
  })
})
