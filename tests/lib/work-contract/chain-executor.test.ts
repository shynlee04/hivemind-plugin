import { describe, it, expect } from "vitest"
import {
  ChainExecutor,
  createChainExecutionContext,
  type ChainEvent,
  type ChainExecutionContext,
  type ContractExecutorFn,
} from "../../../src/lib/work-contract/chain-executor.js"
import { createContract } from "../../../src/lib/work-contract/agent-work-contract.js"

function makeContract(agent: string, task: string) {
  return createContract({
    ownerAgent: agent,
    taskBoundary: task,
    minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
  })
}

describe("chain-executor", () => {
  describe("event emission", () => {
    it("emits started and completed events for a single contract", async () => {
      const executor = new ChainExecutor()
      const events: ChainEvent[] = []
      executor.on("contract.started", (e: ChainEvent) => { events.push(e) })
      executor.on("contract.completed", (e: ChainEvent) => { events.push(e) })

      const contract = makeContract("builder", "Task A")
      await executor.executeChain([contract])

      expect(events).toHaveLength(2)
      expect(events[0].type).toBe("contract.started")
      expect(events[0].contractId).toBe(contract.id)
      expect(events[1].type).toBe("contract.completed")
      expect(events[1].contractId).toBe(contract.id)
    })

    it("emits chain.completed when all contracts succeed", async () => {
      const executor = new ChainExecutor()
      const events: ChainEvent[] = []
      executor.on("chain.completed", (e: ChainEvent) => { events.push(e) })

      await executor.executeChain([makeContract("a", "T1")])

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe("chain.completed")
    })
  })

  describe("actual execution via ContractExecutorFn", () => {
    it("calls the executor function for each contract", async () => {
      const called: string[] = []
      const fn: ContractExecutorFn = async (contract, _ctx) => {
        called.push(contract.id)
        return { success: true }
      }
      const executor = new ChainExecutor(fn)
      const c1 = makeContract("a", "T1")
      const c2 = makeContract("b", "T2")

      const ctx = await executor.executeChain([c1, c2])

      expect(called).toEqual([c1.id, c2.id])
      expect(ctx.executedCount).toBe(2)
      expect(ctx.failedCount).toBe(0)
    })

    it("handles executor that returns failure", async () => {
      const fn: ContractExecutorFn = async (_contract, _ctx) => ({
        success: false,
        detail: "execution rejected",
      })
      const executor = new ChainExecutor(fn)

      const failed: ChainEvent[] = []
      executor.on("contract.failed", (e: ChainEvent) => { failed.push(e) })

      const ctx = await executor.executeChain([makeContract("a", "T1")])

      expect(ctx.executedCount).toBe(0)
      expect(ctx.failedCount).toBe(1)
      expect(failed).toHaveLength(1)
      expect(failed[0].detail).toBe("execution rejected")
    })

    it("handles executor that throws an error", async () => {
      const fn: ContractExecutorFn = async () => {
        throw new Error("boom")
      }
      const executor = new ChainExecutor(fn)

      const failed: ChainEvent[] = []
      executor.on("contract.failed", (e: ChainEvent) => { failed.push(e) })

      const ctx = await executor.executeChain([makeContract("a", "T1")])

      expect(ctx.failedCount).toBe(1)
      expect(failed).toHaveLength(1)
      expect(failed[0].detail).toBe("boom")
    })

    it("emits chain.failed when any contract fails", async () => {
      const fn: ContractExecutorFn = async () => ({ success: false, detail: "nope" })
      const executor = new ChainExecutor(fn)

      const chainEvents: ChainEvent[] = []
      executor.on("chain.failed", (e: ChainEvent) => { chainEvents.push(e) })

      await executor.executeChain([makeContract("a", "T1")])

      expect(chainEvents).toHaveLength(1)
      expect(chainEvents[0].type).toBe("chain.failed")
    })
  })

  describe("default executor (no ContractExecutorFn provided)", () => {
    it("succeeds for a contract with no runtimeStatus", async () => {
      const executor = new ChainExecutor()
      const contract = makeContract("a", "T1")
      // contract has no runtimeStatus set by default

      const ctx = await executor.executeChain([contract])

      expect(ctx.executedCount).toBe(1)
      expect(ctx.failedCount).toBe(0)
    })

    it("fails for a cancelled contract", async () => {
      const executor = new ChainExecutor()
      const contract: ReturnType<typeof makeContract> = {
        ...makeContract("a", "T1"),
        runtimeStatus: "cancelled",
      }

      const ctx = await executor.executeChain([contract])

      expect(ctx.executedCount).toBe(0)
      expect(ctx.failedCount).toBe(1)
    })

    it("fails for a paused contract", async () => {
      const executor = new ChainExecutor()
      const contract: ReturnType<typeof makeContract> = {
        ...makeContract("a", "T1"),
        runtimeStatus: "paused",
      }

      const ctx = await executor.executeChain([contract])

      expect(ctx.executedCount).toBe(0)
      expect(ctx.failedCount).toBe(1)
    })
  })

  describe("context propagation", () => {
    it("passes execution context to event handlers", async () => {
      const executor = new ChainExecutor()
      const ctx = createChainExecutionContext("session-1")
      let capturedCtx: ChainExecutionContext | null = null
      executor.on("chain.completed", (_e: ChainEvent, context: ChainExecutionContext) => {
        capturedCtx = context
      })

      await executor.executeChain([makeContract("builder", "Task C")], ctx)

      expect(capturedCtx).not.toBeNull()
      expect(capturedCtx!.sessionId).toBe("session-1")
      expect(capturedCtx!.executedCount).toBe(1)
    })

    it("creates a default context when none is provided", async () => {
      const executor = new ChainExecutor()
      let capturedCtx: ChainExecutionContext | null = null
      executor.on("chain.completed", (_e: ChainEvent, context: ChainExecutionContext) => {
        capturedCtx = context
      })

      await executor.executeChain([makeContract("a", "T1")])

      expect(capturedCtx).not.toBeNull()
      expect(capturedCtx!.sessionId).toBe("default")
    })
  })

  describe("mixed success and failure in sequence", () => {
    it("tracks both successes and failures across multiple contracts", async () => {
      let callCount = 0
      const fn: ContractExecutorFn = async () => {
        callCount++
        return callCount === 2
          ? { success: false, detail: "second fails" }
          : { success: true }
      }
      const executor = new ChainExecutor(fn)

      const ctx = await executor.executeChain([
        makeContract("a", "T1"),
        makeContract("b", "T2"),
        makeContract("c", "T3"),
      ])

      expect(ctx.executedCount).toBe(2)
      expect(ctx.failedCount).toBe(1)
      expect(callCount).toBe(3)
    })
  })
})
