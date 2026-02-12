/**
 * Cycle Intelligence Tests — export_cycle tool + auto-capture + pending_failure_ack
 *
 * Tests organized in groups:
 *   Schema (8): CycleLogEntry, addCycleLogEntry, clearPendingFailureAck, MAX_CYCLE_LOG cap
 *   export_cycle tool (10): basic success/failure, tree update, mem save, ack clearing, error cases
 *   Auto-capture hook (8): Task detection, failure keyword scanning, non-task skip, log capping
 *   Prompt injection (4): pending_failure_ack warning, cleared after export_cycle
 *   map_context blocked clears ack (3): blocked status clears ack, non-blocked doesn't
 */

import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  createBrainState,
  addCycleLogEntry,
  clearPendingFailureAck,
  FAILURE_KEYWORDS,
  MAX_CYCLE_LOG,
  type BrainState,
  type CycleLogEntry,
} from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"
import { createExportCycleTool } from "../src/tools/export-cycle.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createMapContextTool } from "../src/tools/map-context.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createSoftGovernanceHook } from "../src/hooks/soft-governance.js"
import { createStateManager } from "../src/lib/persistence.js"
import { loadConfig } from "../src/lib/persistence.js"
import { loadMems } from "../src/lib/mems.js"
import { loadTree } from "../src/lib/hierarchy-tree.js"
import { initProject } from "../src/cli/init.js"
import { createLogger } from "../src/lib/logging.js"

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
  return mkdtempSync(join(tmpdir(), "hm-cycle-"))
}

function cleanTmpDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true })
  } catch { /* ignore */ }
}

// ─── Schema Unit Tests (8 assertions) ────────────────────────────────

async function test_schema() {
  process.stderr.write("\n--- schema: CycleLogEntry + helpers ---\n")

  const config = createConfig()
  const state = createBrainState("test-session", config)

  // 1. Initial state has empty cycle_log
  assert(
    Array.isArray(state.cycle_log) && state.cycle_log.length === 0,
    "initial cycle_log is empty array"
  )

  // 2. Initial state has pending_failure_ack = false
  assert(
    state.pending_failure_ack === false,
    "initial pending_failure_ack is false"
  )

  // 3. addCycleLogEntry with clean output → no failure
  const cleanState = addCycleLogEntry(state, "task", "All tests pass. Success.")
  assert(
    cleanState.cycle_log.length === 1 && cleanState.cycle_log[0].failure_detected === false,
    "addCycleLogEntry clean output → failure_detected = false"
  )
  assert(
    cleanState.pending_failure_ack === false,
    "addCycleLogEntry clean output → pending_failure_ack stays false"
  )

  // 4. addCycleLogEntry with failure keywords → failure detected
  const failState = addCycleLogEntry(state, "task", "The build failed with error code 1")
  assert(
    failState.cycle_log.length === 1 && failState.cycle_log[0].failure_detected === true,
    "addCycleLogEntry failure output → failure_detected = true"
  )
  assert(
    failState.pending_failure_ack === true,
    "addCycleLogEntry failure output → pending_failure_ack = true"
  )
  assert(
    failState.cycle_log[0].failure_keywords.includes("failed") &&
    failState.cycle_log[0].failure_keywords.includes("error"),
    "addCycleLogEntry captures specific failure keywords"
  )

  // 5. clearPendingFailureAck
  const clearedState = clearPendingFailureAck(failState)
  assert(
    clearedState.pending_failure_ack === false,
    "clearPendingFailureAck sets flag to false"
  )
}

// ─── Schema: MAX_CYCLE_LOG cap (3 assertions) ───────────────────────

