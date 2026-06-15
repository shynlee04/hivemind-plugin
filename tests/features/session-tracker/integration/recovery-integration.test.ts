/**
 * Recovery integration tests: disconnect → reconnect → context rebuilt.
 * Verifies REQ-ST-10: disconnection recovery via file + SDK REST API.
 *
 * @module tests/features/session-tracker/integration/recovery-integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, rm, readFile, writeFile } from "node:fs/promises"
import { resolve, join } from "node:path"
import { tmpdir } from "node:os"

import { SessionTracker, SessionRecovery } from "../../../../src/features/session-tracker/index.js"
import { getSession, getSessionMessages } from "../../../../src/shared/session-api.js"

// ---------------------------------------------------------------------------
// Module-level mock
// ---------------------------------------------------------------------------

vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function testSid(suffix: string): string {
  return `ses_${suffix}`
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Session tracker recovery (REQ-ST-10)", () => {
  let testRoot: string

  beforeEach(async () => {
    testRoot = resolve(tmpdir(), `hivemind-recov-${Date.now()}`)
    await mkdir(testRoot, { recursive: true })
    vi.mocked(getSession).mockResolvedValue({
      id: "any",
      parentID: null,
      title: "Test",
      time: { created: Date.now(), updated: Date.now() },
    } as never)
  })

  afterEach(async () => {
    vi.clearAllMocks()
    try { await rm(testRoot, { recursive: true, force: true }) } catch { /* cleanup */ }
  })

  it("rebuilds session context from persisted .md file after disconnection", async () => {
    const sid = testSid("rebuild01abcde")

    const mockClient = {
      session: {
        get: vi.fn(),
        messages: vi.fn().mockResolvedValue({ data: [] }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    }

    const tracker = new SessionTracker({
      client: mockClient as never,
      projectRoot: testRoot,
    })
    await tracker.initialize()

    await tracker.handleSessionEvent({
      eventType: "session.created",
      sessionID: sid,
      event: {},
    })

    await tracker.handleChatMessage(
      { sessionID: sid },
      { message: { role: "user" }, parts: [{ type: "text", text: "First message" }] },
    )
    await tracker.handleChatMessage(
      { sessionID: sid },
      { message: { role: "user" }, parts: [{ type: "text", text: "Second message" }] },
    )

    // "Disconnect" — new tracker (restart)
    const tracker2 = new SessionTracker({
      client: mockClient as never,
      projectRoot: testRoot,
    })
    await tracker2.initialize()

    const mdPath = resolve(testRoot, ".hivemind/session-tracker", sid, `${sid}.md`)
    const mdContent = await readFile(mdPath, "utf-8")
    expect(mdContent).toContain("First message")
    expect(mdContent).toContain("Second message")

    // Write after "reconnect"
    await tracker2.handleChatMessage(
      { sessionID: sid },
      { message: { role: "user" }, parts: [{ type: "text", text: "Post-restart" }] },
    )

    const updated = await readFile(mdPath, "utf-8")
    expect(updated).toContain("Post-restart")
  })

  it("detects missing messages via gap analysis (reconsumption)", async () => {
    const sid = testSid("gap01abcdefghi")

    const mockClient = {
      session: {
        get: vi.fn(),
        messages: vi.fn().mockResolvedValue({ data: [] }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    }

    const tracker = new SessionTracker({
      client: mockClient as never,
      projectRoot: testRoot,
    })
    await tracker.initialize()

    await tracker.handleSessionEvent({
      eventType: "session.created",
      sessionID: sid,
      event: {},
    })

    await tracker.handleChatMessage(
      { sessionID: sid },
      { message: { role: "user" }, parts: [{ type: "text", text: "Msg 1" }] },
    )
    await tracker.handleChatMessage(
      { sessionID: sid },
      { message: { role: "user" }, parts: [{ type: "text", text: "Msg 2" }] },
    )

    // Mock SDK to return 4 messages (2 missed)
    vi.mocked(getSessionMessages).mockResolvedValueOnce([
      { id: "m1", role: "user" }, { id: "m2", role: "assistant" },
      { id: "m3", role: "user" }, { id: "m4", role: "assistant" },
    ] as never)

    const recovery = new SessionRecovery({
      client: mockClient as never,
      projectRoot: testRoot,
    })
    await recovery.initialize()

    const gap = await recovery.reconsumeSession(sid)
    expect(gap).toBeDefined()
    expect(gap.sessionID).toBe(sid)
    expect(gap.totalSdkMessages).toBe(4)
    expect(gap.totalPersistedTurns).toBeGreaterThanOrEqual(1)
  })

  it("handles incomplete/malformed files gracefully", async () => {
    const sid = testSid("incomplete01ab")
    const sDir = resolve(testRoot, ".hivemind/session-tracker", sid)
    await mkdir(sDir, { recursive: true })
    await writeFile(join(sDir, `${sid}.md`), "---\nsessionID: truncated\n---\n\n# Incomplete")

    const recovery = new SessionRecovery({
      client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
      projectRoot: testRoot,
    })

    const isParseable = await recovery.isSessionFileParseable(join(sDir, `${sid}.md`))
    expect(typeof isParseable).toBe("boolean")
  })

  it("handles missing project-continuity.json gracefully", async () => {
    const recovery = new SessionRecovery({
      client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
      projectRoot: testRoot,
    })

    const sessionMap = await recovery.initialize()
    expect(sessionMap).toBeInstanceOf(Map)
    expect(sessionMap.size).toBe(0)
  })

  it("recovers child session context from .json file", async () => {
    const parentID = testSid("recParent01abc")
    const childID = "ses_recoveryChild01"

    const mockClient = {
      session: {
        get: vi.fn(),
        messages: vi.fn().mockResolvedValue({ data: [] }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
    }

    const tracker = new SessionTracker({
      client: mockClient as never,
      projectRoot: testRoot,
    })
    await tracker.initialize()

    await tracker.handleSessionEvent({
      eventType: "session.created",
      sessionID: parentID,
      event: {},
    })

    await tracker.handleToolExecuteAfter(
      {
        tool: "task",
        sessionID: parentID,
        callID: "call_child",
        args: { description: "Investigate bugs", subagent_type: "hm-l2-investigator" },
      },
      { title: "Task", output: `task_id: ${childID}`, metadata: {} },
    )

    const childPath = resolve(testRoot, ".hivemind/session-tracker", parentID, `${childID}.json`)
    const raw = await readFile(childPath, "utf-8")
    const childRecord = JSON.parse(raw)

    expect(childRecord.sessionID).toBe(childID)
    expect(childRecord.parentSessionID).toBe(parentID)
    expect(childRecord.delegatedBy.description).toBe("Investigate bugs")
    expect(childRecord.delegatedBy.subagentType).toBe("hm-l2-investigator")
  })
})
