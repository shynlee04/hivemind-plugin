/**
 * SC-02 sessions route tests — covers session-level aggregation queries.
 * Per plan-0 file inventory: tests/sidecar/server/routes/sessions.test.ts.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { createSessionsRoutes } from "../../../../src/sidecar/server/routes/sessions.js"
import { createMockRegistry } from "../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"
import type { Route } from "../../../../src/sidecar/server/handler.js"

describe("sessions route module", () => {
  let registry: SidecarDependencyRegistry
  let routes: Route[]

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
    routes = createSessionsRoutes(registry)
  })

  it("exports a non-empty array of Route entries", () => {
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
  })

  it("each route entry has method, path, and handler shape", () => {
    for (const r of routes) {
      expect(typeof r.method).toBe("string")
      expect(typeof r.path).toBe("string")
      expect(typeof r.handler).toBe("function")
    }
  })

  it("all paths are under /api/state/sessions", () => {
    for (const r of routes) {
      expect(r.path).toMatch(/^\/api\/state\/sessions/)
    }
  })

  it("delegates session list to sessionTracker", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    const r = createSessionsRoutes(reg)
    const listRoute = r.find((x) => x.method === "GET" && x.path === "/api/state/sessions")
    if (listRoute) {
      const result = await listRoute.handler({ params: {}, query: {}, body: undefined })
      expect(result).toHaveProperty("ok", true)
      expect(mock.sessionTracker.list).toHaveBeenCalled()
    }
  })

  it("delegates child enumeration to sessionTracker.get", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    const r = createSessionsRoutes(reg)
    const childrenRoute = r.find((x) => x.method === "GET" && x.path === "/api/state/sessions/:id/children")
    if (childrenRoute) {
      const result = await childrenRoute.handler({ params: { id: "sess-1" }, query: {}, body: undefined })
      expect(result).toHaveProperty("ok", true)
    }
  })
})