async function test_cycle_log_cap() {
  process.stderr.write("\n--- schema: cycle_log cap at MAX_CYCLE_LOG ---\n")

  const config = createConfig()
  let state = createBrainState("test-session", config)

  // Add MAX_CYCLE_LOG + 5 entries
  for (let i = 0; i < MAX_CYCLE_LOG + 5; i++) {
    state = addCycleLogEntry(state, "task", `Output ${i}`)
  }

  assert(
    state.cycle_log.length === MAX_CYCLE_LOG,
    `cycle_log capped at ${MAX_CYCLE_LOG}`
  )
  assert(
    state.cycle_log[0].output_excerpt === `Output 5`,
    "oldest entries dropped (FIFO)"
  )
  assert(
    state.cycle_log[state.cycle_log.length - 1].output_excerpt === `Output ${MAX_CYCLE_LOG + 4}`,
    "newest entry is last"
  )
}

// ─── export_cycle tool (10 assertions) ──────────────────────────────

async function test_export_cycle_tool() {
  process.stderr.write("\n--- export_cycle: tool tests ---\n")

  const tmpDir = makeTmpDir()
  try {
    await initProject(tmpDir, { governanceMode: "assisted", language: "en", silent: true })

    // Set up a session with hierarchy
    const declareIntent = createDeclareIntentTool(tmpDir)
    await declareIntent.execute({ mode: "plan_driven", focus: "Build auth system" })

    const mapContext = createMapContextTool(tmpDir)
    await mapContext.execute({ level: "tactic", content: "JWT validation" })
    await mapContext.execute({ level: "action", content: "Write middleware tests" })

    const exportCycle = createExportCycleTool(tmpDir)

    // Force flat hierarchy to drift away from tree to validate projection sync
    const stateManager = createStateManager(tmpDir)
    let stateBefore = await stateManager.load()
    stateBefore = {
      ...stateBefore!,
      hierarchy: {
        ...stateBefore!.hierarchy,
        action: "stale-flat-action",
      },
    }
    await stateManager.save(stateBefore)

    // 1. Empty findings → error
    const emptyResult = await exportCycle.execute({ outcome: "success", findings: "" })
    assert(
      (emptyResult as string).includes("ERROR"),
      "empty findings returns error"
    )

    // 2. Success outcome
    const successResult = await exportCycle.execute(
      { outcome: "success", findings: "Tests all pass, middleware works correctly" }
    )
    assert(
      (successResult as string).includes("[success]"),
      "success result includes outcome"
    )

    // 3. Tree was updated (action should be complete)
    const tree = await loadTree(tmpDir)
    // The cursor was at the action node, which should now be marked complete
    assert(
      tree.root !== null,
      "tree still has root after export_cycle"
    )

    const stateAfterSuccess = await stateManager.load()
    assert(
      stateAfterSuccess!.hierarchy.action === "Write middleware tests",
      "export_cycle syncs flat hierarchy projection from tree"
    )

    // 4. Mem was saved with cycle-intel shelf
    const memsState = await loadMems(tmpDir)
    const cycleIntelMems = memsState.mems.filter(m => m.shelf === "cycle-intel")
    assert(
      cycleIntelMems.length >= 1,
      "mem saved to cycle-intel shelf"
    )
    assert(
      cycleIntelMems.some(m => m.content.includes("[SUCCESS]")),
      "mem content includes [SUCCESS] tag"
    )
    assert(
      cycleIntelMems.some(m => m.tags.includes("cycle-result")),
      "mem has cycle-result tag"
    )

    // 5. Failure outcome with pending_failure_ack
    // First, set pending_failure_ack manually
    let state = await stateManager.load()
    state = { ...state!, pending_failure_ack: true }
    await stateManager.save(state!)

    const failResult = await exportCycle.execute(
      { outcome: "failure", findings: "Build script crashed on imports" }
    )
    assert(
      (failResult as string).includes("[failure]"),
      "failure result includes outcome"
    )
    assert(
      (failResult as string).includes("Failure acknowledged"),
      "failure result includes ack note when pending_failure_ack was set"
    )

    // 6. pending_failure_ack cleared after export_cycle
    const stateAfter = await stateManager.load()
    assert(
      stateAfter!.pending_failure_ack === false,
      "pending_failure_ack cleared after export_cycle"
    )

    // 7. No active session → error
    // Reset state to simulate no session
    const tmpDir2 = makeTmpDir()
    try {
      const exportCycle2 = createExportCycleTool(tmpDir2)
      const noSessionResult = await exportCycle2.execute(
        { outcome: "success", findings: "test" }
      )
      assert(
        (noSessionResult as string).includes("ERROR"),
        "no session returns error"
      )
    } finally {
      cleanTmpDir(tmpDir2)
    }
  } finally {
    cleanTmpDir(tmpDir)
  }
}

