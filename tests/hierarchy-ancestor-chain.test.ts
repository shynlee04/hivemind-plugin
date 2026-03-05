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
})
