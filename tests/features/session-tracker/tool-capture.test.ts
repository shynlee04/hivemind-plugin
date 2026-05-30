/**
 * ToolCapture tests — delegator attribution via PendingDispatchRegistry.
 *
 * @module tests/features/session-tracker/tool-capture
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { ToolCapture } from "../../../src/features/session-tracker/capture/tool-capture.js"
import { PendingDispatchRegistry } from "../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"
import type { ChildSessionRecord } from "../../../src/features/session-tracker/types.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates mock deps with spies on all writers. */
function createMockDeps(pendingRegistry?: PendingDispatchRegistry) {
  const createChildFileSpy = vi.fn().mockResolvedValue(undefined)
  const appendChildTurnSpy = vi.fn().mockResolvedValue(undefined)
  const addChildSpy = vi.fn().mockResolvedValue(undefined)
  const incrementChildCountSpy = vi.fn().mockResolvedValue(undefined)
  const addSessionSpy = vi.fn().mockResolvedValue(undefined)
  const updateToolSummarySpy = vi.fn().mockResolvedValue(undefined)
  const appendToolBlockSpy = vi.fn().mockResolvedValue(undefined)
  const registerChildSpy = vi.fn()
  const getDepthSpy = vi.fn().mockReturnValue(1)
  const isChildSpy = vi.fn().mockReturnValue(false)

  return {
    deps: {
      client: {
        app: { log: vi.fn() },
      } as any,
      sessionWriter: {
        appendToolBlock: appendToolBlockSpy,
      } as any,
      childWriter: {
        createChildFile: createChildFileSpy,
        appendChildTurn: appendChildTurnSpy,
      } as any,
      sessionIndexWriter: {
        updateToolSummary: updateToolSummarySpy,
        addChild: addChildSpy,
      } as any,
      projectIndexWriter: {
        incrementChildCount: incrementChildCountSpy,
        addSession: addSessionSpy,
        initializeIndex: vi.fn(),
      } as any,
      hierarchyIndex: {
        registerChild: registerChildSpy,
        getDepth: getDepthSpy,
        isChild: isChildSpy,
      } as any,
      pendingRegistry,
    },
    spies: {
      createChildFile: createChildFileSpy,
      appendChildTurn: appendChildTurnSpy,
      addChild: addChildSpy,
      incrementChildCount: incrementChildCountSpy,
      addSession: addSessionSpy,
      updateToolSummary: updateToolSummarySpy,
      appendToolBlock: appendToolBlockSpy,
      registerChild: registerChildSpy,
      getDepth: getDepthSpy,
      isChild: isChildSpy,
    },
  }
}

/** Creates a task tool input/output pair with a child session ID. */
function taskWithChild(childSessionID: string, subagentType = "hm-l2-researcher") {
  return {
    input: {
      tool: "task",
      sessionID: "ses_parent1234567890ab",
      callID: "call_test1234567890ab",
      args: {
        description: "Investigate login bug",
        subagent_type: subagentType,
      },
    } as any,
    output: {
      output: `task_id: ${childSessionID}`,
    } as any,
  }
}

