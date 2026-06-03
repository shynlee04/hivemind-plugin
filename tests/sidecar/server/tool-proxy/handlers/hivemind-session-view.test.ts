/**
 * SC-02 hivemind-session-view handler tests — covers TOOL_HANDLERS["hivemind-session-view"].
 * Per 02-SPEC.md: unified session state query across session-tracker,
 * delegations, trajectory.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleHivemindSessionView } from "../../../../../src/sidecar/server/tool-proxy/handlers/hivemind-session-view.js"
import { createMockRegistry } from "../../../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("hivemind-session-view handler", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("is exported as a function", () => {
    expect(typeof handleHivemindSessionView).toBe("function")
  })

  it("returns ok=true envelope with session data", async () => {
    const result = await handleHivemindSessionView({ registry, args: { sessionId: "sess-1" } })
    expect(result).toHaveProperty("ok", true)
    const okResult = result as { ok: true; data: { sessionId: string } }
    expect(okResult.data.sessionId).toBe("sess-1")
  })

  it("returns INVALID_ARGS on missing sessionId", async () => {
    const result = await handleHivemindSessionView({ registry, args: {} as never })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("INVALID_ARGS")
  })

  it("aggregates from sessionTracker", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    await handleHivemindSessionView({ registry: reg, args: { sessionId: "sess-1" } })
    expect(mock.sessionTracker.get).toHaveBeenCalled()
  })
})
