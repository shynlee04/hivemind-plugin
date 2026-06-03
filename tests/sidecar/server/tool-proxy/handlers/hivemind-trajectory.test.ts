/**
 * SC-02 hivemind-trajectory handler tests — covers TOOL_HANDLERS["hivemind-trajectory"].
 * Per 02-SPEC.md: read-only trajectory inspection (inspect/attach/checkpoint).
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleHivemindTrajectory } from "../../../../../src/sidecar/server/tool-proxy/handlers/hivemind-trajectory.js"
import { createMockRegistry } from "../../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("hivemind-trajectory handler", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("is exported as a function", () => {
    expect(typeof handleHivemindTrajectory).toBe("function")
  })

  it("returns ok=true envelope with events array on inspect", async () => {
    const result = await handleHivemindTrajectory({
      registry,
      args: { action: "inspect", trajectoryId: "traj-1" },
    })
    expect(result).toHaveProperty("ok", true)
    const okResult = result as { ok: true; data: { events: unknown[] } }
    expect(Array.isArray(okResult.data.events)).toBe(true)
  })

  it("calls trajectory.inspect on inspect action", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    await handleHivemindTrajectory({
      registry: reg,
      args: { action: "inspect", trajectoryId: "traj-1" },
    })
    expect(mock.trajectory.inspect).toHaveBeenCalled()
  })

  it("returns INVALID_ACTION on unknown action", async () => {
    const result = await handleHivemindTrajectory({
      registry,
      args: { action: "UNKNOWN_ACTION" as never, trajectoryId: "traj-1" },
    })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("INVALID_ACTION")
  })
})
