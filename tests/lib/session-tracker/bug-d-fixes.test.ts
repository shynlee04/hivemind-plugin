/**
 * Tests for Bug D fixes (Phase 23.2 — Session Tracker Bug D).
 *
 * Bug D-1: Registry race condition — premature removal causes "unknown" actor.
 *   - refreshTimestamp() bumps TTL instead of removing entries.
 *   - tool-capture no longer removes at PostToolUse.
 *
 * Bug D-2: Actor/model attribution — delegation context propagation.
 *   - PendingDispatchEntry now carries optional `model`.
 *   - ChildWriter stores delegation context for child-recorder fallback.
 *   - ChildRecorder prefers delegation context over hook payload.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { PendingDispatchRegistry } from "../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"
import { ChildRecorder, type ChildRecorderDeps, type ChildMessageInput, type ChildMessageOutput } from "../../../src/features/session-tracker/child-recorder.js"
import type { ChildWriter } from "../../../src/features/session-tracker/persistence/child-writer.js"

// ---------------------------------------------------------------------------
// Bug D-1: PendingDispatchRegistry.refreshTimestamp
// ---------------------------------------------------------------------------
describe("PendingDispatchRegistry — Bug D-1: refreshTimestamp", () => {
  let registry: PendingDispatchRegistry

  beforeEach(() => {
    registry = new PendingDispatchRegistry()
  })

  it("should add an entry and retrieve via getByParent", () => {
    registry.add({
      parentSessionID: "parent-1",
      callID: "call-1",
      subagentType: "hm-executor",
      tool: "delegate-task",
      timestamp: Date.now(),
    })

    const found = registry.getByParent("parent-1")
    expect(found).toBeDefined()
    expect(found![0].subagentType).toBe("hm-executor")
  })

  it("refreshTimestamp keeps the entry alive instead of removing it", () => {
    registry.add({
      parentSessionID: "parent-1",
      callID: "call-1",
      subagentType: "hm-executor",
      tool: "delegate-task",
      timestamp: Date.now() - 1000,
    })

    const beforeTimestamp = registry.getByParent("parent-1")![0].timestamp

    // Simulate PostToolUse: refresh instead of remove
    registry.refreshTimestamp("call-1")

    // Entry should still be present
    const afterEntry = registry.getByParent("parent-1")
    expect(afterEntry).toBeDefined()
    expect(afterEntry![0].timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
  })

  it("refreshTimestamp returns silently for unknown callID", () => {
    registry.add({
      parentSessionID: "parent-1",
      callID: "call-1",
      subagentType: "hm-executor",
      tool: "delegate-task",
      timestamp: Date.now(),
    })

    // Should not throw
    expect(() => registry.refreshTimestamp("nonexistent-call")).not.toThrow()

    // Original entry should still exist
    expect(registry.getByParent("parent-1")).toBeDefined()
  })

  it("removeByCallID still works for cleanup codepaths that need it", () => {
    registry.add({
      parentSessionID: "parent-1",
      callID: "call-1",
      subagentType: "hm-executor",
      tool: "delegate-task",
      timestamp: Date.now(),
    })

    registry.removeByCallID("call-1", "completed")
    expect(registry.getByParent("parent-1")).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Bug D-2: PendingDispatchEntry.model field
// ---------------------------------------------------------------------------
describe("PendingDispatchEntry — Bug D-2: model field", () => {
  it("should store and retrieve model on the entry", () => {
    const registry = new PendingDispatchRegistry()
    registry.add({
      parentSessionID: "parent-1",
      callID: "call-1",
      subagentType: "hm-executor",
      tool: "delegate-task",
      timestamp: Date.now(),
      model: "claude-sonnet-4-20250514",
    })

    const found = registry.getByParent("parent-1")
    expect(found).toBeDefined()
    expect(found![0].model).toBe("claude-sonnet-4-20250514")
  })

  it("model should be undefined when not provided", () => {
    const registry = new PendingDispatchRegistry()
    registry.add({
      parentSessionID: "parent-1",
      callID: "call-1",
      subagentType: "hm-executor",
      tool: "delegate-task",
      timestamp: Date.now(),
    })

    const found = registry.getByParent("parent-1")
    expect(found).toBeDefined()
    expect(found![0].model).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Bug D-2: ChildWriter delegation context
// ---------------------------------------------------------------------------
describe("ChildWriter delegation context — Bug D-2", () => {
  // We test the delegation context map methods via a lightweight approach:
  // create a ChildWriter with minimal deps and test set/get.

  it("should store and retrieve delegation context", async () => {
    // Dynamic import to avoid side effects
    const { ChildWriter } = await import("../../../src/features/session-tracker/persistence/child-writer.js")

    const mockDeps = {
      projectRoot: "/tmp/test-project",
      hierarchyIndex: { registerChild: vi.fn(), getDepth: vi.fn().mockReturnValue(1), getRootMain: vi.fn() },
      retryQueue: { enqueue: vi.fn(), process: vi.fn() },
    }

    const writer = new ChildWriter(mockDeps as any)

    // Set delegation context
    writer.setDelegationContext("child-1", {
      agentName: "hm-executor",
      model: "claude-sonnet-4-20250514",
    })

    // Retrieve it
    const ctx = writer.getDelegationContext("child-1")
    expect(ctx).toBeDefined()
    expect(ctx!.agentName).toBe("hm-executor")
    expect(ctx!.model).toBe("claude-sonnet-4-20250514")
  })

  it("should return undefined for unknown child session", async () => {
    const { ChildWriter } = await import("../../../src/features/session-tracker/persistence/child-writer.js")

    const mockDeps = {
      projectRoot: "/tmp/test-project",
      hierarchyIndex: { registerChild: vi.fn(), getDepth: vi.fn().mockReturnValue(1), getRootMain: vi.fn() },
      retryQueue: { enqueue: vi.fn(), process: vi.fn() },
    }

    const writer = new ChildWriter(mockDeps as any)
    const ctx = writer.getDelegationContext("nonexistent")
    expect(ctx).toBeUndefined()
  })

  it("should overwrite delegation context on second set", async () => {
    const { ChildWriter } = await import("../../../src/features/session-tracker/persistence/child-writer.js")

    const mockDeps = {
      projectRoot: "/tmp/test-project",
      hierarchyIndex: { registerChild: vi.fn(), getDepth: vi.fn().mockReturnValue(1), getRootMain: vi.fn() },
      retryQueue: { enqueue: vi.fn(), process: vi.fn() },
    }

    const writer = new ChildWriter(mockDeps as any)

    writer.setDelegationContext("child-1", { agentName: "first" })
    writer.setDelegationContext("child-1", { agentName: "second", model: "gpt-4o" })

    const ctx = writer.getDelegationContext("child-1")
    expect(ctx!.agentName).toBe("second")
    expect(ctx!.model).toBe("gpt-4o")
  })
})

// ---------------------------------------------------------------------------
// Bug D-2: ChildRecorder uses delegation context fallback
// ---------------------------------------------------------------------------
describe("ChildRecorder — Bug D-2: delegation context fallback", () => {
  let mockChildWriter: {
    appendChildTurn: ReturnType<typeof vi.fn>
    appendJourneyEntry: ReturnType<typeof vi.fn>
    getDelegationContext: ReturnType<typeof vi.fn>
  }
  let recorder: ChildRecorder
  let deps: ChildRecorderDeps

  beforeEach(() => {
    mockChildWriter = {
      appendChildTurn: vi.fn().mockResolvedValue(undefined),
      appendJourneyEntry: vi.fn().mockResolvedValue(undefined),
      getDelegationContext: vi.fn().mockReturnValue(undefined),
    }

    deps = {
      childWriter: mockChildWriter as unknown as ChildWriter,
      bootstrappedSessions: new Set(),
      ensureChildRoute: vi.fn().mockResolvedValue(undefined),
    }

    recorder = new ChildRecorder(deps)
  })

  it("falls back to 'unknown' when no agent and no delegation context", async () => {
    const input: ChildMessageInput = {
      sessionID: "child-1",
      // agent intentionally omitted
    }
    const output: ChildMessageOutput = {
      message: { role: "assistant" },
      parts: [{ type: "text", text: "Hello" }],
    }

    // Bootstrap so route exists
    deps.bootstrappedSessions.add("child-1")

    await recorder.recordChildMessage("parent-1", "child-1", input, output)

    // Actor should be "unknown" — no agent, no delegation context
    expect(mockChildWriter.appendChildTurn).toHaveBeenCalledWith(
      "parent-1",
      "child-1",
      expect.objectContaining({ actor: "unknown" }),
    )
  })

  it("uses delegation context agent when hook payload has no agent", async () => {
    mockChildWriter.getDelegationContext = vi.fn().mockReturnValue({
      agentName: "hm-researcher",
      model: "claude-sonnet-4-20250514",
    })

    const input: ChildMessageInput = {
      sessionID: "child-1",
      // agent intentionally omitted to trigger delegation context fallback
    }
    const output: ChildMessageOutput = {
      message: { role: "assistant" },
      parts: [{ type: "text", text: "Research done" }],
    }

    deps.bootstrappedSessions.add("child-1")
    await recorder.recordChildMessage("parent-1", "child-1", input, output)

    expect(mockChildWriter.appendChildTurn).toHaveBeenCalledWith(
      "parent-1",
      "child-1",
      expect.objectContaining({ actor: "hm-researcher" }),
    )

    // Journey entry should also use delegation context
    expect(mockChildWriter.appendJourneyEntry).toHaveBeenCalledWith(
      "parent-1",
      "child-1",
      expect.objectContaining({
        metadata: expect.objectContaining({
          actor: "hm-researcher",
          model: "claude-sonnet-4-20250514",
        }),
      }),
    )
  })

  it("prefers hook payload agent over delegation context", async () => {
    mockChildWriter.getDelegationContext = vi.fn().mockReturnValue({
      agentName: "hm-researcher",
      model: "gpt-4o",
    })

    const input: ChildMessageInput = {
      sessionID: "child-1",
      agent: "hm-debug",
      model: "claude-3.5",
    }
    const output: ChildMessageOutput = {
      message: { role: "assistant" },
      parts: [{ type: "text", text: "Fixed" }],
    }

    deps.bootstrappedSessions.add("child-1")
    await recorder.recordChildMessage("parent-1", "child-1", input, output)

    // Should use the hook payload agent, not delegation context
    expect(mockChildWriter.appendChildTurn).toHaveBeenCalledWith(
      "parent-1",
      "child-1",
      expect.objectContaining({ actor: "hm-debug" }),
    )

    expect(mockChildWriter.appendJourneyEntry).toHaveBeenCalledWith(
      "parent-1",
      "child-1",
      expect.objectContaining({
        metadata: expect.objectContaining({
          actor: "hm-debug",
          model: "claude-3.5",
        }),
      }),
    )
  })

  it("uses delegation context model when hook model is empty", async () => {
    mockChildWriter.getDelegationContext = vi.fn().mockReturnValue({
      agentName: "hm-executor",
      model: "claude-sonnet-4-20250514",
    })

    const input: ChildMessageInput = {
      sessionID: "child-1",
      agent: "hm-executor",
      // model intentionally omitted
    }
    const output: ChildMessageOutput = {
      message: { role: "assistant" },
      parts: [{ type: "text", text: "Done" }],
    }

    deps.bootstrappedSessions.add("child-1")
    await recorder.recordChildMessage("parent-1", "child-1", input, output)

    expect(mockChildWriter.appendJourneyEntry).toHaveBeenCalledWith(
      "parent-1",
      "child-1",
      expect.objectContaining({
        metadata: expect.objectContaining({
          model: "claude-sonnet-4-20250514",
        }),
      }),
    )
  })
})
