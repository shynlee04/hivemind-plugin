import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import { createHivemindCycleTool } from "../src/tools/hivemind-cycle.js"

function parseResult(raw: string): Record<string, unknown> {
  return JSON.parse(raw) as Record<string, unknown>
}

test("hivemind_cycle list returns empty success when sessionsDir is missing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hm-cycle-list-missing-"))

  try {
    const cycleTool = createHivemindCycleTool(dir)
    const result = parseResult(await cycleTool.execute({ action: "list" }, {} as never))

    assert.equal(result.status, "success")
    const metadata = result.metadata as Record<string, unknown>
    assert.equal(metadata.total, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("hivemind_cycle prune returns no-op success when sessionsDir is missing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hm-cycle-prune-missing-"))

  try {
    const cycleTool = createHivemindCycleTool(dir)
    const result = parseResult(await cycleTool.execute({ action: "prune" }, {} as never))

    assert.equal(result.status, "success")
    const metadata = result.metadata as Record<string, unknown>
    assert.equal(metadata.deleted, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
