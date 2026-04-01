import { describe, it, expect, vi, beforeEach } from "vitest"
import { DelegationConcurrencyQueue } from "../../src/lib/concurrency.js"
import {
  ensureSessionStats,
  forgetSession,
  setDelegationMeta,
} from "../../src/lib/state.js"
import type { DelegationMeta, SpecialistAgent } from "../../src/lib/types.js"

function createMockClient() {
  return {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "child-1" } }),
      get: vi.fn().mockResolvedValue({ data: { id: "mock", status: { type: "idle" } } }),
      prompt: vi.fn().mockResolvedValue({ data: {} }),
      abort: vi.fn().mockResolvedValue({ data: { id: "mock" } }),
      children: vi.fn().mockResolvedValue({ data: [] }),
      messages: vi.fn().mockResolvedValue({ data: [] }),
    },
    event: {
      subscribe: vi.fn(),
    },
  }
}

async function importManager() {
  const { createHarnessLifecycleManager } = await import(
    "../../src/lib/lifecycle-manager.js"
  )
  return { createHarnessLifecycleManager }
}

describe("BGT-002: Session cancellation via cancelDelegatedSession", () => {
  it("calls client.session.abort with correct session ID", async () => {
    const client = createMockClient()
    const { createHarnessLifecycleManager } = await importManager()

    const manager = createHarnessLifecycleManager({
      client,
      pollIntervalMs: 100,
      pollTimeoutMs: 1000,
    })

    await manager.cancelDelegatedSession("session-123")

    expect(client.session.abort).toHaveBeenCalledWith({
      id: "session-123",
    })
  })

  it("handles abort failure gracefully without throwing", async () => {
    const client = createMockClient()
    client.session.abort.mockRejectedValue(new Error("Network error"))

    const { createHarnessLifecycleManager } = await importManager()
    const manager = createHarnessLifecycleManager({
      client,
      pollIntervalMs: 100,
      pollTimeoutMs: 1000,
    })

    await expect(
      manager.cancelDelegatedSession("session-789")
    ).resolves.toBeUndefined()
  })

  it("handles missing client.session.abort gracefully", async () => {
    const client = createMockClient()
    delete (client.session as any).abort

    const { createHarnessLifecycleManager } = await importManager()
    const manager = createHarnessLifecycleManager({
      client,
      pollIntervalMs: 100,
      pollTimeoutMs: 1000,
    })

    await expect(
      manager.cancelDelegatedSession("session-no-abort")
    ).resolves.toBeUndefined()
  })
})

describe("CON-003: lifecycle-manager uses configurable concurrency", () => {
  it("respects OPENCODE_HARNESS_CONCURRENCY_LIMIT from environment", async () => {
    const original = process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT
    process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT = "5"

    try {
      const { createHarnessLifecycleManager } = await importManager()
      const client = createMockClient()
      const manager = createHarnessLifecycleManager({
        client,
        pollIntervalMs: 100,
        pollTimeoutMs: 1000,
      })

      const concurrencyLimit = manager.getConcurrencyLimit()
      expect(concurrencyLimit).toBe(5)
    } finally {
      if (original !== undefined) {
        process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT = original
      } else {
        delete process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT
      }
    }
  })

  it("defaults to 3 when env var is not set", async () => {
    const original = process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT
    delete process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT

    try {
      const { createHarnessLifecycleManager } = await importManager()
      const client = createMockClient()
      const manager = createHarnessLifecycleManager({
        client,
        pollIntervalMs: 100,
        pollTimeoutMs: 1000,
      })

      const concurrencyLimit = manager.getConcurrencyLimit()
      expect(concurrencyLimit).toBe(3)
    } finally {
      if (original !== undefined) {
        process.env.OPENCODE_HARNESS_CONCURRENCY_LIMIT = original
      }
    }
  })
})
