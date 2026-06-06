/**
 * SC-02 hivemind-session-view handler tests — covers TOOL_HANDLERS["hivemind-session-view"].
 * Per 02-SPEC.md: unified session state query across session-tracker,
 * delegations, trajectory.
 *
 * GAP-01 (CRITICAL, sidecar-completeness-2026-06-06): the handler previously
 * called `st.get(sessionId)` but DISCARDED the result, always returning
 * `{ ok: true, data: { sessionId } }` with no real data. These tests assert
 * the FIXED contract: full session record returned in `data.session`,
 * NOT_FOUND envelope when missing, `[Harness]` thrown when sessionTracker
 * is not bound.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleHivemindSessionView } from "../../../../../src/sidecar/server/tool-proxy/handlers/hivemind-session-view.js"
import { createMockRegistry } from "../../../__mocks__/registry.js"
import { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("hivemind-session-view handler (GAP-01 fixed contract)", () => {
  describe("with bound sessionTracker", () => {
    let mock: ReturnType<typeof createMockRegistry>
    let registry: SidecarDependencyRegistry

    beforeEach(() => {
      mock = createMockRegistry()
      registry = mock.registry as unknown as SidecarDependencyRegistry
    })

    it("is exported as a function", () => {
      expect(typeof handleHivemindSessionView).toBe("function")
    })

    it("returns the FULL session record from sessionTracker.get in data.session", async () => {
      // Arrange: mock sessionTracker.get to return a real session record
      const fullSession = {
        id: "sess-1",
        name: "Test Session",
        children: ["child-1", "child-2"],
        createdAt: 1234,
        status: "active",
      }
      mock.sessionTracker.get.mockReturnValueOnce(fullSession)

      // Act
      const result = await handleHivemindSessionView({
        registry,
        args: { sessionId: "sess-1" },
      })

      // Assert: handler captured the result and returned it in data.session
      // (NOT the old broken shape `{ data: { sessionId: "sess-1" } }`)
      expect(result).toHaveProperty("ok", true)
      const okResult = result as {
        ok: true
        data: { session: typeof fullSession }
      }
      expect(okResult.data.session).toEqual(fullSession)
      expect(mock.sessionTracker.get).toHaveBeenCalledWith("sess-1")
    })

    it("calls sessionTracker.get with the provided sessionId", async () => {
      await handleHivemindSessionView({ registry, args: { sessionId: "sess-1" } })
      expect(mock.sessionTracker.get).toHaveBeenCalledWith("sess-1")
    })

    it("returns NOT_FOUND error envelope when session is not found", async () => {
      // mock.sessionTracker.get returns undefined by default (not found)
      const result = await handleHivemindSessionView({
        registry,
        args: { sessionId: "missing-sess" },
      })
      expect(result).toHaveProperty("ok", false)
      const errResult = result as { ok: false; error: { code: string; message: string } }
      expect(errResult.error.code).toBe("NOT_FOUND")
      expect(errResult.error.message).toContain("missing-sess")
    })

    it("returns INVALID_ARGS envelope on missing sessionId", async () => {
      const result = await handleHivemindSessionView({
        registry,
        args: {} as never,
      })
      expect(result).toHaveProperty("ok", false)
      const errResult = result as { ok: false; error: { code: string } }
      expect(errResult.error.code).toBe("INVALID_ARGS")
    })
  })

  describe("with unbound sessionTracker", () => {
    it("throws [Harness] error when sessionTracker is not bound in registry", async () => {
      // Real registry without setSessionTracker — typed getter throws [Harness]
      const unboundRegistry = new SidecarDependencyRegistry()
      await expect(
        handleHivemindSessionView({
          registry: unboundRegistry,
          args: { sessionId: "sess-1" },
        }),
      ).rejects.toThrow(/\[Harness\]/)
    })
  })
})
