/**
 * Integration Tests — End-to-end workflow validation
 *
 * Tests the complete lifecycle: init → declare_intent → map_context → compact_session
 */

import { initProject } from "../src/cli/init.js"
import { createStateManager, loadConfig, saveConfig } from "../src/lib/persistence.js"
import { readActiveMd, listArchives } from "../src/lib/planning-fs.js"
import { readFile } from "fs/promises"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createMapContextTool } from "../src/tools/map-context.js"
import { createCompactSessionTool } from "../src/tools/compact-session.js"
import { createScanHierarchyTool } from "../src/tools/scan-hierarchy.js"
import { createSaveAnchorTool } from "../src/tools/save-anchor.js"
import { createThinkBackTool } from "../src/tools/think-back.js"
import { createCheckDriftTool } from "../src/tools/check-drift.js"
import { createCompactionHook } from "../src/hooks/compaction.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createToolGateHookInternal } from "../src/hooks/tool-gate.js"
import { createEventHandler } from "../src/hooks/event-handler.js"
import { initSdkContext, resetSdkContext } from "../src/hooks/sdk-context.js"
import { createLogger } from "../src/lib/logging.js"
import { createConfig } from "../src/schemas/config.js"
import { loadAnchors, saveAnchors, addAnchor } from "../src/lib/anchors.js"
import { loadMems } from "../src/lib/mems.js"
import { loadTree } from "../src/lib/hierarchy-tree.js"
import { createSaveMemTool } from "../src/tools/save-mem.js"
import { createListShelvesTool } from "../src/tools/list-shelves.js"
import { createRecallMemsTool } from "../src/tools/recall-mems.js"
import { mkdtemp, rm, readdir, mkdir, writeFile } from "fs/promises"
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

    const newTree = await loadTree(dir)
    assert(newTree.root === null, "hierarchy tree reset after stale auto-archive")

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

async function test_firstRunSetupGuidanceIncludesReconProtocol() {
  process.stderr.write("\n--- integration: first-run setup guidance includes deep recon protocol ---\n")

  const dir = await setup()

  try {
    await writeFile(
      join(dir, "package.json"),
      JSON.stringify(
        {
          name: "hm-first-run",
          dependencies: {
            typescript: "^5.0.0",
            react: "^19.0.0",
          },
        },
        null,
        2
      )
    )
    await mkdir(join(dir, ".planning"), { recursive: true })
    await writeFile(join(dir, ".planning", "STATE.md"), "Current focus: Phase 2")
    await writeFile(join(dir, ".planning", "ROADMAP.md"), "## Phase 2: Test\n**Goal:** Validate")

    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, createConfig())
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    const systemText = output.system.join("\n")
    assert(systemText.includes("<hivemind-setup>"), "setup block injected when config is missing")
    assert(systemText.includes("First-Run Recon Protocol"), "setup block includes recon protocol")
    assert(systemText.includes("Detected project: hm-first-run"), "setup block includes detected project name")
    assert(systemText.includes("Framework context:"), "setup block includes framework context")

    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    assert(state === null, "first-run setup guidance does not auto-create brain state")
  } finally {
    await cleanup()
  }
}

