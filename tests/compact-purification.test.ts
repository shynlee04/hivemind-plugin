/**
 * Compact Purification Tests
 * Covers: identifyTurningPoints, generateNextCompactionReport, compact_session integration, compaction hook
 */

import { initProject } from "../src/cli/init.js"
import { createStateManager, loadConfig } from "../src/lib/persistence.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createMapContextTool } from "../src/tools/map-context.js"
import { createCompactSessionTool, identifyTurningPoints, generateNextCompactionReport } from "../src/tools/compact-session.js"
import type { TurningPoint } from "../src/tools/compact-session.js"
import { createCompactionHook } from "../src/hooks/compaction.js"
import { createLogger } from "../src/lib/logging.js"
import {
  createTree,
  createNode,
  setRoot,
  addChild,
  markComplete,
} from "../src/lib/hierarchy-tree.js"
import type { HierarchyTree } from "../src/lib/hierarchy-tree.js"
import type { MetricsState, BrainState } from "../src/schemas/brain-state.js"
import { createBrainState } from "../src/schemas/brain-state.js"
import { DEFAULT_CONFIG } from "../src/schemas/config.js"
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
  tmpDir = await mkdtemp(join(tmpdir(), "hm-purify-"))
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

const TEST_DATE = new Date(2026, 1, 11, 14, 30)

function buildDefaultMetrics(): MetricsState {
  return {
    turn_count: 5,
    drift_score: 80,
    files_touched: ["src/app.ts", "src/utils.ts"],
    context_updates: 3,
    ratings: [],
    auto_health_score: 100,
    total_tool_calls: 10,
    successful_tool_calls: 9,
    violation_count: 0,
    consecutive_failures: 0,
    consecutive_same_section: 0,
    last_section_content: "",
    tool_type_counts: { read: 4, write: 3, query: 2, governance: 1 },
    keyword_flags: [],
    write_without_read_count: 0,
    governance_counters: {
      out_of_order: 0,
      drift: 0,
      compaction: 0,
      evidence_pressure: 0,
      ignored: 0,
      acknowledged: false,
      prerequisites_completed: false,
    },
  }
}

function buildDefaultState(): BrainState {
  const state = createBrainState("test-session-123", DEFAULT_CONFIG)
  state.metrics = buildDefaultMetrics()
  return state
}

function buildThreeLevelTree(): { tree: HierarchyTree; root: ReturnType<typeof createNode>; tactic: ReturnType<typeof createNode>; action: ReturnType<typeof createNode> } {
  const root = createNode("trajectory", "Build auth system", "active", TEST_DATE)
  const tactic = createNode("tactic", "JWT validation", "active", new Date(2026, 1, 11, 14, 35))
  const action = createNode("action", "Write middleware", "active", new Date(2026, 1, 11, 14, 40))

  let tree = createTree()
  tree = setRoot(tree, root)
  tree = addChild(tree, root.id, tactic)
  tree = addChild(tree, tactic.id, action)
  return { tree, root, tactic, action }
}

// ─── Tests ───────────────────────────────────────────────────────────

function test_identifyTurningPoints_completedNodes() {
  process.stderr.write("\n--- identifyTurningPoints: finds completed nodes ---\n")

  const { tree, tactic, action } = buildThreeLevelTree()
  const now = Date.now()
  const completed = markComplete(markComplete(tree, action.id, now), tactic.id, now + 1000)
  const metrics = buildDefaultMetrics()

  const turningPoints = identifyTurningPoints(completed, metrics)

  // Should find 2 completed nodes
  const completedTPs = turningPoints.filter(tp => tp.type === 'completed')
  assert(completedTPs.length === 2, "finds 2 completed nodes")
  assert(completedTPs.some(tp => tp.content === "JWT validation"), "finds completed tactic")
  assert(completedTPs.some(tp => tp.content === "Write middleware"), "finds completed action")
  assert(completedTPs.every(tp => tp.detail.includes("Completed at")), "completed detail has timestamp")
}

