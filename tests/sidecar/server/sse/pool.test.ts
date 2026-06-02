import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

import { SseConnectionPool } from "../../../../src/sidecar/server/sse/pool.js"
import type { SidecarEvent } from "../../../../src/sidecar/types.js"

function createMockController(): ReadableStreamDefaultController {
  return {
    enqueue: vi.fn(),
    close: vi.fn(),
    error: vi.fn(),
    desiredSize: 1,
  } as unknown as ReadableStreamDefaultController
}

describe("SseConnectionPool", () => {
  let pool: SseConnectionPool

  beforeEach(() => {
    pool = new SseConnectionPool({})
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("addClient / removeClient / clientCount", () => {
    it("addClient adds a connection and increments clientCount", () => {
      expect(pool.clientCount).toBe(0)
      const id = pool.addClient(createMockController())
      expect(id).toBeTruthy()
      expect(typeof id).toBe("string")
      expect(pool.clientCount).toBe(1)
    })

    it("removeClient removes a connection and decrements clientCount", () => {
      const id = pool.addClient(createMockController())
      expect(pool.clientCount).toBe(1)
      pool.removeClient(id)
      expect(pool.clientCount).toBe(0)
    })
  })

  describe("max connections enforcement", () => {
    it("throws when adding more than maxClients (default 50)", () => {
      for (let i = 0; i < 50; i++) {
        pool.addClient(createMockController())
      }
      expect(() => pool.addClient(createMockController())).toThrow(/\[Harness\]/)
    })

    it("rejects the 51st connection with [Harness] error", () => {
      for (let i = 0; i < 50; i++) {
        pool.addClient(createMockController())
      }
      expect(() => pool.addClient(createMockController())).toThrow(/max SSE connections/)
    })
  })

  describe("broadcast", () => {
    it("sends data to all connected clients via controller.enqueue()", () => {
      const ctrl1 = createMockController()
      const ctrl2 = createMockController()
      pool.addClient(ctrl1)
      pool.addClient(ctrl2)

      const event: SidecarEvent = {
        type: "session.created",
        payload: { sessionID: "ses_1" },
        timestamp: Date.now(),
      }

      pool.broadcast(event)

      expect(ctrl1.enqueue).toHaveBeenCalledTimes(1)
      expect(ctrl2.enqueue).toHaveBeenCalledTimes(1)
    })

    it("removes dead clients (controller.enqueue throws) during broadcast", () => {
      const goodCtrl = createMockController()
      const badCtrl = createMockController()
      badCtrl.enqueue = vi.fn().mockImplementation(() => {
        throw new Error("stream closed")
      })

      pool.addClient(goodCtrl)
      const badId = pool.addClient(badCtrl)
      expect(pool.clientCount).toBe(2)

      const event: SidecarEvent = {
        type: "heartbeat",
        payload: {},
        timestamp: Date.now(),
      }

      pool.broadcast(event)
      expect(pool.clientCount).toBe(1)
      expect(goodCtrl.enqueue).toHaveBeenCalled()
    })
  })

  describe("heartbeat", () => {
    it("starts heartbeat interval with startHeartbeat()", () => {
      vi.useFakeTimers()
      const ctrl = createMockController()
      pool.addClient(ctrl)

      pool.startHeartbeat()
      expect(pool.clientCount).toBe(1)

      vi.advanceTimersByTime(30000)
      expect(ctrl.enqueue).toHaveBeenCalled()
    })

    it("stop() clears the heartbeat interval", () => {
      vi.useFakeTimers()
      const ctrl = createMockController()
      pool.addClient(ctrl)

      pool.startHeartbeat()
      pool.stop()
      vi.advanceTimersByTime(30000)
      // After stop, no more heartbeats should fire
      expect(ctrl.enqueue).not.toHaveBeenCalled()
    })

    it("stop() removes all connections", () => {
      pool.addClient(createMockController())
      pool.addClient(createMockController())
      expect(pool.clientCount).toBe(2)

      pool.stop()
      expect(pool.clientCount).toBe(0)
    })
  })
})
