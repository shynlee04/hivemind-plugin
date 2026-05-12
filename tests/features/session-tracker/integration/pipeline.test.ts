/**
 * Integration tests for the Session Tracker pipeline.
 *
 * Simulates actual OpenCode hook event shapes from SPEC.md §6 to validate
 * the complete session tracker pipeline end-to-end. Every test verifies
 * disk state (not in-memory state or mock assertions) to ensure fixes
 * F-01 through F-12 are genuinely working at the filesystem level.
 *
 * Uses temp directories via `node:os` tmpdir() — never touches the real
 * `.hivemind/` directory.
 *
 * @module tests/features/session-tracker/integration/pipeline
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, rm, readFile } from "node:fs/promises"
import { resolve, join } from "node:path"
import { tmpdir } from "node:os"
import { existsSync } from "node:fs"

import { SessionTracker } from "../../../../src/features/session-tracker/index.js"

// ---------------------------------------------------------------------------
// Mock the session-api to avoid real SDK calls
// ---------------------------------------------------------------------------

vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn().mockResolvedValue([]),
}))

import { getSession } from "../../../../src/shared/session-api.js"
const mockGetSession = vi.mocked(getSession)

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe("Session Tracker Pipeline (Integration)", () => {
  let testRoot: string
  let sessionTrackerDir: string
  let tracker: SessionTracker

  beforeEach(async () => {
    // Create a unique temp directory per test to isolate state
    testRoot = resolve(
      tmpdir(),
      `hivemind-pipeline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    )
    await mkdir(testRoot, { recursive: true })
    sessionTrackerDir = join(testRoot, ".hivemind", "session-tracker")
    vi.clearAllMocks()
  })

  afterEach(async () => {
    try {
      await rm(testRoot, { recursive: true, force: true })
    } catch {
      // Best-effort cleanup
    }
  })

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * Creates a SessionTracker with a mocked client and calls initialize().
   *
   * @param getSessionResponse - The value that `getSession()` should resolve to.
   * @param extraClientProps - Optional extra properties to merge into the mock client.
   */
  async function createTrackerAndInit(
    getSessionResponse: unknown = { parentID: undefined },
    extraClientProps: Record<string, unknown> = {},
  ): Promise<void> {
    mockGetSession.mockResolvedValue(getSessionResponse as never)

    tracker = new SessionTracker({
      client: {
        session: { get: mockGetSession, messages: vi.fn().mockResolvedValue([]), list: vi.fn().mockResolvedValue([]) },
        app: { log: vi.fn() },
        tui: { showToast: vi.fn() },
        ...extraClientProps,
      } as never,
      projectRoot: testRoot,
    })

    await tracker.initialize()
  }

  /**
   * Waits for async write queues to drain.
   */
  async function drainWrites(ms = 200): Promise<void> {
    await new Promise((r) => setTimeout(r, ms))
  }

  // =====================================================================
  // TASK 1: F-01 & F-02
  // =====================================================================

  describe("F-01: Child session directory prevention", () => {
    it("should NOT create directory for child session (has parentID)", async () => {
      // Arrange: SDK returns a child session (has parentID)
      await createTrackerAndInit({
        id: "ses_child_001",
        parentID: "ses_parent_001",
        title: "Child Session",
      })

      // Act: fire session.created for the child session
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_child_001",
        event: {},
      })

      await drainWrites()

      // Assert: no subdirectory created for child session
      const childDir = join(sessionTrackerDir, "ses_child_001")
      expect(existsSync(childDir)).toBe(false)

      // Assert: child NOT in project-continuity.json
      const indexContent = await readProjectIndex()
      expect(indexContent.sessions).not.toHaveProperty("ses_child_001")
    })

    it("should NOT create directory for child session via lazy bootstrap (chat message)", async () => {
      // Arrange: SDK returns a child session
      await createTrackerAndInit({
        id: "ses_child_002",
        parentID: "ses_parent_002",
        title: "Child Session",
      })

      // Act: fire chat.message for child session (triggers lazy bootstrap)
      await tracker.handleChatMessage(
        {
          sessionID: "ses_child_002",
          agent: "hm-l2-investigator",
          model: { providerID: "test", modelID: "test" },
          messageID: "msg_01",
          variant: "user",
        },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Hello from child session" }],
        },
      )

      await drainWrites()

      // Assert: child session directory must NOT exist
      const childDir = join(sessionTrackerDir, "ses_child_002")
      expect(existsSync(childDir)).toBe(false)
    })
  })

  describe("F-02: Main session initialization with YAML frontmatter", () => {
    it("should create .md file with YAML frontmatter for root session", async () => {
      // Arrange: SDK returns a root session (no parentID)
      await createTrackerAndInit({
        id: "ses_main_001",
        parentID: null,
        title: "Main Session",
      })

      // Act: fire session.created for the root session
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_main_001",
        event: {},
      })

      await drainWrites()

      // Assert: session directory exists
      const sessionDir = join(sessionTrackerDir, "ses_main_001")
      expect(existsSync(sessionDir)).toBe(true)

      // Assert: .md file exists
      const mdPath = join(sessionDir, "ses_main_001.md")
      expect(existsSync(mdPath)).toBe(true)

      // Assert: .md file starts with YAML frontmatter (---)
      const content = await readFile(mdPath, "utf-8")
      expect(content.startsWith("---")).toBe(true)

      // Assert: frontmatter contains expected fields
      expect(content).toContain("sessionID: ses_main_001")
      expect(content).toContain("parentSessionID: null")
      expect(content).toContain("delegationDepth: 0")
      expect(content).toContain("status: active")
    })

    it("should NOT produce double init (ensureSessionReady dedup)", async () => {
      // Arrange: SDK returns root session
      await createTrackerAndInit({
        id: "ses_main_002",
        parentID: null,
        title: "Main Session",
      })

      // Act: fire session.created, then fire chat.message (which triggers lazy bootstrap)
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_main_002",
        event: {},
      })

      await drainWrites(100)

      // Fire chat.message for same session — should NOT re-initialize
      await tracker.handleChatMessage(
        {
          sessionID: "ses_main_002",
          agent: "test-agent",
          model: { providerID: "test", modelID: "test" },
          messageID: "msg_01",
          variant: "user",
        },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "First message" }],
        },
      )

      await drainWrites()

      // Assert: .md file does NOT start with "### Tool:" (double init would produce tool blocks first)
      const mdPath = join(sessionTrackerDir, "ses_main_002", "ses_main_002.md")
      const content = await readFile(mdPath, "utf-8")
      expect(content.startsWith("### Tool:")).toBe(false)

      // Assert: frontmatter present
      expect(content.startsWith("---")).toBe(true)
    })
  })

  // =====================================================================
  // Helpers
  // =====================================================================

  /** Reads and parses the project-continuity.json file. */
  async function readProjectIndex(): Promise<Record<string, unknown>> {
    const indexPath = join(sessionTrackerDir, "project-continuity.json")
    const raw = await readFile(indexPath, "utf-8")
    return JSON.parse(raw) as Record<string, unknown>
  }

  /** Reads and parses a session-continuity.json file for a given session. */
  async function readSessionIndex(sessionID: string): Promise<Record<string, unknown>> {
    const indexPath = join(sessionTrackerDir, sessionID, "session-continuity.json")
    const raw = await readFile(indexPath, "utf-8")
    return JSON.parse(raw) as Record<string, unknown>
  }
})
