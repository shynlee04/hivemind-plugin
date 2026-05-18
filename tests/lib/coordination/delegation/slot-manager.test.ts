import { SlotManager } from "../../../../src/coordination/delegation/slot-manager.js"

describe("SlotManager", () => {
  it("rejects the 11th concurrent delegation for one session", async () => {
    const manager = new SlotManager({ maxSlotsPerSession: 10, perKeyLimit: 10 })

    const handles = await Promise.all(Array.from({ length: 10 }, (_, index) => (
      manager.acquire("session-1", `queue-${index}`)
    )))

    await expect(manager.acquire("session-1", "queue-11")).rejects.toThrow("[Harness] Delegation slot limit reached for session session-1")
    for (const handle of handles) manager.release(handle)
  })

  it("enforces a per-key limit of 2 active delegations", async () => {
    const manager = new SlotManager({ maxSlotsPerSession: 10, perKeyLimit: 2 })
    const first = await manager.acquire("session-1", "agent:builder")
    const second = await manager.acquire("session-1", "agent:builder")

    await expect(manager.acquire("session-1", "agent:builder")).rejects.toThrow("[Harness] Per-key delegation slot limit reached for session session-1 and queue agent:builder")

    manager.release(first)
    manager.release(second)
  })

  it("reports acquire timeout when the underlying queue cannot grant a slot", async () => {
    const manager = new SlotManager({
      acquireTimeoutMs: 10,
      maxSlotsPerSession: 10,
      perKeyLimit: 3,
      queueLimit: 1,
    })
    const first = await manager.acquire("session-1", "agent:slow")

    await expect(manager.acquire("session-1", "agent:slow")).rejects.toThrow("[Harness] Delegation slot acquire timed out for session session-1 and queue agent:slow")

    manager.release(first)
  })

  it("returns slot info with session totals and per-key usage", async () => {
    const manager = new SlotManager({ maxSlotsPerSession: 10, perKeyLimit: 2 })
    const first = await manager.acquire("session-1", "agent:builder")
    const second = await manager.acquire("session-1", "agent:reviewer")

    const info = manager.getSlotInfo("session-1")

    expect(info.acquired).toBe(2)
    expect(info.maxSlots).toBe(10)
    expect(info.perKeyUsage.get("agent:builder")).toBe(1)
    expect(info.perKeyUsage.get("agent:reviewer")).toBe(1)

    manager.release(first)
    manager.release(second)
  })
})
