/**
 * Integration Tests — End-to-end workflow validation
 *
 * Tests the complete lifecycle: init → declare_intent → map_context → compact_session
 */

import { initProject } from "../src/cli/init.js"
import { createStateManager } from "../src/lib/persistence.js"
import { readActiveMd, listArchives } from "../src/lib/planning-fs.js"
import { readFile } from "fs/promises"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createMapContextTool } from "../src/tools/map-context.js"
import { createCompactSessionTool } from "../src/tools/compact-session.js"
import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"

// ─── Harness ─────────────────────────────────────────────────────────

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

let tmpDir: string

async function setup(): Promise<string> {
  tmpDir = await mkdtemp(join(tmpdir(), "hm-integ-"))
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}

// ─── Tests ───────────────────────────────────────────────────────────

async function test_fullLifecycle() {
  process.stderr.write("\n--- integration: full lifecycle workflow ---\n")

  const dir = await setup()

  try {
    // Step 1: Initialize project
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const stateManager = createStateManager(dir)
    let state = await stateManager.load()
    assert(state !== null, "state exists after init")
    assert(state?.session.governance_status === "OPEN", "assisted mode starts OPEN")

    // Create tool instances bound to this directory
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)
    const compactSessionTool = createCompactSessionTool(dir)

    // Step 2: Declare intent
    const intentResult = await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Build authentication system" }
    )
    assert(
      intentResult.includes('Session: "Build authentication system"'),
      "declare_intent sets session focus"
    )

    state = await stateManager.load()
    assert(state?.session.mode === "plan_driven", "session mode is plan_driven")
    assert(state?.hierarchy.trajectory === "Build authentication system", "trajectory set")

    // Step 3: Map context at tactic level
    const tacticResult = await mapContextTool.execute(
      { level: "tactic", content: "Implement JWT middleware", status: "active" }
    )
    assert(
      tacticResult.includes('[tactic] "Implement JWT middleware"'),
      "map_context updates tactic"
    )

    state = await stateManager.load()
    assert(state?.hierarchy.tactic === "Implement JWT middleware", "tactic stored in state")
    assert(state?.metrics.context_updates === 1, "context update counted")

    // Step 4: Map context at action level
    const actionResult = await mapContextTool.execute(
      { level: "action", content: "Install passport-jwt package", status: "active" }
    )
    assert(
      actionResult.includes('[action] "Install passport-jwt package"'),
      "map_context updates action"
    )

    state = await stateManager.load()
    assert(state?.hierarchy.action === "Install passport-jwt package", "action stored in state")
    assert(state?.metrics.context_updates === 2, "second context update counted")

    // Step 5: Check active.md was updated
    const activeMd = await readActiveMd(dir)
    assert(activeMd.body.includes("Implement JWT middleware"), "tactic in active.md")
    assert(activeMd.body.includes("Install passport-jwt package"), "action in active.md")

    // Step 6: Compact session
    const archivesBefore = await listArchives(dir)
    assert(archivesBefore.length === 0, "no archives before compaction")

    const compactResult = await compactSessionTool.execute(
      { summary: "JWT auth foundation complete" }
    )
    assert(compactResult.includes("Archived"), "compact_session archives session")

    // Step 7: Verify archive created
    const archivesAfter = await listArchives(dir)
    assert(archivesAfter.length === 1, "one archive after compaction")

    // Step 8: Verify state reset
    state = await stateManager.load()
    assert(state?.session.governance_status === "LOCKED", "session locked after compaction")
    assert(state?.metrics.turn_count === 0, "turn count reset")

    // Step 9: Check index.md updated
    const indexMd = await readFile(join(dir, ".opencode", "planning", "index.md"), "utf-8")
    assert(indexMd.includes("JWT auth foundation complete"), "summary in index.md")

  } finally {
    await cleanup()
  }
}

async function test_strictModeWorkflow() {
  process.stderr.write("\n--- integration: strict mode workflow ---\n")

  const dir = await setup()

  try {
    // Initialize with strict mode
    await initProject(dir, { governanceMode: "strict", language: "en" })

    const stateManager = createStateManager(dir)
    let state = await stateManager.load()
    assert(state?.session.governance_status === "LOCKED", "strict mode starts LOCKED")

    // Create tool instance bound to this directory
    const declareIntentTool = createDeclareIntentTool(dir)

    // Try to declare intent
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Strict mode test" }
    )

    state = await stateManager.load()
    assert(state?.session.governance_status === "OPEN", "session unlocked after declare_intent")

  } finally {
    await cleanup()
  }
}

async function test_contextTransitions() {
  process.stderr.write("\n--- integration: context level transitions ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    // Create tool instances bound to this directory
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    // Start session
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Multi-level context test" }
    )

    const stateManager = createStateManager(dir)

    // Test all level transitions
    await mapContextTool.execute(
      { level: "trajectory", content: "Level 1 test", status: "active" }
    )
    let state = await stateManager.load()
    assert(state?.hierarchy.trajectory === "Level 1 test", "trajectory updated")

    await mapContextTool.execute(
      { level: "tactic", content: "Level 2 test", status: "active" }
    )
    state = await stateManager.load()
    assert(state?.hierarchy.tactic === "Level 2 test", "tactic updated")

    await mapContextTool.execute(
      { level: "action", content: "Level 3 test", status: "active" }
    )
    state = await stateManager.load()
    assert(state?.hierarchy.action === "Level 3 test", "action updated")

    // Test status transitions
    await mapContextTool.execute(
      { level: "action", content: "Level 3 test", status: "complete" }
    )
    const activeMd = await readActiveMd(dir)
    assert(activeMd.body.includes("[COMPLETE]"), "complete status recorded")

  } finally {
    await cleanup()
  }
}

async function test_driftReset() {
  process.stderr.write("\n--- integration: drift score reset on context update ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const stateManager = createStateManager(dir)

    // Create tool instances bound to this directory
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    // Start session
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Drift test" }
    )

    // Simulate tool calls (would normally be done via hook)
    let state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 10
      state.metrics.drift_score = 30 // Low drift
      await stateManager.save(state)
    }

    // Context update should reset
    await mapContextTool.execute(
      { level: "action", content: "Reset drift", status: "active" }
    )

    state = await stateManager.load()
    assert(state?.metrics.turn_count === 0, "turn count reset after context update")
    assert((state?.metrics.drift_score ?? 0) > 30, "drift score boosted after context update")

  } finally {
    await cleanup()
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Integration Tests ===\n")

  await test_fullLifecycle()
  await test_strictModeWorkflow()
  await test_contextTransitions()
  await test_driftReset()

  process.stderr.write(`\n=== Integration: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
