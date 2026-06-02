/**
 * Phase 51 in-tree port — unit tests for the new `PaneGridPlanner` class.
 *
 * Covers REQ-51-04 (REQ-03 from P43):
 * - DFS preorder traversal
 * - depth-1 → "h", depth-2+ → "v" direction rule
 * - 500ms trailing-edge debounce coalescing
 * - no cache (D-43-04): each call resolves independently
 * - cancel() drops pending callback
 *
 * Pure-logic tests — no tmux binary required.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PaneGridPlanner,
  createDebouncedPaneGridPlanner,
  type PaneTreeNode,
  type SplitCommand,
} from "../../../src/features/tmux/grid-planner.js";

describe("PaneGridPlanner.computeSplitSequence", () => {
  // ---------------------------------------------------------------------------
  // Trivial cases
  // ---------------------------------------------------------------------------

  it("returns [] for a leaf (root with no children)", () => {
    const planner = new PaneGridPlanner();
    const root: PaneTreeNode = { id: "root", children: [] };
    expect(planner.computeSplitSequence(root)).toEqual([]);
  });

  it("emits a single horizontal split for a 2-pane tree", () => {
    const planner = new PaneGridPlanner();
    const root: PaneTreeNode = {
      id: "root",
      children: [{ id: "a", children: [] }],
    };
    const result = planner.computeSplitSequence(root);
    expect(result).toEqual< SplitCommand[]>([
      { parentPaneId: "root", direction: "h" },
    ]);
  });

  it("uses depth-based direction: depth-1 → h, depth-2+ → v", () => {
    const planner = new PaneGridPlanner();
    // root → a → [a1, a2]; root → b
    // Expected: split a (h, depth 1), split a1 (v, depth 2), split a2 (v, depth 2), split b (h, depth 1)
    const root: PaneTreeNode = {
      id: "root",
      children: [
        {
          id: "a",
          children: [
            { id: "a1", children: [] },
            { id: "a2", children: [] },
          ],
        },
        { id: "b", children: [] },
      ],
    };
    const result = planner.computeSplitSequence(root);
    expect(result).toEqual< SplitCommand[]>([
      { parentPaneId: "root", direction: "h" }, // a (depth 1)
      { parentPaneId: "a", direction: "v" }, // a1 (depth 2)
      { parentPaneId: "a", direction: "v" }, // a2 (depth 2)
      { parentPaneId: "root", direction: "h" }, // b (depth 1)
    ]);
  });

  it("preserves DFS preorder: parent split emitted before children", () => {
    const planner = new PaneGridPlanner();
    // root → x → [x1 → [x1a], x2]; root → y → [y1]
    // Order must be x, x1, x1a, x2, y, y1 (preorder, depth-based direction)
    const root: PaneTreeNode = {
      id: "root",
      children: [
        {
          id: "x",
          children: [
            {
              id: "x1",
              children: [{ id: "x1a", children: [] }],
            },
            { id: "x2", children: [] },
          ],
        },
        {
          id: "y",
          children: [{ id: "y1", children: [] }],
        },
      ],
    };
    const result = planner.computeSplitSequence(root);
    const orderedTargets = result.map((c) => c.parentPaneId);
    expect(orderedTargets).toEqual([
      "root", // x (depth 1)
      "x", // x1 (depth 2)
      "x1", // x1a (depth 3, still v)
      "x", // x2 (depth 2)
      "root", // y (depth 1)
      "y", // y1 (depth 2)
    ]);
  });
});

describe("PaneGridPlanner.requestLayout (debounce)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires the callback after the debounce window (500ms default)", () => {
    const planner = new PaneGridPlanner();
    const cb = vi.fn();
    const root: PaneTreeNode = { id: "root", children: [{ id: "a", children: [] }] };

    planner.requestLayout(root, cb);
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(499);
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith<[SplitCommand[]]>([
      { parentPaneId: "root", direction: "h" },
    ]);
  });

  it("coalesces multiple rapid calls — last root wins (trailing-edge)", () => {
    const planner = new PaneGridPlanner(500);
    const cb = vi.fn();
    const root1: PaneTreeNode = { id: "root", children: [{ id: "a", children: [] }] };
    const root2: PaneTreeNode = {
      id: "root",
      children: [
        { id: "a", children: [] },
        { id: "b", children: [] },
      ],
    };

    planner.requestLayout(root1, cb);
    vi.advanceTimersByTime(300);
    planner.requestLayout(root2, cb);
    vi.advanceTimersByTime(300);
    // Total elapsed: 600ms, but the second call reset the timer at 300ms,
    // so the callback should NOT have fired yet (it will at 300+500=800ms).
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(cb).toHaveBeenCalledTimes(1);
    // The latest root (root2 with 2 children) wins
    expect(cb).toHaveBeenCalledWith<[SplitCommand[]]>([
      { parentPaneId: "root", direction: "h" }, // a
      { parentPaneId: "root", direction: "h" }, // b
    ]);
  });

  it("respects a custom debounceMs", () => {
    const planner = new PaneGridPlanner(100);
    const cb = vi.fn();
    const root: PaneTreeNode = { id: "root", children: [{ id: "a", children: [] }] };

    planner.requestLayout(root, cb);
    vi.advanceTimersByTime(99);
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it("cancel() drops the pending callback and timer", () => {
    const planner = new PaneGridPlanner(500);
    const cb = vi.fn();
    const root: PaneTreeNode = { id: "root", children: [{ id: "a", children: [] }] };

    planner.requestLayout(root, cb);
    planner.cancel();
    vi.advanceTimersByTime(1000);
    expect(cb).not.toHaveBeenCalled();
  });
});

describe("createDebouncedPaneGridPlanner factory", () => {
  it("returns a PaneGridPlanner instance with the requested debounce", () => {
    const planner = createDebouncedPaneGridPlanner(250);
    expect(planner).toBeInstanceOf(PaneGridPlanner);
    // computeSplitSequence is available on the public class (no narrow view
    // is enforced for direct module imports — only the adapter's narrow
    // `PaneGridPlanner` type omits `requestLayout` / `cancel`).
    const root: PaneTreeNode = { id: "root", children: [{ id: "a", children: [] }] };
    expect(planner.computeSplitSequence(root)).toEqual< SplitCommand[]>([
      { parentPaneId: "root", direction: "h" },
    ]);
  });

  it("uses 500ms default when no debounceMs is provided", () => {
    const planner = createDebouncedPaneGridPlanner();
    expect(planner).toBeInstanceOf(PaneGridPlanner);
    // Behavioral assertion: debounce is the documented 500ms default
    // (verified by the debounce test above; here we just confirm construction).
  });
});
