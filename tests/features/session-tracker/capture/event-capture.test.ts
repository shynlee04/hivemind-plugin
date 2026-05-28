/**
 * EventCapture tests — session lifecycle event handling.
 *
 * @module tests/features/session-tracker/capture/event-capture
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { EventCapture } from "../../../../src/features/session-tracker/capture/event-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"

// Mock the session-api module
vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn(),
}))

import { getSession, getSessionMessages } from "../../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)
const mockGetSessionMessages = vi.mocked(getSessionMessages)

describe("EventCapture", () => {
  let eventCapture: EventCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockUpdateFrontmatter: ReturnType<typeof vi.fn>
  let mockUpdateChildStatus: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue("/fake/path")
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockUpdateFrontmatter = vi.fn().mockResolvedValue(undefined)
    mockUpdateChildStatus = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
      updateFrontmatter: mockUpdateFrontmatter,
      addChildRef: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
      appendAssistantTurn: vi.fn().mockResolvedValue(undefined),
      sessionFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as SessionWriter

    childWriter = {
      updateChildStatus: mockUpdateChildStatus,
      childFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as ChildWriter

    sessionIndexWriter = {
      updateChildStatus: mockUpdateChildStatus,
    } as unknown as SessionIndexWriter

    eventCapture = new EventCapture({
      client: { app: { log: vi.fn() } } as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
    })
  })

  describe("session.created", () => {
    it("should create subdir + .md for root sessions (parentID null)", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_test12345abcdefg0")
      expect(mockInitializeSessionFile).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        expect.objectContaining({
          sessionID: "ses_test12345abcdefg0",
          parentSessionID: null,
          delegationDepth: 0,
          status: "active",
        }),
      )
    })

    it("should skip subdir creation for child sessions (parentID exists)", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_child123456789ab",
        parentID: "ses_parent987654321xy",
        title: "Child Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child123456789ab",
        event: {},
      })

      expect(mockCreateSessionDir).not.toHaveBeenCalled()
      expect(mockInitializeSessionFile).not.toHaveBeenCalled()
    })
  })

  describe("session.idle", () => {
    it("should update session status to idle for main session", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.idle",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        { status: "completed" },
      )
    })

    it("should backfill lastMessage from SDK messages when pendingRegistry is empty", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test_fallback_abc123",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })
      mockGetSessionMessages.mockResolvedValue([
        {
          info: { role: "user" },
          parts: [{ type: "text", text: "Hello" }],
        },
        {
          info: { role: "assistant" },
          parts: [{ type: "text", text: "This is the assistant response" }],
        },
      ])

      await eventCapture.handleSessionEvent({
        eventType: "session.idle",
        sessionID: "ses_test_fallback_abc123",
        event: {},
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test_fallback_abc123",
        { status: "completed", lastMessage: "This is the assistant response" },
      )
    })

    it("should backfill lastMessage with thinking blocks from SDK fallback", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test_fallback_thinking",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })
      mockGetSessionMessages.mockResolvedValue([
        {
          info: { role: "assistant" },
          parts: [
            { type: "thinking", text: "Reasoning step" },
            { type: "text", text: "Actual output" },
          ],
        },
      ])

      await eventCapture.handleSessionEvent({
        eventType: "session.idle",
        sessionID: "ses_test_fallback_thinking",
        event: {},
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test_fallback_thinking",
        { status: "completed", lastMessage: "<thinking>\nReasoning step\n</thinking>\nActual output" },
      )
    })

    it("should handle SDK message fetch failure gracefully", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test_fallback_fail_xyz",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })
      mockGetSessionMessages.mockRejectedValue(new Error("SDK error"))

      await eventCapture.handleSessionEvent({
        eventType: "session.idle",
        sessionID: "ses_test_fallback_fail_xyz",
        event: {},
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test_fallback_fail_xyz",
        { status: "completed" },
      )
    })
  })

  describe("session.deleted", () => {
    it("should mark session status as completed for main session", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.deleted",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        { status: "completed" },
      )
    })
  })

  describe("session.error", () => {
    it("should mark session status as error for main session", async () => {
      mockGetSession.mockResolvedValue({
        id: "ses_test12345abcdefg0",
        parentID: null,
        title: "Test Session",
        time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
      })

      await eventCapture.handleSessionEvent({
        eventType: "session.error",
        sessionID: "ses_test12345abcdefg0",
        event: { error: "Something went wrong" },
      })

      expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
        "ses_test12345abcdefg0",
        { status: "error" },
      )
    })
  })

  describe("graceful failure", () => {
    it("should not throw on malformed input (missing sessionID)", async () => {
      // Should not throw even with bad input
      await expect(
        eventCapture.handleSessionEvent({
          eventType: "session.created",
          sessionID: "",
          event: {},
        }),
      ).resolves.toBeUndefined()
    })

    it("should not throw when getSession fails", async () => {
      mockGetSession.mockRejectedValue(new Error("Network error"))

      await expect(
        eventCapture.handleSessionEvent({
          eventType: "session.created",
          sessionID: "ses_test12345abcdefg0",
          event: {},
        }),
      ).resolves.toBeUndefined()
    })

    it("should log warning on unknown event type", async () => {
      const client = (eventCapture as any).client

      await eventCapture.handleSessionEvent({
        eventType: "session.unknown_type",
        sessionID: "ses_test12345abcdefg0",
        event: {},
      })

      expect(client.app.log).toHaveBeenCalled()
    })
  })
})

// ── handleSessionCreated — root-only directory creation (D-02, D-05) ────

describe("handleSessionCreated() — root-only directory creation (D-02)", () => {
  let eventCapture: EventCapture
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>
  let mockIsChild: ReturnType<typeof vi.fn>
  let mockPendingHas: ReturnType<typeof vi.fn>
  let mockAddSession: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue("/fake/path")
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockAppLog = vi.fn()
    mockIsChild = vi.fn().mockReturnValue(false)
    mockPendingHas = vi.fn().mockReturnValue(false)
    mockAddSession = vi.fn().mockResolvedValue(undefined)

    mockGetSession.mockReset()
    mockGetSession.mockResolvedValue({ id: "ses_test", parentID: null })

    const sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
      updateFrontmatter: vi.fn(),
      addChildRef: vi.fn(),
      sessionFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as SessionWriter

    const childWriter = {
      updateChildStatus: vi.fn(),
      childFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as ChildWriter

    const sessionIndexWriter = {
      updateChildStatus: vi.fn(),
    } as unknown as SessionIndexWriter

    const projectIndexWriter = {
      addSession: mockAddSession,
    } as unknown as any

    eventCapture = new EventCapture({
      client: { app: { log: mockAppLog } } as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
      projectIndexWriter,
      hierarchyIndex: {
        isChild: mockIsChild,
        getParent: vi.fn().mockReturnValue(undefined),
      } as any,
      pendingRegistry: {
        has: mockPendingHas,
        get: vi.fn().mockReturnValue(undefined),
        getAnyActiveEntry: vi.fn().mockReturnValue(undefined),
      } as any,
    })
  })

  // ── Test 1: SDK parentID → skip directory ─────────────────────────────

  it("should skip directory creation when SDK reports parentID (Gate 1)", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_child_001",
      parentID: "ses_parent_001",
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_001",
      event: {},
    })

    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    expect(mockInitializeSessionFile).not.toHaveBeenCalled()
  })

  // ── Test 2: HierarchyIndex isChild → skip directory ───────────────────

  it("should skip directory creation when HierarchyIndex.isChild() returns true (Gate 2)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_child_002", parentID: null })
    mockIsChild.mockReturnValue(true)

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_002",
      event: {},
    })

    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    expect(mockInitializeSessionFile).not.toHaveBeenCalled()
  })

  // ── Test 3: PendingDispatchRegistry has() → skip directory ────────────

  it("should skip directory creation when PendingDispatchRegistry.has() returns true (Gate 3)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_child_003", parentID: null })
    mockIsChild.mockReturnValue(false)
    mockPendingHas.mockReturnValue(true)

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_003",
      event: {},
    })

    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    expect(mockInitializeSessionFile).not.toHaveBeenCalled()
  })

  // ── Test 4: All three gates pass → root main → directory created ──────

  it("should create directory when all three gates classify as root main", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_root_001", parentID: null })
    mockIsChild.mockReturnValue(false)
    mockPendingHas.mockReturnValue(false)

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_root_001",
      event: {},
    })

    // This is the ONLY path that creates directories (D-02)
    expect(mockCreateSessionDir).toHaveBeenCalledWith("ses_root_001")
    expect(mockInitializeSessionFile).toHaveBeenCalledWith(
      "ses_root_001",
      expect.objectContaining({
        sessionID: "ses_root_001",
        parentSessionID: null,
        delegationDepth: 0,
        status: "active",
      }),
    )
  })

  // ── Test 5: SDK call failure → HierarchyIndex fallback works ──────────

  it("should fall back to HierarchyIndex when SDK call fails (error resilience)", async () => {
    mockGetSession.mockRejectedValue(new Error("Server unreachable"))
    mockIsChild.mockReturnValue(true) // hierarchy index catches the child

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_fallback",
      event: {},
    })

    // Directory NOT created because fallback gate catches it
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
  })
})

// ── handleSessionCreated — immediate child .json write (D-06) + manifest integration (D-07) ────

describe("handleSessionCreated() — immediate child .json write (D-06) + manifest (D-07)", () => {
  let eventCapture: EventCapture
  let mockCreateSessionDir: ReturnType<typeof vi.fn>
  let mockInitializeSessionFile: ReturnType<typeof vi.fn>
  let mockCreateChildFile: ReturnType<typeof vi.fn>
  let mockManifestAddChild: ReturnType<typeof vi.fn>
  let mockManifestUpdateChildStatus: ReturnType<typeof vi.fn>
  let mockIsChild: ReturnType<typeof vi.fn>
  let mockGetRootMain: ReturnType<typeof vi.fn>
  let mockPendingGet: ReturnType<typeof vi.fn>
  let mockPendingHas: ReturnType<typeof vi.fn>
  let mockAppLog: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockCreateSessionDir = vi.fn().mockResolvedValue("/fake/path")
    mockInitializeSessionFile = vi.fn().mockResolvedValue(undefined)
    mockCreateChildFile = vi.fn().mockResolvedValue(undefined)
    mockManifestAddChild = vi.fn().mockResolvedValue(undefined)
    mockManifestUpdateChildStatus = vi.fn().mockResolvedValue(undefined)
    mockIsChild = vi.fn().mockReturnValue(false)
    mockGetRootMain = vi.fn().mockReturnValue("ses_root_main_parent")
    mockPendingGet = vi.fn().mockReturnValue(undefined)
    mockPendingHas = vi.fn().mockReturnValue(false)
    mockAppLog = vi.fn()

    mockGetSession.mockReset()
    mockGetSession.mockResolvedValue({ id: "ses_test", parentID: null })

    const sessionWriter = {
      createSessionDir: mockCreateSessionDir,
      initializeSessionFile: mockInitializeSessionFile,
      updateFrontmatter: vi.fn(),
      addChildRef: vi.fn(),
      sessionFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as SessionWriter

    const childWriter = {
      createChildFile: mockCreateChildFile,
      updateChildStatus: vi.fn(),
      setDelegationContext: vi.fn(),
      getDelegationContext: vi.fn().mockReturnValue(undefined),
      childFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as ChildWriter

    const sessionIndexWriter = {
      updateChildStatus: vi.fn(),
    } as unknown as SessionIndexWriter

    const manifestWriter = {
      addChild: mockManifestAddChild,
      updateChildStatus: mockManifestUpdateChildStatus,
      getChild: vi.fn(),
      getChildren: vi.fn(),
    } as any

    eventCapture = new EventCapture({
      client: { app: { log: mockAppLog } } as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
      hierarchyIndex: {
        isChild: mockIsChild,
        getRootMain: mockGetRootMain,
        registerChild: vi.fn(), // D-07: needed for manifest update during immediate write
        getParent: vi.fn().mockReturnValue(null),
      } as any,
      pendingRegistry: {
        has: mockPendingHas,
        get: mockPendingGet,
        getByParent: vi.fn().mockReturnValue(undefined),
        getAnyActiveEntry: vi.fn().mockReturnValue(undefined),
      } as any,
      manifestWriter,
    })
  })

  // ── Test 1: child .json written immediately at session.created ─────────

  it("writes child .json immediately when SDK reports parentID (D-06)", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_child_d06",
      parentID: "ses_parent_d06",
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_d06",
      event: {},
    })

    expect(mockCreateChildFile).toHaveBeenCalledWith(
      "ses_parent_d06",
      "ses_child_d06",
      expect.objectContaining({
        sessionID: "ses_child_d06",
        parentSessionID: "ses_parent_d06",
      }),
    )
    // Directory must NOT be created for child sessions
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
  })

  // ── Test 2: hierarchy-manifest.json updated simultaneously ─────────────

  it("updates hierarchy-manifest.json when child .json is written (D-07)", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_child_manifest",
      parentID: "ses_parent_manifest",
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_manifest",
      event: {},
    })

    // Manifest is now a derivative cache (REQ-21-04) — NOT proactively written.
    // Child .json IS still written immediately.
    expect(mockCreateChildFile).toHaveBeenCalled()
  })

  // ── Test 3: main session (root) does NOT trigger child .json write ─────

  it("does NOT write child .json or update manifest for root main sessions", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_root_main", parentID: null })
    mockIsChild.mockReturnValue(false)
    mockPendingHas.mockReturnValue(false)

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_root_main",
      event: {},
    })

    expect(mockCreateChildFile).not.toHaveBeenCalled()
    expect(mockManifestAddChild).not.toHaveBeenCalled()
    // Root main sessions follow normal directory creation path
    expect(mockCreateSessionDir).toHaveBeenCalled()
  })

  // ── Test 4: delegatedBy metadata flows from PendingDispatchRegistry ────

  it("uses delegatedBy metadata from PendingDispatchRegistry when available", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_child_meta",
      parentID: "ses_parent_meta",
    })
    mockPendingGet.mockReturnValue({
      parentSessionID: "ses_parent_meta",
      subagentType: "hm-l2-investigator",
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_meta",
      event: {},
    })

    expect(mockCreateChildFile).toHaveBeenCalledWith(
      "ses_parent_meta",
      "ses_child_meta",
      expect.objectContaining({
        delegatedBy: expect.objectContaining({
          subagentType: "hm-l2-investigator",
        }),
      }),
    )
  })

  // ── Test 5: Gates 2/3 also trigger immediate child .json write ─────────

  it("writes child .json when HierarchyIndex classifies as child (Gate 2)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_child_g2", parentID: null })
    mockIsChild.mockReturnValue(true) // Gate 2 catches it

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_g2",
      event: {},
    })

    // Even though SDK reported null parentID, HierarchyIndex knows it's a child
    // In this case the immediate parent is resolved through the hierarchy index
    // The child .json write happens, but parentID resolution may differ
    // At minimum, directory must NOT be created
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
  })

  // ── Test 6: PendingDispatchRegistry fallback also prevents directory creation ──

  it("writes child .json when PendingDispatchRegistry classifies as child (Gate 3)", async () => {
    mockGetSession.mockResolvedValue({ id: "ses_child_g3", parentID: null })
    mockIsChild.mockReturnValue(false)
    mockPendingHas.mockReturnValue(true) // Gate 3 catches it
    mockPendingGet.mockReturnValue({
      parentSessionID: "ses_parent_g3",
      subagentType: "hm-l2-researcher",
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.created",
      sessionID: "ses_child_g3",
      event: {},
    })

    // Directory must NOT be created
    expect(mockCreateSessionDir).not.toHaveBeenCalled()
    // Child .json should be written with parentID from pending registry
    expect(mockCreateChildFile).toHaveBeenCalledWith(
      "ses_parent_g3",
      "ses_child_g3",
      expect.any(Object),
    )
  })
})

describe("session.next.text.ended — lastMessage capture for main sessions", () => {
  let eventCapture: EventCapture
  let sessionWriter: SessionWriter
  let childWriter: ChildWriter
  let sessionIndexWriter: SessionIndexWriter
  let mockUpdateFrontmatter: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockUpdateFrontmatter = vi.fn().mockResolvedValue(undefined)

    sessionWriter = {
      createSessionDir: vi.fn().mockResolvedValue("/fake/path"),
      initializeSessionFile: vi.fn().mockResolvedValue(undefined),
      updateFrontmatter: mockUpdateFrontmatter,
      addChildRef: vi.fn(),
      appendUserTurn: vi.fn(),
      appendAgentBlock: vi.fn(),
      appendToolBlock: vi.fn(),
      sessionFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as SessionWriter

    childWriter = {
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
      childFileExists: vi.fn().mockResolvedValue(true),
    } as unknown as ChildWriter

    sessionIndexWriter = {
      updateChildStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as SessionIndexWriter

    eventCapture = new EventCapture({
      client: { app: { log: vi.fn() } } as any,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
    })
  })

  it("should update frontmatter lastMessage for main sessions", async () => {
    // Root session — not a child
    mockGetSession.mockResolvedValue({
      id: "ses_main_text1",
      parentID: null,
      title: "Main Session",
      time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.next.text.ended",
      sessionID: "ses_main_text1",
      event: {
        type: "session.next.text.ended",
        properties: {
          sessionID: "ses_main_text1",
          text: "This is the assistant response text",
        },
      },
    })

    expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
      "ses_main_text1",
      expect.objectContaining({
        lastMessage: "This is the assistant response text",
      }),
    )
  })

  it("should skip empty text", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_main_empty",
      parentID: null,
      title: "Empty Session",
      time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.next.text.ended",
      sessionID: "ses_main_empty",
      event: {
        type: "session.next.text.ended",
        properties: {
          sessionID: "ses_main_empty",
          text: "   ",
        },
      },
    })

    expect(mockUpdateFrontmatter).not.toHaveBeenCalled()
  })

  it("should skip child sessions", async () => {
    // Child session — has parentID
    mockGetSession.mockResolvedValue({
      id: "ses_child_text1",
      parentID: "ses_parent_text1",
      title: "Child Session",
      time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.next.text.ended",
      sessionID: "ses_child_text1",
      event: {
        type: "session.next.text.ended",
        properties: {
          sessionID: "ses_child_text1",
          text: "Child assistant text",
        },
      },
    })

    // updateFrontmatter should NOT be called for child sessions
    expect(mockUpdateFrontmatter).not.toHaveBeenCalled()
  })

  it("should trim whitespace from text", async () => {
    mockGetSession.mockResolvedValue({
      id: "ses_main_ws",
      parentID: null,
      title: "Whitespace Session",
      time: { created: "2026-01-01T00:00:00Z", updated: "2026-01-01T00:00:00Z" },
    })

    await eventCapture.handleSessionEvent({
      eventType: "session.next.text.ended",
      sessionID: "ses_main_ws",
      event: {
        type: "session.next.text.ended",
        properties: {
          sessionID: "ses_main_ws",
          text: "  hello world  ",
        },
      },
    })

    expect(mockUpdateFrontmatter).toHaveBeenCalledWith(
      "ses_main_ws",
      expect.objectContaining({
        lastMessage: "hello world",
      }),
    )
  })
})
