/**
 * Tests for src/lib/paths.ts — Centralized Path Resolver
 *
 * Verifies:
 * - getHivemindPaths returns all expected paths under .hivemind/
 * - getLegacyPaths returns old flat structure paths
 * - isLegacyStructure detects old vs new
 * - isNewStructure detects migrated structure
 * - buildSessionFilename produces human-readable names
 * - buildArchiveFilename matches session filename format
 * - slugify handles edge cases
 * - getAllDirectories returns all required dirs
 * - getActiveSessionPath reads manifest correctly
 */

import { mkdtemp, rm, mkdir, writeFile } from "fs/promises"
import { tmpdir } from "os"
import { join, sep } from "path"
import {
  getHivemindPaths,
  getLegacyPaths,
  isLegacyStructure,
  isNewStructure,
  hivemindExists,
  buildSessionFilename,
  buildArchiveFilename,
  slugify,
  getAllDirectories,
  getActiveSessionPath,
  STRUCTURE_VERSION,
  HIVEMIND_DIR,
} from "../src/lib/paths.js"
import type { HivemindPaths, LegacyPaths } from "../src/lib/paths.js"

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

// ─── Setup / Teardown ────────────────────────────────────────────────

async function setup() {
  tmpDir = await mkdtemp(join(tmpdir(), "hivemind-paths-test-"))
}

async function teardown() {
  await rm(tmpDir, { recursive: true, force: true })
}

// ─── Tests ───────────────────────────────────────────────────────────

async function testConstants() {
  process.stderr.write("\n--- Constants ---\n")
  assert(STRUCTURE_VERSION === "2.0.0", "STRUCTURE_VERSION is 2.0.0")
  assert(HIVEMIND_DIR === ".hivemind", "HIVEMIND_DIR is .hivemind")
}

async function testGetHivemindPaths() {
  process.stderr.write("\n--- getHivemindPaths ---\n")
  const paths = getHivemindPaths(tmpDir)

  // Root
  assert(paths.root === join(tmpDir, ".hivemind"), "root path")
  assert(paths.config === join(tmpDir, ".hivemind", "config.json"), "config path")
  assert(paths.index === join(tmpDir, ".hivemind", "INDEX.md"), "index path")
  assert(paths.rootManifest === join(tmpDir, ".hivemind", "manifest.json"), "root manifest path")

  // State
  assert(paths.stateDir === join(tmpDir, ".hivemind", "state"), "stateDir path")
  assert(paths.stateManifest === join(tmpDir, ".hivemind", "state", "manifest.json"), "state manifest path")
  assert(paths.brain === join(tmpDir, ".hivemind", "state", "brain.json"), "brain path")
  assert(paths.hierarchy === join(tmpDir, ".hivemind", "state", "hierarchy.json"), "hierarchy path")
  assert(paths.anchors === join(tmpDir, ".hivemind", "state", "anchors.json"), "anchors path")
  assert(paths.tasks === join(tmpDir, ".hivemind", "state", "tasks.json"), "tasks path")

  // Memory
  assert(paths.memoryDir === join(tmpDir, ".hivemind", "memory"), "memoryDir path")
  assert(paths.memoryManifest === join(tmpDir, ".hivemind", "memory", "manifest.json"), "memory manifest path")
  assert(paths.mems === join(tmpDir, ".hivemind", "memory", "mems.json"), "mems path")

  // Sessions
  assert(paths.sessionsDir === join(tmpDir, ".hivemind", "sessions"), "sessionsDir path")
  assert(paths.sessionsManifest === join(tmpDir, ".hivemind", "sessions", "manifest.json"), "sessions manifest path")
  assert(paths.activeDir === join(tmpDir, ".hivemind", "sessions", "active"), "activeDir path")
  assert(paths.archiveDir === join(tmpDir, ".hivemind", "sessions", "archive"), "archiveDir path")
  assert(paths.exportsDir === join(tmpDir, ".hivemind", "sessions", "archive", "exports"), "exportsDir path")

  // Plans
  assert(paths.plansDir === join(tmpDir, ".hivemind", "plans"), "plansDir path")
  assert(paths.plansManifest === join(tmpDir, ".hivemind", "plans", "manifest.json"), "plans manifest path")

  // Graph
  assert(paths.graphDir === join(tmpDir, ".hivemind", "graph"), "graphDir path")
  assert(paths.graphTrajectory === join(tmpDir, ".hivemind", "graph", "trajectory.json"), "graph trajectory path")
  assert(paths.graphPlans === join(tmpDir, ".hivemind", "graph", "plans.json"), "graph plans path")
  assert(paths.graphTasks === join(tmpDir, ".hivemind", "graph", "tasks.json"), "graph tasks path")
  assert(paths.graphMems === join(tmpDir, ".hivemind", "graph", "mems.json"), "graph mems path")

  // Governance SOT (Level 0)
  assert(paths.codemapDir === join(tmpDir, ".hivemind", "codemap"), "codemapDir path")
  assert(paths.codemapManifest === join(tmpDir, ".hivemind", "codemap", "manifest.json"), "codemap manifest path")
  assert(paths.codewikiDir === join(tmpDir, ".hivemind", "codewiki"), "codewikiDir path")
  assert(paths.codewikiManifest === join(tmpDir, ".hivemind", "codewiki", "manifest.json"), "codewiki manifest path")

  // Other
  assert(paths.logsDir === join(tmpDir, ".hivemind", "logs"), "logsDir path")
  assert(paths.docsDir === join(tmpDir, ".hivemind", "docs"), "docsDir path")
  assert(paths.templatesDir === join(tmpDir, ".hivemind", "templates"), "templatesDir path")
  assert(paths.sessionTemplate === join(tmpDir, ".hivemind", "templates", "session.md"), "session template path")

  // All paths under .hivemind/
  const allValues = Object.values(paths) as string[]
  const allUnder = allValues.every((p) => p.startsWith(join(tmpDir, ".hivemind")))
  assert(allUnder, "all paths are under .hivemind/")
}

