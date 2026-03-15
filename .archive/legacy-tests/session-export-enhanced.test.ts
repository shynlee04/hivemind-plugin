import assert from "node:assert/strict"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

import {
  generateExportData,
  generateMarkdownExport,
} from "../../src/lib/session-export.js"
import {
  getArchiveStats,
  getPlanningPaths,
  initializePlanningDirectory,
  listArchives,
  pruneOldArchives,
} from "../../src/lib/planning-fs.js"
import { createConfig } from "../../src/schemas/config.js"
import { createBrainState } from "../../src/schemas/brain-state.js"

function makeState() {
  const config = createConfig({ governance_mode: "assisted" })
  const state = createBrainState(crypto.randomUUID(), config, "plan_driven")

  state.metrics.tool_type_counts = {
    read: 4,
    write: 2,
    query: 1,
    governance: 3,
  }

  state.metrics.governance_counters = {
    out_of_order: 1,
    drift: 2,
    compaction: 3,
    evidence_pressure: 4,
    ignored: 5,
    acknowledged: true,
    prerequisites_completed: true,
  }

  state.cycle_log = [
    {
      timestamp: 123,
      tool: "task",
      output_excerpt: "subagent failed to run",
      failure_detected: true,
      failure_keywords: ["failed"],
    },
  ]

  state.framework_selection = {
    choice: "gsd",
    active_phase: "phase-2",
    active_spec_path: "docs/spec.md",
    acceptance_note: "accepted",
    updated_at: 100,
  }

  state.compaction_count = 7
  return state
}

test("generateExportData includes tool_type_counts from state", () => {
  const data = generateExportData(makeState(), "summary")
  assert.deepEqual(data.tool_type_counts, {
    read: 4,
    write: 2,
    query: 1,
    governance: 3,
  })
})

test("generateExportData includes governance_counters from state", () => {
  const data = generateExportData(makeState(), "summary")
  assert.deepEqual(data.governance_counters, {
    out_of_order: 1,
    drift: 2,
    compaction: 3,
    evidence_pressure: 4,
    ignored: 5,
    acknowledged: true,
    prerequisites_completed: true,
  })
})

test("generateExportData includes cycle_log and strips failure_keywords", () => {
  const data = generateExportData(makeState(), "summary")
  assert.equal(data.cycle_log.length, 1)
  assert.equal(data.cycle_log[0].timestamp, 123)
  assert.equal(data.cycle_log[0].tool, "task")
  assert.equal(data.cycle_log[0].output_excerpt, "subagent failed to run")
  assert.equal(data.cycle_log[0].failure_detected, true)
  assert.equal(Object.prototype.hasOwnProperty.call(data.cycle_log[0], "failure_keywords"), false)
})

test("generateExportData includes framework_selection with only choice and active_phase", () => {
  const data = generateExportData(makeState(), "summary")
  assert.deepEqual(data.framework_selection, {
    choice: "gsd",
    active_phase: "phase-2",
  })
  assert.deepEqual(Object.keys(data.framework_selection).sort(), ["active_phase", "choice"])
})

test("generateExportData includes compaction_count", () => {
  const data = generateExportData(makeState(), "summary")
  assert.equal(data.compaction_count, 7)
})

test("generateMarkdownExport includes Tool Usage section", () => {
  const data = generateExportData(makeState(), "summary")
  const md = generateMarkdownExport(data, "body")
  assert.equal(md.includes("## Tool Usage"), true)
  assert.equal(md.includes("Read: 4"), true)
})

test("generateMarkdownExport includes Governance section", () => {
  const data = generateExportData(makeState(), "summary")
  const md = generateMarkdownExport(data, "body")
  assert.equal(md.includes("## Governance"), true)
  assert.equal(md.includes("Out of Order: 1"), true)
})

test("generateMarkdownExport includes Compaction section", () => {
  const data = generateExportData(makeState(), "summary")
  const md = generateMarkdownExport(data, "body")
  assert.equal(md.includes("## Compaction"), true)
  assert.equal(md.includes("Count: 7"), true)
})

test("pruneOldArchives deletes archives beyond limit", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hm-prune-archives-"))
  try {
    await initializePlanningDirectory(dir)
    const { archiveDir } = getPlanningPaths(dir)

    const names = [
      "2026-01-01-old.md",
      "2026-01-02-old.md",
      "2026-01-03-mid.md",
      "2026-01-04-new.md",
      "2026-01-05-newest.md",
    ]

    for (const name of names) {
      await writeFile(join(archiveDir, name), "# archive", "utf-8")
    }

    const deleted = await pruneOldArchives(dir, 2)
    assert.equal(deleted, 3)

    const remaining = await listArchives(dir)
    assert.deepEqual(remaining, ["2026-01-04-new.md", "2026-01-05-newest.md"])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("getArchiveStats returns correct stats", async () => {
  const dir = await mkdtemp(join(tmpdir(), "hm-archive-stats-"))
  try {
    await initializePlanningDirectory(dir)
    const { archiveDir } = getPlanningPaths(dir)

    await writeFile(join(archiveDir, "2026-01-02-mid.md"), "# archive", "utf-8")
    await writeFile(join(archiveDir, "2026-01-01-oldest.md"), "# archive", "utf-8")
    await writeFile(join(archiveDir, "2026-01-03-newest.md"), "# archive", "utf-8")

    const stats = await getArchiveStats(dir)
    assert.equal(stats.totalArchives, 3)
    assert.equal(stats.oldestArchive, "2026-01-01-oldest.md")
    assert.equal(stats.newestArchive, "2026-01-03-newest.md")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
