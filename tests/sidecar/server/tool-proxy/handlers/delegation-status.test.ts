/**
 * SC-02 delegation-status handler tests — covers TOOL_HANDLERS["delegation-status"].
 * Per 02-SPEC.md: read-only delegation state query.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleDelegationStatus } from "../../../../../src/sidecar/server/tool-proxy/handlers/delegation-status.js"
import { createMockRegistry } from "../../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("delegation-status handler", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("is exported as a function", () => {
    expect(typeof handleDelegationStatus).toBe("function")
  })

  it("returns ok=true envelope with status on success", async () => {
    const result = await handleDelegationStatus({ registry, args: { delegationId: "del-1" } })
    expect(result).toHaveProperty("ok", true)
    const okResult = result as { ok: true; data: { status: string } }
    expect(typeof okResult.data.status).toBe("string")
  })

  it("returns INVALID_ARGS on missing delegationId", async () => {
    const result = await handleDelegationStatus({ registry, args: {} as never })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("INVALID_ARGS")
  })

  it("accepts sessionId as valid generic arg", async () => {
    const result = await handleDelegationStatus({ registry, args: { sessionId: "sess-1" } as never })
    expect(result).toHaveProperty("ok", true)
  })

  it("reads DelegationManager state without mutating it", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    await handleDelegationStatus({ registry: reg, args: { delegationId: "del-1" } })
    expect(mock.delegationManager.dispatch).not.toHaveBeenCalled()
  })
})
