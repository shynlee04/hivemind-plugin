import {
  buildDelegationQueueKey,
  DelegationConcurrencyQueue,
  reserveSubagentSpawn,
} from "../../src/coordination/concurrency/queue.js"
import { TaskStateManager } from "../../src/shared/state.js"
import { MAX_DESCENDANTS_PER_ROOT } from "../../src/shared/types.js"

// ---------------------------------------------------------------------------
// DelegationConcurrencyQueue
// ---------------------------------------------------------------------------

describe("DelegationConcurrencyQueue", () => {
  let queue: DelegationConcurrencyQueue

  beforeEach(() => {
    queue = new DelegationConcurrencyQueue()
  })

  describe("existing functionality", () => {
    it("acquire returns a release function", async () => {
      const release = await queue.acquire("test-key")
      expect(typeof release).toBe("function")
      release()
    })

    it("release allows next queued acquire to proceed", async () => {
      // Fill the lane to its default limit of 3
      const r1 = await queue.acquire("serial-key", 1)
      const order: number[] = []

      // This second acquire should be queued
      const p2 = queue.acquire("serial-key", 1).then((rel) => {
        order.push(2)
        rel()
      })

      // Release first slot — p2 should now resolve
      order.push(1)
      r1()

      await p2
      expect(order).toEqual([1, 2])
    })

    it("concurrent acquires on same key are serialized when limit is 1", async () => {
      const results: number[] = []
      const limit = 1

      const run = async (n: number) => {
        const release = await queue.acquire("limit-1-key", limit)
        results.push(n)
        // Yield a tick to let other acquires try to jump in
        await Promise.resolve()
        release()
      }

      await Promise.all([run(1), run(2), run(3)])

      // All three should have completed sequentially — order may vary by
      // microtask scheduling but all values must be present
      expect(results.sort()).toEqual([1, 2, 3])
    })

    it("different keys allow parallel execution", async () => {
      const started: string[] = []

      // Acquire both keys simultaneously — neither should block the other
      const r1Promise = queue.acquire("key-alpha").then((r) => {
        started.push("alpha")
        return r
      })
      const r2Promise = queue.acquire("key-beta").then((r) => {
        started.push("beta")
        return r
      })

      const [r1, r2] = await Promise.all([r1Promise, r2Promise])

      expect(started).toContain("alpha")
      expect(started).toContain("beta")

      r1()
      r2()
    })
  })

  describe("timeout-aware acquire (RUN-3c)", () => {
    it("same-key acquires serialize and reject after timeout", async () => {
      // Fill the lane to limit 1
      const r1 = await queue.acquire("timeout-key", 1)

      // Second acquire with short timeout should reject
      await expect(
        queue.acquire("timeout-key", 1, 50),
      ).rejects.toThrow(/\[Harness\].*timed out/)

      // Clean up
      r1()
    })

    it("different-key acquires still run in parallel even with timeout", async () => {
      // Acquire first key
      const r1 = await queue.acquire("key-with-timeout", 1, 100)

      // Different key should acquire immediately despite timeout
      const r2 = await queue.acquire("other-key-with-timeout", 1, 100)

      r1()
      r2()
    })

    it("timeout error includes the key name", async () => {
      const r1 = await queue.acquire("named-timeout-key", 1)

      await expect(
        queue.acquire("named-timeout-key", 1, 50),
      ).rejects.toThrow(/named-timeout-key/)

      r1()
    })

    it("acquire without timeout still blocks indefinitely (no rejection)", async () => {
      const r1 = await queue.acquire("no-timeout-key", 1)
      let resolved = false

      const p2 = queue.acquire("no-timeout-key", 1).then((rel) => {
        resolved = true
        rel()
      })

      // After a brief wait, p2 should still be pending
      await new Promise((resolve) => setTimeout(resolve, 30))
      expect(resolved).toBe(false)

      // Release should unblock
      r1()
      await p2
      expect(resolved).toBe(true)
    })

    it("queued acquire succeeds when slot freed before timeout", async () => {
      const r1 = await queue.acquire("race-key", 1)

      // Start a second acquire with generous timeout
      const p2 = queue.acquire("race-key", 1, 500)

      // Release first slot quickly
      r1()

      // Second acquire should succeed (not timeout)
      const r2 = await p2
      r2()
    })

    it("removes the actual pending resolver after timeout and avoids stale release dispatch", async () => {
      const release = await queue.acquire("stale-timeout-key", 1)

      await expect(queue.acquire("stale-timeout-key", 1, 10)).rejects.toThrow(/timed out/)
      expect(queue.snapshot("stale-timeout-key")).toMatchObject({ active: 1, pending: 0 })

      release()
      expect(queue.snapshot("stale-timeout-key")).toMatchObject({ active: 0, pending: 0 })

      const nextRelease = await queue.acquire("stale-timeout-key", 1, 10)
      expect(typeof nextRelease).toBe("function")
      nextRelease()
    })
  })

  describe("edge cases", () => {
    it("release is idempotent — calling twice does not throw", async () => {
      const release = await queue.acquire("idempotent-key")
      expect(() => {
        release()
        release()
      }).not.toThrow()
    })

    it("acquire with empty string key works", async () => {
      const release = await queue.acquire("")
      expect(typeof release).toBe("function")
      release()
    })

    it("dequeue returns undefined when the task queue is empty", () => {
      expect(queue.dequeue("empty-key")).toBeUndefined()
      expect(queue.peek("empty-key")).toBeUndefined()
      expect(queue.queueSize("empty-key")).toBe(0)
    })

    it("dequeues queued tasks in FIFO order within the same priority", () => {
      queue.enqueue({
        id: "task-1",
        key: "fifo-key",
        createdAt: 1,
        priority: "normal",
      })
      queue.enqueue({
        id: "task-2",
        key: "fifo-key",
        createdAt: 2,
        priority: "normal",
      })

      expect(queue.queueSize("fifo-key")).toBe(2)
      expect(queue.peek("fifo-key")?.id).toBe("task-1")
      expect(queue.dequeue("fifo-key")?.id).toBe("task-1")
      expect(queue.dequeue("fifo-key")?.id).toBe("task-2")
      expect(queue.queueSize("fifo-key")).toBe(0)
    })

    it("dequeues high-priority tasks before normal-priority tasks", () => {
      queue.enqueue({
        id: "normal-1",
        key: "priority-key",
        createdAt: 1,
        priority: "normal",
      })
      queue.enqueue({
        id: "high-1",
        key: "priority-key",
        createdAt: 2,
        priority: "high",
      })
      queue.enqueue({
        id: "normal-2",
        key: "priority-key",
        createdAt: 3,
        priority: "normal",
      })
      queue.enqueue({
        id: "high-2",
        key: "priority-key",
        createdAt: 4,
        priority: "high",
      })

      expect(queue.peek("priority-key")?.id).toBe("high-1")
      expect(queue.dequeue("priority-key")?.id).toBe("high-1")
      expect(queue.dequeue("priority-key")?.id).toBe("high-2")
      expect(queue.dequeue("priority-key")?.id).toBe("normal-1")
      expect(queue.dequeue("priority-key")?.id).toBe("normal-2")
      expect(queue.dequeue("priority-key")).toBeUndefined()
    })
  })
})

