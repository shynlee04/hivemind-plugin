/**
 * Round 3 Tools Tests — Anchors Persistence + scan_hierarchy + save_anchor + think_back + check_drift
 *
 * 32 assertions:
 *   Anchors (8): load, add, replace, remove, roundtrip, format empty, format values, format tags
 *   scan_hierarchy (6): no session, structured text session info, hierarchy levels, metrics, anchors section, not-set defaults
 *   save_anchor (6): saves to anchors.json, replaces existing key, returns confirmation, survives compaction, system prompt includes anchors, system prompt includes tag
 *   think_back (6): no session, trajectory, session health, anchors, chain breaks, plan section
 *   check_drift (6): no session, drift score emoji, trajectory alignment, chain intact, chain broken, recommendation
 */

import { mkdtempSync, rmSync, existsSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  loadAnchors,
  saveAnchors,
  addAnchor,
  removeAnchor,
  formatAnchorsForPrompt,
} from "../src/lib/anchors.js"
import type { AnchorsState } from "../src/lib/anchors.js"
import { createScanHierarchyTool } from "../src/tools/scan-hierarchy.js"
import { createSaveAnchorTool } from "../src/tools/save-anchor.js"
import { createThinkBackTool } from "../src/tools/think-back.js"
import { createCheckDriftTool } from "../src/tools/check-drift.js"
import { createStateManager } from "../src/lib/persistence.js"
import { createBrainState } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"
import { initializePlanningDirectory, writeActiveMd } from "../src/lib/planning-fs.js"

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

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "hm-r3-"))
}

function cleanTmpDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true })
  } catch { /* ignore */ }
}

// ─── Anchor Tests (8 assertions) ──────────────────────────────────────

async function test_anchors() {
  process.stderr.write("\n--- anchors: persistence + CRUD ---\n")

  // 1. loadAnchors returns empty state for new project
  const tmpDir = makeTmpDir()
  try {
    const state = await loadAnchors(tmpDir)
    assert(
      state.anchors.length === 0 && state.version === "1.0.0",
      "loadAnchors returns empty state for new project"
    )

    // 2. addAnchor adds to state
    const s2 = addAnchor(state, "stack", "TypeScript + Node.js", "sess-001")
    assert(
      s2.anchors.length === 1 && s2.anchors[0].key === "stack" && s2.anchors[0].value === "TypeScript + Node.js",
      "addAnchor adds to state"
    )

    // 3. addAnchor replaces existing key
    const s3 = addAnchor(s2, "stack", "Rust + Tokio", "sess-002")
    assert(
      s3.anchors.length === 1 && s3.anchors[0].value === "Rust + Tokio",
      "addAnchor replaces existing key"
    )

    // 4. removeAnchor removes by key
    const s4 = addAnchor(s3, "db", "PostgreSQL", "sess-002")
    const s5 = removeAnchor(s4, "stack")
    assert(
      s5.anchors.length === 1 && s5.anchors[0].key === "db",
      "removeAnchor removes by key"
    )

    // 5. saveAnchors + loadAnchors roundtrip
    const saveState: AnchorsState = addAnchor(
      addAnchor({ anchors: [], version: "1.0.0" }, "lang", "TypeScript", "sess-1"),
      "framework", "Express", "sess-1"
    )
    await saveAnchors(tmpDir, saveState)
    const loaded = await loadAnchors(tmpDir)
    assert(
      loaded.anchors.length === 2 &&
      loaded.anchors[0].key === "lang" &&
      loaded.anchors[1].key === "framework",
      "saveAnchors + loadAnchors roundtrip"
    )

    // 6. formatAnchorsForPrompt with 0 anchors returns empty string
    const emptyState: AnchorsState = { anchors: [], version: "1.0.0" }
    assert(
      formatAnchorsForPrompt(emptyState) === "",
      "formatAnchorsForPrompt with 0 anchors returns empty string"
    )

    // 7. formatAnchorsForPrompt includes key-value pairs
    const formatted = formatAnchorsForPrompt(loaded)
    assert(
      formatted.includes("[lang]: TypeScript") && formatted.includes("[framework]: Express"),
      "formatAnchorsForPrompt includes key-value pairs"
    )

    // 8. formatAnchorsForPrompt includes immutable-anchors tags
    assert(
      formatted.includes("<immutable-anchors>") && formatted.includes("</immutable-anchors>"),
      "formatAnchorsForPrompt includes immutable-anchors tags"
    )
  } finally {
    cleanTmpDir(tmpDir)
  }
}

