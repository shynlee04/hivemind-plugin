import { describe, it, expect } from "vitest"
import os from "node:os"

import {
  registerDelegationTools,
  registerSessionTools,
  registerHivemindTools,
  registerConfigTools,
} from "../../src/plugin.ts"

const tmpdir = os.tmpdir()

function makeMinimalClient() {
  return {
    app: { log: async () => {} },
    session: { prompt: async () => {}, list: async () => [] },
    tool: () => {},
    hook: () => {},
  } as any
}

function makeMockDelegationManager() {
  return {
    canSessionAccessDelegation: () => true,
    getAllDelegations: () => [],
    getStatus: () => undefined,
    dispatch: async () => ({}),
    recoverPending: async () => {},
    handleSessionError: () => {},
    handleSessionIdle: () => {},
    handleSessionDeleted: () => {},
    recordChildMessageSignal: () => {},
    recordChildToolSignal: () => {},
    setCompletionDetector: () => {},
    controlDelegation: async () => ({}),
  }
}

function makeMockSessionTracker() {
  return {
    initialize: async () => {},
    getLastMessageCapture: () => undefined,
    constructCoreDependencies: () => {},
    handleToolExecuteAfter: async () => {},
    handleSessionEvent: async () => {},
  }
}

describe("Tool Registration Smoke Tests", () => {
  describe("registerDelegationTools", () => {
    const tools = registerDelegationTools({
      delegationManager: makeMockDelegationManager() as any,
      hivemindConfig: {} as any,
      ptyManager: null as any,
      client: makeMinimalClient(),
      monitor: { getEscalationLevel: () => null },
      projectDirectory: tmpdir,
    })

    it("returns exactly 3 tools", () => {
      expect(Object.keys(tools)).toHaveLength(3)
    })

    it("has correct tool keys", () => {
      expect(tools).toHaveProperty("delegate-task")
      expect(tools).toHaveProperty("delegation-status")
      expect(tools).toHaveProperty("run-background-command")
    })

    it("each tool has description string and execute function", () => {
      for (const [name, toolDef] of Object.entries(tools)) {
        expect(typeof toolDef.description).toBe("string")
        expect(typeof toolDef.execute).toBe("function")
      }
    })

    it("each tool execute returns without throwing", async () => {
      const ctx = { sessionID: "", metadata: () => {} }
      for (const [, toolDef] of Object.entries(tools)) {
        const result = await (toolDef.execute as Function)({}, ctx)
        expect(result).toBeTruthy()
      }
    })
  })

  describe("registerSessionTools", () => {
    const tools = registerSessionTools({
      client: makeMinimalClient(),
      sessionTracker: makeMockSessionTracker() as any,
      projectDirectory: tmpdir,
    })

    it("returns exactly 7 tools", () => {
      expect(Object.keys(tools)).toHaveLength(7)
    })

    it("has correct tool keys", () => {
      expect(tools).toHaveProperty("execute-slash-command")
      expect(tools).toHaveProperty("session-patch")
      expect(tools).toHaveProperty("session-journal-export")
      expect(tools).toHaveProperty("session-tracker")
      expect(tools).toHaveProperty("session-hierarchy")
      expect(tools).toHaveProperty("session-context")
      expect(tools).toHaveProperty("create-governance-session")
    })

    it("each tool has description string and execute function", () => {
      for (const [name, toolDef] of Object.entries(tools)) {
        expect(typeof toolDef.description).toBe("string")
        expect(typeof toolDef.execute).toBe("function")
      }
    })

    it("each tool execute returns without throwing", async () => {
      const ctx = { sessionID: "", metadata: () => {} }
      for (const [, toolDef] of Object.entries(tools)) {
        const result = await (toolDef.execute as Function)({}, ctx)
        expect(result).toBeTruthy()
      }
    })
  })

  describe("registerHivemindTools", () => {
    const tools = registerHivemindTools({
      projectDirectory: tmpdir,
    })

    it("returns exactly 8 tools", () => {
      expect(Object.keys(tools)).toHaveLength(8)
    })

    it("has correct tool keys", () => {
      expect(tools).toHaveProperty("hivemind-doc")
      expect(tools).toHaveProperty("hivemind-trajectory")
      expect(tools).toHaveProperty("hivemind-pressure")
      expect(tools).toHaveProperty("hivemind-sdk-supervisor")
      expect(tools).toHaveProperty("hivemind-command-engine")
      expect(tools).toHaveProperty("hivemind-session-view")
      expect(tools).toHaveProperty("hivemind-agent-work-create")
      expect(tools).toHaveProperty("hivemind-agent-work-export")
    })

    it("each tool has description string and execute function", () => {
      for (const [name, toolDef] of Object.entries(tools)) {
        expect(typeof toolDef.description).toBe("string")
        expect(typeof toolDef.execute).toBe("function")
      }
    })

    it("each tool execute returns without throwing", async () => {
      const ctx = { sessionID: "", metadata: () => {} }
      for (const [, toolDef] of Object.entries(tools)) {
        const result = await (toolDef.execute as Function)({}, ctx)
        expect(result).toBeTruthy()
      }
    })
  })

  describe("registerConfigTools", () => {
    const tools = registerConfigTools({
      projectDirectory: tmpdir,
    })

    it("returns exactly 6 tools", () => {
      expect(Object.keys(tools)).toHaveLength(6)
    })

    it("has correct tool keys", () => {
      expect(tools).toHaveProperty("configure-primitive")
      expect(tools).toHaveProperty("validate-restart")
      expect(tools).toHaveProperty("bootstrap-init")
      expect(tools).toHaveProperty("bootstrap-recover")
      expect(tools).toHaveProperty("prompt-skim")
      expect(tools).toHaveProperty("prompt-analyze")
    })

    it("each tool has description string and execute function", () => {
      for (const [name, toolDef] of Object.entries(tools)) {
        expect(typeof toolDef.description).toBe("string")
        expect(typeof toolDef.execute).toBe("function")
      }
    })

    it("each tool execute returns without throwing", async () => {
      const ctx = { sessionID: "", metadata: () => {} }
      for (const [name, toolDef] of Object.entries(tools)) {
        const args = name.startsWith("prompt-") ? { content: "", workspaceRoot: tmpdir } : {}
        const result = await (toolDef.execute as Function)(args, ctx)
        expect(result).toBeTruthy()
      }
    })
  })

  describe("aggregate counts", () => {
    it("total tool count across all groups is 24", () => {
      const delegation = registerDelegationTools({
        delegationManager: makeMockDelegationManager() as any,
        hivemindConfig: {} as any,
        ptyManager: null as any,
        client: makeMinimalClient(),
        monitor: { getEscalationLevel: () => null },
        projectDirectory: tmpdir,
      })
      const session = registerSessionTools({
        client: makeMinimalClient(),
        sessionTracker: makeMockSessionTracker() as any,
        projectDirectory: tmpdir,
      })
      const hivemind = registerHivemindTools({ projectDirectory: tmpdir })
      const config = registerConfigTools({ projectDirectory: tmpdir })

      expect(Object.keys(delegation).length).toBe(3)
      expect(Object.keys(session).length).toBe(7)
      expect(Object.keys(hivemind).length).toBe(8)
      expect(Object.keys(config).length).toBe(6)
      expect(
        Object.keys(delegation).length +
          Object.keys(session).length +
          Object.keys(hivemind).length +
          Object.keys(config).length,
      ).toBe(24)
    })
  })
})
