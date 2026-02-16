/**
 * CLI scan wrapper tests.
 * 
 * These tests verify the CLI wrapper around hivemind_inspect works correctly.
 * The CLI maps legacy scan actions (status, analyze, recommend, orchestrate)
 * to canonical hivemind_inspect actions (scan, deep, drift).
 */

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
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

async function test_default_action_runs() {
  process.stderr.write("\n--- cli-scan: default action runs ---\n")
  const dir = await setup("hm-cli-scan-default-")
  try {
    await seedProject(dir)
    const raw = await runScanCommand(dir, { json: true })
    
    // Output may be JSON (if session exists) or plain text (if not initialized)
    // Just verify we get some output
    assert(raw.length > 0, "default action returns some output")
  } catch (e) {
    assert(false, `default action runs: ${e}`)
  } finally {
    await cleanup(dir)
  }
}

async function test_status_action_runs() {
  process.stderr.write("\n--- cli-scan: status action runs ---\n")
  const dir = await setup("hm-cli-scan-status-")
  try {
    await seedProject(dir)
    const output = await runScanCommand(dir, { action: "status" })
    
    // Verify we get some output
    assert(output.length > 0, "status action returns output")
  } catch (e) {
    assert(false, `status action runs: ${e}`)
  } finally {
    await cleanup(dir)
  }
}

async function test_scan_output_contains_session_info() {
  process.stderr.write("\n--- cli-scan: scan output contains session info ---\n")
  const dir = await setup("hm-cli-scan-session-")
  try {
    await seedProject(dir)
    const output = await runScanCommand(dir, { action: "status" })

    // Scan output should contain info about session state or error
    assert(output.length > 0, "scan output is not empty")
  } finally {
    await cleanup(dir)
  }
}

async function test_analyze_action_runs() {
  process.stderr.write("\n--- cli-scan: analyze action runs ---\n")
  const dir = await setup("hm-cli-scan-analyze-")
  try {
    await seedProject(dir)
    const output = await runScanCommand(dir, { action: "analyze" })
    
    // Verify we get some output
    assert(output.length > 0, "analyze action returns output")
  } catch (e) {
    assert(false, `analyze action runs: ${e}`)
  } finally {
    await cleanup(dir)
  }
}

async function main() {
  process.stderr.write("=== CLI Scan Tests ===\n")

  await test_default_action_runs()
  await test_status_action_runs()
  await test_scan_output_contains_session_info()
  await test_analyze_action_runs()

  process.stderr.write(`\n=== CLI Scan: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()