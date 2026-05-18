import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { vi } from "vitest"

import { DelegationLifecycle } from "../../../../src/coordination/delegation/lifecycle.js"
import { NotificationRouter } from "../../../../src/coordination/delegation/notification-router.js"
import { DelegationRetryHandler } from "../../../../src/coordination/delegation/retry-handler.js"

describe("NotificationRouter", () => {
  it("routes a notification to the registered parent session", () => {
    const router = new NotificationRouter()
    router.register("dt-1", "parent-1")

    expect(router.route({ delegationId: "dt-1", message: "ok", timestamp: 1, type: "success" })).toEqual({
      parentSessionId: "parent-1",
      notification: { delegationId: "dt-1", message: "ok", timestamp: 1, type: "success" },
    })
  })

  it("routes 10 concurrent delegations to their own parents without broadcast", () => {
    const router = new NotificationRouter()
    for (let index = 0; index < 10; index += 1) router.register(`dt-${index}`, `parent-${index}`)

    const parents = Array.from({ length: 10 }, (_, index) => (
      router.route({ delegationId: `dt-${index}`, message: "ok", timestamp: index, type: "progress" })?.parentSessionId
    ))

    expect(parents).toEqual(Array.from({ length: 10 }, (_, index) => `parent-${index}`))
  })

  it("replays pending notifications FIFO when parent becomes available", () => {
    const router = new NotificationRouter()
    router.register("dt-1", "parent-1")
    router.queuePending("dt-1", { delegationId: "dt-1", message: "first", timestamp: 1, type: "progress" })
    router.queuePending("dt-1", { delegationId: "dt-1", message: "second", timestamp: 2, type: "success" })

    expect(router.replayPending("parent-1").map((notification) => notification.message)).toEqual(["first", "second"])
    expect(router.replayPending("parent-1")).toEqual([])
  })

  it("bounds the pending queue at 50 notifications", () => {
    const router = new NotificationRouter()
    router.register("dt-1", "parent-1")
    for (let index = 0; index < 55; index += 1) {
      router.queuePending("dt-1", { delegationId: "dt-1", message: `n-${index}`, timestamp: index, type: "progress" })
    }

    const replayed = router.replayPending("parent-1")
    expect(replayed).toHaveLength(50)
    expect(replayed[0]?.message).toBe("n-5")
  })

  it("persists pending notifications with idempotency when immediate delivery is unavailable", () => {
    const persisted: unknown[] = []
    const router = new NotificationRouter({
      deliver: () => false,
      persistPending: (records) => { persisted.push(records) },
    })
    router.register("dt-1", "parent-1")

    router.route({ delegationId: "dt-1", idempotencyKey: "same-key", message: "first", timestamp: 1, type: "progress" })
    router.route({ delegationId: "dt-1", idempotencyKey: "same-key", message: "first", timestamp: 1, type: "progress" })

    expect(router.replayPending("parent-1")).toHaveLength(1)
    expect(persisted.at(-1)).toEqual(expect.arrayContaining([
      expect.objectContaining({ parentSessionId: "parent-1", stateRoot: ".hivemind", notification: expect.objectContaining({ idempotencyKey: "same-key" }) }),
    ]))
  })

  it("persists async delivery failures once and replays pending notifications once", async () => {
    const persisted: unknown[] = []
    const router = new NotificationRouter({
      deliver: async () => { throw new Error("tui unavailable") },
      persistPending: (records) => { persisted.push(records) },
    })
    router.register("dt-1", "parent-1")

    router.route({ delegationId: "dt-1", idempotencyKey: "async-key", message: "deferred", timestamp: 1, type: "success" })
    await vi.waitFor(() => {
      expect(persisted).toHaveLength(1)
    })

    expect(router.replayPending("parent-1").map((notification) => notification.message)).toEqual(["deferred"])
    expect(router.replayPending("parent-1")).toEqual([])
    router.route({ delegationId: "dt-1", idempotencyKey: "async-key", message: "deferred", timestamp: 1, type: "success" })
    expect(router.replayPending("parent-1")).toEqual([])
  })

  it("formats the four notification types with their standard icons", () => {
    const router = new NotificationRouter()

    expect(router.formatNotification("success", "dt-1", "done")).toBe("✅ [DT:dt-1] success — done")
    expect(router.formatNotification("failure", "dt-1", "bad")).toBe("❌ [DT:dt-1] failure — bad")
    expect(router.formatNotification("progress", "dt-1", "running")).toBe("🔄 [DT:dt-1] progress — running")
    expect(router.formatNotification("timeout", "dt-1", "300s")).toBe("⏰ [DT:dt-1] timeout — 300s")
  })
})

describe("DelegationLifecycle", () => {
  it("wraps state-machine transitions and returns delegation results", () => {
    const delegation = {
      agent: "gsd-executor",
      childSessionId: "child-1",
      createdAt: 1,
      executionMode: "sdk" as const,
      id: "dt-1",
      lastMessageCount: 0,
      nestingDepth: 1,
      parentSessionId: "parent-1",
      queueKey: "agent:gsd-executor",
      stablePollCount: 0,
      status: "dispatched" as const,
      workingDirectory: process.cwd(),
    }
    const stateMachine = {
      get: () => delegation,
      transition: vi.fn((_id: string, status: "running") => { delegation.status = status; return true }),
    }
    const lifecycle = new DelegationLifecycle(stateMachine)

    expect(lifecycle.transition("dt-1", "running")).toMatchObject({ delegationId: "dt-1", status: "running" })
    expect(lifecycle.isTerminal("completed")).toBe(true)
  })
})

describe("DelegationRetryHandler", () => {
  it("retries failed persistence with exponential backoff then succeeds", async () => {
    const persist = vi.fn()
      .mockImplementationOnce(() => { throw new Error("disk busy") })
      .mockImplementationOnce(() => { throw new Error("disk busy") })
      .mockImplementationOnce(() => undefined)
    const wait = vi.fn().mockResolvedValue(undefined)
    const handler = new DelegationRetryHandler({ persist, wait })

    await handler.persistWithRetry([])

    expect(persist).toHaveBeenCalledTimes(3)
    expect(wait).toHaveBeenNthCalledWith(1, 1_000)
    expect(wait).toHaveBeenNthCalledWith(2, 2_000)
  })

  it("writes degraded persistence after retry exhaustion", async () => {
    const directory = mkdtempSync(join(tmpdir(), "delegation-retry-"))
    const degradedPath = join(directory, "retry-degraded.json")
    const handler = new DelegationRetryHandler({
      degradedPath,
      persist: () => { throw new Error("disk down") },
      wait: async () => undefined,
    })

    await expect(handler.persistWithRetry([])).resolves.toBe(false)
    expect(JSON.parse(readFileSync(degradedPath, "utf-8"))).toMatchObject({ reason: "disk down" })
    rmSync(directory, { recursive: true, force: true })
  })
})
