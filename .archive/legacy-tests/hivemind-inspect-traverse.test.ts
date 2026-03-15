import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { initProject } from "../src/cli/init.js"
import {
  addChild,
  createNode,
  createTree,
  findNode,
  saveTree,
  setRoot,
} from "../src/lib/hierarchy-tree.js"
import { createHivemindInspectTool } from "../src/tools/hivemind-inspect.js"

const mockContext = {
  sessionID: "test-session",
  messageID: "test-message",
  agent: "test-agent",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
}

async function buildTraverseFixture(dir: string) {
  let tree = createTree()
  const root = createNode("trajectory", "Build auth system")
  const tacticA = createNode("tactic", "JWT validation")
  const tacticB = createNode("tactic", "Session middleware")
  const actionA = createNode("action", "Write middleware tests")

  tree = setRoot(tree, root)
  const tacticAResult = addChild(tree, root.id, tacticA)
  assert.equal(tacticAResult.success, true)
  tree = tacticAResult.tree

  const actionResult = addChild(tree, tacticA.id, actionA)
  assert.equal(actionResult.success, true)
  tree = actionResult.tree

  const tacticBResult = addChild(tree, root.id, tacticB)
  assert.equal(tacticBResult.success, true)
  tree = tacticBResult.tree

  await saveTree(dir, tree)

  const actualRoot = tree.root!
  const actualTacticA = findNode(actualRoot, tacticAResult.tree.root!.children[0].id)!
  const actualActionA = findNode(actualRoot, actionResult.tree.cursor!)!
  const actualTacticB = findNode(actualRoot, tacticBResult.tree.cursor!)!

  return {
    tree,
    root: actualRoot,
    tacticA: actualTacticA,
    tacticB: actualTacticB,
    actionA: actualActionA,
  }
}

describe("hivemind_inspect traverse action", () => {
  it("traverses upward from the current cursor when node_id is omitted", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-traverse-up-"))
    try {
      await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
      const fixture = await buildTraverseFixture(dir)

      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute({ action: "traverse", direction: "up" }, mockContext)
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(parsed.metadata.focus_node_id, fixture.tacticB.id)
      assert.deepEqual(parsed.metadata.path, [fixture.root.id, fixture.tacticB.id])
      assert.deepEqual(
        parsed.metadata.nodes.map((node: { id: string }) => node.id),
        [fixture.tacticB.id, fixture.root.id],
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("traverses downward from a specific root node with depth limiting", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-traverse-down-"))
    try {
      await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
      const fixture = await buildTraverseFixture(dir)

      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute(
        { action: "traverse", node_id: fixture.root.id, direction: "down", depth: 1 },
        mockContext,
      )
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(parsed.metadata.focus_node_id, fixture.root.id)
      assert.deepEqual(parsed.metadata.path, [fixture.root.id])
      assert.deepEqual(
        parsed.metadata.nodes.map((node: { id: string }) => node.id),
        [fixture.root.id, fixture.tacticA.id, fixture.tacticB.id],
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("returns siblings for the selected focus node", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-traverse-siblings-"))
    try {
      await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
      const fixture = await buildTraverseFixture(dir)

      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute(
        { action: "traverse", node_id: fixture.tacticA.id, direction: "siblings" },
        mockContext,
      )
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(parsed.metadata.focus_node_id, fixture.tacticA.id)
      assert.deepEqual(parsed.metadata.path, [fixture.root.id, fixture.tacticA.id])
      assert.deepEqual(
        parsed.metadata.nodes.map((node: { id: string }) => node.id),
        [fixture.tacticB.id],
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("returns a clean structured success payload when the tree is empty", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-traverse-empty-"))
    try {
      await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })

      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute({ action: "traverse", direction: "down" }, mockContext)
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(parsed.metadata.focus_node_id, null)
      assert.deepEqual(parsed.metadata.path, [])
      assert.deepEqual(parsed.metadata.nodes, [])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("returns a deterministic node_not_found error payload when node_id is invalid", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-traverse-missing-node-"))
    try {
      await initProject(dir, { governanceMode: "assisted", language: "en", silent: true })
      await buildTraverseFixture(dir)

      const inspectTool = createHivemindInspectTool(dir)
      const result = await inspectTool.execute(
        { action: "traverse", node_id: "missing-node", direction: "down" },
        mockContext,
      )
      const parsed = JSON.parse(result as string)

      assert.equal(parsed.status, "success")
      assert.equal(parsed.metadata.error, "node_not_found")
      assert.equal(parsed.metadata.focus_node_id, null)
      assert.deepEqual(parsed.metadata.path, [])
      assert.deepEqual(parsed.metadata.nodes, [])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
