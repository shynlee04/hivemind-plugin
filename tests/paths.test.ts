/**
 * Tests for src/lib/paths.ts — Centralized Path Resolver
 *
 * Verifies:
 * - getHivemindPaths returns all expected paths under .hivemind/
 * - getLegacyPaths remains available for explicit migration tooling
 * - isLegacyStructure still detects legacy layout for explicit migrations
 * - isNewStructure detects migrated structure
 * - buildSessionFilename produces deterministic non-date-prefixed names
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
  assert(paths.sessionRuntimeDir === join(tmpDir, ".hivemind", "sessions", "runtime"), "sessionRuntimeDir path")
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
  assert(paths.graphPendingChanges === join(tmpDir, ".hivemind", "graph", "pending-changes.json"), "graph pending changes path")
  assert(paths.graphVerificationLedger === join(tmpDir, ".hivemind", "graph", "verification-ledger.json"), "graph verification ledger path")

  // Graph codebase SOT pillars
  assert(paths.graphCodebaseDir === join(tmpDir, ".hivemind", "graph", "codebase"), "graph codebase dir path")
  assert(paths.graphCodebaseCodewikiDir === join(tmpDir, ".hivemind", "graph", "codebase", "codewiki"), "graph codebase codewiki dir path")
  assert(paths.graphCodebaseCodemapDir === join(tmpDir, ".hivemind", "graph", "codebase", "codemap"), "graph codebase codemap dir path")
  assert(paths.graphCodebaseCodeIntelDir === join(tmpDir, ".hivemind", "graph", "codebase", "code-intel"), "graph codebase code-intel dir path")
  assert(paths.graphCodebaseRepoKnowledgeDir === join(tmpDir, ".hivemind", "graph", "codebase", "repoknowledge"), "graph codebase repoknowledge dir path")

  // Graph project SOT lineage
  assert(paths.graphProjectDir === join(tmpDir, ".hivemind", "graph", "project"), "graph project dir path")
  assert(paths.graphProjectJson === join(tmpDir, ".hivemind", "graph", "project", "project.json"), "graph project.json path")
  assert(paths.graphProjectRequirementsDir === join(tmpDir, ".hivemind", "graph", "project", "requirements"), "graph project requirements dir path")
  assert(paths.graphProjectRoadmapDir === join(tmpDir, ".hivemind", "graph", "project", "roadmap"), "graph project roadmap dir path")
  assert(paths.graphProjectResearchDir === join(tmpDir, ".hivemind", "graph", "project", "research"), "graph project research dir path")
  assert(paths.graphProjectResearchArchitectureDir === join(tmpDir, ".hivemind", "graph", "project", "research", "architecture"), "graph project research architecture dir path")
  assert(paths.graphProjectResearchStacksDir === join(tmpDir, ".hivemind", "graph", "project", "research", "stacks"), "graph project research stacks dir path")
  assert(paths.graphProjectResearchPatternsDir === join(tmpDir, ".hivemind", "graph", "project", "research", "patterns"), "graph project research patterns dir path")
  assert(paths.graphProjectResearchPitfallsDir === join(tmpDir, ".hivemind", "graph", "project", "research", "pitfalls"), "graph project research pitfalls dir path")
  assert(paths.graphProjectResearchContextDir === join(tmpDir, ".hivemind", "graph", "project", "research", "context"), "graph project research context dir path")
  assert(paths.graphProjectResearchSummaryDir === join(tmpDir, ".hivemind", "graph", "project", "research", "summary"), "graph project research summary dir path")

  // Governance SOT (Level 0)
  assert(paths.codemapDir === join(tmpDir, ".hivemind", "codemap"), "codemapDir path")
  assert(paths.codemapManifest === join(tmpDir, ".hivemind", "codemap", "manifest.json"), "codemap manifest path")
  assert(paths.codemapJson === join(tmpDir, ".hivemind", "codemap", "codemap.json"), "codemap.json path")
  assert(paths.compressedCodemapJson === join(tmpDir, ".hivemind", "codemap", "compressed-codemap.json"), "compressed codemap path")
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

  // Legacy structure is still detectable for explicit migration tooling.
  const hivemindDir = join(tmpDir, ".hivemind")
  await mkdir(hivemindDir, { recursive: true })
  await writeFile(join(hivemindDir, "brain.json"), "{}")
  assert(isLegacyStructure(tmpDir), "brain.json at root = legacy")

  // Adding state/ marks new structure and disables legacy detection
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
  assert(name === "session-phase-03-hivemind-reorg.md", "date-like seed falls back to trajectory slug")

  // Date object
  const dateObj = new Date("2026-01-15T10:30:00Z")
  const name2 = buildSessionFilename(dateObj, "quick_fix", "Fix bug")
  assert(name2 === "session-fix-bug.md", "Date object input uses trajectory slug")

  // ISO timestamp string
  const name3 = buildSessionFilename("2026-03-20T14:00:00Z", "exploration", "Research API")
  assert(name3 === "session-research-api.md", "ISO timestamp input uses trajectory slug")

  // Empty trajectory falls back to "session"
  const name4 = buildSessionFilename("2026-02-13", "plan_driven", "")
  assert(name4 === "session-session.md", "empty trajectory fallback")

  const uuidName = buildSessionFilename("f18b3c3a-6f3b-4ff0-a8ef-1d7cc0f6da7a", "plan_driven", "Ignored")
  assert(uuidName === "session-f18b3c3a-6f3b-4ff0-a8ef-1d7cc0f6da7a.md", "uuid seed is used directly")
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
  assert(dirs.length === 44, "44 directories in structure")
  assert(dirs[0] === join(tmpDir, ".hivemind"), "root is first")
  assert(dirs.includes(join(tmpDir, ".hivemind", "project")), "includes project/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "project", "planning")), "includes project/planning/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "project", "planning", "research")), "includes project/planning/research/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "project", "planning", "todos")), "includes project/planning/todos/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "project", "planning", "debug")), "includes project/planning/debug/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "project", "planning", "codebase")), "includes project/planning/codebase/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "project", "planning", "phases")), "includes project/planning/phases/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "state")), "includes state/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "memory")), "includes memory/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "system")), "includes system/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions")), "includes sessions/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions", "active")), "includes sessions/active/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions", "runtime")), "includes sessions/runtime/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions", "archive")), "includes sessions/archive/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "sessions", "archive", "exports")), "includes sessions/archive/exports/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "plans")), "includes plans/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph")), "includes graph/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "codebase")), "includes graph/codebase/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "codebase", "codewiki")), "includes graph/codebase/codewiki/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "codebase", "codemap")), "includes graph/codebase/codemap/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "codebase", "code-intel")), "includes graph/codebase/code-intel/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "codebase", "repoknowledge")), "includes graph/codebase/repoknowledge/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project")), "includes graph/project/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "requirements")), "includes graph/project/requirements/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "roadmap")), "includes graph/project/roadmap/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "research")), "includes graph/project/research/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "research", "architecture")), "includes graph/project/research/architecture/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "research", "stacks")), "includes graph/project/research/stacks/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "research", "patterns")), "includes graph/project/research/patterns/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "research", "pitfalls")), "includes graph/project/research/pitfalls/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "research", "context")), "includes graph/project/research/context/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "graph", "project", "research", "summary")), "includes graph/project/research/summary/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "codemap")), "includes codemap/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "codewiki")), "includes codewiki/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "plans", "templates")), "includes plans/templates/")
  assert(dirs.includes(join(tmpDir, ".hivemind", "workflows")), "includes workflows/")
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
