/**
 * SC-02 hivemind-command-engine handler tests — covers
 * TOOL_HANDLERS["hivemind-command-engine"]. Per 02-SPEC.md: command routing
 * via hivemind-command-engine facade.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleHivemindCommandEngine } from "../../../../../src/sidecar/server/tool-proxy/handlers/hivemind-command-engine.js"
import { createMockRegistry } from "../../../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("hivemind-command-engine handler", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("is exported as a function", () => {
    expect(typeof handleHivemindCommandEngine).toBe("function")
  })

  it("returns ok=true envelope with route data on list action", async () => {
    const result = await handleHivemindCommandEngine({
      registry,
      args: { action: "list" },
    })
    expect(result).toHaveProperty("ok", true)
    const okResult = result as { ok: true; data: { routes: unknown[] } }
    expect(Array.isArray(okResult.data.routes)).toBe(true)
  })

  it("returns INVALID_ARGS on missing action", async () => {
    const result = await handleHivemindCommandEngine({ registry, args: {} as never })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("INVALID_ARGS")
  })
})
