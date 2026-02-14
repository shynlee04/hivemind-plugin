/**
 * Tool Gate tests — governance enforcement by mode
 */

import { createToolGateHookInternal } from "../src/hooks/tool-gate.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { createConfig } from "../src/schemas/config.js"
import { createBrainState, generateSessionId, unlockSession } from "../src/schemas/brain-state.js"
import { initializePlanningDirectory } from "../src/lib/planning-fs.js"
import { noopLogger } from "../src/lib/logging.js"
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
  tmpDir = await mkdtemp(join(tmpdir(), "hm-test-"))
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

// ─── file tracking / drift ──────────────────────────────────────────

async function test_drift_tracking() {
  process.stderr.write("\n--- tool-gate: drift tracking ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", max_turns_before_warning: 3 })
  await saveConfig(dir, config)

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createToolGateHookInternal(noopLogger, dir, config)

  // Run tool calls with write tools to trigger file tracking
  // (turn count is now only incremented in tool.execute.after / soft-governance)
  await hook({ sessionID: "test-drift", tool: "write" })
  await hook({ sessionID: "test-drift", tool: "edit" })

  // Check state was updated with file touches (write tools trigger saves)
  // addFileTouched deduplicates by path, so each unique tool name = 1 entry
  const updated = await sm.load()
  assert(updated !== null, "state exists after tool calls")
  assert(updated!.metrics.files_touched.length >= 2, "file touches tracked for write tools")

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

// ─── Runner ─────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Tool Gate Tests ===\n")

  await test_strict_blocks_write_without_session()
  await test_strict_allows_exempt_tools()
  await test_strict_allows_write_when_unlocked()
  await test_assisted_warns_but_allows()
  await test_permissive_allows_silently()
  await test_drift_tracking()
  await test_entry_gate_suggests_scan()

  process.stderr.write(`\n=== Tool Gate: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
