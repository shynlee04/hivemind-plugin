import { describe, it, expect } from "vitest"
import {
  ChainExecutor,
  createChainExecutionContext,
  type ChainEvent,
  type ChainExecutionContext,
} from "../../../src/lib/work-contract/chain-executor.js"
import { createContract } from "../../../src/lib/work-contract/agent-work-contract.js"

describe("chain-executor", () => {
  it("emits started event when executing a single contract", async () => {
    const executor = new ChainExecutor()
    const events: ChainEvent[] = []
    executor.on("contract.started", (e: ChainEvent) => { events.push(e) })

    const contract = createContract({
      ownerAgent: "builder",
      taskBoundary: "Task A",
      minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
    })

    await executor.executeChain([contract])
    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events[0].type).toBe("contract.started")
    expect(events[0].contractId).toBe(contract.id)
  })

  it("emits completed event after chain finishes", async () => {
    const executor = new ChainExecutor()
    const events: ChainEvent[] = []
    executor.on("chain.completed", (e: ChainEvent) => { events.push(e) })

    const contract = createContract({
      ownerAgent: "builder",
      taskBoundary: "Task B",
      minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
    })

    await executor.executeChain([contract])
    expect(events.length).toBe(1)
    expect(events[0].type).toBe("chain.completed")
  })

  it("executes multiple contracts in sequence", async () => {
    const executor = new ChainExecutor()
    const completed: string[] = []
    executor.on("contract.completed", (e: ChainEvent) => { completed.push(e.contractId) })

    const c1 = createContract({ ownerAgent: "a", taskBoundary: "T1", minimumEvidenceLevel: "L5_DOCUMENTATION" })
    const c2 = createContract({ ownerAgent: "b", taskBoundary: "T2", minimumEvidenceLevel: "L5_DOCUMENTATION" })

    await executor.executeChain([c1, c2])
    expect(completed).toHaveLength(2)
  })

  it("passes execution context to events", async () => {
    const executor = new ChainExecutor()
    const ctx = createChainExecutionContext("session-1")
    let capturedCtx: ChainExecutionContext | null = null
    executor.on("chain.completed", (_e: ChainEvent, context: ChainExecutionContext) => {
      capturedCtx = context
    })

    const contract = createContract({
      ownerAgent: "builder",
      taskBoundary: "Task C",
      minimumEvidenceLevel: "L4_IMPLEMENTATION_TRACE",
    })

    await executor.executeChain([contract], ctx)
    expect(capturedCtx).not.toBeNull()
    expect(capturedCtx!.sessionId).toBe("session-1")
    expect(capturedCtx!.executedCount).toBe(1)
  })
})