describe("buildDelegationQueueKey", () => {
  it("prefers provider+model lanes over all fallback dimensions", () => {
    expect(
      buildDelegationQueueKey({
        provider: "openai",
        model: "gpt-5.4",
        agent: "builder",
        category: "implementation",
      }),
    ).toBe("provider:openai:model:gpt-5.4")
  })

  it("preserves the model-only fallback lane", () => {
    expect(
      buildDelegationQueueKey({
        model: "gpt-5.4",
        agent: "builder",
        category: "implementation",
      }),
    ).toBe("model:gpt-5.4")
  })

  it("ignores removed category fallback when an agent lane is available", () => {
    expect(
      buildDelegationQueueKey({
        agent: "builder",
        category: "implementation",
      }),
    ).toBe("agent:builder")
  })

  it("preserves the agent-only fallback lane", () => {
    expect(buildDelegationQueueKey({ agent: "builder" })).toBe("agent:builder")
  })

  it("falls back to default when only a removed category dimension is provided", () => {
    expect(buildDelegationQueueKey({ category: "implementation" })).toBe("default")
  })

  it("falls back to default when no routing dimensions are provided", () => {
    expect(buildDelegationQueueKey({})).toBe("default")
  })

  it("normalizes provider and model values before building the key", () => {
    expect(
      buildDelegationQueueKey({
        provider: " OpenAI ",
        model: " GPT-5.4 ",
      }),
    ).toBe("provider:openai:model:gpt-5.4")
  })
})

// ---------------------------------------------------------------------------
// SpawnReservation
// ---------------------------------------------------------------------------

