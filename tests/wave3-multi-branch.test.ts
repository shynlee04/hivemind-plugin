/**
 * Wave 3 TDD: Multi-Branch Architecture
 *
 * RED Phase: These tests define the contract for multi-branch hierarchy support.
 * They should FAIL before implementation, PASS after.
 *
 * Contract:
 *   1. HierarchyTree v2: branches[], primary_branch alongside existing cursor
 *   2. BranchCursor: name, cursor_id, created, last_active, status
 *   3. createTree() returns v2 with "main" branch
 *   4. createBranch() adds a named branch at an existing node
 *   5. switchBranch() moves cursor to that branch's cursor_id
 *   6. pauseBranch() / completeBranch() update status
 *   7. addChild() syncs the primary branch cursor along with tree.cursor
 *   8. toBrainProjectionForBranch() returns projection from a specific branch cursor
 *   9. loadTree() migrates v1 → v2 (existing cursor becomes "main" branch)
 *  10. Backward compat: existing toBrainProjection / getCursorNode / addChild all still work
 */

import {
    createNode, createTree, setRoot, addChild, moveCursor,
    findNode, getCursorNode, toBrainProjection, flattenTree,
    toAsciiTree, getTreeStats,
    createBranch,
    switchBranch,
    pauseBranch,
    completeBranch,
    listBranches,
    toBrainProjectionForBranch,
    type HierarchyTree,
    type HierarchyNode,
} from "../src/lib/hierarchy-tree.js";

// ─── Harness ────────────────────────────────────────────────────────

let passed = 0;
let failed_ = 0;
function assert(cond: boolean, name: string) {
    if (cond) { passed++; process.stderr.write(`  PASS: ${name}\n`); }
    else { failed_++; process.stderr.write(`  FAIL: ${name}\n`); }
}

// ─── Constants ──────────────────────────────────────────────────────

const TEST_DATE = new Date(2026, 1, 11, 14, 30);

// ─── Helpers ────────────────────────────────────────────────────────

function buildThreeLevelTree() {
    const root = createNode("trajectory", "Build auth system", "active", TEST_DATE);
    const tactic = createNode("tactic", "JWT validation", "active", new Date(2026, 1, 11, 14, 35));
    const action = createNode("action", "Write middleware", "active", new Date(2026, 1, 11, 14, 40));

    let tree = createTree();
    tree = setRoot(tree, root);
    const tacticResult = addChild(tree, root.id, tactic);
    if (tacticResult.success) tree = tacticResult.tree;
    const actionResult = addChild(tree, tactic.id, action);
    if (actionResult.success) tree = actionResult.tree;
    return { tree, root, tactic, action };
}

// ─── Test 1: createTree v2 ──────────────────────────────────────────

function test_createTree_v2() {
    process.stderr.write("\n--- createTree v2 ---\n");

    const tree = createTree();

    // v2 structure
    assert(
        (tree as any).branches !== undefined && Array.isArray((tree as any).branches),
        "createTree returns tree with branches array"
    );
    assert(
        (tree as any).primary_branch === "main",
        "createTree sets primary_branch to 'main'"
    );

    // "main" branch exists with null cursor (empty tree)
    const branches = (tree as any).branches as any[];
    const mainBranch = branches.find((b: any) => b.name === "main");
    assert(
        mainBranch !== undefined,
        "createTree includes 'main' branch in branches"
    );
    assert(
        mainBranch?.cursor_id === null,
        "main branch cursor_id is null on empty tree"
    );
    assert(
        mainBranch?.status === "active",
        "main branch status is 'active'"
    );

    // Backward compat: cursor and root still work
    assert(tree.cursor === null, "createTree still has cursor === null");
    assert(tree.root === null, "createTree still has root === null");
}

// ─── Test 2: createBranch ───────────────────────────────────────────

function test_createBranch() {
    process.stderr.write("\n--- createBranch ---\n");

    const { tree, root, tactic } = buildThreeLevelTree();

    // Create a branch at tactic level
    const branched = createBranch(tree, "testing", tactic.id);
    const branches = (branched as any).branches as any[];

    assert(
        branches.length === 2,
        "createBranch adds a second branch"
    );

    const testBranch = branches.find((b: any) => b.name === "testing");
    assert(
        testBranch !== undefined,
        "createBranch creates branch with given name"
    );
    assert(
        testBranch?.cursor_id === tactic.id,
        "createBranch sets cursor_id to specified node"
    );
    assert(
        testBranch?.status === "active",
        "createBranch sets status to 'active'"
    );
    assert(
        typeof testBranch?.created === "number" && testBranch.created > 0,
        "createBranch sets created timestamp"
    );
    assert(
        typeof testBranch?.last_active === "number",
        "createBranch sets last_active timestamp"
    );

    // Primary hasn't changed
    assert(
        (branched as any).primary_branch === "main",
        "createBranch doesn't change primary_branch"
    );
    assert(
        branched.cursor === tree.cursor,
        "createBranch doesn't change cursor"
    );

    // Duplicate name rejected
    let threw = false;
    try { createBranch(branched, "testing", root.id); }
    catch { threw = true; }
    assert(threw, "createBranch throws on duplicate branch name");

    // Non-existent node rejected
    let threw2 = false;
    try { createBranch(tree, "phantom", "nonexistent_xyz"); }
    catch { threw2 = true; }
    assert(threw2, "createBranch throws on non-existent node ID");
}