async function test_persistenceMigratesWriteWithoutReadCount() {
  process.stderr.write("\n--- integration: persistence migrates write_without_read_count ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const stateManager = createStateManager(dir)
    const current = await stateManager.load()
    assert(current !== null, "state exists before migration test")

    const legacyLike = {
      ...current!,
      metrics: {
        ...current!.metrics,
      },
    } as any
    delete legacyLike.metrics.write_without_read_count

    await writeFile(
      join(dir, ".hivemind", "brain.json"),
      JSON.stringify(legacyLike, null, 2),
      "utf-8"
    )

    const migrated = await stateManager.load()
    assert(
      migrated!.metrics.write_without_read_count === 0,
      "missing write_without_read_count migrates to 0"
    )
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
    assert(systemText.includes("Chain breaks:"), "output contains chain breaks warning")
    assert(
      systemText.includes("no parent tactic"),
      "output mentions missing parent tactic"
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
  process.stderr.write("\n--- round2: active session file keeps hierarchy/log structure ---\n")

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

    // Step 3: Assert body contains hierarchy + log sections (new per-session format)
    assert(activeMd.body.includes("## Hierarchy"), "active session contains '## Hierarchy' section")
    assert(activeMd.body.includes("## Log"), "active session contains '## Log' section")

    // Step 4: Assert body contains the focus text
    assert(activeMd.body.includes("Living plan test"), "active session contains focus text")

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

// ─── Round 3 Integration Tests ─────────────────────────────────────────

async function test_scanHierarchyReturnsStructuredState() {
  process.stderr.write("\n--- round3: scan_hierarchy returns structured state ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent, set hierarchy
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Scan hierarchy test" }
    )
    await mapContextTool.execute(
      { level: "tactic", content: "Build component", status: "active" }
    )

    // Step 2: Call scan_hierarchy
    const scanTool = createScanHierarchyTool(dir)
    const result = await scanTool.execute({})

    // Step 3: Assert structured text output
    assert(
      result.includes("Session:") && result.includes("OPEN") && result.includes("plan_driven"),
      "scan_hierarchy returns session info"
    )
    assert(
      result.includes("Trajectory: Scan hierarchy test") &&
      result.includes("Tactic: Build component"),
      "scan_hierarchy returns hierarchy levels"
    )

  } finally {
    await cleanup()
  }
}

async function test_saveAnchorPersistsAndSurvivesCompaction() {
  process.stderr.write("\n--- round3: save_anchor persists and survives compaction ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Anchor persistence test" }
    )

    // Step 2: Save an anchor
    const saveAnchorTool = createSaveAnchorTool(dir)
    const saveResult = await saveAnchorTool.execute({ key: "DB_TYPE", value: "PostgreSQL" })
    assert(
      saveResult.includes("Anchor saved") && saveResult.includes("DB_TYPE"),
      "save_anchor returns confirmation"
    )

    // Step 3: Compact session (resets brain state)
    const compactTool = createCompactSessionTool(dir)
    await compactTool.execute({ summary: "Anchor test done" })

    // Step 4: Verify anchor survived compaction
    const anchors = await loadAnchors(dir)
    assert(
      anchors.anchors.length === 1 && anchors.anchors[0].key === "DB_TYPE" && anchors.anchors[0].value === "PostgreSQL",
      "anchor survives session compaction"
    )

  } finally {
    await cleanup()
  }
}

async function test_anchorsInjectedIntoSystemPrompt() {
  process.stderr.write("\n--- round3: anchors injected into system prompt ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Anchors prompt injection test" }
    )

    // Step 2: Save an anchor
    const saveAnchorTool = createSaveAnchorTool(dir)
    await saveAnchorTool.execute({ key: "CONSTRAINT", value: "Never modify production DB" })

    // Step 3: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 4: Assert anchors in system prompt
    const systemText = output.system.join("\n")
    assert(
      systemText.includes("immutable-anchors") && systemText.includes("CONSTRAINT"),
      "system prompt contains anchors from save_anchor"
    )

  } finally {
    await cleanup()
  }
}

async function test_thinkBackIncludesAllContextSections() {
  process.stderr.write("\n--- round3: think_back includes all context sections ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent, set full hierarchy
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Think back test" }
    )
    await mapContextTool.execute(
      { level: "tactic", content: "Implement feature X", status: "active" }
    )

    // Step 2: Save an anchor
    const saveAnchorTool = createSaveAnchorTool(dir)
    await saveAnchorTool.execute({ key: "API_VERSION", value: "v3" })

    // Step 3: Call think_back
    const thinkBackTool = createThinkBackTool(dir)
    const result = await thinkBackTool.execute({})

    // Step 4: Assert all sections present
    assert(
      result.includes("THINK BACK") &&
      result.includes("Trajectory: Think back test") &&
      result.includes("Tactic: Implement feature X"),
      "think_back includes hierarchy"
    )
    assert(
      result.includes("Immutable Anchors") && result.includes("[API_VERSION]: v3"),
      "think_back includes anchors"
    )

  } finally {
    await cleanup()
  }
}

