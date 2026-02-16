/**
 * hivemind_hierarchy — Unified hierarchy tree management tool.
 *
 * Merged from: hierarchy_prune, hierarchy_migrate
 * Actions: prune (trim dead branches), migrate (move nodes), status (show tree stats)
 *
 * Design:
 *   1. Iceberg — minimal args, system handles tree operations
 *   2. Context Inference — session ID from brain state, reads from hierarchy.json
 *   3. Signal-to-Noise — structured output with actionable guidance
 *   4. HC5 Compliance — --json flag for deterministic machine-parseable output
 *   5. Dry-Run — --dry-run flag for safe preview
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import type { HierarchyNode } from "../lib/hierarchy-tree.js"
import {
  loadTree,
  saveTree,
  pruneCompleted,
  migrateNode,
  treeExists,
  getTreeStats,
  getCursorNode,
} from "../lib/hierarchy-tree.js"
import { toSuccessOutput, toErrorOutput } from "../lib/tool-response.js"

export function createHivemindHierarchyTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Manage the hierarchy tree structure. " +
      "Actions: prune (remove dead/completed branches), migrate (move a node), status (tree stats). " +
      "Use --dry-run to preview without making changes. Use --json for machine-parseable output.",
    args: {
      action: tool.schema
        .enum(["prune", "migrate", "status"])
        .describe("What to do: prune | migrate | status"),
      nodeId: tool.schema
        .string()
        .optional()
        .describe("For migrate: node ID to move"),
      parentId: tool.schema
        .string()
        .optional()
        .describe("For migrate: new parent ID"),
      dryRun: tool.schema
        .boolean()
        .optional()
        .describe("Preview changes without applying (prune only)"),
      json: tool.schema
        .boolean()
        .optional()
        .describe("Output as machine-parseable JSON (HC5)"),
    },
    async execute(args, _context) {
      const jsonOutput = args.json ?? false
      const dryRun = args.dryRun ?? false

      switch (args.action) {
        case "prune":
          return handlePrune(directory, dryRun, jsonOutput)
        case "migrate":
          return handleMigrate(directory, args.nodeId, args.parentId, jsonOutput)
        case "status":
          return handleStatus(directory, jsonOutput)
        default:
          return jsonOutput
            ? toErrorOutput(`Unknown action: ${args.action}`)
            : `ERROR: Unknown action. Use prune, migrate, or status.`
      }
    },
  })
}

async function handlePrune(directory: string, dryRun: boolean, jsonOutput: boolean): Promise<string> {
  if (!treeExists(directory)) {
    return jsonOutput
      ? toErrorOutput("No hierarchy tree exists")
      : "ERROR: No hierarchy tree exists. Use hivemind_session start or update to create one."
  }

  const tree = await loadTree(directory)
  const beforeStats = getTreeStats(tree)

  // Check for completed branches
  const completedBranches = tree.root
    ? findCompletedBranches(tree.root)
    : []

  if (completedBranches.length === 0) {
    return jsonOutput
      ? toSuccessOutput("No completed branches to prune", undefined, { pruned: 0 })
      : "No completed branches to prune."
  }

  if (dryRun) {
    if (jsonOutput) {
      return toSuccessOutput("Dry run complete", undefined, {
        dryRun: true,
        wouldPrune: completedBranches.length,
        nodes: completedBranches.map(n => ({ id: n.id, content: n.content })),
        before: beforeStats,
      })
    }

    const lines: string[] = []
    lines.push("=== DRY RUN: Would prune these branches ===")
    lines.push("")
    for (const node of completedBranches.slice(0, 10)) {
      lines.push(`  - ${node.id}: ${node.content.slice(0, 50)}`)
    }
    if (completedBranches.length > 10) {
      lines.push(`  ... and ${completedBranches.length - 10} more`)
    }
    lines.push("")
    lines.push(`Total nodes to remove: ${completedBranches.length}`)
    lines.push("=== END DRY RUN ===")
    return lines.join("\n")
  }

  // Actually prune using pruneCompleted
  const pruneResult = pruneCompleted(tree)
  await saveTree(directory, pruneResult.tree)
  const afterStats = getTreeStats(pruneResult.tree)

  if (jsonOutput) {
    return toSuccessOutput(`Pruned ${pruneResult.pruned} branches`, undefined, {
      pruned: pruneResult.pruned,
      before: { totalNodes: beforeStats.totalNodes, depth: beforeStats.depth },
      after: { totalNodes: afterStats.totalNodes, depth: afterStats.depth },
    })
  }

  return `Pruned ${pruneResult.pruned} completed branch(es).
Tree size: ${beforeStats.totalNodes} → ${afterStats.totalNodes} nodes
Depth: ${beforeStats.depth} → ${afterStats.depth}`
}

function findCompletedBranches(node: HierarchyNode): Array<{ id: string; content: string }> {
  const result: Array<{ id: string; content: string }> = []

  if (node.status === "complete") {
    result.push({ id: node.id, content: node.content })
  }

  if (node.children) {
    for (const child of node.children) {
      result.push(...findCompletedBranches(child))
    }
  }

  return result
}

async function handleMigrate(
  directory: string,
  nodeId?: string,
  parentId?: string,
  jsonOutput?: boolean
): Promise<string> {
  if (!nodeId || !parentId) {
    return jsonOutput
      ? toErrorOutput("nodeId and parentId are required")
      : "ERROR: Both nodeId and parentId are required for migrate."
  }

  if (!treeExists(directory)) {
    return jsonOutput
      ? toErrorOutput("No hierarchy tree exists")
      : "ERROR: No hierarchy tree exists."
  }

  const tree = await loadTree(directory)
  const node = findNodeById(tree.root, nodeId)

  if (!node) {
    return jsonOutput
      ? toErrorOutput(`Node ${nodeId} not found in hierarchy`)
      : `ERROR: Node ${nodeId} not found in hierarchy.`
  }

  const parent = findNodeById(tree.root, parentId)

  if (!parent) {
    return jsonOutput
      ? toErrorOutput(`Parent node ${parentId} not found in hierarchy`)
      : `ERROR: Parent node ${parentId} not found in hierarchy.`
  }

  // Perform migration
  migrateNode(tree, nodeId, parentId)
  await saveTree(directory, tree)

  if (jsonOutput) {
    return toSuccessOutput("Node migrated", nodeId, {
      nodeId,
      fromParent: node.parentId,
      toParent: parentId,
      success: true,
    })
  }

  return `Migrated node ${nodeId} from ${node.parentId} to ${parentId}.
Node: ${node.content.slice(0, 50)}`
}

function findNodeById(
  node: { id: string; children: unknown[] } | null,
  targetId: string
): { id: string; parentId: string; content: string } | null {
  if (!node) return null
  if (node.id === targetId) {
    return { id: node.id, parentId: "", content: "" }
  }

  for (const child of node.children as Array<{ id: string; parentId?: string; content: string; children: unknown[] }>) {
    if (child.id === targetId) {
      return { id: child.id, parentId: node.id, content: (child as { content: string }).content }
    }
    const found = findNodeById(child as { id: string; children: unknown[] }, targetId)
    if (found) return found
  }

  return null
}

async function handleStatus(directory: string, jsonOutput: boolean): Promise<string> {
  if (!treeExists(directory)) {
    return jsonOutput
      ? toSuccessOutput("No hierarchy tree", undefined, { exists: false })
      : "No hierarchy tree exists. Use hivemind_session start or update to create one."
  }

  const tree = await loadTree(directory)
  const stats = getTreeStats(tree)
  const cursor = getCursorNode(tree)

  if (jsonOutput) {
    return toSuccessOutput("Hierarchy status", undefined, {
      exists: true,
      totalNodes: stats.totalNodes,
      depth: stats.depth,
      activeNodes: stats.activeNodes,
      completedNodes: stats.completedNodes,
      pendingNodes: stats.pendingNodes,
      cursor: cursor
        ? { id: cursor.id, level: cursor.level, content: cursor.content, status: cursor.status }
        : null,
    })
  }

  const lines: string[] = []
  lines.push("=== HIERARCHY STATUS ===")
  lines.push("")
  lines.push(`Total nodes: ${stats.totalNodes}`)
  lines.push(`Depth: ${stats.depth}`)
  lines.push(`Active: ${stats.activeNodes} | Completed: ${stats.completedNodes} | Pending: ${stats.pendingNodes}`)

  if (cursor) {
    lines.push("")
    lines.push(`Cursor: [${cursor.level}] ${cursor.content.slice(0, 50)} (${cursor.status})`)
  }

  lines.push("=== END STATUS ===")
  return lines.join("\n")
}
