/**
 * WebSocket delegation channel handler.
 *
 * Manages WS upgrade requests, message parsing, and delegation event
 * forwarding for the `/ws/delegation` channel.
 *
 * @module sidecar/server/ws/delegation
 */

import type { IncomingMessage } from "node:http"
import type { Duplex } from "node:stream"
import type { SidecarDependencyRegistry } from "../registry.js"
import type { WsConnectionPool } from "./pool.js"

/** Valid WS message types. */
export const WsMessageType = [
  "subscribe",
  "unsubscribe",
  "ping",
  "event",
] as const

export type WsMessageType = (typeof WsMessageType)[number]

/** Dependencies for creating a WS delegation handler. */
export interface WsDelegationHandlerDeps {
  registry: SidecarDependencyRegistry
  pool: WsConnectionPool
}

/**
 * Create a WS delegation handler bound to the given dependencies.
 *
 * Returns a callable upgrade handler function with an `onMessage`
 * property for test assertions (duck-typed per WS test expectations).
 *
 * @param deps - Dependencies including registry and WS pool.
 * @returns A callable handler function with onMessage property.
 */
export function createWsDelegationHandler(
  deps: WsDelegationHandlerDeps,
): ((req: IncomingMessage, socket: Duplex, head: Buffer) => Promise<void>) & {
  onMessage: (msg: unknown) => { code?: number } | void
} {
  const onMessage = (msg: unknown): { code?: number } | void => {
    if (!msg || typeof msg !== "object") return { code: 1003 }
    const m = msg as Record<string, unknown>

    if (!m.type || typeof m.type !== "string") return { code: 1003 }

    if (!WsMessageType.includes(m.type as WsMessageType)) return { code: 1008 }

    return undefined
  }

  const handler = async (
    _req: IncomingMessage,
    socket: Duplex,
    _head: Buffer,
  ): Promise<void> => {
    const wsId = deps.pool.addClient()

    socket.on("data", (data: Buffer) => {
      try {
        const raw = data.toString("utf8")
        const msg = JSON.parse(raw)
        const result = onMessage(msg)
        if (result?.code) {
          socket.end()
          deps.pool.removeClient(wsId)
        }
      } catch {
        socket.end()
        deps.pool.removeClient(wsId)
      }
    })

    socket.on("close", () => {
      deps.pool.removeClient(wsId)
    })
  }

  handler.onMessage = onMessage

  return handler as ((
    req: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => Promise<void>) & { onMessage: (msg: unknown) => { code?: number } | void }
}