async function test_checkDriftShowsHealthyWhenAligned() {
  process.stderr.write("\n--- round3: check_drift shows healthy when aligned ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent, set full hierarchy (well-aligned)
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Drift check healthy test" }
    )
    await mapContextTool.execute(
      { level: "tactic", content: "On-track tactic", status: "active" }
    )
    await mapContextTool.execute(
      { level: "action", content: "On-track action", status: "active" }
    )

    // Step 2: Call check_drift
    const checkDriftTool = createCheckDriftTool(dir)
    const result = await checkDriftTool.execute({})

    // Step 3: Assert healthy state
    assert(
      result.includes("✅") && result.includes("On track"),
      "check_drift shows healthy when trajectory/tactic/action aligned"
    )
    assert(
      result.includes("Hierarchy chain is intact"),
      "check_drift shows intact chain when hierarchy complete"
    )

  } finally {
    await cleanup()
  }
}

async function test_checkDriftWarnsWhenDrifting() {
  process.stderr.write("\n--- round3: check_drift warns when drifting ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Drift check warning test" }
    )

    // Step 2: Artificially inflate turn count to degrade drift score
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 12  // 12*5=60, capped at 50 → score=50 → ⚠ range
      state.metrics.context_updates = 0
      // Set orphaned action for chain break
      state.hierarchy.tactic = ""
      state.hierarchy.action = "Orphaned work"
      await stateManager.save(state)
    }

    // Step 3: Call check_drift
    const checkDriftTool = createCheckDriftTool(dir)
    const result = await checkDriftTool.execute({})

    // Step 4: Assert warning state
    assert(
      result.includes("⚠") && result.includes("Some drift detected"),
      "check_drift warns when drift score in warning range"
    )

  } finally {
    await cleanup()
  }
}

async function test_fullCognitiveMeshWorkflow() {
  process.stderr.write("\n--- round3: full cognitive mesh workflow ---\n")

  const dir = await setup()

  try {
    // Full workflow: declare → anchor → think → map → drift check → compact
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)
    const saveAnchorTool = createSaveAnchorTool(dir)
    const thinkBackTool = createThinkBackTool(dir)
    const checkDriftTool = createCheckDriftTool(dir)
    const scanTool = createScanHierarchyTool(dir)
    const compactTool = createCompactSessionTool(dir)

    // Step 1: Declare intent
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Cognitive mesh workflow" }
    )

    // Step 2: Save anchors
    await saveAnchorTool.execute({ key: "STACK", value: "TypeScript + Bun" })
    await saveAnchorTool.execute({ key: "CONSTRAINT", value: "No external deps" })

    // Step 3: Set full hierarchy
    await mapContextTool.execute(
      { level: "tactic", content: "Core implementation", status: "active" }
    )
    await mapContextTool.execute(
      { level: "action", content: "Write pure functions", status: "active" }
    )

    // Step 4: Think back — verify all context accessible
    const thinkResult = await thinkBackTool.execute({})
    assert(
      thinkResult.includes("Cognitive mesh workflow") &&
      thinkResult.includes("[STACK]: TypeScript + Bun") &&
      thinkResult.includes("[CONSTRAINT]: No external deps") &&
      thinkResult.includes("Core implementation"),
      "think_back integrates all cognitive mesh components"
    )

    // Step 5: Scan hierarchy — verify structured data
    const scanResult = await scanTool.execute({})
    assert(
      scanResult.includes("Anchors (2)") &&
      scanResult.includes("Tactic: Core implementation") &&
      scanResult.includes("Action: Write pure functions"),
      "scan_hierarchy shows full cognitive mesh state"
    )

    // Step 6: Check drift — should be healthy
    const driftResult = await checkDriftTool.execute({})
    assert(
      driftResult.includes("On track") && driftResult.includes("Hierarchy chain is intact"),
      "check_drift confirms healthy cognitive mesh"
    )

    // Step 7: Compact — anchors survive
    await compactTool.execute({ summary: "Cognitive mesh workflow complete" })
    const anchorsAfter = await loadAnchors(dir)
    assert(
      anchorsAfter.anchors.length === 2 &&
      anchorsAfter.anchors.some(a => a.key === "STACK") &&
      anchorsAfter.anchors.some(a => a.key === "CONSTRAINT"),
      "anchors survive compaction in full workflow"
    )

  } finally {
    await cleanup()
  }
}

// ─── Round 4 Integration Tests ─────────────────────────────────────────

