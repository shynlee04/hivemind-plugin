/**
 * SC-02 delegate-task handler tests — covers TOOL_HANDLERS["delegate-task"].
 * Per 02-SPEC.md + tool dispatch rule: MUST call DelegationManager.dispatch()
 * (async WaiterModel), NEVER client.session.prompt() (re-entrancy hazard).
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleDelegateTask } from "../../../../../src/sidecar/server/tool-proxy/handlers/delegate-task.js"
import { createMockRegistry } from "../../../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("delegate-task handler", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("is exported as a function", () => {
    expect(typeof handleDelegateTask).toBe("function")
  })

  it("returns ok=true envelope with delegationId on success", async () => {
    const result = await handleDelegateTask({ registry, args: { sessionId: "sess-1", prompt: "hi" } })
    expect(result).toHaveProperty("ok", true)
    const okResult = result as { ok: true; data: { delegationId: string } }
    expect(typeof okResult.data.delegationId).toBe("string")
  })

  it("calls DelegationManager.dispatch with provided args", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    await handleDelegateTask({ registry: reg, args: { sessionId: "sess-1", prompt: "test" } })
    expect(mock.delegationManager.dispatch).toHaveBeenCalled()
  })

  it("does NOT call client.session.prompt (re-entrancy hazard)", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    await handleDelegateTask({ registry: reg, args: { sessionId: "sess-1", prompt: "x" } })
    expect(mock.client.session.prompt).not.toHaveBeenCalled()
  })

  it("returns INVALID_ARGS on missing sessionId", async () => {
    const result = await handleDelegateTask({ registry, args: { prompt: "no session" } as never })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("INVALID_ARGS")
  })
})
