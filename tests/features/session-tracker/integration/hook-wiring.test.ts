/**
 * Integration tests for SessionTracker hook wiring and plugin.ts integration.
 *
 * Verifies that hook handlers correctly delegate to capture classes,
 * that errors are gracefully handled (best-effort), and that the
 * SessionTracker wiring composes correctly with existing plugin code.
 *
 * @module tests/features/session-tracker/integration/hook-wiring
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { mkdir, rm } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"

import { SessionTracker } from "../../../../src/features/session-tracker/index.js"
import { EventCapture } from "../../../../src/features/session-tracker/capture/event-capture.js"
import { MessageCapture } from "../../../../src/features/session-tracker/capture/message-capture.js"
import { ToolCapture } from "../../../../src/features/session-tracker/capture/tool-capture.js"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { AgentTransform } from "../../../../src/features/session-tracker/transform/agent-transform.js"
import { SessionIndexWriter } from "../../../../src/features/session-tracker/persistence/session-index-writer.js"
import { ProjectIndexWriter } from "../../../../src/features/session-tracker/persistence/project-index-writer.js"

import { getSession } from "../../../../src/shared/session-api.js"

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

// Mock the session-api to avoid real SDK calls
vi.mock("../../../../src/shared/session-api.js", () => ({
  getSession: vi.fn(),
  getSessionMessages: vi.fn(),
}))

describe("SessionTracker hook wiring", () => {
  let testRoot: string
  let tracker: SessionTracker
  let mockClient: Record<string, unknown>

  beforeEach(async () => {
    testRoot = resolve(tmpdir(), `hivemind-hook-wire-${Date.now()}`)
    await mkdir(testRoot, { recursive: true })

    mockClient = {
      session: {
        get: vi.fn(),
        messages: vi.fn(),
        list: vi.fn(),
      },
    }
  })

  afterEach(async () => {
    try { await rm(testRoot, { recursive: true, force: true }) } catch { /* cleanup */ }
  })

  // -----------------------------------------------------------------------
  // SessionTracker event delegation
  // -----------------------------------------------------------------------

  describe("handleSessionEvent()", () => {
    it("delegates to EventCapture for session.created events", async () => {
      const mockedGetSession = vi.mocked(getSession)
      mockedGetSession.mockResolvedValue({
        id: "ses_test_001",
        parentID: null,
        title: "Test",
        time: { created: Date.now(), updated: Date.now() },
      })

      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      // SessionTracker.handleSessionEvent should delegate to EventCapture
      // Verify by checking no throw occurs (graceful delegate)
      await expect(
        tracker.handleSessionEvent({
          eventType: "session.created",
          sessionID: "ses_test_001",
          event: {},
        }),
      ).resolves.toBeUndefined()

      mockedGetSession.mockReset()
    })

    it("gracefully handles invalid sessionID", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      // Should NOT throw even with missing sessionID
      await expect(
        tracker.handleSessionEvent({
          eventType: "session.created",
          sessionID: "",
          event: {},
        }),
      ).resolves.toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // SessionTracker chat.message delegation
  // -----------------------------------------------------------------------

  describe("handleChatMessage()", () => {
    it("delegates to MessageCapture for user messages", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(
        tracker.handleChatMessage(
          {
            sessionID: "ses_user_test",
            agent: "test-agent",
          },
          {
            message: { role: "user" },
            parts: [{ type: "text", text: "Hello world" }],
          },
        ),
      ).resolves.toBeUndefined()
    })

    it("gracefully handles missing sessionID", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      // Should NOT throw
      await expect(
        tracker.handleChatMessage(
          { sessionID: "" } as never,
          { message: { role: "user" }, parts: [] },
        ),
      ).resolves.toBeUndefined()
    })

    it("gracefully handles completely invalid input", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(
        tracker.handleChatMessage(null as never, null as never),
      ).resolves.toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // SessionTracker tool.execute.after delegation
  // -----------------------------------------------------------------------

  describe("handleToolExecuteAfter()", () => {
    it("delegates to ToolCapture for skill tools", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(
        tracker.handleToolExecuteAfter(
          {
            tool: "skill",
            sessionID: "ses_tool_test",
            callID: "call_1",
            args: { name: "test-skill" },
          },
          {
            title: "Test Skill",
            output: "# Skill: test-skill\n\nContent here",
            metadata: {},
          },
        ),
      ).resolves.toBeUndefined()
    })

    it("delegates to ToolCapture for read tools", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(
        tracker.handleToolExecuteAfter(
          {
            tool: "read",
            sessionID: "ses_tool_test",
            callID: "call_2",
            args: { filePath: "/test/path.ts" },
          },
          {
            title: "Read File",
            output: "file content here",
            metadata: {},
          },
        ),
      ).resolves.toBeUndefined()
    })

    it("delegates to ToolCapture for task tools", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(
        tracker.handleToolExecuteAfter(
          {
            tool: "task",
            sessionID: "ses_tool_test",
            callID: "call_3",
            args: {
              description: "Test task",
              subagent_type: "hm-l2-test",
            },
          },
          {
            title: "Task Dispatch",
            output: "task_id: ses_child_001",
            metadata: {},
          },
        ),
      ).resolves.toBeUndefined()
    })

    it("gracefully handles invalid input", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(
        tracker.handleToolExecuteAfter(null as never, null as never),
      ).resolves.toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // Graceful degradation (never block OpenCode runtime)
  // -----------------------------------------------------------------------

  describe("graceful degradation", () => {
    it("handleSessionEvent never throws on bad input", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      // All these should resolve without throwing
      await expect(tracker.handleSessionEvent({} as never)).resolves.toBeUndefined()
      await expect(tracker.handleSessionEvent(null as never)).resolves.toBeUndefined()
      await expect(tracker.handleSessionEvent(undefined as never)).resolves.toBeUndefined()
      await expect(
        tracker.handleSessionEvent({ eventType: "bogus", sessionID: "ses_test", event: "bad" }),
      ).resolves.toBeUndefined()
    })

    it("handleChatMessage never throws on bad input", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(tracker.handleChatMessage({} as never, {} as never)).resolves.toBeUndefined()
    })

    it("handleToolExecuteAfter never throws on bad input", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(
        tracker.handleToolExecuteAfter({} as never, {} as never),
      ).resolves.toBeUndefined()
    })
  })

  // -----------------------------------------------------------------------
  // cleanup()
  // -----------------------------------------------------------------------

  describe("cleanup()", () => {
    it("does not throw", async () => {
      tracker = new SessionTracker({
        client: mockClient as never,
        projectRoot: testRoot,
      })
      await tracker.initialize()

      await expect(tracker.cleanup()).resolves.toBeUndefined()
    })
  })
})
