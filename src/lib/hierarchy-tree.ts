/**
 * Hierarchy Tree Engine
 * Core data structure for navigable hierarchy with timestamp-based cross-session traceability.
 *
 * 9 sections: Types, Stamps, CRUD, Queries, Staleness, Rendering, Janitor, I/O, Migration
 *
 * Consumers:
 * - declare-intent.ts → createNode, addChild (or setRoot), moveCursor, saveTree
 * - map-context.ts → createNode, addChild, moveCursor, saveTree, toBrainProjection
 * - compact-session.ts → loadTree, saveTree (archive copy), toAsciiTree
 * - scan-hierarchy.ts → loadTree, toAsciiTree, getTreeStats
 * - think-back.ts → loadTree, toAsciiTree, getAncestors
 * - check-drift.ts → loadTree, detectGaps
 * - hierarchy.ts (prune/migrate) → loadTree, saveTree, pruneCompleted, migrateFromFlat
 * - session-lifecycle.ts → loadTree, toAsciiTree (prompt injection)
 * - soft-governance.ts → loadTree (timestamp gap detection)
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { dirname } from "path";
import { getEffectivePaths } from "./paths.js";
import type { HierarchyLevel, ContextStatus } from "../schemas/hierarchy.js";

// ============================================================
// Section 1: Types
// ============================================================

/** A single node in the hierarchy tree */
export interface HierarchyNode {
  /** Unique ID: {level_prefix}_{MiMiHrHrDDMMYYYY} e.g. "t_301411022026" */
  id: string;
  /** Hierarchy level */
  level: HierarchyLevel;
  /** Human-readable description */
  content: string;
  /** Current status */
  status: ContextStatus;
  /** Epoch ms — for computation (gap detection, sorting) */
  created: number;
  /** MiMiHrHrDDMMYYYY stamp — for cross-session grep traceability */
  stamp: string;
  /** Epoch ms — set when status transitions to "complete" */
  completed?: number;
  /** Set by janitor when branch is pruned — replaces children */
  summary?: string;
  /** Child nodes (tactics under trajectory, actions under tactic) */
  children: HierarchyNode[];
}

/** The full tree structure persisted to hierarchy.json */
export interface HierarchyTree {
  /** Schema version for migration */
  version: 1;
  /** Root trajectory node (null if no session declared) */
  root: HierarchyNode | null;
  /** ID of current working node (where the agent is focused) */
  cursor: string | null;
}

/** Summary statistics for tree rendering */
export interface TreeStats {
  totalNodes: number;
  activeNodes: number;
  completedNodes: number;
  blockedNodes: number;
  pendingNodes: number;
  depth: number;
}

/** Represents a time gap between related nodes */
export interface TimestampGap {
  /** Stamp of the earlier node */
  from: string;
  /** Stamp of the later node */
  to: string;
  /** Gap in milliseconds */
  gapMs: number;
  /** Relationship between the two nodes */
  relationship: "sibling" | "parent-child";
  /** Severity classification */
  severity: "healthy" | "warm" | "stale";
}

// ============================================================
// Section 2: Stamps
// ============================================================

/** Level prefixes for node IDs */
const LEVEL_PREFIX: Record<HierarchyLevel, string> = {
  trajectory: "t",
  tactic: "tc",
  action: "a",
};

/**
 * Generate a MiMiHrHrDDMMYYYY timestamp stamp.
 * Format: minutes(2) + hours(2) + day(2) + month(2) + year(4) = 12 chars
 * Example: 301411022026 = 14:30 on Feb 11, 2026
 *
 * @consumer createNode (Section 3)
 */
export function generateStamp(date: Date = new Date()): string {
  const mi = String(date.getMinutes()).padStart(2, "0");
  const hr = String(date.getHours()).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  return `${mi}${hr}${dd}${mm}${yyyy}`;
}

/**
 * Parse a MiMiHrHrDDMMYYYY stamp back into components.
 *
 * @consumer detectGaps (Section 5)
 */
