import { afterEach, beforeEach, describe, it } from "node:test"
import assert from "node:assert/strict"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import {
  addChild,
  createNode,
  createTree,
  detectGaps,
  saveTree,
  setRoot,
  type TimestampGap,
} from "../src/lib/hierarchy-tree.js"
import { deepInspect } from "../src/lib/inspect-engine.js"
import { createHivemindSessionTool } from "../src/tools/hivemind-session.js"

type ToolResult = {
  status: "success" | "error"
  error?: string
}

function parseToolResult(raw: unknown): ToolResult {
  if (typeof raw !== "string") {
    assert.fail("tool returns JSON string")
  }
  return JSON.parse(raw) as ToolResult
}

describe("Wave 2: Gap Linter + Hierarchy Enforcer", () => {
  let directory = ""

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "hm-wave2-red-"))
    await initProject(directory, { governanceMode: "assisted", language: "en", silent: true })
  })

  afterEach(async () => {
    if (directory) {
      await rm(directory, { recursive: true, force: true })
    }
  })

  it("addChild rejects invalid level transition trajectory -> action", () => {
    const tree = setRoot(createTree(), createNode("trajectory", "Root trajectory", "active", new Date(2026, 1, 20, 9, 0)))
    const orphanAction = createNode("action", "Action without tactic", "active", new Date(2026, 1, 20, 9, 5))

    const result = addChild(tree, tree.root!.id, orphanAction)

    assert.equal(result.success, false, "expected: invalid level should be rejected at creation")
    assert.equal(result.error, "INVALID_LEVEL", "expected: invalid parent/child level returns INVALID_LEVEL")
    assert.equal(result.tree.root?.children.length, 0, "expected: tree remains unchanged on invalid transition")
  })

  it("addChild rejects invalid level transition tactic -> trajectory", () => {
    const root = createNode("trajectory", "Root", "active", new Date(2026, 1, 20, 10, 0))
    const tactic = createNode("tactic", "Valid tactic", "active", new Date(2026, 1, 20, 10, 2))

    const withTactic = addChild(setRoot(createTree(), root), root.id, tactic)
    assert.equal(withTactic.success, true, "precondition: root -> tactic is valid")

    const invalidTrajectory = createNode("trajectory", "Nested trajectory", "active", new Date(2026, 1, 20, 10, 4))
    const invalidAdd = addChild(withTactic.tree, tactic.id, invalidTrajectory)

    assert.equal(invalidAdd.success, false, "expected: hierarchy enforcer rejects tactic -> trajectory")
    assert.equal(invalidAdd.error, "INVALID_LEVEL", "expected: invalid parent level returns INVALID_LEVEL")
  })

  it("detectGaps supports configurable thresholds for linter severity", () => {
    const root = createNode("trajectory", "Root", "active", new Date(2026, 1, 20, 11, 0))
    const tacticA = createNode("tactic", "A", "active", new Date(2026, 1, 20, 11, 1))
    const tacticB = createNode("tactic", "B", "active", new Date(2026, 1, 20, 11, 46))

    const rooted = setRoot(createTree(), root)
    const first = addChild(rooted, root.id, tacticA)
    assert.equal(first.success, true, "precondition: first tactic added")
    const second = addChild(first.tree, root.id, tacticB)
    assert.equal(second.success, true, "precondition: second tactic added")

    const gaps = detectGaps(second.tree, {
      healthyMs: 5 * 60 * 1000,
      warmMs: 30 * 60 * 1000,
    }) as TimestampGap[]

    const siblingGap = gaps.find((gap) => gap.relationship === "sibling")
    assert(siblingGap, "precondition: sibling gap exists")
    assert.equal(
      siblingGap.severity,
      "stale",
      "expected: 45min sibling gap should lint stale under custom warm=30min threshold",
    )
  })

  it("deep inspect staleGaps includes explicit current-gap lint entry", async () => {
    const sessionTool = createHivemindSessionTool(directory)
    const startResult = parseToolResult(
      await sessionTool.execute(
        { action: "start", mode: "plan_driven", focus: "Wave 2 current-gap lint path" },
        {} as any,
      ),
    )
    assert(
      startResult.status === "success" || startResult.error === "session already active",
      "precondition: start succeeds or session already active",
    )

    const oldRoot = createNode("trajectory", "Old focus", "active", new Date(2026, 0, 1, 0, 0, 0))
    const tree = setRoot(createTree(), oldRoot)
    await saveTree(directory, tree)

    const report = await deepInspect(directory, "session")
    assert(report.active, "precondition: inspect is active")
    const currentGapEntry = report.staleGaps?.find((gap) => gap.relationship === "current-gap")
    assert(
      currentGapEntry,
      "expected: linter path should surface explicit current-gap stale lint entry",
    )
  })
})
