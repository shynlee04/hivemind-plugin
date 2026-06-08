/**
 * ToolCapture tests — tool metadata capture with per-tool pruning rules.
 *
 * @module tests/features/session-tracker/capture/tool-capture
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

describe("ToolCapture", () => {
  let toolCapture: ToolCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let projectIndexWriter: ProjectIndexWriter
  let mockAppendToolBlock: ReturnType<typeof vi.fn>
  let mockCreateChildFile: ReturnType<typeof vi.fn>
  let mockAddChild: ReturnType<typeof vi.fn>
  let mockIncrementChildCount: ReturnType<typeof vi.fn>
  let mockRegisterChild: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockAppendToolBlock = vi.fn().mockResolvedValue(undefined)
    mockCreateChildFile = vi.fn().mockResolvedValue(undefined)
    mockAddChild = vi.fn().mockResolvedValue(undefined)
    mockIncrementChildCount = vi.fn().mockResolvedValue(undefined)
    mockRegisterChild = vi.fn()

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
      updateChildStatus: vi.fn(),
      appendChildTurn: vi.fn(),
    } as unknown as ChildWriter

    sessionIndexWriter = {
      addChild: mockAddChild,
      initializeIndex: vi.fn(),
      updateChildStatus: vi.fn(),
      incrementTurnCount: vi.fn(),
      updateToolSummary: vi.fn(),
    } as unknown as SessionIndexWriter

    projectIndexWriter = {
      incrementChildCount: mockIncrementChildCount,
      initializeIndex: vi.fn(),
      addSession: vi.fn(),
      removeSession: vi.fn(),
    } as unknown as ProjectIndexWriter

    toolCapture = new ToolCapture({
      client: { app: { log: vi.fn() } } as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
      projectIndexWriter,
      hierarchyIndex: {
        registerChild: mockRegisterChild,
        getDepth: vi.fn().mockReturnValue(1),
        isChild: vi.fn().mockReturnValue(false),
      } as unknown as HierarchyIndex,
      sessionRouter: { route: vi.fn().mockResolvedValue({ route: "main" }) } as any,
    })
  })

  describe("skill tool", () => {
    it("should capture skill name and first header line", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "skill",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_abc",
          args: { name: "hm-l2-coordinating-loop" },
        },
        {
          title: "Skill loaded",
          output: "# Skill: hm-l2-coordinating-loop\n\nBundled resource...",
          metadata: {},
        },
      )

      expect(mockAppendToolBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "skill",
        { name: "hm-l2-coordinating-loop" },
        "# Skill: hm-l2-coordinating-loop",
        undefined,
      )
    })

    it("should handle skill with no header in output", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "skill",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_abc",
          args: { name: "hm-l2-coordinating-loop" },
        },
        {
          title: "Skill loaded",
          output: "No markdown headers here",
          metadata: {},
        },
      )

      expect(mockAppendToolBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "skill",
        { name: "hm-l2-coordinating-loop" },
        undefined,
        undefined,
      )
    })

    it("should handle skill with missing args", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "skill",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_abc",
          args: {} as any,
        },
        {
          title: "",
          output: "# Some skill",
          metadata: {},
        },
      )

      expect(mockAppendToolBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "skill",
        { name: undefined },
        "# Some skill",
        undefined,
      )
    })
  })

  describe("read tool", () => {
    it("should capture file path only, never content", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "read",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_def",
          args: { filePath: "/path/to/file.ts" },
        },
        {
          title: "Read successful",
          output: "actual file content here...",
          metadata: {},
        },
      )

      expect(mockAppendToolBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "read",
        { filePath: "/path/to/file.ts" },
        undefined,
        undefined,
      )

      // Verify file content is NEVER captured
      const callArgs = mockAppendToolBlock.mock.calls[0]
      expect(callArgs[3]).toBeUndefined() // outputPruned must be undefined
      expect(JSON.stringify(callArgs)).not.toContain("actual file content")
    })

    it("should capture read error via metadata (not file content)", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "read",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_def",
          args: { filePath: "/nonexistent/file.ts" },
        },
        {
          title: "Read failed",
          output: "actual file content would be here",
          metadata: { error: "ENOENT: no such file or directory", status: "error" },
        },
      )

      expect(mockAppendToolBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "read",
        { filePath: "/nonexistent/file.ts" },
        undefined,
        "File read failed", // Fixed string — never passes file content
      )
    })
  })

  describe("task tool", () => {
    it("should create child .json and update indices for task delegation", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_parent12345abcdef",
          callID: "call_ghi",
          args: {
            description: "Investigate event tracker bugs",
            subagent_type: "hm-l2-investigator",
          },
        },
        {
          title: "Task dispatched",
          output: "task_id: ses_child123456789ab",
          metadata: {},
        },
      )

      // Should create child file
      expect(mockCreateChildFile).toHaveBeenCalledWith(
        "ses_parent12345abcdef",
        "ses_child123456789ab",
        expect.objectContaining({
          sessionID: "ses_child123456789ab",
          parentSessionID: "ses_parent12345abcdef",
          delegationDepth: 1,
          delegatedBy: expect.objectContaining({
            description: "Investigate event tracker bugs",
            subagentType: "hm-l2-investigator",
          }),
        }),
      )

      // Should update session index
      expect(mockAddChild).toHaveBeenCalledWith(
        "ses_parent12345abcdef",
        "ses_child123456789ab",
        expect.any(String),
        1,
        expect.any(String),
      )

      // Should update project index via incrementChildCount (with depth)
      expect(mockIncrementChildCount).toHaveBeenCalledWith(
        "ses_parent12345abcdef",
        1,
      )

      // Should update global hierarchy index
      expect(mockRegisterChild).toHaveBeenCalledWith(
        "ses_parent12345abcdef",
        "ses_child123456789ab",
      )
    })

    it("should handle task with no task_id in output", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_parent12345abcdef",
          callID: "call_jkl",
          args: {
            description: "Test task",
            subagent_type: "hm-l2-investigator",
          },
        },
        {
          title: "Task dispatched",
          output: "No task_id found",
          metadata: {},
        },
      )

      // Should NOT create child file without a task_id
      expect(mockCreateChildFile).not.toHaveBeenCalled()
      expect(mockAppendToolBlock).toHaveBeenCalled()
    })
  })

  describe("other tools", () => {
    it("should capture metadata only for unknown tools", async () => {
      await toolCapture.handleToolExecuteAfter(
        {
          tool: "bash",
          sessionID: "ses_test12345abcdefg0",
          callID: "call_mno",
          args: { command: "ls -la" },
        },
        {
          title: "Command executed",
          output: "total 48\ndrwxr-xr-x...",
          metadata: {},
        },
      )

      expect(mockAppendToolBlock).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        "bash",
        { callID: "call_mno" },
        undefined,
        undefined,
      )
    })
  })

  describe("graceful failure", () => {
    it("should not throw on malformed input", async () => {
      await expect(
        toolCapture.handleToolExecuteAfter(
          { tool: "", sessionID: "", callID: "", args: null as any },
          { title: "", output: null as any, metadata: null as any },
        ),
      ).resolves.toBeUndefined()
    })

    it("should not throw when childWriter fails", async () => {
      mockCreateChildFile.mockRejectedValue(new Error("Write error"))

      await expect(
        toolCapture.handleToolExecuteAfter(
          {
            tool: "task",
            sessionID: "ses_parent12345abcdef",
            callID: "call_pqr",
            args: { description: "Test", subagent_type: "test" },
          },
          {
            title: "Task",
            output: "task_id: ses_child123456789ab",
            metadata: {},
          },
        ),
      ).resolves.toBeUndefined()
    })
  })
})