export function parseStamp(stamp: string): {
  minutes: number;
  hours: number;
  day: number;
  month: number;
  year: number;
} {
  return {
    minutes: parseInt(stamp.slice(0, 2), 10),
    hours: parseInt(stamp.slice(2, 4), 10),
    day: parseInt(stamp.slice(4, 6), 10),
    month: parseInt(stamp.slice(6, 8), 10),
    year: parseInt(stamp.slice(8), 10),
  };
}

/**
 * Convert a MiMiHrHrDDMMYYYY stamp to epoch milliseconds.
 *
 * @consumer detectGaps (Section 5), session-lifecycle.ts
 */
export function stampToEpoch(stamp: string): number {
  const { minutes, hours, day, month, year } = parseStamp(stamp);
  return new Date(year, month - 1, day, hours, minutes).getTime();
}

/**
 * Generate a full node ID from level and stamp.
 *
 * @consumer createNode (Section 3)
 */
export function makeNodeId(level: HierarchyLevel, stamp: string): string {
  return `${LEVEL_PREFIX[level]}_${stamp}`;
}

// ============================================================
// Section 3: Tree CRUD
// ============================================================

/**
 * Create a new hierarchy node.
 *
 * @consumer declare-intent.ts, map-context.ts
 */
export function createNode(
  level: HierarchyLevel,
  content: string,
  status: ContextStatus = "active",
  now: Date = new Date()
): HierarchyNode {
  const stamp = generateStamp(now);
  return {
    id: makeNodeId(level, stamp),
    level,
    content,
    status,
    created: now.getTime(),
    stamp,
    children: [],
  };
}

/**
 * Create an empty tree.
 *
 * @consumer declare-intent.ts, compact-session.ts (reset)
 */
export function createTree(): HierarchyTree {
  return { version: 1, root: null, cursor: null };
}

/**
 * Set the root node of the tree (trajectory level).
 * Replaces any existing root.
 *
 * @consumer declare-intent.ts
 */
export function setRoot(tree: HierarchyTree, node: HierarchyNode): HierarchyTree {
  return { ...tree, root: node, cursor: node.id };
}

/**
 * Add a child node under a parent identified by parentId.
 * Moves cursor to the new child.
 *
 * @consumer map-context.ts
 */
export function addChild(
  tree: HierarchyTree,
  parentId: string,
  child: HierarchyNode
): HierarchyTree {
  if (!tree.root) return tree;

  const newRoot = addChildToNode(tree.root, parentId, child);
  if (newRoot === tree.root) return tree; // parent not found, no-op

  return { ...tree, root: newRoot, cursor: child.id };
}

/** Recursive helper to add child under target parent */
function addChildToNode(
  node: HierarchyNode,
  parentId: string,
  child: HierarchyNode
): HierarchyNode {
  if (node.id === parentId) {
    return { ...node, children: [...node.children, child] };
  }

  const newChildren = node.children.map((c) => addChildToNode(c, parentId, child));
  // Only create new object if children actually changed
  if (newChildren.every((c, i) => c === node.children[i])) {
    return node;
  }
  return { ...node, children: newChildren };
}

/**
 * Move the cursor to a specific node by ID.
 *
 * @consumer map-context.ts (when re-entering an existing node)
 */
export function moveCursor(tree: HierarchyTree, nodeId: string): HierarchyTree {
  if (!tree.root) return tree;
  const node = findNode(tree.root, nodeId);
  if (!node) return tree;
  return { ...tree, cursor: nodeId };
}

/**
 * Migrate a node from one parent to another.
 * 
 * @param tree - The hierarchy tree
 * @param nodeId - ID of the node to move
 * @param newParentId - ID of the new parent node
 * @returns Updated tree
 */
export function migrateNode(
  tree: HierarchyTree,
  nodeId: string,
  newParentId: string
): HierarchyTree {
  if (!tree.root) return tree;
  
  // Find the node to migrate
  const node = findNode(tree.root, nodeId);
  if (!node) return tree;
  
  // Find the new parent
  const newParent = findNode(tree.root, newParentId);
  if (!newParent) return tree;
  
  // Remove node from its current location
  const withoutNode = removeNodeFromTree(tree.root, nodeId);
  
  // Add node to new parent
  const withMigration = addChildToNode(withoutNode, newParentId, node);
  
  return { ...tree, root: withMigration };
}

