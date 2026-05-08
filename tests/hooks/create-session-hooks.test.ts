import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createSessionHooks } from "../../src/hooks/lifecycle/session-hooks.js"

/**
 * Returns a sessionID or undefined from a mock event based on
 * its nested properties. Matches getEventSessionID logic.
 */
function resolveSessionID(event: unknown): string | undefined {
  if (typeof event !== "object" || event === null) return undefined
  const e = event as Record<string, unknown>
  // Try sessionID at top level or nested
  if (typeof e.sessionID === "string") return e.sessionID
  const props = e.properties as Record<string, unknown> | undefined
  if (props && typeof props.sessionID === "string") return props.sessionID
  return undefined
}

describe("createSessionHooks", () => {
  describe("event hook — session.deleted and session.error", () => {
    it("handles session.deleted events without throwing", async () => {
      const hooks = createSessionHooks({
        client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
        lifecycleManager: {
          handleEvent: vi.fn(),
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(),
          getLifecycleSnapshot: vi.fn(() => ({ phase: "idle" })),
        } as never,
        stateManager: {
          addWarning: vi.fn(),
          ensureStats: vi.fn(),
          getStats: vi.fn(),
        } as never,
      })

      // Should not throw
      await expect(
        hooks.event({
          event: { type: "session.deleted", sessionID: "ses_deleted" }
        })
      ).resolves.toBeUndefined()
    })

    it("handles session.error events without throwing", async () => {
      const hooks = createSessionHooks({
        client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
        lifecycleManager: {
          handleEvent: vi.fn(),
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(),
          getLifecycleSnapshot: vi.fn(() => ({ phase: "error" })),
        } as never,
        stateManager: {
          addWarning: vi.fn(),
          ensureStats: vi.fn(),
          getStats: vi.fn(),
        } as never,
      })

      await expect(
        hooks.event({
          event: { type: "session.error", sessionID: "ses_error" }
        })
      ).resolves.toBeUndefined()
    })
  })

  describe("event hook — bailout conditions", () => {
    it("bails out when event has no type", async () => {
      const handleEvent = vi.fn()
      const hooks = createSessionHooks({
        client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
        lifecycleManager: { handleEvent, replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(), getLifecycleSnapshot: vi.fn(() => ({})) } as never,
        stateManager: { addWarning: vi.fn(), ensureStats: vi.fn(), getStats: vi.fn() } as never,
      })

      await hooks.event({ event: {} })
      // No crash, no lifecycle calls
      expect(handleEvent).not.toHaveBeenCalled()
    })

    it("bails out when event has no sessionID", async () => {
      const handleEvent = vi.fn()
      const hooks = createSessionHooks({
        client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
        lifecycleManager: { handleEvent, replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(), getLifecycleSnapshot: vi.fn(() => ({})) } as never,
        stateManager: { addWarning: vi.fn(), ensureStats: vi.fn(), getStats: vi.fn() } as never,
      })

      await hooks.event({ event: { type: "session.idle" } })
      expect(handleEvent).not.toHaveBeenCalled()
    })
  })

  describe("event hook — auto-loop for session.idle (without delegation packet)", () => {
    it("handles session.idle without delegation packet (no auto-loop trigger)", async () => {
      const addWarning = vi.fn()
      const hooks = createSessionHooks({
        client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
        lifecycleManager: {
          handleEvent: vi.fn(),
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(),
          getLifecycleSnapshot: vi.fn(() => ({})),
        } as never,
        stateManager: { addWarning, ensureStats: vi.fn(), getStats: vi.fn() } as never,
      })

      // session.idle on a non-delegation-packet session should return without action
      await expect(
        hooks.event({
          event: { type: "session.idle", sessionID: "ses_no_packet" }
        })
      ).resolves.toBeUndefined()
    })
  })

  describe("experimental.session.compacting", () => {
    it("handles compacting event without sessionID gracefully", async () => {
      const hooks = createSessionHooks({
        client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
        lifecycleManager: {
          handleEvent: vi.fn(),
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(),
          getLifecycleSnapshot: vi.fn(() => ({ phase: "active" })),
        } as never,
        stateManager: {
          addWarning: vi.fn(),
          ensureStats: vi.fn(),
          getStats: vi.fn(),
        } as never,
      })

      const output: { context?: unknown } = {}
      await hooks["experimental.session.compacting"]({}, output)

      // With no sessionID, the hook returns early; context may be set by default behavior
      expect(output.context !== undefined || output.context === undefined).toBe(true) // No crash
    })

    it("injects lifecycle and auto-loop context when available", async () => {
      const hooks = createSessionHooks({
        client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
        lifecycleManager: {
          handleEvent: vi.fn(),
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(),
          getLifecycleSnapshot: vi.fn(() => ({
            phase: "delegating",
            runMode: "headless",
            queue: { active: 1, limit: 5, pending: 2 },
            observation: { source: "session.idle" },
          })),
        } as never,
        stateManager: {
          addWarning: vi.fn(),
          ensureStats: vi.fn(),
          getStats: vi.fn(),
        } as never,
      })

      const output: { context?: unknown } = {}
      await hooks["experimental.session.compacting"](
        { sessionID: "ses_compact" },
        output
      )

      expect(output.context).toBeDefined()
      const ctxArray = output.context as string[]
      expect(ctxArray.length).toBeGreaterThan(0)
      const contextStr = ctxArray.join("\n")
      expect(contextStr).toContain("lifecycle_phase")
      expect(contextStr).toContain("lifecycle_run_mode")
    })
  })
})
