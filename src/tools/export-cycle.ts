/**
 * export_cycle — Capture subagent results into hierarchy + mems brain.
 *
 * Agent Thought: "Subagent just returned — I need to capture what happened"
 *
 * Design:
 *   1. Iceberg — 2 required args (outcome, findings)
 *   2. Context Inference — reads current action from hierarchy tree cursor
 *   3. Signal-to-Noise — 1-line confirmation
 *   4. No-Shadowing — matches natural "subagent returned" thought
 *
 * Internal scripts (zero agent cooperation):
 *   1. Marks current action node as complete (success) or blocked (failure/partial)
 *   2. Saves findings to mems brain (shelf: cycle-intel)
 *   3. Clears pending_failure_ack flag
 *   4. Links to timestamp chain for grep-ability
 */
import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { createStateManager } from "../lib/persistence.js";
import { clearPendingFailureAck, updateHierarchy } from "../schemas/brain-state.js";
import { loadMems, saveMems, addMem } from "../lib/mems.js";
import {
  loadTree,
  saveTree,
  markComplete,
  getCursorNode,
  generateStamp,
  toBrainProjection,
} from "../lib/hierarchy-tree.js";

const VALID_OUTCOMES = ["success", "partial", "failure"] as const;

export function createExportCycleTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Capture subagent (Task) results into the hierarchy tree and mems brain. " +
      "Call this after EVERY subagent returns. Structures outcomes for cross-session traceability.",
    args: {
      outcome: tool.schema
        .enum(VALID_OUTCOMES)
        .describe("Result of the subagent cycle: success | partial | failure"),
      findings: tool.schema
        .string()
        .describe("What was learned or decided (1-3 sentences)"),
    },
    async execute(args, _context) {
      if (!args.findings?.trim()) {
        return "ERROR: findings cannot be empty. Describe what the subagent accomplished or why it failed.";
      }

      const stateManager = createStateManager(directory);
      let state = await stateManager.load();
      if (!state) {
        return "ERROR: No active session. Call declare_intent first.";
      }

      const sessionId = state.session.id;
      const stamp = generateStamp(new Date());

      // === Internal Script 1: Update hierarchy tree ===
      let treeAction = "no tree";
      let hierarchyProjected = false;
      try {
        let tree = await loadTree(directory);
        if (tree.root) {
          const cursorNode = getCursorNode(tree);
          if (cursorNode && cursorNode.level === "action") {
            if (args.outcome === "success") {
              tree = markComplete(tree, cursorNode.id);
              treeAction = `action "${cursorNode.content}" → complete`;
            } else {
              // Mark as blocked by updating status (not markComplete which sets completed stamp)
              tree = {
                ...tree,
                root: updateNodeStatus(tree.root!, cursorNode.id, "blocked"),
              };
              treeAction = `action "${cursorNode.content}" → blocked`;
            }
            await saveTree(directory, tree);
            const projection = toBrainProjection(tree);
            state = updateHierarchy(state, projection);
            hierarchyProjected = true;
          } else if (cursorNode) {
            treeAction = `cursor at ${cursorNode.level} (no action to update)`;
          }
        }
      } catch {
        treeAction = "tree update failed (non-fatal)";
      }

      // === Internal Script 2: Save findings to mems brain ===
      let memAction = "saved";
      try {
        let memsState = await loadMems(directory);
        const tags = [
          "cycle-result",
          args.outcome,
          `stamp:${stamp}`,
        ];
        const content = `[${args.outcome.toUpperCase()}] ${args.findings}`;
        memsState = addMem(memsState, "cycle-intel", content, tags, sessionId);
        await saveMems(directory, memsState);
        memAction = `saved (${memsState.mems.length} total)`;
      } catch {
        memAction = "mem save failed (non-fatal)";
      }

      // === Internal Script 3: Clear pending_failure_ack ===
      const hadPendingAck = state.pending_failure_ack ?? false;
      state = clearPendingFailureAck(state);
      await stateManager.save(state);

      // Build confirmation
      const ackNote = hadPendingAck ? " Failure acknowledged." : "";
      return `Cycle exported [${args.outcome}]. Tree: ${treeAction}. Projection: ${hierarchyProjected ? "synced" : "unchanged"}. Mem: ${memAction}.${ackNote}\n→ ${args.outcome === "failure" ? "Consider map_context with status \"blocked\" to update hierarchy." : "Continue working."}`;
    },
  });
}

/**
 * Recursively update a node's status in the tree.
 * Used for marking nodes as "blocked" without setting completed timestamp.
 */
function updateNodeStatus(
  node: import("../lib/hierarchy-tree.js").HierarchyNode,
  targetId: string,
  status: string
): import("../lib/hierarchy-tree.js").HierarchyNode {
  if (node.id === targetId) {
    return { ...node, status: status as any };
  }
  return {
    ...node,
    children: node.children.map(child => updateNodeStatus(child, targetId, status)),
  };
}
