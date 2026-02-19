/**
 * Dashboard TUI data model tests
 * Verifies snapshot includes required panels, escalation alerts, and EN/VI strings.
 * Skips gracefully when ink/react are not installed (they are optional peerDependencies).
 */

import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

let passed = 0
let failed_ = 0
let skipped = false

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

async function main() {
  process.stderr.write("=== Dashboard TUI Tests ===\n")

  // Dynamic import — skip all tests if ink/react not installed
  let getDashboardStrings: any
  let loadDashboardSnapshot: any
  try {
    const i18nMod = await import("../src/dashboard/i18n.js")
    getDashboardStrings = i18nMod.getDashboardStrings
    const loaderMod = await import("../src/dashboard/loader.js")
    loadDashboardSnapshot = loaderMod.loadDashboardSnapshot
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("Cannot find module") || msg.includes("Cannot find package") || msg.includes("ERR_MODULE_NOT_FOUND")) {
      process.stderr.write("\n  SKIP: ink/react not installed (optional peerDependencies)\n")
      process.stderr.write(`\n=== Dashboard TUI: 0 passed, 0 failed, 9 skipped ===\n`)
      skipped = true
      return
    }
    throw err
  }

  // --- snapshot panels ---
  process.stderr.write("\n--- dashboard: snapshot panels ---\n")
  const dir = await setup("hm-dash-")
  const { initProject } = await import("../src/cli/init.js")
  const { createStateManager } = await import("../src/lib/persistence.js")
  const { createHivemindSessionTool } = await import("../src/tools/hivemind-session.js")

  try {
    await initProject(dir, { silent: true, automationLevel: "coach" })

    const session = createHivemindSessionTool(dir)

    await session.execute({ action: "start", mode: "plan_driven", focus: "Build TUI" }, {} as any)
    await session.execute({ action: "update", level: "tactic", content: "Render metrics panel" }, {} as any)

    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 12
      state.metrics.write_without_read_count = 2
      await stateManager.save(state)
    }

    const snapshot = await loadDashboardSnapshot(dir)

    assert(snapshot.session.automationLevel === "coach", "snapshot includes automation level")
    assert(snapshot.hierarchy.lines.length > 0, "snapshot includes hierarchy panel lines")
    assert(snapshot.metrics.turnCount >= 12, "snapshot includes metrics panel")
    assert(snapshot.alerts.length > 0, "snapshot includes alert pressure data")
    assert(typeof snapshot.trace.gitHash === "string", "snapshot includes git trace hash")
    assert(snapshot.trace.timeline.length > 0, "snapshot includes session timeline")
  } finally {
    await cleanup(dir)
  }

  // --- bilingual strings ---
  process.stderr.write("\n--- dashboard: bilingual strings ---\n")

  const en = getDashboardStrings("en")
  const vi = getDashboardStrings("vi")

  assert(en.title.includes("HiveMind"), "english strings available")
  assert(vi.title.includes("HiveMind"), "vietnamese strings available")
  assert(en.session !== vi.session, "EN/VI labels are distinct")

  process.stderr.write(`\n=== Dashboard TUI: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
