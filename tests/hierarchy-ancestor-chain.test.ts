import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  createTree,
  createNode,
  setRoot,
  addChild,
  validateAncestorChain,
} from "../src/lib/hierarchy-tree.js"

describe("hierarchy ancestor chain validation", () => {
  it("validates complete trajectory -> tactic -> action chain", () => {
    const trajectory = createNode("trajectory", "Root")
    const tactic = createNode("tactic", "Tactic")
    const action = createNode("action", "Action")

    let tree = setRoot(createTree(), trajectory)
    const tacticResult = addChild(tree, trajectory.id, tactic)
    assert.equal(tacticResult.success, true)
    tree = tacticResult.tree
    const actionResult = addChild(tree, tactic.id, action)
    assert.equal(actionResult.success, true)
    tree = actionResult.tree

    const result = validateAncestorChain(tree, action.id)
    assert.equal(result.valid, true)
    assert.deepEqual(result.missingAncestors, [])
  })

  it("reports missing trajectory ancestor for tactic root", () => {
    const tacticRoot = createNode("tactic", "Tactic-root")
    const tree = setRoot(createTree(), tacticRoot)
    const result = validateAncestorChain(tree, tacticRoot.id)

    assert.equal(result.valid, false)
    assert.deepEqual(result.missingAncestors, ["trajectory"])
  })

  it("reports missing node when node id is unknown", () => {
    const trajectory = createNode("trajectory", "Root")
    const tree = setRoot(createTree(), trajectory)
    const result = validateAncestorChain(tree, "missing-node-id")

    assert.equal(result.valid, false)
    assert.deepEqual(result.missingAncestors, ["node_not_found"])
  })

  it("reports both missing tactic and trajectory when action is root", () => {
    const actionRoot = createNode("action", "Action-root")
    const tree = setRoot(createTree(), actionRoot)
    const result = validateAncestorChain(tree, actionRoot.id)

    assert.equal(result.valid, false)
    assert.deepEqual(result.missingAncestors, ["trajectory", "tactic"])
  })

  it("reports missing tactic when action hangs directly under trajectory", () => {
    const trajectory = createNode("trajectory", "Root")
    const action = createNode("action", "Orphan action")
    trajectory.children = [action]
    const tree = {
      ...createTree(),
      root: trajectory,
      cursor: action.id,
    }

    const result = validateAncestorChain(tree, action.id)
    assert.equal(result.valid, false)
    assert.deepEqual(result.missingAncestors, ["tactic"])
  })
})
