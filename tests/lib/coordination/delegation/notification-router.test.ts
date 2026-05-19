import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { vi } from "vitest"

import { DelegationLifecycle } from "../../../../src/coordination/delegation/lifecycle.js"
import { NotificationRouter } from "../../../../src/coordination/delegation/notification-router.js"
import { DelegationRetryHandler } from "../../../../src/coordination/delegation/retry-handler.js"
import { formatCompactLine, formatDelegationNotification, type NotificationFormatOptions } from "../../../../src/coordination/delegation/notification-formatter.js"

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

  it("replays terminal pending notifications FIFO when parent becomes available", () => {
    const router = new NotificationRouter()
    router.register("dt-1", "parent-1")
    router.queuePending("dt-1", { delegationId: "dt-1", message: "first", timestamp: 1, type: "failure" })
    router.queuePending("dt-1", { delegationId: "dt-1", message: "second", timestamp: 2, type: "success" })

    expect(router.replayPending("parent-1").map((notification) => notification.message)).toEqual(["first", "second"])
    expect(router.replayPending("parent-1")).toEqual([])
  })

  it("bounds the terminal pending queue at 50 notifications", () => {
    const router = new NotificationRouter()
    router.register("dt-1", "parent-1")
    for (let index = 0; index < 55; index += 1) {
      router.queuePending("dt-1", { delegationId: "dt-1", message: `n-${index}`, timestamp: index, type: "failure" })
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

    router.route({ delegationId: "dt-1", idempotencyKey: "same-key", message: "first", timestamp: 1, type: "failure" })
    router.route({ delegationId: "dt-1", idempotencyKey: "same-key", message: "first", timestamp: 1, type: "failure" })

    expect(router.replayPending("parent-1")).toHaveLength(1)
    expect(persisted.at(-1)).toEqual(expect.arrayContaining([
      expect.objectContaining({ parentSessionId: "parent-1", stateRoot: ".hivemind", notification: expect.objectContaining({ idempotencyKey: "same-key" }) }),
    ]))
  })

  it("does not deliver or persist progress notifications to the parent TUI", () => {
    const deliver = vi.fn(() => false)
    const persistPending = vi.fn()
    const router = new NotificationRouter({ deliver, persistPending })
    router.register("dt-1", "parent-1")

    expect(router.route({ delegationId: "dt-1", idempotencyKey: "progress-key", message: "running", timestamp: 1, type: "progress" })).toMatchObject({
      parentSessionId: "parent-1",
    })

    expect(deliver).not.toHaveBeenCalled()
    expect(persistPending).not.toHaveBeenCalled()
    expect(router.replayPending("parent-1")).toEqual([])
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

describe("rich notification fields", () => {
  const base: NotificationFormatOptions = {
    delegationId: "dt-123",
    agent: "builder",
    status: "completed",
    elapsedMs: 75000,
    toolCount: 8,
  }

  it("formatDelegationNotification includes path when provided", () => {
    const r = formatDelegationNotification({ ...base, path: "/src/components" } as NotificationFormatOptions)
    expect(r).toContain("path=/src/components")
  })

  it("formatDelegationNotification omits path when not provided", () => {
    const r = formatDelegationNotification(base)
    expect(r).not.toContain("path=")
  })

  it("formatDelegationNotification includes file count when fileChanges provided", () => {
    const r = formatDelegationNotification({ ...base, fileChanges: ["a.ts", "b.ts"] } as NotificationFormatOptions)
    expect(r).toContain("files=2")
  })

  it("formatDelegationNotification includes timestamp when completedAt provided", () => {
    const r = formatDelegationNotification({ ...base, completedAt: "2026-05-19T12:00:00.000Z" } as NotificationFormatOptions)
    expect(r).toContain("at=2026-05-19T12:00:00.000Z")
  })

  it("formatCompactLine includes path and file count", () => {
    const r = formatCompactLine({ ...base, path: "/src", fileChanges: ["f1.ts", "f2.ts"] } as NotificationFormatOptions)
    expect(r).toContain("path=/src")
    expect(r).toContain("files=2")
  })

  it("formatCompactLine omits path and file count when not provided", () => {
    const r = formatCompactLine(base)
    expect(r).not.toContain("path=")
    expect(r).not.toContain("files=")
  })

  it("formatTuiNotification passes through path when provided", () => {
    const router = new NotificationRouter()
    const r = router.formatTuiNotification("success", "dt-1", "builder", 75000, 8, { path: "/src/components" })
    expect(r).toContain("path=/src/components")
  })

  it("formatSystemNotification passes through path and fileChanges when provided", () => {
    const router = new NotificationRouter()
    const r = router.formatSystemNotification("success", "dt-1", "builder", 75000, 8, "done", {
      path: "/src",
      fileChanges: ["a.ts", "b.ts"],
      completedAt: "2026-05-19T12:00:00.000Z",
    })
    expect(r).toContain("path=/src")
    expect(r).toContain("files=2")
    expect(r).toContain("at=2026-05-19T12:00:00.000Z")
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
