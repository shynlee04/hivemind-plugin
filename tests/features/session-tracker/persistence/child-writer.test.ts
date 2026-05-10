/**
 * Tests for ChildWriter — child session .json file management.
 *
 * Verifies creation, status updates, and turn appends on child session
 * JSON files stored under parent session subdirectories.
 * All writes use atomic rename for crash safety.
 */

import { mkdtempSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import type { ChildSessionRecord, Turn } from "../../../../src/features/session-tracker/types.js"

let tmpDir: string
let writer: ChildWriter
let projectRoot: string
const parentSessionID = "ses_parent123456789"
const childSessionID = "ses_child123456789"

const baseMetadata: ChildSessionRecord = {
  sessionID: childSessionID,
  parentSessionID,
  delegationDepth: 1,
  delegatedBy: {
    agentName: "Hm-L0-Orchestrator",
    tool: "task",
    description: "Investigate event tracker bugs",
    subagentType: "hm-l2-investigator",
  },
  created: "2026-01-01T00:00:00Z",
  updated: "2026-01-01T00:00:00Z",
  status: "active",
  mainAgent: {
    name: "Hm-L2-Investigator",
    model: "DeepSeek V4 Pro",
  },
  turns: [],
  children: [],
}

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "st-child-writer-"))
  projectRoot = join(tmpDir, "project")
  writer = new ChildWriter({ projectRoot })
})

afterEach(() => {
  const fs = require("node:fs")
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// createChildFile tests
// ---------------------------------------------------------------------------

describe("createChildFile", () => {
  it("creates a .json file under the parent session subdirectory", async () => {
    await writer.createChildFile(parentSessionID, childSessionID, baseMetadata)

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    expect(existsSync(filePath)).toBe(true)
  })

  it("writes valid JSON with correct structure", async () => {
    await writer.createChildFile(parentSessionID, childSessionID, baseMetadata)

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw)

    expect(parsed.sessionID).toBe(childSessionID)
    expect(parsed.parentSessionID).toBe(parentSessionID)
    expect(parsed.delegationDepth).toBe(1)
    expect(parsed.status).toBe("active")
    expect(parsed.delegatedBy.agentName).toBe("Hm-L0-Orchestrator")
    expect(parsed.delegatedBy.subagentType).toBe("hm-l2-investigator")
    expect(parsed.mainAgent.name).toBe("Hm-L2-Investigator")
    expect(parsed.turns).toEqual([])
    expect(parsed.children).toEqual([])
  })

  it("creates the parent subdirectory if it does not exist", async () => {
    await writer.createChildFile(parentSessionID, childSessionID, baseMetadata)

    const parentDir = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
    )
    expect(existsSync(parentDir)).toBe(true)
  })

  it("uses consistent camelCase field names in output (REQ-ST-12)", async () => {
    await writer.createChildFile(parentSessionID, childSessionID, baseMetadata)

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))

    // All top-level keys must be camelCase
    for (const key of Object.keys(parsed)) {
      expect(key).toMatch(/^[a-z]/)
      expect(key).not.toContain("_")
    }
  })
})

// ---------------------------------------------------------------------------
// updateChildStatus tests
// ---------------------------------------------------------------------------

describe("updateChildStatus", () => {
  beforeEach(async () => {
    await writer.createChildFile(parentSessionID, childSessionID, baseMetadata)
  })

  it("updates the status field in the child .json file", async () => {
    await writer.updateChildStatus(parentSessionID, childSessionID, "completed")

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))

    expect(parsed.status).toBe("completed")
  })

  it("preserves other fields during status update", async () => {
    await writer.updateChildStatus(parentSessionID, childSessionID, "error")

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))

    expect(parsed.sessionID).toBe(childSessionID)
    expect(parsed.delegatedBy.agentName).toBe("Hm-L0-Orchestrator")
    expect(parsed.mainAgent.name).toBe("Hm-L2-Investigator")
  })

  it("throws for non-existent child file", async () => {
    await expect(
      writer.updateChildStatus(parentSessionID, "ses_nonexistent12345", "completed"),
    ).rejects.toThrow()
  })
})

// ---------------------------------------------------------------------------
// appendChildTurn tests
// ---------------------------------------------------------------------------

describe("appendChildTurn", () => {
  beforeEach(async () => {
    await writer.createChildFile(parentSessionID, childSessionID, baseMetadata)
  })

  it("appends a turn to the turns array", async () => {
    const turn: Turn = {
      turn: 1,
      actor: "main_l0_agent",
      actorTransformedFrom: "user",
      content: "You are the subagent hm-l2-investigator...",
      tools: [],
    }

    await writer.appendChildTurn(parentSessionID, childSessionID, turn)

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))

    expect(parsed.turns).toHaveLength(1)
    expect(parsed.turns[0].turn).toBe(1)
    expect(parsed.turns[0].actor).toBe("main_l0_agent")
    expect(parsed.turns[0].content).toBe("You are the subagent hm-l2-investigator...")
  })

  it("appends multiple turns in order", async () => {
    const turn1: Turn = {
      turn: 1,
      actor: "main_l0_agent",
      content: "First turn.",
      tools: [],
    }
    const turn2: Turn = {
      turn: 2,
      actor: "user",
      content: "Second turn.",
      tools: [],
    }

    await writer.appendChildTurn(parentSessionID, childSessionID, turn1)
    await writer.appendChildTurn(parentSessionID, childSessionID, turn2)

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))

    expect(parsed.turns).toHaveLength(2)
    expect(parsed.turns[0].turn).toBe(1)
    expect(parsed.turns[1].turn).toBe(2)
  })

  it("preserves tool records in appended turns", async () => {
    const turn: Turn = {
      turn: 1,
      actor: "main_l0_agent",
      content: "Investigating.",
      tools: [
        {
          tool: "skill",
          input: { name: "hm-l3-detective" },
          outputPruned: "# Skill: hm-l3-detective",
        },
        {
          tool: "read",
          input: { filePath: "/path/to/file.ts" },
          status: "success",
        },
      ],
    }

    await writer.appendChildTurn(parentSessionID, childSessionID, turn)

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))

    expect(parsed.turns[0].tools).toHaveLength(2)
    expect(parsed.turns[0].tools[0].tool).toBe("skill")
    expect(parsed.turns[0].tools[1].tool).toBe("read")
    expect(parsed.turns[0].tools[1].status).toBe("success")
  })
})
