import { vi } from "vitest"
import { DelegationMonitor } from "../../../../src/coordination/delegation/monitor.js"
import type { Delegation } from "../../../../src/coordination/delegation/types.js"

describe("DelegationMonitor", () => {
  describe("countActions", () => {
    it("returns zero counters when no delegation record exists", async () => {
      const monitor = new DelegationMonitor({
        getStatus: () => "running",
        getDelegationRecord: () => undefined,
        inject: () => {},
      })

      const counters = await monitor.countActions("dt-nonexistent")
      expect(counters).toEqual({ toolCalls: 0, bashCommands: 0, skillLoads: 0, fileChanges: 0, totalActions: 0 })
    })

    it("calculates counters from message delta", async () => {
      const mockRecord: Delegation = {
        agent: "gsd-executor",
        childSessionId: "child-1",
        createdAt: 1,
        executionMode: "sdk",
        id: "dt-1",
        lastMessageCount: 10,
        nestingDepth: 1,
        parentSessionId: "parent-1",
        queueKey: "agent:gsd-executor",
        stablePollCount: 0,
        status: "running",
        workingDirectory: process.cwd(),
      }

      const monitor = new DelegationMonitor({
        getStatus: () => "running",
        getDelegationRecord: (id: string) => id === "dt-1" ? mockRecord : undefined,
        inject: () => {},
      })

      monitor.start("dt-1", "parent-1")
      const counters = await monitor.countActions("dt-1")

      expect(counters.toolCalls).toBeGreaterThanOrEqual(0)
      expect(counters.bashCommands).toBeGreaterThanOrEqual(0)
      expect(counters.skillLoads).toBeGreaterThanOrEqual(0)
      expect(counters.fileChanges).toBeGreaterThanOrEqual(0)
      expect(counters.totalActions).toBe(counters.toolCalls + counters.bashCommands + counters.skillLoads + counters.fileChanges)

      monitor.stop("dt-1")
    })

    it("tracks previous counters for delta comparison", async () => {
      const mockRecord: Delegation = {
        agent: "gsd-executor",
        childSessionId: "child-1",
        createdAt: 1,
        executionMode: "sdk",
        id: "dt-1",
        lastMessageCount: 5,
        nestingDepth: 1,
        parentSessionId: "parent-1",
        queueKey: "agent:gsd-executor",
        stablePollCount: 0,
        status: "running",
        workingDirectory: process.cwd(),
      }

      const monitor = new DelegationMonitor({
        getStatus: () => "running",
        getDelegationRecord: () => mockRecord,
        inject: () => {},
      })

      monitor.start("dt-1", "parent-1")
      const first = await monitor.countActions("dt-1")
      const second = await monitor.countActions("dt-1")

      expect(second.toolCalls).toBe(first.toolCalls)
      monitor.stop("dt-1")
    })
  })

  describe("updateStatusCounters", () => {
    it("injects status line with counters", () => {
      const injected: string[] = []
      const mockRecord: Delegation = {
        agent: "gsd-executor",
        childSessionId: "child-1",
        createdAt: 1,
        executionMode: "sdk",
        id: "dt-1",
        lastMessageCount: 10,
        nestingDepth: 1,
        parentSessionId: "parent-1",
        queueKey: "agent:gsd-executor",
        stablePollCount: 0,
        status: "running",
        workingDirectory: process.cwd(),
      }

      const monitor = new DelegationMonitor({
        getStatus: () => "running",
        getDelegationRecord: () => mockRecord,
        inject: (_sessionId: string, line: string) => { injected.push(line) },
      })

      monitor.start("dt-1", "parent-1")
      monitor.updateStatusCounters("dt-1", "parent-1", 30)

      expect(injected.length).toBe(1)
      expect(injected[0]).toContain("[DT:dt-1]")
      expect(injected[0]).toContain("status=running")
      expect(injected[0]).toContain("elapsed=30s")
      expect(injected[0]).toMatch(/tools:\d+ bash:\d+ skills:\d+ files:\d+/)

      monitor.stop("dt-1")
    })

    it("does not inject for terminal status", () => {
      const injected: string[] = []
      const monitor = new DelegationMonitor({
        getStatus: () => "completed",
        inject: (_sessionId: string, line: string) => { injected.push(line) },
      })

      monitor.start("dt-1", "parent-1")
      monitor.updateStatusCounters("dt-1", "parent-1", 60)

      expect(injected).toHaveLength(0)
      monitor.stop("dt-1")
    })
  })
})
