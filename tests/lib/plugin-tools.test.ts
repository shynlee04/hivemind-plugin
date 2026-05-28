/**
 * Tests for domain-grouped plugin tool registration.
 *
 * REQ-C6-03: Verifies registerXxxTools functions return correct tool sets.
 */
import { describe, it, expect, vi } from "vitest"

// These imports will FAIL until Wave 2 implementation
import {
  registerDelegationTools,
  registerSessionTools,
  registerHivemindTools,
  registerConfigTools,
} from "../../../src/plugin.js"

describe("Domain-grouped plugin tool registration", () => {
  const mockDeps = {
    client: {} as any,
    delegationManager: {} as any,
    lifecycleManager: {} as any,
    stateManager: {} as any,
    sessionTracker: {} as any,
    projectDirectory: "/tmp/test",
    ptyManager: undefined,
    hivemindConfig: {} as any,
    monitor: {} as any,
    coordinatorRef: { current: undefined },
  }

  describe("registerDelegationTools", () => {
    it("should return delegate-task, delegation-status, run-background-command", () => {
      const tools = registerDelegationTools(mockDeps)
      expect(Object.keys(tools)).toContain("delegate-task")
      expect(Object.keys(tools)).toContain("delegation-status")
      expect(Object.keys(tools)).toContain("run-background-command")
      expect(Object.keys(tools).length).toBe(3)
    })
  })

  describe("registerSessionTools", () => {
    it("should return 7 session tools including governance", () => {
      const tools = registerSessionTools(mockDeps)
      expect(Object.keys(tools)).toContain("execute-slash-command")
      expect(Object.keys(tools)).toContain("session-patch")
      expect(Object.keys(tools)).toContain("session-journal-export")
      expect(Object.keys(tools)).toContain("session-tracker")
      expect(Object.keys(tools)).toContain("session-hierarchy")
      expect(Object.keys(tools)).toContain("session-context")
      expect(Object.keys(tools)).toContain("create-governance-session")
      expect(Object.keys(tools).length).toBe(7)
    })
  })

  describe("registerHivemindTools", () => {
    it("should return 8 hivemind tools", () => {
      const tools = registerHivemindTools(mockDeps)
      expect(Object.keys(tools)).toContain("hivemind-doc")
      expect(Object.keys(tools)).toContain("hivemind-trajectory")
      expect(Object.keys(tools)).toContain("hivemind-pressure")
      expect(Object.keys(tools)).toContain("hivemind-sdk-supervisor")
      expect(Object.keys(tools)).toContain("hivemind-command-engine")
      expect(Object.keys(tools)).toContain("hivemind-session-view")
      expect(Object.keys(tools)).toContain("hivemind-agent-work-create")
      expect(Object.keys(tools)).toContain("hivemind-agent-work-export")
      expect(Object.keys(tools).length).toBe(8)
    })
  })

  describe("registerConfigTools", () => {
    it("should return config + prompt tools", () => {
      const tools = registerConfigTools(mockDeps)
      expect(Object.keys(tools)).toContain("configure-primitive")
      expect(Object.keys(tools)).toContain("validate-restart")
      expect(Object.keys(tools)).toContain("bootstrap-init")
      expect(Object.keys(tools)).toContain("bootstrap-recover")
      expect(Object.keys(tools)).toContain("prompt-skim")
      expect(Object.keys(tools)).toContain("prompt-analyze")
      expect(Object.keys(tools).length).toBe(6)
    })
  })

  describe("All 23 tools registered", () => {
    it("should have exactly 23 tools when all domain functions are merged", () => {
      const delegation = registerDelegationTools(mockDeps)
      const session = registerSessionTools(mockDeps)
      const hivemind = registerHivemindTools(mockDeps)
      const config = registerConfigTools(mockDeps)
      const all = { ...delegation, ...session, ...hivemind, ...config }
      expect(Object.keys(all).length).toBe(23)
    })
  })
})
