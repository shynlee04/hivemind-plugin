/**
 * SC-02 state route tests — covers /api/state/snapshot, /api/state/sessions,
 * /api/state/sessions/{id}/children, /api/state/sessions/{id}/context,
 * /api/state/sessions/{id}/delegations, /api/state/sessions/{id}/docs.
 *
 * Per 02-SPEC.md AC-S02-01: state routes return canonical-prefix aggregated
 * data with `{ok: true, data: {...}}` envelope.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { createStateRoutes } from "../../../../src/sidecar/server/routes/state.js"
import { createMockRegistry } from "../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach, vi } from "vitest"
import type { Route } from "../../../../src/sidecar/server/handler.js"

describe("state route module", () => {
  let registry: SidecarDependencyRegistry
  let routes: Route[]

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
    routes = createStateRoutes(registry)
  })

  it("exports a non-empty array of Route entries", () => {
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
  })

  it("includes GET /api/state/snapshot", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/state/snapshot")
    expect(found).toBeDefined()
  })

  it("includes GET /api/state/sessions", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/state/sessions")
    expect(found).toBeDefined()
  })

  it("includes GET /api/state/sessions/:id/children", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/state/sessions/:id/children")
    expect(found).toBeDefined()
  })

  it("includes GET /api/state/sessions/:id/context", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/state/sessions/:id/context")
    expect(found).toBeDefined()
  })

  it("includes GET /api/state/sessions/:id/delegations", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/state/sessions/:id/delegations")
    expect(found).toBeDefined()
  })

  it("includes GET /api/state/sessions/:id/docs", () => {
    const found = routes.find((r) => r.method === "GET" && r.path === "/api/state/sessions/:id/docs")
    expect(found).toBeDefined()
  })

  it("uses sessionTracker to read canonical state (per registry contract)", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    mock.sessionTracker.list.mockReturnValue(new Map([["sess-1", { id: "sess-1" }]]))
    const r = createStateRoutes(reg)
    const sessionsRoute = r.find((x) => x.method === "GET" && x.path === "/api/state/sessions")
    expect(sessionsRoute).toBeDefined()
    if (sessionsRoute) {
      const result = await sessionsRoute.handler({ params: {}, query: {}, body: undefined })
      expect(mock.sessionTracker.list).toHaveBeenCalled()
      expect(result).toHaveProperty("ok", true)
    }
  })

  it("each route entry has method, path, and handler shape", () => {
    for (const r of routes) {
      expect(typeof r.method).toBe("string")
      expect(typeof r.path).toBe("string")
      expect(typeof r.handler).toBe("function")
    }
  })
})
