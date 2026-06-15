/**
 * SC-02 tool-proxy router tests — covers TOOL_HANDLERS whitelist dispatch.
 * Per 02-SPEC.md AC-S02-02: 7 whitelisted write tools, dispatcher function
 * rejects unknown tool names.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { TOOL_HANDLERS, dispatchToolHandler } from "../../../../src/sidecar/server/tool-proxy/router.js"
import { createMockRegistry } from "../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach, vi } from "vitest"

const EXPECTED_TOOLS = [
  "delegate-task",
  "delegation-status",
  "execute-slash-command",
  "hivemind-trajectory",
  "hivemind-session-view",
  "session-patch",
  "hivemind-command-engine",
] as const

describe("tool-proxy router (TOOL_HANDLERS)", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("TOOL_HANDLERS is an object/map", () => {
    expect(typeof TOOL_HANDLERS).toBe("object")
    expect(TOOL_HANDLERS).not.toBeNull()
  })

  it("TOOL_HANDLERS contains exactly the 7 whitelisted tools", () => {
    const keys = Object.keys(TOOL_HANDLERS)
    expect(keys.length).toBe(EXPECTED_TOOLS.length)
    for (const t of EXPECTED_TOOLS) {
      expect(keys).toContain(t)
    }
  })

  it("each handler in TOOL_HANDLERS is a function", () => {
    for (const key of Object.keys(TOOL_HANDLERS)) {
      const handler = TOOL_HANDLERS[key as keyof typeof TOOL_HANDLERS]
      expect(typeof handler).toBe("function")
    }
  })

  it("dispatchToolHandler invokes the named handler with registry + args", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    const result = await dispatchToolHandler({
      registry: reg,
      toolName: "delegate-task",
      args: { sessionId: "sess-1", prompt: "test" },
    })
    expect(result).toHaveProperty("ok", true)
  })

  it("dispatchToolHandler returns UNKNOWN_TOOL for non-whitelisted names", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    const result = await dispatchToolHandler({
      registry: reg,
      toolName: "nonexistent-tool",
      args: {},
    })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("UNKNOWN_TOOL")
  })

  it("delegate-task handler dispatches to DelegationManager.dispatch (NOT client.session.prompt)", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    const beforeCalls = mock.delegationManager.dispatch.mock.calls.length
    await dispatchToolHandler({
      registry: reg,
      toolName: "delegate-task",
      args: { sessionId: "sess-1", prompt: "hi" },
    })
    expect(mock.delegationManager.dispatch).toHaveBeenCalled()
    expect(mock.delegationManager.dispatch.mock.calls.length).toBeGreaterThan(beforeCalls)
  })
})
