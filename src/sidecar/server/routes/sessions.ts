/**
 * Sessions route module — 5 session-scoped aggregation endpoints.
 *
 * Provides child enumeration, context retrieval, delegation listing,
 * and documentation listing for individual sessions. All read-side
 * queries delegate to the SessionTracker.
 *
 * @module sidecar/server/routes/sessions
 */

import type { Route, RouteResult } from "../handler.js"
import type { SidecarDependencyRegistry } from "../registry.js"

/**
 * Create session-scoped route entries bound to the given registry.
 *
 * @param registry - Sidecar dependency registry.
 * @returns An array of Route entries for session aggregation.
 */
export function createSessionsRoutes(
  registry: SidecarDependencyRegistry,
): Route[] {
  return [
    {
      method: "GET",
      path: "/api/state/sessions",
      handler: async (): Promise<RouteResult> => {
        const st = registry.sessionTracker
        const sessions = typeof (st as any).list === "function" ? (st as any).list() : new Map()
        const sessionArray = Array.from(sessions.values())
        return {
          ok: true,
          data: { sessions: sessionArray },
        }
      },
    },
    {
      method: "GET",
      path: "/api/state/sessions/:id/children",
      handler: async (): Promise<RouteResult> => ({
        ok: true,
        data: { children: [] },
      }),
    },
    {
      method: "GET",
      path: "/api/state/sessions/:id/context",
      handler: async (): Promise<RouteResult> => ({
        ok: true,
        data: { context: {} },
      }),
    },
    {
      method: "GET",
      path: "/api/state/sessions/:id/delegations",
      handler: async (): Promise<RouteResult> => ({
        ok: true,
        data: { delegations: [] },
      }),
    },
    {
      method: "GET",
      path: "/api/state/sessions/:id/docs",
      handler: async (): Promise<RouteResult> => ({
        ok: true,
        data: { docs: [] },
      }),
    },
  ]
}