/**
 * Remove a node from the tree by filtering it out at the parent level.
 * The removed node's children are NOT promoted — migrateNode re-attaches the whole subtree.
 */
function removeNodeFromTree(root: HierarchyNode, nodeId: string): HierarchyNode {
  // Filter out the target node from children; recurse into surviving children
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== nodeId)
      .map(child => removeNodeFromTree(child, nodeId)),
  };
}

/**
 * Mark a node as complete and set its completed timestamp.
 *
 * @consumer map-context.ts (status: "complete")
 */
export function markComplete(
  tree: HierarchyTree,
  nodeId: string,
  completedAt: number = Date.now()
): HierarchyTree {
  if (!tree.root) return tree;
  return {
    ...tree,
    root: updateNodeInTree(tree.root, nodeId, {
      status: "complete",
      completed: completedAt,
    }),
  };
}

/**
 * Update arbitrary fields on a node.
 *
 * @consumer markComplete, hierarchy tools
 */
function updateNodeInTree(
  node: HierarchyNode,
  nodeId: string,
  updates: Partial<HierarchyNode>
): HierarchyNode {
  if (node.id === nodeId) {
    return { ...node, ...updates };
  }
  const newChildren = node.children.map((c) => updateNodeInTree(c, nodeId, updates));
  if (newChildren.every((c, i) => c === node.children[i])) {
    return node;
  }
  return { ...node, children: newChildren };
}

// ============================================================
// Section 4: Queries
// ============================================================

/**
 * Find a node by ID anywhere in the tree. Returns null if not found.
 *
 * @consumer moveCursor, getCursorNode, getAncestors
 */
export function findNode(
  node: HierarchyNode,
  nodeId: string
): HierarchyNode | null {
  if (node.id === nodeId) return node;
  for (const child of node.children) {
    const found = findNode(child, nodeId);
    if (found) return found;
  }
  return null;
}

/**
 * Get the ancestry chain from root to the specified node.
 * Returns [root, ..., parent, node] — ordered from top to bottom.
 *
 * @consumer think-back.ts, toBrainProjection
 */
export function getAncestors(
  root: HierarchyNode,
  nodeId: string
): HierarchyNode[] {
  const path: HierarchyNode[] = [];

  function walk(node: HierarchyNode): boolean {
    path.push(node);
    if (node.id === nodeId) return true;
    for (const child of node.children) {
      if (walk(child)) return true;
    }
    path.pop();
    return false;
  }

  walk(root);
  return path;
}

/**
 * Get the node the cursor currently points to.
 *
 * @consumer session-lifecycle.ts, scan-hierarchy.ts
 */
export function getCursorNode(tree: HierarchyTree): HierarchyNode | null {
  if (!tree.root || !tree.cursor) return null;
  return findNode(tree.root, tree.cursor);
}

/**
 * Project the tree's cursor ancestry into the flat brain.json hierarchy format.
 * This maintains backward compatibility with existing hooks that read
 * brain.json.hierarchy as { trajectory, tactic, action }.
 *
 * @consumer map-context.ts → updateHierarchy(state, toBrainProjection(tree))
 */
export function toBrainProjection(tree: HierarchyTree): {
  trajectory: string;
  tactic: string;
  action: string;
} {
  const empty = { trajectory: "", tactic: "", action: "" };
  if (!tree.root || !tree.cursor) return empty;

  const ancestors = getAncestors(tree.root, tree.cursor);
  const result = { ...empty };

  for (const node of ancestors) {
    if (node.level === "trajectory") result.trajectory = node.content;
    else if (node.level === "tactic") result.tactic = node.content;
    else if (node.level === "action") result.action = node.content;
  }

  return result;
}

/**
 * Collect all nodes in the tree as a flat list (depth-first).
 *
 * @consumer getTreeStats, janitor
 */
export function flattenTree(root: HierarchyNode): HierarchyNode[] {
  const result: HierarchyNode[] = [];
  const stack: HierarchyNode[] = [root];

  while (stack.length > 0) {
    const node = stack.pop()!;
    result.push(node);

    // Push children in reverse order so they are processed in original order
    for (let i = node.children.length - 1; i >= 0; i--) {
      stack.push(node.children[i]);
    }
  }
  return result;
}

