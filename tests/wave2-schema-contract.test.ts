/**
 * Wave 2 TDD: Schema Contract Integrity Tests
 *
 * Written BEFORE implementation changes. These tests verify:
 *   1. BrainStateSchema roundtrip: create → serialize → parse → validate
 *   2. Corrupt data handling: missing fields get defaults via migration
 *   3. Dead schema isolation: removing execution-knot + delegation-packet breaks nothing
 *   4. Runtime lifecycle state contracts at 4 critical points
 *   5. Tool-gate file-touch mutation queue integrity
 *   6. Drift score single-owner contract (soft-governance only)
 *
 * Pattern: Same custom assertion harness used by schemas.test.ts
 */

import {
    createBrainState,
    BrainStateSchema,
    incrementTurnCount,
    incrementUserTurnCount,
    updateHierarchy,
    addFileTouched,
    calculateDriftScore,
    isSessionLocked,
    unlockSession,
    type BrainState,
} from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"
import {
    createHierarchyState,
    updateHierarchyLevel,
} from "../src/schemas/hierarchy.js"
import { TOOL_NAMES } from "../src/lib/tool-names.js"
import { getToolActivation } from "../src/lib/tool-activation.js"

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

// ─── Test 1: BrainStateSchema Roundtrip ─────────────────────────────

function test_brainstate_schema_roundtrip() {
    process.stderr.write("\n--- Schema Roundtrip: create → JSON → safeParse ---\n")
    const config = createConfig()
    const state = createBrainState("roundtrip-test", config)

    // Serialize to JSON (simulates disk write)
    const json = JSON.stringify(state)
    const raw = JSON.parse(json)

    // Parse with Zod schema (simulates disk read)
    const result = BrainStateSchema.safeParse(raw)

    assert(result.success === true, "freshly created BrainState passes safeParse")

    if (result.success) {
        assert(result.data.session.id === "roundtrip-test", "session ID preserved through roundtrip")
        assert(result.data.metrics.turn_count === 0, "turn_count preserved")
        assert(result.data.metrics.drift_score === 100, "drift_score preserved")
        assert(result.data.version === "2.0.0", "version preserved")
    }
}

// ─── Test 2: BrainStateSchema Rejects Garbage ───────────────────────

function test_brainstate_schema_rejects_garbage() {
    process.stderr.write("\n--- Schema Validation: rejects garbage ---\n")

    const result1 = BrainStateSchema.safeParse(null)
    assert(result1.success === false, "null rejected")

    const result2 = BrainStateSchema.safeParse({})
    assert(result2.success === false, "empty object rejected")

    const result3 = BrainStateSchema.safeParse({ session: "not an object" })
    assert(result3.success === false, "wrong shape rejected")

    const result4 = BrainStateSchema.safeParse("a string")
    assert(result4.success === false, "string rejected")
}

// ─── Test 3: Schema Handles Missing Optional Fields ─────────────────

function test_brainstate_schema_defaults() {
    process.stderr.write("\n--- Schema Defaults: optional fields get defaults ---\n")
    const config = createConfig()
    const state = createBrainState("defaults-test", config)

    // Remove optional fields to simulate pre-migration data
    const raw: Record<string, unknown> = JSON.parse(JSON.stringify(state))

    // These should survive safeParse with defaults
    delete (raw as Record<string, unknown>).compaction_count
    delete (raw as Record<string, unknown>).cycle_log
    delete (raw as Record<string, unknown>).pending_failure_ack

    const result = BrainStateSchema.safeParse(raw)
    assert(result.success === true, "missing optional fields still parse")
}

// ─── Test 4: Dead Schema Isolation (execution-knot, delegation-packet) ──

function test_dead_schema_isolation() {
    process.stderr.write("\n--- Dead Schema Isolation: core schemas independent ---\n")

    // Verify core schemas don't import from dead schemas
    // If execution-knot or delegation-packet are deleted, these should still work:

    const config = createConfig()
    const state = createBrainState("isolation-test", config)
    assert(state !== null, "BrainState creation independent of execution-knot")

    const hierarchy = createHierarchyState()
    assert(hierarchy.trajectory === "", "HierarchyState creation independent of delegation-packet")

    // Tool names should exist independently
    assert(TOOL_NAMES.SESSION === "hivemind_session", "TOOL_NAMES available without dead schemas")
}

// ─── Test 5: Lifecycle Point 1 — Session Boot ──────────────────────

