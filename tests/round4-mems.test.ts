/**
 * Round 4 Mems Tests — Persistence, CRUD, Search, Prompt Formatting, Tool Tests
 *
 * 34 assertions:
 *   Persistence + CRUD (10): load, add, unique ID, tags, remove, remove no-op, roundtrip, ID format, ID uniqueness, shelf summary
 *   Search (6): content match, tag match, shelf filter, no match, newest first, getMemsByShelf
 *   Prompt formatting (4): empty, count+breakdown, recall_mems suggestion, multiple shelves
 *   save_mem tool (5): saves to mems.json, tags stored, confirmation message, unique IDs, survives compaction
 *   list_shelves tool (3): empty message, shelf counts, recent memories
 *   recall_mems tool (6): empty message, content match, tag match, no match, shelf filter, cap at 5
 */

import { mkdtempSync, rmSync, existsSync } from "fs"
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
import { createSaveMemTool } from "../src/tools/save-mem.js"
import { createListShelvesTool } from "../src/tools/list-shelves.js"
import { createRecallMemsTool } from "../src/tools/recall-mems.js"
import { createCompactSessionTool } from "../src/tools/compact-session.js"
import { createDeclareIntentTool } from "../src/tools/declare-intent.js"
import { createSessionLifecycleHook } from "../src/hooks/session-lifecycle.js"
import { createCompactionHook } from "../src/hooks/compaction.js"
import { createLogger } from "../src/lib/logging.js"
import { loadConfig } from "../src/lib/persistence.js"
import { initProject } from "../src/cli/init.js"
import { createStateManager } from "../src/lib/persistence.js"
import { createBrainState } from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"

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

// ─── save_mem Tool (5 assertions) ─────────────────────────────────────

async function test_saveMemTool() {
  process.stderr.write("\n--- save_mem: tool tests ---\n")

  // 1. save_mem saves to mems.json (existsSync check)
  const tmpDir1 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-mem-test-1", config)
    const stateManager = createStateManager(tmpDir1)
    await stateManager.save(brainState)

    const tool = createSaveMemTool(tmpDir1)
    await tool.execute({ shelf: "decisions", content: "Use PostgreSQL for persistence" })

    const memsPath = join(tmpDir1, ".hivemind", "mems.json")
    assert(
      existsSync(memsPath),
      "save_mem saves to mems.json"
    )
  } finally {
    cleanTmpDir(tmpDir1)
  }

  // 2. save_mem with tags stores tag array
  const tmpDir2 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-mem-test-2", config)
    const stateManager = createStateManager(tmpDir2)
    await stateManager.save(brainState)

    const tool = createSaveMemTool(tmpDir2)
    await tool.execute({ shelf: "errors", content: "OOM on large batch", tags: "memory,leak" })

    const loaded = await loadMems(tmpDir2)
    assert(
      loaded.mems.length === 1 && loaded.mems[0].tags.length === 2 && loaded.mems[0].tags[0] === "memory" && loaded.mems[0].tags[1] === "leak",
      "save_mem with tags stores tag array"
    )
  } finally {
    cleanTmpDir(tmpDir2)
  }

  // 3. save_mem returns confirmation with shelf and count
  const tmpDir3 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-mem-test-3", config)
    const stateManager = createStateManager(tmpDir3)
    await stateManager.save(brainState)

    const tool = createSaveMemTool(tmpDir3)
    const result = await tool.execute({ shelf: "decisions", content: "Use REST API" })

    assert(
      result.includes("[decisions]") && result.includes("total memories"),
      "save_mem returns confirmation with shelf and count"
    )
  } finally {
    cleanTmpDir(tmpDir3)
  }

  // 4. save_mem assigns unique IDs (save 2, load, check IDs differ)
  const tmpDir4 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-mem-test-4", config)
    const stateManager = createStateManager(tmpDir4)
    await stateManager.save(brainState)

    const tool = createSaveMemTool(tmpDir4)
    await tool.execute({ shelf: "decisions", content: "First decision" })
    await tool.execute({ shelf: "decisions", content: "Second decision" })

    const loaded = await loadMems(tmpDir4)
    assert(
      loaded.mems.length === 2 && loaded.mems[0].id !== loaded.mems[1].id,
      "save_mem assigns unique IDs"
    )
  } finally {
    cleanTmpDir(tmpDir4)
  }

  // 5. mems survive session compaction (save mem → overwrite brain state → load mems → still there)
  const tmpDir5 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("save-mem-test-5", config)
    const stateManager = createStateManager(tmpDir5)
    await stateManager.save(brainState)

    const tool = createSaveMemTool(tmpDir5)
    await tool.execute({ shelf: "patterns", content: "Factory pattern for services" })

    // Simulate compaction by overwriting brain state
    const newBrain = createBrainState("new-session-after-compact", config)
    await stateManager.save(newBrain)

    const loaded = await loadMems(tmpDir5)
    assert(
      loaded.mems.length === 1 && loaded.mems[0].content === "Factory pattern for services",
      "mems survive session compaction"
    )
  } finally {
    cleanTmpDir(tmpDir5)
  }
}

