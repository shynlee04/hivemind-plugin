import { mkdtemp, mkdir, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import {
  detectFrameworkContext,
  buildFrameworkSelectionMenu,
  extractCurrentGsdPhaseGoal,
} from "../src/lib/framework-context.js"
import { createToolGateHookInternal } from "../src/hooks/tool-gate.js"
import { createConfig } from "../src/schemas/config.js"
import { saveConfig, createStateManager } from "../src/lib/persistence.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { noopLogger } from "../src/lib/logging.js"

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
  tmpDir = await mkdtemp(join(tmpdir(), "hm-framework-"))
  await initializePlanningDirectory(tmpDir)
  return tmpDir
}

async function cleanup(): Promise<void> {
  await rm(tmpDir, { recursive: true, force: true })
}

async function writeGsdFiles(dir: string, phase = "02") {
  const planningDir = join(dir, ".planning")
  await mkdir(planningDir, { recursive: true })
  await writeFile(
    join(planningDir, "STATE.md"),
    `# Project State\n\n## Current Position\n\nPhase ${Number(phase)} of 6 | Plan 1 of 4 complete | Status: In Progress\n`,
    "utf-8"
  )
  await writeFile(
    join(planningDir, "ROADMAP.md"),
    `# Roadmap\n\n## Phase 1: Foundation\n**Goal:** Foundation goal\n\n## Phase ${Number(phase)}: Governance\n**Goal:** Pin this goal for GSD mode\n`,
    "utf-8"
  )
}

async function test_detect_none() {
  process.stderr.write("\n--- framework-context: detect none ---\n")
  const dir = await setup()
  try {
    const context = await detectFrameworkContext(dir)
    assert(context.mode === "none", "mode is none with no framework markers")
    assert(!context.hasGsd && !context.hasSpecKit, "no framework flags set")
  } finally {
    await cleanup()
  }
}

async function test_detect_gsd_and_goal() {
  process.stderr.write("\n--- framework-context: detect gsd and phase goal ---\n")
  const dir = await setup()
  try {
    await writeGsdFiles(dir, "02")

    const context = await detectFrameworkContext(dir)
    assert(context.mode === "gsd", "mode is gsd when only .planning exists")
    assert(context.activePhase === "02", "active phase parsed from STATE.md")
    assert(
      context.gsdPhaseGoal === "Pin this goal for GSD mode",
      "phase goal extracted from roadmap"
    )
  } finally {
    await cleanup()
  }
}

async function test_detect_spec_kit_only() {
  process.stderr.write("\n--- framework-context: detect spec-kit only ---\n")
  const dir = await setup()
  try {
    await mkdir(join(dir, ".spec-kit"), { recursive: true })
    const context = await detectFrameworkContext(dir)

    assert(context.mode === "spec-kit", "mode is spec-kit when only .spec-kit exists")
    assert(context.activeSpecPath?.endsWith(".spec-kit") === true, "active spec path points to .spec-kit")
    assert(context.gsdPhaseGoal === null, "phase goal is null outside gsd mode")
  } finally {
    await cleanup()
  }
}

async function test_detect_both() {
  process.stderr.write("\n--- framework-context: detect both frameworks ---\n")
  const dir = await setup()
  try {
    await writeGsdFiles(dir, "03")
    await mkdir(join(dir, ".spec-kit"), { recursive: true })
    const context = await detectFrameworkContext(dir)

    assert(context.mode === "both", "mode is both when both framework markers exist")
    assert(context.hasGsd && context.hasSpecKit, "both framework flags are true")
    assert(context.activePhase === "03", "active phase still available in dual mode")
  } finally {
    await cleanup()
  }
}

