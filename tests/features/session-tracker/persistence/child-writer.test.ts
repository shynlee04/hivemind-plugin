/**
 * Tests for ChildWriter — child session .json file management.
 *
 * Verifies creation, status updates, and turn appends on child session
 * JSON files stored under parent session subdirectories.
 * All writes use atomic rename for crash safety.
 */

import { mkdtempSync, readFileSync, existsSync, rmSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { ChildWriter } from "../../../../src/features/session-tracker/persistence/child-writer.js"
import { HierarchyManifestWriter } from "../../../../src/features/session-tracker/persistence/hierarchy-manifest.js"
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

  it("merges repeated child creation without wiping existing turns and journey", async () => {
    await writer.createChildFile(parentSessionID, childSessionID, {
      ...baseMetadata,
      journey: [{ timestamp: "2026-01-01T00:00:01Z", type: "tool_call", content: "Tool: read" }],
    })
    await writer.appendChildTurn(parentSessionID, childSessionID, {
      turn: 1,
      actor: "hm-l2-investigator",
      content: "Existing child content must survive lifecycle re-create.",
      tools: [],
    })

    await writer.createChildFile(parentSessionID, childSessionID, {
      ...baseMetadata,
      status: "idle",
      mainAgent: { name: "pending", model: "" },
      turns: [],
      children: [],
      journey: [],
    })

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))
    expect(parsed.status).toBe("idle")
    expect(parsed.turns).toHaveLength(1)
    expect(parsed.turns[0].content).toBe("Existing child content must survive lifecycle re-create.")
    expect(parsed.journey).toHaveLength(1)
    expect(parsed.journey[0].content).toBe("Tool: read")
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

  it("propagates errors for non-existent child file (RC-5)", async () => {
    // RC-5: Write errors are no longer swallowed — they propagate to callers
    // and are enqueued to the retry queue for automatic retry.
    await expect(
      writer.updateChildStatus(parentSessionID, "ses_nonexistent12345", "completed"),
    ).rejects.toThrow(/ENOENT/)
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

  it("stores full last assistant message without truncation", async () => {
    const longContent = "x".repeat(260)
    await writer.appendChildTurn(parentSessionID, childSessionID, {
      turn: 1,
      actor: "hm-l2-reviewer",
      content: longContent,
      tools: [],
    })

    const filePath = join(
      projectRoot,
      ".hivemind",
      "session-tracker",
      parentSessionID,
      `${childSessionID}.json`,
    )
    const parsed = JSON.parse(readFileSync(filePath, "utf-8"))
    expect(parsed.lastMessage).toBe(longContent)
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

// ---------------------------------------------------------------------------
// F-08: Concurrency tests — serial write queue
// ---------------------------------------------------------------------------

describe("concurrent writes — serial write queue (F-08)", () => {
  const concParentID = "ses_conc_parent12345"
  const concChildID = "ses_conc_child12345"

  let concWriter: ChildWriter
  let concProjectRoot: string

  beforeEach(async () => {
    concProjectRoot = mkdtempSync(join(tmpdir(), "st-child-conc-"))
    concWriter = new ChildWriter({ projectRoot: concProjectRoot })
    await concWriter.createChildFile(concParentID, concChildID, {
      ...baseMetadata,
      sessionID: concChildID,
      parentSessionID: concParentID,
    })
  })

  afterEach(() => {
    const fs2 = require("node:fs")
    fs2.rmSync(concProjectRoot, { recursive: true, force: true })
  })

  function readChildJson(): Record<string, unknown> {
    const filePath = join(
      concProjectRoot,
      ".hivemind",
      "session-tracker",
      concParentID,
      `${concChildID}.json`,
    )
    return JSON.parse(readFileSync(filePath, "utf-8"))
  }

  it("should not lose turns under 10 concurrent appendChildTurn calls", async () => {
    // Fire 10 concurrent appendChildTurn calls
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => {
        const turn: Turn = {
          turn: i + 1,
          actor: "main_l0_agent",
          content: `Concurrent turn ${i + 1}`,
          tools: [],
        }
        return concWriter.appendChildTurn(concParentID, concChildID, turn)
      }),
    )

    const record = readChildJson()
    const turns = (record as any).turns as Turn[]
    // Without a serial queue, some turns will be lost
    expect(turns).toHaveLength(10)
    for (let i = 0; i < 10; i++) {
      expect(turns[i].content).toBe(`Concurrent turn ${i + 1}`)
    }
  })

  it("should not lose status update when concurrent with appendChildTurn", async () => {
    // Fire updateChildStatus and appendChildTurn concurrently
    const turn: Turn = {
      turn: 1,
      actor: "main_l0_agent",
      content: "Status-race turn",
      tools: [],
    }

    await Promise.all([
      concWriter.updateChildStatus(concParentID, concChildID, "completed"),
      concWriter.appendChildTurn(concParentID, concChildID, turn),
    ])

    const record = readChildJson()
    // Both updates should be visible — no lost writes
    expect(record.status).toBe("completed")
    expect((record as any).turns).toHaveLength(1)
    expect((record as any).turns[0].content).toBe("Status-race turn")
  })
})

// ── Root main routing (D-03) ────────────────────────────────────────────

import { HierarchyIndex } from "../../../../src/features/session-tracker/persistence/hierarchy-index.js"

describe("ChildWriter — root main session routing (D-03)", () => {
  let writer: ChildWriter
  let hierarchyIndex: HierarchyIndex
  let projectRoot: string
  let tmpDir: string

  const ROOT_SESSION = "ses_root_main_001"
  const L1_CHILD = "ses_child_l1_001"
  const L2_GRANDCHILD = "ses_grandchild_l2_001"

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "st-childwriter-root-"))
    projectRoot = join(tmpDir, "project")

    // Create hierarchy index with the root→L1→L2 chain
    hierarchyIndex = new HierarchyIndex({ projectRoot })
    hierarchyIndex.registerChild(ROOT_SESSION, L1_CHILD)
    hierarchyIndex.registerChild(L1_CHILD, L2_GRANDCHILD)

    writer = new ChildWriter({ projectRoot, hierarchyIndex })
  })

  afterEach(() => {
    try {
      rmSync(tmpDir, { recursive: true, force: true })
    } catch { /* cleanup best-effort */ }
  })

  const baseMetadata = (parentID: string, childID: string, depth: number): ChildSessionRecord => ({
    sessionID: childID,
    parentSessionID: parentID,
    delegationDepth: depth,
    delegatedBy: {
      agentName: "test",
      tool: "task",
      description: "test delegation",
      subagentType: "test-agent",
      model: "unknown",
    },
    created: "2026-01-01T00:00:00Z",
    updated: "2026-01-01T00:00:00Z",
    status: "active",
    mainAgent: { name: "test-agent", model: "unknown" },
    turns: [],
    children: [],
  })

  // ── Test 1: createChildFile writes under ROOT main, not immediate parent

  it("should write child .json under ROOT main for L1 child", async () => {
    await writer.createChildFile(
      ROOT_SESSION,
      L1_CHILD,
      baseMetadata(ROOT_SESSION, L1_CHILD, 1),
    )

    // File should be at: .hivemind/session-tracker/ROOT_SESSION/L1_CHILD.json
    const rootPath = join(projectRoot, ".hivemind", "session-tracker", ROOT_SESSION, `${L1_CHILD}.json`)
    expect(existsSync(rootPath)).toBe(true)

    // File should NOT be at immediate parent level outside root
    const wrongPath = join(projectRoot, ".hivemind", "session-tracker", L1_CHILD, `${L1_CHILD}.json`)
    expect(existsSync(wrongPath)).toBe(false)
  })

  // ── Test 2: L2 grandchild resolves through L1 to ROOT main ──────────

  it("should write L2 grandchild .json under ROOT main (through L1 chain)", async () => {
    await writer.createChildFile(
      L1_CHILD,        // immediate parent is L1
      L2_GRANDCHILD,   // but root main is ROOT_SESSION
      baseMetadata(L1_CHILD, L2_GRANDCHILD, 2),
    )

    // File must be at ROOT main directory, not L1 child directory
    const rootPath = join(projectRoot, ".hivemind", "session-tracker", ROOT_SESSION, `${L2_GRANDCHILD}.json`)
    expect(existsSync(rootPath)).toBe(true)

    // Should NOT be under the L1 child's directory
    const l1Path = join(projectRoot, ".hivemind", "session-tracker", L1_CHILD, `${L2_GRANDCHILD}.json`)
    expect(existsSync(l1Path)).toBe(false)
  })

  // ── Test 3: appendChildTurn writes under ROOT main ───────────────────

  it("should append turn data to .json under ROOT main directory", async () => {
    // Create the file first
    await writer.createChildFile(
      ROOT_SESSION,
      L1_CHILD,
      baseMetadata(ROOT_SESSION, L1_CHILD, 1),
    )

    const turn: Turn = {
      turn: 1,
      actor: "test-agent",
      content: "Test turn content",
      tools: [],
    }

    await writer.appendChildTurn(ROOT_SESSION, L1_CHILD, turn)

    // Read back from root main directory
    const rootPath = join(projectRoot, ".hivemind", "session-tracker", ROOT_SESSION, `${L1_CHILD}.json`)
    const record = JSON.parse(readFileSync(rootPath, "utf-8"))
    expect(record.turns).toHaveLength(1)
    expect(record.turns[0].content).toBe("Test turn content")
  })

  // ── Test 4: Fallback when hierarchyIndex not provided ────────────────

  it("should fall back to immediate parent when hierarchyIndex not available", async () => {
    const fallbackWriter = new ChildWriter({ projectRoot })

    await fallbackWriter.createChildFile(
      ROOT_SESSION,
      L1_CHILD,
      baseMetadata(ROOT_SESSION, L1_CHILD, 1),
    )

    // Without hierarchyIndex, writes go to immediate parent (ROOT_SESSION is the immediate parent here)
    const rootPath = join(projectRoot, ".hivemind", "session-tracker", ROOT_SESSION, `${L1_CHILD}.json`)
    expect(existsSync(rootPath)).toBe(true)
  })

  // ── Test 5: updateChildStatus writes under ROOT main ─────────────────

  it("should update child status under ROOT main directory", async () => {
    await writer.createChildFile(
      ROOT_SESSION,
      L1_CHILD,
      baseMetadata(ROOT_SESSION, L1_CHILD, 1),
    )

    await writer.updateChildStatus(ROOT_SESSION, L1_CHILD, "completed")

    const rootPath = join(projectRoot, ".hivemind", "session-tracker", ROOT_SESSION, `${L1_CHILD}.json`)
    const record = JSON.parse(readFileSync(rootPath, "utf-8"))
    expect(record.status).toBe("completed")
  })
})