async function test_saveMemPersistsAndSurvivesCompaction() {
  process.stderr.write("\n--- round4: save_mem persists and survives compaction ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Mems persistence test" }
    )

    // Step 2: Save a memory
    const saveMemTool = createSaveMemTool(dir)
    const saveResult = await saveMemTool.execute({
      shelf: "decisions",
      content: "Use PostgreSQL for main database",
      tags: "database,postgres,architecture"
    })
    assert(
      saveResult.includes("Memory saved") && saveResult.includes("[decisions]"),
      "save_mem stores memory in mems.json"
    )

    // Step 3: Verify it persisted on disk
    const memsBeforeCompaction = await loadMems(dir)
    assert(
      memsBeforeCompaction.mems.length === 1 &&
      memsBeforeCompaction.mems[0].shelf === "decisions" &&
      memsBeforeCompaction.mems[0].content === "Use PostgreSQL for main database",
      "memory persists on disk"
    )

    // Step 4: Compact session (resets brain state)
    const compactTool = createCompactSessionTool(dir)
    await compactTool.execute({ summary: "Mems test done" })

    // Step 5: Verify memory survived compaction (plus auto-mem = 2 total)
    const memsAfterCompaction = await loadMems(dir)
    assert(
      memsAfterCompaction.mems.some(m =>
        m.shelf === "decisions" && m.content === "Use PostgreSQL for main database"
      ),
      "memory survives session compaction"
    )

  } finally {
    await cleanup()
  }
}

async function test_recallMemsSearchesAcrossSessions() {
  process.stderr.write("\n--- round4: recall_mems searches across sessions ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Recall search test" }
    )

    // Step 2: Save mems to different shelves
    const saveMemTool = createSaveMemTool(dir)
    await saveMemTool.execute({
      shelf: "errors",
      content: "CORS error on /api/auth endpoint",
      tags: "cors,auth,api"
    })
    await saveMemTool.execute({
      shelf: "solutions",
      content: "Fixed CORS by adding allowed-origins header",
      tags: "cors,fix"
    })
    await saveMemTool.execute({
      shelf: "decisions",
      content: "Use Redis for session storage",
      tags: "redis,session"
    })

    // Step 3: Compact session (simulates "previous session")
    const compactTool = createCompactSessionTool(dir)
    await compactTool.execute({ summary: "Session 1 complete" })

    // Step 4: Start new session
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "New session" }
    )

    // Step 5: Recall mems — cross-session search
    const recallTool = createRecallMemsTool(dir)
    const recallResult = await recallTool.execute({ query: "CORS" })
    assert(
      recallResult.includes("CORS error") && recallResult.includes("Fixed CORS"),
      "recall_mems finds mems from previous sessions"
    )

    // Step 6: Recall with shelf filter
    const filteredResult = await recallTool.execute({ query: "CORS", shelf: "errors" })
    assert(
      filteredResult.includes("CORS error") && !filteredResult.includes("Fixed CORS"),
      "recall_mems filters by shelf correctly"
    )

  } finally {
    await cleanup()
  }
}

async function test_listShelvesShowsOverview() {
  process.stderr.write("\n--- round4: list_shelves shows accurate overview ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "List shelves test" }
    )

    // Step 2: Save mems to multiple shelves
    const saveMemTool = createSaveMemTool(dir)
    await saveMemTool.execute({ shelf: "decisions", content: "Decision 1" })
    await saveMemTool.execute({ shelf: "decisions", content: "Decision 2" })
    await saveMemTool.execute({ shelf: "errors", content: "Error 1" })

    // Step 3: Call list_shelves
    const listTool = createListShelvesTool(dir)
    const listResult = await listTool.execute({})

    // Step 4: Assert total count
    assert(
      listResult.includes("Total memories: 3"),
      "list_shelves shows total count"
    )

    // Step 5: Assert shelf breakdown
    assert(
      listResult.includes("decisions: 2") && listResult.includes("errors: 1"),
      "list_shelves shows shelf breakdown"
    )

  } finally {
    await cleanup()
  }
}

