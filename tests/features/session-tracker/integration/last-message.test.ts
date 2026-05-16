/**
 * LastMessage capture integration tests (RC-4).
 *
 * Verifies that lastMessage is correctly captured and persisted during
 * child session write operations — including turn appends, initial creation,
 * and updates via status changes.
 *
 * These tests exercise real filesystem I/O with temp directories.
 *
 * @module tests/features/session-tracker/integration/last-message
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdir, rm, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { tmpdir } from "node:os"
import { randomBytes } from "node:crypto"
import type { ChildSessionRecord } from "../../../../src/features/session-tracker/types.js"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { HierarchyIndex } from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tempProjectRoot(): Promise<string> {
  const dir = resolve(tmpdir(), `st-lastmsg-${randomBytes(4).toString("hex")}`)
  await mkdir(dir, { recursive: true })
  return dir
}

const PARENT = "ses_parent_lastmsg"
const CHILD = "ses_child_lastmsg"

function makeChildRecord(overrides: Partial<ChildSessionRecord> & { sessionID: string }): ChildSessionRecord {
  return {
    parentSessionID: PARENT,
    delegationDepth: 1,
    delegatedBy: {
      agentName: "test-agent",
      model: "test-model",
      tool: "task",
      description: "test delegation",
      subagentType: "test-agent",
    },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    status: "active",
    mainAgent: { name: "test-agent", model: "test-model" },
    turns: [],
    children: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("LastMessage capture (RC-4)", () => {
  let testRoot: string
  let childWriter: ChildWriter
  let hierarchyIndex: HierarchyIndex

  beforeEach(async () => {
    testRoot = await tempProjectRoot()
    hierarchyIndex = new HierarchyIndex({ projectRoot: testRoot })
    childWriter = new ChildWriter({ projectRoot: testRoot, hierarchyIndex })

    // Register child in hierarchy
    hierarchyIndex.registerChild(PARENT, CHILD)

    // Create parent directory
    const trackerDir = resolve(testRoot, ".hivemind", "session-tracker", PARENT)
    await mkdir(trackerDir, { recursive: true })
  })

  afterEach(async () => {
    try {
      await rm(testRoot, { recursive: true, force: true })
    } catch {
      /* cleanup best-effort */
    }
  })

  async function readChildFile(): Promise<ChildSessionRecord> {
    const childPath = resolve(
      testRoot, ".hivemind", "session-tracker", PARENT, `${CHILD}.json`,
    )
    return JSON.parse(await readFile(childPath, "utf-8"))
  }

  describe("lastMessage on child creation", () => {
    it("persists lastMessage from metadata during createChildFile", async () => {
      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
        lastMessage: "Initial task description",
      }))

      const content = await readChildFile()
      expect(content.lastMessage).toBe("Initial task description")
    })

    it("sets lastMessage to undefined when not provided in metadata", async () => {
      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
        // No lastMessage
      }))

      const content = await readChildFile()
      // lastMessage should be absent or undefined
      expect(content.lastMessage).toBeUndefined()
    })
  })

  describe("lastMessage on turn append", () => {
    it("updates lastMessage with latest non-user turn content", async () => {
      // Create child
      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
      }))

      // Append a turn — this should update lastMessage (non-user actor)
      await childWriter.appendChildTurn(PARENT, CHILD, {
        actor: "assistant",
        content: "Analysis complete. Found 3 issues.",
      })

      const content = await readChildFile()
      expect(content.lastMessage).toBe("Analysis complete. Found 3 issues.")
      expect(content.turns).toHaveLength(1)
    })

    it("keeps the most recent turn as lastMessage after multiple appends", async () => {
      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
      }))

      await childWriter.appendChildTurn(PARENT, CHILD, {
        actor: "assistant",
        content: "First response",
      })

      await childWriter.appendChildTurn(PARENT, CHILD, {
        actor: "assistant",
        content: "Final summary with recommendations",
      })

      const content = await readChildFile()
      expect(content.lastMessage).toBe("Final summary with recommendations")
      expect(content.turns).toHaveLength(2)
    })

    it("does not update lastMessage for user actor turns", async () => {
      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
        lastMessage: "Existing message",
      }))

      // User turn should NOT update lastMessage per P-04 logic
      await childWriter.appendChildTurn(PARENT, CHILD, {
        actor: "user",
        content: "Please investigate this issue",
      })

      const content = await readChildFile()
      expect(content.lastMessage).toBe("Existing message")
      expect(content.turns).toHaveLength(1)
    })
  })

  describe("lastMessage preservation on status update", () => {
    it("preserves lastMessage when updateChildStatus is called", async () => {
      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
        lastMessage: "Original message",
      }))

      // Update status
      await childWriter.updateChildStatus(PARENT, CHILD, "completed")

      const content = await readChildFile()
      expect(content.status).toBe("completed")
      expect(content.lastMessage).toBe("Original message")
    })
  })

  describe("edge cases", () => {
    it("handles empty string lastMessage", async () => {
      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
        lastMessage: "",
      }))

      const content = await readChildFile()
      // Empty string is a valid lastMessage
      expect(content.lastMessage).toBe("")
    })

    it("handles very long lastMessage without truncation", async () => {
      const longMessage = "A".repeat(5000)

      await childWriter.createChildFile(PARENT, CHILD, makeChildRecord({
        sessionID: CHILD,
        lastMessage: longMessage,
      }))

      const content = await readChildFile()
      expect(content.lastMessage).toBe(longMessage)
      expect(content.lastMessage).toHaveLength(5000)
    })
  })
})
