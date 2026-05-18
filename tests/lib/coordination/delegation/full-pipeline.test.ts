import { vi } from "vitest"

import { CompletionDetector } from "../../../../src/coordination/completion/detector.js"
import { AgentResolver } from "../../../../src/coordination/delegation/agent-resolver.js"
import { DelegationCoordinator } from "../../../../src/coordination/delegation/coordinator.js"
import { DelegationDispatcher } from "../../../../src/coordination/delegation/dispatcher.js"
import { DelegationLifecycle } from "../../../../src/coordination/delegation/lifecycle.js"
import { DelegationMonitor } from "../../../../src/coordination/delegation/monitor.js"
import { NotificationRouter } from "../../../../src/coordination/delegation/notification-router.js"
import { DelegationRetryHandler } from "../../../../src/coordination/delegation/retry-handler.js"
import { SlotManager } from "../../../../src/coordination/delegation/slot-manager.js"
import type { Delegation, DelegationStatus } from "../../../../src/coordination/delegation/types.js"
import { ESCALATION_THRESHOLDS } from "../../../../src/coordination/delegation/types.js"

function createPipelineHarness() {
  const records = new Map<string, Delegation>()
  const persisted: Delegation[][] = []
  const notifications: unknown[] = []
  const injections: string[] = []
  const lifecycle = new DelegationLifecycle({
    get: (delegationId: string) => records.get(delegationId),
    getAll: () => Array.from(records.values()),
    registerDelegation: (delegation: Delegation) => { records.set(delegation.id, delegation) },
    transition: (delegationId: string, status: DelegationStatus) => {
      const record = records.get(delegationId)
      if (!record) return false
      record.status = status
      return true
    },
    transitionToTerminal: (delegationId: string, status: DelegationStatus, error?: string) => {
      const record = records.get(delegationId)
      if (!record) return
      record.status = status
      record.error = error
      record.completedAt = Date.now()
    },
  })
  const slotManager = new SlotManager({ acquireTimeoutMs: 20 })
  const dispatcher = new DelegationDispatcher({
    agentResolver: { resolve: vi.fn(async (agent: string) => ({ name: agent, tools: { read: true } })) } as Pick<AgentResolver, "resolve">,
    resolveCategoryGateDecision: ({ category }) => category === "deny"
      ? { allowed: false, reason: "denied by test", audit: { gate: "category", askReason: "denied by test" } }
      : { allowed: true, reason: "allowed", audit: { gate: "category" } },
    slotManager,
  })
  const monitor = new DelegationMonitor({ getStatus: (id) => records.get(id)?.status ?? "missing", inject: (_parent, line) => { injections.push(line) }, pollingCadence: [] })
  const notificationRouter = new NotificationRouter()
  const route = vi.spyOn(notificationRouter, "route").mockImplementation((notification) => {
    notifications.push(notification)
    return { notification, parentSessionId: records.get(notification.delegationId)?.parentSessionId ?? "parent" }
  })
  const detector = new CompletionDetector(5)
  const retryHandler = new DelegationRetryHandler({ persist: (delegations) => { persisted.push(delegations) }, wait: async () => undefined })
  const coordinator = new DelegationCoordinator({ dispatcher, monitor, notificationRouter, lifecycle, detector, retryHandler })
  return { coordinator, detector, lifecycle, notifications, persisted, records, route, slotManager }
}

describe("delegation v2 full pipeline", () => {
  it("dispatches, registers lifecycle state, completes via dual signal, routes notification, and releases the slot", async () => {
    const harness = createPipelineHarness()

    const result = await harness.coordinator.dispatch({ agent: "builder", category: "implementation", currentDepth: 0, parentSessionId: "parent-1", prompt: "build", queueKey: "agent:builder", safetyCeilingMs: 300_000, surface: "agent-delegation" })
    harness.detector.signalCompletionEvent(result.delegationId)
    harness.detector.signalTerminalStatus(result.delegationId, "completed")

    expect(harness.lifecycle.getStatus(result.delegationId)?.status).toBe("completed")
    expect(harness.notifications).toHaveLength(1)
    await expect(harness.slotManager.acquire("parent-1", "agent:builder", { acquireTimeoutMs: 20 })).resolves.toMatchObject({ queueKey: "agent:builder" })
    expect(harness.persisted.at(-1)?.[0]?.status).toBe("completed")
  })

  it("blocks category-gate deny before creating lifecycle records", async () => {
    const harness = createPipelineHarness()

    await expect(harness.coordinator.dispatch({ agent: "builder", category: "deny", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })).rejects.toThrow("Category gate denied")

    expect(harness.records.size).toBe(0)
  })

  it("marks timeout through coordinator cleanup", async () => {
    const harness = createPipelineHarness()

    const result = await harness.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })
    harness.coordinator.handleTimeout(result.delegationId)

    expect(harness.lifecycle.getStatus(result.delegationId)?.status).toBe("timeout")
    expect(harness.route).toHaveBeenCalledWith(expect.objectContaining({ delegationId: result.delegationId, type: "timeout" }))
  })

  it("uses the 600s terminal-stalled escalation threshold", () => {
    expect(ESCALATION_THRESHOLDS).toEqual([60, 120, 180, 300, 600])
  })

  it("supports abort lifecycle control on an active delegation", async () => {
    const harness = createPipelineHarness()

    const result = await harness.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-1", queueKey: "agent:builder", surface: "agent-delegation" })
    const abortResult = harness.lifecycle.markAborted(result.delegationId)

    expect(abortResult).toMatchObject({ delegationId: result.delegationId, status: "error" })
    expect(harness.lifecycle.getStatus(result.delegationId)?.error).toContain("aborted")
  })

  it("keeps concurrent delegations isolated by parent notification route", async () => {
    const harness = createPipelineHarness()

    const [first, second] = await Promise.all([
      harness.coordinator.dispatch({ agent: "builder", currentDepth: 0, parentSessionId: "parent-a", queueKey: "agent:builder:a", surface: "agent-delegation" }),
      harness.coordinator.dispatch({ agent: "critic", currentDepth: 0, parentSessionId: "parent-b", queueKey: "agent:critic:b", surface: "agent-delegation" }),
    ])
    harness.detector.signalCompletionEvent(second.delegationId)
    harness.detector.signalTerminalStatus(second.delegationId, "completed")

    expect(harness.lifecycle.getStatus(first.delegationId)?.status).toBe("dispatched")
    expect(harness.lifecycle.getStatus(second.delegationId)?.status).toBe("completed")
  })
})
