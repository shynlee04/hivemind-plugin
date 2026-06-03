/// <reference types="node" />

/**
 * Minimal ambient type declarations for the `ws` package.
 * Only covers the subset of WebSocket + WebSocketServer APIs
 * used by the sidecar's WsConnectionPool and WsDelegationHandler.
 */
declare module "ws" {
  import type { IncomingMessage } from "node:http"
  import type { Duplex } from "node:stream"

  class WebSocket {
    static CONNECTING: 0
    static OPEN: 1
    static CLOSING: 2
    static CLOSED: 3

    readyState: number
    url?: string

    constructor(url: string | URL, protocols?: string | string[])

    send(data: unknown, cb?: (err?: Error) => void): void
    send(data: unknown, opts: { mask?: boolean; binary?: boolean; compress?: boolean; fin?: boolean }, cb?: (err?: Error) => void): void

    close(code?: number, reason?: string): void

    on(event: "open", cb: () => void): void
    on(event: "close", cb: (code: number, reason: Buffer) => void): void
    on(event: "error", cb: (err: Error) => void): void
    on(event: "message", cb: (data: WebSocket.RawData, isBinary: boolean) => void): void
    on(event: "ping" | "pong", cb: (data: Buffer) => void): void

    terminate(): void
  }

  namespace WebSocket {
    type RawData = Buffer | ArrayBuffer | Buffer[]
  }

  class WebSocketServer {
    clients: Set<WebSocket>
    options: WebSocketServer.Description

    constructor(opts?: WebSocketServer.Description)

    handleUpgrade(
      req: IncomingMessage,
      socket: Duplex,
      head: Buffer,
      cb: (client: WebSocket, request: IncomingMessage) => void,
    ): void

    close(cb?: () => void): void
  }

  namespace WebSocketServer {
    interface Description {
      host?: string
      port?: number
      backlog?: number
      server?: import("node:http").Server | import("node:https").Server
      verifyClient?: (
        info: { origin: string; secure: boolean; req: IncomingMessage },
        cb: (res: boolean) => void,
      ) => void
      noServer?: boolean
      clientTracking?: boolean
      maxPayload?: number
      autoPong?: boolean
      closeTimeout?: number
      perMessageDeflate?: boolean | object
      path?: string
    }
  }
}
