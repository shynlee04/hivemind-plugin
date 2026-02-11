/**
 * Round 4 Mems Tests — Persistence, CRUD, Search, Prompt Formatting
 *
 * 20 assertions:
 *   Persistence + CRUD (10): load, add, unique ID, tags, remove, remove no-op, roundtrip, ID format, ID uniqueness, shelf summary
 *   Search (6): content match, tag match, shelf filter, no match, newest first, getMemsByShelf
 *   Prompt formatting (4): empty, count+breakdown, recall_mems suggestion, multiple shelves
 */

import { mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  loadMems,
  saveMems,
  addMem,
  removeMem,
  searchMems,
  getMemsByShelf,
  getShelfSummary,
  formatMemsForPrompt,
  generateMemId,
} from "../src/lib/mems.js"
import type { MemsState } from "../src/lib/mems.js"

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

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "hm-r4-"))
}

function cleanTmpDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true })
  } catch { /* ignore */ }
}

// ─── Helper: build state with controlled timestamps ──────────────────

function makeMemState(entries: Array<{ shelf: string; content: string; tags: string[]; created_at: number }>): MemsState {
  const mems = entries.map((e, i) => ({
    id: `mem_${e.created_at}_test${i}`,
    shelf: e.shelf,
    content: e.content,
    tags: e.tags,
    session_id: "test-session",
    created_at: e.created_at,
  }))
  return { mems, version: "1.0.0" }
}

// ─── Persistence + CRUD (10 assertions) ──────────────────────────────

async function test_persistence() {
  process.stderr.write("\n--- mems: persistence + CRUD ---\n")

  const tmpDir = makeTmpDir()
  try {
    // 1. loadMems returns empty state for new project
    const state = await loadMems(tmpDir)
    assert(
      state.mems.length === 0 && state.version === "1.0.0",
      "loadMems returns empty state for new project"
    )

    // 2. addMem adds to state
    const s2 = addMem(state, "decisions", "Use PostgreSQL for data layer", ["db", "postgres"], "sess-001")
    assert(
      s2.mems.length === 1 && s2.mems[0].content === "Use PostgreSQL for data layer",
      "addMem adds to state"
    )

    // 3. addMem generates unique ID (starts with "mem_")
    assert(
      s2.mems[0].id.startsWith("mem_"),
      'addMem generates unique ID (starts with "mem_")'
    )

    // 4. addMem preserves tags
    assert(
      s2.mems[0].tags.length === 2 && s2.mems[0].tags[0] === "db" && s2.mems[0].tags[1] === "postgres",
      "addMem preserves tags"
    )

    // 5. removeMem removes by ID
    const s3 = addMem(s2, "errors", "OOM on large batch", ["memory"], "sess-001")
    const s4 = removeMem(s3, s3.mems[0].id)
    assert(
      s4.mems.length === 1 && s4.mems[0].shelf === "errors",
      "removeMem removes by ID"
    )

    // 6. removeMem no-ops for unknown ID (same length)
    const s5 = removeMem(s4, "mem_nonexistent_0000")
    assert(
      s5.mems.length === s4.mems.length,
      "removeMem no-ops for unknown ID (same length)"
    )

    // 7. saveMems + loadMems roundtrip
    const saveState = addMem(
      addMem({ mems: [], version: "1.0.0" }, "patterns", "Use factory pattern", ["design"], "sess-1"),
      "solutions", "Cache invalidation via TTL", ["cache"], "sess-1"
    )
    await saveMems(tmpDir, saveState)
    const loaded = await loadMems(tmpDir)
    assert(
      loaded.mems.length === 2 &&
      loaded.mems[0].shelf === "patterns" &&
      loaded.mems[1].shelf === "solutions",
      "saveMems + loadMems roundtrip"
    )

    // 8. generateMemId format matches /^mem_\d+_[a-z0-9]{4}$/
    const id = generateMemId()
    assert(
      /^mem_\d+_[a-z0-9]{4}$/.test(id),
      "generateMemId format matches /^mem_\\d+_[a-z0-9]{4}$/"
    )

    // 9. generateMemId generates unique IDs (2 calls differ)
    const id1 = generateMemId()
    const id2 = generateMemId()
    assert(
      id1 !== id2,
      "generateMemId generates unique IDs (2 calls differ)"
    )

    // 10. getShelfSummary counts correctly
    const multiState = addMem(
      addMem(
        addMem({ mems: [], version: "1.0.0" }, "decisions", "d1", [], "s"),
        "decisions", "d2", [], "s"
      ),
      "errors", "e1", [], "s"
    )
    const summary = getShelfSummary(multiState)
    assert(
      summary["decisions"] === 2 && summary["errors"] === 1,
      "getShelfSummary counts correctly"
    )
  } finally {
    cleanTmpDir(tmpDir)
  }
}

