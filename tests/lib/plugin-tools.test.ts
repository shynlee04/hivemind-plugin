/**
 * Tests for domain-grouped plugin tool registration.
 *
 * REQ-C6-03: Verifies registerXxxTools functions return correct tool sets.
 */
import { describe, it, expect, vi } from "vitest"

import {
  registerDelegationTools,
  registerSessionTools,
  registerHivemindTools,
  registerConfigTools,
} from "../../src/plugin.js"

describe("Domain-grouped plugin tool registration", () => {
  const mockDelegationDeps = {
    delegationManager: {} as any,
    hivemindConfig: {} as any,
    ptyManager: undefined,
    client: { app: { log: vi.fn() } } as any,
    monitor: { getEscalationLevel: vi.fn() },
    projectDirectory: "/tmp/test",
  }

  const mockSessionDeps = {
    client: { app: { log: vi.fn() } } as any,
    sessionTracker: {} as any,
    projectDirectory: "/tmp/test",
  }

  const mockHivemindDeps = {
    projectDirectory: "/tmp/test",
  }

  const mockConfigDeps = {
    projectDirectory: "/tmp/test",
  }

  describe("registerDelegationTools", () => {
    it("should return delegate-task, delegation-status, run-background-command", () => {
      const tools = registerDelegationTools(mockDelegationDeps)
      const keys = Object.keys(tools)
      expect(keys).toContain("delegate-task")
      expect(keys).toContain("delegation-status")
      expect(keys).toContain("run-background-command")
      expect(keys.length).toBe(3)
    })
  })

  describe("registerSessionTools", () => {
    it("should return 7 session tools including governance", () => {
      const tools = registerSessionTools(mockSessionDeps)
      const keys = Object.keys(tools)
      expect(keys).toContain("execute-slash-command")
      expect(keys).toContain("session-patch")
      expect(keys).toContain("session-journal-export")
      expect(keys).toContain("session-tracker")
      expect(keys).toContain("session-hierarchy")
      expect(keys).toContain("session-context")
      expect(keys).toContain("create-governance-session")
      expect(keys.length).toBe(7)
    })
  })

  describe("registerHivemindTools", () => {
    it("should return 8 hivemind tools", () => {
      const tools = registerHivemindTools(mockHivemindDeps)
      const keys = Object.keys(tools)
      expect(keys).toContain("hivemind-doc")
      expect(keys).toContain("hivemind-trajectory")
      expect(keys).toContain("hivemind-pressure")
      expect(keys).toContain("hivemind-sdk-supervisor")
      expect(keys).toContain("hivemind-command-engine")
      expect(keys).toContain("hivemind-session-view")
      expect(keys).toContain("hivemind-agent-work-create")
      expect(keys).toContain("hivemind-agent-work-export")
      expect(keys.length).toBe(8)
    })
  })

  describe("registerConfigTools", () => {
    it("should return config + prompt tools", () => {
      const tools = registerConfigTools(mockConfigDeps)
      const keys = Object.keys(tools)
      expect(keys).toContain("configure-primitive")
      expect(keys).toContain("validate-restart")
      expect(keys).toContain("bootstrap-init")
      expect(keys).toContain("bootstrap-recover")
      expect(keys).toContain("prompt-skim")
      expect(keys).toContain("prompt-analyze")
      expect(keys.length).toBe(6)
    })
  })

  describe("All tools registered", () => {
    it("should have exactly 24 tools when all domain functions are merged", () => {
      const delegation = registerDelegationTools(mockDelegationDeps)
      const session = registerSessionTools(mockSessionDeps)
      const hivemind = registerHivemindTools(mockHivemindDeps)
      const config = registerConfigTools(mockConfigDeps)
      const all = { ...delegation, ...session, ...hivemind, ...config }
      expect(Object.keys(all).length).toBe(24)
    })
  })
})
