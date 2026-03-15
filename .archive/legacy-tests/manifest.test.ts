/**
 * Manifest Layer Tests
 */

import { mkdtemp, readFile, rm } from "fs/promises"
import { existsSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import {
  createDefaultMemoryManifest,
  createDefaultPlanManifest,
  createDefaultRootManifest,
  createDefaultSessionManifest,
  deduplicateSessionManifest,
  ensureCoreManifests,
  getCoreMaterializationChain,
  linkSessionToPlan,
  readManifest,
  registerSessionInManifest,
  updateMemoryManifest,
  writeManifest,
  type MemoryManifest,
  type PlanManifest,
  type SessionManifest,
} from "../src/lib/manifest.js"
import { getHivemindPaths } from "../src/lib/paths.js"

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

let testDir: string

async function setup() {
  testDir = await mkdtemp(join(tmpdir(), "hivemind-manifest-test-"))
}

async function teardown() {
  await rm(testDir, { recursive: true, force: true })
}

function testCoreMaterializationChain() {
  process.stderr.write("\n--- Core chain ---\n")
  const chain = getCoreMaterializationChain()
  assert(chain.length === 5, "chain has 5 relation edges")
  assert(chain[0].from === "codemap" && chain[0].to === "plans", "codemap governs plans")
  assert(chain[1].from === "codewiki" && chain[1].to === "plans", "codewiki governs plans")
  assert(chain[4].from === "tasks" && chain[4].to === "sub_tasks", "tasks materialize sub_tasks")
}

function testDeduplicateSessionManifest() {
  process.stderr.write("\n--- Session dedup ---\n")

  const manifest: SessionManifest = {
    sessions: [
      { stamp: "111", file: "111-a.md", status: "archived", created: 1, linked_plans: ["p1"] },
      { stamp: "111", file: "111-b.md", status: "active", created: 1, linked_plans: ["p2"] },
      { stamp: "222", file: "222.md", status: "active", created: 2, linked_plans: [] },
    ],
    active_stamp: "222",
  }

  const deduped = deduplicateSessionManifest(manifest)
  assert(deduped.sessions.length === 2, "duplicate stamp collapsed")

  const s111 = deduped.sessions.find((s) => s.stamp === "111")
  assert(!!s111, "kept merged entry for stamp 111")
  assert(!!s111 && s111.linked_plans.length === 2, "linked plans merged and deduped")

  const active = deduped.sessions.filter((s) => s.status === "active")
  assert(active.length === 1, "exactly one active session remains")
  assert(deduped.active_stamp === "222", "active stamp preserved when valid")
}

function testRegisterSessionInManifest() {
  process.stderr.write("\n--- Register session ---\n")

  const base = createDefaultSessionManifest()
  const m1 = registerSessionInManifest(base, {
    stamp: "s1",
    file: "s1.md",
    created: 100,
  })
  assert(m1.sessions.length === 1, "first register creates one session")
  assert(m1.active_stamp === "s1", "first register sets active stamp")

  const m2 = registerSessionInManifest(m1, {
    stamp: "s2",
    file: "s2.md",
    created: 200,
  })
  assert(m2.sessions.length === 2, "second register appends second session")
  assert(m2.active_stamp === "s2", "second register sets new active stamp")

  const old = m2.sessions.find((s) => s.stamp === "s1")
  assert(!!old && old.status === "archived", "old active session archived")

  const m3 = registerSessionInManifest(m2, {
    stamp: "s2",
    file: "s2-renamed.md",
    created: 300,
    linked_plans: ["p-alpha"],
  })
  assert(m3.sessions.length === 2, "register same stamp updates, no duplicate")
  const s2 = m3.sessions.find((s) => s.stamp === "s2")
  assert(!!s2 && s2.file === "s2-renamed.md", "existing stamp gets updated file")
  assert(!!s2 && s2.linked_plans.includes("p-alpha"), "existing stamp updates linked plans")
}

function testLinkSessionToPlan() {
  process.stderr.write("\n--- Session-plan linking ---\n")

  const sessions: SessionManifest = {
    sessions: [
      { stamp: "s1", file: "s1.md", status: "active", created: 10, linked_plans: [] },
    ],
    active_stamp: "s1",
  }

  const plans: PlanManifest = {
    plans: [
      { id: "p1", type: "phase", status: "active", created: 1, slug: "phase-03", linked_sessions: [] },
    ],
  }

  const linked = linkSessionToPlan(sessions, plans, "s1", "p1")
  assert(linked.linked, "link operation reports success")
  assert(
    linked.sessionsManifest.sessions[0].linked_plans.includes("p1"),
    "session links to plan",
  )
  assert(
    linked.plansManifest.plans[0].linked_sessions.includes("s1"),
    "plan links to session",
  )

  // Idempotent linking
  const linkedTwice = linkSessionToPlan(
    linked.sessionsManifest,
    linked.plansManifest,
    "s1",
    "p1",
  )
  assert(linkedTwice.sessionsManifest.sessions[0].linked_plans.length === 1, "session link is deduped")
  assert(linkedTwice.plansManifest.plans[0].linked_sessions.length === 1, "plan link is deduped")
}

function testUpdateMemoryManifest() {
  process.stderr.write("\n--- Memory sync ---\n")

  const memManifest: MemoryManifest = createDefaultMemoryManifest()
  const updated = updateMemoryManifest(memManifest, {
    mems: [
      { shelf: "decisions", created_at: 100 },
      { shelf: "decisions", created_at: 120 },
      { shelf: "patterns", created_at: 80 },
    ],
  })

  assert(updated.shelves.decisions.count === 2, "decisions count is synced")
  assert(updated.shelves.decisions.last_updated === 120, "decisions last_updated uses max")
  assert(updated.shelves.patterns.count === 1, "patterns count is synced")
}

async function testGenericReadWriteAndEnsure() {
  process.stderr.write("\n--- Generic CRUD + ensure ---\n")

  const paths = getHivemindPaths(testDir)
  await ensureCoreManifests(paths)

  assert(existsSync(paths.rootManifest), "root manifest created")
  assert(existsSync(paths.stateManifest), "state manifest created")
  assert(existsSync(paths.sessionsManifest), "sessions manifest created")
  assert(existsSync(paths.plansManifest), "plans manifest created")
  assert(existsSync(paths.memoryManifest), "memory manifest created")
  assert(existsSync(paths.codemapManifest), "codemap manifest created")
  assert(existsSync(paths.codewikiManifest), "codewiki manifest created")

  const root = await readManifest(paths.rootManifest, createDefaultRootManifest(paths))
  assert(root.structure_format === "2.0.0", "root manifest structure version is 2.0.0")
  assert(root.governance_sot.codemap.role === "source_of_truth", "codemap marked as SOT")
  assert(root.governance_sot.codewiki.role === "source_of_truth", "codewiki marked as SOT")
  assert(root.materialization_chain.length === 5, "root includes materialization chain")

  const customPlan = createDefaultPlanManifest()
  customPlan.plans.push({
    id: "p2",
    type: "research",
    status: "draft",
    created: Date.now(),
    slug: "research-flow",
    linked_sessions: [],
  })
  await writeManifest(paths.plansManifest, customPlan)
  const back = await readManifest(paths.plansManifest, createDefaultPlanManifest())
  assert(back.plans.length === 1 && back.plans[0].id === "p2", "generic write/read roundtrip works")

  const raw = await readFile(paths.plansManifest, "utf-8")
  assert(raw.includes("research-flow"), "written manifest is persisted to disk")
}

async function run() {
  process.stderr.write("\n=== manifest.test.ts ===\n")
  await setup()

  try {
    testCoreMaterializationChain()
    testDeduplicateSessionManifest()
    testRegisterSessionInManifest()
    testLinkSessionToPlan()
    testUpdateMemoryManifest()
    await testGenericReadWriteAndEnsure()
  } finally {
    await teardown()
  }

  process.stderr.write(`\n--- Results: ${passed} passed, ${failed_} failed ---\n`)
  if (failed_ > 0) {
    process.exit(1)
  }
}

run().catch((err: unknown) => {
  console.error("Test runner error:", err)
  process.exit(1)
})
