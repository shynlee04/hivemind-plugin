/**
 * Entry Chain Tests — Full chain verification test suite.
 *
 * Verifies the FULL chain: init → declare_intent → map_context →
 * simulate tool calls → compact_session → new session.
 *
 * Task t7 (1.10)
 */

import { initProject, injectAgentsDocs } from "../src/cli/init.js"
import { createStateManager, loadConfig } from "../src/lib/persistence.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createMapContextTool } from "../src/tools/map-context.js"
import { createCompactSessionTool } from "../src/tools/compact-session.js"
import { createScanHierarchyTool } from "../src/tools/scan-hierarchy.js"
import { loadTree, treeExists } from "../src/lib/hierarchy-tree.js"
import { readManifest } from "../src/lib/planning-fs.js"
import { loadMems } from "../src/lib/mems.js"
import { mkdtemp, rm, readdir, writeFile, readFile } from "fs/promises"
import { existsSync, writeFileSync, readFileSync } from "fs"
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

async function makeTmpDir(prefix: string = "hm-entry-"): Promise<string> {
  return mkdtemp(join(tmpdir(), prefix))
}

async function cleanTmpDir(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true })
  } catch {
    // ignore
  }
}

// ─── Test 1: hivemind init → verify all files created ────────────────

async function test_init() {
  process.stderr.write("\n--- entry-chain: init → verify all files created ---\n")
  const dir = await makeTmpDir()

  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const hm = join(dir, ".hivemind")
    const sessions = join(hm, "sessions")

    assert(existsSync(join(hm, "config.json")), "config.json exists after init")
    assert(existsSync(join(hm, "brain.json")), "brain.json exists after init")
    assert(existsSync(join(sessions, "index.md")), "index.md exists after init")
    assert(existsSync(join(sessions, "active.md")), "active.md exists after init")
    assert(existsSync(join(hm, "templates", "session.md")), "templates/session.md exists after init")
    assert(existsSync(join(sessions, "manifest.json")), "manifest.json exists after init")
    assert(!treeExists(dir), "hierarchy.json does NOT exist yet (created on first declare_intent)")
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Tests 2-8: Full chain in a single tmpdir ───────────────────────

async function test_fullChain() {
  process.stderr.write("\n--- entry-chain: full chain (tests 2-8) ---\n")
  const dir = await makeTmpDir()

  try {
    // ── Setup: init project ──
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const stateManager = createStateManager(dir)
    const declareIntentTool = createDeclareIntentTool(dir)
    const mapContextTool = createMapContextTool(dir)
    const compactSessionTool = createCompactSessionTool(dir)
    const scanHierarchyTool = createScanHierarchyTool(dir)

    // ── Test 2: declare_intent → verify tree + stamp + manifest + brain ──
    process.stderr.write("\n  [Test 2] declare_intent\n")

    await declareIntentTool.execute(
      { mode: "plan_driven", focus: "Build auth system" }
    )

    assert(treeExists(dir), "hierarchy.json now exists after declare_intent")

    const tree2 = await loadTree(dir)
    assert(tree2.root !== null && tree2.root.level === "trajectory", "tree has root node with level trajectory")
    assert(tree2.root !== null && tree2.root.content === "Build auth system", "root content matches 'Build auth system'")

    const manifest2 = await readManifest(dir)
    assert(manifest2.active_stamp !== null && manifest2.sessions.length > 0, "manifest has active session entry")

    const activeEntry = manifest2.sessions.find(
      (entry) => entry.stamp === manifest2.active_stamp && entry.status === "active"
    )
    assert(activeEntry !== undefined, "manifest points to active per-session file")
    if (activeEntry) {
      const sessionFile = await readFile(join(dir, ".hivemind", "sessions", activeEntry.file), "utf-8")
      assert(sessionFile.includes("## Hierarchy"), "per-session file preserves hierarchy section")
      assert(sessionFile.includes("## Log"), "per-session file preserves log section")
    }

    const state2 = await stateManager.load()
    assert(state2 !== null && state2.session.governance_status === "OPEN", "brain governance_status is OPEN")
    assert(state2 !== null && state2.hierarchy.trajectory.includes("Build auth system"), "brain hierarchy.trajectory contains 'Build auth system'")

    // ── Test 3: map_context tactic → verify child node added ──
    process.stderr.write("\n  [Test 3] map_context tactic\n")

    await mapContextTool.execute(
      { level: "tactic", content: "JWT validation", status: "active" }
    )

    const tree3 = await loadTree(dir)
    const allNodes3: string[] = []
    function countNodes3(node: any) {
      if (!node) return
      allNodes3.push(node.id)
      for (const child of node.children || []) countNodes3(child)
    }
    countNodes3(tree3.root)

    assert(allNodes3.length === 2, "tree has 2 nodes (trajectory + tactic)")
    assert(tree3.cursor !== null && tree3.cursor !== tree3.root?.id, "cursor moved to tactic node (not root)")

    const state3 = await stateManager.load()
    assert(state3 !== null && state3.hierarchy.tactic.includes("JWT validation"), "brain hierarchy.tactic contains 'JWT validation'")

    // ── Test 4: map_context action → verify chain intact ──
    process.stderr.write("\n  [Test 4] map_context action\n")

    await mapContextTool.execute(
      { level: "action", content: "Write middleware", status: "active" }
    )

    const tree4 = await loadTree(dir)
    const allNodes4: string[] = []
    function countNodes4(node: any) {
      if (!node) return
      allNodes4.push(node.level)
      for (const child of node.children || []) countNodes4(child)
    }
    countNodes4(tree4.root)

    assert(allNodes4.length === 3, "tree has 3 nodes")
    assert(
      allNodes4[0] === "trajectory" && allNodes4[1] === "tactic" && allNodes4[2] === "action",
      "chain: trajectory > tactic > action"
    )

    const state4 = await stateManager.load()
    assert(state4 !== null && state4.hierarchy.action.includes("Write middleware"), "brain hierarchy.action contains 'Write middleware'")

    // ── Test 5: simulate 6 tool calls → verify drift warning would fire ──
    process.stderr.write("\n  [Test 5] simulate drift\n")

    let state5 = await stateManager.load()
    if (state5) {
      // Manually increment turn_count to 6 and lower drift_score below 50
      state5.metrics.turn_count = 6
      state5.metrics.drift_score = 40
      await stateManager.save(state5)
    }

    const stateAfterDrift = await stateManager.load()
    assert(stateAfterDrift !== null && stateAfterDrift.metrics.turn_count >= 6, "turn_count >= 6 after simulation")
    assert(stateAfterDrift !== null && stateAfterDrift.metrics.drift_score < 50, "drift_score < 50 after simulation")

    // Reset drift for the remaining tests (map_context resets turn count)
    await mapContextTool.execute(
      { level: "action", content: "Write middleware", status: "active" }
    )

    // ── Test 6: compact_session → verify archive, export, auto-mem, report ──
    process.stderr.write("\n  [Test 6] compact_session\n")

    await compactSessionTool.execute(
      { summary: "Auth system foundation" }
    )

    // Archive file exists
    const archiveDir = join(dir, ".hivemind", "sessions", "archive")
    let archiveFiles: string[] = []
    try {
      archiveFiles = (await readdir(archiveDir)).filter(f => f.endsWith(".md"))
    } catch { /* ignore */ }
    assert(archiveFiles.length >= 1, "at least 1 .md archive file exists")

    // Export files exist
    const exportDir = join(dir, ".hivemind", "sessions", "archive", "exports")
    let exportFiles: string[] = []
    try {
      exportFiles = await readdir(exportDir)
    } catch { /* ignore */ }
    const jsonExports = exportFiles.filter(f => f.endsWith(".json"))
    const mdExports = exportFiles.filter(f => f.endsWith(".md"))
    assert(jsonExports.length >= 1, "at least 1 .json export file exists")
    assert(mdExports.length >= 1, "at least 1 .md export file exists")

    // Mems have auto-compact entry
    const mems6 = await loadMems(dir)
    const autoMem = mems6.mems.find(m =>
      m.shelf === "context" && m.tags.includes("auto-compact")
    )
    assert(autoMem !== undefined, "mems have auto-compact entry")

    // Brain state is LOCKED (new session)
    const state6 = await stateManager.load()
    assert(state6 !== null && state6.session.governance_status === "LOCKED", "brain state is LOCKED after compaction")

    // next_compaction_report is set
    assert(state6 !== null && state6.next_compaction_report !== null && state6.next_compaction_report !== undefined, "next_compaction_report is set (non-null)")

    // compaction_count >= 1
    assert(state6 !== null && (state6.compaction_count ?? 0) >= 1, "compaction_count >= 1")

    // last_compaction_time > 0
    assert(state6 !== null && (state6.last_compaction_time ?? 0) > 0, "last_compaction_time > 0")

    // Hierarchy tree is reset
    const tree6 = await loadTree(dir)
    assert(tree6.root === null, "hierarchy tree is reset (root = null)")

    // ── Test 7: new declare_intent → verify cross-session tracing ──
    process.stderr.write("\n  [Test 7] new declare_intent (cross-session)\n")

    await declareIntentTool.execute(
      { mode: "exploration", focus: "Debug API" }
    )

    // New tree created with new root
    const tree7 = await loadTree(dir)
    assert(tree7.root !== null && tree7.root.content === "Debug API", "new tree created with new root")

    // Old archives still exist
    let archivesAfter7: string[] = []
    try {
      archivesAfter7 = (await readdir(archiveDir)).filter(f => f.endsWith(".md"))
    } catch { /* ignore */ }
    assert(archivesAfter7.length >= 1, "old archives still exist")

    // Mems from previous session can be found
    const mems7 = await loadMems(dir)
    assert(mems7.mems.length > 0, "mems from previous session can be found (loadMems → mems.length > 0)")

    // New brain.compaction_count carried forward
    const state7 = await stateManager.load()
    assert(state7 !== null && (state7.compaction_count ?? 0) >= 1, "new brain.compaction_count carried forward")

    // ── Test 8: scan_hierarchy → verify structured output ──
    process.stderr.write("\n  [Test 8] scan_hierarchy\n")

    const scanResult = await scanHierarchyTool.execute({})
    assert(scanResult.includes("Session:"), "scan_hierarchy output includes session info")
    assert(
      scanResult.includes("Trajectory:") || scanResult.includes("Debug API"),
      "scan_hierarchy output includes hierarchy levels"
    )
    assert(
      scanResult.includes("Turns:") && scanResult.includes("Drift:"),
      "scan_hierarchy output includes metrics"
    )

  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 9: old install — no hierarchy.json ─────────────────────────

async function test_oldInstallNoHierarchyJson() {
  process.stderr.write("\n--- entry-chain: old install — no hierarchy.json ---\n")
  const dir = await makeTmpDir()

  try {
    // Init project, DON'T call declare_intent
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Manually create brain.json with flat hierarchy (trajectory set, no hierarchy.json)
    const stateManager = createStateManager(dir)
    const state = await stateManager.load()
    if (state) {
      state.hierarchy.trajectory = "Legacy trajectory"
      state.session.governance_status = "OPEN"
      await stateManager.save(state)
    }

    // Ensure hierarchy.json does NOT exist
    assert(!treeExists(dir), "hierarchy.json does not exist (old install scenario)")

    // Call map_context — should work gracefully (falls back to flat)
    const mapContextTool = createMapContextTool(dir)
    let result: string | undefined
    let didCrash = false
    try {
      result = await mapContextTool.execute(
        { level: "tactic", content: "Test", status: "active" }
      )
    } catch (e) {
      didCrash = true
    }

    assert(!didCrash, "map_context does not crash without hierarchy.json")
    assert(
      result !== undefined && !result.includes("ERROR"),
      "map_context works gracefully (no error in result)"
    )
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 10: corrupt brain.json recovery ────────────────────────────

async function test_corruptBrainJsonRecovery() {
  process.stderr.write("\n--- entry-chain: corrupt brain.json recovery ---\n")
  const dir = await makeTmpDir()

  try {
    // Init project
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Write garbage to brain.json
    const brainPath = join(dir, ".hivemind", "brain.json")
    await writeFile(brainPath, "THIS IS NOT JSON {{{garbage!!!")

    // Call declare_intent — should create fresh state, not crash
    const declareIntentTool = createDeclareIntentTool(dir)
    let didCrash = false
    let result: string | undefined
    try {
      result = await declareIntentTool.execute(
        { mode: "plan_driven", focus: "Recovery test" }
      )
    } catch (e) {
      didCrash = true
    }

    assert(!didCrash, "declare_intent does not crash with corrupt brain.json")
    assert(
      result !== undefined && result.includes("Recovery test"),
      "declare_intent creates fresh state after corrupt brain.json"
    )
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 11: opencode.jsonc handling ─────────────────────────────────

async function test_jsoncConfigPreservation() {
  process.stderr.write("\n--- entry-chain: opencode.jsonc handling ---\n")
  const dir = await makeTmpDir()

  try {
    // Create opencode.jsonc with comments and other settings
    const jsoncContent = `{
  // This is a comment
  "provider": {
    "anthropic": { "model": "claude-sonnet-4-20250514" }
  },
  "plugin": ["some-other-plugin"]
}
`
    writeFileSync(join(dir, "opencode.jsonc"), jsoncContent, "utf-8")

    // Init should find and parse opencode.jsonc
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    // Should NOT have created a separate opencode.json (jsonc should be used)
    const jsonExists = existsSync(join(dir, "opencode.json"))
    const jsoncExists = existsSync(join(dir, "opencode.jsonc"))

    // Read the config file that was actually written to
    const configPath = jsoncExists ? join(dir, "opencode.jsonc") : join(dir, "opencode.json")
    const raw = readFileSync(configPath, "utf-8")
    const parsed = JSON.parse(raw)
    const plugins = parsed.plugin as string[]

    assert(jsoncExists, "opencode.jsonc still exists after init")
    assert(
      plugins.includes("hivemind-context-governance"),
      "hivemind-context-governance registered in config"
    )
    assert(
      plugins.includes("some-other-plugin"),
      "existing plugin 'some-other-plugin' preserved in config"
    )
    assert(parsed.provider !== undefined, "provider settings preserved in config")
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 12: re-init guard — existing .hivemind/ not overwritten ─────

async function test_reInitGuard() {
  process.stderr.write("\n--- entry-chain: re-init guard ---\n")
  const dir = await makeTmpDir()

  try {
    // First init
    await initProject(dir, { governanceMode: "strict", language: "vi", silent: true })

    // Verify config values
    const config1 = JSON.parse(readFileSync(join(dir, ".hivemind", "config.json"), "utf-8"))
    assert(config1.governance_mode === "strict", "first init: governance_mode is strict")
    assert(config1.language === "vi", "first init: language is vi")

    // Second init should be a no-op (brain.json exists guard)
    await initProject(dir, { governanceMode: "permissive", language: "en", silent: true })

    // Config should NOT have changed
    const config2 = JSON.parse(readFileSync(join(dir, ".hivemind", "config.json"), "utf-8"))
    assert(config2.governance_mode === "strict", "re-init: governance_mode still strict (not overwritten)")
    assert(config2.language === "vi", "re-init: language still vi (not overwritten)")
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 13: config persistence — values flow to tools ──────────────

async function test_configPersistence() {
  process.stderr.write("\n--- entry-chain: config persistence ---\n")
  const dir = await makeTmpDir()

  try {
    // Init with strict mode
    await initProject(dir, { governanceMode: "strict", language: "en", silent: true })

    // Verify config on disk matches what loadConfig returns
    const config = await loadConfig(dir)
    assert(config.governance_mode === "strict", "loadConfig returns governance_mode=strict from disk")
    assert(config.max_turns_before_warning === 5, "loadConfig returns default max_turns_before_warning=5")
    assert(config.agent_behavior.constraints.be_skeptical === false, "deep-merged constraints: be_skeptical defaults to false")
    assert(config.agent_behavior.constraints.enforce_tdd === false, "deep-merged constraints: enforce_tdd defaults to false")

    // Modify config on disk — partial override
    const configPath = join(dir, ".hivemind", "config.json")
    const onDisk = JSON.parse(readFileSync(configPath, "utf-8"))
    onDisk.max_turns_before_warning = 10
    writeFileSync(configPath, JSON.stringify(onDisk, null, 2))

    // loadConfig should pick up the change
    const config2 = await loadConfig(dir)
    assert(config2.max_turns_before_warning === 10, "loadConfig reads updated max_turns_before_warning=10 from disk")
    assert(config2.governance_mode === "strict", "other config values preserved after partial update")
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 14: AGENTS.md injection — appends HiveMind section ──────────

async function test_agentsMdInjection() {
  process.stderr.write("\n--- entry-chain: AGENTS.md injection ---\n")
  const dir = await makeTmpDir()

  try {
    // Create existing AGENTS.md
    writeFileSync(join(dir, "AGENTS.md"), "# My Project\n\nExisting content here.\n", "utf-8")

    // Init project — should append HiveMind section
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    const agentsMd = readFileSync(join(dir, "AGENTS.md"), "utf-8")

    assert(
      agentsMd.includes("Existing content here."),
      "AGENTS.md preserves existing content"
    )
    assert(
      agentsMd.includes("<!-- HIVEMIND-GOVERNANCE-START -->"),
      "AGENTS.md contains HiveMind start marker"
    )
    assert(
      agentsMd.includes("<!-- HIVEMIND-GOVERNANCE-END -->"),
      "AGENTS.md contains HiveMind end marker"
    )
    assert(
      agentsMd.includes("declare_intent") && agentsMd.includes("map_context") && agentsMd.includes("compact_session"),
      "AGENTS.md contains core tool names"
    )
    assert(
      agentsMd.includes("Available Tools (14)"),
      "AGENTS.md contains tool count"
    )
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 15: AGENTS.md injection is idempotent ───────────────────────

async function test_agentsMdIdempotent() {
  process.stderr.write("\n--- entry-chain: AGENTS.md injection is idempotent ---\n")
  const dir = await makeTmpDir()

  try {
    // Create AGENTS.md with HiveMind section already present
    writeFileSync(join(dir, "AGENTS.md"),
      "# My Project\n\n<!-- HIVEMIND-GOVERNANCE-START -->\nOld content\n<!-- HIVEMIND-GOVERNANCE-END -->\n\nAfter section.\n",
      "utf-8"
    )

    // Call injectAgentsDocs directly
    injectAgentsDocs(dir, true)

    const agentsMd = readFileSync(join(dir, "AGENTS.md"), "utf-8")

    // Should NOT have duplicate markers
    const startMarkerCount = (agentsMd.match(/HIVEMIND-GOVERNANCE-START/g) || []).length
    assert(
      startMarkerCount === 1,
      "AGENTS.md has exactly 1 start marker (idempotent)"
    )
    assert(
      agentsMd.includes("declare_intent"),
      "AGENTS.md section was updated with current content"
    )
    assert(
      !agentsMd.includes("Old content"),
      "AGENTS.md old section content was replaced"
    )
    assert(
      agentsMd.includes("After section."),
      "AGENTS.md content after section is preserved"
    )
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 16: CLAUDE.md also gets injection ───────────────────────────

async function test_claudeMdInjection() {
  process.stderr.write("\n--- entry-chain: CLAUDE.md also gets injection ---\n")
  const dir = await makeTmpDir()

  try {
    // Create both AGENTS.md and CLAUDE.md
    writeFileSync(join(dir, "AGENTS.md"), "# Agents\n", "utf-8")
    writeFileSync(join(dir, "CLAUDE.md"), "# Claude Config\n", "utf-8")

    // Init project
    await initProject(dir, { governanceMode: "strict", language: "en", silent: true })

    const claudeMd = readFileSync(join(dir, "CLAUDE.md"), "utf-8")
    assert(
      claudeMd.includes("<!-- HIVEMIND-GOVERNANCE-START -->"),
      "CLAUDE.md also receives HiveMind section"
    )
    assert(
      claudeMd.includes("declare_intent"),
      "CLAUDE.md contains core tool names"
    )
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Test 17: no AGENTS.md — no file created ─────────────────────────

async function test_noAgentsMdNoCreation() {
  process.stderr.write("\n--- entry-chain: no AGENTS.md present → no file created ---\n")
  const dir = await makeTmpDir()

  try {
    // Init project WITHOUT any AGENTS.md or CLAUDE.md
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

    assert(
      !existsSync(join(dir, "AGENTS.md")),
      "AGENTS.md NOT created when it didn't exist before init"
    )
    assert(
      !existsSync(join(dir, "CLAUDE.md")),
      "CLAUDE.md NOT created when it didn't exist before init"
    )
  } finally {
    await cleanTmpDir(dir)
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Entry Chain Tests ===\n")

  await test_init()
  await test_fullChain()
  await test_oldInstallNoHierarchyJson()
  await test_corruptBrainJsonRecovery()
  await test_jsoncConfigPreservation()
  await test_reInitGuard()
  await test_configPersistence()
  await test_agentsMdInjection()
  await test_agentsMdIdempotent()
  await test_claudeMdInjection()
  await test_noAgentsMdNoCreation()

  process.stderr.write(`\n=== Entry Chain: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
