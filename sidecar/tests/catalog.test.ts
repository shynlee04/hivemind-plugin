import { describe, it, expect } from "vitest"

describe("catalog", () => {
  describe("component count", () => {
    it("should have catalogComponents with component definitions", async () => {
      const { catalogComponents } = await import("../src/lib/catalog")
      const keys = Object.keys(catalogComponents)
      // Each entry should have props (Zod schema), slots, description
      expect(keys.length).toBeGreaterThanOrEqual(8) // At least 8 custom + shadcn
      for (const name of keys.slice(0, 3)) {
        const entry = catalogComponents[name as keyof typeof catalogComponents]
        expect(entry).toHaveProperty("props")
        expect(entry).toHaveProperty("slots")
        expect(entry).toHaveProperty("description")
      }
    })

    it("should include custom sidecar components", async () => {
      const { customComponentDefinitions } = await import("../src/lib/catalog")
      const keys = Object.keys(customComponentDefinitions)
      const expectedCustom = [
        "SidecarContainer",
        "PanelHeader",
        "StatusBadge",
        "MetricCard",
        "SessionTree",
        "DelegationList",
        "TimelineView",
        "ConnectionIndicator",
      ]
      for (const name of expectedCustom) {
        expect(keys).toContain(name)
      }
      expect(keys.length).toBe(8)
    })
  })
})
