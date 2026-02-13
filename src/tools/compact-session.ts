/**
 * compact_session — Archive completed work and reset for next session.
 *
 * Agent Thought: "I'm done, archive this session"
 *
 * Design: Agent-Native lifecycle verb.
 *   1. Iceberg — 0-1 args, system handles archive + reset + index update
 *   2. Context Inference — reads active session from brain state
 *   3. Signal-to-Noise — 1-line summary output
 *   4. No-Shadowing — description matches agent intent
 *   5. Native Parallelism — single call, atomic archival
 *
 * Hierarchy Redesign Changes:
 *   - Archives hierarchy.json alongside session content
 *   - Includes tree ASCII view in archive
 *   - Resets hierarchy tree to empty
 *   - Updates manifest (marks session as compacted)
 */

import { tool, type ToolDefinition } from "@opencode-ai/plugin/tool"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import {
  createBrainState,
  generateSessionId,
  lockSession,
} from "../schemas/brain-state.js"
import {
  readActiveMd,
  archiveSession,
  updateIndexMd,
  resetActiveMd,
  listArchives,
  getExportDir,
} from "../lib/planning-fs.js"
import { generateExportData, generateJsonExport, generateMarkdownExport } from "../lib/session-export.js"
import { loadMems, saveMems, addMem } from "../lib/mems.js"
import {
  loadTree,
  saveTree,
  createTree,
  toAsciiTree,
  getTreeStats,
  treeExists,
  detectGaps,
  getAncestors,
  flattenTree,
  findNode,
  countCompleted,
  pruneCompleted,
} from "../lib/hierarchy-tree.js"
import type { HierarchyTree } from "../lib/hierarchy-tree.js"
import type { BrainState, MetricsState } from "../schemas/brain-state.js"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

// ============================================================
// Purification Scripts — pure, deterministic, model-agnostic
// These run INSIDE compact_session, NOT via agent cooperation.
// ============================================================

/** A turning point identified during session purification */
export interface TurningPoint {
  nodeId: string;
  stamp: string;
  level: string;
  content: string;
  type: 'completed' | 'stale_gap' | 'cursor_path';
  detail: string;
}

/**
 * Identify turning points in the hierarchy tree.
 * Pure, deterministic, model-agnostic — runs programmatically.
 *
 * Scans for:
 * 1. Cursor ancestry chain → type 'cursor_path'
 * 2. Completed nodes with timestamp → type 'completed'
 * 3. Stale gaps (from detectGaps) → type 'stale_gap'
 *
 * Returns sorted: cursor_path first, then completed, then stale_gap.
 *
 * @consumer compact_session execute()
 */
export function identifyTurningPoints(
  tree: HierarchyTree,
  _metrics: MetricsState
): TurningPoint[] {
  const turningPoints: TurningPoint[] = [];
  if (!tree.root) return turningPoints;

  // 1. Cursor ancestry chain → type 'cursor_path'
  if (tree.cursor) {
    const ancestors = getAncestors(tree.root, tree.cursor);
    for (const node of ancestors) {
      turningPoints.push({
        nodeId: node.id,
        stamp: node.stamp,
        level: node.level,
        content: node.content,
        type: 'cursor_path',
        detail: `Cursor ancestry: ${node.level} node`,
      });
    }
  }

  // 2. Completed nodes with timestamp → type 'completed'
  const allNodes = flattenTree(tree.root);
  for (const node of allNodes) {
    if (node.status === 'complete' && node.completed) {
      turningPoints.push({
        nodeId: node.id,
        stamp: node.stamp,
        level: node.level,
        content: node.content,
        type: 'completed',
        detail: `Completed at ${new Date(node.completed).toISOString()}`,
      });
    }
  }

  // 3. Stale gaps → type 'stale_gap'
  const gaps = detectGaps(tree);
  for (const gap of gaps) {
    if (gap.severity === 'stale') {
      turningPoints.push({
        nodeId: '',
        stamp: gap.from,
        level: '',
        content: `Gap: ${gap.from} → ${gap.to}`,
        type: 'stale_gap',
        detail: `${gap.relationship} gap of ${Math.round(gap.gapMs / 60000)}min (stale)`,
      });
    }
  }

  // Sort: cursor_path first, then completed, then stale_gap
  const typePriority: Record<string, number> = {
    cursor_path: 0,
    completed: 1,
    stale_gap: 2,
  };
  turningPoints.sort((a, b) => typePriority[a.type] - typePriority[b.type]);

  return turningPoints;
}

