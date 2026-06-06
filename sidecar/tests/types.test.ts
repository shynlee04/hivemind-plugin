/**
 * Type-level smoke test for SessionTreeNode — Session Explorer Panel (SC-04).
 *
 * This test does NOT depend on the use-sessions hook implementation. It
 * asserts that the SessionTreeNode interface is exported and has a
 * usable shape. If this test fails, the type is missing or has the
 * wrong shape.
 *
 * @see ../../src/lib/types.ts
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-SPEC.md (UR-SC04-02)
 * @see ../../.planning/phases/SC-04-session-explorer-panel/04-PATTERNS.md (class sketches)
 */

import { describe, it, expect } from "vitest"
import type { SessionTreeNode, SessionSummary } from "../src/lib/types"

describe("SessionTreeNode type (SC-04 Task 1)", () => {
  it("is exported and accepts the expected shape (compiles + runtime check)", () => {
    // This test is primarily a type-level guard. The actual shape is
    // verified by tsc --noEmit; this test exercises the runtime construct.
    const session: SessionSummary = {
      id: "ses-tree-1",
      status: "active",
      description: "Tree test session",
      children: ["ses-tree-2"],
      createdAt: 1,
      updatedAt: 2,
      depth: 0,
    }
    const node: SessionTreeNode = {
      session,
      children: [],
      expanded: false,
      depth: 0,
    }
    expect(node.session.id).toBe("ses-tree-1")
    expect(node.expanded).toBe(false)
    expect(node.depth).toBe(0)
  })

  it("supports recursive children (1 level deep for v1)", () => {
    // Recursive type — a SessionTreeNode's children can themselves be SessionTreeNodes.
    // This compiles only if SessionTreeNode.children: SessionTreeNode[].
    const childNode: SessionTreeNode = {
      session: {
        id: "ses-child",
        status: "running",
        description: "Child",
        children: [],
        createdAt: 1,
        updatedAt: 1,
        depth: 1,
      },
      children: [],
      expanded: false,
      depth: 1,
    }
    const parentNode: SessionTreeNode = {
      session: {
        id: "ses-parent",
        status: "active",
        description: "Parent",
        children: ["ses-child"],
        createdAt: 1,
        updatedAt: 1,
        depth: 0,
      },
      children: [childNode],
      expanded: true,
      depth: 0,
    }
    expect(parentNode.children).toHaveLength(1)
    expect(parentNode.children[0]?.session.id).toBe("ses-child")
    expect(parentNode.expanded).toBe(true)
  })
})
