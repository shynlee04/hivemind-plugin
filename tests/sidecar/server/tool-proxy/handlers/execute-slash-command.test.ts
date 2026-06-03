/**
 * SC-02 execute-slash-command handler tests — covers
 * TOOL_HANDLERS["execute-slash-command"]. Per 02-SPEC.md: re-routes through
 * delegation pipeline (no direct client.session.prompt).
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleExecuteSlashCommand } from "../../../../../src/sidecar/server/tool-proxy/handlers/execute-slash-command.js"
import { createMockRegistry } from "../../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"

describe("execute-slash-command handler", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("is exported as a function", () => {
    expect(typeof handleExecuteSlashCommand).toBe("function")
  })

  it("returns ok=true envelope with command result", async () => {
    const result = await handleExecuteSlashCommand({
      registry,
      args: { command: "/plan", sessionId: "sess-1" },
    })
    expect(result).toHaveProperty("ok", true)
  })

  it("returns INVALID_ARGS on missing command", async () => {
    const result = await handleExecuteSlashCommand({
      registry,
      args: {} as never,
    })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("INVALID_ARGS")
  })

  it("accepts sessionId as valid generic arg", async () => {
    const result = await handleExecuteSlashCommand({
      registry,
      args: { sessionId: "sess-1" } as never,
    })
    expect(result).toHaveProperty("ok", true)
  })

  it("does NOT call client.session.prompt (re-entrancy hazard)", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    await handleExecuteSlashCommand({
      registry: reg,
      args: { command: "/plan", sessionId: "sess-1" },
    })
    expect(mock.client.session.prompt).not.toHaveBeenCalled()
  })
})
