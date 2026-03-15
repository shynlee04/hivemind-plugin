/**
 * Migration Tests — legacy flat .hivemind -> v2 structure
 */

import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises"
import { existsSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import { migrateIfNeeded } from "../src/lib/migrate.js"
import { getAllDirectories, getHivemindPaths, getLegacyPaths } from "../src/lib/paths.js"

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

async function setupLegacyProject(dir: string) {
  const legacy = getLegacyPaths(dir)
  await mkdir(legacy.root, { recursive: true })
  await mkdir(legacy.sessionsDir, { recursive: true })
  await mkdir(legacy.archiveDir, { recursive: true })

  await writeFile(legacy.brain, JSON.stringify({ session: { id: "s1", mode: "plan_driven", governance_status: "OPEN" }, hierarchy: { trajectory: "Legacy trajectory", tactic: "", action: "" }, metrics: { turn_count: 1, drift_score: 90, files_touched: [], context_updates: 0 } }, null, 2))
  await writeFile(legacy.hierarchy, JSON.stringify({ version: 1, root: null, cursor: null }, null, 2))
  await writeFile(legacy.anchors, JSON.stringify({ version: 1, anchors: [] }, null, 2))
  await writeFile(legacy.mems, JSON.stringify({ version: 1, mems: [] }, null, 2))
  await writeFile(legacy.config, JSON.stringify({ governance_mode: "assisted" }, null, 2))
  await writeFile(join(legacy.root, "10-commandments.md"), "legacy docs")

  await writeFile(join(legacy.sessionsDir, "session-legacy.md"), "# Legacy session body\n")
  await writeFile(
    legacy.sessionsManifest,
    JSON.stringify(
      {
        sessions: [
          { stamp: "legacy-001", file: "session-legacy.md", status: "active", created: Date.now(), linked_plans: [] },
          { stamp: "legacy-001", file: "session-legacy.md", status: "active", created: Date.now(), linked_plans: ["p1"] },
        ],
        active_stamp: "legacy-001",
      },
      null,
      2,
    ),
  )
}

async function testLegacyMigration() {
  process.stderr.write("\n--- migration: legacy -> v2 ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hivemind-migrate-legacy-"))
  try {
    await setupLegacyProject(dir)

    const result = await migrateIfNeeded(dir)
    const p = getHivemindPaths(dir)

    assert(result.migrated, "migration reports migrated=true")
    assert(existsSync(p.brain), "brain moved to state/brain.json")
    assert(existsSync(p.hierarchy), "hierarchy moved to state/hierarchy.json")
    assert(existsSync(p.anchors), "anchors moved to state/anchors.json")
    assert(existsSync(p.mems), "mems moved to memory/mems.json")
    assert(existsSync(join(p.docsDir, "10-commandments.md")), "10-commandments moved to docs/")
    assert(existsSync(p.rootManifest), "root manifest exists")
    assert(existsSync(p.stateManifest), "state manifest exists")
    assert(existsSync(p.memoryManifest), "memory manifest exists")
    assert(existsSync(p.sessionsManifest), "sessions manifest exists")
    assert(existsSync(p.plansManifest), "plans manifest exists")
    assert(existsSync(p.index), "INDEX.md generated at root")

    const manifestRaw = await readFile(p.sessionsManifest, "utf-8")
    const manifest = JSON.parse(manifestRaw) as { sessions: Array<{ stamp: string; file: string }>; active_stamp: string | null }
    assert(manifest.sessions.length === 1, "duplicate session stamps deduplicated")
    assert(manifest.active_stamp === "legacy-001", "active stamp preserved")

    const migratedSessionPath = join(p.activeDir, manifest.sessions[0].file)
    assert(existsSync(migratedSessionPath), "active session moved to sessions/active/")
    const sessionContent = await readFile(migratedSessionPath, "utf-8")
    assert(sessionContent.startsWith("---\n"), "migrated session has YAML frontmatter")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function testSkipWhenAlreadyNew() {
  process.stderr.write("\n--- migration: skip already-new ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hivemind-migrate-new-"))
  try {
    const p = getHivemindPaths(dir)
    for (const d of getAllDirectories(dir)) {
      await mkdir(d, { recursive: true })
    }
    await writeFile(p.rootManifest, JSON.stringify({ structure_format: "2.0.0" }))

    const result = await migrateIfNeeded(dir)
    assert(!result.migrated, "already-new structure is not migrated")
    assert(result.reason === "already-new-structure", "reason is already-new-structure")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function testSkipWhenNoLegacy() {
  process.stderr.write("\n--- migration: skip non-legacy ---\n")
  const dir = await mkdtemp(join(tmpdir(), "hivemind-migrate-none-"))
  try {
    const result = await migrateIfNeeded(dir)
    assert(!result.migrated, "empty project is not migrated")
    assert(result.reason === "not-legacy", "reason is not-legacy")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

process.stderr.write("=== migration.test.ts ===\n")
await testLegacyMigration()
await testSkipWhenAlreadyNew()
await testSkipWhenNoLegacy()

process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
if (failed_ > 0) process.exit(1)