async function test_autoMemOnCompaction() {
  process.stderr.write("\n--- round4: auto-mem on compaction ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent with hierarchy
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)

    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Auto-mem test" }
    )
    await mapContextTool.execute(
      { level: "tactic", content: "Build auth module", status: "active" }
    )

    // Step 2: Compact with summary
    const compactTool = createCompactSessionTool(dir)
    await compactTool.execute({ summary: "Auth module foundation complete" })

    // Step 3: Load mems and check auto-created context mem
    const memsState = await loadMems(dir)
    const autoMem = memsState.mems.find(m =>
      m.shelf === "context" && m.tags.includes("auto-compact")
    )
    assert(
      autoMem !== undefined,
      "compact_session creates context mem automatically"
    )
    assert(
      autoMem !== undefined &&
      autoMem.content.includes("Auth module foundation complete") &&
      autoMem.tags.includes("session-summary"),
      "auto-mem contains session summary"
    )

  } finally {
    await cleanup()
  }
}

async function test_systemPromptUsesHivemindTag() {
  process.stderr.write("\n--- round4: system prompt uses <hivemind> tag ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Tag format test" }
    )

    // Step 2: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 3: Assert <hivemind> tag used (not <hivemind-governance>)
    const systemText = output.system.join("\n")
    assert(
      systemText.includes("<hivemind>") && systemText.includes("</hivemind>"),
      "system prompt uses <hivemind> tags"
    )
    assert(
      !systemText.includes("<hivemind-governance>"),
      "system prompt does NOT use old <hivemind-governance> tags"
    )

  } finally {
    await cleanup()
  }
}

async function test_fullMemsBrainWorkflow() {
  process.stderr.write("\n--- round4: full mems brain workflow ---\n")

  const dir = await setup()

  try {
    // Full workflow: declare → save → recall → compact (auto-mem) → new session → recall across sessions
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)
    const saveMemTool = createSaveMemTool(dir)
    const recallTool = createRecallMemsTool(dir)
    const listTool = createListShelvesTool(dir)
    const compactTool = createCompactSessionTool(dir)

    // Step 1: Declare intent
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Full mems workflow" }
    )

    // Step 2: Save memories across shelves
    await saveMemTool.execute({
      shelf: "decisions",
      content: "Chose TypeScript over JavaScript for type safety",
      tags: "typescript,language"
    })
    await saveMemTool.execute({
      shelf: "patterns",
      content: "Pure functions for business logic, IO wrappers for side effects",
      tags: "architecture,pure-functions"
    })

    // Step 3: Recall — should find both
    const recallResult = await recallTool.execute({ query: "TypeScript" })
    assert(
      recallResult.includes("Chose TypeScript"),
      "full workflow: save → recall finds memory"
    )

    // Step 4: Set hierarchy and compact (auto-mem created)
    await mapContextTool.execute(
      { level: "tactic", content: "Core architecture", status: "active" }
    )
    await compactTool.execute({ summary: "Architecture decisions finalized" })

    // Step 5: Start new session
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Session 2 — building on decisions" }
    )

    // Step 6: Recall from new session — should find memories + auto-mem
    const crossSessionRecall = await recallTool.execute({ query: "architecture" })
    assert(
      crossSessionRecall.includes("Pure functions") &&
      crossSessionRecall.includes("Architecture decisions finalized"),
      "full workflow: recall across sessions finds both manual + auto mems"
    )

    // Step 7: List shelves — should show all categories
    const shelvesResult = await listTool.execute({})
    assert(
      shelvesResult.includes("decisions: 1") &&
      shelvesResult.includes("patterns: 1") &&
      shelvesResult.includes("context: 1"),
      "full workflow: list_shelves shows all shelf categories"
    )

  } finally {
    await cleanup()
  }
}

// ─── Round 5 Integration Tests — L7 Behavioral Bootstrap ─────────────

async function test_bootstrapBlockAppearsWhenLocked() {
  process.stderr.write("\n--- round5: bootstrap block appears in system prompt when LOCKED ---\n")

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

    // Step 3: Assert bootstrap block appears
    const systemText = output.system.join("\n")
    assert(
      systemText.includes("<hivemind-bootstrap>") && systemText.includes("</hivemind-bootstrap>"),
      "bootstrap block appears with XML tags when LOCKED"
    )
    assert(
      systemText.includes("declare_intent") && systemText.includes("map_context") && systemText.includes("compact_session"),
      "bootstrap block contains all 3 core tool names"
    )
    assert(
      systemText.includes("Required Workflow"),
      "bootstrap block contains workflow instructions"
    )
    assert(
      systemText.includes("Available Tools") || systemText.includes("Key Tools"),
      "bootstrap block contains tool listing"
    )
    assert(
      systemText.includes("MUST call") || systemText.includes("The session is LOCKED"),
      "bootstrap block contains LOCKED warning for strict mode"
    )
  } finally {
    await cleanup()
  }
}

