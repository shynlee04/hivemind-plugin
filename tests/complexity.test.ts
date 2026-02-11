/**
 * Complexity Detection tests — checkComplexity pure function
 *
 * Tests the checkComplexity module which detects session complexity
 * based on files touched and turn count against configurable thresholds.
 */

import { checkComplexity } from "../src/lib/complexity.js"
import {
  createBrainState,
  generateSessionId,
  addFileTouched,
  incrementTurnCount,
  type BrainState,
} from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

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

function freshState(): BrainState {
  return createBrainState(generateSessionId(), createConfig())
}

// ─── Default threshold tests ─────────────────────────────────────────

async function test_below_default_threshold() {
  process.stderr.write("\n--- complexity: below default threshold ---\n")
  const state = freshState()
  const result = checkComplexity(state)

  assert(result.isComplex === false, "not complex with 0 files and 0 turns")
  assert(result.filesCount === 0, "filesCount is 0")
  assert(result.turnsCount === 0, "turnsCount is 0")
  assert(result.message === "Complexity normal", "message says normal")
}

async function test_files_exceed_default_threshold() {
  process.stderr.write("\n--- complexity: files exceed default threshold ---\n")
  let state = freshState()
  state = addFileTouched(state, "a.ts")
  state = addFileTouched(state, "b.ts")
  state = addFileTouched(state, "c.ts") // 3 files = default maxFiles

  const result = checkComplexity(state)
  assert(result.isComplex === true, "complex when 3 files touched (default threshold = 3)")
  assert(result.filesCount === 3, "filesCount is 3")
  assert(result.message.includes("3 files touched"), "message includes files count")
}

async function test_turns_exceed_default_threshold() {
  process.stderr.write("\n--- complexity: turns exceed default threshold ---\n")
  let state = freshState()
  for (let i = 0; i < 5; i++) {
    state = incrementTurnCount(state)
  }

  const result = checkComplexity(state)
  assert(result.isComplex === true, "complex when 5 turns (default threshold = 5)")
  assert(result.turnsCount === 5, "turnsCount is 5")
  assert(result.message.includes("5 turns"), "message includes turn count")
}

async function test_both_exceed_default_threshold() {
  process.stderr.write("\n--- complexity: both files and turns exceed ---\n")
  let state = freshState()
  state = addFileTouched(state, "a.ts")
  state = addFileTouched(state, "b.ts")
  state = addFileTouched(state, "c.ts")
  for (let i = 0; i < 5; i++) {
    state = incrementTurnCount(state)
  }

  const result = checkComplexity(state)
  assert(result.isComplex === true, "complex when both exceed")
  assert(result.message.includes("files touched"), "message includes files")
  assert(result.message.includes("turns"), "message includes turns")
}

async function test_just_below_default_threshold() {
  process.stderr.write("\n--- complexity: just below default threshold ---\n")
  let state = freshState()
  state = addFileTouched(state, "a.ts")
  state = addFileTouched(state, "b.ts") // 2 files, below 3
  for (let i = 0; i < 4; i++) {
    state = incrementTurnCount(state) // 4 turns, below 5
  }

  const result = checkComplexity(state)
  assert(result.isComplex === false, "not complex when both below threshold")
}

// ─── Custom threshold tests ──────────────────────────────────────────

async function test_custom_threshold_files() {
  process.stderr.write("\n--- complexity: custom threshold for files ---\n")
  let state = freshState()
  state = addFileTouched(state, "a.ts")

  const result = checkComplexity(state, { maxFiles: 1, maxTurns: 100 })
  assert(result.isComplex === true, "complex when 1 file with maxFiles=1")
  assert(result.threshold.maxFiles === 1, "custom threshold reflected")
}

async function test_custom_threshold_turns() {
  process.stderr.write("\n--- complexity: custom threshold for turns ---\n")
  let state = freshState()
  state = incrementTurnCount(state)
  state = incrementTurnCount(state)

  const result = checkComplexity(state, { maxFiles: 100, maxTurns: 2 })
  assert(result.isComplex === true, "complex when 2 turns with maxTurns=2")
  assert(result.threshold.maxTurns === 2, "custom threshold reflected")
}

async function test_zero_threshold_immediately_complex() {
  process.stderr.write("\n--- complexity: zero threshold triggers immediately ---\n")
  const state = freshState()

  const result = checkComplexity(state, { maxFiles: 0, maxTurns: 0 })
  assert(result.isComplex === true, "complex with zero thresholds (0 >= 0)")
}

async function test_high_threshold_never_complex() {
  process.stderr.write("\n--- complexity: high threshold never triggers ---\n")
  let state = freshState()
  for (let i = 0; i < 10; i++) {
    state = addFileTouched(state, `file${i}.ts`)
    state = incrementTurnCount(state)
  }

  const result = checkComplexity(state, { maxFiles: 100, maxTurns: 100 })
  assert(result.isComplex === false, "not complex with high thresholds")
}

// ─── Message format tests ────────────────────────────────────────────

async function test_normal_message_format() {
  process.stderr.write("\n--- complexity: normal message format ---\n")
  const state = freshState()
  const result = checkComplexity(state)
  assert(result.message === "Complexity normal", "message is exactly 'Complexity normal'")
}

async function test_complex_message_includes_declare_intent() {
  process.stderr.write("\n--- complexity: complex message suggests declare_intent ---\n")
  let state = freshState()
  for (let i = 0; i < 5; i++) {
    state = incrementTurnCount(state)
  }
  const result = checkComplexity(state)
  assert(result.message.includes("declare_intent"), "complex message suggests declare_intent")
}

async function test_files_only_complex_message() {
  process.stderr.write("\n--- complexity: files-only complex message ---\n")
  let state = freshState()
  state = addFileTouched(state, "a.ts")
  state = addFileTouched(state, "b.ts")
  state = addFileTouched(state, "c.ts")

  const result = checkComplexity(state)
  assert(result.message.includes("3 files touched"), "message mentions files")
  assert(!result.message.includes("turns"), "message does not mention turns when only files exceed")
}

async function test_turns_only_complex_message() {
  process.stderr.write("\n--- complexity: turns-only complex message ---\n")
  let state = freshState()
  for (let i = 0; i < 5; i++) {
    state = incrementTurnCount(state)
  }

  const result = checkComplexity(state)
  assert(result.message.includes("5 turns"), "message mentions turns")
  assert(!result.message.includes("files touched"), "message does not mention files when only turns exceed")
}

// ─── Deduplication interaction ───────────────────────────────────────

async function test_file_deduplication() {
  process.stderr.write("\n--- complexity: file deduplication ---\n")
  let state = freshState()
  state = addFileTouched(state, "a.ts")
  state = addFileTouched(state, "a.ts") // duplicate
  state = addFileTouched(state, "b.ts")

  const result = checkComplexity(state)
  assert(result.filesCount === 2, "deduplicated files count is 2")
  assert(result.isComplex === false, "not complex with 2 unique files (threshold 3)")
}

// ─── Runner ──────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Complexity Tests ===\n")

  await test_below_default_threshold()
  await test_files_exceed_default_threshold()
  await test_turns_exceed_default_threshold()
  await test_both_exceed_default_threshold()
  await test_just_below_default_threshold()
  await test_custom_threshold_files()
  await test_custom_threshold_turns()
  await test_zero_threshold_immediately_complex()
  await test_high_threshold_never_complex()
  await test_normal_message_format()
  await test_complex_message_includes_declare_intent()
  await test_files_only_complex_message()
  await test_turns_only_complex_message()
  await test_file_deduplication()

  process.stderr.write(`\n=== Complexity: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