// ─── Test 3: switchBranch ───────────────────────────────────────────

function test_switchBranch() {
    process.stderr.write("\n--- switchBranch ---\n");

    const { tree, tactic, action } = buildThreeLevelTree();
    // cursor is at action node
    assert(tree.cursor === action.id, "precondition: cursor at action");

    // Create a branch at tactic
    const branched = createBranch(tree, "testing", tactic.id);

    // Switch to "testing" branch
    const switched = switchBranch(branched, "testing");
    assert(
        switched.cursor === tactic.id,
        "switchBranch moves cursor to branch's cursor_id"
    );
    assert(
        (switched as any).primary_branch === "testing",
        "switchBranch sets primary_branch to target"
    );

    // Switch back to "main"
    const switchedBack = switchBranch(switched, "main");
    assert(
        switchedBack.cursor === action.id,
        "switchBranch back to main restores original cursor"
    );

    // Non-existent branch
    let threw = false;
    try { switchBranch(branched, "nonexistent"); }
    catch { threw = true; }
    assert(threw, "switchBranch throws on non-existent branch name");
}

// ─── Test 4: pauseBranch / completeBranch ───────────────────────────

function test_branchStatusChanges() {
    process.stderr.write("\n--- branch status changes ---\n");

    const { tree, tactic } = buildThreeLevelTree();
    const branched = createBranch(tree, "testing", tactic.id);

    // Pause
    const paused = pauseBranch(branched, "testing");
    const pausedBranch = (paused as any).branches.find((b: any) => b.name === "testing");
    assert(
        pausedBranch?.status === "paused",
        "pauseBranch sets status to 'paused'"
    );

    // Complete
    const completed = completeBranch(branched, "testing");
    const completedBranch = (completed as any).branches.find((b: any) => b.name === "testing");
    assert(
        completedBranch?.status === "completed",
        "completeBranch sets status to 'completed'"
    );

    // Can't pause primary (safety)
    let threw = false;
    try { pauseBranch(branched, "main"); }
    catch { threw = true; }
    assert(threw, "pauseBranch throws when trying to pause primary branch");

    // Non-existent branch
    let threw2 = false;
    try { pauseBranch(branched, "ghost"); }
    catch { threw2 = true; }
    assert(threw2, "pauseBranch throws on non-existent branch");
}

// ─── Test 5: listBranches ───────────────────────────────────────────

function test_listBranches() {
    process.stderr.write("\n--- listBranches ---\n");

    const { tree, tactic, root } = buildThreeLevelTree();
    const b1 = createBranch(tree, "testing", tactic.id);
    const b2 = createBranch(b1, "hotfix", root.id);

    const list = listBranches(b2);
    assert(
        Array.isArray(list) && list.length === 3,
        "listBranches returns all 3 branches"
    );
    assert(
        list.some((b: any) => b.name === "main") &&
        list.some((b: any) => b.name === "testing") &&
        list.some((b: any) => b.name === "hotfix"),
        "listBranches includes main, testing, and hotfix"
    );
}

// ─── Test 6: toBrainProjectionForBranch ─────────────────────────────

function test_toBrainProjectionForBranch() {
    process.stderr.write("\n--- toBrainProjectionForBranch ---\n");

    const { tree, tactic } = buildThreeLevelTree();
    // cursor is at action; create branch at tactic
    const branched = createBranch(tree, "testing", tactic.id);

    // Projection for "testing" branch (cursor at tactic, no action)
    const proj = toBrainProjectionForBranch(branched, "testing");
    assert(
        proj.trajectory === "Build auth system",
        "branch projection has correct trajectory"
    );
    assert(
        proj.tactic === "JWT validation",
        "branch projection has correct tactic"
    );
    assert(
        proj.action === "",
        "branch projection has empty action (cursor at tactic level)"
    );

    // Projection for "main" branch (cursor at action)
    const mainProj = toBrainProjectionForBranch(branched, "main");
    assert(
        mainProj.action === "Write middleware",
        "main branch projection has action"
    );
}

// ─── Test 7: addChild syncs primary branch cursor ───────────────────

