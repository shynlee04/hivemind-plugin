/**
 * Soft Governance Hook tests — tool.execute.after tracking & compliance
 *
 * Tests the createSoftGovernanceHook which handles:
 *   - Turn count increment on every tool call
 *   - Drift detection (high turns + low drift score)
 *   - Violation detection (write/edit in LOCKED strict session)
 *   - Tool health tracking (total, successful, health score)
 *   - Chain break logging
 *   - Commit suggestion tracking
 *   - Long session detection
 *   - Error resilience (never crashes)
 */

import { createSoftGovernanceHook } from "../src/hooks/soft-governance.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createConfig } from "../src/schemas/config.js"
import {
  createBrainState,
  generateSessionId,
  unlockSession,
  incrementTurnCount,
  updateHierarchy,
  addFileTouched,
  type BrainState,
} from "../src/schemas/brain-state.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { noopLogger, type Logger } from "../src/lib/logging.js"
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
  tmpDir = await mkdtemp(join(tmpdir(), "hm-softgov-"))
  await initializePlanningDirectory(tmpDir)
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}

function makeInput(tool: string) {
  return { tool, sessionID: "test-session", callID: "call-1" }
}

function makeOutput() {
  return { title: "", output: "", metadata: {} }
}

// ─── Collecting logger for assertions ────────────────────────────────

function createCollectingLogger(): Logger & { warnings: string[]; errors: string[]; debugs: string[] } {
  const warnings: string[] = []
  const errors: string[] = []
  const debugs: string[] = []
  return {
    warnings,
    errors,
    debugs,
    debug: async (msg: string) => { debugs.push(msg) },
    info: async () => {},
    warn: async (msg: string) => { warnings.push(msg) },
    error: async (msg: string) => { errors.push(msg) },
  }
}

// ─── Turn count increment ────────────────────────────────────────────

async function test_increments_turn_count() {
  process.stderr.write("\n--- soft-governance: increments turn count ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("read"), makeOutput())
  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("bash"), makeOutput())

  const updated = await sm.load()
  assert(updated !== null, "state exists after hook calls")
  assert(updated!.metrics.turn_count === 3, "turn count incremented to 3")

  await cleanup()
}

// ─── Tool health tracking ────────────────────────────────────────────

async function test_tracks_tool_health() {
  process.stderr.write("\n--- soft-governance: tracks tool health ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("edit"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.total_tool_calls === 2, "total tool calls is 2")
  assert(updated!.metrics.successful_tool_calls === 2, "successful tool calls is 2")
  assert(updated!.metrics.auto_health_score === 100, "health score is 100%")

  await cleanup()
}

// ─── Drift detection ─────────────────────────────────────────────────

async function test_drift_detection() {
  process.stderr.write("\n--- soft-governance: drift warning on high turns ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Pre-set high turn count and low drift to trigger warning
  state = {
    ...state,
    metrics: {
      ...state.metrics,
      turn_count: 4, // Will become 5 after hook increments
      drift_score: 40, // Below 50 threshold
    },
  }
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("Drift detected")),
    "drift warning logged when turns >= 5 and drift < 50"
  )

  await cleanup()
}

async function test_no_drift_warning_when_healthy() {
  process.stderr.write("\n--- soft-governance: no drift warning when healthy ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    !log.warnings.some(w => w.includes("Drift detected")),
    "no drift warning when turns low and drift high"
  )

  await cleanup()
}

// ─── Violation detection (strict mode) ───────────────────────────────

async function test_strict_violation_on_locked_write() {
  process.stderr.write("\n--- soft-governance: strict violation on LOCKED write ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  // strict mode starts LOCKED by default
  const state = createBrainState(generateSessionId(), config)
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 1, "violation count incremented for write in LOCKED")
  assert(
    log.warnings.some(w => w.includes("Governance violation")),
    "violation warning logged"
  )

  await cleanup()
}

async function test_strict_no_violation_on_locked_read() {
  process.stderr.write("\n--- soft-governance: no violation on LOCKED read ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config)
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 0, "no violation for read in LOCKED strict")

  await cleanup()
}

async function test_strict_no_violation_when_unlocked() {
  process.stderr.write("\n--- soft-governance: no violation when OPEN ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 0, "no violation for write in OPEN strict")

  await cleanup()
}

async function test_assisted_no_violation() {
  process.stderr.write("\n--- soft-governance: assisted mode never tracks violations ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  // Even without unlocking, assisted mode should not track violations
  const state = createBrainState(generateSessionId(), config)
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 0, "assisted mode does not track violations")

  await cleanup()
}

// ─── Chain break logging ─────────────────────────────────────────────

async function test_chain_break_logging() {
  process.stderr.write("\n--- soft-governance: chain break warning logged ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Set action without tactic to create a chain break
  state = updateHierarchy(state, { action: "Do something" })
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("Chain breaks")),
    "chain break warning logged when action has no parent tactic"
  )

  await cleanup()
}

async function test_no_chain_break_when_hierarchy_intact() {
  process.stderr.write("\n--- soft-governance: no chain break when hierarchy intact ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  state = updateHierarchy(state, { trajectory: "Build auth", tactic: "JWT setup", action: "Install deps" })
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    !log.warnings.some(w => w.includes("Chain breaks")),
    "no chain break warning when hierarchy is complete"
  )

  await cleanup()
}

