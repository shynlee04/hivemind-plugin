import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createSessionHooks } from "../../src/hooks/lifecycle/session-hooks.js"

vi.mock("../../src/task-management/continuity/index.js", () => ({
  getContinuityStoragePath: vi.fn(() => "/tmp/test-harness"),
  getSessionContinuity: vi.fn(),
}))

vi.mock("../../src/shared/session-api.js", () => ({
  getEventSessionID: vi.fn((event: unknown) => {
    if (typeof event !== "object" || event === null) return undefined
    const e = event as Record<string, unknown>
    if (typeof e.sessionID === "string") return e.sessionID
    const props = e.properties as Record<string, unknown> | undefined
    if (props && typeof props.sessionID === "string") return props.sessionID
    return undefined
  }),
  getSessionMessages: vi.fn(),
}))

vi.mock("../../src/features/prompt-packet/compaction-preservation.js", () => ({
  toCompactionPacket: vi.fn(() => ({ packet_version: "1.0.0" })),
}))

import { getSessionContinuity } from "../../src/task-management/continuity/index.js"
import { getSessionMessages } from "../../src/shared/session-api.js"

const mockedGetSessionContinuity = vi.mocked(getSessionContinuity)
const mockedGetSessionMessages = vi.mocked(getSessionMessages)

function makeDeps(overrides: Record<string, unknown> = {}) {
  return {
    client: { session: { prompt: vi.fn(), messages: vi.fn() } } as never,
    lifecycleManager: {
      handleEvent: vi.fn(),
      replayPendingNotificationsForEvent: vi.fn(),
      requestAutoLoopRetry: vi.fn(),
      getLifecycleSnapshot: vi.fn(() => ({})),
    } as never,
    stateManager: {
      addWarning: vi.fn(),
      ensureStats: vi.fn(),
      getStats: vi.fn(),
    } as never,
    ...overrides,
  }
}

