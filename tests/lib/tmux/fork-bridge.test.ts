import { describe, it, expect, beforeEach } from "vitest"

// IMPORTANT: import AFTER all vi.mock() calls (none here — module state is pure)
const { setForkSessionManager, getForkSessionManager } = await import(
  "../../../src/features/tmux/fork-bridge.js"
)
import type { ForkSessionManagerAdapter, PaneState, PaneGridPlanner } from "../../../src/features/tmux/fork-bridge.js"

// ---------------------------------------------------------------------------
// Test fixture — minimal adapter stub (6 methods, no real fork needed)
// ---------------------------------------------------------------------------

function mkStubAdapter(): ForkSessionManagerAdapter {
  const planner: PaneGridPlanner = {
    computeSplitSequence: () => [],
    requestLayout: () => {},
    cancel: () => {},
  }
  const stub: ForkSessionManagerAdapter = {
    onSessionCreated: async () => {},
    respawnIfKnown: async () => null,
    getMainPaneId: () => undefined,
    sendKeys: async () => {},
    listPanes: async (): Promise<PaneState[]> => [],
    createPaneGridPlanner: () => planner,
  }
  return stub
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("fork-bridge — set/get/clear semantics", () => {
  beforeEach(() => {
    // Always reset state at test boundary so order-independence holds
    setForkSessionManager(null)
  })

  it("setForkSessionManager(stub) then getForkSessionManager() returns the same stub", () => {
    const stub = mkStubAdapter()
    setForkSessionManager(stub)
    expect(getForkSessionManager()).toBe(stub)
  })

  it("setForkSessionManager(null) then getForkSessionManager() returns null", () => {
    setForkSessionManager(mkStubAdapter())
    setForkSessionManager(null)
    expect(getForkSessionManager()).toBeNull()
  })

  it("getForkSessionManager() with no prior set returns null", () => {
    expect(getForkSessionManager()).toBeNull()
  })

  it("setForkSessionManager twice — second call wins (replaces first)", () => {
    const first = mkStubAdapter()
    const second = mkStubAdapter()
    setForkSessionManager(first)
    setForkSessionManager(second)
    expect(getForkSessionManager()).toBe(second)
    expect(getForkSessionManager()).not.toBe(first)
  })
})
