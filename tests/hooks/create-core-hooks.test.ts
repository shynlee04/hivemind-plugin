import { describe, it, expect, vi } from "vitest"
import { createCoreHooks } from "../../src/hooks/create-core-hooks.js"

function createFakeLifecycleManager() {
  return {
    handleEvent: vi.fn(),
    replayPendingNotificationsForEvent: vi.fn(),
  }
}

describe("createCoreHooks", () => {
  describe("event hook", () => {
    it("routes session.created events to lifecycle manager with correct eventType and sessionID", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: { type: "session.created", sessionID: "ses_test" } })

      expect(lm.handleEvent).toHaveBeenCalledWith({
        event: expect.objectContaining({ type: "session.created" }),
        eventType: "session.created",
        sessionID: "ses_test",
      })
      expect(lm.replayPendingNotificationsForEvent).toHaveBeenCalledWith(
        "ses_test",
        "session.created"
      )
    })

    it("routes session.updated events to lifecycle manager", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({
        event: { type: "session.updated", sessionID: "ses_002" }
      })

      expect(lm.handleEvent).toHaveBeenCalledWith({
        event: expect.objectContaining({ type: "session.updated" }),
        eventType: "session.updated",
        sessionID: "ses_002",
      })
    })

    it("calls replayPendingNotificationsForEvent on session events", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: { type: "session.idle", sessionID: "ses_003" } })

      expect(lm.replayPendingNotificationsForEvent).toHaveBeenCalledWith(
        "ses_003",
        "session.idle"
      )
    })

    it("bails out when event has no type (handleEvent NOT called)", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: {} })

      expect(lm.handleEvent).not.toHaveBeenCalled()
      expect(lm.replayPendingNotificationsForEvent).not.toHaveBeenCalled()
    })

    it("bails out when event has no sessionID (handleEvent NOT called)", async () => {
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({ lifecycleManager: lm as never } as never)

      await hooks.event({ event: { type: "session.created" } })

      expect(lm.handleEvent).not.toHaveBeenCalled()
    })

    it("calls event observers when provided", async () => {
      const observer = vi.fn()
      const lm = createFakeLifecycleManager()
      const hooks = createCoreHooks({
        lifecycleManager: lm as never,
        eventObservers: [observer],
      } as never)

      await hooks.event({ event: { type: "session.created", sessionID: "ses_005" } })

      expect(observer).toHaveBeenCalledWith({
        event: { type: "session.created", sessionID: "ses_005" },
      })
    })
  })

  describe("shell.env hook", () => {
    it("injects CI=true, GIT_TERMINAL_PROMPT=0, NO_COLOR=1, TERM=dumb", async () => {
      const hooks = createCoreHooks({
        lifecycleManager: { handleEvent: vi.fn(), replayPendingNotificationsForEvent: vi.fn() } as never,
      } as never)

      const output: Record<string, unknown> = {}
      await hooks["shell.env"]({}, output)

      expect(output.env).toMatchObject({
        CI: "true",
        GIT_TERMINAL_PROMPT: "0",
        NO_COLOR: "1",
        TERM: "dumb",
      })
    })

    it("merges with existing user-set env vars (does not overwrite)", async () => {
      const hooks = createCoreHooks({
        lifecycleManager: { handleEvent: vi.fn(), replayPendingNotificationsForEvent: vi.fn() } as never,
      } as never)

      const output: Record<string, unknown> = {
        env: { NODE_ENV: "production", CI: "false" },
      }
      await hooks["shell.env"]({}, output)

      // Should overwrite CI with "true" (harness priority)
      expect((output.env as Record<string, string>).CI).toBe("true")
      // Should preserve user-set NODE_ENV
      expect((output.env as Record<string, string>).NODE_ENV).toBe("production")
    })
  })

  describe("behavioral profile injection", () => {
    function createFakeBehavioralProfile() {
      return {
        behavioralProfile: {
          guardrailLevel: "strict" as const,
          delegationMode: "waiter" as const,
          toolAccessPattern: "restricted" as const,
          skillFilter: "curated" as const,
        },
        language: {
          conversation: "en",
          documents: "en",
        },
        merged: {
          communicationStyle: "concise",
          decisionSpeed: "cautious",
          expertise: "senior",
        },
        discussMode: "reflective",
        runtimeProfile: null,
        configExpertise: "senior",
      }
    }

    it("injects behavioral fields into system.transform when getBehavioralProfile is provided", async () => {
      const profile = createFakeBehavioralProfile()
      const hooks = createCoreHooks({
        lifecycleManager: createFakeLifecycleManager() as never,
        getIntake: () => ({
          purpose: { purpose: "test", confidence: 0.9 },
          language: { language: "en" },
          routingTarget: "builder",
          profile: {},
          warnings: [],
        }),
        getBehavioralProfile: () => profile,
      } as never)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_bp_test" }, output)

      const system = output.system as string[]
      expect(system).toBeDefined()
      expect(system.length).toBeGreaterThanOrEqual(2)
      const behavioralBlock = system.find((s) => s.includes("Behavioral profile context:"))
      expect(behavioralBlock).toBeDefined()
      expect(behavioralBlock).toContain("behavioral.guardrailLevel: strict")
      expect(behavioralBlock).toContain("behavioral.delegationMode: waiter")
      expect(behavioralBlock).toContain("behavioral.toolAccessPattern: restricted")
      expect(behavioralBlock).toContain("behavioral.skillFilter: curated")
      expect(behavioralBlock).toContain("language.conversation: en")
      expect(behavioralBlock).toContain("language.documents: en")
      expect(behavioralBlock).toContain("runtime.communicationStyle: concise")
      expect(behavioralBlock).toContain("runtime.decisionSpeed: cautious")
      expect(behavioralBlock).toContain("runtime.expertise: senior")
      expect(behavioralBlock).toContain("discuss.mode: reflective")
    })

    it("system.transform works without getBehavioralProfile (backward compat)", async () => {
      const hooks = createCoreHooks({
        lifecycleManager: createFakeLifecycleManager() as never,
        getIntake: () => ({
          purpose: { purpose: "test", confidence: 0.9 },
          language: { language: "en" },
          routingTarget: "builder",
          profile: {},
          warnings: [],
        }),
      } as never)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_no_bp" }, output)

      const system = output.system as string[]
      expect(system).toBeDefined()
      // Should have intake but NOT behavioral
      expect(system.some((s) => s.includes("Session intake context:"))).toBe(true)
      expect(system.some((s) => s.includes("Behavioral profile context:"))).toBe(false)
    })

    it("behavioral injection comes AFTER intake injection", async () => {
      const profile = createFakeBehavioralProfile()
      const hooks = createCoreHooks({
        lifecycleManager: createFakeLifecycleManager() as never,
        getIntake: () => ({
          purpose: { purpose: "test", confidence: 0.9 },
          language: { language: "en" },
          routingTarget: "builder",
          profile: {},
          warnings: [],
        }),
        getBehavioralProfile: () => profile,
      } as never)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_order_test" }, output)

      const system = output.system as string[]
      const intakeIdx = system.findIndex((s) => s.includes("Session intake context:"))
      const behavioralIdx = system.findIndex((s) => s.includes("Behavioral profile context:"))
      expect(intakeIdx).toBeLessThan(behavioralIdx)
    })

    it("behavioral injection works independently when intake is unavailable", async () => {
      const profile = createFakeBehavioralProfile()
      const hooks = createCoreHooks({
        lifecycleManager: createFakeLifecycleManager() as never,
        getIntake: () => undefined,
        getBehavioralProfile: () => profile,
      } as never)

      const output: Record<string, unknown> = {}
      await hooks["system.transform"]({ sessionID: "ses_bp_only" }, output)

      // Intake returns undefined, so no intake context — but behavioral SHOULD still inject
      const system = output.system as string[]
      expect(system).toBeDefined()
      expect(system.some((s) => s.includes("Behavioral profile context:"))).toBe(true)
      expect(system.some((s) => s.includes("Session intake context:"))).toBe(false)
    })
  })
})
