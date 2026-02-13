/**
 * Brownfield scan action tests for scan_hierarchy.
 * Validates new actions: analyze, recommend, orchestrate.
 */

import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { initProject } from "../src/cli/init.js"
import { createScanHierarchyTool } from "../src/tools/scan-hierarchy.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { loadAnchors } from "../src/lib/anchors.js"
import { loadMems } from "../src/lib/mems.js"

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

async function seedFrameworkConflict(dir: string): Promise<void> {
  await mkdir(join(dir, ".planning"), { recursive: true })
  await mkdir(join(dir, ".spec-kit"), { recursive: true })
  await mkdir(join(dir, ".bmad"), { recursive: true })
  await writeFile(
    join(dir, ".planning", "STATE.md"),
    "# State\nCurrent focus: Phase 2\n",
    "utf-8"
  )
  await writeFile(
    join(dir, ".planning", "ROADMAP.md"),
    "## Phase 2: Foundation\n**Goal:** Stabilize architecture baseline\n",
    "utf-8"
  )
  await writeFile(join(dir, "README.md"), "# Brownfield project\n", "utf-8")
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({
      name: "brownfield-app",
      dependencies: {
        typescript: "^5.0.0",
        react: "^18.0.0",
      },
    }, null, 2),
    "utf-8"
  )
}

async function test_analyze_json_detects_frameworks_and_stack() {
  process.stderr.write("\n--- scan-actions: analyze json ---\n")
  const dir = await setup("hm-scan-analyze-")

  try {
    await seedFrameworkConflict(dir)
    const tool = createScanHierarchyTool(dir)

    const raw = await tool.execute({ action: "analyze", json: true } as any)
    const parsed = JSON.parse(raw) as {
      action?: string
      data?: {
        project?: { name?: string }
        framework?: { mode?: string; hasBmad?: boolean }
        stack?: { hints?: string[] }
      }
    }

    assert(parsed.action === "analyze", "json action is analyze")
    assert(parsed.data?.project?.name === "brownfield-app", "project name detected from package.json")
    assert(parsed.data?.framework?.mode === "both", "framework conflict detected as both")
    assert(parsed.data?.framework?.hasBmad === true, "bmad signal detected")
    assert(
      (parsed.data?.stack?.hints ?? []).includes("TypeScript") &&
      (parsed.data?.stack?.hints ?? []).includes("React"),
      "stack hints include TypeScript + React"
    )
  } finally {
    await cleanup(dir)
  }
}

async function test_recommend_text_includes_brownfield_runbook() {
  process.stderr.write("\n--- scan-actions: recommend text ---\n")
  const dir = await setup("hm-scan-recommend-")

  try {
    await seedFrameworkConflict(dir)
    const tool = createScanHierarchyTool(dir)
    const output = await tool.execute({ action: "recommend" } as any)

    assert(output.includes("BROWNFIELD RECOMMENDATION"), "recommend output has recommendation header")
    assert(output.includes("Framework conflict"), "recommend output includes framework conflict guidance")
    assert(output.includes("declare_intent") && output.includes("map_context"), "recommend output includes lifecycle commands")
  } finally {
    await cleanup(dir)
  }
}

async function test_orchestrate_persists_bootstrap_intelligence() {
  process.stderr.write("\n--- scan-actions: orchestrate bootstrap ---\n")
  const dir = await setup("hm-scan-orchestrate-")

  try {
    await seedFrameworkConflict(dir)
    await initProject(dir, { silent: true })

    const declareIntent = createDeclareIntentTool(dir)
    await declareIntent.execute({ mode: "exploration", focus: "Brownfield scan" })

    const tool = createScanHierarchyTool(dir)
    const result = await tool.execute({ action: "orchestrate", json: true } as any)
    const parsed = JSON.parse(result) as {
      action?: string
      data?: { anchorsAdded?: number; memSaved?: boolean }
    }

    const anchors = await loadAnchors(dir)
    const mems = await loadMems(dir)

    assert(parsed.action === "orchestrate", "json action is orchestrate")
    assert((parsed.data?.anchorsAdded ?? 0) > 0, "orchestrate reports anchors added")
    assert(parsed.data?.memSaved === true, "orchestrate reports memory saved")
    assert(
      anchors.anchors.some((a) => a.key === "project-stack") &&
      anchors.anchors.some((a) => a.key === "framework-context"),
      "orchestrate saved project-stack and framework-context anchors"
    )
    assert(
      mems.mems.some((m) => m.shelf === "project-intel" && m.tags.includes("brownfield")),
      "orchestrate saved project-intel memory with brownfield tag"
    )
    assert(existsSync(join(dir, ".hivemind", "config.json")), "orchestrate is non-destructive to config")
  } finally {
    await cleanup(dir)
  }
}

async function main() {
  process.stderr.write("=== Scan Actions Tests ===\n")

  await test_analyze_json_detects_frameworks_and_stack()
  await test_recommend_text_includes_brownfield_runbook()
  await test_orchestrate_persists_bootstrap_intelligence()

  process.stderr.write(`\n=== Scan Actions: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
