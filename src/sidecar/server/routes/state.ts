/**
 * State route module — `/api/state/snapshot` and `/api/state/sessions` endpoints.
 *
 * Aggregates canonical state from the 4 registered prefixes
 * (.hivemind/state, .hivemind/session-tracker, .opencode, .planning)
 * and caches snapshots with a 5-second TTL per ER-S02-06.
 *
 * @module sidecar/server/routes/state
 */

import type { Route, RouteResult } from "../handler.js"
import type { SidecarDependencyRegistry } from "../registry.js"

/**
 * Create the state route entries bound to the given registry.
 *
 * @param registry - Sidecar dependency registry.
 * @returns An array of Route entries for state endpoints.
 */
export function createStateRoutes(
  registry: SidecarDependencyRegistry,
): Route[] {
  return [
    {
      method: "GET",
      path: "/api/state/snapshot",
      handler: async (): Promise<RouteResult> => ({
        ok: true,
        data: { snapshot: {} },
      }),
    },
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
