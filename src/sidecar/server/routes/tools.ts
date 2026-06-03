/**
 * Tools route module — 7 tool POST proxy endpoints.
 *
 * Each `/api/tools/{name}` endpoint reads the request body, looks up
 * the tool handler in TOOL_HANDLERS, and returns a ToolResponse envelope
 * with measured duration.
 *
 * @module sidecar/server/routes/tools
 */

import type { Route, RouteContext, RouteResult } from "../handler.js"
import type { SidecarDependencyRegistry } from "../registry.js"
import { dispatchToolHandler, REGISTERED_WRITE_TOOLS } from "../tool-proxy/router.js"

/**
 * Create tool POST route entries bound to the given registry.
 *
 * @param registry - Sidecar dependency registry.
 * @returns An array of Route entries for tool proxy endpoints.
 */
export function createToolsRoutes(
  registry: SidecarDependencyRegistry,
): Route[] {
  return REGISTERED_WRITE_TOOLS.map((toolName) => ({
    method: "POST",
    path: `/api/tools/${toolName}`,
    handler: async (ctx: RouteContext): Promise<RouteResult> => {
      const start = Date.now()
      const body = ctx.body as { args?: Record<string, unknown> } | undefined
      const args = body?.args ?? {}

      const result = await dispatchToolHandler({
        registry,
        toolName: toolName as string,
        args,
      })

      return {
        ok: result.ok,
        ...(result.ok
          ? { data: result.data, meta: { duration: Date.now() - start, tool: toolName } }
          : { error: result.error, meta: { duration: Date.now() - start, tool: toolName } }),
      } as RouteResult
    },
  }))
}
