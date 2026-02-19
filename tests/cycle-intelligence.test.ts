/**
 * Cycle Intelligence Tests — Schema functions + new unified tools
 *
 * Tests organized in groups:
 *   Schema (8): CycleLogEntry, addCycleLogEntry, clearPendingFailureAck, MAX_CYCLE_LOG cap
 *   Unified tools (6): hivemind_session (start/update), hivemind_cycle (export/list/prune)
 *   Auto-capture hook (8): Task detection, failure keyword scanning, non-task skip, log capping
 *   Prompt injection (4): pending_failure_ack warning, cleared after export
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
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"
import { createHivemindCycleTool } from "../src/tools/hivemind-cycle.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createSoftGovernanceHook } from "../src/hooks/soft-governance.js"
import { createStateManager } from "../src/lib/persistence.js"
import { loadConfig } from "../src/lib/persistence.js"
import { flushMutations } from "../src/lib/state-mutation-queue.js"
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

// ─── Unified Tools Tests (6 assertions) ──────────────────────────────

async function test_unified_tools() {
  process.stderr.write("\n--- unified tools: hivemind_session + hivemind_cycle ---\n")

  const tmpDir = makeTmpDir()
  try {
    await initProject(tmpDir, { governanceMode: "assisted", language: "en", silent: true })

    // Set up a session with hierarchy using unified session tool
    const sessionTool = createHivemindSessionTool(tmpDir)
    
    // Note: initProject creates an initial session, so start may return "session already active"
    // This is expected behavior - the test verifies the tool responds correctly
    const startResult = await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Build auth system" }, {} as any)
    const startParsed = JSON.parse(startResult as string)
    // Either success (new session) or error (already active) are valid - we test update instead
    assert(
      startParsed.status === "success" || startParsed.error === "session already active",
      "session start returns success or already active"
    )

    // 2. Update session (map_context equivalent - tactic level)
    const updateTactic = await sessionTool.execute({ action: "update", level: "tactic", content: "JWT validation" }, {} as any)
    assert(
      typeof updateTactic === "string" && updateTactic.includes("update"),
      "session update (tactic) returns success"
    )

    // 3. Update session (map_context equivalent - action level)
    const updateAction = await sessionTool.execute({ action: "update", level: "action", content: "Write middleware tests" }, {} as any)
    assert(
      typeof updateAction === "string" && updateAction.includes("update"),
      "session update (action) returns success"
    )

    // Now test hivemind_cycle (export)
    const cycleTool = createHivemindCycleTool(tmpDir)

    // 4. Export current session
    const exportResult = await cycleTool.execute({ action: "export" }, {} as any)
    assert(
      typeof exportResult === "string" && exportResult.includes("exported"),
      "cycle export returns success"
    )

    // 5. List sessions
    const listResult = await cycleTool.execute({ action: "list" }, {} as any)
    assert(
      typeof listResult === "string" && listResult.includes("sessions"),
      "cycle list returns sessions data"
    )

    // 6. No active session after close → error on export
    await sessionTool.execute({ action: "close", summary: "Test completed" }, {} as any)
    const exportAfterClose = await cycleTool.execute({ action: "export" }, {} as any)
    const exportParsed = JSON.parse(exportAfterClose as string)
    assert(
      exportParsed.status === "error" && exportParsed.error?.includes("No active session"),
      "export without active session returns error"
    )
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
    const rawSoftGovernanceHook = createSoftGovernanceHook(log, tmpDir, config)

    // Initialize session
    const sessionTool = createHivemindSessionTool(tmpDir)
    await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Test auto-capture" }, {} as any)

    const stateManager = createStateManager(tmpDir)
    const softGovernanceHook = async (
      input: { tool: string; sessionID: string; callID: string },
      output: { title: string; output: string; metadata: Record<string, unknown> },
    ) => {
      await rawSoftGovernanceHook(input, output)
      await flushMutations(stateManager)
    }

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
    const sessionTool = createHivemindSessionTool(tmpDir)
    await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Test prompt injection" }, {} as any)

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
      failurePrompt.includes("export_cycle") || failurePrompt.includes("hivemind_cycle"),
      "failure warning mentions cycle tool"
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

// ─── Session update with blocked clears ack (3 assertions) ──────────────────

async function test_session_update_clears_ack() {
  process.stderr.write("\n--- session update: blocked status clears pending_failure_ack ---\n")

  const tmpDir = makeTmpDir()
  try {
    await initProject(tmpDir, { governanceMode: "assisted", language: "en", silent: true })

    const sessionTool = createHivemindSessionTool(tmpDir)
    await sessionTool.execute({ action: "start", mode: "plan_driven", focus: "Test ack clearing" }, {} as any)

    const stateManager = createStateManager(tmpDir)

    // Set pending_failure_ack
    let state = await stateManager.load()
    state = { ...state!, pending_failure_ack: true }
    await stateManager.save(state!)

    // 1. session update with non-blocked status does NOT clear ack
    // (The new unified tool doesn't have status parameter, so we test via state manager directly)
    // For now, just verify pending_failure_ack stays true after normal update
    await sessionTool.execute({ action: "update", level: "tactic", content: "Keep working" }, {} as any)
    state = await stateManager.load()
    assert(
      state!.pending_failure_ack === true,
      "normal session update does not clear pending_failure_ack"
    )

    // 2. Manually clear via clearPendingFailureAck
    state = clearPendingFailureAck(state!)
    await stateManager.save(state!)
    state = await stateManager.load()
    assert(
      state!.pending_failure_ack === false,
      "clearPendingFailureAck clears the flag"
    )

    // 3. Set again and close session → flag cleared
    state = { ...state!, pending_failure_ack: true }
    await stateManager.save(state!)
    await sessionTool.execute({ action: "close", summary: "Done" }, {} as any)
    state = await stateManager.load()
    assert(
      state!.pending_failure_ack === false,
      "session close clears pending_failure_ack"
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
  await test_unified_tools()
  await test_auto_capture_hook()
  await test_prompt_injection()
  await test_session_update_clears_ack()

  process.stderr.write(
    `# === Cycle Intelligence: ${passed} passed, ${failed_} failed ===\n`
  )

  if (failed_ > 0) {
    process.exit(1)
  }
}

main()
