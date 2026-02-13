/**
 * Schema + brain state tests
 */

import {
  createBrainState,
  generateSessionId,
  isSessionLocked,
  unlockSession,
  lockSession,
  incrementTurnCount,
  resetTurnCount,
  updateHierarchy,
  addFileTouched,
  calculateDriftScore,
  shouldTriggerDriftWarning,
  migrateBrainState,
} from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"
import {
  createHierarchyState,
  updateHierarchyLevel,
  getLevelDepth,
} from "../src/schemas/hierarchy.js"

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

// ─── BrainState tests ───────────────────────────────────────────────

function test_brain_state_creation() {
  process.stderr.write("\n--- brain-state: creation ---\n")
  const config = createConfig()
  const state = createBrainState("test-session", config)

  assert(state.session.id === "test-session", "session id set")
  assert(state.session.mode === "plan_driven", "default mode is plan_driven")
  assert(state.session.governance_mode === "assisted", "inherits config mode")
  assert(state.session.governance_status === "OPEN", "assisted mode starts OPEN")
  assert(state.metrics.turn_count === 0, "starts with 0 turns")
  assert(state.metrics.drift_score === 100, "starts with 100 drift score")
  assert(state.version === "1.0.0", "version set")
}

function test_brain_state_strict_starts_locked() {
  process.stderr.write("\n--- brain-state: strict starts locked ---\n")
  const config = createConfig({ governance_mode: "strict" })
  const state = createBrainState("test-strict", config)

  assert(isSessionLocked(state), "strict mode starts LOCKED")
}

function test_brain_state_unlock() {
  process.stderr.write("\n--- brain-state: unlock ---\n")
  const config = createConfig({ governance_mode: "strict" })
  const state = createBrainState("test-unlock", config)

  assert(isSessionLocked(state), "starts locked")
  const unlocked = unlockSession(state)
  assert(!isSessionLocked(unlocked), "unlocked after unlockSession")
}

function test_brain_state_lock() {
  process.stderr.write("\n--- brain-state: lock ---\n")
  const config = createConfig()
  const state = createBrainState("test-lock", config)

  assert(!isSessionLocked(state), "starts unlocked")
  const locked = lockSession(state)
  assert(isSessionLocked(locked), "locked after lockSession")
}

function test_turn_counting() {
  process.stderr.write("\n--- brain-state: turn counting ---\n")
  const config = createConfig()
  let state = createBrainState("test-turns", config)

  state = incrementTurnCount(state)
  assert(state.metrics.turn_count === 1, "incremented to 1")

  state = incrementTurnCount(state)
  state = incrementTurnCount(state)
  assert(state.metrics.turn_count === 3, "incremented to 3")

  state = resetTurnCount(state)
  assert(state.metrics.turn_count === 0, "reset to 0")
}

function test_hierarchy_update() {
  process.stderr.write("\n--- brain-state: hierarchy update ---\n")
  const config = createConfig()
  let state = createBrainState("test-hier", config)

  state = updateHierarchy(state, { trajectory: "Build auth system" })
  assert(state.hierarchy.trajectory === "Build auth system", "trajectory set")
  assert(state.metrics.context_updates === 1, "context update counted")

  state = updateHierarchy(state, { tactic: "Implement JWT" })
  assert(state.hierarchy.tactic === "Implement JWT", "tactic set")
  assert(state.metrics.context_updates === 2, "context update counted again")
}

function test_file_tracking() {
  process.stderr.write("\n--- brain-state: file tracking ---\n")
  const config = createConfig()
  let state = createBrainState("test-files", config)

  state = addFileTouched(state, "src/auth.ts")
  assert(state.metrics.files_touched.length === 1, "1 file tracked")

  state = addFileTouched(state, "src/auth.ts")
  assert(state.metrics.files_touched.length === 1, "duplicate not added")

  state = addFileTouched(state, "src/login.ts")
  assert(state.metrics.files_touched.length === 2, "2 files tracked")
}

function test_drift_score() {
  process.stderr.write("\n--- brain-state: drift score ---\n")
  const config = createConfig()
  let state = createBrainState("test-drift", config)

  // Fresh state = 100
  assert(calculateDriftScore(state) === 100, "fresh state = 100")

  // After many turns with no context updates
  for (let i = 0; i < 10; i++) {
    state = incrementTurnCount(state)
  }
  const driftAfterTurns = calculateDriftScore(state)
  assert(driftAfterTurns < 100, "drift decreases with turns")

  // Context update boosts score
  state = updateHierarchy(state, { action: "Write tests" })
  const driftAfterUpdate = calculateDriftScore(state)
  assert(driftAfterUpdate > driftAfterTurns, "context update boosts drift score")
}

