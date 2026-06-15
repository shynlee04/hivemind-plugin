import { describe, it, expect, beforeEach, afterEach } from "vitest"
import http from "node:http"

import { createSidecarServer } from "../../../src/sidecar/server/factory.js"
import { SidecarDependencyRegistry } from "../../../src/sidecar/server/registry.js"
import { SseConnectionPool } from "../../../src/sidecar/server/sse/pool.js"

describe("createSidecarServer", () => {
  let registry: SidecarDependencyRegistry
  let ssePool: SseConnectionPool
  let projectDirectory: string

  beforeEach(() => {
    registry = new SidecarDependencyRegistry()
    ssePool = new SseConnectionPool({})
    projectDirectory = "/tmp" // dummy — no filesystem writes tested here
  })

  describe("return shape", () => {
    it("returns an object with port and close", async () => {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      expect(server).toHaveProperty("port")
      expect(typeof server.port).toBe("number")
      expect(server).toHaveProperty("close")
      expect(typeof server.close).toBe("function")
      await server.close()
    })
  })

  describe("port binding", () => {
    it("returns a port > 0 after start", async () => {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      try {
        expect(server.port).toBeGreaterThan(0)
      } finally {
        await server.close()
      }
    })

    it("binds to 127.0.0.1", async () => {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      try {
        // Verify binding by making a request to 127.0.0.1
        const res = await fetch(`http://127.0.0.1:${server.port}/health`)
        expect(res.status).toBe(200)
      } finally {
        await server.close()
      }
    })
  })

  describe("close()", () => {
    it("resolves without error and server stops accepting", async () => {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      await server.close()
      // After close, requests should fail
      await expect(
        fetch(`http://127.0.0.1:${server.port}/health`),
      ).rejects.toThrow()
    })
  })

  describe("GET /health", () => {
    it("returns 200 with JSON body containing status: ok", async () => {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      try {
        const res = await fetch(`http://127.0.0.1:${server.port}/health`)
        expect(res.status).toBe(200)
        expect(res.headers.get("content-type")).toMatch(/application\/json/)
        const body = await res.json()
        expect(body).toHaveProperty("status", "ok")
        expect(body).toHaveProperty("uptime")
        expect(typeof body.uptime).toBe("number")
      } finally {
        await server.close()
      }
    })
  })

  describe("non-/health routes", () => {
    it("returns 501 for unknown paths", async () => {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      try {
        const res = await fetch(`http://127.0.0.1:${server.port}/`)
        expect(res.status).toBe(404)
        const body = await res.json()
        expect(body).toHaveProperty("error")
        expect(body.error).toHaveProperty("code", "NOT_FOUND")
      } finally {
        await server.close()
      }
    })

    it("returns 501 for /nonexistent", async () => {
      const server = await createSidecarServer({ registry, ssePool, projectDirectory })
      try {
        const res = await fetch(`http://127.0.0.1:${server.port}/nonexistent`)
        expect(res.status).toBe(404)
      } finally {
        await server.close()
      }
    })
  })
})