// ── backfillChildMetadata (F-18) ────────────────────────────────────────

describe("backfillChildMetadata (F-18)", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "st-bf-"))
    mkdirSync(join(tmpDir, ".hivemind", "session-tracker", "root-session"), { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it("backfills pending agent name with real value", async () => {
    const writer = new ChildWriter({ projectRoot: tmpDir })

    // Create child with pending metadata
    await writer.createChildFile("root-session", "child-1", {
      sessionID: "child-1",
      parentSessionID: "root-session",
      delegationDepth: 1,
      delegatedBy: { agentName: "unknown", model: "", tool: "task", description: "", subagentType: "unknown" },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "pending", model: "" },
      turns: [],
      children: [],
    })

    // Backfill with real metadata
    await writer.backfillChildMetadata("root-session", "child-1", {
      agentName: "hm-l2-researcher",
      model: "claude-3",
    })

    // Read the file and verify
    const childPath = join(tmpDir, ".hivemind", "session-tracker", "root-session", "child-1.json")
    const raw = readFileSync(childPath, "utf-8")
    const record = JSON.parse(raw)
    expect(record.mainAgent.name).toBe("hm-l2-researcher")
    expect(record.mainAgent.model).toBe("claude-3")
  })

  it("does not backfill when mainAgent already has real name", async () => {
    const writer = new ChildWriter({ projectRoot: tmpDir })

    // Create child with already-real metadata
    await writer.createChildFile("root-session", "child-1", {
      sessionID: "child-1",
      parentSessionID: "root-session",
      delegationDepth: 1,
      delegatedBy: { agentName: "hm-l2-researcher", model: "claude-2", tool: "task", description: "", subagentType: "hm-l2-researcher" },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "hm-l2-researcher", model: "claude-2" },
      turns: [],
      children: [],
    })

    // Backfill with different metadata — should NOT overwrite
    await writer.backfillChildMetadata("root-session", "child-1", {
      agentName: "hm-l2-builder",
      model: "claude-3",
    })

    // Verify original name preserved
    const childPath = join(tmpDir, ".hivemind", "session-tracker", "root-session", "child-1.json")
    const raw = readFileSync(childPath, "utf-8")
    const record = JSON.parse(raw)
    expect(record.mainAgent.name).toBe("hm-l2-researcher")
    expect(record.mainAgent.model).toBe("claude-2")
  })

  it("silently no-ops when child file does not exist", async () => {
    const writer = new ChildWriter({ projectRoot: tmpDir })
    // Should not throw
    await expect(
      writer.backfillChildMetadata("root-session", "non-existent-child", {
        agentName: "test-agent",
      }),
    ).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Bug C: appendChildTurn syncs turnCount to hierarchy manifest
// ---------------------------------------------------------------------------

describe("appendChildTurn — manifest turnCount sync (Bug C)", () => {
  let bugTmpDir: string
  let bugProjectRoot: string
  let bugManifestWriter: HierarchyManifestWriter
  let bugChildWriter: ChildWriter

  beforeEach(() => {
    bugTmpDir = mkdtempSync(join(tmpdir(), "st-bug-c-"))
    bugProjectRoot = join(bugTmpDir, "project")
    mkdirSync(join(bugProjectRoot, ".hivemind", "session-tracker"), { recursive: true })
    bugManifestWriter = new HierarchyManifestWriter({ projectRoot: bugProjectRoot })
    bugChildWriter = new ChildWriter({
      projectRoot: bugProjectRoot,
      manifestWriter: bugManifestWriter,
    })
  })

  afterEach(() => {
    rmSync(bugTmpDir, { recursive: true, force: true })
  })

  it("updates manifest turnCount after appending a turn", async () => {
    const rootMain = "ses_rootBugC"
    const childID = "ses_childBugC"

    // Register child in manifest
    await bugManifestWriter.addChild({
      rootMainSessionID: rootMain,
      childSessionID: childID,
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: "test-agent",
      subagentType: "test-sub",
      childFile: `${childID}.json`,
    })

    // Create child .json file
    const metadata: ChildSessionRecord = {
      sessionID: childID,
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: {
        agentName: "test-agent",
        tool: "task",
        description: "Bug C test",
        subagentType: "test-sub",
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "TestAgent", model: "test" },
      turns: [],
      children: [],
    }
    await bugChildWriter.createChildFile(rootMain, childID, metadata)

    // Verify initial turnCount is 0
    const before = await bugManifestWriter.getChild(rootMain, childID)
    expect(before!.turnCount).toBe(0)

    // Append a turn
    const turn: Turn = {
      turn: 0,
      actor: "assistant",
      content: "Hello world",
      tools: [],
    }
    await bugChildWriter.appendChildTurn(rootMain, childID, turn)

    // Verify manifest turnCount updated to 1
    const after = await bugManifestWriter.getChild(rootMain, childID)
    expect(after!.turnCount).toBe(1)

    // Append another turn
    const turn2: Turn = {
      turn: 0,
      actor: "assistant",
      content: "Second turn",
      tools: [],
    }
    await bugChildWriter.appendChildTurn(rootMain, childID, turn2)

    const after2 = await bugManifestWriter.getChild(rootMain, childID)
    expect(after2!.turnCount).toBe(2)
  })

  it("does not fail when manifestWriter is not provided", async () => {
    const rootMain = "ses_rootNoManifest"
    const childID = "ses_childNoManifest"

    const writerNoManifest = new ChildWriter({ projectRoot: bugProjectRoot })

    const metadata: ChildSessionRecord = {
      sessionID: childID,
      parentSessionID: rootMain,
      delegationDepth: 1,
      delegatedBy: {
        agentName: "test-agent",
        tool: "task",
        description: "No manifest test",
        subagentType: "test-sub",
      },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      status: "active",
      mainAgent: { name: "TestAgent", model: "test" },
      turns: [],
      children: [],
    }
    await writerNoManifest.createChildFile(rootMain, childID, metadata)

    const turn: Turn = {
      turn: 0,
      actor: "assistant",
      content: "Turn without manifest",
      tools: [],
    }
    // Should not throw even without manifestWriter
    await expect(
      writerNoManifest.appendChildTurn(rootMain, childID, turn),
    ).resolves.toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// readChildData tests (Bug B — child .json fallback for compaction summary)
// ---------------------------------------------------------------------------

describe("readChildData", () => {
  it("resolves child record via directory scan when no hierarchy index", async () => {
    const childID = "ses_child_readdata01"
    const record: ChildSessionRecord = {
      ...baseMetadata,
      sessionID: childID,
      turns: [
        { turn: 1, actor: "assistant", content: "Hello from child", role: "assistant", tools: [] },
      ],
      lastMessage: "Hello from child",
    }
    await writer.createChildFile(parentSessionID, childID, record)

    // ChildWriter without hierarchy index — must scan directories
    const result = await writer.readChildData(childID)
    expect(result).toBeDefined()
    expect(result!.sessionID).toBe(childID)
    expect(result!.lastMessage).toBe("Hello from child")
  })

  it("returns undefined when child session does not exist on disk", async () => {
    const result = await writer.readChildData("ses_nonexistent_child")
    expect(result).toBeUndefined()
  })

  it("resolves child record via hierarchy index when parent is known", async () => {
    const childID = "ses_child_hier_idx"
    const record: ChildSessionRecord = {
      ...baseMetadata,
      sessionID: childID,
      turns: [
        { turn: 2, actor: "assistant", content: "Indexed child data", role: "assistant", tools: [] },
      ],
    }
    await writer.createChildFile(parentSessionID, childID, record)

    // Wire up a hierarchy index that maps child → parent
    const manifestWriter = new HierarchyManifestWriter({ projectRoot })
    const writerWithIndex = new ChildWriter({ projectRoot, manifestWriter })

    // First, create a session dir for parent so manifest can be initialized
    const { safeSessionPath, ensureDirectory } = await import(
      "../../../../src/features/session-tracker/persistence/atomic-write.js"
    )
    const parentDir = safeSessionPath(projectRoot, parentSessionID, "")
    await ensureDirectory(parentDir)

    // Write hierarchy manifest linking child to parent
    const { writeFileSync } = await import("node:fs")
    const manifestPath = safeSessionPath(projectRoot, parentSessionID, "hierarchy-manifest.json")
    writeFileSync(manifestPath, JSON.stringify({
      sessionID: parentSessionID,
      children: [childID],
      childLookup: { [childID]: parentSessionID },
    }))

    const result = await writerWithIndex.readChildData(childID)
    expect(result).toBeDefined()
    expect(result!.sessionID).toBe(childID)
    expect(result!.turns[0].content).toBe("Indexed child data")
  })

  it("returns lastMessage when available, otherwise falls back to last assistant turn", async () => {
    const childID = "ses_child_lastmsg"
    const record: ChildSessionRecord = {
      ...baseMetadata,
      sessionID: childID,
      lastMessage: "This is the lastMessage field",
      turns: [
        { turn: 1, actor: "assistant", content: "Turn content should not win", role: "assistant", tools: [] },
      ],
    }
    await writer.createChildFile(parentSessionID, childID, record)

    const result = await writer.readChildData(childID)
    expect(result).toBeDefined()
    expect(result!.lastMessage).toBe("This is the lastMessage field")
    // Verify turn content is also present as fallback
    expect(result!.turns[0].content).toBe("Turn content should not win")
  })
})