// ─── Auto-capture hook (8 assertions) ───────────────────────────────

async function test_auto_capture_hook() {
  process.stderr.write("\n--- auto-capture: soft-governance hook ---\n")

  const tmpDir = makeTmpDir()
  try {
    await initProject(tmpDir, { governanceMode: "assisted", language: "en", silent: true })

    const log = await createLogger(tmpDir, "test")
    const config = await loadConfig(tmpDir)
    const softGovernanceHook = createSoftGovernanceHook(log, tmpDir, config)

    // Initialize session
    const declareIntent = createDeclareIntentTool(tmpDir)
    await declareIntent.execute({ mode: "plan_driven", focus: "Test auto-capture" })

    const stateManager = createStateManager(tmpDir)

    // 1. Non-task tool does NOT add to cycle_log
    await softGovernanceHook(
      { tool: "read", sessionID: "test", callID: "1" },
      { title: "Read", output: "file contents here", metadata: {} }
    )
    let state = await stateManager.load()
    assert(
      (state!.cycle_log ?? []).length === 0,
      "non-task tool does not add to cycle_log"
    )

    // 2. Task tool DOES add to cycle_log
    await softGovernanceHook(
      { tool: "task", sessionID: "test", callID: "2" },
      { title: "Task", output: "All tests pass. Implementation complete.", metadata: {} }
    )
    state = await stateManager.load()
    assert(
      (state!.cycle_log ?? []).length === 1,
      "task tool adds to cycle_log"
    )
    assert(
      state!.cycle_log[0].output_excerpt.includes("All tests pass"),
      "cycle_log captures output excerpt"
    )
    assert(
      state!.cycle_log[0].failure_detected === false,
      "clean task output → no failure detected"
    )

    // 3. Task tool with failure keywords
    await softGovernanceHook(
      { tool: "task", sessionID: "test", callID: "3" },
      { title: "Task", output: "The operation failed with error: module not found", metadata: {} }
    )
    state = await stateManager.load()
    assert(
      (state!.cycle_log ?? []).length === 2,
      "second task added to cycle_log"
    )
    assert(
      state!.cycle_log[1].failure_detected === true,
      "failure keywords in task output → failure_detected = true"
    )
    assert(
      state!.pending_failure_ack === true,
      "failure in task → pending_failure_ack = true"
    )

    // 4. Output truncated to 500 chars
    const longOutput = "x".repeat(1000)
    await softGovernanceHook(
      { tool: "task", sessionID: "test", callID: "4" },
      { title: "Task", output: longOutput, metadata: {} }
    )
    state = await stateManager.load()
    assert(
      state!.cycle_log[2].output_excerpt.length === 500,
      "output_excerpt truncated to 500 chars"
    )
  } finally {
    cleanTmpDir(tmpDir)
  }
}

// ─── Prompt injection (4 assertions) ────────────────────────────────

