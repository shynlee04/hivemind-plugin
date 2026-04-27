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
})
