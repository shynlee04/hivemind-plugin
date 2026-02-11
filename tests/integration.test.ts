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
import { createCompactionHook } from "../src/hooks/compaction.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createLogger } from "../src/lib/logging.js"
import { loadConfig } from "../src/lib/persistence.js"
import { mkdtemp, rm, readdir } from "fs/promises"
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
    const indexMd = await readFile(join(dir, ".hivemind", "sessions", "index.md"), "utf-8")
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

async function test_compactionHookPreservesHierarchy() {
  process.stderr.write("\n--- integration: compaction hook preserves hierarchy ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    // Set up full hierarchy
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Build feature" }
    )
    await mapContextTool.execute(
      { level: "tactic", content: "Implement component", status: "active" }
    )
    await mapContextTool.execute(
      { level: "action", content: "Write test", status: "active" }
    )

    const stateManager = createStateManager(dir)
    const compactionHook = createCompactionHook(
      await createLogger(dir, "test"),
      dir
    )

    const state = await stateManager.load()
    if (!state) {
      throw new Error("State should exist")
    }

    const output = { context: [] as string[] }

    await compactionHook(
      { sessionID: state.session.id },
      output
    )

    assert(
      output.context.length > 0,
      "compaction hook should add context"
    )
    assert(
      output.context[0].includes("Trajectory: Build feature"),
      "hierarchy should include trajectory"
    )
    assert(
      output.context[0].includes("Tactic: Implement component"),
      "hierarchy should include tactic"
    )
    assert(
      output.context[0].includes("Action: Write test"),
      "hierarchy should include action"
    )
  } finally {
    await cleanup()
  }
}

// ─── Round 1 Auto-Hooks Tests ─────────────────────────────────────────

async function test_staleSessionAutoArchived() {
  process.stderr.write("\n--- integration: stale session auto-archived on lifecycle hook ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Step 2: Declare intent to create a session
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Stale session test" }
    )

    // Step 3: Load state, record original session ID
    const stateManager = createStateManager(dir)
    let state = await stateManager.load()
    const originalSessionId = state!.session.id

    // Step 4: Modify brain state — set last_activity to 4 days ago
    state!.session.last_activity = Date.now() - (4 * 86_400_000)
    await stateManager.save(state!)

    // Step 5: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 6: Assert: new session was created (different session ID)
    const newState = await stateManager.load()
    assert(newState !== null, "state exists after stale archive")
    assert(newState!.session.id !== originalSessionId, "new session ID created after stale archive")

    // Step 7: Assert: archive directory has at least 1 file
    const archives = await listArchives(dir)
    assert(archives.length >= 1, "archive has at least 1 file after stale archive")

    // Step 8: Assert: index.md contains "[auto-archived: stale]"
    const indexMd = await readFile(join(dir, ".hivemind", "sessions", "index.md"), "utf-8")
    assert(indexMd.includes("[auto-archived: stale]"), "index.md contains auto-archived stale marker")

  } finally {
    await cleanup()
  }
}

async function test_chainBreaksInjected() {
  process.stderr.write("\n--- integration: chain breaks injected into system prompt ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Chain break test" }
    )

    // Step 2: Modify brain state — set action without tactic (orphaned action)
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    state!.hierarchy.action = "Write tests"
    state!.hierarchy.tactic = "" // ensure empty — orphaned action
    await stateManager.save(state!)

    // Step 3: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 4: Assert chain break detection
    const systemText = output.system.join("\n")
    assert(systemText.includes("Chain breaks detected"), "output contains chain breaks warning")
    assert(
      systemText.includes("no parent tactic"),
      "output mentions missing parent tactic"
    )

  } finally {
    await cleanup()
  }
}

async function test_commitSuggestionAtThreshold() {
  process.stderr.write("\n--- integration: commit suggestion appears at file threshold ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Commit advisor test" }
    )

    // Step 2: Modify brain state — add 5+ files to files_touched
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    state!.metrics.files_touched = [
      "src/a.ts", "src/b.ts", "src/c.ts", "src/d.ts", "src/e.ts"
    ]
    await stateManager.save(state!)

    // Step 3: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 4: Assert commit suggestion
    const systemText = output.system.join("\n")
    assert(
      systemText.includes("files touched") && systemText.includes("consider committing"),
      "output contains commit suggestion"
    )

  } finally {
    await cleanup()
  }
}