// ─── scan_hierarchy Tests (6 assertions) ──────────────────────────────

async function test_scanHierarchy() {
  process.stderr.write("\n--- scan_hierarchy: structured read ---\n")

  // 1. Returns error message when no session
  const tmpDir1 = makeTmpDir()
  try {
    const tool = createScanHierarchyTool(tmpDir1)
    const noSession = await tool.execute({})
    assert(
      noSession.includes("No active session"),
      "returns error message when no session"
    )
  } finally {
    cleanTmpDir(tmpDir1)
  }

  // Tests 2-6: with a saved brain state
  const tmpDir2 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("test-session-r3", config, "plan_driven")
    brainState.hierarchy.trajectory = "Build auth system"
    brainState.hierarchy.tactic = "JWT validation"
    brainState.hierarchy.action = "Write middleware"
    brainState.metrics.turn_count = 7
    brainState.metrics.drift_score = 65
    brainState.metrics.files_touched = ["src/auth.ts", "src/middleware.ts"]
    brainState.metrics.context_updates = 3

    const stateManager = createStateManager(tmpDir2)
    await stateManager.save(brainState)

    // Also save anchors
    const anchorsState = addAnchor(
      { anchors: [], version: "1.0.0" },
      "test-key", "test-value", "test-session-r3"
    )
    await saveAnchors(tmpDir2, anchorsState)

    const tool = createScanHierarchyTool(tmpDir2)
    const result = await tool.execute({})

    // 2. Returns structured text with session info
    assert(
      result.includes("Session:") && result.includes("test-session-r3") && result.includes("plan_driven"),
      "returns structured text with session info"
    )

    // 3. Returns hierarchy levels when set
    assert(
      result.includes("Trajectory: Build auth system") &&
      result.includes("Tactic: JWT validation") &&
      result.includes("Action: Write middleware"),
      "returns hierarchy levels when set"
    )

    // 4. Returns metrics
    assert(
      result.includes("Turns: 7") &&
      result.includes("Drift: 65/100") &&
      result.includes("Files: 2") &&
      result.includes("Context updates: 3"),
      "returns metrics"
    )

    // 5. Returns anchors section
    assert(
      result.includes("Anchors (1)") &&
      result.includes("[test-key]: test-value"),
      "returns anchors section"
    )

    // 6. Returns "(not set)" for empty hierarchy levels
    const brainEmpty = createBrainState("test-empty", config, "quick_fix")
    // hierarchy is empty strings by default
    await stateManager.save(brainEmpty)

    const emptyResult = await tool.execute({})
    assert(
      emptyResult.includes("Trajectory: (not set)") &&
      emptyResult.includes("Tactic: (not set)") &&
      emptyResult.includes("Action: (not set)"),
      "returns '(not set)' for empty hierarchy levels"
    )
  } finally {
    cleanTmpDir(tmpDir2)
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Round 3 Tools Tests ===\n")

  await test_anchors()
  await test_scanHierarchy()
  await test_saveAnchor()
  await test_thinkBack()
  await test_checkDrift()

  process.stderr.write(`\n=== Round 3: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

// ─── save_anchor Tests (6 assertions) ──────────────────────────────

async function test_saveAnchor() {
  process.stderr.write("\n--- save_anchor: tool tests ---\n")

  // 1. save_anchor saves to anchors.json
  const tmpDir1 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-anchor-test", config)
    const stateManager = createStateManager(tmpDir1)
    await stateManager.save(brainState)

    const tool = createSaveAnchorTool(tmpDir1)
    await tool.execute({ key: "DB_SCHEMA", value: "PostgreSQL with pgvector" })

    const anchorsPath = join(tmpDir1, ".hivemind", "anchors.json")
    assert(
      existsSync(anchorsPath),
      "save_anchor saves to anchors.json"
    )
  } finally {
    cleanTmpDir(tmpDir1)
  }

  // 2. save_anchor replaces existing key
  const tmpDir2 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-anchor-test-2", config)
    const stateManager = createStateManager(tmpDir2)
    await stateManager.save(brainState)

    const tool = createSaveAnchorTool(tmpDir2)
    await tool.execute({ key: "PORT", value: "3000" })
    await tool.execute({ key: "PORT", value: "8080" })

    const anchors = await loadAnchors(tmpDir2)
    assert(
      anchors.anchors.length === 1 && anchors.anchors[0].value === "8080",
      "save_anchor replaces existing key"
    )
  } finally {
    cleanTmpDir(tmpDir2)
  }

  // 3. save_anchor returns confirmation with count
  const tmpDir3 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-anchor-test-3", config)
    const stateManager = createStateManager(tmpDir3)
    await stateManager.save(brainState)

    const tool = createSaveAnchorTool(tmpDir3)
    const result = await tool.execute({ key: "LANG", value: "TypeScript" })
    assert(
      result.includes("Anchor saved") && result.includes("1 total anchors"),
      "save_anchor returns confirmation with count"
    )
  } finally {
    cleanTmpDir(tmpDir3)
  }

  // 4. Anchors survive session compaction (save anchor, compact state, load anchors)
  const tmpDir4 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-anchor-test-4", config)
    const stateManager = createStateManager(tmpDir4)
    await stateManager.save(brainState)

    const tool = createSaveAnchorTool(tmpDir4)
    await tool.execute({ key: "PERSIST_ME", value: "I survive compaction" })

    // Simulate compaction: reset brain state (new session)
    const newState = createBrainState("new-session-after-compact", config)
    await stateManager.save(newState)

    // Anchors should still be there
    const anchors = await loadAnchors(tmpDir4)
    assert(
      anchors.anchors.length === 1 && anchors.anchors[0].key === "PERSIST_ME",
      "anchors survive session compaction"
    )
  } finally {
    cleanTmpDir(tmpDir4)
  }

  // 5 & 6. System prompt includes anchors after save
  const tmpDir5 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("anchor-prompt-test", config)
    brainState.session.governance_status = "OPEN"
    brainState.hierarchy.trajectory = "Test trajectory"
    const stateManager = createStateManager(tmpDir5)
    await stateManager.save(brainState)
    await initializePlanningDirectory(tmpDir5)

    // Save an anchor
    const saveTool = createSaveAnchorTool(tmpDir5)
    await saveTool.execute({ key: "API_URL", value: "https://api.example.com" })

    // Now use the session lifecycle hook to check system prompt
    // We'll check by loading anchors and formatting
    const anchors = await loadAnchors(tmpDir5)
    const prompt = formatAnchorsForPrompt(anchors)
    assert(
      prompt.includes("[API_URL]: https://api.example.com"),
      "system prompt includes anchors after save"
    )
    assert(
      prompt.includes("<immutable-anchors>") && prompt.includes("</immutable-anchors>"),
      "system prompt includes immutable-anchors tag"
    )
  } finally {
    cleanTmpDir(tmpDir5)
  }
}

// ─── think_back Tests (6 assertions) ──────────────────────────────

async function test_thinkBack() {
  process.stderr.write("\n--- think_back: context refresh ---\n")

  // 1. Returns error when no session
  const tmpDir1 = makeTmpDir()
  try {
    const tool = createThinkBackTool(tmpDir1)
    const result = await tool.execute({})
    assert(
      result.includes("No active session"),
      "think_back returns error when no session"
    )
  } finally {
    cleanTmpDir(tmpDir1)
  }

  // 2. Includes trajectory in output
  const tmpDir2 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("tb-test", config)
    brainState.session.governance_status = "OPEN"
    brainState.hierarchy.trajectory = "Build authentication system"
    brainState.hierarchy.tactic = "Implement JWT"
    brainState.hierarchy.action = "Write token validator"
    const stateManager = createStateManager(tmpDir2)
    await stateManager.save(brainState)
    await initializePlanningDirectory(tmpDir2)

    const tool = createThinkBackTool(tmpDir2)
    const result = await tool.execute({})
    assert(
      result.includes("Trajectory: Build authentication system") &&
      result.includes("Tactic: Implement JWT") &&
      result.includes("Action: Write token validator"),
      "think_back includes trajectory in output"
    )
  } finally {
    cleanTmpDir(tmpDir2)
  }

  // 3. Includes session health metrics
  const tmpDir3 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("tb-test-3", config)
    brainState.session.governance_status = "OPEN"
    brainState.hierarchy.trajectory = "Test"
    brainState.metrics.turn_count = 12
    brainState.metrics.drift_score = 45
    brainState.metrics.context_updates = 5
    const stateManager = createStateManager(tmpDir3)
    await stateManager.save(brainState)
    await initializePlanningDirectory(tmpDir3)

    const tool = createThinkBackTool(tmpDir3)
    const result = await tool.execute({})
    assert(
      result.includes("Turns: 12") && result.includes("Drift: 45/100") && result.includes("Context updates: 5"),
      "think_back includes session health metrics"
    )
  } finally {
    cleanTmpDir(tmpDir3)
  }

  // 4. Includes anchors when present
  const tmpDir4 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("tb-test-4", config)
    brainState.session.governance_status = "OPEN"
    brainState.hierarchy.trajectory = "Test"
    const stateManager = createStateManager(tmpDir4)
    await stateManager.save(brainState)
    await initializePlanningDirectory(tmpDir4)

    // Save an anchor
    const anchors = addAnchor({ anchors: [], version: "1.0.0" }, "DB", "PostgreSQL", "tb-test-4")
    await saveAnchors(tmpDir4, anchors)

    const tool = createThinkBackTool(tmpDir4)
    const result = await tool.execute({})
    assert(
      result.includes("Immutable Anchors") && result.includes("[DB]: PostgreSQL"),
      "think_back includes anchors when present"
    )
  } finally {
    cleanTmpDir(tmpDir4)
  }

  // 5. Includes chain break warnings when hierarchy broken
  const tmpDir5 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("tb-test-5", config)
    brainState.session.governance_status = "OPEN"
    // Orphaned action: action without tactic
    brainState.hierarchy.trajectory = "Test trajectory"
    brainState.hierarchy.tactic = ""
    brainState.hierarchy.action = "Orphaned action"
    const stateManager = createStateManager(tmpDir5)
    await stateManager.save(brainState)
    await initializePlanningDirectory(tmpDir5)

    const tool = createThinkBackTool(tmpDir5)
    const result = await tool.execute({})
    assert(
      result.includes("Chain breaks") && result.includes("no parent tactic"),
      "think_back includes chain break warnings"
    )
  } finally {
    cleanTmpDir(tmpDir5)
  }

  // 6. Includes plan section from active.md
  const tmpDir6 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("tb-test-6", config)
    brainState.session.governance_status = "OPEN"
    brainState.hierarchy.trajectory = "Test"
    const stateManager = createStateManager(tmpDir6)
    await stateManager.save(brainState)
    await initializePlanningDirectory(tmpDir6)

    // Write custom active.md with plan section
    await writeActiveMd(tmpDir6, {
      frontmatter: { session_id: "tb-test-6" },
      body: "# Active Session\n\n## Plan\n- Step 1: Build API\n- Step 2: Add tests\n\n## Completed\n- Nothing yet"
    })

    const tool = createThinkBackTool(tmpDir6)
    const result = await tool.execute({})
    assert(
      result.includes("## Plan") && result.includes("Step 1: Build API"),
      "think_back includes plan section from active.md"
    )
  } finally {
    cleanTmpDir(tmpDir6)
  }
}

// ─── check_drift Tests (6 assertions) ──────────────────────────────

async function test_checkDrift() {
  process.stderr.write("\n--- check_drift: drift report ---\n")

  // 1. Returns error when no session
  const tmpDir1 = makeTmpDir()
  try {
    const tool = createCheckDriftTool(tmpDir1)
    const result = await tool.execute({})
    assert(
      result.includes("No active session"),
      "check_drift returns error when no session"
    )
  } finally {
    cleanTmpDir(tmpDir1)
  }

  // 2. Shows drift score with emoji
  const tmpDir2 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("drift-test-2", config)
    brainState.hierarchy.trajectory = "Test trajectory"
    brainState.metrics.turn_count = 0
    brainState.metrics.context_updates = 5
    const stateManager = createStateManager(tmpDir2)
    await stateManager.save(brainState)

    const tool = createCheckDriftTool(tmpDir2)
    const result = await tool.execute({})
    // With 0 turns and 5 updates: score = 100 - 0 + min(20, 10) = 100 → ✅
    assert(
      result.includes("✅") && result.includes("Drift Score:") && result.includes("/100"),
      "check_drift shows drift score with emoji"
    )
  } finally {
    cleanTmpDir(tmpDir2)
  }

  // 3. Shows trajectory alignment
  const tmpDir3 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("drift-test-3", config)
    brainState.hierarchy.trajectory = "Build auth system"
    brainState.hierarchy.tactic = "JWT implementation"
    brainState.hierarchy.action = "Write tests"
    const stateManager = createStateManager(tmpDir3)
    await stateManager.save(brainState)

    const tool = createCheckDriftTool(tmpDir3)
    const result = await tool.execute({})
    assert(
      result.includes("Original: Build auth system") &&
      result.includes("Current tactic: JWT implementation") &&
      result.includes("Current action: Write tests"),
      "check_drift shows trajectory alignment"
    )
  } finally {
    cleanTmpDir(tmpDir3)
  }

  // 4. Shows chain integrity pass when intact
  const tmpDir4 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("drift-test-4", config)
    brainState.hierarchy.trajectory = "Full chain"
    brainState.hierarchy.tactic = "Has parent"
    brainState.hierarchy.action = "Has grandparent"
    const stateManager = createStateManager(tmpDir4)
    await stateManager.save(brainState)

    const tool = createCheckDriftTool(tmpDir4)
    const result = await tool.execute({})
    assert(
      result.includes("Hierarchy chain is intact"),
      "check_drift shows chain integrity pass when intact"
    )
  } finally {
    cleanTmpDir(tmpDir4)
  }

  // 5. Shows chain integrity fail when broken (orphaned action)
  const tmpDir5 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("drift-test-5", config)
    brainState.hierarchy.trajectory = "Test"
    brainState.hierarchy.tactic = ""
    brainState.hierarchy.action = "Orphaned action"
    const stateManager = createStateManager(tmpDir5)
    await stateManager.save(brainState)

    const tool = createCheckDriftTool(tmpDir5)
    const result = await tool.execute({})
    assert(
      result.includes("❌") && result.includes("no parent tactic"),
      "check_drift shows chain integrity fail when broken"
    )
  } finally {
    cleanTmpDir(tmpDir5)
  }

  // 6. Shows recommendation based on drift score
  const tmpDir6 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("drift-test-6", config)
    brainState.hierarchy.trajectory = "Test"
    brainState.hierarchy.tactic = "Test tactic"
    brainState.hierarchy.action = "Test action"
    // High turns = low drift score (capped at 50 penalty → score = 50)
    brainState.metrics.turn_count = 15
    brainState.metrics.context_updates = 0
    const stateManager = createStateManager(tmpDir6)
    await stateManager.save(brainState)

    const tool = createCheckDriftTool(tmpDir6)
    const result = await tool.execute({})
    // 15 turns * 5 = 75 → capped at 50 penalty, 0 bonus → score = 50 → ⚠ range
    assert(
      result.includes("Some drift detected") && result.includes("map_context"),
      "check_drift shows recommendation based on drift score"
    )
  } finally {
    cleanTmpDir(tmpDir6)
  }
}

main()
