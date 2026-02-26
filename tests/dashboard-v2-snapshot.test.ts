import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  hierarchyToLines,
  summarizeTasks,
  buildGovernanceChecks,
  summarizeMemsByShelf,
} from "../src/dashboard-v2/src/snapshot.js";

describe("dashboard-v2 snapshot helpers", () => {
  it("renders hierarchy lines with cursor marker", () => {
    const lines = hierarchyToLines({
      cursor: "a-1",
      root: {
        id: "t-1",
        level: "trajectory",
        content: "Top trajectory",
        status: "active",
        children: [
          {
            id: "tc-1",
            level: "tactic",
            content: "Main tactic",
            status: "pending",
            children: [
              {
                id: "a-1",
                level: "action",
                content: "Current action",
                status: "active",
                children: [],
              },
            ],
          },
        ],
      },
    });

    assert.ok(lines[0].includes("Trajectory"));
    assert.ok(lines.some((line) => line.includes("<-- cursor")), "expected cursor marker in hierarchy rendering");
  });

  it("summarizes pipeline counters and active task bindings", () => {
    const pipeline = summarizeTasks(
      [
        { id: "1", title: "A", status: "pending", lane: "auto" },
        { id: "2", title: "B", status: "in_progress", lane: "ops" },
        { id: "3", title: "C", status: "complete" },
      ],
      ["2"],
    );

    assert.equal(pipeline.total, 3);
    assert.equal(pipeline.pending, 1);
    assert.equal(pipeline.inProgress, 1);
    assert.equal(pipeline.complete, 1);
    assert.equal(pipeline.activeTasks.length, 1);
    assert.deepEqual(pipeline.delegationLanes, ["auto", "ops"]);
  });

  it("flags missing memory mems and groups shelves", () => {
    const checks = buildGovernanceChecks({
      hasMemoryMemsFile: false,
      anchorCount: 1,
      activeTaskCount: 0,
      driftScore: 70,
      pendingChanges: 0,
    });

    const memsCheck = checks.find((check) => check.key === "mems_presence");
    assert.equal(memsCheck?.status, "fail");

    const grouped = summarizeMemsByShelf([
      { shelf: "research" },
      { shelf: "research" },
      { shelf: "decisions" },
      {},
    ]);

    assert.equal(grouped[0]?.shelf, "research");
    assert.equal(grouped[0]?.count, 2);
    assert.ok(grouped.some((item) => item.shelf === "unknown"));
  });
});
