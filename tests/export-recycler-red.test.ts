import { describe, it, beforeEach, afterEach } from "node:test"
import assert from "node:assert/strict"
import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import { getEffectivePaths } from "../src/lib/paths.js"
import { createStateManager } from "../src/lib/persistence.js"
import { createHivemindCycleTool } from "../src/tools/hivemind-cycle.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"

type ToolResult = {
  status: "success" | "error"
  error?: string
  metadata?: Record<string, unknown>
}

function parseToolResult(raw: unknown): ToolResult {
  if (typeof raw !== "string") {
    assert.fail("tool returns JSON string")
  }
  return JSON.parse(raw) as ToolResult
}

async function ensureActiveSession(directory: string): Promise<string> {
  const sessionTool = createHivemindSessionTool(directory)
  const startRaw = await sessionTool.execute(
    { action: "start", mode: "plan_driven", focus: "Wave 1 RED export recycler tests" },
    {} as any,
  )
  const startResult = parseToolResult(startRaw)
  assert(
    startResult.status === "success" || startResult.error === "session already active",
    "precondition: session start succeeds or reports already active",
  )

  const stateManager = createStateManager(directory)
  const state = await stateManager.load()
  assert(state, "state exists after init/start")
  return state.session.id
}

async function assertSessionFileExists(directory: string, sessionId: string, msg: string): Promise<void> {
  const sessionPath = join(getEffectivePaths(directory).sessionsDir, `session-${sessionId}.json`)
  try {
    await access(sessionPath)
  } catch {
    assert.fail(msg)
  }
}

async function seedSessionSnapshot(directory: string, sourceSessionId: string, targetSessionId: string): Promise<void> {
  const sessionsDir = getEffectivePaths(directory).sessionsDir
  const sourcePath = join(sessionsDir, `session-${sourceSessionId}.json`)
  const targetPath = join(sessionsDir, `session-${targetSessionId}.json`)
  const payload = await readFile(sourcePath, "utf-8")
  await writeFile(targetPath, payload, "utf-8")
}

describe("Wave 1 RED: Export Recycler safety contracts", () => {
  let directory = ""

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "hm-export-recycler-red-"))
    await initProject(directory, { governanceMode: "assisted", language: "en", silent: true })
  })

  afterEach(async () => {
    if (directory) {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("RED: recycle by session id should be idempotent on repeated prune", async () => {
    const sessionId = await ensureActiveSession(directory)
    const cycleTool = createHivemindCycleTool(directory)
    const archivedSessionId = "33333333-3333-4333-8333-333333333333"

    const exportResult = parseToolResult(await cycleTool.execute({ action: "export" }, {} as any))
    assert.equal(exportResult.status, "success", "precondition: export snapshot exists before recycle")
    await seedSessionSnapshot(directory, sessionId, archivedSessionId)

    const first = parseToolResult(await cycleTool.execute({ action: "prune", sessionId: archivedSessionId }, {} as any))
    assert.equal(first.status, "success", "first recycle pass deletes requested session")

    const second = parseToolResult(await cycleTool.execute({ action: "prune", sessionId: archivedSessionId }, {} as any))
    assert.equal(
      second.status,
      "success",
      "RED expected: repeated recycle should be no-op success, not not-found error",
    )
  })

  it("RED: recycle must preserve active session lineage on direct active-session prune", async () => {
    const sessionId = await ensureActiveSession(directory)
    const cycleTool = createHivemindCycleTool(directory)

    const exportResult = parseToolResult(await cycleTool.execute({ action: "export" }, {} as any))
    assert.equal(exportResult.status, "success", "precondition: export snapshot exists before prune")
    const pruneResult = parseToolResult(await cycleTool.execute({ action: "prune", sessionId }, {} as any))
    assert.equal(pruneResult.status, "success", "prune request completes")

    await assertSessionFileExists(
      directory,
      sessionId,
      "RED expected: active session lineage should never be hard-deleted by prune",
    )
  })

  it("RED: concurrent export+prune should not delete active lineage or report destructive prune", async () => {
    const sessionId = await ensureActiveSession(directory)
    const cycleTool = createHivemindCycleTool(directory)

    const baselineExport = parseToolResult(await cycleTool.execute({ action: "export" }, {} as any))
    assert.equal(baselineExport.status, "success", "precondition: baseline export succeeds")

    const [exportRaw, pruneRaw] = await Promise.all([
      cycleTool.execute({ action: "export" }, {} as any),
      cycleTool.execute({ action: "prune", keep: 0 }, {} as any),
    ])

    const exportResult = parseToolResult(exportRaw)
    const pruneResult = parseToolResult(pruneRaw)

    assert.equal(exportResult.status, "success", "export path should remain successful during race")
    assert.equal(pruneResult.status, "success", "prune path should complete without fatal error")
    assert.equal(
      (pruneResult.metadata?.deleted as number | undefined) ?? 0,
      0,
      "RED expected: prune during export race should avoid destructive delete of active lineage",
    )

    await assertSessionFileExists(
      directory,
      sessionId,
      "RED expected: active session file should exist after export/prune race",
    )
  })
})
