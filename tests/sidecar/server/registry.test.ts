import { describe, it, expect, beforeEach } from "vitest"

import { SidecarDependencyRegistry } from "../../../src/sidecar/server/registry.js"
import type { DelegationManager } from "../../../src/coordination/delegation/manager.js"
import type { SessionTracker } from "../../../src/features/session-tracker/index.js"
import type { OpenCodeClient } from "../../../src/shared/session-api.js"
import type { TrajectoryLedger } from "../../../src/task-management/trajectory/ledger.js"

describe("SidecarDependencyRegistry", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    registry = new SidecarDependencyRegistry()
  })

  describe("isReady()", () => {
    it("returns false before any bindings", () => {
      expect(registry.isReady()).toBe(false)
    })

    it("returns false with only 2 of 3 core deps bound", () => {
      registry.setSessionTracker({} as unknown as SessionTracker)
      registry.setClient({} as unknown as OpenCodeClient)
      expect(registry.isReady()).toBe(false)
    })

    it("returns true after all 3 core deps bound (delegationManager + sessionTracker + client)", () => {
      registry.setDelegationManager({} as unknown as DelegationManager)
      registry.setSessionTracker({} as unknown as SessionTracker)
      registry.setClient({} as unknown as OpenCodeClient)
      expect(registry.isReady()).toBe(true)
    })
  })

  describe("unbound getters", () => {
    it("throws [Hivemind] error when accessing delegationManager before binding", () => {
      expect(() => registry.delegationManager).toThrow(/\[Harness\]/)
    })

    it("throws [Hivemind] error when accessing sessionTracker before binding", () => {
      expect(() => registry.sessionTracker).toThrow(/\[Harness\]/)
    })

    it("throws [Hivemind] error when accessing client before binding", () => {
      expect(() => registry.client).toThrow(/\[Harness\]/)
    })

    it("throws [Hivemind] error when accessing trajectory before binding", () => {
      expect(() => registry.trajectory).toThrow(/\[Harness\]/)
    })
  })

  describe("bound getters", () => {
    it("returns the bound value for delegationManager after setDelegationManager", () => {
      const mock = {} as unknown as DelegationManager
      registry.setDelegationManager(mock)
      expect(registry.delegationManager).toBe(mock)
    })

    it("returns the bound value for sessionTracker after setSessionTracker", () => {
      const mock = {} as unknown as SessionTracker
      registry.setSessionTracker(mock)
      expect(registry.sessionTracker).toBe(mock)
    })

    it("returns the bound value for client after setClient", () => {
      const mock = {} as unknown as OpenCodeClient
      registry.setClient(mock)
      expect(registry.client).toBe(mock)
    })

    it("returns the bound value for trajectory after setTrajectory", () => {
      const mock = {} as unknown as TrajectoryLedger
      registry.setTrajectory(mock)
      expect(registry.trajectory).toBe(mock)
    })
  })

  describe("setter methods", () => {
    it("setDelegationManager returns void", () => {
      const result = registry.setDelegationManager({} as unknown as DelegationManager)
      expect(result).toBeUndefined()
    })

    it("setSessionTracker returns void", () => {
      const result = registry.setSessionTracker({} as unknown as SessionTracker)
      expect(result).toBeUndefined()
    })

    it("setClient returns void", () => {
      const result = registry.setClient({} as unknown as OpenCodeClient)
      expect(result).toBeUndefined()
    })

    it("setTrajectory returns void", () => {
      const result = registry.setTrajectory({} as unknown as TrajectoryLedger)
      expect(result).toBeUndefined()
    })

    it("setPressure returns void", () => {
      const result = registry.setPressure({})
      expect(result).toBeUndefined()
    })

    it("setConfigSubscriber returns void", () => {
      const result = registry.setConfigSubscriber({})
      expect(result).toBeUndefined()
    })

    it("all 6 setters exist", () => {
      expect(typeof registry.setDelegationManager).toBe("function")
      expect(typeof registry.setSessionTracker).toBe("function")
      expect(typeof registry.setClient).toBe("function")
      expect(typeof registry.setTrajectory).toBe("function")
      expect(typeof registry.setPressure).toBe("function")
      expect(typeof registry.setConfigSubscriber).toBe("function")
    })
  })
})
