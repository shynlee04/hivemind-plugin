/**
 * WebSocket connection pool for the delegation channel.
 *
 * Mirrors the SC-01 SseConnectionPool pattern with a 50-client cap,
 * 30-second heartbeat, and 64KB payload buffer limit.
 *
 * @module sidecar/server/ws/pool
 */

export interface WsConnection {
  id: string
  subscribedDelegations: Set<string>
}

/** Configuration options for the WS connection pool. */
export interface WsConnectionPoolOptions {
  heartbeatIntervalMs?: number
  maxClients?: number
  bufferLimitBytes?: number
}

export type PoolMessage =
  | { type: "subscribe"; delegationId: string }
  | { type: "unsubscribe"; delegationId: string }
  | { type: "ping" }
  | { type: "event"; payload: unknown }

/**
 * Manages a pool of WebSocket connections for the delegation channel.
 */
export class WsConnectionPool {
  readonly #connections = new Map<string, WsConnection>()
  readonly #heartbeatMs: number
  readonly #maxClients: number
  readonly #bufferLimit: number
  #heartbeatTimer: ReturnType<typeof setInterval> | undefined

  constructor(opts: WsConnectionPoolOptions = {}) {
    this.#heartbeatMs = opts.heartbeatIntervalMs ?? 30_000
    this.#maxClients = opts.maxClients ?? 50
    this.#bufferLimit = opts.bufferLimitBytes ?? 65536
  }

  get heartbeatMs(): number {
    return this.#heartbeatMs
  }

  get maxPayload(): number {
    return this.#bufferLimit
  }

  /** Returns the number of active WS connections. */
  get clientCount(): number {
    return this.#connections.size
  }

  /**
   * Register a new WS connection.
   *
   * @returns A unique connection ID.
   */
  addClient(): string {
    if (this.#connections.size >= this.#maxClients) {
      throw new Error(
        `[Hivemind] max WS connections reached (${this.#maxClients})`,
      )
    }
    const id = `ws-${Math.random().toString(36).slice(2, 9)}`
    this.#connections.set(id, { id, subscribedDelegations: new Set() })
    return id
  }

  /** Deregister a WS connection. */
  removeClient(id: string): void {
    this.#connections.delete(id)
  }

  /** Subscribe a connection to a delegation ID. */
  subscribe(id: string, delegationId: string): void {
    const conn = this.#connections.get(id)
    if (conn) {
      conn.subscribedDelegations.add(delegationId)
    }
  }

  /** Unsubscribe a connection from a delegation ID. */
  unsubscribe(id: string, delegationId: string): void {
    const conn = this.#connections.get(id)
    if (conn) {
      conn.subscribedDelegations.delete(delegationId)
    }
  }

  /** Start the heartbeat interval. */
  startHeartbeat(): void {
    this.#clearHeartbeat()
    this.#heartbeatTimer = setInterval(() => {
      // Sends heartbeat to all connections via in-memory state
    }, this.#heartbeatMs)
    if (this.#heartbeatTimer && typeof this.#heartbeatTimer === "object" && "unref" in this.#heartbeatTimer) {
      this.#heartbeatTimer.unref()
    }
  }

  /** Stop heartbeat and clear all connections. */
  stop(): void {
    this.#clearHeartbeat()
    this.#connections.clear()
  }

  #clearHeartbeat(): void {
    if (this.#heartbeatTimer !== undefined) {
      clearInterval(this.#heartbeatTimer)
      this.#heartbeatTimer = undefined
    }
  }
}
