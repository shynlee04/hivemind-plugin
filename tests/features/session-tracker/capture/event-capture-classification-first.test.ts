/**
 * EventCapture classification-first flow tests (CP-ST-05-01, Task 2).
 *
 * Validates that handleSessionCreated() checks the pending dispatch registry
 * FIRST (Gate 0) before any SDK calls or directory creation, using the
 * PreToolUse classification record to immediately write child .json files.
 *
 * @module tests/features/session-tracker/capture/event-capture-classification-first
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventCapture } from "../../../../src/features/session-tracker/capture/event-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"
import { PendingDispatchRegistry } from "../../../../src/features/session-tracker/persistence/pending-dispatch-registry.js"

// Mock the session-api module
vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

describe("EventCapture — classification-first flow (CP-ST-05-01 Task 2)", () => {
  let eventCapture: EventCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let registry: PendingDispatchRegistry
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockCreateChildFile: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    registry = new PendingDispatchRegistry()

    mockCreateSessionDir = vi.fn().mockResolvedValue(undefined)
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockCreateChildFile = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
      updateFrontmatter: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
      appendCompactionBlock: vi.fn(),
    } as unknown as SessionWriter

    childWriter = {
      createChildFile: mockCreateChildFile,
      updateChildStatus: vi.fn(),
      appendChildTurn: vi.fn(),
    } as unknown as ChildWriter

    sessionIndexWriter = {
      updateChildStatus: vi.fn(),
      addChild: vi.fn(),
      initializeIndex: vi.fn(),
      incrementTurnCount: vi.fn(),
      updateToolSummary: vi.fn(),
    } as unknown as SessionIndexWriter

    eventCapture = new EventCapture({
      client: {} as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
      pendingRegistry: registry,
    })
  })

  describe("handleSessionCreated — Gate 0: pending registry classification", () => {
    it("writes .json immediately when pending registry has active dispatches", async () => {
      // Simulate: PreToolUse hook recorded a task dispatch before session.created fired
      registry.add({
        parentSessionID: "ses_parent123456789ab",
        callID: "pretooluse-12345-abc",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
        delegationDepth: 1,
      })

      // SDK returns null parentID (race condition — parentID not yet available)
      mockGetSession.mockResolvedValue({
        id: "ses_child9999999999zz",
        parentID: null,
        title: "Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child9999999999zz",
        event: {},
      })

      // Child .json should be written via childWriter
      expect(mockCreateChildFile).toHaveBeenCalled()
      // No directory should be created
      expect(mockCreateSessionDir).not.toHaveBeenCalled()
    })

    it("uses delegationDepth from pending entry when writing child file", async () => {
      registry.add({
        parentSessionID: "ses_parent123456789ab",
        callID: "pretooluse-12345-abc",
        subagentType: "hm-l2-researcher",
        timestamp: Date.now(),
        delegationDepth: 2,
      })

      mockGetSession.mockResolvedValue({
        id: "ses_child8888888888yy",
        parentID: null,
        title: "L2 Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child8888888888yy",
        event: {},
      })

      const callArgs = (mockCreateChildFile as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(callArgs[2].delegationDepth).toBe(2)
    })

    it("classifies as child when 2+ consecutive dispatches exist (pendingCount > 1)", async () => {
      // Reproduces the bug: when parent dispatches 2+ tasks consecutively within
      // 1-2 seconds, both PreToolUse entries exist in the registry before any
      // session.created fires. Gate 0 must STILL classify as child.
      registry.add({
        parentSessionID: "ses_parent",
        callID: "pretooluse-task1",
        subagentType: "gsd-researcher",
        timestamp: Date.now(),
        delegationDepth: 1,
      })
      registry.add({
        parentSessionID: "ses_parent",
        callID: "pretooluse-task2",
        subagentType: "gsd-researcher",
        timestamp: Date.now(),
        delegationDepth: 1,
      })

      // pendingCount is now 2
      mockGetSession.mockResolvedValue({
        id: "ses_child_consecutive",
        parentID: null,
        title: "Consecutive Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child_consecutive",
        event: {},
      })

      // Gate 0 must still classify as child — write .json, NO root dir
      expect(mockCreateChildFile).toHaveBeenCalled()
      expect(mockCreateSessionDir).not.toHaveBeenCalled()
    })

    it("classifies as child when 3+ consecutive dispatches exist (pendingCount > 2)", async () => {
      // Edge case: 3+ tasks dispatched in rapid succession
      registry.add({
        parentSessionID: "ses_parent_3",
        callID: "pretooluse-task1",
        subagentType: "gsd-researcher",
        timestamp: Date.now(),
        delegationDepth: 1,
      })
      registry.add({
        parentSessionID: "ses_parent_3",
        callID: "pretooluse-task2",
        subagentType: "gsd-researcher",
        timestamp: Date.now(),
        delegationDepth: 1,
      })
      registry.add({
        parentSessionID: "ses_parent_3",
        callID: "pretooluse-task3",
        subagentType: "gsd-researcher",
        timestamp: Date.now(),
        delegationDepth: 1,
      })

      mockGetSession.mockResolvedValue({
        id: "ses_child_3tasks",
        parentID: null,
        title: "3-Task Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child_3tasks",
        event: {},
      })

      // Must still classify as child
      expect(mockCreateChildFile).toHaveBeenCalled()
      expect(mockCreateSessionDir).not.toHaveBeenCalled()
    })

    it("creates directory only when no pending dispatches exist", async () => {
      // No pending dispatches — this is a true root session
      mockGetSession.mockResolvedValue({
        id: "ses_root0000000000aa",
        parentID: null,
        title: "Root Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_root0000000000aa",
        event: {},
      })

      expect(mockCreateSessionDir).toHaveBeenCalled()
      expect(mockCreateChildFile).not.toHaveBeenCalled()
    })
  })
})
