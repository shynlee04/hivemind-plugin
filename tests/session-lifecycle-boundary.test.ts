import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createTree, createNode, setRoot, saveTree } from "../src/lib/hierarchy-tree.js"
import { createStateManager, loadConfig, saveConfig } from "../src/lib/persistence.js"

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

async function testBoundaryWarningInjectedWhenConditionsAreMet() {
  process.stderr.write("\n--- session-lifecycle: boundary warning injection ---\n")

  const dir = await mkdtemp(join(tmpdir(), "hm-boundary-"))

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const config = await loadConfig(dir)
    await saveConfig(dir, {
      ...config,
      auto_compact_on_turns: 50,
    })

    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (!state) {
      throw new Error("missing state after init")
    }

    state.metrics.turn_count = 35
    state.session.role = "main"
    state.cycle_log = []
    await stateManager.save(state)

    const root = createNode("trajectory", "Phase B complete", "complete")
    const tree = setRoot(createTree(), root)
    await saveTree(dir, tree)

    const logger = {
      debug: async (_message: string) => {},
      info: async (_message: string) => {},
      warn: async (_message: string) => {},
      error: async (_message: string) => {},
    }

    const lifecycleConfig = await loadConfig(dir)
    const hook = createSessionLifecycleHook(logger, dir, lifecycleConfig)
    const output = { system: [] as string[] }

    await hook({ sessionID: "test-session" }, output)

    const text = output.system.join("\n")
    assert(text.includes("🔄 Natural boundary reached"), "includes boundary recommendation line")
    assert(text.includes("→ Run /hivemind-compact to archive and start fresh"), "includes compact handoff instruction")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function main() {
  process.stderr.write("=== Session Lifecycle Boundary Integration Tests ===\n")

  await testBoundaryWarningInjectedWhenConditionsAreMet()

  process.stderr.write(`\n=== Session Lifecycle Boundary: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

await main()
