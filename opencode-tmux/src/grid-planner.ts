/**
 * PaneGridPlanner — converts a logical pane tree into a sequence of
 * tmux `split-window` commands with debounce coalescing.
 *
 * DFS preorder walk emits one SplitCommand per non-root node. The
 * preorder traversal matches the spec test: for tree
 *   root → [a → [a1, a2], b]
 * the emitted order is split-a, split-a1, split-a2, split-b. The
 * executor can chain splits by parent reference (the resulting paneId
 * is only known after tmux returns it).
 *
 * Direction rule:
 * - depth-1 (direct child of root) → "h" (horizontal)
 * - depth-2+ → "v" (vertical)
 *
 * Per D-43-04: NO cache layer. The 500ms trailing-edge debounce is the
 * sole coalescing mechanism. The planner is stateless beyond the
 * in-flight timer + stored root/callback.
 *
 * Reference: 43-01-PLAN.md Task 2 (REQ-03)
 */

export interface PaneTreeNode {
  id: string
  children?: PaneTreeNode[]
}

export type SplitDirection = "h" | "v"

export interface SplitCommand {
  parentPaneId: string
  direction: SplitDirection
}

export class PaneGridPlanner {
  private readonly debounceMs: number
  private timer: ReturnType<typeof setTimeout> | null = null
  private pendingRoot: PaneTreeNode | null = null
  private pendingCallback: ((commands: SplitCommand[]) => void) | null = null

  constructor(debounceMs: number = 500) {
    this.debounceMs = debounceMs
  }

  /**
   * Walk the tree in DFS preorder. For each non-root node, emit a
   * SplitCommand targeting its parent with the depth-based direction.
   * Empty tree → []. No cycle detection (v1 assumes well-formed input).
   *
   * The preorder traversal is intentional: a parent split must be
   * performed BEFORE any of its children's splits (we need the
   * resulting paneId as the parent reference). BFS would interleave
   * sibling branches whose parents haven't been created yet.
   */
  computeSplitSequence(root: PaneTreeNode): SplitCommand[] {
    const out: SplitCommand[] = []
    if (!root.children || root.children.length === 0) return out

    const visit = (node: PaneTreeNode, parentId: string, depth: number): void => {
      const direction: SplitDirection = depth === 1 ? "h" : "v"
      out.push({ parentPaneId: parentId, direction })
      if (node.children) {
        for (const child of node.children) {
          visit(child, node.id, depth + 1)
        }
      }
    }

    for (const child of root.children) {
      visit(child, root.id, 1)
    }

    return out
  }

  /**
   * Debounced coalescing. Each call REPLACES the pending root and
   * resets the timer (trailing-edge). On fire: invoke
   * onComputed(computeSplitSequence(storedRoot)).
   */
  requestLayout(root: PaneTreeNode, onComputed: (commands: SplitCommand[]) => void): void {
    this.pendingRoot = root
    this.pendingCallback = onComputed

    if (this.timer !== null) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      const root = this.pendingRoot
      const cb = this.pendingCallback
      this.timer = null
      this.pendingRoot = null
      this.pendingCallback = null
      if (root && cb) {
        cb(this.computeSplitSequence(root))
      }
    }, this.debounceMs)
  }

  /**
   * Clear any pending timer. Pending root/callback are dropped.
   * Useful for tests and shutdown.
   */
  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
    this.pendingRoot = null
    this.pendingCallback = null
  }
}

/**
 * Factory helper — thin wrapper for consistency with P42's factory naming.
 */
export function createDebouncedPaneGridPlanner(debounceMs?: number): PaneGridPlanner {
  return new PaneGridPlanner(debounceMs)
}
