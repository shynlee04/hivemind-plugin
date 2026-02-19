/**
 * Init + Planning FS tests
 */

import { initProject } from "../src/cli/init.js"
import { createStateManager, loadConfig, saveConfig } from "../src/lib/persistence.js"
import {
  initializePlanningDirectory,
  readActiveMd,
  writeActiveMd,
  archiveSession,
  updateIndexMd,
  listArchives,
  resetActiveMd,
  parseActiveMd,
  getPlanningPaths,
} from "../src/lib/planning-fs.js"
import { existsSync } from "fs"
import { mkdir, readFile, mkdtemp, rm, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { getEffectivePaths } from "../src/lib/paths.js"
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
  tmpDir = await mkdtemp(join(tmpdir(), "hm-init-"))
  return tmpDir
}

async function cleanup(): Promise<void> {
  try {
    await rm(tmpDir, { recursive: true })
  } catch {
    // ignore
  }
}

// ─── Planning FS tests ──────────────────────────────────────────────

async function test_init_planning_directory() {
  process.stderr.write("\n--- planning-fs: init directory ---\n")
  const dir = await setup()
  const paths = await initializePlanningDirectory(dir)

  assert(existsSync(paths.planningDir), "planning dir created")
  assert(existsSync(paths.indexPath), "index.md created")
  assert(existsSync(paths.activePath), "active.md created")
  assert(existsSync(paths.archiveDir), "archive dir created")

  await cleanup()
}

async function test_active_md_roundtrip() {
  process.stderr.write("\n--- planning-fs: active.md roundtrip ---\n")
  const dir = await setup()
  await initializePlanningDirectory(dir)

  // Write
  await writeActiveMd(dir, {
    frontmatter: {
      session_id: "test-123",
      mode: "plan_driven",
      governance_status: "OPEN",
    },
    body: "# Test Session\n\nSome content here.",
  })

  // Read
  const content = await readActiveMd(dir)
  assert(content.frontmatter.session_id === "test-123", "session_id preserved")
  assert(content.frontmatter.mode === "plan_driven", "mode preserved")
  assert(content.body.includes("Test Session"), "body preserved")

  await cleanup()
}

async function test_parse_active_md() {
  process.stderr.write("\n--- planning-fs: parse active.md ---\n")

  const md = `---
session_id: "abc"
mode: "quick_fix"
---

# Active Session

Some content`

  const parsed = parseActiveMd(md)
  assert(parsed.frontmatter.session_id === "abc", "frontmatter parsed")
  assert(parsed.body.includes("Active Session"), "body parsed")
}

async function test_archive_session() {
  process.stderr.write("\n--- planning-fs: archive session ---\n")
  const dir = await setup()
  await initializePlanningDirectory(dir)

  await archiveSession(dir, "test-sess-1", "# Archived content\nSome work done")

  const archives = await listArchives(dir)
  assert(archives.length === 1, "1 archive created")
  assert(archives[0].includes("test-sess-1"), "archive contains session ID")

  await cleanup()
}

async function test_update_index_md() {
  process.stderr.write("\n--- planning-fs: update index.md ---\n")
  const dir = await setup()
  await initializePlanningDirectory(dir)

  // Register and archive a session so updateIndexMd has a target for the summary
  const { registerSession, readManifest, writeManifest } = await import("../src/lib/planning-fs.js")
  await registerSession(dir, "test-stamp-001", "test-session.md", { mode: "plan_driven" })
  const manifest = await readManifest(dir)
  const entry = manifest.sessions.find((s: any) => s.stamp === "test-stamp-001")
  if (entry) entry.status = "archived"
  manifest.active_stamp = null
  await writeManifest(dir, manifest)

  await updateIndexMd(dir, "Completed auth implementation")

  // Verify summary stored in manifest
  const updatedManifest = await readManifest(dir)
  const archived = updatedManifest.sessions.find((s: any) => s.summary === "Completed auth implementation")
  assert(archived !== undefined, "summary stored in manifest")

  // Verify root INDEX.md includes the summary
  const paths = getPlanningPaths(dir)
  const content = await readFile(paths.indexPath, "utf-8")
  assert(content.includes("Completed auth implementation"), "summary in root INDEX.md")

  await cleanup()
}

async function test_reset_active_md() {
  process.stderr.write("\n--- planning-fs: reset active.md ---\n")
  const dir = await setup()
  await initializePlanningDirectory(dir)

  // Write some content
  await writeActiveMd(dir, {
    frontmatter: { session_id: "old-session" },
    body: "# Old session content",
  })

  // Reset
  await resetActiveMd(dir)

  const content = await readActiveMd(dir)
  assert(content.frontmatter.session_id === "", "session_id reset to empty")
  assert(content.body.includes("Active Session"), "body reset to template")

  await cleanup()
}

// ─── Init CLI tests ─────────────────────────────────────────────────