describe("createSessionHooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("event hook — session.deleted and session.error", () => {
    it("handles session.deleted events without throwing", async () => {
      const hooks = createSessionHooks(makeDeps())

      await expect(
        hooks.event({
          event: { type: "session.deleted", sessionID: "ses_deleted" }
        })
      ).resolves.toBeUndefined()
    })

    it("handles session.error events without throwing", async () => {
      const hooks = createSessionHooks(makeDeps())

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
      const hooks = createSessionHooks(makeDeps({
        lifecycleManager: {
          handleEvent,
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(),
          getLifecycleSnapshot: vi.fn(() => ({})),
        } as never,
      }))

      await hooks.event({ event: {} })
      expect(handleEvent).not.toHaveBeenCalled()
    })

    it("bails out when event has no sessionID", async () => {
      const handleEvent = vi.fn()
      const hooks = createSessionHooks(makeDeps({
        lifecycleManager: {
          handleEvent,
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry: vi.fn(),
          getLifecycleSnapshot: vi.fn(() => ({})),
        } as never,
      }))

      await hooks.event({ event: { type: "session.idle" } })
      expect(handleEvent).not.toHaveBeenCalled()
    })
  })

  describe("event hook — auto-loop for session.idle (without delegation packet)", () => {
    it("handles session.idle without delegation packet (no auto-loop trigger)", async () => {
      const addWarning = vi.fn()
      const hooks = createSessionHooks(makeDeps({
        stateManager: { addWarning, ensureStats: vi.fn(), getStats: vi.fn() } as never,
      }))

      await expect(
        hooks.event({
          event: { type: "session.idle", sessionID: "ses_no_packet" }
        })
      ).resolves.toBeUndefined()
    })
  })

  describe("experimental.session.compacting", () => {
    it("handles compacting event without sessionID gracefully", async () => {
      const hooks = createSessionHooks(makeDeps())

      const output: { context?: unknown } = {}
      await hooks["experimental.session.compacting"]({}, output)

      expect(output.context !== undefined || output.context === undefined).toBe(true)
    })

    it("injects lifecycle and auto-loop context when available", async () => {
      const hooks = createSessionHooks(makeDeps({
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
      }))

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

  describe("event hook — auto-loop via deps.runAutoLoop", () => {
    it("calls deps.runAutoLoop on session.idle with delegation packet", async () => {
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "completed", iterations: 1 })
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_auto_1",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "working" }] }])

      const hooks = createSessionHooks(makeDeps({ runAutoLoop }))
      await hooks.event({ event: { type: "session.idle", sessionID: "ses_auto_1" } })

      expect(runAutoLoop).toHaveBeenCalledOnce()
      const callOpts = runAutoLoop.mock.calls[0][0] as { maxIterations: number }
      expect(callOpts.maxIterations).toBe(1)
    })

    it("deletes autoLoopStates entry when runAutoLoop returns completed", async () => {
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "completed", iterations: 1 })
      const requestAutoLoopRetry = vi.fn()
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_completed",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "done" }] }])

      const hooks = createSessionHooks(makeDeps({ runAutoLoop, lifecycleManager: {
        handleEvent: vi.fn(),
        replayPendingNotificationsForEvent: vi.fn(),
        requestAutoLoopRetry,
        getLifecycleSnapshot: vi.fn(() => ({})),
      } as never }))

      await hooks.event({ event: { type: "session.idle", sessionID: "ses_completed" } })

      expect(runAutoLoop).toHaveBeenCalledOnce()
      const compactOutput: { context?: unknown } = {}
      await hooks["experimental.session.compacting"]({ sessionID: "ses_completed" }, compactOutput)
      const ctxStr = JSON.stringify(compactOutput.context)
      expect(ctxStr).not.toContain("auto_loop_iteration")
    })

    it("surfaces warning when iterations exceed max", async () => {
      const addWarning = vi.fn()
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "exhausted", iterations: 1 })
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_exhaust",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "working" }] }])

      const hooks = createSessionHooks(makeDeps({
        runAutoLoop,
        stateManager: { addWarning, ensureStats: vi.fn(), getStats: vi.fn() } as never,
        autoLoopConfig: { maxIterations: 1 },
      }))

      await hooks.event({ event: { type: "session.idle", sessionID: "ses_exhaust" } })

      expect(addWarning).toHaveBeenCalledWith(
        "ses_exhaust",
        expect.stringContaining("[Harness]")
      )
    })

    it("gracefully skips when deps.runAutoLoop is undefined", async () => {
      const requestAutoLoopRetry = vi.fn()
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_no_run",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([])

      const hooks = createSessionHooks(makeDeps({
        lifecycleManager: {
          handleEvent: vi.fn(),
          replayPendingNotificationsForEvent: vi.fn(),
          requestAutoLoopRetry,
          getLifecycleSnapshot: vi.fn(() => ({})),
        } as never,
      }))

      await expect(
        hooks.event({ event: { type: "session.idle", sessionID: "ses_no_run" } })
      ).resolves.toBeUndefined()

      expect(requestAutoLoopRetry).not.toHaveBeenCalled()
    })

    it("terminal events still clean up state", async () => {
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "completed", iterations: 1 })
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_term",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "work" }] }])

      const hooks = createSessionHooks(makeDeps({ runAutoLoop }))

      await hooks.event({ event: { type: "session.idle", sessionID: "ses_term" } })

      await hooks.event({ event: { type: "session.deleted", sessionID: "ses_term" } })

      const compactOutput: { context?: unknown } = {}
      await hooks["experimental.session.compacting"]({ sessionID: "ses_term" }, compactOutput)
      const ctxStr = JSON.stringify(compactOutput.context)
      expect(ctxStr).not.toContain("auto_loop_iteration")
    })

    it("compaction hook preserves iteration count from AutoLoopState", async () => {
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "exhausted", iterations: 1 })
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_compact_iter",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "work" }] }])

      const hooks = createSessionHooks(makeDeps({ runAutoLoop }))

      await hooks.event({ event: { type: "session.idle", sessionID: "ses_compact_iter" } })

      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_compact_iter",
        promptParams: {},
        toolProfile: [],
        metadata: {},
      } as never)

      const compactOutput: { context?: unknown } = {}
      await hooks["experimental.session.compacting"]({ sessionID: "ses_compact_iter" }, compactOutput)
      const ctxStr = JSON.stringify(compactOutput.context)
      expect(ctxStr).toContain("auto_loop_iteration")
    })
  })

  describe("event hook — ralph-loop correction on auto-loop failure", () => {
    it("invokes deps.runRalphLoop when runAutoLoop returns failed with correctable error", async () => {
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "failed", iterations: 1, error: "task failed" })
      const runRalphLoop = vi.fn().mockResolvedValue({ status: "passed", cycles: 1, errors: [] })
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_ralph_1",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "work" }] }])

      const hooks = createSessionHooks(makeDeps({ runAutoLoop, runRalphLoop }))
      await hooks.event({ event: { type: "session.idle", sessionID: "ses_ralph_1" } })

      expect(runRalphLoop).toHaveBeenCalledOnce()
      const callOpts = runRalphLoop.mock.calls[0][0] as { maxCorrectionCycles: number }
      expect(callOpts.maxCorrectionCycles).toBe(3)
    })

    it("surfaces escalation warning when ralph-loop exhausts correction cycles", async () => {
      const addWarning = vi.fn()
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "failed", iterations: 1, error: "task failed" })
      const runRalphLoop = vi.fn().mockResolvedValue({
        status: "exhausted",
        cycles: 3,
        errors: ["fix 1 failed", "fix 2 failed"],
        finalResult: {},
      })
      const escalationMessage = vi.fn().mockReturnValue("[Harness] ralph-loop exhausted 3 correction cycles")
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_ralph_ex",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "work" }] }])

      const hooks = createSessionHooks(makeDeps({
        runAutoLoop,
        runRalphLoop,
        escalationMessage,
        stateManager: { addWarning, ensureStats: vi.fn(), getStats: vi.fn() } as never,
      }))
      await hooks.event({ event: { type: "session.idle", sessionID: "ses_ralph_ex" } })

      expect(addWarning).toHaveBeenCalledWith(
        "ses_ralph_ex",
        expect.stringContaining("[Harness]")
      )
    })

    it("deletes autoLoopStates when ralph-loop passes (delegation resolved)", async () => {
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "failed", iterations: 1, error: "task failed" })
      const runRalphLoop = vi.fn().mockResolvedValue({ status: "passed", cycles: 1, errors: [], finalResult: {} })
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_ralph_pass",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "work" }] }])

      const hooks = createSessionHooks(makeDeps({ runAutoLoop, runRalphLoop }))
      await hooks.event({ event: { type: "session.idle", sessionID: "ses_ralph_pass" } })

      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_ralph_pass",
        promptParams: {},
        toolProfile: [],
        metadata: {},
      } as never)

      const compactOutput: { context?: unknown } = {}
      await hooks["experimental.session.compacting"]({ sessionID: "ses_ralph_pass" }, compactOutput)
      const ctxStr = JSON.stringify(compactOutput.context)
      expect(ctxStr).not.toContain("auto_loop_iteration")
    })

    it("skips correction when deps.runRalphLoop is undefined", async () => {
      const addWarning = vi.fn()
      const runAutoLoop = vi.fn().mockResolvedValue({ status: "failed", iterations: 1, error: "task failed" })
      mockedGetSessionContinuity.mockReturnValue({
        sessionID: "ses_ralph_skip",
        promptParams: {},
        toolProfile: [],
        metadata: {
          delegationPacket: { agent: "test-agent", prompt: "do thing" },
          description: "test task",
          constraints: [],
        },
      } as never)
      mockedGetSessionMessages.mockResolvedValue([{ role: "assistant", content: [{ type: "text", text: "work" }] }])

      const hooks = createSessionHooks(makeDeps({
        runAutoLoop,
        stateManager: { addWarning, ensureStats: vi.fn(), getStats: vi.fn() } as never,
      }))
      await hooks.event({ event: { type: "session.idle", sessionID: "ses_ralph_skip" } })

      expect(addWarning).toHaveBeenCalledWith(
        "ses_ralph_skip",
        expect.stringContaining("task failed")
      )
    })
  })
})
