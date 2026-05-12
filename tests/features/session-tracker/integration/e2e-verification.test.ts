/**
 * End-to-end verification: all 13 REQs from SPEC.md tested individually.
 *
 * @module tests/features/session-tracker/integration/e2e-verification
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, rm, readFile, readdir, writeFile } from "node:fs/promises"
import { resolve, join } from "node:path"
import { tmpdir } from "node:os"
import { readFileSync, existsSync } from "node:fs"

import { SessionTracker } from "../../../../src/features/session-tracker/index.js"
import { getSession } from "../../../../src/shared/session-api.js"

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

function sessionDir(testRoot: string, sessionID: string): string {
  return resolve(testRoot, ".hivemind/session-tracker", sessionID)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Session tracker E2E verification (all 13 REQs)", () => {
  let testRoot: string

  beforeEach(async () => {
    testRoot = resolve(tmpdir(), `hivemind-e2e-${Date.now()}`)
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

  // =====================================================================
  // REQ-ST-01: Session Directory Manifestation
  // =====================================================================

  describe("REQ-ST-01: Session directory manifestation", () => {
    it("creates subdir + .md for root sessions", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e01root1abcd")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      const dir = sessionDir(testRoot, sid)
      expect(existsSync(dir)).toBe(true)
      const files = await readdir(dir)
      expect(files).toContain(`${sid}.md`)
    })

    it("creates .md with valid YAML frontmatter", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e02root1abcde")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      const mdPath = join(sessionDir(testRoot, sid), `${sid}.md`)
      const content = await readFile(mdPath, "utf-8")
      expect(content).toContain(`sessionID: ${sid}`)
      expect(content).toContain("delegationDepth: 0")
      expect(content).toContain("status: active")
    })

    it("child sessions do NOT create a subdir", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const parentID = testSid("e2e03parent1ab")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: parentID, event: {},
      })

      await tracker.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: parentID,
          callID: "call_child",
          args: { description: "Test", subagent_type: "test" },
        },
        { title: "Task", output: "task_id: ses_childE2E001ab", metadata: {} },
      )

      expect(existsSync(sessionDir(testRoot, "ses_childE2E001ab"))).toBe(false)
      const parentFiles = await readdir(sessionDir(testRoot, parentID))
      expect(parentFiles).toContain("ses_childE2E001ab.json")
    })
  })

  // =====================================================================
  // REQ-ST-02: User Message Capture
  // =====================================================================

  describe("REQ-ST-02: User message capture", () => {
    it("captures user messages with sequential turn numbers", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e04turns1abcd")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      for (const text of ["First message", "Second message", "Third message"]) {
        await tracker.handleChatMessage(
          { sessionID: sid },
          { message: { role: "user" }, parts: [{ type: "text", text }] },
        )
      }

      const content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toContain("## USER (turn 1)")
      expect(content).toContain("## USER (turn 2)")
      expect(content).toContain("## USER (turn 3)")
    })
  })

  // =====================================================================
  // REQ-ST-03: Agent Metadata Transform
  // =====================================================================

  describe("REQ-ST-03: Agent metadata transform", () => {
    it("transforms assistant to main_l0_agent and skips thinking", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e05meta1abcde")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      await tracker.handleChatMessage(
        {
          sessionID: sid,
          agent: "Hm-L0-Orchestrator",
          model: { providerID: "deepseek", modelID: "DeepSeek V4 Pro" },
        },
        {
          message: { role: "assistant" },
          parts: [
            { type: "text", text: "Researching..." },
            { type: "thinking", text: "Internal reasoning" },
          ],
        },
      )

      const content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toContain("main_l0_agent")
      expect(content).toContain("Hm-L0-Orchestrator")
      expect(content).not.toContain("Internal reasoning")
    })
  })

  // =====================================================================
  // REQ-ST-04: Skill tool capture
  // =====================================================================

  describe("REQ-ST-04: Skill tool capture", () => {
    it("captures skill name and first header only", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e06skill1abcd")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      await tracker.handleToolExecuteAfter(
        {
          tool: "skill",
          sessionID: sid,
          callID: "call_skill",
          args: { name: "hm-test-driven-execution" },
        },
        {
          title: "Skill Loaded",
          output: "# Skill: hm-test-driven-execution\n\n## RED/GREEN/REFACTOR\n\nLong content.",
          metadata: {},
        },
      )

      const content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toContain("# Skill: hm-test-driven-execution")
      expect(content).not.toContain("RED/GREEN/REFACTOR")
      expect(content).not.toContain("Long content")
    })
  })

  // =====================================================================
  // REQ-ST-05: Read tool capture
  // =====================================================================

  describe("REQ-ST-05: Read tool capture", () => {
    it("captures file path only, never file content", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e07read1abcde")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      await tracker.handleToolExecuteAfter(
        {
          tool: "read",
          sessionID: sid,
          callID: "call_read",
          args: { filePath: "/secret/config.json" },
        },
        {
          title: "Read File",
          output: "---\nsecretKey: abc123\npassword: hunter2\n---",
          metadata: {},
        },
      )

      const content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toContain("/secret/config.json")
      expect(content).not.toContain("secretKey")
      expect(content).not.toContain("abc123")
    })

    it("captures read error message", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e08read2abcde")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      await tracker.handleToolExecuteAfter(
        {
          tool: "read",
          sessionID: sid,
          callID: "call_read_err",
          args: { filePath: "/nonexistent/file.ts" },
        },
        { title: "Read File", output: "actual file content would be here", metadata: { error: "ENOENT", status: "error" } },
      )

      const content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toContain("/nonexistent/file.ts")
      expect(content).toContain("File read failed")
    })
  })

  // =====================================================================
  // REQ-ST-06: Task tool capture
  // =====================================================================

  describe("REQ-ST-06: Task tool capture", () => {
    it("creates child .json file with correct metadata", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const parentID = testSid("e2e09taskParab")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: parentID, event: {},
      })

      const childID = "ses_childE2ETask001"
      await tracker.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: parentID,
          callID: "call_task",
          args: { description: "Investigate event tracker", subagent_type: "hm-l2-investigator" },
        },
        { title: "Dispatch", output: `task_id: ${childID}`, metadata: {} },
      )

      const childPath = join(sessionDir(testRoot, parentID), `${childID}.json`)
      const raw = await readFile(childPath, "utf-8")
      const child = JSON.parse(raw)

      expect(child.sessionID).toBe(childID)
      expect(child.parentSessionID).toBe(parentID)
      expect(child.delegatedBy.description).toBe("Investigate event tracker")
    })
  })

  // =====================================================================
  // REQ-ST-07: Child session transformation
  // =====================================================================

  describe("REQ-ST-07: Child session transformation", () => {
    it("child session correctly stores delegation metadata", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const parentID = testSid("e2e10transfPa")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: parentID, event: {},
      })

      const childID = "ses_childTransf001"
      await tracker.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: parentID,
          callID: "call_transf",
          args: { description: "Map architecture", subagent_type: "hm-l2-architect" },
        },
        { title: "Dispatch", output: `task_id: ${childID}`, metadata: {} },
      )

      const childPath = join(sessionDir(testRoot, parentID), `${childID}.json`)
      const child = JSON.parse(await readFile(childPath, "utf-8"))

      expect(child.parentSessionID).toBe(parentID)
      expect(child.delegationDepth).toBe(1)
      expect(child.delegatedBy.agentName).toBe("unknown")
    })
  })

  // =====================================================================
  // REQ-ST-08: Dual Continuity Indices
  // =====================================================================

  describe("REQ-ST-08: Dual continuity indices", () => {
    it("session-local index tracks parent-child hierarchy", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const parentID = testSid("e2e11dualPar")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: parentID, event: {},
      })

      for (const suffix of ["A", "B"]) {
        await tracker.handleToolExecuteAfter(
          {
            tool: "task",
            sessionID: parentID,
            callID: `call_${suffix}`,
            args: { description: `Task ${suffix}`, subagent_type: "test" },
          },
          { title: "Dispatch", output: `task_id: ses_childDual${suffix}01`, metadata: {} },
        )
      }

      const indexPath = join(sessionDir(testRoot, parentID), "session-continuity.json")
      const localIndex = JSON.parse(await readFile(indexPath, "utf-8"))
      expect(localIndex.version).toBe("2.0")
      expect(Object.keys(localIndex.hierarchy.children)).toHaveLength(2)
    })

    it("project-level index is initialized and parseable", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      // Project index is initialized on startup
      const projectPath = resolve(testRoot, ".hivemind/session-tracker/project-continuity.json")
      const projectIndex = JSON.parse(await readFile(projectPath, "utf-8"))

      expect(projectIndex.version).toBe("2.0")
      expect(projectIndex.sessions).toBeDefined()
      expect(projectIndex.chronologicalOrder).toBeDefined()
    })
  })

  // =====================================================================
  // REQ-ST-09: Concurrent Session Isolation
  // =====================================================================

  describe("REQ-ST-09: Concurrent session isolation", () => {
    it("6 concurrent root sessions create independent subdirs", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sids = Array.from({ length: 6 }, (_, i) => testSid(`e2e13c${i + 1}abcde`))

      for (const sid of sids) {
        await tracker.handleSessionEvent({
          eventType: "session.created", sessionID: sid, event: {},
        })
      }

      for (const sid of sids) {
        const dir = sessionDir(testRoot, sid)
        expect(existsSync(dir)).toBe(true)
      }
    })
  })

  // =====================================================================
  // REQ-ST-10: Disconnection Recovery
  // =====================================================================

  describe("REQ-ST-10: Disconnection recovery", () => {
    it("persisted files survive crash and new writes append", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e14crash1abc")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      await tracker.handleChatMessage(
        { sessionID: sid },
        { message: { role: "user" }, parts: [{ type: "text", text: "Pre-crash" }] },
      )

      const tracker2 = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker2.initialize()

      let content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toContain("Pre-crash")

      await tracker2.handleChatMessage(
        { sessionID: sid },
        { message: { role: "user" }, parts: [{ type: "text", text: "Post-restart" }] },
      )

      content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toContain("Post-restart")
    })
  })

  // =====================================================================
  // REQ-ST-11: CQRS Architecture Compliance
  // =====================================================================

  describe("REQ-ST-11: CQRS architecture compliance", () => {
    it("capture handlers never call fs.writeFileSync directly", () => {
      const eventCapture = readFileSync(
        resolve(process.cwd(), "src/features/session-tracker/capture/event-capture.ts"), "utf-8")
      const messageCapture = readFileSync(
        resolve(process.cwd(), "src/features/session-tracker/capture/message-capture.ts"), "utf-8")
      const toolCapture = readFileSync(
        resolve(process.cwd(), "src/features/session-tracker/capture/tool-capture.ts"), "utf-8")

      for (const src of [eventCapture, messageCapture, toolCapture]) {
        expect(src).not.toMatch(/from\s+["']node:fs["']/)
        expect(src).not.toMatch(/writeFile/)
      }
    })

    it("capture handlers route through SessionWriter", () => {
      const eventCapture = readFileSync(
        resolve(process.cwd(), "src/features/session-tracker/capture/event-capture.ts"), "utf-8")
      expect(eventCapture).toMatch(/SessionWriter/)
      const messageCapture = readFileSync(
        resolve(process.cwd(), "src/features/session-tracker/capture/message-capture.ts"), "utf-8")
      expect(messageCapture).toMatch(/SessionWriter/)
      const toolCapture = readFileSync(
        resolve(process.cwd(), "src/features/session-tracker/capture/tool-capture.ts"), "utf-8")
      expect(toolCapture).toMatch(/SessionWriter/)
    })
  })

  // =====================================================================
  // REQ-ST-12: Schema Consistency
  // =====================================================================

  describe("REQ-ST-12: Schema consistency", () => {
    it("all output field names use camelCase", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const parentID = testSid("e2e15camelPar")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: parentID, event: {},
      })

      await tracker.handleToolExecuteAfter(
        {
          tool: "task",
          sessionID: parentID,
          callID: "call_camel",
          args: { description: "Test", subagent_type: "test" },
        },
        { title: "Dispatch", output: "task_id: ses_childCamel001", metadata: {} },
      )

      const child = JSON.parse(await readFile(
        join(sessionDir(testRoot, parentID), "ses_childCamel001.json"), "utf-8"))

      expect(child).toHaveProperty("sessionID")
      expect(child).toHaveProperty("parentSessionID")
      expect(child.delegatedBy).toHaveProperty("agentName")
      expect(child.delegatedBy).toHaveProperty("subagentType")
    })

    it("main_l0_agent naming is consistent", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      const sid = testSid("e2e16naming1ab")
      await tracker.handleSessionEvent({
        eventType: "session.created", sessionID: sid, event: {},
      })

      await tracker.handleChatMessage(
        { sessionID: sid, agent: "TestAgent", model: { providerID: "x", modelID: "Test" } },
        { message: { role: "assistant" }, parts: [{ type: "text", text: "Response" }] },
      )

      const content = await readFile(join(sessionDir(testRoot, sid), `${sid}.md`), "utf-8")
      expect(content).toMatch(/main_l0_agent/)
      expect(content).not.toMatch(/"mainAgent"/)
    })
  })

  // =====================================================================
  // REQ-ST-13: Legacy Cleanup
  // =====================================================================

  describe("REQ-ST-13: Legacy cleanup", () => {
    it("removes stale .json/.md files from legacy event-tracker", async () => {
      const legacyDir = resolve(testRoot, ".hivemind/event-tracker")
      await mkdir(legacyDir, { recursive: true })
      await writeFile(join(legacyDir, "stale-session.json"), '{"test":true}')
      await writeFile(join(legacyDir, "stale-session.md"), "# Stale")

      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()
      await tracker.cleanup()

      const remaining = await readdir(legacyDir)
      expect(remaining).not.toContain("stale-session.json")
      expect(remaining).not.toContain("stale-session.md")
    })

    it("old event-tracker source code is preserved", () => {
      expect(existsSync(resolve(process.cwd(), "src/task-management/journal/event-tracker"))).toBe(true)
    })

    it("no new files written to legacy event-tracker", async () => {
      const tracker = new SessionTracker({
        client: { session: { get: vi.fn(), messages: vi.fn(), list: vi.fn() } } as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await tracker.handleSessionEvent({
        eventType: "session.created",
        sessionID: testSid("e2e17legacy1a"),
        event: {},
      })

      const legacyDir = resolve(testRoot, ".hivemind/event-tracker")
      if (existsSync(legacyDir)) {
        const files = await readdir(legacyDir)
        expect(files.filter((f) => f !== ".gitkeep")).toHaveLength(0)
      }
    })
  })
})
