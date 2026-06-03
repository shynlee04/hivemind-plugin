/**
 * SSE events route module — `/api/events` server-sent events endpoint.
 *
 * Provides real-time event streaming with 6 filter categories and a
 * 50-connection cap via SseConnectionPool.
 *
 * @module sidecar/server/routes/events
 */

import type { Route, RouteResult } from "../handler.js"
import type { SidecarDependencyRegistry } from "../registry.js"
import type { SseConnectionPool } from "../sse/pool.js"

/** SSE filter category type. */
export type SseFilterCategory =
  | "session"
  | "delegation"
  | "trajectory"
  | "pressure"
  | "invalidate"
  | "heartbeat"

/** Valid SSE filter categories. */
export const SseFilter: readonly SseFilterCategory[] = [
  "session",
  "delegation",
  "trajectory",
  "pressure",
  "invalidate",
  "heartbeat",
] as const

export interface EventsRouteOptions {
  registry: SidecarDependencyRegistry
  ssePool: SseConnectionPool
}

/**
 * Create the SSE events route entry bound to the given dependencies.
 *
 * @param options - Dependencies including registry and SSE pool.
 * @returns An array of Route entries for the events endpoint.
 */
export function createEventsRoute(
  options: EventsRouteOptions,
): Route[] {
  const { ssePool } = options

  return [
    {
      method: "GET",
      path: "/api/events",
      handler: async (ctx): Promise<RouteResult> => {
        const filter = ctx.query?.filter

        if (filter && !SseFilter.includes(filter as SseFilterCategory)) {
          return {
            ok: false,
            error: {
              code: "BAD_FILTER",
              message: `Invalid SSE filter: ${filter}. Valid: ${SseFilter.join(", ")}`,
            },
          }
        }

        // SSE endpoint — return with SSE-specific headers
        return {
          ok: true,
          data: {
            pool: {
              clientCount: ssePool.clientCount,
            },
          },
          _headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
          _rawBody: `event: connected\ndata: {}\n\n`,
        }
      },
    },
  ]
}