async function test_bootstrapBlockDisappearsWhenOpen() {
  process.stderr.write("\n--- round5: bootstrap block remains in early open-turn window ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project, declare intent (session becomes OPEN)
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Bootstrap disappear test" }
    )

    // Step 2: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 3: Assert bootstrap block is present during turn-0..2 window, even when OPEN
    const systemText = output.system.join("\n")
    assert(
      systemText.includes("<hivemind-bootstrap>"),
      "bootstrap block appears when session is OPEN but still in early turn window"
    )
    // But regular <hivemind> should still be there
    assert(
      systemText.includes("<hivemind>") && systemText.includes("</hivemind>"),
      "regular hivemind block still present when OPEN"
    )
  } finally {
    await cleanup()
  }
}

async function test_bootstrapBlockDisappearsAfterTurnCount() {
  process.stderr.write("\n--- round5: bootstrap block disappears after turn_count > 2 ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project in strict mode (stays LOCKED)
    await initProject(dir, { governanceMode: "strict", language: "en", silent: true })

    // Step 2: Simulate turn_count > 2 while still LOCKED
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 3
      await stateManager.save(state)
    }

    // Step 3: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 4: Assert bootstrap block is NOT present (turn_count > 2)
    const systemText = output.system.join("\n")
    assert(
      !systemText.includes("<hivemind-bootstrap>"),
      "bootstrap block does NOT appear when turn_count > 2 (even if LOCKED)"
    )
  } finally {
    await cleanup()
  }
}

async function test_bootstrapBlockAssistedMode() {
  process.stderr.write("\n--- round5: bootstrap block in assisted mode ---\n")

  const dir = await setup()

  try {
    // Step 1: Init project in assisted mode
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Step 2: Verify session is LOCKED initially (default for new sessions)
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    // assisted mode starts OPEN, so we need to manually set to LOCKED for this test
    if (state) {
      state.session.governance_status = "LOCKED"
      state.metrics.turn_count = 0
      await stateManager.save(state)
    }

    // Step 3: Create session lifecycle hook and call it
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Step 4: Assert bootstrap block present and uses assisted wording
    const systemText = output.system.join("\n")
    assert(
      systemText.includes("<hivemind-bootstrap>"),
      "bootstrap block appears in assisted mode when LOCKED"
    )
    assert(
      systemText.includes("full tracking"),
      "bootstrap block uses softer wording for assisted mode"
    )
  } finally {
    await cleanup()
  }
}

async function test_bootstrapBlockAppearsInPermissiveModeTurn0() {
  process.stderr.write("\n--- round5: bootstrap block appears in permissive mode at turn 0 ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "permissive", language: "en", silent: true })

    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    const systemText = output.system.join("\n")
    assert(
      systemText.includes("<hivemind-bootstrap>"),
      "bootstrap block appears in permissive mode during turn window"
    )
  } finally {
    await cleanup()
  }
}

async function test_permissiveModeSuppressesDetectionPressureButKeepsNavigation() {
  process.stderr.write("\n--- round5: permissive suppresses pressure and keeps navigation ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "permissive", language: "en", silent: true })

    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 10
      state.metrics.consecutive_failures = 5
      state.metrics.keyword_flags = ["stuck", "retry"]
      state.metrics.tool_type_counts = { read: 10, write: 0, query: 0, governance: 0 }
      state.hierarchy.trajectory = "Permissive navigation"
      state.hierarchy.tactic = "Observe state"
      state.hierarchy.action = "Render context"
      await stateManager.save(state)
    }

    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    const systemText = output.system.join("\n")
    assert(
      systemText.includes("Session:") && systemText.includes("Next:"),
      "permissive mode still includes navigation context"
    )
    assert(
      !systemText.includes("[ALERTS]") && !systemText.includes("[WARN]") && !systemText.includes("[CRITICAL]"),
      "permissive mode suppresses detection-pressure warnings"
    )
  } finally {
    await cleanup()
  }
}

