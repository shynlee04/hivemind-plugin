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
  // TASK 2: F-03, F-04, F-05, F-06
  // =====================================================================

  describe("F-03: Turn count incrementing", () => {
    it("should increment turnCount on each user message", async () => {
      // Arrange: SDK returns a root session
      await createTrackerAndInit({
        id: "ses_f03_001",
        parentID: null,
        title: "Main Session",
      })

      // Initialize session via session.created
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_f03_001",
        event: {},
      })
      await drainWrites(100)

      // Act: fire 3 user chat messages
      for (let i = 0; i < 3; i++) {
        await tracker.handleChatMessage(
          {
            sessionID: "ses_f03_001",
            agent: "test-agent",
            model: { providerID: "test", modelID: "test" },
            messageID: `msg_0${i}`,
            variant: "user",
          },
          {
            message: { role: "user" },
            parts: [{ type: "text", text: `Message ${i + 1}` }],
          },
        )
      }

      await drainWrites()

      // Assert: session-continuity.json turnCount is 3
      const idx = await readSessionIndex("ses_f03_001")
      expect(idx.turnCount).toBe(3)
    })

    it("should have turnCount 1 after first message (starts from 0)", async () => {
      // Arrange
      await createTrackerAndInit({
        id: "ses_f03_002",
        parentID: null,
        title: "Main Session",
      })

      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_f03_002",
        event: {},
      })
      await drainWrites(100)

      // Fire a single user message (increments from 0 to 1)
      await tracker.handleChatMessage(
        {
          sessionID: "ses_f03_002",
          agent: "test-agent",
          model: { providerID: "test", modelID: "test" },
          messageID: "msg_00",
          variant: "user",
        },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "First message" }],
        },
      )
      await drainWrites()

      // Assert: turnCount is 1 (started at 0, incremented once)
      const idx = await readSessionIndex("ses_f03_002")
      expect(idx.turnCount).toBe(1)
    })
  })

  describe("F-04: Child count incrementing", () => {
    it("should increment childCount in project index on task delegation", async () => {
      // Arrange: root session
      await createTrackerAndInit({
        id: "ses_f04_001",
        parentID: null,
        title: "Main Session",
      })

      // Initialize session
      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_f04_001",
        event: {},
      })
      await drainWrites(100)

      // Act: fire tool.execute.after for a task that creates a child
      await tracker.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_f04_001",
          callID: "call_task_01",
          args: {
            description: "Delegate research task",
            subagent_type: "hm-l2-researcher",
          },
        },
        {
          title: "Task Dispatch",
          output: "task_id: ses_child_f04_001",
          metadata: {},
        },
      )

      await drainWrites()

      // Assert: project-continuity.json has childCount: 1 for this session
      const projectIdx = await readProjectIndex()
      const sessions = projectIdx.sessions as Record<string, Record<string, unknown>>
      expect(sessions["ses_f04_001"].childCount).toBe(1)
    })

    it("should increment childCount to 2 after two task delegations", async () => {
      // Arrange
      await createTrackerAndInit({
        id: "ses_f04_002",
        parentID: null,
        title: "Main Session",
      })

      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_f04_002",
        event: {},
      })
      await drainWrites(100)

      // Act: two task delegations
      for (const childId of ["ses_child_a", "ses_child_b"]) {
        await tracker.handleToolExecuteAfter(
          {
            tool: "task",
            sessionID: "ses_f04_002",
            callID: `call_${childId}`,
            args: { description: "Task", subagent_type: "hm-l2-test" },
          },
          {
            title: "Task",
            output: `task_id: ${childId}`,
            metadata: {},
          },
        )
      }

      await drainWrites()

      // Assert: childCount is 2
      const projectIdx = await readProjectIndex()
      const sessions = projectIdx.sessions as Record<string, Record<string, unknown>>
      expect(sessions["ses_f04_002"].childCount).toBe(2)
    })
  })

  describe("F-05: Child session turn capture", () => {
    it("should create child .json via task delegation and capture child turns", async () => {
      // Arrange: root session — lazy bootstrap via handleToolExecuteAfter
      await createTrackerAndInit({
        id: "ses_f05_001",
        parentID: null,
        title: "Main Session",
      })

      const childSessionID = "ses_child_f05_001"

      // Act: create child via task delegation (triggers lazy bootstrap + child creation)
      await tracker.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: "ses_f05_001",
          callID: "call_task_f05",
          args: {
            description: "Investigate bugs",
            subagent_type: "hm-l2-investigator",
          },
        },
        {
          title: "Task Dispatch",
          output: `task_id: ${childSessionID}`,
          metadata: {},
        },
      )
      await drainWrites(300)

      // Assert: child .json was created
      const childJsonPath = join(sessionTrackerDir, "ses_f05_001", `${childSessionID}.json`)
      expect(existsSync(childJsonPath)).toBe(true)

      // Act: fire chat.message for the CHILD session (simulating agent responding)
      // Update mock to return child session info for this session ID
      mockGetSession.mockResolvedValue({
        id: childSessionID,
        parentID: "ses_f05_001",
        title: "Child Session",
      } as never)

      await tracker.handleChatMessage(
        {
          sessionID: childSessionID,
          agent: "hm-l2-investigator",
          model: { providerID: "deepseek", modelID: "v4-pro" },
          messageID: "msg_child_01",
          variant: "assistant",
        },
        {
          message: { role: "assistant" },
          parts: [{ type: "text", text: "Investigating the session tracker bug..." }],
        },
      )

      await drainWrites(300)

      // Assert: child .json turns array has >= 2 entries
      // (turn 0 = delegation spawn + turn from chat message)
      const raw = await readFile(childJsonPath, "utf-8")
      const childRecord = JSON.parse(raw) as { turns: unknown[] }
      expect(childRecord.turns.length).toBeGreaterThanOrEqual(2)

      // Assert: first turn has delegation details
      const firstTurn = childRecord.turns[0] as Record<string, unknown>
      expect(firstTurn.turn).toBe(0)
      expect(firstTurn.actor).toBe("hm-l2-investigator")
    })
  })

  describe("F-06: Turn counter seeding from existing .md", () => {
    it("should seed turn counter from existing .md and continue from next turn", async () => {
      // Arrange: create a pre-existing session with 3 USER turns manually
      const sessionID = "ses_f06_001"
      const sessionDir = join(sessionTrackerDir, sessionID)
      await mkdir(sessionDir, { recursive: true })

      // Write .md file with 3 USER turns
      const { writeFile } = await import("node:fs/promises")
      const mdContent = [
        "---",
        "sessionID: ses_f06_001",
        "parentSessionID: null",
        "delegationDepth: 0",
        "status: active",
        "children: []",
        "created: 2026-05-10T00:00:00.000Z",
        "updated: 2026-05-10T00:00:00.000Z",
        "continuityIndex: session-continuity.json",
        "---",
        "",
        "## USER (turn 1)",
        "",
        "First message content",
        "",
        "## USER (turn 2)",
        "",
        "Second message content",
        "",
        "## USER (turn 3)",
        "",
        "Third message content",
        "",
      ].join("\n")
      await writeFile(join(sessionDir, `${sessionID}.md`), mdContent, "utf-8")

      // Create session-continuity.json
      const sessionIndexContent = {
        version: "2.0",
        sessionID,
        lastUpdated: new Date().toISOString(),
        hierarchy: { root: sessionID, children: {} },
        turnCount: 3,
        toolSummary: {},
      }
      await writeFile(
        join(sessionDir, "session-continuity.json"),
        JSON.stringify(sessionIndexContent, null, 2),
        "utf-8",
      )

      // Create project-continuity.json registering this session
      const projectIndexContent = {
        version: "2.0",
        projectRoot: testRoot,
        lastUpdated: new Date().toISOString(),
        sessions: {
          [sessionID]: {
            dir: `${sessionID}/`,
            mainFile: `${sessionID}.md`,
            continuityIndex: `${sessionID}/session-continuity.json`,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            status: "active",
            childCount: 0,
            totalDelegationDepth: 0,
          },
        },
        chronologicalOrder: [sessionID],
      }
      await writeFile(
        join(sessionTrackerDir, "project-continuity.json"),
        JSON.stringify(projectIndexContent, null, 2),
        "utf-8",
      )

      // Act: create fresh tracker and initialize (seeds turn counters from .md)
      mockGetSession.mockResolvedValue({
        id: sessionID,
        parentID: null,
        title: "Main Session",
      } as never)

      tracker = new SessionTracker({
        client: {
          session: { get: mockGetSession, messages: vi.fn().mockResolvedValue([]), list: vi.fn().mockResolvedValue([]) },
          app: { log: vi.fn() },
          tui: { showToast: vi.fn() },
        } as never,
        projectRoot: testRoot,
      })

      await tracker.initialize()
      await drainWrites(200)

      // Fire chat.message — should produce "## USER (turn 4)" (not turn 1)
      await tracker.handleChatMessage(
        {
          sessionID,
          agent: "test-agent",
          model: { providerID: "test", modelID: "test" },
          messageID: "msg_f06_01",
          variant: "user",
        },
        {
          message: { role: "user" },
          parts: [{ type: "text", text: "Fourth message after restart" }],
        },
      )

      await drainWrites()

      // Assert: .md file contains "## USER (turn 4)"
      const mdPath = join(sessionDir, `${sessionID}.md`)
      const mdFileContent = await readFile(mdPath, "utf-8")
      expect(mdFileContent).toContain("## USER (turn 4)")

      // Assert: .md file does NOT contain "## USER (turn 1)" again (no duplicate)
      const turn1Matches = mdFileContent.match(/## USER \(turn 1\)/g)
      expect(turn1Matches).not.toBeNull()
      expect(turn1Matches!.length).toBe(1) // Only the original turn 1
    })
  })

  // =====================================================================
  // TASK 3: F-07 & F-08 — Concurrent write safety
  // =====================================================================

  describe("F-07/F-08: Concurrent write safety", () => {
    it("should persist all concurrent writes to session index and child writer", async () => {
      // Arrange: create main session
      await createTrackerAndInit({
        id: "ses_f07_001",
        parentID: null,
        title: "Main Session",
      })

      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_f07_001",
        event: {},
      })
      await drainWrites(200)

      // Manually create a child .json file for concurrent append tests
      const { writeFile } = await import("node:fs/promises")
      const childJsonPath = join(sessionTrackerDir, "ses_f07_001", "ses_concurrent_child.json")
      const initialChildRecord = {
        sessionID: "ses_concurrent_child",
        parentSessionID: "ses_f07_001",
        delegationDepth: 1,
        delegatedBy: {
          agentName: "main_l0_agent",
          model: "unknown",
          tool: "task",
          description: "Concurrent test",
          subagentType: "hm-l2-test",
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: "active",
        mainAgent: { name: "hm-l2-test", model: "unknown" },
        turns: [],
        children: [],
      }
      await writeFile(childJsonPath, JSON.stringify(initialChildRecord, null, 2), "utf-8")

      // Access internal writers for direct concurrent testing
      const sessionIndexWriter = (tracker as any).sessionIndexWriter as {
        addChild: (sessionID: string, childID: string, file: string, depth: number, delegatedBy: string) => Promise<void>
      }
      const childWriter = (tracker as any).childWriter as {
        appendChildTurn: (parentID: string, childID: string, turn: Record<string, unknown>) => Promise<void>
      }

      // Act: 10 concurrent addChild calls (different child IDs)
      const addChildPromises = Array.from({ length: 10 }, (_, i) =>
        sessionIndexWriter.addChild(
          "ses_f07_001",
          `ses_child_c${i}`,
          `ses_child_c${i}.json`,
          1,
          "main_l0_agent",
        ),
      )

      // Act: 10 concurrent appendChildTurn calls (same child, different turns)
      const appendPromises = Array.from({ length: 10 }, (_, i) =>
        childWriter.appendChildTurn(
          "ses_f07_001",
          "ses_concurrent_child",
          {
            turn: i,
            actor: `agent_${i}`,
            content: `Concurrent turn ${i}`,
            tools: [],
          },
        ),
      )

      // Run all concurrently
      await Promise.all([...addChildPromises, ...appendPromises])
      await drainWrites(500)

      // Assert: session-continuity.json has all 10 children
      const sessionIndex = await readSessionIndex("ses_f07_001")
      const hierarchy = sessionIndex.hierarchy as { children: Record<string, unknown> }
      const childKeys = Object.keys(hierarchy.children)
      // ses_concurrent_child was created manually, so we expect 11 total (10 new + 1 existing)
      // But addChild() with concurrent writes — all 10 should be there
      const newChildren = childKeys.filter((k) => k.startsWith("ses_child_c"))
      expect(newChildren.length).toBe(10)

      // Assert: child .json has all 10 turns (plus 0 from initial)
      const raw = await readFile(childJsonPath, "utf-8")
      const childRecord = JSON.parse(raw) as { turns: unknown[] }
      expect(childRecord.turns.length).toBe(10)
    })

    it("should handle concurrent addChild calls without data loss", async () => {
      // Simpler test: just verify serial queue prevents data loss
      await createTrackerAndInit({
        id: "ses_f07_002",
        parentID: null,
        title: "Main Session",
      })

      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: "ses_f07_002",
        event: {},
      })
      await drainWrites(200)

      const sessionIndexWriter = (tracker as any).sessionIndexWriter as {
        addChild: (sessionID: string, childID: string, file: string, depth: number, delegatedBy: string) => Promise<void>
      }

      // 5 concurrent addChild calls
      await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          sessionIndexWriter.addChild(
            "ses_f07_002",
            `ses_conc_${i}`,
            `ses_conc_${i}.json`,
            1,
            "test",
          ),
        ),
      )
      await drainWrites(300)

      const sessionIndex = await readSessionIndex("ses_f07_002")
      const hierarchy = sessionIndex.hierarchy as { children: Record<string, unknown> }
      const children = Object.keys(hierarchy.children)
      expect(children.length).toBe(5)
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