// ============================================================
// Section 5: Staleness
// ============================================================

/** Thresholds for gap severity classification (in ms) */
const GAP_THRESHOLDS = {
  /** <30 minutes = healthy */
  healthy: 30 * 60 * 1000,
  /** <2 hours = warm */
  warm: 2 * 60 * 60 * 1000,
  // >2 hours = stale
};

/**
 * Classify a time gap by severity.
 *
 * @consumer detectGaps, computeSiblingGap, computeParentChildGap
 */
export function classifyGap(gapMs: number): "healthy" | "warm" | "stale" {
  const absGap = Math.abs(gapMs);
  if (absGap <= GAP_THRESHOLDS.healthy) return "healthy";
  if (absGap <= GAP_THRESHOLDS.warm) return "warm";
  return "stale";
}

/**
 * Compute the timestamp gap between two sibling nodes.
 *
 * @consumer detectGaps
 */
export function computeSiblingGap(
  a: HierarchyNode,
  b: HierarchyNode
): TimestampGap {
  const gapMs = Math.abs(b.created - a.created);
  return {
    from: a.stamp,
    to: b.stamp,
    gapMs,
    relationship: "sibling",
    severity: classifyGap(gapMs),
  };
}

/**
 * Compute the timestamp gap between parent and child node.
 *
 * @consumer detectGaps
 */
export function computeParentChildGap(
  parent: HierarchyNode,
  child: HierarchyNode
): TimestampGap {
  const gapMs = Math.abs(child.created - parent.created);
  return {
    from: parent.stamp,
    to: child.stamp,
    gapMs,
    relationship: "parent-child",
    severity: classifyGap(gapMs),
  };
}

/**
 * Detect all timestamp gaps in the tree.
 * Returns gaps sorted by severity (stale first) then by gap size.
 *
 * @consumer check-drift.ts, session-lifecycle.ts (prompt injection)
 */
export function detectGaps(tree: HierarchyTree): TimestampGap[] {
  if (!tree.root) return [];

  const gaps: TimestampGap[] = [];

  function walkNode(node: HierarchyNode): void {
    // Parent-child gaps
    for (const child of node.children) {
      gaps.push(computeParentChildGap(node, child));
    }

    // Sibling gaps (between consecutive children)
    for (let i = 1; i < node.children.length; i++) {
      gaps.push(computeSiblingGap(node.children[i - 1], node.children[i]));
    }

    // Recurse into children
    for (const child of node.children) {
      walkNode(child);
    }
  }

  walkNode(tree.root);

  // Sort: stale first, then by gap size descending
  const severityOrder: Record<string, number> = { stale: 0, warm: 1, healthy: 2 };
  return gaps.sort((a, b) => {
    const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.gapMs - a.gapMs;
  });
}

/**
 * Compute the gap between the most recent node and now.
 * Useful for detecting context loss at session start.
 *
 * @consumer session-lifecycle.ts (cross-session gap detection)
 */
export function computeCurrentGap(tree: HierarchyTree): TimestampGap | null {
  if (!tree.root) return null;

  // Find the most recently created node
  const allNodes = flattenTree(tree.root);
  if (allNodes.length === 0) return null;

  let latest = allNodes[0];
  for (const node of allNodes) {
    if (node.created > latest.created) latest = node;
  }

  const now = Date.now();
  const gapMs = now - latest.created;

  return {
    from: latest.stamp,
    to: generateStamp(new Date()),
    gapMs,
    relationship: "parent-child", // conceptual: "now" is the next thing
    severity: classifyGap(gapMs),
  };
}

// ============================================================
// Section 6: Rendering
// ============================================================

/** Status emoji markers */
const STATUS_MARKERS: Record<ContextStatus, string> = {
  active: ">>",
  pending: "..",
  complete: "OK",
  blocked: "!!",
};

/**
 * Render the tree as an ASCII tree string.
 * Marks the cursor node with an arrow.
 *
 * @consumer scan-hierarchy.ts, session-lifecycle.ts (prompt injection), compact-session.ts
 */