describe("SpawnReservation", () => {
  let mgr: TaskStateManager

  beforeEach(() => {
    mgr = new TaskStateManager()
  })

  it("reserveSubagentSpawn creates a reservation object with correct shape", () => {
    const before = Date.now()
    const reservation = reserveSubagentSpawn("parent-1", "root-1", mgr)
    const after = Date.now()

    expect(reservation.parentID).toBe("parent-1")
    expect(reservation.rootID).toBe("root-1")
    expect(typeof reservation.reservedAt).toBe("number")
    expect(reservation.reservedAt).toBeGreaterThanOrEqual(before)
    expect(reservation.reservedAt).toBeLessThanOrEqual(after)
    expect(typeof reservation.release).toBe("function")
    expect(typeof reservation.rollback).toBe("function")

    // Clean up
    reservation.release()
  })

  it("reservation.release() is idempotent — calling twice does not throw", () => {
    const reservation = reserveSubagentSpawn("parent-idem", "root-idem", mgr)
    expect(() => {
      reservation.release()
      reservation.release()
    }).not.toThrow()
  })

  it("reservation.rollback() restores budget", () => {
    // Reserve a slot
    reserveSubagentSpawn("parent-rb", "root-rb", mgr)

    // After the first reservation the budget shows reserved=1
    expect(mgr.getRootBudget("root-rb")?.reserved).toBe(1)

    // Reserve a second slot and immediately roll it back
    const reservation = reserveSubagentSpawn("parent-rb", "root-rb", mgr)
    expect(mgr.getRootBudget("root-rb")?.reserved).toBe(2)

    reservation.rollback()

    // Back to 1 reserved after rollback
    expect(mgr.getRootBudget("root-rb")?.reserved).toBe(1)
  })

  it("rollback after release is a no-op", () => {
    const reservation = reserveSubagentSpawn("parent-rnoop", "root-rnoop", mgr)
    reservation.release()

    // Calling rollback after release should not throw and should not change budget
    // The reservation was already settled by release, so reserved stays at 1
    // (release does NOT roll back; only rollback does)
    const budgetAfterRelease = mgr.getRootBudget("root-rnoop")?.reserved ?? 0

    expect(() => reservation.rollback()).not.toThrow()

    // Budget must not change further
    expect(mgr.getRootBudget("root-rnoop")?.reserved ?? 0).toBe(budgetAfterRelease)
  })

  it("release after rollback is a no-op", () => {
    const reservation = reserveSubagentSpawn("parent-rnoop2", "root-rnoop2", mgr)
    reservation.rollback()

    const budgetAfterRollback = mgr.getRootBudget("root-rnoop2")?.reserved ?? 0

    expect(() => reservation.release()).not.toThrow()

    expect(mgr.getRootBudget("root-rnoop2")?.reserved ?? 0).toBe(budgetAfterRollback)
  })

  it("exceeding MAX_DESCENDANTS_PER_ROOT throws a [Harness] error", () => {
    // Fill up to the limit
    const reservations: ReturnType<typeof reserveSubagentSpawn>[] = []
    for (let i = 0; i < MAX_DESCENDANTS_PER_ROOT; i++) {
      reservations.push(reserveSubagentSpawn(`parent-${i}`, "root-limit", mgr))
    }

    // The next one must throw with [Harness] prefix
    expect(() =>
      reserveSubagentSpawn("parent-over", "root-limit", mgr)
    ).toThrow(/^\[Harness\]/)

    // Clean up
    for (const r of reservations) r.release()
  })

  it("multiple reservations against the same root accumulate correctly", () => {
    const r1 = reserveSubagentSpawn("p1", "shared-root", mgr)
    const r2 = reserveSubagentSpawn("p2", "shared-root", mgr)
    const r3 = reserveSubagentSpawn("p3", "shared-root", mgr)

    expect(mgr.getRootBudget("shared-root")?.reserved).toBe(3)

    r1.rollback()
    expect(mgr.getRootBudget("shared-root")?.reserved).toBe(2)

    r2.release()
    r3.release()
    // release() does NOT decrement reserved — it marks the slot consumed
    expect(mgr.getRootBudget("shared-root")?.reserved).toBe(2)
  })

  it("reservation tracks parentID and rootID independently", () => {
    const r1 = reserveSubagentSpawn("parent-A", "root-X", mgr)
    const r2 = reserveSubagentSpawn("parent-B", "root-Y", mgr)

    expect(r1.parentID).toBe("parent-A")
    expect(r1.rootID).toBe("root-X")
    expect(r2.parentID).toBe("parent-B")
    expect(r2.rootID).toBe("root-Y")

    r1.release()
    r2.release()
  })

  it("reservation records a timestamp at creation time", () => {
    const before = Date.now()
    const r = reserveSubagentSpawn("p-ts", "root-ts", mgr)
    const after = Date.now()

    expect(r.reservedAt).toBeGreaterThanOrEqual(before)
    expect(r.reservedAt).toBeLessThanOrEqual(after)

    r.release()
  })

  it("custom maxDescendants overrides MAX_DESCENDANTS_PER_ROOT", () => {
    // With a custom limit of 2, the third call must throw
    reserveSubagentSpawn("p1", "root-custom", mgr, 2)
    reserveSubagentSpawn("p2", "root-custom", mgr, 2)

    expect(() =>
      reserveSubagentSpawn("p3", "root-custom", mgr, 2)
    ).toThrow(/^\[Harness\]/)
  })
})