// ─── Commit suggestion tracking ──────────────────────────────────────

async function test_commit_suggestion_tracking() {
  process.stderr.write("\n--- soft-governance: commit suggestion turn tracked ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", commit_suggestion_threshold: 2 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Add enough files to trigger commit suggestion
  state = addFileTouched(state, "file1.ts")
  state = addFileTouched(state, "file2.ts")
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(
    updated!.last_commit_suggestion_turn > 0,
    "last_commit_suggestion_turn updated when threshold met"
  )

  await cleanup()
}

// ─── Long session detection ──────────────────────────────────────────

async function test_long_session_warning() {
  process.stderr.write("\n--- soft-governance: long session warning ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", auto_compact_on_turns: 5 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  let state = unlockSession(createBrainState(generateSessionId(), config))
  // Pre-set turn count just below threshold, will be incremented to threshold
  state = {
    ...state,
    metrics: {
      ...state.metrics,
      turn_count: 4,
    },
  }
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("compact_session")),
    "long session warning suggests compact_session at threshold"
  )

  await cleanup()
}

async function test_no_long_session_warning_below_threshold() {
  process.stderr.write("\n--- soft-governance: no long session warning below threshold ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", auto_compact_on_turns: 20 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("read"), makeOutput())

  assert(
    !log.warnings.some(w => w.includes("compact_session")),
    "no long session warning when below threshold"
  )

  await cleanup()
}

// ─── Error resilience ────────────────────────────────────────────────

async function test_no_crash_without_state() {
  process.stderr.write("\n--- soft-governance: does not crash without brain state ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  // Do NOT save brain state

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  // Should not throw
  await hook(makeInput("write"), makeOutput())

  assert(
    log.warnings.some(w => w.includes("no brain state")),
    "warns about missing brain state"
  )
  assert(true, "hook did not crash without brain state")

  await cleanup()
}

async function test_no_crash_without_sessionID() {
  process.stderr.write("\n--- soft-governance: skips when no sessionID ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  // Should not throw — early return when no sessionID
  await hook({ tool: "write", sessionID: "", callID: "call-1" }, makeOutput())

  assert(true, "hook skips gracefully when sessionID is empty")

  await cleanup()
}

// ─── Last activity timestamp ─────────────────────────────────────────

async function test_last_activity_updated() {
  process.stderr.write("\n--- soft-governance: last_activity timestamp updated ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  const originalActivity = state.session.last_activity
  await sm.save(state)

  // Small delay to ensure timestamp differs
  await new Promise(r => setTimeout(r, 10))

  const hook = createSoftGovernanceHook(noopLogger, dir, config)
  await hook(makeInput("read"), makeOutput())

  const updated = await sm.load()
  assert(
    updated!.session.last_activity >= originalActivity,
    "last_activity timestamp updated"
  )

  await cleanup()
}

// ─── Multiple violations accumulate ──────────────────────────────────

async function test_multiple_violations_accumulate() {
  process.stderr.write("\n--- soft-governance: multiple violations accumulate ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = createBrainState(generateSessionId(), config) // LOCKED
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("edit"), makeOutput())
  await hook(makeInput("write"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.violation_count === 3, "3 violations accumulated for 3 write/edit calls in LOCKED")

  await cleanup()
}

// ─── Debug logging ───────────────────────────────────────────────────

async function test_debug_logging() {
  process.stderr.write("\n--- soft-governance: debug logging output ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const log = createCollectingLogger()
  const hook = createSoftGovernanceHook(log, dir, config)

  await hook(makeInput("write"), makeOutput())

  assert(
    log.debugs.some(d => d.includes("Soft governance: tracked write")),
    "debug log includes tool name"
  )
  assert(
    log.debugs.some(d => d.includes("turns=")),
    "debug log includes turn count"
  )

  await cleanup()
}

// ─── Permissive mode ─────────────────────────────────────────────────

async function test_permissive_still_tracks() {
  process.stderr.write("\n--- soft-governance: permissive mode still tracks ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "permissive" })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createSoftGovernanceHook(noopLogger, dir, config)

  await hook(makeInput("write"), makeOutput())
  await hook(makeInput("edit"), makeOutput())

  const updated = await sm.load()
  assert(updated!.metrics.turn_count === 2, "permissive mode still increments turns")
  assert(updated!.metrics.total_tool_calls === 2, "permissive mode still tracks tool calls")
  assert(updated!.metrics.violation_count === 0, "permissive mode does not track violations")

  await cleanup()
}

// ─── Runner ──────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Soft Governance Tests ===\n")

  await test_increments_turn_count()
  await test_tracks_tool_health()
  await test_drift_detection()
  await test_no_drift_warning_when_healthy()
  await test_strict_violation_on_locked_write()
  await test_strict_no_violation_on_locked_read()
  await test_strict_no_violation_when_unlocked()
  await test_assisted_no_violation()
  await test_chain_break_logging()
  await test_no_chain_break_when_hierarchy_intact()
  await test_commit_suggestion_tracking()
  await test_long_session_warning()
  await test_no_long_session_warning_below_threshold()
  await test_no_crash_without_state()
  await test_no_crash_without_sessionID()
  await test_last_activity_updated()
  await test_multiple_violations_accumulate()
  await test_debug_logging()
  await test_permissive_still_tracks()

  process.stderr.write(`\n=== Soft Governance: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