// ─── list_shelves Tool (3 assertions) ──────────────────────────────────

async function test_listShelvesTool() {
  process.stderr.write("\n--- list_shelves: tool tests ---\n")

  // 6. list_shelves returns empty message for no mems
  const tmpDir1 = makeTmpDir()
  try {
    const tool = createListShelvesTool(tmpDir1)
    const result = await tool.execute({})

    assert(
      result.includes("Mems Brain is empty"),
      "list_shelves returns empty message for no mems"
    )
  } finally {
    cleanTmpDir(tmpDir1)
  }

  // 7. list_shelves shows shelf counts
  const tmpDir2 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("list-shelves-test-2", config)
    const stateManager = createStateManager(tmpDir2)
    await stateManager.save(brainState)

    const saveTool = createSaveMemTool(tmpDir2)
    await saveTool.execute({ shelf: "decisions", content: "Decision 1" })
    await saveTool.execute({ shelf: "decisions", content: "Decision 2" })
    await saveTool.execute({ shelf: "errors", content: "Error 1" })

    const listTool = createListShelvesTool(tmpDir2)
    const result = await listTool.execute({})

    assert(
      result.includes("decisions: 2") && result.includes("errors: 1"),
      "list_shelves shows shelf counts"
    )
  } finally {
    cleanTmpDir(tmpDir2)
  }

  // 8. list_shelves shows recent memories (includes content preview)
  const tmpDir3 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("list-shelves-test-3", config)
    const stateManager = createStateManager(tmpDir3)
    await stateManager.save(brainState)

    const saveTool = createSaveMemTool(tmpDir3)
    await saveTool.execute({ shelf: "solutions", content: "Cache invalidation via TTL" })

    const listTool = createListShelvesTool(tmpDir3)
    const result = await listTool.execute({})

    assert(
      result.includes("Cache invalidation via TTL"),
      "list_shelves shows recent memories"
    )
  } finally {
    cleanTmpDir(tmpDir3)
  }
}

// ─── recall_mems Tool (6 assertions) ───────────────────────────────────

async function test_recallMemsTool() {
  process.stderr.write("\n--- recall_mems: tool tests ---\n")

  // 9. recall_mems returns empty message when no mems
  const tmpDir1 = makeTmpDir()
  try {
    const tool = createRecallMemsTool(tmpDir1)
    const result = await tool.execute({ query: "anything" })

    assert(
      result.includes("empty"),
      "recall_mems returns empty message when no mems"
    )
  } finally {
    cleanTmpDir(tmpDir1)
  }

  // 10. recall_mems finds matching content
  const tmpDir2 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("recall-test-2", config)
    const stateManager = createStateManager(tmpDir2)
    await stateManager.save(brainState)

    const saveTool = createSaveMemTool(tmpDir2)
    await saveTool.execute({ shelf: "decisions", content: "Use PostgreSQL for persistence" })
    await saveTool.execute({ shelf: "errors", content: "Redis connection timeout" })

    const recallTool = createRecallMemsTool(tmpDir2)
    const result = await recallTool.execute({ query: "PostgreSQL" })

    assert(
      result.includes("PostgreSQL") && result.includes("1 memories found"),
      "recall_mems finds matching content"
    )
  } finally {
    cleanTmpDir(tmpDir2)
  }

  // 11. recall_mems finds matching tags
  const tmpDir3 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("recall-test-3", config)
    const stateManager = createStateManager(tmpDir3)
    await stateManager.save(brainState)

    const saveTool = createSaveMemTool(tmpDir3)
    await saveTool.execute({ shelf: "errors", content: "OOM on large batch", tags: "memory,leak" })

    const recallTool = createRecallMemsTool(tmpDir3)
    const result = await recallTool.execute({ query: "leak" })

    assert(
      result.includes("OOM on large batch"),
      "recall_mems finds matching tags"
    )
  } finally {
    cleanTmpDir(tmpDir3)
  }

  // 12. recall_mems returns no-match message for unknown query
  const tmpDir4 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("recall-test-4", config)
    const stateManager = createStateManager(tmpDir4)
    await stateManager.save(brainState)

    const saveTool = createSaveMemTool(tmpDir4)
    await saveTool.execute({ shelf: "decisions", content: "Use REST API" })

    const recallTool = createRecallMemsTool(tmpDir4)
    const result = await recallTool.execute({ query: "nonexistent_xyz_query" })

    assert(
      result.includes("No memories found"),
      "recall_mems returns no-match message for unknown query"
    )
  } finally {
    cleanTmpDir(tmpDir4)
  }

  // 13. recall_mems filters by shelf when provided
  const tmpDir5 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("recall-test-5", config)
    const stateManager = createStateManager(tmpDir5)
    await stateManager.save(brainState)

    const saveTool = createSaveMemTool(tmpDir5)
    await saveTool.execute({ shelf: "decisions", content: "Use PostgreSQL db" })
    await saveTool.execute({ shelf: "errors", content: "Database db connection lost" })

    const recallTool = createRecallMemsTool(tmpDir5)
    const result = await recallTool.execute({ query: "db", shelf: "decisions" })

    assert(
      result.includes("1 memories found") && result.includes("PostgreSQL"),
      "recall_mems filters by shelf when provided"
    )
  } finally {
    cleanTmpDir(tmpDir5)
  }

  // 14. recall_mems caps results at 5 (save 7 matching mems, search, output includes "and 2 more")
  const tmpDir6 = makeTmpDir()
  try {
    const config = createConfig({ governance_mode: "assisted" })
    const brainState = createBrainState("recall-test-6", config)
    const stateManager = createStateManager(tmpDir6)
    await stateManager.save(brainState)

    const saveTool = createSaveMemTool(tmpDir6)
    for (let i = 0; i < 7; i++) {
      await saveTool.execute({ shelf: "patterns", content: `Pattern match item ${i}` })
    }

    const recallTool = createRecallMemsTool(tmpDir6)
    const result = await recallTool.execute({ query: "Pattern match" })

    assert(
      result.includes("7 memories found") && result.includes("and 2 more"),
      "recall_mems caps results at 5"
    )
  } finally {
    cleanTmpDir(tmpDir6)
  }
}

