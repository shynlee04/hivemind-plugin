/**
 * Tests for journey recording routing in EventCapture (CP-ST-05-02 Task 3).
 *
 * Verifies that journey entries are routed to child .json files for child
 * sessions and to main session .md files for root sessions.
 *
 * @module tests/features/session-tracker/journey-recording-routing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { EventCapture } from "../../../src/features/session-tracker/capture/event-capture.js"
import { ChildWriter } from "../../../src/features/session-tracker/persistence/child-writer.js"
import { SessionWriter } from "../../../src/features/session-tracker/persistence/session-writer.js"
import { SessionIndexWriter } from "../../../src/features/session-tracker/persistence/session-index-writer.js"
import type { OpenCodeClient } from "../../../shared/session-api.js"
import type { JourneyEntry } from "../../../src/features/session-tracker/types.js"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { mkdir, rm, readFile, writeFile } from "node:fs/promises"

describe("EventCapture journey recording routing", () => {
  let eventCapture: EventCapture
  let childWriter: ChildWriter
  let sessionWriter: SessionWriter
  let sessionIndexWriter: SessionIndexWriter
  let mockClient: OpenCodeClient
  let testDir: string
  let parentDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `journey-routing-test-${Date.now()}`)
    parentDir = join(testDir, ".hivemind", "session-tracker", "ses_parent123")
    await mkdir(parentDir, { recursive: true })

    childWriter = new ChildWriter({ projectRoot: testDir })
    sessionWriter = new SessionWriter({ projectRoot: testDir })
    sessionIndexWriter = new SessionIndexWriter({ projectRoot: testDir })

    mockClient = {
      session: {
        get: vi.fn().mockResolvedValue({ parentID: null }),
      },
      app: {
        log: vi.fn(),
      },
    } as unknown as OpenCodeClient

    eventCapture = new EventCapture({
      client: mockClient,
      sessionWriter,
      childWriter,
      sessionIndexWriter,
    })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true }).catch(() => {})
  })

  describe("recordJourneyEntry", () => {
    it("routes to childWriter.appendJourneyEntry for child sessions", async () => {
      // Mock SDK to return a parentID (child session)
      vi.mocked(mockClient.session.get).mockResolvedValue({
        parentID: "ses_parent123",
      })

      // Create child file
      const childID = "ses_child789"
      const childPath = join(parentDir, `${childID}.json`)
      await writeFile(childPath, JSON.stringify({
        sessionID: childID,
        parentSessionID: "ses_parent123",
        delegationDepth: 1,
        delegatedBy: { agentName: "test", model: "", tool: "task", description: "", subagentType: "test" },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        status: "active",
        mainAgent: { name: "test", model: "" },
        turns: [],
        children: [],
        journey: [],
      }))

      await eventCapture.recordJourneyEntry(childID, {
        timestamp: "2026-05-15T12:00:00Z",
        type: "tool_call",
        content: "Read file.ts",
        metadata: { tool: "read" },
      })

      const raw = await readFile(childPath, "utf-8")
      const record = JSON.parse(raw) as { journey: JourneyEntry[] }
      expect(record.journey).toHaveLength(1)
      expect(record.journey[0].type).toBe("tool_call")
    })

    it("routes to sessionWriter for main sessions (no parentID)", async () => {
      // Mock SDK to return null parentID (main session)
      vi.mocked(mockClient.session.get).mockResolvedValue({ parentID: null })

      // Create main session .md file
      const sessionID = "ses_main123"
      const mainDir = join(testDir, ".hivemind", "session-tracker", sessionID)
      await mkdir(mainDir, { recursive: true })
      const mainPath = join(mainDir, `${sessionID}.md`)
      await writeFile(mainPath, `---
sessionID: ${sessionID}
created: "2026-05-15T11:00:00Z"
updated: "2026-05-15T11:00:00Z"
parentSessionID: null
delegationDepth: 0
children: []
continuityIndex: session-continuity.json
status: active
---
`)

      await eventCapture.recordJourneyEntry(sessionID, {
        timestamp: "2026-05-15T12:00:00Z",
        type: "tool_call",
        content: "Write file.ts",
        metadata: { tool: "write" },
      })

      const raw = await readFile(mainPath, "utf-8")
      expect(raw).toContain("## JOURNEY")
      expect(raw).toContain("tool_call")
      expect(raw).toContain("Write file.ts")
    })

    it("handles SDK failure gracefully (falls back to main session routing)", async () => {
      vi.mocked(mockClient.session.get).mockRejectedValue(new Error("SDK error"))

      const sessionID = "ses_fallback123"
      const mainDir = join(testDir, ".hivemind", "session-tracker", sessionID)
      await mkdir(mainDir, { recursive: true })
      const mainPath = join(mainDir, `${sessionID}.md`)
      await writeFile(mainPath, `---
sessionID: ${sessionID}
status: active
---
`)

      // Should not throw — falls back to main session routing
      await eventCapture.recordJourneyEntry(sessionID, {
        timestamp: "2026-05-15T12:00:00Z",
        type: "assistant_message",
        content: "Hello world",
      })

      const raw = await readFile(mainPath, "utf-8")
      expect(raw).toContain("assistant_message")
    })
  })
})