/**
 * Generate the next compaction report that the compaction hook will read.
 * Pure, deterministic, model-agnostic — budget-capped at 1800 chars.
 *
 * Structure:
 * - Active Work (non-completed nodes)
 * - Cursor Path (ancestry chain)
 * - Key Turning Points (completed items, stale gaps)
 * - Files Touched
 * - Resume Instructions
 *
 * @consumer compact_session execute()
 */
export function generateNextCompactionReport(
  tree: HierarchyTree,
  turningPoints: TurningPoint[],
  state: BrainState
): string {
  const BUDGET = 1800;
  const lines: string[] = [];

  lines.push('=== HiveMind Purification Report ===');
  lines.push(`Session: ${state.session.id} | Compaction #${(state.compaction_count ?? 0) + 1}`);
  lines.push('');

  // Active work
  lines.push('## Active Work (what to continue)');
  if (tree.root) {
    const allNodes = flattenTree(tree.root);
    const activeNodes = allNodes.filter(n => n.status !== 'complete');
    for (const node of activeNodes.slice(0, 10)) {
      lines.push(`- [${node.level}] ${node.content} (${node.stamp})`);
    }
    if (activeNodes.length > 10) {
      lines.push(`  ... and ${activeNodes.length - 10} more`);
    }
  } else {
    lines.push('- (no active work)');
  }
  lines.push('');

  // Cursor path
  lines.push('## Cursor Path (where you were)');
  const cursorPoints = turningPoints.filter(tp => tp.type === 'cursor_path');
  if (cursorPoints.length > 0) {
    lines.push(cursorPoints.map(tp => `${tp.level}: ${tp.content} (${tp.stamp})`).join(' > '));
  } else {
    lines.push('- (no cursor set)');
  }
  lines.push('');

  // Key turning points
  lines.push('## Key Turning Points');
  const keyPoints = turningPoints.filter(tp => tp.type !== 'cursor_path');
  if (keyPoints.length > 0) {
    for (const tp of keyPoints.slice(0, 8)) {
      lines.push(`- [${tp.type}] ${tp.content}: ${tp.detail}`);
    }
  } else {
    lines.push('- (none)');
  }
  lines.push('');

  // Files touched
  lines.push('## Files Touched');
  if (state.metrics.files_touched.length > 0) {
    for (const f of state.metrics.files_touched.slice(0, 10)) {
      lines.push(`- ${f}`);
    }
    if (state.metrics.files_touched.length > 10) {
      lines.push(`  ... and ${state.metrics.files_touched.length - 10} more`);
    }
  } else {
    lines.push('- (none)');
  }
  lines.push('');

  // Resume instructions
  lines.push('## Resume Instructions');
  const cursorNode = tree.root && tree.cursor ? findNode(tree.root, tree.cursor) : null;
  if (cursorNode) {
    lines.push(`- You were working on: ${cursorNode.content}`);
  } else {
    lines.push('- You were working on: (no active cursor)');
  }
  lines.push('- Next step: Continue from the cursor position shown above');
  lines.push('=== End Purification Report ===');

  let report = lines.join('\n');

  // Budget enforcement
  if (report.length > BUDGET) {
    report = report.slice(0, BUDGET - 35) + '\n=== End Purification Report ===';
  }

  return report;
}

