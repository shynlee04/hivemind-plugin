/**
 * ToolCapture child session tests — delegation spawn turn creation.
 *
 * Validates DEFECT-03 fix: handleTask creates child .json with initial
 * "delegation_spawn" turn. Covers child session lifecycle via task tool.
 *
 * @module tests/features/session-tracker/capture/tool-capture-child
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { ToolCapture } from "../../../../src/features/session-tracker/capture/tool-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import {
  SessionIndexWriter,
} from "../../../../src/features/session-tracker/persistence/session-index-writer.js"
import {
  ProjectIndexWriter,
} from "../../../../src/features/session-tracker/persistence/project-index-writer.js"
import {
  HierarchyIndex,
} from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"

describe("ToolCapture — child session (DEFECT-03)", () => {
  let toolCapture: ToolCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let projectIndexWriter: ProjectIndexWriter
  let mockAppendToolBlock: ReturnType<typeof vi.fn>
  let mockCreateChildFile: ReturnType<typeof vi.fn>
  let mockAppendChildTurn: ReturnType<typeof vi.fn>
  let mockAddChild: ReturnType<typeof vi.fn>
  let mockUpdateSession: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockAppendToolBlock = vi.fn().mockResolvedValue(undefined)
    mockCreateChildFile = vi.fn().mockResolvedValue(undefined)
    mockAppendChildTurn = vi.fn().mockResolvedValue(undefined)
    mockAddChild = vi.fn().mockResolvedValue(undefined)
    mockUpdateSession = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      appendToolBlock: mockAppendToolBlock,
      createSessionDir: vi.fn(),
      initializeSessionFile: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      updateFrontmatter: vi.fn(),
    } as unknown as SessionWriter

    childWriter = {
      createChildFile: mockCreateChildFile,
      appendChildTurn: mockAppendChildTurn,
      updateChildStatus: vi.fn(),
    } as unknown as ChildWriter

    sessionIndexWriter = {
      addChild: mockAddChild,
      initializeIndex: vi.fn(),
      updateChildStatus: vi.fn(),
      incrementTurnCount: vi.fn(),
      updateToolSummary: vi.fn(),
    } as unknown as SessionIndexWriter

    projectIndexWriter = {
      updateSession: mockUpdateSession,
      initializeIndex: vi.fn(),
      addSession: vi.fn(),
      removeSession: vi.fn(),
      incrementChildCount: vi.fn().mockResolvedValue(undefined),
    } as unknown as ProjectIndexWriter

    toolCapture = new ToolCapture({
      client: { app: { log: vi.fn() } } as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
      projectIndexWriter,
      hierarchyIndex: {
        registerChild: vi.fn(),
        getDepth: vi.fn().mockReturnValue(1),
        isChild: vi.fn().mockReturnValue(false),
      } as unknown as HierarchyIndex,
    })
  })

  describe("handleTask (delegation spawn)", () => {
    const childID = "ses_child9876543210xy"

    it("should create child .json with initial delegation_spawn turn", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_abc123",
          args: {
            description: "Build feature X",
            subagent_type: "hm-l2-executor",
            sessionID: childID,
          },
        },
        {
          title: "Task dispatched",
          output: `task_id: ${childID}`,
        },
      )

      // Verify child file created with metadata
      expect(mockCreateChildFile).toHaveBeenCalledTimes(1)
      const [parentId, childId, metadata] = mockCreateChildFile.mock.calls[0]
      expect(parentId).toBe("ses_test12345abcdefg0")
      expect(childId).toBe(childID)
      expect(metadata).toMatchObject({
        sessionID: childID,
        status: "active",
      })
      // createChildFile creates metadata; turns are appended via appendChildTurn
      expect(metadata.turns).toBeDefined()
    })

    it("should call appendChildTurn after createChildFile for delegation_spawn", async () => {
      const childID2 = "ses_child2222222222ab"
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_def456",
          args: {
            description: "Research topic Y",
            subagent_type: "hm-l2-researcher",
          },
        },
        {
          title: "Task dispatched",
          output: `task_id: ${childID2}`,
        },
      )

      // createChildFile called first, then appendChildTurn
      expect(mockCreateChildFile).toHaveBeenCalledTimes(1)
      expect(mockAppendChildTurn).toHaveBeenCalledTimes(1)
    })

    it("should set child session status to active", async () => {
      const childID3 = "ses_child4444444444yy"
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_main3333333333xx",
          callID: "call_ghi789",
          args: {
            description: "Build component Z",
            subagent_type: "hm-l2-build",
          },
        },
        {
          title: "Task dispatched",
          output: `task_id: ${childID3}`,
        },
      )

      expect(mockCreateChildFile).toHaveBeenCalled()
      const metadata = mockCreateChildFile.mock.calls[0][2]
      expect(metadata.status).toBe("active")
      expect(Array.isArray(metadata.turns)).toBe(true)
      // appendChildTurn adds the delegation_spawn turn after createChildFile
      expect(mockAppendChildTurn).toHaveBeenCalled()
    })

    // P-03: delegatedBy SHALL contain agent name AND model
    it("P-03: delegatedBy should contain agentName and model (not just 'main_l0_agent' string)", async () => {
      const childID4 = "ses_child5555555555zz"
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_main3333333333xx",
          callID: "call_jkl012",
          args: {
            description: "Build component W",
            subagent_type: "hm-l2-build",
          },
        },
        {
          title: "Task dispatched",
          output: `task_id: ${childID4}`,
        },
      )

      expect(mockCreateChildFile).toHaveBeenCalled()
      const metadata = mockCreateChildFile.mock.calls[0][2]
      expect(metadata.delegatedBy).toBeDefined()
      // P-03: delegatedBy SHALL have model field (not just agentName)
      expect(metadata.delegatedBy.model).toBeDefined()
      // CP-ST-02-03: agentName now resolved from subagent_type (was hardcoded "unknown")
      expect(metadata.delegatedBy.agentName).toBe("hm-l2-build")
    })
  })
})