async function testGetLegacyPaths() {
  process.stderr.write("\n--- getLegacyPaths ---\n")
  const paths = getLegacyPaths(tmpDir)

  assert(paths.root === join(tmpDir, ".hivemind"), "legacy root")
  assert(paths.brain === join(tmpDir, ".hivemind", "brain.json"), "legacy brain at root level")
  assert(paths.hierarchy === join(tmpDir, ".hivemind", "hierarchy.json"), "legacy hierarchy at root")
  assert(paths.anchors === join(tmpDir, ".hivemind", "anchors.json"), "legacy anchors at root")
  assert(paths.mems === join(tmpDir, ".hivemind", "mems.json"), "legacy mems at root")
  assert(paths.config === join(tmpDir, ".hivemind", "config.json"), "legacy config same location")
}

async function testIsLegacyStructure() {
  process.stderr.write("\n--- isLegacyStructure ---\n")

  // No .hivemind/ at all — not legacy
  assert(!isLegacyStructure(tmpDir), "empty dir is not legacy")

  // Create legacy structure: brain.json at root, no state/ dir
  const hivemindDir = join(tmpDir, ".hivemind")
  await mkdir(hivemindDir, { recursive: true })
  await writeFile(join(hivemindDir, "brain.json"), "{}")

  assert(isLegacyStructure(tmpDir), "brain.json at root = legacy")

  // Now create state/ dir — no longer legacy
  await mkdir(join(hivemindDir, "state"), { recursive: true })
  assert(!isLegacyStructure(tmpDir), "brain.json at root + state/ exists = not legacy")
}

async function testIsNewStructure() {
  process.stderr.write("\n--- isNewStructure ---\n")

  // Clean start
  const freshDir = await mkdtemp(join(tmpdir(), "hivemind-paths-new-"))
  try {
    assert(!isNewStructure(freshDir), "empty dir is not new structure")

    // Create partial — state/ but no manifest
    const hivemindDir = join(freshDir, ".hivemind")
    await mkdir(join(hivemindDir, "state"), { recursive: true })
    assert(!isNewStructure(freshDir), "state/ without manifest is not new structure")

    // Add root manifest — now it's new structure
    await writeFile(join(hivemindDir, "manifest.json"), "{}")
    assert(isNewStructure(freshDir), "state/ + manifest.json = new structure")
  } finally {
    await rm(freshDir, { recursive: true, force: true })
  }
}

async function testHivemindExists() {
  process.stderr.write("\n--- hivemindExists ---\n")

  const freshDir = await mkdtemp(join(tmpdir(), "hivemind-paths-exists-"))
  try {
    assert(!hivemindExists(freshDir), "no .hivemind/ = false")
    await mkdir(join(freshDir, ".hivemind"))
    assert(hivemindExists(freshDir), ".hivemind/ exists = true")
  } finally {
    await rm(freshDir, { recursive: true, force: true })
  }
}

async function testSlugify() {
  process.stderr.write("\n--- slugify ---\n")

  assert(slugify("Phase 03: .hivemind reorg") === "phase-03-hivemind-reorg", "typical trajectory")
  assert(slugify("Quick Fix") === "quick-fix", "simple two words")
  assert(slugify("") === "", "empty string")
  assert(slugify("   spaces   ") === "spaces", "trims whitespace to slug")
  assert(slugify("UPPERCASE-Mixed") === "uppercase-mixed", "lowercases")
  assert(slugify("a---b") === "a-b", "collapses multiple hyphens")
  assert(slugify("special!@#$%chars") === "specialchars", "strips special chars")

  // Max length
  const longText = "this is a very long trajectory name that should be truncated"
  const slugged = slugify(longText, 20)
  assert(slugged.length <= 20, "respects maxLength")
  assert(!slugged.endsWith("-"), "no trailing hyphen after truncation")
}

