/**
 * CLI scan wrapper tests.
 */

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { initProject } from "../src/cli/init.js"
import { runScanCommand } from "../src/cli/scan.js"

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

async function setup(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

async function cleanup(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
}

async function seedProject(dir: string): Promise<void> {
  await mkdir(join(dir, ".planning"), { recursive: true })
  await writeFile(join(dir, ".planning", "STATE.md"), "Current focus: Phase 2\n", "utf-8")
  await writeFile(
    join(dir, ".planning", "ROADMAP.md"),
    "## Phase 2: Foundation\n**Goal:** Stabilize architecture baseline\n",
    "utf-8"
  )
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({
      name: "cli-scan-app",
      dependencies: {
        typescript: "^5.0.0",
      },
    }, null, 2),
    "utf-8"
  )
}

async function test_default_action_is_analyze_json() {
  process.stderr.write("\n--- cli-scan: default analyze ---\n")
  const dir = await setup("hm-cli-scan-default-")
  try {
    await seedProject(dir)
    const raw = await runScanCommand(dir, { json: true })
    const parsed = JSON.parse(raw) as { action?: string; data?: { project?: { name?: string } } }

    assert(parsed.action === "analyze", "default action is analyze")
    assert(parsed.data?.project?.name === "cli-scan-app", "analyze captures project name")
  } finally {
    await cleanup(dir)
  }
}

async function test_recommend_action_outputs_runbook() {
  process.stderr.write("\n--- cli-scan: recommend ---\n")
  const dir = await setup("hm-cli-scan-recommend-")
  try {
    await seedProject(dir)
    const output = await runScanCommand(dir, { action: "recommend" })

    assert(output.includes("BROWNFIELD RECOMMENDATION"), "recommend includes header")
    assert(output.includes("declare_intent") && output.includes("map_context"), "recommend includes lifecycle sequence")
  } finally {
    await cleanup(dir)
  }
}

async function test_orchestrate_requires_init() {
  process.stderr.write("\n--- cli-scan: orchestrate requires init ---\n")
  const dir = await setup("hm-cli-scan-orch-guard-")
  try {
    await seedProject(dir)
    const raw = await runScanCommand(dir, { action: "orchestrate", json: true })
    const parsed = JSON.parse(raw) as { success?: boolean; error?: string }

    assert(parsed.success === false, "orchestrate returns unsuccessful result when uninitialized")
    assert(parsed.error === "hivemind_not_initialized", "orchestrate returns init guard error")
  } finally {
    await cleanup(dir)
  }
}

async function test_orchestrate_after_init() {
  process.stderr.write("\n--- cli-scan: orchestrate after init ---\n")
  const dir = await setup("hm-cli-scan-orch-ok-")
  try {
    await seedProject(dir)
    await initProject(dir, { silent: true })

    const raw = await runScanCommand(dir, { action: "orchestrate", json: true })
    const parsed = JSON.parse(raw) as { action?: string; data?: { anchorsAdded?: number } }

    assert(parsed.action === "orchestrate", "orchestrate action returned")
    assert((parsed.data?.anchorsAdded ?? 0) > 0, "orchestrate persisted anchors")
  } finally {
    await cleanup(dir)
  }
}

async function main() {
  process.stderr.write("=== CLI Scan Tests ===\n")

  await test_default_action_is_analyze_json()
  await test_recommend_action_outputs_runbook()
  await test_orchestrate_requires_init()
  await test_orchestrate_after_init()

  process.stderr.write(`\n=== CLI Scan: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