async function test_languageRoutingKeepsToolNamesEnglish() {
  process.stderr.write("\n--- round5: language routing keeps tool names English ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "strict", language: "vi", silent: true })

    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    const systemText = output.system.join("\n")
    assert(
      systemText.includes("Dang hoat dong") || systemText.includes("Quy trinh bat buoc"),
      "localized surrounding guidance is rendered in configured language"
    )
    assert(
      systemText.includes("declare_intent") && systemText.includes("map_context") && systemText.includes("compact_session"),
      "tool names remain English in localized output"
    )
  } finally {
    await cleanup()
  }
}

async function test_frameworkConflictPinsGoalAndSelectionMenu() {
  process.stderr.write("\n--- round6: framework conflict pins goal and menu in prompt ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    await mkdir(join(dir, ".planning"), { recursive: true })
    await mkdir(join(dir, ".spec-kit"), { recursive: true })
    await writeFile(
      join(dir, ".planning", "STATE.md"),
      "# State\n\n## Current Position\n\nPhase 2 of 6 | Plan 1 of 4 complete | Status: In Progress\n",
      "utf-8"
    )
    await writeFile(
      join(dir, ".planning", "ROADMAP.md"),
      "# Roadmap\n\n## Phase 2: Auto-Hooks\n**Goal:** Governance fires from turn 0 in every mode\n",
      "utf-8"
    )

    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")
    const hook = createSessionLifecycleHook(logger, dir, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    const systemText = output.system.join("\n")
    assert(
      systemText.includes("Pinned GSD goal: Governance fires from turn 0 in every mode"),
      "session prompt pins active gsd phase goal"
    )
    assert(
      systemText.includes("Use GSD") && systemText.includes("Use Spec-kit") && systemText.includes("acceptance_note"),
      "session prompt includes locked framework selection menu metadata"
    )
  } finally {
    await cleanup()
  }
}

async function test_frameworkConflictLimitedModeAllowsOnlyPlanningReads() {
  process.stderr.write("\n--- round6: framework limited mode gating ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "strict", language: "en", silent: true })

    await mkdir(join(dir, ".planning"), { recursive: true })
    await mkdir(join(dir, ".spec-kit"), { recursive: true })
    await writeFile(
      join(dir, ".planning", "STATE.md"),
      "# State\n\n## Current Position\n\nPhase 2 of 6 | Plan 1 of 4 complete | Status: In Progress\n",
      "utf-8"
    )
    await writeFile(
      join(dir, ".planning", "ROADMAP.md"),
      "# Roadmap\n\n## Phase 2: Auto-Hooks\n**Goal:** Governance fires from turn 0 in every mode\n",
      "utf-8"
    )

    const config = createConfig({
      governance_mode: "strict",
      automation_level: "assisted",
    })
    await saveConfig(dir, config)

    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (!state) {
      throw new Error("state missing")
    }
    state.session.governance_status = "OPEN"
    await stateManager.save(state)

    const gate = createToolGateHookInternal(await createLogger(dir, "test"), dir, config)
    const blocked = await gate({ sessionID: "test-session", tool: "write" })
    assert(blocked.allowed, "write remains non-blocking in limited mode without framework selection")
    assert(
      blocked.warning?.includes("LIMITED MODE") === true,
      "limited mode message includes simulated block marker"
    )
    assert(
      blocked.warning?.includes("rollback guidance") === true,
      "limited mode includes rollback guidance"
    )

    const updated = await stateManager.load()
    if (!updated) {
      throw new Error("updated state missing")
    }
    updated.framework_selection.choice = "gsd"
    updated.framework_selection.active_phase = "02"
    updated.framework_selection.updated_at = Date.now()
    await stateManager.save(updated)

    const allowed = await gate({ sessionID: "test-session", tool: "write" })
    assert(allowed.allowed, "write allowed after framework selection metadata is provided")
  } finally {
    await cleanup()
  }
}

async function test_eventIdleEmitsStaleAndCompactionToasts() {
  process.stderr.write("\n--- round5: session.idle drives stale toasts and compaction stays info ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (state) {
      state.metrics.drift_score = 40
      state.session.last_activity = Date.now() - (5 * 86_400_000)
      await stateManager.save(state)
    }

    const toasts: Array<{ message: string; variant: string }> = []
    initSdkContext({
      client: {
        tui: {
          showToast: async ({ body }: any) => {
            toasts.push({ message: body.message, variant: body.variant })
          },
        },
      } as any,
      $: (() => {}) as any,
      serverUrl: new URL("http://localhost:3000"),
      project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
    })

    const logger = await createLogger(dir, "test")
    const handler = createEventHandler(logger, dir)

    await handler({ event: { type: "session.idle", properties: { sessionID: "session-a" } } as any })
    await handler({ event: { type: "session.idle", properties: { sessionID: "session-a" } } as any })
    await handler({ event: { type: "session.compacted", properties: { sessionID: "session-a" } } as any })

    assert(
      toasts.some(t => t.variant === "warning" && t.message.includes("Drift risk detected")),
      "idle emits warning toast before escalation"
    )
    assert(
      toasts.some(t => t.variant === "error" && t.message.includes("Drift risk detected")),
      "repeated idle signal escalates drift toast to error"
    )
    assert(
      toasts.some(t => t.variant === "info" && t.message.includes("Session compacted")),
      "compaction toast is informational"
    )

  } finally {
    resetSdkContext()
    await cleanup()
  }
}

