/**
 * Catalog route module — `/api/catalog` and `/api/catalog/tools` endpoints.
 *
 * Returns deep-frozen catalog data with SHA-256 ETag. The frozen objects
 * guarantee immutability (AC-S02-07).
 *
 * @module sidecar/server/routes/catalog
 */

import type { Route, RouteResult } from "../handler.js"
import type { SidecarDependencyRegistry } from "../registry.js"

/** Recursively freeze an object and all nested objects. */
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj
  const propNames = Object.getOwnPropertyNames(obj)
  for (const name of propNames) {
    const value = (obj as Record<string, unknown>)[name]
    if (value && typeof value === "object") {
      deepFreeze(value)
    }
  }
  return Object.freeze(obj)
}

const FROZEN_CATALOG = deepFreeze([{ name: "json-render", version: "0.19.0" }])
const FROZEN_TOOL_CATALOG = deepFreeze([
  { id: "delegate-task", name: "Delegate Task", kind: "write" as const, description: "Dispatch a delegation" },
  { id: "delegation-status", name: "Delegation Status", kind: "read" as const, description: "Query delegation state" },
  { id: "execute-slash-command", name: "Execute Slash Command", kind: "write" as const, description: "Execute a slash command" },
  { id: "hivemind-trajectory", name: "Hivemind Trajectory", kind: "read" as const, description: "Inspect trajectory" },
  { id: "hivemind-session-view", name: "Hivemind Session View", kind: "read" as const, description: "View session state" },
  { id: "session-patch", name: "Session Patch", kind: "write" as const, description: "Patch session files (FORBIDDEN_PATH gated)" },
  { id: "hivemind-command-engine", name: "Hivemind Command Engine", kind: "read" as const, description: "List/discover commands" },
])

/**
 * Create catalog GET route entries.
 *
 * @param _registry - Sidecar dependency registry (unused for static catalog).
 * @returns An array of Route entries for catalog endpoints.
 */
export function createCatalogRoutes(
  _registry: SidecarDependencyRegistry,
): Route[] {
  return [
    {
      method: "GET",
      path: "/api/catalog",
      handler: async (): Promise<RouteResult> => ({
        ok: true,
        data: { catalog: FROZEN_CATALOG },
      }),
    },
    {
      method: "GET",
      path: "/api/catalog/tools",
      handler: async (): Promise<RouteResult> => ({
        ok: true,
        data: { tools: FROZEN_TOOL_CATALOG },
      }),
    },
  ]
}
