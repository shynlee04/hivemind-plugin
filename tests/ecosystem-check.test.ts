/**
 * Ecosystem Check CLI tests
 * Verifies semantic validation + traceability in `ecosystem-check` output.
 */

import { execFileSync } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { readFileSync } from "node:fs"
import { initProject } from "../src/cli/init.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"

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
  try {
    await rm(dir, { recursive: true })
  } catch {
    // ignore
  }
}

function runEcosystemCheck(dir: string): any {
  const cliPath = join(process.cwd(), "bin", "hivemind-tools.cjs")
  const raw = execFileSync("node", [cliPath, "ecosystem-check", dir, "--json"], {
    encoding: "utf-8",
  })
  return JSON.parse(raw)
}

async function test_semantic_validation_passes_on_valid_tree() {
  process.stderr.write("\n--- ecosystem-check: valid semantic chain ---\n")
  const dir = await setup("hm-eco-valid-")

  try {
    await initProject(dir, { silent: true })
    const declareIntent = createDeclareIntentTool(dir)
    await declareIntent.execute({ mode: "plan_driven", focus: "Semantic check baseline" })

    const result = runEcosystemCheck(dir)
    const semantic = result.chain.find((step: any) => step.step === "semantic")

    assert(semantic !== undefined, "ecosystem-check includes semantic step")
    assert(semantic?.status === "pass", "semantic step passes for valid hierarchy")
    assert(result.healthy === true, "healthy stays true for valid hierarchy")
    assert(typeof result.trace?.time === "string", "trace includes timestamp")
    assert(typeof result.trace?.git_hash === "string", "trace includes git hash value")
  } finally {
    await cleanup(dir)
  }
}

async function test_semantic_validation_fails_on_invalid_tree() {
  process.stderr.write("\n--- ecosystem-check: invalid semantic chain ---\n")
  const dir = await setup("hm-eco-invalid-")

  try {
    await initProject(dir, { silent: true })
    const declareIntent = createDeclareIntentTool(dir)
    await declareIntent.execute({ mode: "plan_driven", focus: "Create tree" })

    const hierarchyPath = join(dir, ".hivemind", "hierarchy.json")
    const tree = JSON.parse(readFileSync(hierarchyPath, "utf-8"))

    // Corrupt hierarchy semantics:
    // - duplicate node ID
    // - cursor points to non-existent node
    if (tree.root && Array.isArray(tree.root.children)) {
      tree.root.children.push({
        id: tree.root.id,
        level: "tactic",
        content: "duplicate-id-node",
        status: "active",
        created: Date.now(),
        stamp: "000000000000",
        children: [],
      })
    }
    tree.cursor = "a_999999999999"

    await writeFile(hierarchyPath, JSON.stringify(tree, null, 2), "utf-8")

    const result = runEcosystemCheck(dir)
    const semantic = result.chain.find((step: any) => step.step === "semantic")

    assert(semantic !== undefined, "semantic step present even for invalid tree")
    assert(semantic?.status === "fail", "semantic step fails on invalid hierarchy")
    assert(result.healthy === false, "healthy is false when semantics fail")
  } finally {
    await cleanup(dir)
  }
}

async function main() {
  process.stderr.write("=== Ecosystem Check Tests ===\n")

  await test_semantic_validation_passes_on_valid_tree()
  await test_semantic_validation_fails_on_invalid_tree()

  process.stderr.write(`\n=== Ecosystem Check: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