export function toAsciiTree(tree: HierarchyTree): string {
  if (!tree.root) return "(empty hierarchy)";

  const lines: string[] = [];

  function renderNode(node: HierarchyNode, prefix: string, isLast: boolean, isRoot: boolean): void {
    const connector = isRoot ? "" : isLast ? "\\-- " : "|-- ";
    const marker = STATUS_MARKERS[node.status];
    const cursorMark = tree.cursor === node.id ? " <-- cursor" : "";
    const truncatedContent = node.content.length > 60
      ? node.content.slice(0, 57) + "..."
      : node.content;

    const levelLabel = node.level.charAt(0).toUpperCase() + node.level.slice(1);
    lines.push(`${prefix}${connector}[${marker}] ${levelLabel}: ${truncatedContent} (${node.stamp})${cursorMark}`);

    const childPrefix = isRoot ? "" : prefix + (isLast ? "    " : "|   ");
    for (let i = 0; i < node.children.length; i++) {
      renderNode(node.children[i], childPrefix, i === node.children.length - 1, false);
    }
  }

  renderNode(tree.root, "", true, true);
  return lines.join("\n");
}

/**
 * Render the tree as markdown for the session file's ## Hierarchy section.
 *
 * @consumer planning-fs.ts (session file rendering)
 */
export function toActiveMdBody(tree: HierarchyTree): string {
  if (!tree.root) return "No hierarchy declared.";

  const lines: string[] = [];

  function renderNode(node: HierarchyNode, depth: number): void {
    const indent = "  ".repeat(depth);
    const statusMark = node.status === "complete" ? "[x]" : "[ ]";
    const cursorMark = tree.cursor === node.id ? " **<< CURRENT**" : "";
    lines.push(`${indent}- ${statusMark} **${node.level}**: ${node.content} _(${node.stamp})_${cursorMark}`);

    for (const child of node.children) {
      renderNode(child, depth + 1);
    }
  }

  renderNode(tree.root, 0);
  return lines.join("\n");
}

/**
 * Compute summary statistics for the tree.
 *
 * @consumer scan-hierarchy.ts, session-lifecycle.ts (prompt injection)
 */
export function getTreeStats(tree: HierarchyTree): TreeStats {
  if (!tree.root) {
    return { totalNodes: 0, activeNodes: 0, completedNodes: 0, blockedNodes: 0, pendingNodes: 0, depth: 0 };
  }

  const allNodes = flattenTree(tree.root);
  let maxDepth = 0;

  function measureDepth(node: HierarchyNode, d: number): void {
    if (d > maxDepth) maxDepth = d;
    for (const child of node.children) {
      measureDepth(child, d + 1);
    }
  }

  measureDepth(tree.root, 1);

  return {
    totalNodes: allNodes.length,
    activeNodes: allNodes.filter((n) => n.status === "active").length,
    completedNodes: allNodes.filter((n) => n.status === "complete").length,
    blockedNodes: allNodes.filter((n) => n.status === "blocked").length,
    pendingNodes: allNodes.filter((n) => n.status === "pending").length,
    depth: maxDepth,
  };
}

// ============================================================
// Section 7: Janitor
// ============================================================

/**
 * Count completed leaf nodes in the tree.
 * Used by hooks to decide when to suggest pruning.
 *
 * @consumer soft-governance.ts (detection: completed branch pileup)
 */
export function countCompleted(tree: HierarchyTree): number {
  if (!tree.root) return 0;
  return flattenTree(tree.root).filter((n) => n.status === "complete").length;
}

/**
 * Summarize a branch into a single-line string.
 *
 * @consumer pruneCompleted
 */
export function summarizeBranch(node: HierarchyNode): string {
  const childCount = flattenTree(node).length - 1; // exclude self
  const status = node.status === "complete" ? "DONE" : node.status.toUpperCase();
  return `[${status}] ${node.content} (${childCount} sub-items, ${node.stamp})`;
}

/**
 * Prune all completed branches from the tree.
 * Completed nodes with all-completed children are replaced with a summary.
 * Preserves nodes that have non-completed descendants.
 *
 * @consumer hierarchy.ts tools (hierarchy_prune)
 */
