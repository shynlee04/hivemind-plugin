/**
 * Hierarchy Tree Engine Tests
 * Covers all 9 sections: Stamps, CRUD, Queries, Staleness, Rendering, Janitor, I/O, Migration
 */

import {
  generateStamp, parseStamp, stampToEpoch, makeNodeId,
  createNode, createTree, setRoot, addChild, moveCursor, markComplete,
  findNode, getAncestors, getCursorNode, toBrainProjection, flattenTree,
  classifyGap, computeSiblingGap, computeParentChildGap, detectGaps, computeCurrentGap,
  toAsciiTree, toActiveMdBody, getTreeStats,
  countCompleted, summarizeBranch, pruneCompleted,
  loadTree, saveTree, treeExists, getHierarchyPath,
  migrateFromFlat,
} from "../src/lib/hierarchy-tree.js";
import { mkdirSync, rmSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// ─── Harness ─────────────────────────────────────────────────────────

let passed = 0;
let failed_ = 0;
function assert(cond: boolean, name: string) {
  if (cond) { passed++; process.stderr.write(`  PASS: ${name}\n`); }
  else { failed_++; process.stderr.write(`  FAIL: ${name}\n`); }
}

// ─── Constants ───────────────────────────────────────────────────────

// Deterministic test date: Feb 11, 2026 14:30
// MiMiHrHrDDMMYYYY → 30 14 11 02 2026 → "301411022026"
const TEST_DATE = new Date(2026, 1, 11, 14, 30);
const TEST_STAMP = "301411022026";

// ─── Helpers ─────────────────────────────────────────────────────────

function buildThreeLevelTree() {
  const root = createNode("trajectory", "Build auth system", "active", TEST_DATE);
  const tactic = createNode("tactic", "JWT validation", "active", new Date(2026, 1, 11, 14, 35));
  const action = createNode("action", "Write middleware", "active", new Date(2026, 1, 11, 14, 40));

  let tree = createTree();
  tree = setRoot(tree, root);
  tree = addChild(tree, root.id, tactic);
  tree = addChild(tree, tactic.id, action);
  return { tree, root, tactic, action };
}

// ─── Tests ───────────────────────────────────────────────────────────

function test_stamps() {
  process.stderr.write("\n--- stamps ---\n");

  // generateStamp produces 12-char string
  const stamp = generateStamp(TEST_DATE);
  assert(stamp.length === 12, "generateStamp produces 12-char string");

  // parseStamp round-trips correctly
  const parsed = parseStamp(stamp);
  assert(parsed.minutes === 30, "parseStamp round-trip minutes");
  assert(parsed.hours === 14, "parseStamp round-trip hours");
  assert(parsed.year === 2026, "parseStamp round-trip year");

  // stampToEpoch produces valid epoch
  const epoch = stampToEpoch(stamp);
  assert(epoch === TEST_DATE.getTime(), "stampToEpoch produces valid epoch matching source date");

  // makeNodeId produces "{prefix}_{stamp}" format
  assert(
    makeNodeId("trajectory", stamp) === `t_${stamp}` &&
    makeNodeId("tactic", stamp) === `tc_${stamp}` &&
    makeNodeId("action", stamp) === `a_${stamp}`,
    "makeNodeId uses t_, tc_, a_ prefixes"
  );
}

function test_crud() {
  process.stderr.write("\n--- crud ---\n");

  // createTree
  const tree = createTree();
  assert(
    tree.version === 1 && tree.root === null && tree.cursor === null,
    "createTree returns { version:1, root:null, cursor:null }"
  );

  // createNode
  const node = createNode("trajectory", "Build auth", "active", TEST_DATE);
  assert(node.level === "trajectory" && node.content === "Build auth",
    "createNode sets correct level and content");
  assert(node.status === "active", "createNode sets status to active");
  assert(node.stamp === TEST_STAMP, "createNode generates stamp from date");
  assert(node.children.length === 0, "createNode initializes children as empty array");

  // setRoot
  const rooted = setRoot(tree, node);
  assert(rooted.root?.id === node.id && rooted.cursor === node.id,
    "setRoot sets root and moves cursor to root");

  // addChild
  const child = createNode("tactic", "JWT", "active", new Date(2026, 1, 11, 14, 35));
  const withChild = addChild(rooted, node.id, child);
  assert(
    withChild.root!.children.length === 1 && withChild.cursor === child.id,
    "addChild adds child under parent and moves cursor to child"
  );

  // addChild on empty tree
  const emptyAdd = addChild(createTree(), "fake_id", child);
  assert(emptyAdd.root === null, "addChild on empty tree is no-op");

  // moveCursor to existing node
  const moved = moveCursor(withChild, node.id);
  assert(moved.cursor === node.id, "moveCursor moves cursor to existing node");

  // moveCursor on non-existent ID
  const badMove = moveCursor(withChild, "nonexistent_999");
  assert(badMove.cursor === withChild.cursor, "moveCursor on non-existent ID is no-op");

  // markComplete
  const completed = markComplete(withChild, child.id, 1739300000000);
  const completedNode = findNode(completed.root!, child.id)!;
  assert(
    completedNode.status === "complete" && completedNode.completed === 1739300000000,
    "markComplete sets status:complete and completed timestamp"
  );
}

function test_queries() {
  process.stderr.write("\n--- queries ---\n");

  const { tree, root, tactic, action } = buildThreeLevelTree();

  // findNode
  assert(findNode(tree.root!, root.id)?.id === root.id,
    "findNode finds root by ID");
  assert(findNode(tree.root!, action.id)?.id === action.id,
    "findNode finds nested child");
  assert(findNode(tree.root!, "missing_xyz") === null,
    "findNode returns null for missing ID");

  // getAncestors
  const rootAncestors = getAncestors(tree.root!, root.id);
  assert(rootAncestors.length === 1 && rootAncestors[0].id === root.id,
    "getAncestors returns [root] for root");

  const actionAncestors = getAncestors(tree.root!, action.id);
  assert(
    actionAncestors.length === 3 &&
    actionAncestors[0].level === "trajectory" &&
    actionAncestors[1].level === "tactic" &&
    actionAncestors[2].level === "action",
    "getAncestors returns [trajectory, tactic, action] for deeply nested"
  );

  // getCursorNode — cursor is at action after buildThreeLevelTree
  assert(getCursorNode(tree)?.id === action.id,
    "getCursorNode returns node cursor points to");
  assert(getCursorNode(createTree()) === null,
    "getCursorNode returns null on empty tree");

  // toBrainProjection
  const proj = toBrainProjection(tree);
  assert(
    proj.trajectory === "Build auth system" &&
    proj.tactic === "JWT validation" &&
    proj.action === "Write middleware",
    "toBrainProjection returns flat hierarchy from cursor path"
  );

  // flattenTree
  const flat = flattenTree(tree.root!);
  assert(flat.length === 3 && flat[0].level === "trajectory",
    "flattenTree returns all nodes in DFS order");
}

function test_staleness() {
  process.stderr.write("\n--- staleness ---\n");

  // classifyGap thresholds
  assert(classifyGap(10 * 60 * 1000) === "healthy",
    "classifyGap: <30min is healthy");
  assert(classifyGap(60 * 60 * 1000) === "warm",
    "classifyGap: 30min-2hr is warm");
  assert(classifyGap(3 * 60 * 60 * 1000) === "stale",
    "classifyGap: >2hr is stale");

  // computeSiblingGap
  const nodeA = createNode("tactic", "First task", "active", new Date(2026, 1, 11, 10, 0));
  const nodeB = createNode("tactic", "Second task", "active", new Date(2026, 1, 11, 13, 0));
  const sibGap = computeSiblingGap(nodeA, nodeB);
  assert(
    sibGap.gapMs === 3 * 60 * 60 * 1000 && sibGap.relationship === "sibling",
    "computeSiblingGap returns correct gap and sibling relationship"
  );

  // computeParentChildGap
  const parent = createNode("trajectory", "Root goal", "active", new Date(2026, 1, 11, 10, 0));
  const child = createNode("tactic", "Sub-task", "active", new Date(2026, 1, 11, 10, 15));
  const pcGap = computeParentChildGap(parent, child);
  assert(
    pcGap.gapMs === 15 * 60 * 1000 && pcGap.relationship === "parent-child",
    "computeParentChildGap returns correct gap and parent-child relationship"
  );

  // detectGaps on tree with children
  const { tree } = buildThreeLevelTree();
  const gaps = detectGaps(tree);
  assert(gaps.length > 0, "detectGaps on tree with children returns gaps");

  // Verify sort: stale-first ordering
  const severityOrder: Record<string, number> = { stale: 0, warm: 1, healthy: 2 };
  const isSorted = gaps.every((g, i) =>
    i === 0 || severityOrder[gaps[i - 1].severity] <= severityOrder[g.severity]
  );
  assert(isSorted, "detectGaps returns gaps sorted stale-first");

  // detectGaps on empty tree
  assert(detectGaps(createTree()).length === 0,
    "detectGaps on empty tree returns []");
}

function test_rendering() {
  process.stderr.write("\n--- rendering ---\n");

  // Empty tree
  assert(toAsciiTree(createTree()) === "(empty hierarchy)",
    "toAsciiTree on empty tree returns '(empty hierarchy)'");

  // Three-level tree
  const { tree } = buildThreeLevelTree();
  const ascii = toAsciiTree(tree);

  // Level labels
  assert(
    ascii.includes("Trajectory:") && ascii.includes("Tactic:") && ascii.includes("Action:"),
    "toAsciiTree includes level labels (Trajectory:, Tactic:, Action:)"
  );

  // Cursor marker — cursor is at action node
  assert(ascii.includes("<-- cursor"),
    "toAsciiTree marks cursor with '<-- cursor'");

  // Status markers — all nodes are active so [>>] should appear
  assert(ascii.includes("[>>]"),
    "toAsciiTree includes status markers ([>>] for active)");

  // toActiveMdBody
  const md = toActiveMdBody(tree);
  assert(md.includes("[ ]") && md.includes("**trajectory**:"),
    "toActiveMdBody renders markdown with checkboxes and level labels");

  // getTreeStats
  const stats = getTreeStats(tree);
  assert(
    stats.totalNodes === 3 && stats.activeNodes === 3 && stats.depth === 3,
    "getTreeStats counts nodes correctly"
  );

  // Truncation Test
  const longNode = createNode("trajectory", "This is a very long node content that definitely exceeds sixty characters to verify the truncation logic in the renderer", "active", new Date());
  let truncTree = createTree();
  truncTree = setRoot(truncTree, longNode);
  const truncAscii = toAsciiTree(truncTree);
  assert(truncAscii.includes("...") && !truncAscii.includes("truncation logic"),
    "toAsciiTree truncates long content > 60 chars");

  // Status Markers Test
  let blockedTree = createTree();
  const blockedNode = createNode("trajectory", "Blocked Task", "blocked", new Date());
  blockedTree = setRoot(blockedTree, blockedNode);
  assert(toAsciiTree(blockedTree).includes("[!!]"),
    "toAsciiTree renders blocked status as [!!]");

  let pendingTree = createTree();
  const pendingNode = createNode("trajectory", "Pending Task", "pending", new Date());
  pendingTree = setRoot(pendingTree, pendingNode);
  assert(toAsciiTree(pendingTree).includes("[..]"),
    "toAsciiTree renders pending status as [..]");

  let completeTree = createTree();
  const completeNode = createNode("trajectory", "Done Task", "complete", new Date());
  completeTree = setRoot(completeTree, completeNode);
  assert(toAsciiTree(completeTree).includes("[OK]"),
    "toAsciiTree renders complete status as [OK]");
}
function test_janitor() {
  process.stderr.write("\n--- janitor ---\n");

  // countCompleted on empty tree
  assert(countCompleted(createTree()) === 0,
    "countCompleted returns 0 on empty tree");

  // countCompleted with completed nodes
  const { tree, tactic, action } = buildThreeLevelTree();
  const completed = markComplete(
    markComplete(tree, action.id, Date.now()),
    tactic.id, Date.now()
  );
  assert(countCompleted(completed) === 2,
    "countCompleted returns correct count");

  // summarizeBranch
  const tacticNode = findNode(completed.root!, tactic.id)!;
  const summary = summarizeBranch(tacticNode);
  assert(summary.includes("JWT validation") && summary.includes(tactic.stamp),
    "summarizeBranch includes content and stamp");

  // pruneCompleted — tactic branch is fully complete (tactic + action both complete)
  const pruneResult = pruneCompleted(completed);
  assert(pruneResult.pruned > 0 && pruneResult.summaries.length > 0,
    "pruneCompleted replaces completed branches with summaries");

  // Root (trajectory) is still active, preserved
  assert(
    pruneResult.tree.root!.id === tree.root!.id &&
    pruneResult.tree.root!.level === "trajectory",
    "pruneCompleted preserves non-completed branches"
  );

  // Cursor was at action.id; action was removed when tactic branch was pruned
  // → cursor should move to root
  assert(pruneResult.tree.cursor === tree.root!.id,
    "pruneCompleted moves cursor to root if cursor was in pruned branch");
}

async function test_io() {
  process.stderr.write("\n--- io ---\n");

  const tmpDir = mkdtempSync(join(tmpdir(), "hm-tree-"));
  mkdirSync(join(tmpDir, ".hivemind"), { recursive: true });

  try {
    // treeExists before save
    assert(!treeExists(tmpDir), "treeExists returns false before save");

    // saveTree + loadTree round-trip
    const { tree } = buildThreeLevelTree();
    await saveTree(tmpDir, tree);
    const loaded = await loadTree(tmpDir);
    assert(
      loaded.version === tree.version &&
      loaded.root?.id === tree.root?.id &&
      loaded.cursor === tree.cursor,
      "saveTree + loadTree round-trips correctly"
    );

    // treeExists after save
    assert(treeExists(tmpDir), "treeExists returns true after save");

    // loadTree on missing file returns empty tree
    const emptyDir = mkdtempSync(join(tmpdir(), "hm-tree-empty-"));
    mkdirSync(join(emptyDir, ".hivemind"), { recursive: true });
    const missing = await loadTree(emptyDir);
    assert(missing.root === null && missing.cursor === null,
      "loadTree returns empty tree for missing file");
    rmSync(emptyDir, { recursive: true, force: true });
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

function test_migration() {
  process.stderr.write("\n--- migration ---\n");

  // Empty trajectory → empty tree
  const empty = migrateFromFlat({ trajectory: "", tactic: "", action: "" });
  assert(empty.root === null,
    "migrateFromFlat with empty trajectory returns empty tree");

  // Trajectory only → 1-node tree
  const trajOnly = migrateFromFlat({ trajectory: "Build system", tactic: "", action: "" });
  assert(
    trajOnly.root !== null &&
    trajOnly.root.level === "trajectory" &&
    trajOnly.root.children.length === 0,
    "migrateFromFlat with trajectory only creates 1-node tree"
  );

  // Trajectory + tactic → 2-node tree
  const twoLevel = migrateFromFlat({ trajectory: "Build system", tactic: "Auth module", action: "" });
  assert(
    twoLevel.root !== null &&
    twoLevel.root.children.length === 1 &&
    twoLevel.root.children[0].level === "tactic",
    "migrateFromFlat with trajectory+tactic creates 2-node tree"
  );

  // All three levels → 3-node tree, cursor at action
  const full = migrateFromFlat({ trajectory: "Build system", tactic: "Auth module", action: "Write tests" });
  assert(
    full.root !== null &&
    full.root.children[0].children.length === 1 &&
    full.cursor !== null &&
    findNode(full.root, full.cursor)?.level === "action",
    "migrateFromFlat with all 3 creates 3-node tree, cursor at action"
  );

  // toBrainProjection of migrated tree matches original flat
  const proj = toBrainProjection(full);
  assert(
    proj.trajectory === "Build system" &&
    proj.tactic === "Auth module" &&
    proj.action === "Write tests",
    "toBrainProjection of migrated tree matches original flat"
  );
}

// ─── Runner ─────────────────────────────────────────────────────────

async function main() {
  process.stderr.write("=== Hierarchy Tree Tests ===\n");
  test_stamps();
  test_crud();
  test_queries();
  test_staleness();
  test_rendering();
  test_janitor();
  await test_io();
  test_migration();
  process.stderr.write(`\n=== Hierarchy Tree: ${passed} passed, ${failed_} failed ===\n`);
  if (failed_ > 0) process.exit(1);
}
main();