export function createCompactSessionTool(directory: string): ToolDefinition {
  return tool({
    description:
      "Archive completed work and reset for next session. " +
      "Call this when you're done with your current work.",
    args: {
      summary: tool.schema
        .string()
        .optional()
        .describe("Optional 1-line summary of what was accomplished"),
    },
    async execute(args, _context) {
      const stateManager = createStateManager(directory)
      const config = await loadConfig(directory)

      // Load brain state
      const state = await stateManager.load()
      if (!state) {
        return "ERROR: No active session to compact. Call declare_intent to start a session first."
      }

      // Read current active.md content for archival
      const activeMd = await readActiveMd(directory)

      // Load tree ONCE — reused for archive content + purification
      const hasTree = treeExists(directory)
      const tree = hasTree ? await loadTree(directory) : createTree()

      // === Build archive content including tree ===
      const archiveLines = [
        `# Archived Session: ${state.session.id}`,
        "",
        `**Mode**: ${state.session.mode}`,
        `**Started**: ${new Date(state.session.start_time).toISOString()}`,
        `**Archived**: ${new Date().toISOString()}`,
        `**Turns**: ${state.metrics.turn_count}`,
        `**Drift Score**: ${state.metrics.drift_score}/100`,
        `**Files Touched**: ${state.metrics.files_touched.length}`,
        `**Context Updates**: ${state.metrics.context_updates}`,
        "",
        "## Hierarchy at Archive",
      ]

      // Include tree view if available
      if (hasTree && tree.root) {
        const stats = getTreeStats(tree)
        archiveLines.push(`Tree (${stats.totalNodes} nodes):`)
        archiveLines.push("```")
        archiveLines.push(toAsciiTree(tree))
        archiveLines.push("```")
        archiveLines.push(`Completed: ${stats.completedNodes} | Active: ${stats.activeNodes}`)
      } else {
        // Flat hierarchy fallback
        if (state.hierarchy.trajectory) archiveLines.push(`- **Trajectory**: ${state.hierarchy.trajectory}`)
        if (state.hierarchy.tactic) archiveLines.push(`- **Tactic**: ${state.hierarchy.tactic}`)
        if (state.hierarchy.action) archiveLines.push(`- **Action**: ${state.hierarchy.action}`)
      }

      archiveLines.push("")
      archiveLines.push("## Session Content")
      archiveLines.push(activeMd.body)

      const archiveContent = archiveLines.filter(Boolean).join("\n")

      // Archive the session
      await archiveSession(directory, state.session.id, archiveContent)

      // Update index.md with summary
      const summaryLine =
        args.summary ||
        `Session ${state.session.id}: ${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`
      await updateIndexMd(directory, summaryLine)

      // Generate auto-export
      try {
        const exportData = generateExportData(state, summaryLine)
        const exportDir = getExportDir(directory)
        await mkdir(exportDir, { recursive: true })

        const timestamp = new Date().toISOString().split("T")[0]
        const baseName = `session_${timestamp}_${state.session.id}`

        await writeFile(
          join(exportDir, `${baseName}.json`),
          generateJsonExport(exportData)
        )

        await writeFile(
          join(exportDir, `${baseName}.md`),
          generateMarkdownExport(exportData, activeMd.body)
        )
      } catch {
        // Export failure is non-fatal
      }

      // Auto-save session summary as a "context" mem
      try {
        let memsState = await loadMems(directory)
        const autoContent = [
          `Session ${state.session.id}:`,
          args.summary || `${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files`,
          state.hierarchy.trajectory ? `Trajectory: ${state.hierarchy.trajectory}` : "",
          state.hierarchy.tactic ? `Tactic: ${state.hierarchy.tactic}` : "",
        ].filter(Boolean).join(" | ")

        memsState = addMem(
          memsState,
          "context",
          autoContent,
          ["auto-compact", "session-summary"],
          state.session.id
        )
        await saveMems(directory, memsState)
      } catch {
        // Auto-mem failure is non-fatal
      }

      // === Purification scripts ===
      // Step 1: Identify turning points from tree
      const turningPoints = identifyTurningPoints(tree, state.metrics)

      // Step 2: Generate next-compaction report
      const purificationReport = generateNextCompactionReport(tree, turningPoints, state)

      // Step 3: Auto-prune if too many completed branches
      let prunedCount = 0
      if (hasTree && countCompleted(tree) >= 5) {
        const pruneResult = pruneCompleted(tree)
        prunedCount = pruneResult.pruned
        // Save the pruned tree before reset (archive already captured original)
        await saveTree(directory, pruneResult.tree)
      }

      // === Reset sequence — guarded to prevent partial state corruption ===
      let resetError: string | null = null
      try {
        if (hasTree) {
          await saveTree(directory, createTree())
        }

        await resetActiveMd(directory)

        const compactionCount = (state.compaction_count ?? 0) + 1;
        const compactionTime = Date.now();

        const newSessionId = generateSessionId()
        const newState = createBrainState(newSessionId, config)
        newState.compaction_count = compactionCount;
        newState.last_compaction_time = compactionTime;
        newState.next_compaction_report = purificationReport;
        await stateManager.save(lockSession(newState))
      } catch (err: unknown) {
        resetError = `Reset partially failed after archive: ${err}`
      }

      // Count archives for output
      const archives = await listArchives(directory)

      const purificationSummary = `Purified: ${turningPoints.length} turning points${prunedCount > 0 ? `, ${prunedCount} completed pruned` : ''}.`
      const resetNote = resetError ? `\n⚠ ${resetError}` : ""
      return `Archived. ${state.metrics.turn_count} turns, ${state.metrics.files_touched.length} files saved. ${archives.length} total archives. Session reset.\n${purificationSummary}${resetNote}\n→ Session is now LOCKED. Call declare_intent to start new work.`
    },
  })
}
