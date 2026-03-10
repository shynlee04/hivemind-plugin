import assert from "node:assert/strict"
import { mkdtemp, mkdir, readFile, rm, writeFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, it } from "node:test"

import { createHiveOpsGateTool } from "../src/tools/hiveops-gate.js"
import { createHiveOpsSotTool } from "../src/tools/hiveops-sot.js"
import { createHiveOpsExportTool } from "../src/tools/hiveops-export.js"
import { createHiveOpsTodoTool } from "../src/tools/hiveops-todo.js"
import { readUnifiedStateSnapshot } from "../src/lib/state-snapshot.js"

const mockContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as any

describe("hiveops tool isolation", () => {
  let tmpDir: string

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), "hiveops-isolation-"))
    mockContext.directory = tmpDir
    await mkdir(join(tmpDir, "docs"), { recursive: true })
    await writeFile(join(tmpDir, "docs", "example-plan.md"), "# Example Plan\n")
  })

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  it("gate tool persists gate records from src ownership", async () => {
    const toolDef = createHiveOpsGateTool(tmpDir)
    const result = await toolDef.execute(
      { action: "pass", gate: "G1", domain: "R1", evidence: "typecheck passed" },
      mockContext,
    )

    assert.match(String(result), /PASSED: Gate G1/)

    const raw = await readFile(join(tmpDir, ".hivemind", "state", "gates.json"), "utf8")
    const parsed = JSON.parse(raw) as { gates: Array<{ gate: string; domain: string; status: string; checkedBy: string }> }
    assert.equal(parsed.gates.length, 1)
    assert.equal(parsed.gates[0].gate, "G1")
    assert.equal(parsed.gates[0].domain, "R1")
    assert.equal(parsed.gates[0].status, "passed")
    assert.equal(parsed.gates[0].checkedBy, "test-agent")
  })

  it("sot tool registers artifacts and exports a tsv index from src ownership", async () => {
    const toolDef = createHiveOpsSotTool(tmpDir)

    const registerResult = await toolDef.execute(
      { action: "register", path: "docs/example-plan.md", tags: "plan,R1" },
      mockContext,
    )
    assert.match(String(registerResult), /Registered:/)

    const indexRaw = await readFile(join(tmpDir, ".hivemind", "state", "sot-index.json"), "utf8")
    const indexParsed = JSON.parse(indexRaw) as { artifacts: Array<{ path: string }> }
    assert.equal(indexParsed.artifacts.length, 1)
    assert.equal(indexParsed.artifacts[0].path, "docs/example-plan.md")

    const exportResult = await toolDef.execute({ action: "export" }, mockContext)
    assert.match(String(exportResult), /sot-export\.tsv/)

    const tsv = await readFile(join(tmpDir, ".hivemind", "state", "sot-export.tsv"), "utf8")
    assert.match(tsv, /domain\ttype\tplan_id\tnode_id\tid\tpath\ttags\ttitle/)
    assert.match(tsv, /docs\/example-plan\.md/)
  })

  it("export tool writes handoff and checkpoint artifacts from src ownership", async () => {
    const toolDef = createHiveOpsExportTool(tmpDir)
    const todoTool = createHiveOpsTodoTool(tmpDir)

    await todoTool.execute(
      { action: "add", content: "Checkpoint should use canonical tasks", priority: "high" },
      mockContext,
    )

    await writeFile(
      join(tmpDir, ".hivemind", "state", "todo.json"),
      JSON.stringify({
        items: [{ status: "pending", content: "STALE TODO PROJECTION" }],
        version: 1,
        lastSync: Date.now(),
        activeItem: null,
      }, null, 2),
    )

    const handoffResult = await toolDef.execute(
      {
        action: "handoff",
        summary: "Completed gate extraction",
        next_agent: "hivemaker",
        next_actions: "wire src tool,delete wrapper logic",
        decisions: "gate logic now lives in src",
      },
      mockContext,
    )
    assert.match(String(handoffResult), /Handoff created:/)

    const handoffFiles = await readdir(join(tmpDir, ".hivemind", "handoffs"))
    assert.equal(handoffFiles.some((file) => file.endsWith(".json")), true)
    assert.equal(handoffFiles.some((file) => file.endsWith(".md")), true)

    const checkpointResult = await toolDef.execute(
      {
        action: "checkpoint",
        label: "gate-sot-export-cutover",
      },
      mockContext,
    )
    assert.match(String(checkpointResult), /Checkpoint saved:/)

    const checkpointFiles = await readdir(join(tmpDir, ".hivemind", "checkpoints"))
    assert.equal(checkpointFiles.some((file) => file.endsWith(".json")), true)

    const checkpointPath = join(tmpDir, ".hivemind", "checkpoints", checkpointFiles[0])
    const checkpointRaw = await readFile(checkpointPath, "utf8")
    const checkpointParsed = JSON.parse(checkpointRaw) as { todoSnapshot: string }
    assert.match(checkpointParsed.todoSnapshot, /Checkpoint should use canonical tasks/)
    assert.doesNotMatch(checkpointParsed.todoSnapshot, /STALE TODO PROJECTION/)
  })

  it("todo tool persists canonical task authority and materializes todo.json as compatibility output", async () => {
    const toolDef = createHiveOpsTodoTool(tmpDir)

    const addResult = await toolDef.execute(
      { action: "add", content: "Fix auth bug", priority: "high", domain: "R1", plan_id: "META01" },
      mockContext,
    )
    assert.match(String(addResult), /Added: task-/)

    const tasksRaw = await readFile(join(tmpDir, ".hivemind", "state", "tasks.json"), "utf8")
    const tasksParsed = JSON.parse(tasksRaw) as {
      session_id: string
      tasks: Array<{ id: string; text: string; status: string; priority: string }>
    }
    assert.equal(tasksParsed.tasks.length, 1)
    assert.equal(tasksParsed.tasks[0].text, "Fix auth bug")
    assert.equal(tasksParsed.tasks[0].status, "pending")
    assert.equal(tasksParsed.tasks[0].priority, "high")

    const todoRaw = await readFile(join(tmpDir, ".hivemind", "state", "todo.json"), "utf8")
    const todoParsed = JSON.parse(todoRaw) as {
      items: Array<{ id: string; content: string; status: string }>
      activeItem: string | null
    }
    assert.equal(todoParsed.items.length, 1)
    assert.equal(todoParsed.items[0].content, "Fix auth bug")
    assert.equal(todoParsed.items[0].status, "pending")
    assert.equal(todoParsed.activeItem, null)

    const taskId = tasksParsed.tasks[0].id
    const startResult = await toolDef.execute({ action: "start", id: taskId }, mockContext)
    assert.match(String(startResult), /Started:/)

    const completeResult = await toolDef.execute(
      { action: "complete", id: taskId, evidence: "verified by targeted test" },
      mockContext,
    )
    assert.match(String(completeResult), /Completed:/)

    const graphRaw = await readFile(join(tmpDir, ".hivemind", "graph", "tasks.json"), "utf8")
    const graphParsed = JSON.parse(graphRaw) as {
      tasks: Array<{ title: string; status: string }>
    }
    assert.equal(graphParsed.tasks.length, 1)
    assert.equal(graphParsed.tasks[0].title, "Fix auth bug")
    assert.equal(graphParsed.tasks[0].status, "complete")
  })

  it("state snapshot reads canonical task authority instead of todo.json compatibility output", async () => {
    const toolDef = createHiveOpsTodoTool(tmpDir)

    await toolDef.execute(
      { action: "add", content: "Canonical task view survives stale projections", priority: "medium" },
      mockContext,
    )

    await writeFile(
      join(tmpDir, ".hivemind", "state", "todo.json"),
      JSON.stringify({
        items: [{ status: "pending", content: "STALE TODO PROJECTION" }],
        version: 1,
        lastSync: Date.now(),
        activeItem: null,
      }, null, 2),
    )

    const snapshot = await readUnifiedStateSnapshot(tmpDir)
    const taskState = snapshot.taskState as { tasks: Array<{ text: string }> }
    assert.equal(taskState.tasks.length, 1)
    assert.equal(taskState.tasks[0].text, "Canonical task view survives stale projections")
  })
})
