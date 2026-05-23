/**
 * EventCapture compaction handling tests (D-10).
 *
 * Validates that session.compacted events are correctly captured as
 * ## COMPACTED blocks in the session .md file with timestamp and
 * references to session-continuity.json.
 *
 * @module tests/features/session-tracker/capture/event-capture-compaction
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventCapture } from "../../../../src/features/session-tracker/capture/event-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"

// Mock the session-api module
vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

describe("EventCapture — compaction handling (D-10)", () => {
  let eventCapture: EventCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let mockAppendCompactionBlock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockAppendCompactionBlock = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      appendCompactionBlock: mockAppendCompactionBlock,
      createSessionDir: vi.fn(),
      initializeSessionFile: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
      updateFrontmatter: vi.fn(),
    } as unknown as SessionWriter

    childWriter = {
      updateChildStatus: vi.fn(),
      createChildFile: vi.fn(),
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
    })
  })

  describe("session.compacted", () => {
    it("should write ## COMPACTED block with timestamp", async () => {
      await eventCapture.handleSessionEvent({
        eventType: "session.compacted",
        sessionID: "ses_main1111111111aa",
        event: { trigger: "context-budget", compactedAt: "2026-05-12T00:00:00Z" },
      })

      expect(mockAppendCompactionBlock).toHaveBeenCalledTimes(1)
      const [sessionId, section] = mockAppendCompactionBlock.mock.calls[0]
      expect(sessionId).toBe("ses_main1111111111aa")
      // Should contain ## COMPACTED header
      expect(section).toContain("## COMPACTED")
      // Should contain timestamp
      expect(section).toMatch(/COMPACTED \(2\d{3}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      // Should reference session-continuity.json
      expect(section).toContain("session-continuity.json")
    })

    it("should include pre-compaction state reference", async () => {
      await eventCapture.handleSessionEvent({
        eventType: "session.compacted",
        sessionID: "ses_main2222222222bb",
        event: {},
      })

      expect(mockAppendCompactionBlock).toHaveBeenCalled()
      const section = mockAppendCompactionBlock.mock.calls[0][1]
      expect(section).toContain("Pre-compaction state preserved")
      expect(section).toContain("active delegations")
    })

    it("should not throw for unrecognized compaction event shape (graceful fallback)", async () => {
      // Even with null event data, compaction handler should not throw
      await expect(
        eventCapture.handleSessionEvent({
          eventType: "session.compacted",
          sessionID: "ses_main3333333333cc",
          event: null,
        }),
      ).resolves.toBeUndefined()

      expect(mockAppendCompactionBlock).toHaveBeenCalled()
      expect(mockAppendCompactionBlock.mock.calls[0][1]).toContain("## COMPACTED")
    })

    it("should extract nested compaction summary (e.g. info.summary)", async () => {
      await eventCapture.handleSessionEvent({
        eventType: "session.compacted",
        sessionID: "ses_main_compact_nested",
        event: {
          trigger: "context-budget",
          info: {
            summary: "Compacted 10 user messages into a 1-sentence summary.",
          },
        },
      })

      expect(mockAppendCompactionBlock).toHaveBeenCalled()
      // get the last call
      const lastCall = mockAppendCompactionBlock.mock.calls[mockAppendCompactionBlock.mock.calls.length - 1]
      expect(lastCall[0]).toBe("ses_main_compact_nested")
      expect(lastCall[1]).toContain("Compacted 10 user messages into a 1-sentence summary.")
    })
  })
})