async function test_prompt_injection() {
  process.stderr.write("\n--- prompt injection: pending_failure_ack warning ---\n")

  const tmpDir = makeTmpDir()
  try {
    await initProject(tmpDir, { governanceMode: "assisted", language: "en", silent: true })

    const log = await createLogger(tmpDir, "test")
    const config = await loadConfig(tmpDir)
    const lifecycleHook = createSessionLifecycleHook(log, tmpDir, config)

    // Initialize session
    const declareIntent = createDeclareIntentTool(tmpDir)
    await declareIntent.execute({ mode: "plan_driven", focus: "Test prompt injection" })

    // 1. Normal state → no failure warning
    const normalOutput: { system: string[] } = { system: [] }
    await lifecycleHook({ sessionID: "test" }, normalOutput)
    const normalPrompt = normalOutput.system.join("\n")
    assert(
      !normalPrompt.includes("SUBAGENT REPORTED FAILURE"),
      "no failure warning when pending_failure_ack is false"
    )

    // 2. Set pending_failure_ack → warning appears
    const stateManager = createStateManager(tmpDir)
    let state = await stateManager.load()
    state = { ...state!, pending_failure_ack: true }
    await stateManager.save(state!)

    const failureOutput: { system: string[] } = { system: [] }
    await lifecycleHook({ sessionID: "test" }, failureOutput)
    const failurePrompt = failureOutput.system.join("\n")
    assert(
      failurePrompt.includes("SUBAGENT REPORTED FAILURE"),
      "failure warning shown when pending_failure_ack is true"
    )
    assert(
      failurePrompt.includes("export_cycle"),
      "failure warning mentions export_cycle tool"
    )

    // 3. Clear ack → warning gone
    state = await stateManager.load()
    state = clearPendingFailureAck(state!)
    await stateManager.save(state!)

    const clearedOutput: { system: string[] } = { system: [] }
    await lifecycleHook({ sessionID: "test" }, clearedOutput)
    const clearedPrompt = clearedOutput.system.join("\n")
    assert(
      !clearedPrompt.includes("SUBAGENT REPORTED FAILURE"),
      "no failure warning after clearPendingFailureAck"
    )
  } finally {
    cleanTmpDir(tmpDir)
  }
}

// ─── map_context blocked clears ack (3 assertions) ──────────────────

async function test_map_context_clears_ack() {
  process.stderr.write("\n--- map_context: blocked status clears pending_failure_ack ---\n")

  const tmpDir = makeTmpDir()
  try {
    await initProject(tmpDir, { governanceMode: "assisted", language: "en", silent: true })

    const declareIntent = createDeclareIntentTool(tmpDir)
    await declareIntent.execute({ mode: "plan_driven", focus: "Test ack clearing" })

    const stateManager = createStateManager(tmpDir)
    const mapContext = createMapContextTool(tmpDir)

    // Set pending_failure_ack
    let state = await stateManager.load()
    state = { ...state!, pending_failure_ack: true }
    await stateManager.save(state!)

    // 1. map_context with non-blocked status does NOT clear ack
    await mapContext.execute(
      { level: "tactic", content: "Keep working" }
    )
    state = await stateManager.load()
    assert(
      state!.pending_failure_ack === true,
      "non-blocked map_context does not clear pending_failure_ack"
    )

    // 2. map_context with blocked status DOES clear ack
    await mapContext.execute(
      { level: "action", content: "Build script broken", status: "blocked" }
    )
    state = await stateManager.load()
    assert(
      state!.pending_failure_ack === false,
      "blocked map_context clears pending_failure_ack"
    )

    // 3. map_context with blocked when ack is already false → still false (no error)
    await mapContext.execute(
      { level: "action", content: "Another blocked item", status: "blocked" }
    )
    state = await stateManager.load()
    assert(
      state!.pending_failure_ack === false,
      "blocked map_context when ack already false → no error"
    )
  } finally {
    cleanTmpDir(tmpDir)
  }
}

// ─── Run all ─────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("# === Cycle Intelligence Tests ===\n")

  await test_schema()
  await test_cycle_log_cap()
  await test_export_cycle_tool()
  await test_auto_capture_hook()
  await test_prompt_injection()
  await test_map_context_clears_ack()

  process.stderr.write(
    `# === Cycle Intelligence: ${passed} passed, ${failed_} failed ===\n`
  )

  if (failed_ > 0) {
    process.exit(1)
  }
}

main()
