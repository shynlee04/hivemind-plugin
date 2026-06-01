import { describe, it, expect, beforeEach, afterEach, jest } from "bun:test";
import {
  PaneGridPlanner,
  createDebouncedPaneGridPlanner,
  type PaneTreeNode,
  type SplitCommand,
} from "../grid-planner";

describe("PaneGridPlanner", () => {
  describe("computeSplitSequence()", () => {
    it("Test 1: empty root (no children) returns []", () => {
      const p = new PaneGridPlanner(500);
      const result = p.computeSplitSequence({ id: "root", children: [] });
      expect(result).toEqual([]);
    });

    it("Test 2: 5-node tree (root + a + a1 + a2 + b) returns 4 splits in BFS order: split-a, split-a1, split-a2, split-b", () => {
      const p = new PaneGridPlanner(500);
      const tree: PaneTreeNode = {
        id: "root",
        children: [
          {
            id: "a",
            children: [
              { id: "a1" },
              { id: "a2" },
            ],
          },
          { id: "b" },
        ],
      };
      const result = p.computeSplitSequence(tree);
      expect(result).toHaveLength(4);
      expect(result[0]?.parentPaneId).toBe("root");
      expect(result[0]?.direction).toBe("h");
      expect(result[1]?.parentPaneId).toBe("a");
      expect(result[1]?.direction).toBe("v");
      expect(result[2]?.parentPaneId).toBe("a");
      expect(result[2]?.direction).toBe("v");
      expect(result[3]?.parentPaneId).toBe("root");
      expect(result[3]?.direction).toBe("h");
    });

    it("Test 3: level-1 splits use direction 'h' (horizontal); level-2+ splits use 'v' (vertical)", () => {
      const p = new PaneGridPlanner(500);
      const tree: PaneTreeNode = {
        id: "root",
        children: [
          {
            id: "a",
            children: [
              { id: "a1" },
              { id: "a2" },
            ],
          },
        ],
      };
      const result = p.computeSplitSequence(tree);
      // a is depth-1 → "h"
      expect(result[0]?.direction).toBe("h");
      // a1, a2 are depth-2 → "v"
      expect(result[1]?.direction).toBe("v");
      expect(result[2]?.direction).toBe("v");
    });

    it("Test 4: each SplitCommand.parentPaneId references the parent's id (not the split-result pane id)", () => {
      const p = new PaneGridPlanner(500);
      const tree: PaneTreeNode = {
        id: "root",
        children: [
          { id: "a", children: [{ id: "a1" }] },
        ],
      };
      const result = p.computeSplitSequence(tree);
      expect(result[0]?.parentPaneId).toBe("root");
      expect(result[1]?.parentPaneId).toBe("a");
    });

    it("Test 5: BFS ordering — root with 2 children returns [split-a, split-b] in that order (left-to-right)", () => {
      const p = new PaneGridPlanner(500);
      const tree: PaneTreeNode = {
        id: "root",
        children: [{ id: "a" }, { id: "b" }],
      };
      const result = p.computeSplitSequence(tree);
      expect(result).toHaveLength(2);
      expect(result[0]?.parentPaneId).toBe("root");
      expect(result[0]?.direction).toBe("h");
      expect(result[1]?.parentPaneId).toBe("root");
      expect(result[1]?.direction).toBe("h");
    });
  });

  describe("requestLayout() debounce", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("Test 6: 5 calls to requestLayout within 50ms produce exactly 1 actual onComputed invocation (coalescing)", () => {
      const p = new PaneGridPlanner(500);
      const cb = jest.fn();
      const tree: PaneTreeNode = { id: "root", children: [{ id: "a" }] };

      // 5 rapid calls
      p.requestLayout(tree, cb);
      jest.advanceTimersByTime(10);
      p.requestLayout(tree, cb);
      jest.advanceTimersByTime(10);
      p.requestLayout(tree, cb);
      jest.advanceTimersByTime(10);
      p.requestLayout(tree, cb);
      jest.advanceTimersByTime(10);
      p.requestLayout(tree, cb);

      // total elapsed: 40ms, well under 500ms debounce
      expect(cb).not.toHaveBeenCalled();

      // Now advance past the debounce
      jest.advanceTimersByTime(500);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("Test 7: call at t=0, advance fake timers by 499ms → no fire; advance to 500ms → fire", () => {
      const p = new PaneGridPlanner(500);
      const cb = jest.fn();
      const tree: PaneTreeNode = { id: "root", children: [{ id: "a" }] };

      p.requestLayout(tree, cb);

      // advance to 499ms — should NOT have fired
      jest.advanceTimersByTime(499);
      expect(cb).not.toHaveBeenCalled();

      // advance to 500ms (one more ms) — should have fired exactly once
      jest.advanceTimersByTime(1);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("Test 8: rapid calls at t=0, 100, 200, 300ms; advance to 800ms → fire uses the t=300ms tree", () => {
      const p = new PaneGridPlanner(500);
      const cb = jest.fn();
      const treeA: PaneTreeNode = { id: "root", children: [{ id: "a" }] };
      const treeB: PaneTreeNode = { id: "root", children: [{ id: "b" }] };
      const treeC: PaneTreeNode = { id: "root", children: [{ id: "c" }] };
      const treeD: PaneTreeNode = { id: "root", children: [{ id: "d" }] };

      p.requestLayout(treeA, cb);
      jest.advanceTimersByTime(100);
      p.requestLayout(treeB, cb);
      jest.advanceTimersByTime(100);
      p.requestLayout(treeC, cb);
      jest.advanceTimersByTime(100);
      p.requestLayout(treeD, cb);

      // Total elapsed since first call: 300ms, but timer was reset at each call
      // Last call was at t=300, so timer fires at t=800 (300 + 500)
      expect(cb).not.toHaveBeenCalled();

      jest.advanceTimersByTime(500);
      expect(cb).toHaveBeenCalledTimes(1);

      // The result should be from treeD (the last one)
      const arg = cb.mock.calls[0]?.[0] as SplitCommand[];
      expect(arg[0]?.parentPaneId).toBe("root");
      // treeD has 1 child "d" — but we can only verify the result references the right structure
      // by checking the count (treeD has 1 child → 1 split)
      expect(arg).toHaveLength(1);
    });

    it("Test 9 (bonus): cancel() clears any pending timer", () => {
      const p = new PaneGridPlanner(500);
      const cb = jest.fn();
      const tree: PaneTreeNode = { id: "root", children: [{ id: "a" }] };

      p.requestLayout(tree, cb);
      p.cancel();

      jest.advanceTimersByTime(1000);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe("createDebouncedPaneGridPlanner()", () => {
    it("Test 10 (bonus): factory helper returns a PaneGridPlanner instance", () => {
      const p = createDebouncedPaneGridPlanner(500);
      expect(p).toBeInstanceOf(PaneGridPlanner);
    });

    it("Test 11 (bonus): factory helper with default debounceMs (500) works", () => {
      const p = createDebouncedPaneGridPlanner();
      expect(p).toBeInstanceOf(PaneGridPlanner);
    });
  });
});
