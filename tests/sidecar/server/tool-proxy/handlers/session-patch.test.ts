/**
 * SC-02 session-patch handler tests — covers TOOL_HANDLERS["session-patch"].
 * Per 02-SPEC.md AC-S02-08: MUST gate against 4 CANONICAL_PREFIXES from
 * src/sidecar/readonly-state.ts:
 *   - .hivemind/state
 *   - .hivemind/session-tracker
 *   - .opencode
 *   - .planning
 * Any write path matching one of these prefixes returns FORBIDDEN_PATH error.
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { handleSessionPatch } from "../../../../../src/sidecar/server/tool-proxy/handlers/session-patch.js"
// @ts-ignore — module doesn't exist yet (W0 TDD red phase) — but DOES exist (SC-01) — RE-VERIFY
import { isCanonicalStatePath, CANONICAL_PREFIXES } from "../../../../../src/sidecar/readonly-state.js"
import { createMockRegistry } from "../../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"
import { join } from "node:path"

describe("session-patch handler (with FORBIDDEN_PATH gate)", () => {
  let registry: SidecarDependencyRegistry

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
  })

  it("is exported as a function", () => {
    expect(typeof handleSessionPatch).toBe("function")
  })

  it("rejects writes to .hivemind/state with FORBIDDEN_PATH", async () => {
    const result = await handleSessionPatch({
      registry,
      args: { path: ".hivemind/state/foo.json", content: "{}" },
    })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("FORBIDDEN_PATH")
  })

  it("rejects writes to .hivemind/session-tracker with FORBIDDEN_PATH", async () => {
    const result = await handleSessionPatch({
      registry,
      args: { path: ".hivemind/session-tracker/sess-1.json", content: "{}" },
    })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("FORBIDDEN_PATH")
  })

  it("rejects writes to .opencode with FORBIDDEN_PATH", async () => {
    const result = await handleSessionPatch({
      registry,
      args: { path: ".opencode/agents/hm-l0-orchestrator.md", content: "x" },
    })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("FORBIDDEN_PATH")
  })

  it("rejects writes to .planning with FORBIDDEN_PATH", async () => {
    const result = await handleSessionPatch({
      registry,
      args: { path: ".planning/ROADMAP.md", content: "x" },
    })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("FORBIDDEN_PATH")
  })

  it("accepts writes to non-canonical paths", async () => {
    const result = await handleSessionPatch({
      registry,
      args: { path: "/tmp/notes.md", content: "x" },
    })
    expect(result).toHaveProperty("ok", true)
  })

  it("CANONICAL_PREFIXES from readonly-state has 4 entries (SC-01 invariant)", () => {
    const opts = { projectRoot: process.cwd() }
    const statePath = join(process.cwd(), ".hivemind/state/x.json")
    const safePath = "/tmp/safe.md"
    expect(CANONICAL_PREFIXES.length).toBe(4)
    expect(isCanonicalStatePath(statePath, opts)).toBe(true)
    expect(isCanonicalStatePath(safePath, opts)).toBe(false)
  })

  it("returns INVALID_ARGS on missing path", async () => {
    const result = await handleSessionPatch({ registry, args: { content: "x" } as never })
    expect(result).toHaveProperty("ok", false)
    const errResult = result as { ok: false; error: { code: string } }
    expect(errResult.error.code).toBe("INVALID_ARGS")
  })
})