async function test_selection_menu_contract() {
  process.stderr.write("\n--- framework-context: locked selection menu contract ---\n")
  const menu = buildFrameworkSelectionMenu({
    mode: "both",
    hasGsd: true,
    hasSpecKit: true,
    gsdPath: ".planning",
    specKitPath: ".spec-kit",
    activePhase: "02",
    activeSpecPath: ".spec-kit/specs/auth.md",
    gsdPhaseGoal: "Goal",
  })

  assert(menu.conflict, "dual framework menu is marked as conflict")
  assert(menu.options.length === 4, "menu has exactly four locked options")

  const labels = menu.options.map((option) => option.label)
  assert(labels[0] === "Use GSD", "first option label is Use GSD")
  assert(labels[1] === "Use Spec-kit", "second option label is Use Spec-kit")
  assert(labels[2] === "Proceed with override this session", "third option label is override")
  assert(labels[3] === "Cancel current task", "fourth option label is cancel")

  assert(menu.options[0].requiredMetadata[0] === "active_phase", "Use GSD requires active_phase")
  assert(menu.options[1].requiredMetadata[0] === "active_spec_path", "Use Spec-kit requires active_spec_path")
  assert(menu.options[2].requiredMetadata[0] === "acceptance_note", "Override requires acceptance_note")
  assert(menu.options[3].requiredMetadata.length === 0, "Cancel requires no metadata")
}

async function test_extract_goal_without_files() {
  process.stderr.write("\n--- framework-context: extract goal without planning files ---\n")
  const dir = await setup()
  try {
    const goal = await extractCurrentGsdPhaseGoal(dir)
    assert(goal === null, "returns null when planning files are missing")
  } finally {
    await cleanup()
  }
}

async function test_framework_limited_mode_is_simulated_block() {
  process.stderr.write("\n--- framework-context: limited mode simulated block with rollback guidance ---\n")
  const dir = await setup()
  try {
    await writeGsdFiles(dir, "02")
    await mkdir(join(dir, ".spec-kit"), { recursive: true })

    const config = createConfig({ governance_mode: "strict", automation_level: "assisted" })
    await saveConfig(dir, config)

    const stateManager = createStateManager(dir)
    const state = unlockSession(createBrainState(generateSessionId(), config))
    await stateManager.save(state)

    const gate = createToolGateHookInternal(noopLogger, dir, config)
    const result = await gate({ sessionID: "test-session", tool: "write" })

    assert(result.allowed, "limited mode remains non-blocking (advisory only)")
    assert(result.warning?.includes("Governance advisory") === true || result.warning?.includes("Framework conflict") === true, "limited mode warning includes framework advisory")
    assert(result.warning?.includes("framework selection") === true, "limited mode warning includes framework selection guidance")
  } finally {
    await cleanup()
  }
}

async function test_framework_simulated_pause_is_non_blocking() {
  process.stderr.write("\n--- framework-context: simulated pause remains non-blocking ---\n")
  const dir = await setup()
  try {
    await writeGsdFiles(dir, "02")
    await mkdir(join(dir, ".spec-kit"), { recursive: true })

    const config = createConfig({ governance_mode: "strict", automation_level: "coach" })
    await saveConfig(dir, config)

    const stateManager = createStateManager(dir)
    const state = unlockSession(createBrainState(generateSessionId(), config))
    await stateManager.save(state)

    const gate = createToolGateHookInternal(noopLogger, dir, config)
    const result = await gate({ sessionID: "test-session", tool: "edit" })

    assert(result.allowed, "simulated pause does not hard-deny tool execution")
    assert(result.warning?.includes("Governance advisory") === true || result.warning?.includes("Framework conflict") === true, "simulated pause warning includes framework advisory")
    assert(result.warning?.includes("framework selection") === true, "simulated pause warning includes framework selection guidance")
  } finally {
    await cleanup()
  }
}

async function main() {
  process.stderr.write("=== Framework Context Tests ===\n")

  await test_detect_none()
  await test_detect_gsd_and_goal()
  await test_detect_spec_kit_only()
  await test_detect_both()
  await test_selection_menu_contract()
  await test_extract_goal_without_files()
  await test_framework_limited_mode_is_simulated_block()
  await test_framework_simulated_pause_is_non_blocking()

  process.stderr.write(`\n=== Framework Context: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
