import { describe, it } from "node:test"
import { strict as assert } from "node:assert"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"

import {
  dedupeContextLines,
  purifyContextFragments,
} from "../src/lib/context-purifier.js"
import {
  classifySessionMemoryArtifact,
  SESSION_MEMORY_CATEGORIES,
} from "../src/lib/session-memory-classifier.js"
import {
  applyVerifiedPendingChange,
  ensureSotGovernanceFiles,
  markPendingChangeStale,
  queuePendingChange,
  verifyPendingChange,
} from "../src/lib/sot-governance.js"
import {
  createBrainState,
  recordConsolidationAndPurge,
  unlockSession,
} from "../src/schemas/brain-state.js"
import { createConfig } from "../src/schemas/config.js"
import {
  detectV29OutputStyleSelection,
  generateFirstTurnConfirmationBlock,
  getV29OutputStyleDirective,
} from "../src/hooks/session-lifecycle-helpers.js"
import { updateSession } from "../src/lib/session-engine.js"
import { createStateManager } from "../src/lib/persistence.js"

describe("v2.9 context governance", () => {
  it("first-turn contract includes 3 rationale options + style selector", () => {
    const block = generateFirstTurnConfirmationBlock("en")
    assert.ok(block.includes("Option 1"))
    assert.ok(block.includes("Option 2"))
    assert.ok(block.includes("Option 3"))
    assert.ok(block.includes("Style 1"))
    assert.ok(block.includes("Style 4"))
  })

  it("output style routing is deterministic", () => {
    const architecture = getV29OutputStyleDirective("architecture_planning")
    const execution = getV29OutputStyleDirective("execution_oriented")

    assert.ok(architecture.includes("schema contracts"))
    assert.ok(execution.includes("ready-to-run steps"))
    assert.equal(
      detectV29OutputStyleSelection("please use Style 3 for this session"),
      "problem_solving_debugging"
    )
  })

  it("dedupe blocks repeated equivalent context", () => {
    const deduped = dedupeContextLines([
      "A stable context block",
      "a stable   context block",
      "Fresh payload",
    ])

    assert.equal(deduped.deduped_count, 1)
    assert.deepEqual(deduped.lines, ["A stable context block", "Fresh payload"])
  })

  it("consolidates then purges temporary payloads", () => {
    const purified = purifyContextFragments([
      { content: "handoff 1", temporary: true },
      { content: "handoff 2", temporary: true },
      { content: "handoff 2", temporary: true },
    ])

    assert.equal(purified.consolidated.length, 2)
    assert.equal(purified.deduped_count, 1)
    assert.equal(purified.purged_temporary_count, 3)

    const state = unlockSession(createBrainState(randomUUID(), createConfig()))
    const updated = recordConsolidationAndPurge(
      state,
      purified.consolidated.length,
      purified.purged_temporary_count
    )
    assert.equal(updated.memory_governance.temporary_exports_consolidated, 2)
    assert.equal(updated.memory_governance.temporary_exports_purged, 3)
  })

  it("classifies all seven memory categories", () => {
    const samples = [
      "brainstorm options and discuss alternatives",
      "research synthesis comparing references",
      "scan codebase and inspect where file is",
      "plan roadmap with acceptance criteria",
      "implement patch and refactor module",
      "debug root cause and repro error",
      "test validation gate with asserts",
    ]

    const categories = new Set(samples.map((content) => classifySessionMemoryArtifact({ content }).category))
    for (const category of SESSION_MEMORY_CATEGORIES) {
      assert.ok(categories.has(category), `expected category ${category}`)
    }
  })

  it("queues off-track updates to TODO-Pending instead of inline execution", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-v29-offtrack-"))
    try {
      const stateManager = createStateManager(dir)
      const config = createConfig()
      const state = unlockSession(createBrainState(randomUUID(), config))
      await stateManager.save(state)

      const result = await updateSession(dir, {
        level: "tactic",
        content: "Park this for later after this slice",
      })

      assert.equal(result.success, true)
      assert.equal(result.data.queuedOffTrack, true)

      const updated = await stateManager.load()
      assert.ok(updated)
      assert.equal(updated!.offtrack_todo_pending.length, 1)
      assert.equal(updated!.hierarchy.tactic, "")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("pending changes require verification, enforce chain integrity, and stale only terminal nodes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-v29-pending-"))
    try {
      await ensureSotGovernanceFiles(dir)

      const projectId = randomUUID()
      const a = await queuePendingChange(dir, {
        project_id: projectId,
        entity_type: "project",
        entity_id: "project-root",
        change_summary: "seed root",
        change_payload: { name: "root" },
        git_diff_signature: "diff-a",
        watcher_event_id: "watch-a",
        commit_hash: null,
      })

      const b = await queuePendingChange(dir, {
        project_id: projectId,
        entity_type: "research",
        entity_id: "research-node",
        change_summary: "research update",
        change_payload: { section: "architecture" },
        dependencies: [a.id],
        git_diff_signature: "diff-b",
        watcher_event_id: "watch-b",
        commit_hash: null,
      })

      const unverifiedApply = await applyVerifiedPendingChange(dir, a.id)
      assert.equal(unverifiedApply.applied, false)
      assert.equal(unverifiedApply.reason, "pending_change_not_verified")

      await verifyPendingChange(dir, {
        pending_change_id: a.id,
        status: "verified",
        git_diff_signature: "diff-a-verified",
        watcher_event_id: "watch-a-verified",
        commit_hash: "abc123",
      })
      await verifyPendingChange(dir, {
        pending_change_id: b.id,
        status: "verified",
        git_diff_signature: "diff-b-verified",
        watcher_event_id: "watch-b-verified",
        commit_hash: "def456",
      })

      const outOfOrder = await applyVerifiedPendingChange(dir, b.id)
      assert.equal(outOfOrder.applied, false)
      assert.equal(outOfOrder.reason, "dependency_chain_incomplete")

      const appliedA = await applyVerifiedPendingChange(dir, a.id)
      assert.equal(appliedA.applied, true)

      const appliedB = await applyVerifiedPendingChange(dir, b.id)
      assert.equal(appliedB.applied, true)

      const c = await queuePendingChange(dir, {
        project_id: projectId,
        entity_type: "roadmap",
        entity_id: "roadmap-root",
        change_summary: "roadmap",
        change_payload: { milestone: 1 },
        git_diff_signature: "diff-c",
        watcher_event_id: "watch-c",
        commit_hash: null,
      })
      const d = await queuePendingChange(dir, {
        project_id: projectId,
        entity_type: "roadmap",
        entity_id: "roadmap-child",
        change_summary: "roadmap child",
        change_payload: { milestone: 2 },
        dependencies: [c.id],
        git_diff_signature: "diff-d",
        watcher_event_id: "watch-d",
        commit_hash: null,
      })

      const nonTerminalStale = await markPendingChangeStale(dir, c.id)
      assert.equal(nonTerminalStale.stale, false)
      assert.equal(nonTerminalStale.reason, "only_terminal_node_can_be_marked_stale")

      const terminalStale = await markPendingChangeStale(dir, d.id)
      assert.equal(terminalStale.stale, true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
