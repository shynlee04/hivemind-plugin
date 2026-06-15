/**
 * Tests for journey recording in child sessions (CP-ST-05-02 Task 2).
 *
 * Verifies that tool calls, results, and assistant messages are recorded
 * to child session .json journey arrays.
 *
 * @module tests/features/session-tracker/journey-recording-child
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { ChildWriter } from "../../../src/features/session-tracker/persistence/child-writer.js"
import type { JourneyEntry } from "../../../src/features/session-tracker/types.js"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { mkdir, rm, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"

describe("ChildWriter journey recording", () => {
  let childWriter: ChildWriter
  let testDir: string
  let parentDir: string

  beforeEach(async () => {
    testDir = join(tmpdir(), `journey-test-${Date.now()}`)
    parentDir = join(testDir, ".hivemind", "session-tracker", "ses_parent123")
    await mkdir(parentDir, { recursive: true })

    childWriter = new ChildWriter({ projectRoot: testDir })
  })

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true }).catch(() => {})
  })

  it("appendJourneyEntry adds entry to child session journey array", async () => {
    // Create a child file first
    const childID = "ses_child456"
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

    const entry: JourneyEntry = {
      timestamp: "2026-05-15T12:00:00Z",
      type: "tool_call",
      content: "Read /test/file.ts",
      metadata: { toolName: "Read" },
    }

    await childWriter.appendJourneyEntry("ses_parent123", childID, entry)

    const raw = await readFile(childPath, "utf-8")
    const record = JSON.parse(raw) as { journey: JourneyEntry[] }
    expect(record.journey).toHaveLength(1)
    expect(record.journey[0].type).toBe("tool_call")
    expect(record.journey[0].content).toBe("Read /test/file.ts")
  })

  it("appendJourneyEntry records tool_result type", async () => {
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

    await childWriter.appendJourneyEntry("ses_parent123", childID, {
      timestamp: "2026-05-15T12:01:00Z",
      type: "tool_result",
      content: "File contents...",
      metadata: { toolName: "Read", status: "success" },
    })

    const raw = await readFile(childPath, "utf-8")
    const record = JSON.parse(raw) as { journey: JourneyEntry[] }
    expect(record.journey).toHaveLength(1)
    expect(record.journey[0].type).toBe("tool_result")
  })

  it("appendJourneyEntry records assistant_message type", async () => {
    const childID = "ses_childabc"
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

    await childWriter.appendJourneyEntry("ses_parent123", childID, {
      timestamp: "2026-05-15T12:02:00Z",
      type: "assistant_message",
      content: "I found 3 issues in the codebase...",
    })

    const raw = await readFile(childPath, "utf-8")
    const record = JSON.parse(raw) as { journey: JourneyEntry[] }
    expect(record.journey).toHaveLength(1)
    expect(record.journey[0].type).toBe("assistant_message")
  })

  it("appendJourneyEntry appends to existing journey entries", async () => {
    const childID = "ses_childdef"
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
      journey: [
        { timestamp: "2026-05-15T11:00:00Z", type: "tool_call" as const, content: "first" },
      ],
    }))

    await childWriter.appendJourneyEntry("ses_parent123", childID, {
      timestamp: "2026-05-15T12:03:00Z",
      type: "tool_call",
      content: "second",
    })

    const raw = await readFile(childPath, "utf-8")
    const record = JSON.parse(raw) as { journey: JourneyEntry[] }
    expect(record.journey).toHaveLength(2)
    expect(record.journey[1].content).toBe("second")
  })
})