async function test_toolActivationSuggestsIntentWhenLocked() {
  process.stderr.write("\n--- integration: tool activation suggests declare_intent when locked ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project in strict mode (session starts LOCKED)
    await initProject(dir, { governanceMode: "strict", language: "en", silent: true })

    // Step 2: Create session lifecycle hook and call it (DON'T declare intent)
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 3: Assert tool activation suggests declare_intent
    const systemText = output.system.join("\n")
    assert(systemText.includes("declare_intent"), "output suggests declare_intent tool")
    assert(
      systemText.includes("LOCKED"),
      "output mentions LOCKED status"
    )

  } finally {
    await cleanup()
  }
}

// ─── Round 2 Integration Tests ─────────────────────────────────────────

async function test_sessionMetadataPersistsThroughLifecycle() {
  process.stderr.write("\n--- round2: session metadata persists through lifecycle ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Step 2: Declare intent
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Metadata persistence test" }
    )

    // Step 3: Load brain state
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()

    // Step 4: Assert date is today's YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0]
    assert(state!.session.date === today, "state.session.date is today's date")

    // Step 5: Assert by_ai is true
    assert(state!.session.by_ai === true, "state.session.by_ai is true")

  } finally {
    await cleanup()
  }
}

async function test_activeMdContainsLivingPlan() {
  process.stderr.write("\n--- round2: active.md contains living plan section ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Living plan test" }
    )

    // Step 2: Read active.md
    const activeMd = await readActiveMd(dir)

    // Step 3: Assert body contains "## Plan"
    assert(activeMd.body.includes("## Plan"), "active.md contains '## Plan' section")

    // Step 4: Assert body contains the focus text as a plan item
    assert(activeMd.body.includes("Living plan test"), "active.md contains focus text")

  } finally {
    await cleanup()
  }
}

async function test_compactSessionGeneratesExportFiles() {
  process.stderr.write("\n--- round2: compact_session generates export files ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Export test" }
    )

    // Step 2: Call compact_session tool
    const compactSessionTool = createCompactSessionTool(dir)
    await compactSessionTool.execute(
      { summary: "Export generation test" }
    )

    // Step 3: Check export directory
    const exportDir = join(dir, ".hivemind", "sessions", "archive", "exports")
    let exportFiles: string[] = []
    try {
      exportFiles = await readdir(exportDir)
    } catch {
      // directory might not exist
    }

    // Step 4: Assert at least 1 .json file exists
    const jsonFiles = exportFiles.filter(f => f.endsWith(".json"))
    assert(jsonFiles.length >= 1, "at least 1 .json export file exists")

    // Step 5: Assert at least 1 .md file exists
    const mdFiles = exportFiles.filter(f => f.endsWith(".md"))
    assert(mdFiles.length >= 1, "at least 1 .md export file exists")

  } finally {
    await cleanup()
  }
}

async function test_longSessionWarningInjectedAtThreshold() {
  process.stderr.write("\n--- round2: long session warning injected at threshold ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Long session test" }
    )

    // Step 2: Modify brain state — set turn_count to auto_compact_on_turns (default 20)
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    state!.metrics.turn_count = 20
    await stateManager.save(state!)

    // Step 3: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 4: Assert output contains compact_session suggestion
    const systemText = output.system.join("\n")
    assert(
      systemText.includes("compact_session") || systemText.includes("Consider using compact_session"),
      "output contains compact_session suggestion at threshold"
    )

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
  await test_compactionHookPreservesHierarchy()
  await test_staleSessionAutoArchived()
  await test_chainBreaksInjected()
  await test_commitSuggestionAtThreshold()
  await test_toolActivationSuggestsIntentWhenLocked()
  await test_sessionMetadataPersistsThroughLifecycle()
  await test_activeMdContainsLivingPlan()
  await test_compactSessionGeneratesExportFiles()
  await test_longSessionWarningInjectedAtThreshold()

  process.stderr.write(`\n=== Integration: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
