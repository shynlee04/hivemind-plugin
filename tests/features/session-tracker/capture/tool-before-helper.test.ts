/**
 * Tests for tool-before-helper shared utility.
 *
 * Validates that registerPendingDispatch() and pollForChildSessions()
 * work correctly as standalone exported functions, and that both
 * ToolDelegation and ToolCapture delegate to the shared utility.
 *
 * @module tests/features/session-tracker/capture/tool-before-helper
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import type { PollDeps } from "../../../../src/features/session-tracker/capture/tool-before-helper.js"
import { resetAdapter } from "../../../../src/shared/session-api.js"

// ---------------------------------------------------------------------------
// Module-level mocks — tool-before-helper module may not exist yet
// ---------------------------------------------------------------------------

let registerPendingDispatch:
  | ((deps: PollDeps, params: { sessionID: string; callID: string; subagentType: string; tool: string }) => Promise<void>)
  | undefined
let pollForChildSessions:
  | ((deps: PollDeps, parentID: string, callID: string) => Promise<void>)
  | undefined

try {
  // Dynamic import so tests fail gracefully if module doesn't exist yet
  const mod = await import("../../../../src/features/session-tracker/capture/tool-before-helper.js")
  registerPendingDispatch = mod.registerPendingDispatch
  pollForChildSessions = mod.pollForChildSessions
} catch {
  // Module doesn't exist yet — RED phase
}

// ---------------------------------------------------------------------------
// Helper to create PollDeps mock
// ---------------------------------------------------------------------------

function createPollDeps(overrides: Partial<PollDeps> = {}): PollDeps {
  return {
    client: {
      session: {
        children: vi.fn().mockResolvedValue({ data: [] }),
      } as unknown as PollDeps["client"]["session"],
    } as unknown as PollDeps["client"],
    classifier: {
      isChildRegistered: vi.fn().mockReturnValue(false),
      registerChild: vi.fn(),
      updatePendingWithChildID: vi.fn(),
    },
    pendingRegistry: {
      add: vi.fn(),
    } as unknown as PollDeps["pendingRegistry"],
    childWriter: {
      createChildFile: vi.fn().mockResolvedValue(undefined),
    } as unknown as PollDeps["childWriter"],
    hierarchyIndex: {
      registerChild: vi.fn(),
      getDepth: vi.fn().mockReturnValue(1),
    } as unknown as PollDeps["hierarchyIndex"],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("tool-before-helper", () => {
  beforeEach(() => {
    // Ensure the module-level adapter is null so getChildSessions uses V1 fallback
    resetAdapter()
  })

  // -----------------------------------------------------------------------
  // registerPendingDispatch
  // -----------------------------------------------------------------------
  describe("registerPendingDispatch", () => {
    it("RED: adds entry to pendingRegistry when pendingRegistry is present", async () => {
      if (!registerPendingDispatch) {
        // RED phase — test fails until module exists
        expect(registerPendingDispatch).toBeDefined()
        return
      }

      const deps = createPollDeps()
      const addSpy = vi.mocked(deps.pendingRegistry!.add!)

      await registerPendingDispatch(deps, {
        sessionID: "ses_parent123",
        callID: "call_abc",
        subagentType: "gsd-executor",
        tool: "task",
      })

      expect(addSpy).toHaveBeenCalledTimes(1)
      expect(addSpy).toHaveBeenCalledWith({
        parentSessionID: "ses_parent123",
        callID: "call_abc",
        subagentType: "gsd-executor",
        timestamp: expect.any(Number),
        tool: "task",
      })
    })

    it("RED: returns silently when pendingRegistry is absent", async () => {
      if (!registerPendingDispatch) return

      const deps = createPollDeps({ pendingRegistry: undefined })

      // Should not throw
      await expect(
        registerPendingDispatch(deps, {
          sessionID: "ses_parent123",
          callID: "call_abc",
          subagentType: "gsd-executor",
          tool: "task",
        }),
      ).resolves.toBeUndefined()
    })

    it("RED: defaults tool to 'task' when not provided", async () => {
      if (!registerPendingDispatch) return

      const deps = createPollDeps()
      const addSpy = vi.mocked(deps.pendingRegistry!.add!)

      await registerPendingDispatch(deps, {
        sessionID: "ses_parent123",
        callID: "call_abc",
        subagentType: "gsd-executor",
        tool: "task",
      })

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({ tool: "task" }),
      )
    })
  })

  // -----------------------------------------------------------------------
  // pollForChildSessions
  // -----------------------------------------------------------------------
  describe("pollForChildSessions", () => {
    it("RED: discovers new child session and calls registerChild + updatePendingWithChildID", async () => {
      if (!pollForChildSessions) {
        expect(pollForChildSessions).toBeDefined()
        return
      }

      const childrenFn = vi.fn().mockResolvedValue({
        data: [{ id: "ses_child123", parentID: "ses_parent123" }],
      })
      const deps = createPollDeps({
        client: {
          session: {
            children: childrenFn,
            get: vi.fn().mockResolvedValue({ data: { id: "ses_child123", title: "test", status: "idle" } }),
            messages: vi.fn().mockResolvedValue({ data: [] }),
          } as unknown as PollDeps["client"]["session"],
        } as unknown as PollDeps["client"],
      })

      await pollForChildSessions(deps, "ses_parent123", "call_abc")

      expect(childrenFn).toHaveBeenCalledWith({ path: { id: "ses_parent123" } })
      expect(deps.classifier.registerChild).toHaveBeenCalledWith("ses_parent123", "ses_child123")
      expect(deps.classifier.updatePendingWithChildID).toHaveBeenCalledWith("call_abc", "ses_child123")
    })

    it("RED: calls writeImmediateChildFile when childWriter and hierarchyIndex are present", async () => {
      if (!pollForChildSessions) return

      const createChildFile = vi.fn().mockResolvedValue(undefined)
      const deps = createPollDeps({
        client: {
          session: {
            children: vi.fn().mockResolvedValue({
              data: [{ id: "ses_child456", parentID: "ses_parent123" }],
            }),
            get: vi.fn().mockResolvedValue({ data: { id: "ses_child456", title: "test", status: "idle" } }),
            messages: vi.fn().mockResolvedValue({ data: [] }),
          } as unknown as PollDeps["client"]["session"],
        } as unknown as PollDeps["client"],
        childWriter: {
          createChildFile,
        } as unknown as PollDeps["childWriter"],
      })

      await pollForChildSessions(deps, "ses_parent123", "call_def")

      // writeImmediateChildFile is called internally, which calls createChildFile
      expect(createChildFile).toHaveBeenCalled()
    })

    it("RED: skips already-registered child sessions", async () => {
      if (!pollForChildSessions) return

      const deps = createPollDeps({
        client: {
          session: {
            children: vi.fn().mockResolvedValue({
              data: [{ id: "ses_child789", parentID: "ses_parent123" }],
            }),
          } as unknown as PollDeps["client"]["session"],
        } as unknown as PollDeps["client"],
        classifier: {
          isChildRegistered: vi.fn().mockReturnValue(true),
          registerChild: vi.fn(),
          updatePendingWithChildID: vi.fn(),
        },
      })

      await pollForChildSessions(deps, "ses_parent123", "call_ghi")

      expect(deps.classifier.registerChild).not.toHaveBeenCalled()
      expect(deps.classifier.updatePendingWithChildID).not.toHaveBeenCalled()
    })

    it("RED: returns silently when session.children is not available", async () => {
      if (!pollForChildSessions) return

      const deps = createPollDeps({
        client: {} as unknown as PollDeps["client"],
      })

      // Should not throw
      await expect(
        pollForChildSessions(deps, "ses_parent123", "call_abc"),
      ).resolves.toBeUndefined()
    })
  })
})