// ─── Hook Integrations (6 assertions) ──────────────────────────────────

async function test_hookIntegrations() {
  process.stderr.write("\n--- hook integrations: mems brain ---\n")

  // Assertions 1-3: compact_session auto-saves context mem
  const dir = makeTmpDir()
  try {
    await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool = createDeclareIntentTool(dir)
    await declareIntentTool.execute({ mode: "plan_driven", focus: "Auto-mem test" })
    const compactSessionTool = createCompactSessionTool(dir)
    await compactSessionTool.execute({ summary: "Tested auto-mem feature" })
    const mems = await loadMems(dir)

    assert(
      mems.mems.length >= 1,
      "compact_session auto-saves context mem"
    )
    assert(
      mems.mems[mems.mems.length - 1].shelf === "context",
      'auto-saved mem has shelf "context"'
    )
    assert(
      mems.mems[mems.mems.length - 1].tags.includes("auto-compact"),
      'auto-saved mem has "auto-compact" tag'
    )
  } finally {
    cleanTmpDir(dir)
  }

  // Assertions 4-5: system prompt uses <hivemind> tag (mems no longer injected)
  const dir2 = makeTmpDir()
  try {
    await initProject(dir2, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool2 = createDeclareIntentTool(dir2)
    await declareIntentTool2.execute({ mode: "plan_driven", focus: "Mems prompt test" })
    const saveMemTool = createSaveMemTool(dir2)
    await saveMemTool.execute({ shelf: "decisions", content: "Use PostgreSQL" })

    const config = await loadConfig(dir2)
    const logger = await createLogger(dir2, "test")
    const hook = createSessionLifecycleHook(logger, dir2, config)
    const output = { system: [] as string[] }
    await hook({ sessionID: "test-session" }, output)
    const systemText = output.system.join("\n")

    assert(
      systemText.includes("<hivemind>"),
      "system prompt includes <hivemind> tag after save_mem"
    )
    assert(
      systemText.includes("Session:") && systemText.includes("Turns:"),
      'system prompt includes session status and metrics'
    )
  } finally {
    cleanTmpDir(dir2)
  }

  // Assertion 6: compaction context includes mems count
  const dir3 = makeTmpDir()
  try {
    await initProject(dir3, { governanceMode: "assisted", language: "en", silent: true })
    const declareIntentTool3 = createDeclareIntentTool(dir3)
    await declareIntentTool3.execute({ mode: "plan_driven", focus: "Compaction mems test" })
    const saveMemTool3 = createSaveMemTool(dir3)
    await saveMemTool3.execute({ shelf: "errors", content: "Port conflict on 3000" })

    const logger = await createLogger(dir3, "test")
    const compactionHook = createCompactionHook(logger, dir3)
    const stateManager = createStateManager(dir3)
    const state = await stateManager.load()
    const output = { context: [] as string[] }
    await compactionHook({ sessionID: state!.session.id }, output)
    const contextText = output.context.join("\n")

    assert(
      contextText.includes("Mems Brain") && contextText.includes("recall_mems"),
      "mems count shown after compaction context injection"
    )
  } finally {
    cleanTmpDir(dir3)
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Round 4 Mems Tests ===\n")

  await test_persistence()
  await test_search()
  await test_formatting()
  await test_saveMemTool()
  await test_listShelvesTool()
  await test_recallMemsTool()
  await test_hookIntegrations()

  process.stderr.write(`\n=== Round 4: ${passed} passed, ${failed_} failed ===\n`)
  process.exit(failed_ > 0 ? 1 : 0)
}

main()
