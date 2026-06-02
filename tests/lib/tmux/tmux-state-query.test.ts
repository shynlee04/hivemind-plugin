import { describe, it, expect, beforeEach } from "vitest"
import type { SessionManagerAdapter, PaneState, PaneTreeNode } from "../../../src/features/tmux/types.js"

const { setSessionManagerAdapter } = await import("../../../src/features/tmux/types.js")

// Import after adapter mock setup
const { tmuxStateQueryTool } = await import("../../../src/tools/tmux-state-query.js")
const tool = tmuxStateQueryTool as unknown as {
  execute: (rawArgs: unknown, context?: { sessionID?: string; agent?: string }) => Promise<string>
}

const exec = async (rawArgs: unknown, context = { sessionID: "sess-1", agent: "hm-orchestrator" }): Promise<unknown> => {
  const out = await tool.execute(rawArgs, context)
  return JSON.parse(out)
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkStubAdapter(): SessionManagerAdapter {
  const planner = {
    computeSplitSequence: (root: PaneTreeNode) =>
      root.children?.map((c) => ({ parentPaneId: root.id, direction: "h" as const })) ?? [],
  }
  return {
    onSessionCreated: async () => {},
    respawnIfKnown: async () => null,
    getMainPaneId: async () => null,
    sendKeys: async () => {},
    listPanes: async (): Promise<PaneState[]> => [],
    createPaneGridPlanner: () => planner,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("tmux-state-query — 3 read-only actions", () => {
  beforeEach(() => {
    setSessionManagerAdapter(null)
  })

  // 1. adapter-not-wired
  it("returns available:false when adapter is null", async () => {
    const result = await exec({ action: "list-sessions" })
    expect(result).toEqual({ available: false, reason: "tmux-not-wired" })
  })

  // 2. permission-denied for non-orchestrator agent
  it("returns permission-denied for non-orchestrator agent", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec(
      { action: "list-sessions" },
      { sessionID: "sess-1", agent: "general-purpose" },
    )
    expect(result).toEqual({ error: { kind: "permission-denied", agent: "general-purpose" } })
  })

  // 3. list-sessions when wired
  it("list-sessions returns sessions array when adapter is wired", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec({ action: "list-sessions" })
    expect(result).toHaveProperty("sessions")
    expect(Array.isArray(result.sessions)).toBe(true)
  })

  // 4. get-session when wired
  it("get-session returns session or null when adapter is wired", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec({ action: "get-session", sessionId: "ses_test123" })
    expect(result).toHaveProperty("session")
  })

  // 5. get-summary when wired
  it("get-summary returns summary object when adapter is wired", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec({ action: "get-summary" })
    expect(result).toHaveProperty("summary")
    expect(result.summary).toHaveProperty("total")
    expect(result.summary).toHaveProperty("active")
    expect(result.summary).toHaveProperty("spawning")
  })

  // 6. invalid input
  it("returns invalid-input error for malformed input", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec({ action: "nonexistent-action" })
    expect(result).toHaveProperty("error")
    expect(result.error.kind).toBe("invalid-input")
  })

  // 7. get-session without sessionId still passes Zod (sessionId optional)
  it("get-session without sessionId returns session null", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec({ action: "get-session" })
    // With no sessionId, the discriminate union routes to the action
    expect(result).toHaveProperty("session")
    expect(result.session).toBeNull()
  })
})
