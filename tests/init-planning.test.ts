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
import { readFile, mkdtemp, rm } from "fs/promises"
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

  await updateIndexMd(dir, "Completed auth implementation")

  const paths = getPlanningPaths(dir)
  const content = await readFile(paths.indexPath, "utf-8")
  assert(content.includes("Completed auth implementation"), "summary appended")

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
  assert(existsSync(join(hivemindDir, "brain.json")), "brain.json created")
  assert(existsSync(join(hivemindDir, "config.json")), "config.json created")
  assert(existsSync(join(hivemindDir, "10-commandments.md")), "10-commandments.md copied")

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

async function test_init_idempotent() {
  process.stderr.write("\n--- init: idempotent ---\n")
  const dir = await setup()

  await initProject(dir, { silent: true })
  await initProject(dir, { silent: true }) // Second call should not crash

  const archives = await listArchives(dir)
  assert(archives.length === 0, "no spurious archives")

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
  await test_init_idempotent()
  await test_persistence_roundtrip()

  process.stderr.write(`\n=== Init + Planning FS: ${passed} passed, ${failed_} failed ===\n`)
  if (failed_ > 0) process.exit(1)
}

main()