export function pruneCompleted(tree: HierarchyTree): {
  tree: HierarchyTree;
  pruned: number;
  summaries: string[];
} {
  if (!tree.root) {
    return { tree, pruned: 0, summaries: [] };
  }

  const summaries: string[] = [];
  let pruned = 0;

  function pruneNode(node: HierarchyNode): HierarchyNode {
    // First, recurse into children
    const newChildren: HierarchyNode[] = [];

    for (const child of node.children) {
      // If child and all its descendants are complete, summarize it
      if (isFullyComplete(child)) {
        summaries.push(summarizeBranch(child));
        pruned += flattenTree(child).length;
        // Replace with summarized version (no children)
        newChildren.push({
          ...child,
          children: [],
          summary: summarizeBranch(child),
        });
      } else {
        newChildren.push(pruneNode(child));
      }
    }

    return { ...node, children: newChildren };
  }

  const newRoot = pruneNode(tree.root);

  // If cursor points to a pruned node, move it to root
  let newCursor = tree.cursor;
  if (newCursor && newRoot) {
    const cursorNode = findNode(newRoot, newCursor);
    if (!cursorNode || cursorNode.summary) {
      newCursor = newRoot.id;
    }
  }

  return {
    tree: { ...tree, root: newRoot, cursor: newCursor },
    pruned,
    summaries,
  };
}

/**
 * Check if a node and all its descendants are complete.
 *
 * @consumer pruneCompleted
 */
function isFullyComplete(node: HierarchyNode): boolean {
  if (node.status !== "complete") return false;
  return node.children.every(isFullyComplete);
}

// ============================================================
// Section 8: I/O
// ============================================================

/**
 * Resolve the path to hierarchy.json for a given project root.
 *
 * @consumer loadTree, saveTree, treeExists
 */
export function getHierarchyPath(projectRoot: string): string {
  return getEffectivePaths(projectRoot).hierarchy;
}

/**
 * Check if hierarchy.json exists.
 *
 * @consumer session-lifecycle.ts (migration detection), hierarchy.ts tools
 */
export function treeExists(projectRoot: string): boolean {
  return existsSync(getHierarchyPath(projectRoot));
}

/**
 * Load the hierarchy tree from disk.
 * Returns an empty tree if file doesn't exist or is corrupt.
 *
 * @consumer all tree consumers
 */
export async function loadTree(projectRoot: string): Promise<HierarchyTree> {
  const path = getHierarchyPath(projectRoot);

  try {
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);

    // Validate structure
    if (data && typeof data === "object" && "version" in data) {
      return data as HierarchyTree;
    }
    return createTree();
  } catch {
    return createTree();
  }
}

/**
 * Save the hierarchy tree to disk.
 *
 * @consumer declare-intent.ts, map-context.ts, compact-session.ts, hierarchy tools
 */
export async function saveTree(
  projectRoot: string,
  tree: HierarchyTree
): Promise<void> {
  const path = getHierarchyPath(projectRoot);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(tree, null, 2), "utf-8");
}

// ============================================================
// Section 9: Migration
// ============================================================

/**
 * Migrate from the flat hierarchy format (brain.json) to tree structure.
 * Creates a tree from existing { trajectory, tactic, action } strings.
 *
 * @consumer hierarchy.ts tools (hierarchy_migrate)
 */
export function migrateFromFlat(flat: {
  trajectory: string;
  tactic: string;
  action: string;
}): HierarchyTree {
  const tree = createTree();

  if (!flat.trajectory) return tree;

  // Create trajectory root
  const now = new Date();
  const root = createNode("trajectory", flat.trajectory, "active", now);
  let result = setRoot(tree, root);

  if (flat.tactic) {
    // Create tactic under trajectory — offset time by 1 minute for unique stamps
    const tacticTime = new Date(now.getTime() + 60_000);
    const tactic = createNode("tactic", flat.tactic, "active", tacticTime);
    result = addChild(result, root.id, tactic);

    if (flat.action) {
      // Create action under tactic — offset by 2 minutes
      const actionTime = new Date(now.getTime() + 120_000);
      const action = createNode("action", flat.action, "active", actionTime);
      result = addChild(result, tactic.id, action);
    }
  }

  return result;
}