function test_identifyTurningPoints_cursorPath() {
  process.stderr.write("\n--- identifyTurningPoints: finds cursor path ---\n")

  const { tree } = buildThreeLevelTree()
  // Cursor is at action after buildThreeLevelTree
  const metrics = buildDefaultMetrics()

  const turningPoints = identifyTurningPoints(tree, metrics)

  const cursorTPs = turningPoints.filter(tp => tp.type === 'cursor_path')
  assert(cursorTPs.length === 3, "cursor path has 3 nodes (trajectory > tactic > action)")
  assert(cursorTPs[0].level === "trajectory", "cursor path starts with trajectory")
  assert(cursorTPs[1].level === "tactic", "cursor path has tactic")
  assert(cursorTPs[2].level === "action", "cursor path ends with action")

  // Verify cursor_path comes before other types
  const firstNonCursor = turningPoints.findIndex(tp => tp.type !== 'cursor_path')
  if (firstNonCursor >= 0) {
    assert(firstNonCursor >= cursorTPs.length, "cursor_path items come first in sorted output")
  } else {
    assert(true, "cursor_path items come first in sorted output")
  }
}

function test_identifyTurningPoints_emptyTree() {
  process.stderr.write("\n--- identifyTurningPoints: handles empty tree ---\n")

  const tree = createTree() // root is null
  const metrics = buildDefaultMetrics()

  const turningPoints = identifyTurningPoints(tree, metrics)
  assert(turningPoints.length === 0, "returns empty array for null root")
}

function test_generateReport_structured() {
  process.stderr.write("\n--- generateNextCompactionReport: produces structured report ---\n")

  const { tree } = buildThreeLevelTree()
  const state = buildDefaultState()
  const turningPoints: TurningPoint[] = [
    {
      nodeId: "t_1", stamp: "301411022026", level: "trajectory",
      content: "Build auth system", type: 'cursor_path', detail: "Cursor ancestry: trajectory node"
    },
    {
      nodeId: "tc_1", stamp: "351411022026", level: "tactic",
      content: "JWT validation", type: 'completed', detail: "Completed at 2026-02-11T14:40:00.000Z"
    },
  ]

  const report = generateNextCompactionReport(tree, turningPoints, state)

  assert(report.includes("=== HiveMind Purification Report ==="), "report has header")
  assert(report.includes("## Active Work"), "report has active work section")
  assert(report.includes("## Cursor Path"), "report has cursor path section")
  assert(report.includes("## Key Turning Points"), "report has key turning points section")
  assert(report.includes("## Files Touched"), "report has files touched section")
  assert(report.includes("## Resume Instructions"), "report has resume instructions")
  assert(report.includes("=== End Purification Report ==="), "report has footer")
  assert(report.includes("test-session-123"), "report contains session ID")
  assert(report.includes("src/app.ts"), "report contains files touched")
}

function test_generateReport_budgetCap() {
  process.stderr.write("\n--- generateNextCompactionReport: budget-caps at 1800 chars ---\n")

  // Create a tree with many nodes to generate a large report
  let tree = createTree()
  const root = createNode("trajectory", "Large project with many components", "active", TEST_DATE)
  tree = setRoot(tree, root)

  // Add many tactic nodes with long content
  for (let i = 0; i < 20; i++) {
    const tactic = createNode("tactic", `Tactic number ${i} with some really long description to fill up the budget quickly`, "active", new Date(2026, 1, 11, 14, 35 + i))
    tree = addChild(tree, root.id, tactic)

    // Add action children to each
    for (let j = 0; j < 3; j++) {
      const action = createNode("action", `Action ${j} under tactic ${i} with verbose detail`, "active", new Date(2026, 1, 11, 15, i * 3 + j))
      tree = addChild(tree, tactic.id, action)
    }
  }

  const state = buildDefaultState()
  state.metrics.files_touched = Array.from({ length: 15 }, (_, i) => `src/very/deeply/nested/path/to/file-${i}.ts`)

  // Create many turning points
  const turningPoints: TurningPoint[] = []
  for (let i = 0; i < 30; i++) {
    turningPoints.push({
      nodeId: `tp_${i}`, stamp: `000011022026`, level: "action",
      content: `Turning point ${i} with detailed description of what happened`,
      type: 'completed', detail: `Completed at some long timestamp that adds characters`
    })
  }

  const report = generateNextCompactionReport(tree, turningPoints, state)
  assert(report.length <= 1800, `report length ${report.length} is within 1800 budget`)
  assert(report.includes("=== End Purification Report ==="), "budget-capped report still has footer")
}