/** Extracts the first call to createChildFile and returns its childMetadata arg. */
function getChildMetadata(spy: ReturnType<typeof vi.fn>): ChildSessionRecord | undefined {
  const calls = spy.mock.calls
  for (const call of calls) {
    // createChildFile(parentID, childID, metadata)
    if (call.length >= 3) return call[2] as ChildSessionRecord
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ToolCapture — delegator attribution (agentName resolution)", () => {
  let pendingRegistry: PendingDispatchRegistry

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("AgentName from PendingDispatchRegistry (primary source)", () => {
    it("should use PendingDispatchRegistry agentName when entry exists (REGISTRY)", async () => {
      // Arrange: pre-register child in pending registry with known subagentType
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child0000000000aa"
      pendingRegistry.add({
        parentSessionID: "ses_parent1234567890ab",
        callID: "call_test1234567890ab",
        subagentType: "hm-l2-investigator",
        timestamp: Date.now(),
      })
      // Simulate discovery: update with real child ID
      pendingRegistry.updateWithChildID("call_test1234567890ab", childID)

      const { deps, spies } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID, "hm-l2-researcher")
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      expect(meta).toBeDefined()
      expect(meta!.delegatedBy.agentName).toBe("hm-l2-investigator")
    })

    it("should use PendingDispatchRegistry agentName even when args.subagent_type differs (REGISTRY)", async () => {
      // Arrange: registry has different (more accurate) agent name than args
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child1111111111bb"
      pendingRegistry.add({
        parentSessionID: "ses_parent1234567890ab",
        callID: "call_test1234567890ab",
        subagentType: "gsd-planner",
        timestamp: Date.now(),
      })
      pendingRegistry.updateWithChildID("call_test1234567890ab", childID)

      const { deps, spies } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID, "gsd-executor")
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      expect(meta!.delegatedBy.agentName).toBe("gsd-planner")
    })

    it("should refresh pendingRegistry entry after child record creation (Bug D-1: no premature removal)", async () => {
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child2222222222cc"
      pendingRegistry.add({
        parentSessionID: "ses_parent1234567890ab",
        callID: "call_test1234567890ab",
        subagentType: "hm-l2-reviewer",
        timestamp: Date.now() - 1000,
      })
      pendingRegistry.updateWithChildID("call_test1234567890ab", childID)

      const beforeTimestamp = pendingRegistry.get(childID)!.timestamp

      const { deps } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID)
      await (capture as any).handleTask(input, output)

      // Bug D-1: entry stays alive via refreshTimestamp instead of premature remove
      expect(pendingRegistry.has(childID)).toBe(true)
      expect(pendingRegistry.size).toBe(1)
      // Timestamp should have been refreshed (>= before)
      expect(pendingRegistry.get(childID)!.timestamp).toBeGreaterThanOrEqual(beforeTimestamp)
    })
  })

  describe("AgentName fallback to args.subagent_type", () => {
    it("should fall back to args.subagent_type when registry has no entry (ARGS)", async () => {
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child3333333333dd"

      const { deps, spies } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID, "hm-l2-debugger")
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      expect(meta!.delegatedBy.agentName).toBe("hm-l2-debugger")
    })
  })

  describe("AgentName fallback to 'unknown'", () => {
    it("should fall back to 'unknown' when both registry and args are empty (UNKNOWN)", async () => {
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child4444444444ee"

      const { deps, spies } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID, "")
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      expect(meta!.delegatedBy.agentName).toBe("unknown")
    })

    it("should fall back to 'unknown' when no pendingRegistry is provided (UNKNOWN)", async () => {
      const childID = "ses_child5555555555ff"

      // No pendingRegistry in deps
      const { deps, spies } = createMockDeps(undefined)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID, "")
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      expect(meta!.delegatedBy.agentName).toBe("unknown")
    })
  })

  describe("Delegated by field stability", () => {
    it("should preserve delegatedBy.model as 'unknown' (MODEL)", async () => {
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child6666666666gg"
      pendingRegistry.add({
        parentSessionID: "ses_parent1234567890ab",
        callID: "call_test1234567890ab",
        subagentType: "hm-l2-architect",
        timestamp: Date.now(),
      })
      pendingRegistry.updateWithChildID("call_test1234567890ab", childID)

      const { deps, spies } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID)
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      expect(meta!.delegatedBy.model).toBe("unknown")
    })

    it("should preserve delegatedBy.tool as 'task' (TOOL)", async () => {
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child7777777777hh"
      pendingRegistry.add({
        parentSessionID: "ses_parent1234567890ab",
        callID: "call_test1234567890ab",
        subagentType: "hm-l2-writer",
        timestamp: Date.now(),
      })
      pendingRegistry.updateWithChildID("call_test1234567890ab", childID)

      const { deps, spies } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID)
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      expect(meta!.delegatedBy.tool).toBe("task")
    })

    it("should preserve delegatedBy.subagentType raw value (SUBAGENT_TYPE_PRESERVED)", async () => {
      pendingRegistry = new PendingDispatchRegistry()
      const childID = "ses_child8888888888ii"
      pendingRegistry.add({
        parentSessionID: "ses_parent1234567890ab",
        callID: "call_test1234567890ab",
        subagentType: "hf-l2-meta-builder",
        timestamp: Date.now(),
      })
      pendingRegistry.updateWithChildID("call_test1234567890ab", childID)

      const { deps, spies } = createMockDeps(pendingRegistry)
      const capture = new ToolCapture(deps)

      const { input, output } = taskWithChild(childID, "gsd-planner")
      await (capture as any).handleTask(input, output)

      const meta = getChildMetadata(spies.createChildFile)
      // subagentType in delegatedBy should be the raw args value, NOT the registry value
      expect(meta!.delegatedBy.subagentType).toBe("gsd-planner")
    })
  })
})