function test_lifecycle_session_boot() {
    process.stderr.write("\n--- Lifecycle: Session Boot Contract ---\n")
    const config = createConfig({ governance_mode: "assisted" })
    const state = createBrainState("boot-test", config)

    // At boot: session is LOCKED, agent must call hivemind_session
    assert(isSessionLocked(state), "boot: session starts LOCKED")
    assert(state.session.governance_status === "LOCKED", "boot: governance_status is LOCKED")
    assert(state.metrics.turn_count === 0, "boot: turn_count is 0")
    assert(state.metrics.user_turn_count === 0, "boot: user_turn_count is 0")
    assert(state.metrics.drift_score === 100, "boot: drift_score starts at 100")
    assert(state.metrics.context_updates === 0, "boot: no context updates yet")

    // Tool activation should suggest hivemind_session (NOT declare_intent)
    const hint = getToolActivation(state)
    assert(hint !== null, "boot: tool activation hint exists")
    assert(hint!.tool === TOOL_NAMES.SESSION, "boot: suggests hivemind_session (not declare_intent)")
    assert((hint!.tool as string) !== "declare_intent", "boot: DOES NOT suggest hallucinated declare_intent")
    assert(hint!.priority === "high", "boot: high priority")
}

// ─── Test 6: Lifecycle Point 2 — Mid-Turn Drift ────────────────────

function test_lifecycle_mid_turn_drift() {
    process.stderr.write("\n--- Lifecycle: Mid-Turn Drift Contract ---\n")
    const config = createConfig()
    let state = createBrainState("drift-test", config)
    state = unlockSession(state)

    // Update hierarchy to start (creates a context update)
    state = updateHierarchy(state, { trajectory: "Build auth" })
    assert(state.metrics.context_updates === 1, "mid-turn: context update counted")

    // Simulate 10 user turns with no map_context
    for (let i = 0; i < 10; i++) {
        state = incrementUserTurnCount(state)
    }

    const drift = calculateDriftScore(state)
    assert(drift < 100, "mid-turn: drift decreases with turns")
    assert(drift > 0, "mid-turn: drift doesn't go negative")

    // Verify drift uses user_turn_count, NOT turn_count
    // (This was the Devin M1 misconception — already correct in code)
    const toolTurnState = { ...state, metrics: { ...state.metrics, turn_count: 999, user_turn_count: 0, last_context_update_turn: 0 } }
    const driftWithHighToolTurns = calculateDriftScore(toolTurnState)
    assert(driftWithHighToolTurns === 100, "mid-turn: drift ignores tool turn_count, uses user_turn_count only")
}

// ─── Test 7: Lifecycle Point 3 — Post-Compaction ────────────────────

function test_lifecycle_post_compaction() {
    process.stderr.write("\n--- Lifecycle: Post-Compaction Contract ---\n")
    const config = createConfig()
    let state = createBrainState("compact-test", config)
    state = unlockSession(state)

    // Set up state as if session has been compacted
    state = {
        ...state,
        compaction_count: 1,
        last_compaction_time: Date.now(),
        next_compaction_report: "## Compaction Report\nContext preserved.",
    }

    // After compaction: hierarchy should be preserved
    state = updateHierarchy(state, { trajectory: "Build auth", tactic: "JWT" })
    assert(state.hierarchy.trajectory === "Build auth", "compact: hierarchy preserved")
    assert(state.hierarchy.tactic === "JWT", "compact: tactic preserved")

    // Compaction count should increment
    assert(state.compaction_count === 1, "compact: compaction_count tracked")

    // next_compaction_report should be present for injection
    assert(state.next_compaction_report !== null, "compact: report ready for injection")
}

// ─── Test 8: Lifecycle Point 4 — File Touch Mutation ────────────────

function test_lifecycle_file_touch_mutation() {
    process.stderr.write("\n--- Lifecycle: File Touch Mutation Contract ---\n")
    const config = createConfig()
    let state = createBrainState("touch-test", config)
    state = unlockSession(state)

    // Simulate tool-gate queueing file touches
    state = addFileTouched(state, "[via Write]")
    state = addFileTouched(state, "[via Edit]")
    state = addFileTouched(state, "[via Write]") // duplicate

    assert(state.metrics.files_touched.length === 2, "file-touch: deduplication works")
    assert(state.metrics.files_touched.includes("[via Write]"), "file-touch: Write tracked")
    assert(state.metrics.files_touched.includes("[via Edit]"), "file-touch: Edit tracked")
}

// ─── Test 9: Tool Names Contract ────────────────────────────────────

