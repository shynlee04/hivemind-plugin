/**
 * SessionTracker tests — session initialization and parentID gate.
 *
 * @module tests/features/session-tracker/session-tracker
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { SessionTracker } from "../../../src/features/session-tracker/index.js"
import type { MessageCapture } from "../../../src/features/session-tracker/capture/message-capture.js"

// Mock the session-api module — getSession is the SDK call used by ensureSessionReady
vi.mock("../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
}))

import { getSession } from "../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

// Mock node:fs/promises for readFile used by copyForkedChildren
vi.mock("node:fs/promises", () => ({
  readFile: vi.fn().mockRejectedValue(new Error("ENOENT: no such file")),
}))

import { readFile } from "node:fs/promises"
const mockReadFile = vi.mocked(readFile)

describe("SessionTracker — ensureSessionReady parentID gate (F-01)", () => {
  let tracker: SessionTracker
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockAddSession: ReturnType<typeof vi.fn>
  let mockHandleSessionEvent: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue("/fake/path/ses_test12345abcdefg0")
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockAddSession = vi.fn().mockResolvedValue(undefined)
    mockHandleSessionEvent = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()

    tracker = new SessionTracker({
      client: {
        app: { log: mockAppLog },
        session: {
          get: mockGetSession,
        },
      } as any,
      projectRoot: "/fake/project",
    })

    // Set up the internal writers so ensureSessionReady doesn't bail early
    // Use array access to reach private fields for test setup
    ;(tracker as any).sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
      updateFrontmatter: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
    }
    ;(tracker as any).projectIndexWriter = {
      addSession: mockAddSession,
      initializeIndex: vi.fn(),
    }
    ;(tracker as any).sessionIndexWriter = {
      addChild: vi.fn(),
    }
    ;(tracker as any).eventCapture = {
      handleSessionEvent: mockHandleSessionEvent,
    }
  })

  describe("parentID gate — child sessions", () => {
    it("should NOT create directory for child sessions (has parentID)", async () => {
      // Arrange: SDK returns a child session (has parentID)
      mockGetSession.mockResolvedValue({
        id: "ses_child1234567890a",
        parentID: "ses_parent9876543210b",
        title: "Child Session",
      })

      // Act: trigger handleSessionEvent which calls ensureSessionReady
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child1234567890a",
        event: {},
      })

      // Assert: must NOT create dir, NOT init file, NOT register
      expect(mockCreateSessionDir).not.toHaveBeenCalled()
      expect(mockInitializeSessionFile).not.toHaveBeenCalled()
      expect(mockAddSession).not.toHaveBeenCalled()
    })

    it("should still delegate to eventCapture even for child sessions", async () => {
      // Arrange
      mockGetSession.mockResolvedValue({
        id: "ses_child1234567890a",
        parentID: "ses_parent9876543210b",
        title: "Child Session",
      })

      // Act
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child1234567890a",
        event: {},
      })

      // Assert: eventCapture should still be called (it handles child events)
      expect(mockHandleSessionEvent).toHaveBeenCalled()
    })
  })

  // F-02: handleSessionEvent no longer calls ensureSessionReady — the eventCapture
  // handles session.created directory creation. Bootstrap now happens through
  // handleChatMessage (lazy) or handleToolExecuteAfter (lazy).
  describe("F-02 — handleSessionEvent delegates to eventCapture only", () => {
    it("should call eventCapture.handleSessionEvent but NOT create dirs (dedup)", async () => {
      // Arrange: SDK returns a root session
      mockGetSession.mockResolvedValue({
        id: "ses_main1234567890ab",
        parentID: null,
        title: "Main Session",
      })

      // Act: session.created event
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_main1234567890ab",
        event: {},
      })

      // Assert: eventCapture called, but NO ensureSessionReady side effects
      expect(mockHandleSessionEvent).toHaveBeenCalled()
      expect(mockCreateSessionDir).not.toHaveBeenCalled()
      expect(mockInitializeSessionFile).not.toHaveBeenCalled()
      expect(mockAddSession).not.toHaveBeenCalled()
    })
  })

  describe("F-02 — lazy bootstrap via handleChatMessage", () => {
    it("should create directory for main sessions via lazy bootstrap (parentID null)", async () => {
      // Arrange: SDK returns a root session
      mockGetSession.mockResolvedValue({
        id: "ses_main1234567890ab",
        parentID: null,
        title: "Main Session",
      })

      // Act: chat message triggers lazy bootstrap
      await tracker.handleChatMessage(
        { sessionID: "ses_main1234567890ab", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user", content: "hello" }, parts: [] },
      )

      // Assert: must create dir, init file, register
      expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_main1234567890ab")
      expect(mockInitializeSessionFile).toHaveBeenCalled()
      expect(mockAddSession).toHaveBeenCalled()
    })

    it("should NOT create directory for child sessions via lazy bootstrap", async () => {
      // Arrange: SDK returns a child session
      mockGetSession.mockResolvedValue({
        id: "ses_child1234567890a",
        parentID: "ses_parent9876543210b",
        title: "Child Session",
      })

      // Act: chat message triggers lazy bootstrap
      await tracker.handleChatMessage(
        { sessionID: "ses_child1234567890a", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user", content: "hello" }, parts: [] },
      )

      // Assert: child sessions skipped
      expect(mockCreateSessionDir).not.toHaveBeenCalled()
      expect(mockInitializeSessionFile).not.toHaveBeenCalled()
      expect(mockAddSession).not.toHaveBeenCalled()
    })
  })

  describe("parentID gate — SDK failure fallback (via handleChatMessage)", () => {
    it("should treat session as main when SDK call fails (conservative fallback)", async () => {
      // Arrange: SDK throws
      mockGetSession.mockRejectedValue(new Error("SDK unavailable"))

      // Act: via lazy bootstrap path
      await tracker.handleChatMessage(
        { sessionID: "ses_fallback3456789012c", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg2", variant: "user" },
        { message: { role: "user", content: "hello" }, parts: [] },
      )

      // Assert: fallback to main-session bootstrap
      expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_fallback3456789012c")
      expect(mockInitializeSessionFile).toHaveBeenCalled()
      expect(mockAddSession).toHaveBeenCalled()
    })
  })

  describe("idempotency (via handleChatMessage lazy bootstrap)", () => {
    it("should not bootstrap the same session twice", async () => {
      // Arrange
      mockGetSession.mockResolvedValue({
        id: "ses_once1234567890def",
        parentID: null,
        title: "Test",
      })

      // Act: call handleChatMessage twice
      await tracker.handleChatMessage(
        { sessionID: "ses_once1234567890def", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user", content: "hello" }, parts: [] },
      )
      await tracker.handleChatMessage(
        { sessionID: "ses_once1234567890def", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg2", variant: "user" },
        { message: { role: "user", content: "world" }, parts: [] },
      )

      // Assert: only bootstrapped once
      expect(mockCreateSessionDir).toHaveBeenCalledTimes(1)
      expect(mockInitializeSessionFile).toHaveBeenCalledTimes(1)
      expect(mockAddSession).toHaveBeenCalledTimes(1)
    })
  })

  // F-05: Child session chat.message routing
  describe("F-05 — handleChatMessage child session routing", () => {
    let mockAppendChildTurn: ReturnType<typeof vi.fn>
    let mockHandleChatMessage: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      // Reset mocks
      vi.clearAllMocks()
      mockAppendChildTurn = vi.fn().mockResolvedValue(undefined)
      mockHandleChatMessage = vi.fn().mockResolvedValue(undefined)

      tracker = new SessionTracker({
        client: {
          app: { log: mockAppLog },
          session: { get: mockGetSession },
        } as any,
        projectRoot: "/fake/project",
      })

      // Set up internal dependencies for handleChatMessage
      ;(tracker as any).sessionWriter = {
        createSessionDir: mockCreateSessionDir,
        initializeSessionFile: mockInitializeSessionFile,
        updateFrontmatter: vi.fn(),
        appendUserTurn: vi.fn(),
        appendAgentBlock: vi.fn(),
        appendToolBlock: vi.fn(),
      }
      ;(tracker as any).projectIndexWriter = {
        addSession: mockAddSession,
        initializeIndex: vi.fn(),
      }
      ;(tracker as any).sessionIndexWriter = {
        addChild: vi.fn(),
      }
      ;(tracker as any).messageCapture = {
        handleChatMessage: mockHandleChatMessage,
      }
      ;(tracker as any).childWriter = {
        appendChildTurn: mockAppendChildTurn,
      }
    })

    it("should route child session chat messages to childWriter.appendChildTurn", async () => {
      // Arrange: SDK returns child session with parentID
      mockGetSession.mockResolvedValue({
        id: "ses_child1234567890x",
        parentID: "ses_parent9876543210y",
        title: "Child Session",
      })

      // Act: chat.message fires for child session
      await tracker.handleChatMessage(
        { sessionID: "ses_child1234567890x", agent: "hm-l2-investigator", model: { providerID: "deepseek", modelID: "v4-pro" }, messageID: "msg1", variant: "user" },
        { message: { role: "user", content: "Investigate this bug" }, parts: [] },
      )

      // Assert: child message routed to childWriter
      expect(mockAppendChildTurn).toHaveBeenCalledWith(
        "ses_parent9876543210y",
        "ses_child1234567890x",
        expect.objectContaining({
          actor: "hm-l2-investigator",
          content: expect.any(String),
        }),
      )
      // Assert: NOT routed to main messageCapture
      expect(mockHandleChatMessage).not.toHaveBeenCalled()
    })

    it("should route main session chat messages to messageCapture (unchanged)", async () => {
      // Arrange: SDK returns main session (no parentID)
      mockGetSession.mockResolvedValue({
        id: "ses_main1234567890ab",
        parentID: null,
        title: "Main Session",
      })

      // Act: chat.message fires for main session
      await tracker.handleChatMessage(
        { sessionID: "ses_main1234567890ab", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg1", variant: "user" },
        { message: { role: "user", content: "hello" }, parts: [] },
      )

      // Assert: routed to messageCapture (existing behavior)
      expect(mockHandleChatMessage).toHaveBeenCalled()
      expect(mockAppendChildTurn).not.toHaveBeenCalled()
    })

    it("should fallback to main session when SDK call fails (conservative)", async () => {
      // Arrange: SDK call fails
      mockGetSession.mockRejectedValue(new Error("SDK unavailable"))

      // Act
      await tracker.handleChatMessage(
        { sessionID: "ses_fallback3456789012c", agent: "test", model: { providerID: "test", modelID: "test" }, messageID: "msg2", variant: "user" },
        { message: { role: "user", content: "hello" }, parts: [] },
      )

      // Assert: falls back to messageCapture, not childWriter
      expect(mockHandleChatMessage).toHaveBeenCalled()
      expect(mockAppendChildTurn).not.toHaveBeenCalled()
    })
  })

  // F-06: seedTurnCounters wiring in initialize()
  describe("F-06 — seedTurnCounters in initialize()", () => {
    let mockSessionWriterAppendUserTurn: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      vi.clearAllMocks()

      mockCreateSessionDir = vi.fn().mockResolvedValue("/fake/path/ses_test12345abcdefg0")
      mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
      mockAddSession = vi.fn().mockResolvedValue(undefined)
      mockAppLog = vi.fn()
      mockSessionWriterAppendUserTurn = vi.fn().mockResolvedValue(undefined)

      // Mock readFile to return project-continuity with 1 session
      mockReadFile.mockImplementation(async (path: string) => {
        const pathStr = String(path)
        if (pathStr.includes("project-continuity.json")) {
          return JSON.stringify({
            version: "2.0",
            projectRoot: "/fake/project",
            lastUpdated: new Date().toISOString(),
            sessions: {
              ses_test12345abcdefg0: {
                dir: "ses_test12345abcdefg0/",
                mainFile: "ses_test12345abcdefg0.md",
                status: "active",
                childCount: 0,
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
              },
            },
            chronologicalOrder: ["ses_test12345abcdefg0"],
          })
        }
        // .md files with 5 USER turns
        if (pathStr.includes(".md")) {
          return "---\n## USER (turn 1)\ncontent\n## USER (turn 2)\ncontent\n## USER (turn 3)\ncontent\n## USER (turn 4)\ncontent\n## USER (turn 5)\ncontent\n"
        }
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT" })
      })

      tracker = new SessionTracker({
        client: {
          app: { log: mockAppLog },
          session: { get: mockGetSession },
        } as any,
        projectRoot: "/fake/project",
      })
    })

    it("should seed turn counter from existing .md file with 5 USER turns", async () => {
      // Arrange: SDK returns main session
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Main Session",
      })

      // Act: initialize seeds turn counters
      await tracker.initialize()

      // Assert: messageCapture turnCounter should be seeded to 5
      // (5 USER turns in .md → nextTurnNumber should return 6)
      const messageCapture = (tracker as any).messageCapture as MessageCapture | undefined
      expect(messageCapture).toBeDefined()

      // After seeding, calling nextTurnNumber should give us 6
      // (seed sets counter to 5, nextTurnNumber returns counter+1)
      // This FAILS because initialize() doesn't call seedTurnCounters yet
      // — counter stays at 0, so nextTurnNumber returns 1
      const turnCounters = (messageCapture as any).turnCounters as Map<string, number>
      expect(turnCounters.get("ses_test12345abcdefg0")).toBe(5)
    })
  })
})