// ─── Search (6 assertions) ───────────────────────────────────────────

async function test_search() {
  process.stderr.write("\n--- mems: search ---\n")

  // Build a state with controlled timestamps for ordering tests
  const state = makeMemState([
    { shelf: "decisions", content: "Use PostgreSQL for persistence", tags: ["db"], created_at: 1000 },
    { shelf: "errors", content: "Memory leak in worker threads", tags: ["memory", "leak"], created_at: 2000 },
    { shelf: "decisions", content: "Adopt TypeScript strict mode", tags: ["typescript", "config"], created_at: 3000 },
    { shelf: "patterns", content: "Repository pattern for data access", tags: ["design", "db"], created_at: 4000 },
  ])

  // 11. searchMems matches content substring (case-insensitive)
  const r1 = searchMems(state, "POSTGRESQL")
  assert(
    r1.length === 1 && r1[0].content.includes("PostgreSQL"),
    "searchMems matches content substring (case-insensitive)"
  )

  // 12. searchMems matches tags
  const r2 = searchMems(state, "leak")
  assert(
    r2.length === 1 && r2[0].shelf === "errors",
    "searchMems matches tags"
  )

  // 13. searchMems filters by shelf
  const r3 = searchMems(state, "db", "decisions")
  assert(
    r3.length === 1 && r3[0].shelf === "decisions",
    "searchMems filters by shelf"
  )

  // 14. searchMems returns empty for no match
  const r4 = searchMems(state, "nonexistent_xyz_query")
  assert(
    r4.length === 0,
    "searchMems returns empty for no match"
  )

  // 15. searchMems returns newest first (check order)
  const r5 = searchMems(state, "db")
  assert(
    r5.length === 2 && r5[0].created_at > r5[1].created_at,
    "searchMems returns newest first (check order)"
  )

  // 16. getMemsByShelf filters correctly
  const r6 = getMemsByShelf(state, "decisions")
  assert(
    r6.length === 2 && r6.every(m => m.shelf === "decisions"),
    "getMemsByShelf filters correctly"
  )
}

// ─── Prompt Formatting (4 assertions) ─────────────────────────────────

async function test_formatting() {
  process.stderr.write("\n--- mems: prompt formatting ---\n")

  // 17. formatMemsForPrompt returns empty string for 0 mems
  const empty: MemsState = { mems: [], version: "1.0.0" }
  assert(
    formatMemsForPrompt(empty) === "",
    "formatMemsForPrompt returns empty string for 0 mems"
  )

  // 18. formatMemsForPrompt shows count and shelf breakdown
  const single = addMem({ mems: [], version: "1.0.0" }, "decisions", "Use REST", [], "s")
  const fmt1 = formatMemsForPrompt(single)
  assert(
    fmt1.includes("1 memories") && fmt1.includes("decisions(1)"),
    "formatMemsForPrompt shows count and shelf breakdown"
  )

  // 19. formatMemsForPrompt includes "recall_mems" suggestion
  assert(
    fmt1.includes("recall_mems"),
    'formatMemsForPrompt includes "recall_mems" suggestion'
  )

  // 20. formatMemsForPrompt handles multiple shelves
  const multi = addMem(
    addMem(
      addMem({ mems: [], version: "1.0.0" }, "decisions", "d1", [], "s"),
      "errors", "e1", [], "s"
    ),
    "errors", "e2", [], "s"
  )
  const fmt2 = formatMemsForPrompt(multi)
  assert(
    fmt2.includes("3 memories") && fmt2.includes("decisions(1)") && fmt2.includes("errors(2)"),
    "formatMemsForPrompt handles multiple shelves"
  )
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Round 4 Mems Tests ===\n")

  await test_persistence()
  await test_search()
  await test_formatting()

  process.stderr.write(`\n=== Round 4: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
