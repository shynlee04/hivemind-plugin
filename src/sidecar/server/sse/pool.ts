/**
 * SSE (Server-Sent Events) connection pool for the sidecar server.
 *
 * Manages a set of SSE client connections with a configurable maximum
 * concurrent connection limit and an optional heartbeat interval.
 * Dead connections are automatically cleaned up during broadcast.
 *
 * @module sidecar/server/sse/pool
 */

import type { SidecarEvent } from "../../types.js"

/** Configuration options for the SSE connection pool. */
export interface SseConnectionPoolOptions {
  /** Heartbeat interval in milliseconds (default 30000). */
  heartbeatIntervalMs?: number
  /** Maximum concurrent SSE connections (default 50). */
  maxClients?: number
}

/** A single SSE connection handle. */
export interface SseConnection {
  id: string
  controller: ReadableStreamDefaultController
}

const encoder = new TextEncoder()

/**
 * Manages a pool of SSE client connections with broadcast,
 * heartbeat, and dead-connection cleanup.
 */
export class SseConnectionPool {
  readonly #connections = new Map<string, SseConnection>()
  #heartbeatTimer: ReturnType<typeof setInterval> | undefined
  readonly #opts: Required<SseConnectionPoolOptions>

  constructor(opts: SseConnectionPoolOptions = {}) {
    this.#opts = {
      heartbeatIntervalMs: opts.heartbeatIntervalMs ?? 30_000,
      maxClients: opts.maxClients ?? 50,
    }
  }

  /**
   * Register a new SSE client connection.
   *
   * @param controller - The stream controller for the SSE response.
   * @returns A unique connection ID.
   * @throws `[Hivemind]` error when the maximum connection count is reached.
   */
  addClient(controller: ReadableStreamDefaultController): string {
    if (this.#connections.size >= this.#opts.maxClients) {
      throw new Error(
        `[Hivemind] Sidecar: max SSE connections reached (${this.#opts.maxClients})`,
      )
    }
    const id = `sse-${Math.random().toString(36).slice(2, 9)}`
    this.#connections.set(id, { id, controller })
    return id
  }

  /**
   * Deregister an SSE client connection.
   *
   * @param id - The connection ID returned by {@link addClient}.
   */
  removeClient(id: string): void {
    this.#connections.delete(id)
  }

  /** Returns the number of active SSE connections. */
  get clientCount(): number {
    return this.#connections.size
  }

  /** Returns the maximum allowed SSE connections. */
  get maxClients(): number {
    return this.#opts.maxClients
  }

  /**
   * Broadcast a sidecar event to all connected SSE clients.
   *
   * The event is formatted as an SSE message (`event:` + `data:` lines).
   * If a client's stream controller throws during enqueue, the client
   * is considered dead and is automatically removed.
   *
   * @param event - The sidecar event to broadcast.
   */
  broadcast(event: SidecarEvent): void {
    const sseMessage = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
    const encoded = encoder.encode(sseMessage)

    for (const [id, conn] of this.#connections) {
      try {
        conn.controller.enqueue(encoded)
      } catch {
        this.#connections.delete(id)
      }
    }
  }

  /**
   * Start the heartbeat interval.
   *
   * Sends an `event: heartbeat` message to all connected clients at
   * the configured interval. Clears any previously running heartbeat
   * before starting a new one.
   */
  startHeartbeat(): void {
    this.#clearHeartbeat()
    this.#heartbeatTimer = setInterval(() => {
      const heartbeat: SidecarEvent = {
        type: "heartbeat",
        payload: {},
        timestamp: Date.now(),
      }
      this.broadcast(heartbeat)
    }, this.#opts.heartbeatIntervalMs)

    // Allow the Node.js process to exit even if the timer is active
    if (this.#heartbeatTimer && typeof this.#heartbeatTimer === "object" && "unref" in this.#heartbeatTimer) {
      this.#heartbeatTimer.unref()
    }
  }

  /**
   * Stop the heartbeat interval and remove all connections.
   *
   * Each connection's controller is closed before removal.
   */
  stop(): void {
    this.#clearHeartbeat()
    for (const [, conn] of this.#connections) {
      try {
        conn.controller.close()
      } catch {
        // Connection may already be closed — ignore
      }
    }
    this.#connections.clear()
  }

  #clearHeartbeat(): void {
    if (this.#heartbeatTimer !== undefined) {
      clearInterval(this.#heartbeatTimer)
      this.#heartbeatTimer = undefined
    }
  }
}
