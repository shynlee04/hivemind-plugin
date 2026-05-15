/**
 * Child writer delegationDepth and journey tests (CP-ST-05-01, Task 3).
 *
 * Validates that createChildFile writes delegationDepth and journey array
 * correctly for L1 and L2 child sessions.
 *
 * @module tests/features/session-tracker/persistence/child-writer-depth-journey
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

describe("ChildWriter — delegationDepth and journey (CP-ST-05-01 Task 3)", () => {
  let tmpDir: string
  let projectRoot: string
  let writer: ChildWriter

  beforeEach(() => {
    tmpDir = tmpdir()
    projectRoot = join(tmpDir, `st-test-${Date.now()}`)
    writer = new ChildWriter({ projectRoot })
  })

  afterEach(async () => {
    try {
      await rm(projectRoot, { recursive: true, force: true })
    } catch {
      // Best-effort cleanup
    }
  })

  it("writes L1 child with delegationDepth 1", async () => {
    await writer.createChildFile("ses_parent123", "ses_child456", {
      sessionID: "ses_child456",
      parentSessionID: "ses_parent123",
      delegationDepth: 1,
      delegatedBy: {
        agentName: "test",
        model: "",
        tool: "task",
        description: "test",
        subagentType: "general",
      },
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      status: "active",
      mainAgent: { name: "Test", model: "" },
      turns: [],
      children: [],
      journey: [],
    })

    // safeSessionPath prepends .hivemind/session-tracker/
    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      "ses_parent123",
      "ses_child456.json",
    )
    const raw = await readFile(filePath, "utf-8")
    const file = JSON.parse(raw)

    expect(file.delegationDepth).toBe(1)
    expect(file.journey).toEqual([])
  })

  it("writes L2 child with delegationDepth 2", async () => {
    await writer.createChildFile("ses_parent123", "ses_child789", {
      sessionID: "ses_child789",
      parentSessionID: "ses_parent123",
      delegationDepth: 2,
      delegatedBy: {
        agentName: "test",
        model: "",
        tool: "task",
        description: "test",
        subagentType: "hm-l2-researcher",
      },
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      status: "active",
      mainAgent: { name: "Test", model: "" },
      turns: [],
      children: [],
      journey: [],
    })

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      "ses_parent123",
      "ses_child789.json",
    )
    const raw = await readFile(filePath, "utf-8")
    const file = JSON.parse(raw)

    expect(file.delegationDepth).toBe(2)
    expect(Array.isArray(file.journey)).toBe(true)
  })

  it("writes child file with journey array populated", async () => {
    await writer.createChildFile("ses_parent123", "ses_childJourney", {
      sessionID: "ses_childJourney",
      parentSessionID: "ses_parent123",
      delegationDepth: 1,
      delegatedBy: {
        agentName: "test",
        model: "",
        tool: "task",
        description: "test",
        subagentType: "general",
      },
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      status: "active",
      mainAgent: { name: "Test", model: "" },
      turns: [],
      children: [],
      journey: [
        {
          timestamp: "2026-01-01T00:01:00Z",
          type: "tool_call",
          content: "read file.ts",
          metadata: { tool: "read" },
        },
        {
          timestamp: "2026-01-01T00:02:00Z",
          type: "assistant_message",
          content: "I've read the file",
        },
      ],
    })

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      "ses_parent123",
      "ses_childJourney.json",
    )
    const raw = await readFile(filePath, "utf-8")
    const file = JSON.parse(raw)

    expect(file.journey).toHaveLength(2)
    expect(file.journey[0].type).toBe("tool_call")
    expect(file.journey[1].type).toBe("assistant_message")
  })
})
