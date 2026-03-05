/**
 * Tool Gate tests — governance enforcement by mode
 */

import { createToolGateHookInternal } from "../src/hooks/tool-gate.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createConfig } from "../src/schemas/config.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { saveGraphTasks, saveTrajectory } from "../src/lib/graph-io.js"
import { noopLogger } from "../src/lib/logging.js"
import { clearMutationQueue, flushMutations, getPendingMutationCount } from "../src/lib/state-mutation-queue.js"
import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { randomUUID } from "crypto"

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
  clearMutationQueue()
  tmpDir = await mkdtemp(join(tmpdir(), "hm-test-"))
  await initializePlanningDirectory(tmpDir)
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    clearMutationQueue()
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}

// ─── strict mode tests ──────────────────────────────────────────────

async function test_strict_blocks_write_without_session() {
  process.stderr.write("\n--- tool-gate: strict blocks write without session ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  // Do NOT initialize brain state — simulate no session

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-1", tool: "write" })

  assert(result.allowed, "strict mode allows write without session (HC1: advisory only)")
  assert(result.warning !== undefined, "strict mode provides advisory warning")

  await cleanup()
}

async function test_strict_allows_exempt_tools() {
  process.stderr.write("\n--- tool-gate: strict allows exempt tools ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const hook = createToolGateHookInternal(noopLogger, dir, config)

  const readResult = await hook({ sessionID: "test-2", tool: "read" })
  assert(readResult.allowed, "read tool is exempt")

  const bashResult = await hook({ sessionID: "test-2", tool: "bash" })
  assert(bashResult.allowed, "bash tool is exempt")

  const declareResult = await hook({ sessionID: "test-2", tool: "declare_intent" })
  assert(declareResult.allowed, "declare_intent is exempt")

  await cleanup()
}

async function test_strict_allows_write_when_unlocked() {
  process.stderr.write("\n--- tool-gate: strict allows write when session unlocked ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-3", tool: "write" })

  assert(result.allowed, "write allowed when session is OPEN")

  await cleanup()
}

// ─── assisted mode tests ────────────────────────────────────────────

async function test_assisted_warns_but_allows() {
  process.stderr.write("\n--- tool-gate: assisted warns but allows ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-4", tool: "write" })

  assert(result.allowed, "assisted mode allows write")
  assert(result.warning !== undefined, "assisted mode provides warning")

  await cleanup()
}

// ─── permissive mode tests ──────────────────────────────────────────

async function test_permissive_allows_silently() {
  process.stderr.write("\n--- tool-gate: permissive allows silently ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "permissive" })
  await saveConfig(dir, config)

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-5", tool: "write" })

  assert(result.allowed, "permissive mode allows")
  assert(result.warning === undefined, "permissive mode no warning")

  await cleanup()
}

// ─── advisory-only persistence boundary ─────────────────────────────

async function test_tool_gate_does_not_queue_state_mutations_for_write_tools() {
  process.stderr.write("\n--- tool-gate: advisory-only write path ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", max_turns_before_warning: 3 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_confirmation = { ...state.first_turn_confirmation, required: false, confirmed: true }
  await sm.save(state)

  const hook = createToolGateHookInternal(noopLogger, dir, config)

  await hook({ sessionID: "test-drift", tool: "write" })
  await hook({ sessionID: "test-drift", tool: "edit" })

  assert(getPendingMutationCount() === 0, "tool-gate leaves mutation queue untouched")

  await flushMutations(sm)

  const updated = await sm.load()
  assert(updated !== null, "state exists after tool calls")
  assert(updated!.metrics.files_touched.length === 0, "tool-gate does not persist file touches")

  await cleanup()
}

// ─── entry gate ─────────────────────────────────────────────────────

async function test_entry_gate_suggests_scan() {
  process.stderr.write("\n--- tool-gate: entry gate suggests scan ---\n")
  const dir = await setup()
  // Ensure no hierarchy exists (default state of setup())

  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-scan", tool: "write" })

  assert(result.allowed, "entry gate is advisory")
  assert(result.warning !== undefined && result.warning.includes("hivemind-scan"), "suggests hivemind-scan when tree missing")

  await cleanup()
}

async function test_write_tool_warns_without_active_tasknode() {
  process.stderr.write("\n--- tool-gate: write tool warns without active tasknode ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_confirmation = { ...state.first_turn_confirmation, required: false, confirmed: true }
  await sm.save(state)

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-tasknode", tool: "write" })

  assert(result.allowed, "write remains allowed without active tasknode (HC1)")
  assert(result.warning?.includes("No active TaskNode found") === true, "warns when no active tasknode is bound")

  await cleanup()
}

async function test_write_tool_no_tasknode_warning_with_active_task() {
  process.stderr.write("\n--- tool-gate: write tool no tasknode warning when active ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const phaseId = randomUUID()
  const taskId = randomUUID()
  const now = new Date().toISOString()

  await saveGraphTasks(dir, {
    version: "1.0",
    tasks: [
      {
        id: taskId,
        parent_phase_id: phaseId,
        title: "Track write changes",
        status: "in_progress",
        file_locks: [],
        created_at: now,
        updated_at: now,
      },
    ],
  })

  await saveTrajectory(dir, {
    version: "1.0",
    trajectory: {
      id: randomUUID(),
      session_id: state.session.id,
      active_plan_id: null,
      active_phase_id: phaseId,
      active_task_ids: [taskId],
      intent: "TaskNode advisory suppression",
      created_at: now,
      updated_at: now,
    },
  })

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-tasknode-active", tool: "write" })

  assert(result.allowed, "write allowed with active tasknode")
  assert(result.warning?.includes("No active TaskNode found") !== true, "does not warn when active tasknode exists")

  await cleanup()
}

async function test_write_tool_warns_when_active_task_is_complete() {
  process.stderr.write("\n--- tool-gate: warns when referenced task is complete ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  state.first_turn_confirmation = { ...state.first_turn_confirmation, required: false, confirmed: true }
  await sm.save(state)

  const phaseId = randomUUID()
  const taskId = randomUUID()
  const now = new Date().toISOString()

  await saveGraphTasks(dir, {
    version: "1.0",
    tasks: [
      {
        id: taskId,
        parent_phase_id: phaseId,
        title: "Completed task should not suppress advisory",
        status: "complete",
        file_locks: [],
        created_at: now,
        updated_at: now,
      },
    ],
  })

  await saveTrajectory(dir, {
    version: "1.0",
    trajectory: {
      id: randomUUID(),
      session_id: state.session.id,
      active_plan_id: null,
      active_phase_id: phaseId,
      active_task_ids: [taskId],
      intent: "TaskNode advisory for complete task",
      created_at: now,
      updated_at: now,
    },
  })

  const hook = createToolGateHookInternal(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-tasknode-complete", tool: "write" })

  assert(result.allowed, "write remains allowed when task is complete")
  assert(result.warning?.includes("No active TaskNode found") === true, "warns when referenced task is not active")

  await cleanup()
}

// ─── Runner ─────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Tool Gate Tests ===\n")

  await test_strict_blocks_write_without_session()
  await test_strict_allows_exempt_tools()
  await test_strict_allows_write_when_unlocked()
  await test_assisted_warns_but_allows()
  await test_permissive_allows_silently()
  await test_tool_gate_does_not_queue_state_mutations_for_write_tools()
  await test_entry_gate_suggests_scan()
  await test_write_tool_warns_without_active_tasknode()
  await test_write_tool_no_tasknode_warning_with_active_task()
  await test_write_tool_warns_when_active_task_is_complete()

  process.stderr.write(`\n=== Tool Gate: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
