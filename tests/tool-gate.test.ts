/**
 * Tool Gate tests — governance enforcement by mode
 */

import { createToolGateHook } from "../src/hooks/tool-gate.js"
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

  const hook = createToolGateHook(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-1", tool: "write" })

  assert(!result.allowed, "strict mode blocks write without session")
  assert(result.error !== undefined, "strict mode provides error message")

  await cleanup()
}

async function test_strict_allows_exempt_tools() {
  process.stderr.write("\n--- tool-gate: strict allows exempt tools ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })

  const hook = createToolGateHook(noopLogger, dir, config)

  const readResult = await hook({ sessionID: "test-2", tool: "read" })
  assert(readResult.allowed, "read tool is exempt")

  const searchResult = await hook({ sessionID: "test-2", tool: "search_codebase" })
  assert(searchResult.allowed, "search tool is exempt")

  const declareResult = await hook({ sessionID: "test-2", tool: "declare_intent" })
  assert(declareResult.allowed, "declare_intent is exempt")

  await cleanup()
}

async function test_strict_allows_write_when_unlocked() {
  process.stderr.write("\n--- tool-gate: strict allows write when session unlocked ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "strict" })

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createToolGateHook(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-3", tool: "write" })

  assert(result.allowed, "write allowed when session is OPEN")

  await cleanup()
}

// ─── assisted mode tests ────────────────────────────────────────────

async function test_assisted_warns_but_allows() {
  process.stderr.write("\n--- tool-gate: assisted warns but allows ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted" })

  const hook = createToolGateHook(noopLogger, dir, config)
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

  const hook = createToolGateHook(noopLogger, dir, config)
  const result = await hook({ sessionID: "test-5", tool: "write" })

  assert(result.allowed, "permissive mode allows")
  assert(result.warning === undefined, "permissive mode no warning")

  await cleanup()
}

// ─── turn counting / drift ──────────────────────────────────────────

async function test_drift_tracking() {
  process.stderr.write("\n--- tool-gate: drift tracking ---\n")
  const dir = await setup()
  const config = createConfig({ governance_mode: "assisted", max_turns_before_warning: 3 })

  const sm = createStateManager(dir)
  const state = unlockSession(createBrainState(generateSessionId(), config))
  await sm.save(state)

  const hook = createToolGateHook(noopLogger, dir, config)

  // Run 5 tool calls with a non-exempt tool to exceed threshold
  for (let i = 0; i < 5; i++) {
    await hook({ sessionID: "test-drift", tool: "bash" })
  }

  // Check state was updated
  const updated = await sm.load()
  assert(updated !== null, "state exists after tool calls")
  assert(updated!.metrics.turn_count >= 5, "turn count incremented")

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

  process.stderr.write(`\n=== Tool Gate: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
