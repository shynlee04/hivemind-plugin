import { describe, it, expect } from "vitest"

interface CatalogEntry {
  type: string
  schema: unknown
  component: unknown
}

interface Catalog {
  components: Record<string, CatalogEntry>
}

describe("catalog", () => {
  describe("component count", () => {
    it("should define exactly 44 components", () => {
      // RED: will fail until catalog.ts provides the real catalog
      const catalog: Catalog = getCatalog()
      const keys = Object.keys(catalog.components)
      expect(keys.length).toBe(44)
    })

    it("should include shadcn components", () => {
      const catalog: Catalog = getCatalog()
      const keys = Object.keys(catalog.components)
      expect(keys.length).toBeGreaterThanOrEqual(36)
    })

    it("should include custom sidecar components", () => {
      const catalog: Catalog = getCatalog()
      const keys = Object.keys(catalog.components)
      const customComponents = [
        "SidecarContainer",
        "PanelHeader",
        "StatusBadge",
        "MetricCard",
        "SessionTree",
        "DelegationList",
        "TimelineView",
        "ConnectionIndicator",
      ]
      for (const name of customComponents) {
        expect(keys).toContain(name)
      }
    })
  })

  describe("component structure", () => {
    it("should have required fields for each entry", () => {
      const catalog: Catalog = getCatalog()
      for (const [name, entry] of Object.entries(catalog.components)) {
        expect(entry, `Component "${name}" missing "type"`).toHaveProperty("type")
        expect(entry, `Component "${name}" missing "schema"`).toHaveProperty("schema")
        expect(entry, `Component "${name}" missing "component"`).toHaveProperty("component")
      }
    })
  })
})

// ── Helper: Mock factory ──

function getCatalog(): Catalog {
  // RED scaffold: will fail until catalog.ts provides the real catalog
  throw new Error("NOT_IMPLEMENTED: getCatalog must be provided by catalog.ts")
}