async function testBuildSessionFilename() {
  process.stderr.write("\n--- buildSessionFilename ---\n")

  const name = buildSessionFilename("2026-02-13", "plan_driven", "Phase 03: .hivemind reorg")
  assert(name === "2026-02-13-plan_driven-phase-03-hivemind-reorg.md", "full session filename")

  // Date object
  const dateObj = new Date("2026-01-15T10:30:00Z")
  const name2 = buildSessionFilename(dateObj, "quick_fix", "Fix bug")
  assert(name2 === "2026-01-15-quick_fix-fix-bug.md", "Date object input")

  // ISO timestamp string
  const name3 = buildSessionFilename("2026-03-20T14:00:00Z", "exploration", "Research API")
  assert(name3 === "2026-03-20-exploration-research-api.md", "ISO timestamp input")

  // Empty trajectory falls back to "session"
  const name4 = buildSessionFilename("2026-02-13", "plan_driven", "")
  assert(name4 === "2026-02-13-plan_driven-session.md", "empty trajectory fallback")
}

async function testBuildArchiveFilename() {
  process.stderr.write("\n--- buildArchiveFilename ---\n")

  const archiveName = buildArchiveFilename("2026-02-13", "plan_driven", "Phase 03: reorg")
  const sessionName = buildSessionFilename("2026-02-13", "plan_driven", "Phase 03: reorg")
  assert(archiveName === sessionName, "archive filename matches session filename")
}

async function testGetAllDirectories() {
  process.stderr.write("\n--- getAllDirectories ---\n")

  const dirs = getAllDirectories(tmpDir)
  assert(dirs.length === 14, "14 directories in structure")
  assert(dirs[0] === join(tmpDir, ".hivemind"), "root is first")
  assert(dirs.includes(join(tmpDir, ".hivemind", "state")), "includes state/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "memory")), "includes memory/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions")), "includes sessions/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions", "active")), "includes sessions/active/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions", "archive")), "includes sessions/archive/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions", "archive", "exports")), "includes sessions/archive/exports/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "plans")), "includes plans/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph")), "includes graph/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "codemap")), "includes codemap/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "codewiki")), "includes codewiki/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "logs")), "includes logs/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "docs")), "includes docs/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "templates")), "includes templates/")
}

async function testGetActiveSessionPath() {
  process.stderr.write("\n--- getActiveSessionPath ---\n")

  const freshDir = await mkdtemp(join(tmpdir(), "hivemind-paths-active-"))
  try {
    // No manifest — returns null
    const result1 = await getActiveSessionPath(freshDir)
    assert(result1 === null, "no manifest returns null")

    // Create manifest with no active stamp
    const paths = getHivemindPaths(freshDir)
    await mkdir(join(paths.sessionsDir), { recursive: true })
    await writeFile(paths.sessionsManifest, JSON.stringify({
      sessions: [{ stamp: "123", file: "test.md", status: "closed" }],
      active_stamp: null,
    }))
    const result2 = await getActiveSessionPath(freshDir)
    assert(result2 === null, "null active_stamp returns null")

    // Set active stamp
    await writeFile(paths.sessionsManifest, JSON.stringify({
      sessions: [
        { stamp: "abc", file: "old.md", status: "closed" },
        { stamp: "xyz", file: "current-session.md", status: "active" },
      ],
      active_stamp: "xyz",
    }))
    const result3 = await getActiveSessionPath(freshDir)
    assert(
      result3 === join(paths.activeDir, "current-session.md"),
      "resolves active session path via manifest",
    )

    // Active stamp not found in sessions array
    await writeFile(paths.sessionsManifest, JSON.stringify({
      sessions: [{ stamp: "abc", file: "old.md", status: "closed" }],
      active_stamp: "nonexistent",
    }))
    const result4 = await getActiveSessionPath(freshDir)
    assert(result4 === null, "missing stamp in sessions returns null")

    // Corrupt manifest — returns null gracefully
    await writeFile(paths.sessionsManifest, "not json{{{")
    const result5 = await getActiveSessionPath(freshDir)
    assert(result5 === null, "corrupt manifest returns null")
  } finally {
    await rm(freshDir, { recursive: true, force: true })
  }
}

async function testPathsArePure() {
  process.stderr.write("\n--- Purity ---\n")

  // Calling with different roots should give different results
  const paths1 = getHivemindPaths("/project/a")
  const paths2 = getHivemindPaths("/project/b")
  assert(paths1.root !== paths2.root, "different roots give different paths")
  assert(paths1.brain !== paths2.brain, "brain paths differ per root")

  // Same root should give identical results (deterministic)
  const paths3 = getHivemindPaths("/project/a")
  assert(paths1.root === paths3.root, "same root gives same paths")
  assert(paths1.brain === paths3.brain, "deterministic")
}

// ─── Runner ──────────────────────────────────────────────────────────

async function run() {
  process.stderr.write("\n=== paths.test.ts ===\n")
  await setup()

  try {
    await testConstants()
    await testGetHivemindPaths()
    await testGetLegacyPaths()
    await testIsLegacyStructure()
    await testIsNewStructure()
    await testHivemindExists()
    await testSlugify()
    await testBuildSessionFilename()
    await testBuildArchiveFilename()
    await testGetAllDirectories()
    await testGetActiveSessionPath()
    await testPathsArePure()
  } finally {
    await teardown()
  }

  process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
  if (failed_ > 0) process.exit(1)
}

run().catch((err) => {
  console.error("Test runner error:", err)
  process.exit(1)
})