function test_addChild_syncs_branch() {
    process.stderr.write("\n--- addChild branch sync ---\n");

    const { tree, tactic } = buildThreeLevelTree();
    // tree.cursor is at action level; main branch should match

    // Get main branch cursor before addChild
    const mainBefore = (tree as any).branches?.find((b: any) => b.name === "main");
    assert(
        mainBefore?.cursor_id === tree.cursor,
        "precondition: main branch cursor synced with tree.cursor"
    );

    // Add a new action under tactic
    const newAction = createNode("action", "Write tests", "active", new Date(2026, 1, 11, 14, 45));
    const result = addChild(tree, tactic.id, newAction);

    if (result.success) {
        // tree.cursor moved to new child
        assert(
            result.tree.cursor === newAction.id,
            "addChild moves tree.cursor to new child"
        );

        // Primary branch cursor also moved
        const mainAfter = (result.tree as any).branches?.find((b: any) => b.name === "main");
        assert(
            mainAfter?.cursor_id === newAction.id,
            "addChild syncs primary branch cursor_id with tree.cursor"
        );
    } else {
        assert(false, "addChild should succeed");
    }
}

// ─── Test 8: Backward compatibility ─────────────────────────────────

function test_backward_compat() {
    process.stderr.write("\n--- backward compat ---\n");

    const { tree, root, tactic, action } = buildThreeLevelTree();

    // toBrainProjection still works (reads cursor, ignores branches)
    const proj = toBrainProjection(tree);
    assert(
        proj.trajectory === "Build auth system" &&
        proj.tactic === "JWT validation" &&
        proj.action === "Write middleware",
        "toBrainProjection still works with v2 tree"
    );

    // getCursorNode still works
    const cursorNode = getCursorNode(tree);
    assert(
        cursorNode?.id === action.id && cursorNode?.level === "action",
        "getCursorNode still works with v2 tree"
    );

    // findNode still works
    assert(
        findNode(tree.root!, root.id)?.id === root.id,
        "findNode still works"
    );

    // flattenTree still works
    const flat = flattenTree(tree.root!);
    assert(flat.length === 3, "flattenTree still returns 3 nodes");

    // toAsciiTree still works
    const ascii = toAsciiTree(tree);
    assert(
        ascii.includes("Trajectory:") && ascii.includes("Tactic:"),
        "toAsciiTree still renders correctly"
    );

    // getTreeStats still works
    const stats = getTreeStats(tree);
    assert(
        stats.totalNodes === 3 && stats.depth === 3,
        "getTreeStats still works"
    );
}

// ─── Test 9: v1 → v2 migration ─────────────────────────────────────

function test_v1_to_v2_migration() {
    process.stderr.write("\n--- v1 → v2 migration ---\n");

    // Fresh tree is always v2
    const fresh = createTree();
    assert(
        (fresh as any).branches !== undefined,
        "Fresh tree has branches (v2)"
    );

    // Build a v1-style tree with data (no branches, no primary_branch)
    const root = createNode("trajectory", "Migrate me", "active", TEST_DATE);
    const v1WithData: any = {
        version: 1,
        root: root,
        cursor: root.id,
    };

    // toBrainProjection still works on v1 tree (reads cursor, ignores branches)
    const proj = toBrainProjection(v1WithData as HierarchyTree);
    assert(
        proj.trajectory === "Migrate me",
        "toBrainProjection handles v1 tree gracefully"
    );

    // Branch functions auto-migrate v1 via ensureBranches
    const tactic = createNode("tactic", "V1 tactic", "active", new Date(2026, 1, 11, 14, 35));
    (v1WithData.root as HierarchyNode).children = [tactic];

    // createBranch on a v1 tree should auto-add "main" branch + new branch
    const branched = createBranch(v1WithData as HierarchyTree, "feature", tactic.id);
    const branches = (branched as any).branches as any[];
    assert(
        branches.length === 2,
        "createBranch auto-migrates v1: main + feature = 2 branches"
    );
    assert(
        branches[0].name === "main" && branches[0].cursor_id === root.id,
        "auto-migrated main branch inherits v1 cursor"
    );
    assert(
        branches[1].name === "feature" && branches[1].cursor_id === tactic.id,
        "new branch created at specified node"
    );

    // listBranches on a v1 tree auto-migrates
    const v1Empty: any = { version: 1, root: null, cursor: null };
    const list = listBranches(v1Empty as HierarchyTree);
    assert(
        list.length === 1 && list[0].name === "main",
        "listBranches auto-migrates v1 empty tree"
    );
}

// ─── Runner ─────────────────────────────────────────────────────────

function main() {
    process.stderr.write("=== Wave 3 TDD: Multi-Branch Architecture ===\n");

    test_createTree_v2();
    test_createBranch();
    test_switchBranch();
    test_branchStatusChanges();
    test_listBranches();
    test_toBrainProjectionForBranch();
    test_addChild_syncs_branch();
    test_backward_compat();
    test_v1_to_v2_migration();

    process.stderr.write(`\n=== Wave 3 TDD: ${passed} passed, ${failed_} failed ===\n`);
    if (failed_ > 0) process.exit(1);
}
main();