function test_tool_names_contract() {
    process.stderr.write("\n--- Tool Names: constants match registered tools ---\n")

    // All tool name constants must be valid strings
    assert(typeof TOOL_NAMES.SESSION === "string" && TOOL_NAMES.SESSION.length > 0, "SESSION is non-empty string")
    assert(typeof TOOL_NAMES.CONTEXT === "string" && TOOL_NAMES.CONTEXT.length > 0, "CONTEXT is non-empty string")
    assert(typeof TOOL_NAMES.COMPACT === "string" && TOOL_NAMES.COMPACT.length > 0, "COMPACT is non-empty string")
    assert(typeof TOOL_NAMES.HIERARCHY === "string" && TOOL_NAMES.HIERARCHY.length > 0, "HIERARCHY is non-empty string")

    // No tool name should be "declare_intent"
    const allNames = Object.values(TOOL_NAMES)
    const hasHallucination = allNames.some(n => n === "declare_intent")
    assert(!hasHallucination, "no tool name is the hallucinated 'declare_intent'")

    // Session tool should be hivemind_session
    assert(TOOL_NAMES.SESSION === "hivemind_session", "SESSION constant is 'hivemind_session'")
}

// ─── Test 10: BrainState → Tool Activation Priority Order ───────────

function test_tool_activation_priority() {
    process.stderr.write("\n--- Tool Activation: priority ordering ---\n")
    const config = createConfig()

    // LOCKED + high drift + long session = LOCKED wins
    const locked = createBrainState("priority-test", config)
    const hint = getToolActivation(locked)
    assert(hint !== null && hint.tool === TOOL_NAMES.SESSION, "LOCKED wins over all other conditions")
    assert(hint !== null && hint.priority === "high", "LOCKED is high priority")

    // OPEN + high drift = drift wins
    let drifted = createBrainState("drift-priority", config)
    drifted = unlockSession(drifted)
    drifted = updateHierarchy(drifted, { trajectory: "something" })
    for (let i = 0; i < 10; i++) { drifted = incrementTurnCount(drifted) }
    drifted = { ...drifted, metrics: { ...drifted.metrics, drift_score: 30 } }
    const driftHint = getToolActivation(drifted)
    assert(driftHint !== null && driftHint.tool === "hivemind_session", "high drift suggests hivemind_session")

    // OPEN + normal = null (no suggestion needed)
    let normal = createBrainState("normal-priority", config)
    normal = unlockSession(normal)
    normal = updateHierarchy(normal, { trajectory: "Build auth", tactic: "JWT" })
    normal = { ...normal, metrics: { ...normal.metrics, drift_score: 80, turn_count: 3, user_turn_count: 3 } }
    const normalHint = getToolActivation(normal)
    assert(normalHint === null, "normal state: no tool suggestion needed")
}

// ─── Test 11: Config Schema Contract ────────────────────────────────

function test_config_contract() {
    process.stderr.write("\n--- Config: creation and defaults ---\n")

    const defaultConfig = createConfig()
    assert(defaultConfig.governance_mode === "assisted", "default governance_mode is assisted")
    assert(typeof defaultConfig.max_turns_before_warning === "number", "max_turns_before_warning is number")
    assert(defaultConfig.max_turns_before_warning > 0, "max_turns_before_warning is positive")

    const strictConfig = createConfig({ governance_mode: "strict" })
    assert(strictConfig.governance_mode === "strict", "override governance_mode works")

    const permissiveConfig = createConfig({ governance_mode: "permissive" })
    assert(permissiveConfig.governance_mode === "permissive", "permissive mode accepted")
}

// ─── Test 12: Hierarchy Schema Contract ─────────────────────────────

function test_hierarchy_contract() {
    process.stderr.write("\n--- Hierarchy: state operations contract ---\n")

    const h = createHierarchyState()
    assert(h.trajectory === "", "empty trajectory")
    assert(h.tactic === "", "empty tactic")
    assert(h.action === "", "empty action")

    const h2 = updateHierarchyLevel(h, "trajectory", "Build auth")
    assert(h2.trajectory === "Build auth", "trajectory updated")
    assert(h.trajectory === "", "original immutable (pure function)")

    // Setting lower level auto-clears? No — just sets it
    const h3 = updateHierarchyLevel(h2, "tactic", "JWT flow")
    assert(h3.tactic === "JWT flow", "tactic set")
    assert(h3.trajectory === "Build auth", "trajectory preserved when setting tactic")
}

// ─── Runner ─────────────────────────────────────────────────────────

function main() {
    process.stderr.write("=== Wave 2 TDD: Schema Contract Integrity ===\n")

    test_brainstate_schema_roundtrip()
    test_brainstate_schema_rejects_garbage()
    test_brainstate_schema_defaults()
    test_dead_schema_isolation()
    test_lifecycle_session_boot()
    test_lifecycle_mid_turn_drift()
    test_lifecycle_post_compaction()
    test_lifecycle_file_touch_mutation()
    test_tool_names_contract()
    test_tool_activation_priority()
    test_config_contract()
    test_hierarchy_contract()

    process.stderr.write(`\n=== Wave 2 TDD: ${passed} passed, ${failed_} failed ===\n`)
    if (failed_ > 0) process.exit(1)
}

main()