async function test_init_project() {
  process.stderr.write("\n--- init: creates project structure ---\n")
  const dir = await setup()

  await initProject(dir, { silent: true })

  const hivemindDir = join(dir, ".hivemind")
  const sessionsDir = join(hivemindDir, "sessions")
  assert(existsSync(hivemindDir), "hivemind dir created")
  assert(existsSync(join(sessionsDir, "index.md")), "index.md created")
  assert(existsSync(join(sessionsDir, "active.md")), "active.md created")
  assert(existsSync(getEffectivePaths(dir).brain), "brain.json created")
  assert(existsSync(join(hivemindDir, "config.json")), "config.json created")
  assert(existsSync(join(hivemindDir, "docs", "10-commandments.md")), "10-commandments.md copied to docs/")

  await cleanup()
}

async function test_init_project_with_options() {
  process.stderr.write("\n--- init: respects options ---\n")
  const dir = await setup()

  await initProject(dir, {
    silent: true,
    governanceMode: "strict",
    language: "vi",
  })

  const config = await loadConfig(dir)
  assert(config.governance_mode === "strict", "strict mode set")
  assert(config.language === "vi", "Vietnamese language set")

  const sm = createStateManager(dir)
  const state = await sm.load()
  assert(state !== null, "brain state created")
  assert(state!.session.governance_status === "LOCKED", "strict mode starts LOCKED")

  await cleanup()
}

async function test_init_applies_hivefiver_defaults_to_opencode() {
  process.stderr.write("\n--- init: applies HiveFiver defaults to opencode.json ---\n")
  const dir = await setup()

  await initProject(dir, { silent: true })

  const configPath = join(dir, ".opencode", "opencode.json")
  const raw = await readFile(configPath, "utf-8")
  const opencode = JSON.parse(raw)
  assert(!!opencode.agent?.hivefiver, "hivefiver agent exists in opencode config")
  assert(opencode.agent.hivefiver.mode === "primary", "hivefiver agent is primary")
  assert(!!opencode.mcp?.deepwiki, "deepwiki mcp exists")
  assert(!!opencode.mcp?.context7, "context7 mcp exists")
  assert(!!opencode.mcp?.tavily, "tavily mcp exists")
  assert(!!opencode.mcp?.exa, "exa mcp exists")
  assert(!!opencode.mcp?.repomix, "repomix mcp exists")
  assert(!existsSync(join(dir, "opencode.json")), "fresh init does not create root opencode.json")

  await cleanup()
}

async function test_init_idempotent() {
  process.stderr.write("\n--- init: idempotent ---\n")
  const dir = await setup()

  await initProject(dir, { silent: true })
  await initProject(dir, { silent: true }) // Second call should not crash

  const archives = await listArchives(dir)
  assert(archives.length === 0, "no spurious archives")

  await cleanup()
}

async function test_reinit_refreshes_assets_and_normalizes_plugin_version() {
  process.stderr.write("\n--- init: re-init refreshes assets for existing installs ---\n")
  const dir = await setup()

  await initProject(dir, { silent: true })

  const commandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")
  const originalCommand = await readFile(commandPath, "utf-8")
  await writeFile(commandPath, "# stale old command\n", "utf-8")

  const configPath = join(dir, ".opencode", "opencode.json")
  const rawBefore = await readFile(configPath, "utf-8")
  const configBefore = JSON.parse(rawBefore)
  configBefore.plugin = [
    "some-other-plugin",
    ".opencode/plugins/hivemind-context-governance@2.6.2",
    "tailwind-helper",
  ]
  await writeFile(configPath, JSON.stringify(configBefore, null, 2) + "\n", "utf-8")

  await initProject(dir, { silent: true })

  const refreshedCommand = await readFile(commandPath, "utf-8")
  assert(refreshedCommand === originalCommand, "re-init overwrites stale packaged assets")

  const rawAfter = await readFile(configPath, "utf-8")
  const configAfter = JSON.parse(rawAfter)
  const plugins = Array.isArray(configAfter.plugin) ? configAfter.plugin : []
  assert(
    plugins.includes("hivemind-context-governance"),
    "re-init normalizes plugin entry to unpinned package name"
  )
  assert(
    !plugins.some(
      (value: unknown) =>
        typeof value === "string" && value.includes("hivemind-context-governance@")
    ),
    "re-init removes version-pinned plugin entries"
  )
  assert(
    !plugins.some(
      (value: unknown) =>
        typeof value === "string" && value.includes(".opencode/plugins/hivemind-context-governance")
    ),
    "re-init removes malformed path-based plugin entry"
  )
  assert(
    plugins.join(",") === "some-other-plugin,hivemind-context-governance,tailwind-helper",
    "re-init replaces plugin in place without appending duplicates"
  )

  await cleanup()
}

