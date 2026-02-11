/**
 * Dashboard TUI data model tests
 * Verifies snapshot includes required panels, escalation alerts, and EN/VI strings.
 */

import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { initProject } from "../src/cli/init.js"
import { createStateManager } from "../src/lib/persistence.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createMapContextTool } from "../src/tools/map-context.js"
import { getDashboardStrings, loadDashboardSnapshot } from "../src/dashboard/server.js"

let passed = 0
let failed_ = 0

function assert(cond: boolean, name: string) {
  if (cond) {
    passed++
    process.stderr.write(`  PASS: ${name}\n`)
  } else {
    failed_++
    process.stderr.write(`  FAIL: ${name}\n`)
  }
}

async function setup(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

async function cleanup(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true })
  } catch {
    // ignore
  }
}

async function test_snapshot_contains_required_panels() {
  process.stderr.write("\n--- dashboard: snapshot panels ---\n")
  const dir = await setup("hm-dash-")

  try {
    await initProject(dir, { silent: true, automationLevel: "retard" })

    const declareIntent = createDeclareIntentTool(dir)
    const mapContext = createMapContextTool(dir)

    await declareIntent.execute({ mode: "plan_driven", focus: "Build TUI" })
    await mapContext.execute({ level: "tactic", content: "Render metrics panel" })

    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 12
      state.metrics.write_without_read_count = 2
      await stateManager.save(state)
    }

    const snapshot = await loadDashboardSnapshot(dir)

    assert(snapshot.session.automationLevel === "retard", "snapshot includes automation level")
    assert(snapshot.hierarchy.lines.length > 0, "snapshot includes hierarchy panel lines")
    assert(snapshot.metrics.turnCount >= 12, "snapshot includes metrics panel")
    assert(snapshot.alerts.length > 0, "snapshot includes alert pressure data")
    assert(typeof snapshot.trace.gitHash === "string", "snapshot includes git trace hash")
    assert(snapshot.trace.timeline.length > 0, "snapshot includes session timeline")
  } finally {
    await cleanup(dir)
  }
}

function test_bilingual_strings() {
  process.stderr.write("\n--- dashboard: bilingual strings ---\n")

  const en = getDashboardStrings("en")
  const vi = getDashboardStrings("vi")

  assert(en.title.includes("HiveMind"), "english strings available")
  assert(vi.title.includes("HiveMind"), "vietnamese strings available")
  assert(en.session !== vi.session, "EN/VI labels are distinct")
}

async function main() {
  process.stderr.write("=== Dashboard TUI Tests ===\n")

  await test_snapshot_contains_required_panels()
  test_bilingual_strings()

  process.stderr.write(`\n=== Dashboard TUI: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