async function test_compactionHookEmitsInfoToastOnly() {
  process.stderr.write("\n--- round5: compaction hook emits info toast ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Compaction toast test" }
    )

    const toasts: Array<{ message: string; variant: string }> = []
    initSdkContext({
      client: {
        tui: {
          showToast: async ({ body }: any) => {
            toasts.push({ message: body.message, variant: body.variant })
          },
        },
      } as any,
      $: (() => {}) as any,
      serverUrl: new URL("http://localhost:3000"),
      project: { id: "test", worktree: dir, time: { created: Date.now() } } as any,
    })

    const hook = createCompactionHook(await createLogger(dir, "test"), dir)
    const output = { context: [] as string[] }
    await hook({ sessionID: "session-a" }, output)

    assert(
      toasts.some(t => t.variant === "info" && t.message.includes("Compaction context injected")),
      "compaction hook emits info toast"
    )
    assert(
      !toasts.some(t => t.variant === "warning" || t.variant === "error"),
      "compaction hook does not escalate beyond info"
    )
  } finally {
    resetSdkContext()
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
  await test_firstRunSetupGuidanceIncludesReconProtocol()
  await test_persistenceMigratesWriteWithoutReadCount()
  await test_chainBreaksInjected()
  await test_toolActivationSuggestsIntentWhenLocked()
  await test_sessionMetadataPersistsThroughLifecycle()
  await test_activeMdContainsLivingPlan()
  await test_compactSessionGeneratesExportFiles()
  await test_longSessionWarningInjectedAtThreshold()
  await test_scanHierarchyReturnsStructuredState()
  await test_saveAnchorPersistsAndSurvivesCompaction()
  await test_anchorsInjectedIntoSystemPrompt()
  await test_thinkBackIncludesAllContextSections()
  await test_checkDriftShowsHealthyWhenAligned()
  await test_checkDriftWarnsWhenDrifting()
  await test_fullCognitiveMeshWorkflow()
  await test_saveMemPersistsAndSurvivesCompaction()
  await test_recallMemsSearchesAcrossSessions()
  await test_listShelvesShowsOverview()
  await test_autoMemOnCompaction()
  await test_systemPromptUsesHivemindTag()
  await test_fullMemsBrainWorkflow()
  await test_bootstrapBlockAppearsWhenLocked()
  await test_bootstrapBlockDisappearsWhenOpen()
  await test_bootstrapBlockDisappearsAfterTurnCount()
  await test_bootstrapBlockAssistedMode()
  await test_bootstrapBlockAppearsInPermissiveModeTurn0()
  await test_permissiveModeSuppressesDetectionPressureButKeepsNavigation()
  await test_languageRoutingKeepsToolNamesEnglish()
  await test_frameworkConflictPinsGoalAndSelectionMenu()
  await test_frameworkConflictLimitedModeAllowsOnlyPlanningReads()
  await test_eventIdleEmitsStaleAndCompactionToasts()
  await test_compactionHookEmitsInfoToastOnly()

  process.stderr.write(`\n=== Integration: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
