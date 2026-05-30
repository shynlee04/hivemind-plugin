/**
 * Tests for SessionWriter — main session .md file management.
 *
 * Verifies creation, append, and frontmatter update operations on
 * session knowledge files stored under .hivemind/session-tracker/.
 * All writes use atomic rename for crash safety.
 */

import { mkdtempSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { SessionWriter } from "../../../../src/features/session-tracker/persistence/session-writer.js"

let tmpDir: string
let writer: SessionWriter
let projectRoot: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "st-session-writer-"))
  projectRoot = join(tmpDir, "project")
  // SessionWriter expects projectRoot pointing to a real project root
  writer = new SessionWriter({ projectRoot })
})

afterEach(() => {
  const fs = require("node:fs")
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

// ---------------------------------------------------------------------------
// createSessionDir tests
// ---------------------------------------------------------------------------

describe("createSessionDir", () => {
  it("creates the session subdirectory under .hivemind/session-tracker/", async () => {
    const sessionID = "ses_test123456789"
    const dirPath = await writer.createSessionDir(sessionID)

    expect(existsSync(dirPath)).toBe(true)
    expect(dirPath).toContain(".hivemind/session-tracker/ses_test123456789")
  })

  it("returns the same path on subsequent calls", async () => {
    const sessionID = "ses_test123456789"
    const first = await writer.createSessionDir(sessionID)
    const second = await writer.createSessionDir(sessionID)

    expect(first).toBe(second)
  })
})

// ---------------------------------------------------------------------------
// initializeSessionFile tests
// ---------------------------------------------------------------------------

describe("initializeSessionFile", () => {
  it("creates an .md file with YAML frontmatter", async () => {
    const sessionID = "ses_test123456789"
    await writer.createSessionDir(sessionID)

    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const files = require("node:fs").readdirSync(dirPath)
    const mdFile = files.find((f: string) => f.endsWith(".md"))
    expect(mdFile).toBeDefined()

    const content = readFileSync(join(dirPath, mdFile!), "utf-8")
    expect(content).toContain("---")
    expect(content).toContain("sessionID:")
    expect(content).toContain("ses_test123456789")
    expect(content).toContain("status:")
  })

  it("creates only one .md file per session", async () => {
    const sessionID = "ses_test123456789"
    await writer.createSessionDir(sessionID)

    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const files = require("node:fs").readdirSync(dirPath)
    const mdFiles = files.filter((f: string) => f.endsWith(".md"))
    expect(mdFiles).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// appendUserTurn tests
// ---------------------------------------------------------------------------

describe("appendUserTurn", () => {
  it("appends a ## USER section with turn number", async () => {
    const sessionID = "ses_test123456789"
    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    await writer.appendUserTurn(sessionID, 1, "Hello, this is a test message.")

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("## USER (turn 1)")
    expect(content).toContain("**source:** real-human")
    expect(content).toContain("Hello, this is a test message.")
  })

  it("increments turn numbers correctly", async () => {
    const sessionID = "ses_test123456789"
    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    await writer.appendUserTurn(sessionID, 1, "First")
    await writer.appendUserTurn(sessionID, 2, "Second")

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("## USER (turn 1)")
    expect(content).toContain("## USER (turn 2)")
  })
})

// ---------------------------------------------------------------------------
// appendAgentBlock tests
// ---------------------------------------------------------------------------

describe("appendAgentBlock", () => {
  beforeEach(async () => {
    const sessionID = "ses_test123456789"
    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })
  })

  it("appends a main_l0_agent section with name and model", async () => {
    const sessionID = "ses_test123456789"
    await writer.appendAgentBlock(sessionID, "Hm-L0-Orchestrator", "DeepSeek V4 Pro")

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("## main_l0_agent")
    expect(content).toContain("**name:** Hm-L0-Orchestrator")
    expect(content).toContain("**model:** DeepSeek V4 Pro")
  })

  it("includes thinking_duration when provided", async () => {
    const sessionID = "ses_test123456789"
    await writer.appendAgentBlock(sessionID, "TestAgent", "TestModel", "19.7s")

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("**thinking_duration:** 19.7s")
  })

  it("omits thinking_duration when not provided", async () => {
    const sessionID = "ses_test123456789"
    await writer.appendAgentBlock(sessionID, "TestAgent", "TestModel")

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).not.toContain("thinking_duration")
  })
})

// ---------------------------------------------------------------------------
// appendToolBlock tests
// ---------------------------------------------------------------------------

describe("appendToolBlock", () => {
  beforeEach(async () => {
    const sessionID = "ses_test123456789"
    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })
  })

  it("appends a ### Tool section with input", async () => {
    const sessionID = "ses_test123456789"
    await writer.appendToolBlock(sessionID, "skill", { name: "test-skill" })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("### Tool: skill")
    expect(content).toContain("test-skill")
  })

  it("includes pruned output when provided", async () => {
    const sessionID = "ses_test123456789"
    await writer.appendToolBlock(sessionID, "skill", { name: "test" }, "# Skill: test-skill")

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("**Output:**")
    expect(content).toContain("# Skill: test-skill")
  })

  it("includes error section when provided", async () => {
    const sessionID = "ses_test123456789"
    await writer.appendToolBlock(
      sessionID,
      "read",
      { filePath: "/missing" },
      undefined,
      "File not found",
    )

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("**Error:**")
    expect(content).toContain("File not found")
  })
})

// ---------------------------------------------------------------------------
// updateFrontmatter tests
// ---------------------------------------------------------------------------

describe("updateFrontmatter", () => {
  beforeEach(async () => {
    const sessionID = "ses_test123456789"
    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })
  })

  it("updates existing frontmatter fields", async () => {
    const sessionID = "ses_test123456789"
    await writer.updateFrontmatter(sessionID, {
      status: "completed",
      updated: "2026-01-02T00:00:00Z",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("status: completed")
    expect(content).toContain("2026-01-02T00:00:00Z")
  })

  it("merges updates without losing existing fields", async () => {
    const sessionID = "ses_test123456789"
    await writer.updateFrontmatter(sessionID, { status: "idle" })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    // Should still have the original sessionID
    expect(content).toContain("sessionID: ses_test123456789")
    // Should have the updated status
    expect(content).toContain("status: idle")
  })
})

// ---------------------------------------------------------------------------
// addChildRef tests (Bug A fix — Phase 23.2)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Title capture lifecycle tests (Phase 24.3.1, Plan 04)
// ---------------------------------------------------------------------------

describe("initializeSessionFile with title", () => {
  /**
   * Test: initializeSessionFile writes title into frontmatter when provided.
   */
  it("writes title into frontmatter when provided", async () => {
    const sessionID = "ses_title_test_001"
    await writer.createSessionDir(sessionID)

    await writer.initializeSessionFile(sessionID, {
      sessionID,
      title: "hm/governance/root/gsd-auditor/audit-v2@0",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    expect(mdFile).toBeDefined()

    const content = readFileSync(join(dirPath, mdFile!), "utf-8")
    expect(content).toContain("hm/governance/root/gsd-auditor/audit-v2@0")
  })

  /**
   * Test: initializeSessionFile sets title to null when not provided.
   */
  it("sets title to null when not provided", async () => {
    const sessionID = "ses_title_test_002"
    await writer.createSessionDir(sessionID)

    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    expect(mdFile).toBeDefined()

    const content = readFileSync(join(dirPath, mdFile!), "utf-8")
    expect(content).toContain("title: null")
  })

  /**
   * Test: updateFrontmatter can update title.
   */
  it("updateFrontmatter can update title", async () => {
    const sessionID = "ses_title_test_003"
    await writer.createSessionDir(sessionID)

    await writer.initializeSessionFile(sessionID, {
      sessionID,
      title: "hm/governance/root/gsd-auditor/audit-v2@0",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    await writer.updateFrontmatter(sessionID, {
      title: "hm/delegate/child/gsd-researcher/research-v2@1",
    } as Partial<import("../../../../src/features/session-tracker/types.js").SessionRecord>)

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("hm/delegate/child/gsd-researcher/research-v2@1")
  })

  /**
   * Test: re-initialization preserves existing title.
   */
  it("re-initialization preserves existing title", async () => {
    const sessionID = "ses_title_test_004"
    await writer.createSessionDir(sessionID)

    // First init with title
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      title: "hm/governance/root/gsd-auditor/audit-v2@0",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    // Re-init without title
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    // Original title should still be present
    expect(content).toContain("audit-v2@0")
  })

  /**
   * Test: Title field accepts any string format (not just naming service).
   */
  it("accepts any string format (backward compatible)", async () => {
    const sessionID = "ses_title_test_005"
    await writer.createSessionDir(sessionID)

    await writer.initializeSessionFile(sessionID, {
      sessionID,
      title: "Custom Session Name",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", sessionID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("Custom Session Name")
  })
})

describe("addChildRef", () => {
  beforeEach(async () => {
    const sessionID = "ses_root0000000000"
    await writer.createSessionDir(sessionID)
    await writer.initializeSessionFile(sessionID, {
      sessionID,
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      parentSessionID: null,
      delegationDepth: 0,
      children: [],
      continuityIndex: "session-continuity.json",
      status: "active",
    })
  })

  it("appends a child ref to the children array in frontmatter", async () => {
    const rootID = "ses_root0000000000"
    await writer.addChildRef(rootID, {
      sessionID: "ses_child1111111111",
      childFile: "ses_child1111111111.json",
    })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", rootID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("ses_child1111111111")
    expect(content).toContain("ses_child1111111111.json")
  })

  it("does not duplicate a child ref that already exists", async () => {
    const rootID = "ses_root0000000000"
    const childRef = { sessionID: "ses_child2222222222", childFile: "ses_child2222222222.json" }

    await writer.addChildRef(rootID, childRef)
    await writer.addChildRef(rootID, childRef)

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", rootID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    // Parse frontmatter and check children array length
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
    expect(fmMatch).toBeDefined()
    const fm = require("yaml").parse(fmMatch![1])
    expect(fm.children).toHaveLength(1)
    expect(fm.children[0].sessionID).toBe("ses_child2222222222")
  })

  it("appends multiple different child refs", async () => {
    const rootID = "ses_root0000000000"
    await writer.addChildRef(rootID, { sessionID: "ses_aaa1111111111", childFile: "ses_aaa1111111111.json" })
    await writer.addChildRef(rootID, { sessionID: "ses_bbb2222222222", childFile: "ses_bbb2222222222.json" })

    const dirPath = join(projectRoot, ".hivemind", "session-tracker", rootID)
    const mdFile = require("node:fs").readdirSync(dirPath).find((f: string) => f.endsWith(".md"))
    const content = readFileSync(join(dirPath, mdFile!), "utf-8")

    expect(content).toContain("ses_aaa1111111111")
    expect(content).toContain("ses_bbb2222222222")
  })
})
