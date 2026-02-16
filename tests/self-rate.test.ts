/**
 * Self-Rate Tool Tests
 *
 * Tests the self_rate tool functionality
 */

import { createSelfRateTool } from "../src/tools/self-rate.js"
import { createStateManager } from "../src/lib/persistence.js"
import { initProject } from "../src/cli/init.js"
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
  tmpDir = await mkdtemp(join(tmpdir(), "hm-selfrate-"))
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

async function test_selfRateBasic() {
  process.stderr.write("\n--- self-rate: basic rating ---\n")

  const dir = await setup()

  try {
    const stateManager = createStateManager(dir)
    const selfRateTool = createSelfRateTool(dir)

    // Rate without any state should fail
    const noStateResult = await selfRateTool.execute({ score: 8 })
    assert(
      noStateResult.includes("No active session"),
      "fails without any state"
    )

    // Initialize project (creates initial state in assisted mode = OPEN)
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Now rate should work (assisted mode starts with OPEN session)
    const result = await selfRateTool.execute({ score: 8 })
    assert(result.includes("Rating recorded: 8/10"), "records rating")
    assert(result.includes("turn"), "includes turn number")
    assert(result.includes("✅"), "shows positive feedback for high score")

    // Check state was updated
    const state = await stateManager.load()
    assert(state !== null, "state exists")
    assert(state?.metrics.ratings.length === 1, "one rating stored")
    assert(state?.metrics.ratings[0].score === 8, "score is 8")
    assert(state?.metrics.ratings[0].turn_number === 0, "turn number recorded")

  } finally {
    await cleanup()
  }
}

async function test_selfRateWithReason() {
  process.stderr.write("\n--- self-rate: with reason ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const stateManager = createStateManager(dir)
    const selfRateTool = createSelfRateTool(dir)

    // Create session
    const { createDeclareIntentTool } = await import("../src/tools/declare-intent.js")
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute({
      mode: "plan_driven",
      focus: "Test with reason",
    })

    // Rate with reason
    const result = await selfRateTool.execute({
      score: 7,
      reason: "Making good progress but hit a snag",
      turn_context: "Working on authentication",
    })

    assert(result.includes("Rating recorded: 7/10"), "records rating")
    assert(result.includes("Making good progress but hit a snag"), "includes reason")
    assert(result.includes("✅"), "shows positive feedback for score 7")

    // Check state
    const state = await stateManager.load()
    assert(state?.metrics.ratings.length === 1, "one rating stored")
    assert(state?.metrics.ratings[0].score === 7, "score is 7")
    assert(
      state?.metrics.ratings[0].reason === "Making good progress but hit a snag",
      "reason stored"
    )
    assert(
      state?.metrics.ratings[0].turn_context === "Working on authentication",
      "turn context stored"
    )
    assert(
      state?.metrics.ratings[0].timestamp > 0,
      "timestamp recorded"
    )

  } finally {
    await cleanup()
  }
}

async function test_selfRateLowScore() {
  process.stderr.write("\n--- self-rate: low score warning ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const selfRateTool = createSelfRateTool(dir)

    // Create session
    const { createDeclareIntentTool } = await import("../src/tools/declare-intent.js")
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute({
      mode: "plan_driven",
      focus: "Test low score",
    })

    // Low score should trigger warning
    const result = await selfRateTool.execute({ score: 2 })
    assert(result.includes("Rating recorded: 2/10"), "records low rating")
    assert(result.includes("⚠️"), "shows warning for low score")
    assert(
      result.includes("compact_session"),
      "suggests compact_session for low score"
    )

  } finally {
    await cleanup()
  }
}

async function test_selfRateMultipleRatings() {
  process.stderr.write("\n--- self-rate: multiple ratings ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const stateManager = createStateManager(dir)
    const selfRateTool = createSelfRateTool(dir)

    // Create session
    const { createDeclareIntentTool } = await import("../src/tools/declare-intent.js")
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute({
      mode: "plan_driven",
      focus: "Test multiple ratings",
    })

    // Add multiple ratings
    await selfRateTool.execute({ score: 8, reason: "Starting well" })
    
    // Simulate some activity to increment turn
    let state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 5
      await stateManager.save(state)
    }

    await selfRateTool.execute({ score: 6, reason: "Getting complex" })
    
    state = await stateManager.load()
    if (state) {
      state.metrics.turn_count = 10
      await stateManager.save(state)
    }

    await selfRateTool.execute({ score: 9, reason: "Back on track" })

    // Verify all ratings stored
    state = await stateManager.load()
    assert(state?.metrics.ratings.length === 3, "three ratings stored")
    assert(state?.metrics.ratings[0].score === 8, "first rating score is 8")
    assert(state?.metrics.ratings[1].score === 6, "second rating score is 6")
    assert(state?.metrics.ratings[2].score === 9, "third rating score is 9")
    assert(state?.metrics.ratings[0].turn_number === 0, "first at turn 0")
    assert(state?.metrics.ratings[1].turn_number === 5, "second at turn 5")
    assert(state?.metrics.ratings[2].turn_number === 10, "third at turn 10")

  } finally {
    await cleanup()
  }
}

async function test_selfRateScoreValidation() {
  process.stderr.write("\n--- self-rate: score validation ---\n")

  const dir = await setup()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en" })

    const selfRateTool = createSelfRateTool(dir)

    // Create session
    const { createDeclareIntentTool } = await import("../src/tools/declare-intent.js")
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute({
      mode: "plan_driven",
      focus: "Test validation",
    })

    // Test boundary values
    const result1 = await selfRateTool.execute({ score: 1 })
    assert(result1.includes("Rating recorded: 1/10"), "accepts minimum score 1")

    const result10 = await selfRateTool.execute({ score: 10 })
    assert(result10.includes("Rating recorded: 10/10"), "accepts maximum score 10")

  } finally {
    await cleanup()
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Self-Rate Tool Tests ===\n")

  await test_selfRateBasic()
  await test_selfRateWithReason()
  await test_selfRateLowScore()
  await test_selfRateMultipleRatings()
  await test_selfRateScoreValidation()

  process.stderr.write(`\n=== Self-Rate: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
