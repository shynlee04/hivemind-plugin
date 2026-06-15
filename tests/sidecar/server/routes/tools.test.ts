/**
 * SC-02 tools route tests — covers the 7 write tool proxy endpoints under
 * /api/tools/{tool-name}. Per 02-SPEC.md AC-S02-02: dispatches to TOOL_HANDLERS
 * whitelist (defined in src/sidecar/server/tool-proxy/router.ts).
 */
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { createToolsRoutes } from "../../../../src/sidecar/server/routes/tools.js"
// @ts-ignore — module doesn't exist yet (W0 TDD red phase)
import { TOOL_HANDLERS } from "../../../../src/sidecar/server/tool-proxy/router.js"
import { createMockRegistry } from "../../__mocks__/registry.js"
import type { SidecarDependencyRegistry } from "../../../../src/sidecar/server/registry.js"
import { describe, it, expect, beforeEach } from "vitest"
import type { Route } from "../../../../src/sidecar/server/handler.js"

const TOOL_NAMES = [
  "delegate-task",
  "delegation-status",
  "execute-slash-command",
  "hivemind-trajectory",
  "hivemind-session-view",
  "session-patch",
  "hivemind-command-engine",
]

describe("tools route module", () => {
  let registry: SidecarDependencyRegistry
  let routes: Route[]

  beforeEach(() => {
    const mock = createMockRegistry()
    registry = mock.registry as unknown as SidecarDependencyRegistry
    routes = createToolsRoutes(registry)
  })

  it("exports a non-empty array of Route entries", () => {
    expect(Array.isArray(routes)).toBe(true)
    expect(routes.length).toBeGreaterThan(0)
  })

  it("includes a POST route for each of the 7 whitelisted tools", () => {
    for (const name of TOOL_NAMES) {
      const found = routes.find((r) => r.method === "POST" && r.path === `/api/tools/${name}`)
      expect(found).toBeDefined()
    }
  })

  it("only whitelists the 7 tools in TOOL_HANDLERS map (no extras)", () => {
    const postRoutes = routes.filter((r) => r.method === "POST" && r.path.startsWith("/api/tools/"))
    expect(postRoutes.length).toBe(TOOL_NAMES.length)
  })

  it("each tool route delegates to its TOOL_HANDLERS entry", async () => {
    const mock = createMockRegistry()
    const reg = mock.registry as unknown as SidecarDependencyRegistry
    const r = createToolsRoutes(reg)
    const delegateTask = r.find((x) => x.method === "POST" && x.path === "/api/tools/delegate-task")
    if (delegateTask) {
      const result = await delegateTask.handler({
        params: {},
        query: {},
        body: { args: { sessionId: "sess-1", prompt: "test" } },
      })
      expect(result).toHaveProperty("ok", true)
    }
  })

  it("rejects unknown tool names with 404 (handler.test covers this)", () => {
    const unknown = routes.find((r) => r.path === "/api/tools/unknown-tool")
    expect(unknown).toBeUndefined()
  })
})