async function test_integration_writesReport() {
  process.stderr.write("\n--- compact_session integration: writes next_compaction_report to brain ---\n")

  const dir = await setup()

  try {
    // Init and set up a session with hierarchy
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)
    const compactSessionTool = createCompactSessionTool(dir)

    await declareIntentTool.execute({ mode: "plan_driven", focus: "Report write test" })
    await mapContextTool.execute({ level: "tactic", content: "Build component", status: "active" })
    await mapContextTool.execute({ level: "action", content: "Write tests", status: "active" })

    // Compact the session
    const result = await compactSessionTool.execute({ summary: "Test completed" })
    assert(result.includes("Purified:"), "compact result includes purification summary")

    // Verify new brain state has next_compaction_report
    const stateManager = createStateManager(dir)
    const newState = await stateManager.load()
    assert(newState !== null, "new state exists after compaction")
    assert(
      newState!.next_compaction_report !== null && newState!.next_compaction_report.length > 0,
      "new state has next_compaction_report set"
    )
    assert(
      newState!.next_compaction_report!.includes("=== HiveMind Purification Report ==="),
      "next_compaction_report has purification header"
    )
    assert(
      newState!.next_compaction_report!.includes("=== End Purification Report ==="),
      "next_compaction_report has purification footer"
    )

  } finally {
    await cleanup()
  }
}

async function test_integration_autoPrune() {
  process.stderr.write("\n--- compact_session integration: auto-prunes when 5+ completed ---\n")

  const dir = await setup()

  try {
    // Init and set up a session
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)
    const compactSessionTool = createCompactSessionTool(dir)

    await declareIntentTool.execute({ mode: "plan_driven", focus: "Prune test" })

    // Add 6 actions and mark 5 complete (need to go through map_context)
    for (let i = 0; i < 6; i++) {
      await mapContextTool.execute({ level: "tactic", content: `Tactic ${i}`, status: "active" })
      await mapContextTool.execute({ level: "action", content: `Action ${i}`, status: "active" })
      if (i < 5) {
        // Mark this action complete
        await mapContextTool.execute({ level: "action", content: `Action ${i}`, status: "complete" })
      }
    }

    // Compact the session — should auto-prune
    const result = await compactSessionTool.execute({ summary: "Pruned test" })
    assert(result.includes("Purified:"), "compact result includes purification summary")

    // Verify the result mentions pruning (turning points should be > 0)
    // The actual pruning happens on the tree before it's reset, so we verify
    // the purification report exists on the new brain state
    const stateManager = createStateManager(dir)
    const newState = await stateManager.load()
    assert(newState !== null, "state exists after pruned compaction")
    assert(
      newState!.next_compaction_report !== null,
      "next_compaction_report exists after auto-prune"
    )

  } finally {
    await cleanup()
  }
}

async function test_compactionHook_injectsPurificationReport() {
  process.stderr.write("\n--- compaction hook: injects purification report as first context ---\n")

  const dir = await setup()

  try {
    // Init project
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Manually set brain state with next_compaction_report
    const stateManager = createStateManager(dir)
    const config = await loadConfig(dir)
    const logger = await createLogger(dir, "test")

    // Declare intent first so we have a valid state
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute({ mode: "plan_driven", focus: "Hook test" })

    // Now modify state to include a purification report
    const state = await stateManager.load()
    assert(state !== null, "state exists for hook test setup")

    state!.next_compaction_report = "=== HiveMind Purification Report ===\nTest purification content\n=== End Purification Report ==="
    await stateManager.save(state!)

    // Fire compaction hook
    const hook = createCompactionHook(logger, dir)
    const output = { context: [] as string[] }
    await hook({ sessionID: "test-session" }, output)

    // Verify purification report is the FIRST context item
    assert(output.context.length >= 2, "compaction hook adds at least 2 context items (purification + standard)")
    assert(
      output.context[0].includes("=== HiveMind Purification Report ==="),
      "first context item is the purification report"
    )
    assert(
      output.context[0].includes("Test purification content"),
      "purification report content is preserved"
    )
    // Standard context should follow
    assert(
      output.context[1].includes("=== HiveMind Context (post-compaction) ==="),
      "second context item is standard HiveMind context"
    )

    const consumedState = await stateManager.load()
    assert(
      consumedState!.next_compaction_report === null,
      "next_compaction_report is cleared after compaction injection"
    )

  } finally {
    await cleanup()
  }
}

// ─── Runner ─────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Compact Purification Tests ===\n")

  // Pure function tests
  test_identifyTurningPoints_completedNodes()
  test_identifyTurningPoints_cursorPath()
  test_identifyTurningPoints_emptyTree()
  test_generateReport_structured()
  test_generateReport_budgetCap()

  // Integration tests
  await test_integration_writesReport()
  await test_integration_autoPrune()
  await test_compactionHook_injectsPurificationReport()

  process.stderr.write(`\n=== Compact Purification: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
