/**
 * SC-02 catalog route tests — covers /api/catalog and /api/catalog/tools.
 * Per 02-SPEC.md AC-S02-07: catalog JSON is deep-frozen and immutable at
 * runtime — any mutation attempt must throw.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { createCatalogRoutes } from "../../../../src/sidecar/server/routes/catalog.js"
import { createMockRegistry } from "../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"
import type { Route } from "../../../../src/sidecar/server/handler.js"

describe("catalog route module", () => {
  let registry: SidecarDependencyRegistry
  let routes: Route[]

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
    routes = createCatalogRoutes(registry)
  })

  it("exports a non-empty array of Route entries", () => {
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
  })

  it("includes GET /api/catalog", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/catalog")
    expect(found).toBeDefined()
  })

  it("includes GET /api/catalog/tools", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/catalog/tools")
    expect(found).toBeDefined()
  })

  it("each route entry has method, path, and handler shape", () => {
    for (const r of routes) {
      expect(typeof r.method).toBe("string")
      expect(typeof r.path).toBe("string")
      expect(typeof r.handler).toBe("function")
    }
  })

  it("returns frozen catalog data (Object.isFrozen on returned body)", async () => {
    const catalogRoute = routes.find((r) => r.method === "GET" && r.path === "/api/catalog")
    if (catalogRoute) {
      const result = await catalogRoute.handler({ params: {}, query: {}, body: undefined })
      const dataResult = result as { ok: true; data: { catalog: unknown } }
      expect(dataResult.ok).toBe(true)
      expect(Object.isFrozen(dataResult.data.catalog)).toBe(true)
    }
  })

  it("returns frozen tool catalog", async () => {
    const toolsRoute = routes.find((r) => r.method === "GET" && r.path === "/api/catalog/tools")
    if (toolsRoute) {
      const result = await toolsRoute.handler({ params: {}, query: {}, body: undefined })
      const dataResult = result as { ok: true; data: { tools: unknown } }
      expect(dataResult.ok).toBe(true)
      expect(Object.isFrozen(dataResult.data.tools)).toBe(true)
    }
  })
})