function test_drift_warning() {
  process.stderr.write("\n--- brain-state: drift warning ---\n")
  const config = createConfig()
  let state = createBrainState("test-warn", config)

  assert(!shouldTriggerDriftWarning(state, 5), "no warning at start")

  // Push past threshold with high turn count + low drift
  for (let i = 0; i < 15; i++) {
    state = incrementTurnCount(state)
  }
  state.metrics.drift_score = 30
  assert(shouldTriggerDriftWarning(state, 5), "warning triggered at high turns + low drift")
}

// ─── Hierarchy schema tests ─────────────────────────────────────────

function test_hierarchy_state() {
  process.stderr.write("\n--- hierarchy: state operations ---\n")
  let h = createHierarchyState()
  assert(h.trajectory === "", "empty trajectory")

  h = updateHierarchyLevel(h, "trajectory", "Build auth")
  assert(h.trajectory === "Build auth", "trajectory updated")

  h = updateHierarchyLevel(h, "tactic", "JWT implementation")
  assert(h.tactic === "JWT implementation", "tactic updated")

  assert(getLevelDepth("trajectory") === 1, "trajectory depth = 1")
  assert(getLevelDepth("tactic") === 2, "tactic depth = 2")
  assert(getLevelDepth("action") === 3, "action depth = 3")
}

// ─── Session ID generation ──────────────────────────────────────────

function test_session_id() {
  process.stderr.write("\n--- brain-state: session ID ---\n")
  const id1 = generateSessionId()
  const id2 = generateSessionId()

  assert(id1.startsWith("session-"), "starts with session-")
  assert(id1 !== id2, "unique IDs generated")
}

function test_migrate_brain_state() {
  process.stderr.write("\n--- brain-state: migrate ---\n")
  const oldState = {
    session: {
      id: "old-session",
      mode: "plan_driven",
      start_time: 1600000000000,
    },
    metrics: {
      turn_count: 5,
    },
    sentiment_signals: { foo: "bar" } // Deprecated field
  }

  const migrated = migrateBrainState(oldState)

  // Verify fields added
  assert(migrated.last_commit_suggestion_turn === 0, "last_commit_suggestion_turn defaulted")
  assert(migrated.session.date === new Date(1600000000000).toISOString().split("T")[0], "session.date derived from start_time")
  assert(migrated.session.meta_key === "", "session.meta_key defaulted")
  assert(migrated.session.role === "", "session.role defaulted")
  assert(migrated.session.by_ai === true, "session.by_ai defaulted")

  assert(migrated.compaction_count === 0, "compaction_count defaulted")
  assert(migrated.cycle_log.length === 0, "cycle_log defaulted")
  assert(migrated.pending_failure_ack === false, "pending_failure_ack defaulted")

  assert(migrated.metrics.consecutive_failures === 0, "metrics.consecutive_failures defaulted")
  assert(migrated.metrics.tool_type_counts.read === 0, "metrics.tool_type_counts defaulted")
  assert(migrated.metrics.governance_counters.drift === 0, "metrics.governance_counters defaulted")

  assert(migrated.framework_selection.choice === null, "framework_selection defaulted")

  // Verify deprecated field removed
  assert(!("sentiment_signals" in migrated), "sentiment_signals removed")

  // Verify existing data preserved
  assert(migrated.session.id === "old-session", "existing session.id preserved")
  assert(migrated.metrics.turn_count === 5, "existing metrics.turn_count preserved")
}

// ─── Runner ─────────────────────────────────────────────────────────

function main() {
  process.stderr.write("=== Schema Tests ===\n")

  test_brain_state_creation()
  test_brain_state_strict_starts_locked()
  test_brain_state_unlock()
  test_brain_state_lock()
  test_turn_counting()
  test_hierarchy_update()
  test_file_tracking()
  test_drift_score()
  test_drift_warning()
  test_hierarchy_state()
  test_session_id()
  test_migrate_brain_state()

  process.stderr.write(`\n=== Schema: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
