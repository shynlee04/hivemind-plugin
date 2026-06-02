import { describe, it, expect, beforeEach } from "vitest"
import type { SessionManagerAdapter, PaneState, PaneTreeNode } from "../../../src/features/tmux/types.js"

const { setSessionManagerAdapter } = await import("../../../src/features/tmux/types.js")

// Import after vi.mock setSessionManagerAdapter so tests can swap adapter between runs
const { tmuxCopilotTool } = await import("../../../src/tools/tmux-copilot.js")
const tool = tmuxCopilotTool as unknown as {
  execute: (rawArgs: unknown, context?: { sessionID?: string; agent?: string }) => Promise<string>
}

// Tool returns JSON-stringified TmuxCopilotResult (per shared/tool-helpers
// renderToolResult pattern). Tests parse the string to assert on the shape.
const exec = async (rawArgs: unknown, context = { sessionID: "sess-1", agent: "hm-orchestrator" }): Promise<unknown> => {
  const out = await tool.execute(rawArgs, context)
  return JSON.parse(out)
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function mkStubAdapter(overrides: Partial<SessionManagerAdapter> = {}): SessionManagerAdapter {
  // PaneGridPlanner is the narrow public consumer type — only
  // computeSplitSequence is exposed on the adapter contract.
  const planner = {
    computeSplitSequence: (root: PaneTreeNode) =>
      root.children?.map((c) => ({ parentPaneId: root.id, direction: "h" as const })) ?? [],
  }
  const stub: SessionManagerAdapter = {
    onSessionCreated: async () => {},
    respawnIfKnown: async () => null,
    getMainPaneId: async () => null,
    sendKeys: async () => {},
    listPanes: async (): Promise<PaneState[]> => [],
    createPaneGridPlanner: () => planner,
    ...overrides,
  }
  return stub
}

const ORCHESTRATOR_CONTEXT = { sessionID: "sess-1", agent: "hm-orchestrator" }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("tmux-copilot — 4 actions", () => {
  beforeEach(() => {
    setSessionManagerAdapter(null)
  })

  // 1. send-keys happy path
  it("send-keys: returns {sent: true, paneId} when adapter.sendKeys resolves", async () => {
    setSessionManagerAdapter(mkStubAdapter({ sendKeys: async () => {} }))
    const result = await exec({ action: "send-keys", paneId: "%1", text: "ls -la" })
    expect(result).toEqual({ sent: true, paneId: "%1" })
  })

  // 2. send-keys error path
  it("send-keys: returns {sent: false, paneId, error} when adapter.sendKeys rejects", async () => {
    setSessionManagerAdapter(
      mkStubAdapter({
        sendKeys: async () => {
          throw new Error("pane not found")
        },
      }),
    )
    const result = await exec({ action: "send-keys", paneId: "%1", text: "ls" })
    expect(result).toEqual({ sent: false, paneId: "%1", error: { message: "pane not found" } })
  })

  // 3. list-panes happy path
  it("list-panes: returns {panes: [...]} from adapter.listPanes", async () => {
    const fakePanes: PaneState[] = [
      { paneId: "%1", title: "main", isActive: true, width: 80, height: 24, isMain: true },
    ]
    setSessionManagerAdapter(mkStubAdapter({ listPanes: async () => fakePanes }))
    const result = await exec({ action: "list-panes" })
    expect(result).toEqual({ panes: fakePanes })
  })

  // 4. list-panes error path
  it("list-panes: returns {available: false, reason: 'tmux-not-installed'} when adapter.listPanes rejects", async () => {
    setSessionManagerAdapter(
      mkStubAdapter({
        listPanes: async () => {
          throw new Error("ENOENT: tmux binary not found")
        },
      }),
    )
    const result = await exec({ action: "list-panes" })
    expect(result).toEqual({ available: false, reason: "tmux-not-installed" })
  })

  // 5. compute-grid happy path
  it("compute-grid: returns {commands: [...]} from planner.computeSplitSequence", async () => {
    const tree: PaneTreeNode = {
      id: "root",
      children: [{ id: "a" }, { id: "b" }],
    }
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec({ action: "compute-grid", tree })
    expect(result).toEqual({
      commands: [
        { parentPaneId: "root", direction: "h" },
        { parentPaneId: "root", direction: "h" },
      ],
    })
  })

  // 6. respawn found
  it("respawn: returns {respawned: true, paneId} when adapter.respawnIfKnown returns paneId", async () => {
    setSessionManagerAdapter(
      mkStubAdapter({ respawnIfKnown: async () => ({ paneId: "%42" }) }),
    )
    const result = await exec({ action: "respawn", sessionId: "sess-1" })
    expect(result).toEqual({ respawned: true, paneId: "%42" })
  })

  // 7. respawn not-found
  it("respawn: returns {respawned: false, error: {reason: 'session-not-closed'}} when adapter returns null", async () => {
    setSessionManagerAdapter(mkStubAdapter({ respawnIfKnown: async () => null }))
    const result = await exec({ action: "respawn", sessionId: "sess-1" })
    expect(result).toEqual({
      respawned: false,
      error: { reason: "session-not-closed" },
    })
  })

  // 8. bridge empty — graceful unavailable
  it("returns {available: false, reason: 'tmux-not-wired'} when bridge is empty", async () => {
    setSessionManagerAdapter(null)
    const result = await exec({ action: "send-keys", paneId: "%1", text: "ls" })
    expect(result).toEqual({ available: false, reason: "tmux-not-wired" })
  })

  // 9. invalid input — schema validation fails gracefully
  it("returns {error: {kind: 'invalid-input', issues}} when input fails Zod validation", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    // Missing required 'paneId' for send-keys
    const result = await exec({ action: "send-keys", text: "ls" })
    expect(result).toMatchObject({ error: { kind: "invalid-input" } })
    const err = (result as { error: { issues: unknown[] } }).error
    expect(Array.isArray(err.issues)).toBe(true)
    expect(err.issues.length).toBeGreaterThan(0)
  })

  // 10. permission gate — non-orchestrator agent is rejected
  it("returns {error: {kind: 'permission-denied', agent: <name>}} when caller is not an orchestrator", async () => {
    setSessionManagerAdapter(mkStubAdapter())
    const result = await exec(
      { action: "send-keys", paneId: "%1", text: "ls" },
      { sessionID: "sess-1", agent: "hm-builder" },
    )
    expect(result).toEqual({
      error: { kind: "permission-denied", agent: "hm-builder" },
    })
  })

  // 11. list-panes timeout path
  it("list-panes: returns {available: false, reason: 'tmux-timeout'} when adapter throws timeout error", async () => {
    setSessionManagerAdapter(
      mkStubAdapter({
        listPanes: async () => {
          const err = new Error("ETIMEDOUT: tmux server unreachable") as NodeJS.ErrnoException
          err.code = "ETIMEDOUT"
          throw err
        },
      }),
    )
    const result = await exec({ action: "list-panes" })
    expect(result).toEqual({ available: false, reason: "tmux-timeout" })
  })

  // 12. list-panes generic error path
  it("list-panes: returns {available: false, reason: 'tmux-error', error: {message}} when adapter throws unclassified error", async () => {
    setSessionManagerAdapter(
      mkStubAdapter({
        listPanes: async () => {
          throw new Error("unexpected tmux protocol error")
        },
      }),
    )
    const result = await exec({ action: "list-panes" })
    expect(result).toEqual({
      available: false,
      reason: "tmux-error",
      error: { message: "unexpected tmux protocol error" },
    })
  })
})