async function test_reinit_normalizes_legacy_dot_opencode_config() {
  process.stderr.write("\n--- init: normalizes legacy .opencode/opencode.json plugin entries ---\n")
  const dir = await setup()

  await mkdir(join(dir, ".opencode"), { recursive: true })
  await writeFile(
    join(dir, ".opencode", "opencode.json"),
    JSON.stringify({
      "$schema": "https://opencode.ai/config.json",
      plugin: ["hivemind-context-governance@2.6.2"],
    }, null, 2) + "\n",
    "utf-8"
  )

  await initProject(dir, { silent: true })

  const legacyRaw = await readFile(join(dir, ".opencode", "opencode.json"), "utf-8")
  const legacyConfig = JSON.parse(legacyRaw)
  const plugins = Array.isArray(legacyConfig.plugin) ? legacyConfig.plugin : []
  assert(
    plugins.includes("hivemind-context-governance"),
    "legacy .opencode/opencode.json plugin entry is normalized"
  )
  assert(
    !plugins.some(
      (value: unknown) =>
        typeof value === "string" && value.includes("hivemind-context-governance@")
    ),
    "legacy .opencode/opencode.json has no pinned plugin entries"
  )

  await cleanup()
}

async function test_init_always_forces_project_opencode_sync_with_overwrite() {
  process.stderr.write("\n--- init: forces .opencode project sync and overwrite ---\n")
  const dir = await setup()

  await initProject(dir, { silent: true })

  const commandPath = join(dir, ".opencode", "commands", "hivemind-scan.md")
  await writeFile(commandPath, "# user-customized command\n", "utf-8")

  await initProject(dir, {
    silent: true,
    syncTarget: "global",
    overwriteAssets: false,
  })

  const commandAfter = await readFile(commandPath, "utf-8")
  assert(
    commandAfter !== "# user-customized command\n",
    "init overwrites existing .opencode command even when overwriteAssets=false"
  )
  assert(
    existsSync(join(dir, ".opencode", "commands", "hivemind-scan.md")),
    "commands synced to project .opencode"
  )
  assert(
    existsSync(join(dir, ".opencode", "skills", "hivemind-governance", "SKILL.md")),
    "skills synced to project .opencode"
  )
  assert(
    existsSync(join(dir, ".opencode", "agents", "hivemind-brownfield-orchestrator.md")),
    "agents synced to project .opencode"
  )
  assert(
    existsSync(join(dir, ".opencode", "workflows", "hivemind-brownfield-bootstrap.yaml")),
    "workflows synced to project .opencode"
  )

  await cleanup()
}

async function test_reinit_removes_legacy_project_plugin_artifacts() {
  process.stderr.write("\n--- init: removes legacy .opencode plugin artifacts ---\n")
  const dir = await setup()

  await initProject(dir, { silent: true })

  const legacyPluginDir = join(dir, ".opencode", "plugins", "hivemind-context-governance@2.6.2")
  const legacyUnpinnedDir = join(dir, ".opencode", "plugins", "hivemind-context-governance")
  await mkdir(legacyPluginDir, { recursive: true })
  await mkdir(legacyUnpinnedDir, { recursive: true })
  await writeFile(join(legacyPluginDir, "index.js"), "module.exports = {}", "utf-8")
  await writeFile(join(legacyUnpinnedDir, "index.js"), "module.exports = {}", "utf-8")

  await initProject(dir, { silent: true })

  assert(!existsSync(legacyPluginDir), "re-init removes versioned legacy plugin directory")
  assert(!existsSync(legacyUnpinnedDir), "re-init removes unpinned legacy plugin directory")

  await cleanup()
}

// ─── Persistence tests ──────────────────────────────────────────────

async function test_persistence_roundtrip() {
  process.stderr.write("\n--- persistence: state roundtrip ---\n")
  const dir = await setup()
  await initializePlanningDirectory(dir)

  const sm = createStateManager(dir)
  assert(!sm.exists(), "no state initially")

  const { createBrainState, generateSessionId } = await import("../src/schemas/brain-state.js")
  const { createConfig } = await import("../src/schemas/config.js")

  const config = createConfig()
  const state = createBrainState(generateSessionId(), config)
  await sm.save(state)

  assert(sm.exists(), "state exists after save")

  const loaded = await sm.load()
  assert(loaded !== null, "state loaded")
  assert(loaded!.session.id === state.session.id, "session ID preserved")
  assert(loaded!.session.governance_mode === "assisted", "mode preserved")

  await cleanup()
}

// ─── Runner ─────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Init + Planning FS Tests ===\n")

  await test_init_planning_directory()
  await test_active_md_roundtrip()
  await test_parse_active_md()
  await test_archive_session()
  await test_update_index_md()
  await test_reset_active_md()
  await test_init_project()
  await test_init_project_with_options()
  await test_init_applies_hivefiver_defaults_to_opencode()
  await test_init_idempotent()
  await test_reinit_refreshes_assets_and_normalizes_plugin_version()
  await test_reinit_normalizes_legacy_dot_opencode_config()
  await test_init_always_forces_project_opencode_sync_with_overwrite()
  await test_reinit_removes_legacy_project_plugin_artifacts()
  await test_persistence_roundtrip()

  process.stderr.write(`\n=== Init + Planning FS: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
