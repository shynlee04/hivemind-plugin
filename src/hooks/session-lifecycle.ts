/**
 * Session Lifecycle Hook — Prompt Compilation Engine.
 *
 * Fires EVERY turn (experimental.chat.system.transform):
 *   - Reads all detection counters from brain.json
 *   - Reads timestamp gaps from hierarchy.json
 *   - Compiles detected signals into <hivemind> prompt injection
 *   - Budget-capped (2500 chars, lowest priority dropped)
 *   - Handles stale session auto-archival
 *
 * This is the PROMPT engine. It reads detection state written by
 * soft-governance.ts (tool.execute.after) and compiles into warnings
 * that reshape the agent's next decision.
 *
 * P3: try/catch — never break session lifecycle
 * P5: Config re-read from disk each invocation (Rule 6)
 */

import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { generateAgentBehaviorPrompt } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import {
  createBrainState,
  generateSessionId,
} from "../schemas/brain-state.js"
import {
  archiveSession,
  initializePlanningDirectory,
  readActiveMd,
  resetActiveMd,
  updateIndexMd,
} from "../lib/planning-fs.js"
import { isSessionStale } from "../lib/staleness.js"
import { detectChainBreaks } from "../lib/chain-analysis.js"
import { loadAnchors } from "../lib/anchors.js"
import { detectLongSession } from "../lib/long-session.js"
import { getToolActivation } from "../lib/tool-activation.js"
import {
  compileSignals,
  formatSignals,
  createDetectionState,
  DEFAULT_THRESHOLDS,
  type DetectionState,
} from "../lib/detection.js"
import {
  loadTree,
  toAsciiTree,
  detectGaps,
  getTreeStats,
  treeExists,
  countCompleted,
} from "../lib/hierarchy-tree.js"

/**
 * Creates the session lifecycle hook (system prompt transform).
 *
 * Injects current session context into the system prompt:
 *   - Hierarchy state (trajectory/tactic/action)
 *   - Governance status (LOCKED/OPEN)
 *   - Session metrics (drift score, turn count)
 *
 * Budget: ≤2500 chars. Sections assembled by priority, lowest dropped if over budget. ADD, not REPLACE.
 */
export function createSessionLifecycleHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory)

  return async (
    input: { sessionID?: string; model?: any },
    output: { system: string[] }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      // Load or create brain state
      let state = await stateManager.load()
      if (!state) {
        // First session — initialize
        await initializePlanningDirectory(directory)
        const sessionId = generateSessionId()
        state = createBrainState(sessionId, config)
        await stateManager.save(state)
      }

      // Time-to-Stale: auto-archive if session idle > configured days
      if (state && isSessionStale(state, config.stale_session_days)) {
        try {
          const activeMd = await readActiveMd(directory);
          const archiveContent = [
            `# Auto-Archived (Stale): ${state.session.id}`,
            "",
            `**Reason**: Session idle > ${config.stale_session_days} days`,
            `**Mode**: ${state.session.mode}`,
            `**Last Activity**: ${new Date(state.session.last_activity).toISOString()}`,
            `**Archived**: ${new Date().toISOString()}`,
            `**Turns**: ${state.metrics.turn_count}`,
            "",
            "## Session Content",
            activeMd.body,
          ].filter(Boolean).join("\n");

          const staleSessionId = state.session.id;
          await archiveSession(directory, staleSessionId, archiveContent);
          await updateIndexMd(directory, `[auto-archived: stale] ${staleSessionId}`);
          await resetActiveMd(directory);

          // Create fresh session
          const newId = generateSessionId();
          state = createBrainState(newId, config);
          await stateManager.save(state);

          await log.info(`Auto-archived stale session ${staleSessionId}`);
        } catch (archiveError) {
          await log.error(`Failed to auto-archive stale session: ${archiveError}`);
        }
      }

      // Build sections in priority order
      const statusLines: string[] = []
      const hierarchyLines: string[] = []
      const warningLines: string[] = []
      const anchorLines: string[] = []
      const metricsLines: string[] = []
      const configLines: string[] = []

      // STATUS (always shown)
      statusLines.push(`Session: ${state.session.governance_status} | Mode: ${state.session.mode} | Governance: ${state.session.governance_mode}`)

      // HIERARCHY: prefer tree if available, fall back to flat
      if (treeExists(directory)) {
        try {
          const tree = await loadTree(directory);
          const stats = getTreeStats(tree);
          if (tree.root) {
            const treeView = toAsciiTree(tree);
            // Truncate tree view for prompt budget
            const treeLines = treeView.split('\n');
            if (treeLines.length > 8) {
              hierarchyLines.push(...treeLines.slice(0, 8));
              hierarchyLines.push(`  ... (${stats.totalNodes} nodes total)`);
            } else {
              hierarchyLines.push(treeView);
            }
          }
        } catch {
          // Fall back to flat if tree read fails
          if (state.hierarchy.trajectory) hierarchyLines.push(`Trajectory: ${state.hierarchy.trajectory}`)
          if (state.hierarchy.tactic) hierarchyLines.push(`Tactic: ${state.hierarchy.tactic}`)
          if (state.hierarchy.action) hierarchyLines.push(`Action: ${state.hierarchy.action}`)
        }
      } else {
        if (state.hierarchy.trajectory) hierarchyLines.push(`Trajectory: ${state.hierarchy.trajectory}`)
        if (state.hierarchy.tactic) hierarchyLines.push(`Tactic: ${state.hierarchy.tactic}`)
        if (state.hierarchy.action) hierarchyLines.push(`Action: ${state.hierarchy.action}`)
      }

      // No hierarchy = prompt to declare intent
      if (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action) {
        if (config.governance_mode === "strict") {
          warningLines.push("No intent declared. Use declare_intent to unlock the session before writing.")
        } else {
          warningLines.push("Tip: Use declare_intent to set your work focus for better tracking.")
        }
      }

      // WARNINGS (shown if present) — detection signal compilation
      // Read detection state from brain.json.metrics (written by soft-governance.ts)
      const detection: DetectionState = {
        consecutive_failures: state.metrics.consecutive_failures ?? 0,
        consecutive_same_section: state.metrics.consecutive_same_section ?? 0,
        last_section_content: state.metrics.last_section_content ?? "",
        tool_type_counts: state.metrics.tool_type_counts ?? createDetectionState().tool_type_counts,
        keyword_flags: state.metrics.keyword_flags ?? [],
      }

      // Compute timestamp gap from hierarchy tree
      let maxGapMs: number | undefined;
      let sessionFileLines: number | undefined;
      let completedBranchCount: number | undefined;
      if (treeExists(directory)) {
        try {
          const tree = await loadTree(directory);
          const gaps = detectGaps(tree);
          const staleGaps = gaps.filter(g => g.severity === "stale");
          if (staleGaps.length > 0) {
            maxGapMs = Math.max(...staleGaps.map(g => g.gapMs));
          }
          // Reuse loaded tree for completed branch count
          completedBranchCount = countCompleted(tree);
        } catch {
          // Tree read failure is non-fatal for detection
        }
      }

      // Compute session file line count (for max_active_md_lines threshold)
      try {
        const activeMd = await readActiveMd(directory);
        if (activeMd.body) {
          sessionFileLines = activeMd.body.split('\n').length;
        }
      } catch {
        // Non-fatal — line count is best-effort
      }

      // Compile detection signals with merged thresholds
      const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...config.detection_thresholds }
      // Wire max_active_md_lines into detection thresholds (config → threshold bridge)
      if (!config.detection_thresholds?.session_file_lines) {
        mergedThresholds.session_file_lines = config.max_active_md_lines;
      }
      const signals = compileSignals({
        turnCount: state.metrics.turn_count,
        detection,
        completedBranches: completedBranchCount,
        hierarchyActionEmpty: state.hierarchy.action === '',
        timestampGapMs: maxGapMs,
        sessionFileLines,
        missingTree: !treeExists(directory),
        thresholds: mergedThresholds,
        maxSignals: 3,
      })
      const signalBlock = formatSignals(signals)
      if (signalBlock) {
        warningLines.push(signalBlock)
      }

      // Legacy drift warning (kept for backward compat with tests)
      if (state.metrics.drift_score < 50 && !signals.some(s => s.type === "turn_count")) {
        warningLines.push("⚠ High drift detected. Use map_context to re-focus.")
      }

      // PENDING FAILURE ACK — subagent reported failure, agent hasn't acknowledged
      if (state.pending_failure_ack) {
        warningLines.push("⚠ SUBAGENT REPORTED FAILURE. Call export_cycle or map_context with status \"blocked\" before proceeding.")
      }

      // Chain breaks
      const chainBreaks = detectChainBreaks(state)
      if (chainBreaks.length > 0) {
        warningLines.push("⚠ Chain breaks: " + chainBreaks.map(b => b.message).join("; "))
      }

      // Long session detection
      const longSession = detectLongSession(state, config.auto_compact_on_turns)
      if (longSession.isLong) {
        warningLines.push(`⏰ ${longSession.suggestion}`)
      }

      // TOOL ACTIVATION SUGGESTION
      const toolHint = getToolActivation(state, {
        completedBranches: completedBranchCount,
        hasMissingTree: !treeExists(directory),
        postCompaction: (state.last_compaction_time ?? 0) > 0 && state.metrics.turn_count <= 1,
      })
      if (toolHint) {
        warningLines.push(`💡 Suggested: ${toolHint.tool} — ${toolHint.reason}`)
      }

      // ANCHORS with age (shown if present)
      const anchorsState = await loadAnchors(directory)
      if (anchorsState.anchors.length > 0) {
        anchorLines.push("<immutable-anchors>")
        for (const anchor of anchorsState.anchors) {
          const age = Date.now() - anchor.created_at
          const ageStr = age < 3600000 ? `${Math.floor(age / 60000)}m ago` :
                         age < 86400000 ? `${Math.floor(age / 3600000)}h ago` :
                         `${Math.floor(age / 86400000)}d ago`
          anchorLines.push(`  [${anchor.key}] (${ageStr}): ${anchor.value}`)
        }
        anchorLines.push("</immutable-anchors>")
      }

      // METRICS (shown if space)
      metricsLines.push(`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`)

      // AGENT CONFIG (shown if space)
      const agentConfigPrompt = generateAgentBehaviorPrompt(config.agent_behavior)
      configLines.push(agentConfigPrompt)

      // Assemble by priority — drop lowest priority sections if over budget
      const BUDGET_CHARS = 2500
      const sections = [
        statusLines,    // P1: always
        hierarchyLines, // P2: always
        warningLines,   // P3: if present
        anchorLines,    // P4: if present
        metricsLines,   // P5: if space
        configLines,    // P6: if space (agent config is lowest priority per-turn)
      ]

      const finalLines: string[] = ['<hivemind>']
      for (const section of sections) {
        if (section.length === 0) continue
        const candidate = [...finalLines, ...section, '</hivemind>'].join('\n')
        if (candidate.length <= BUDGET_CHARS) {
          finalLines.push(...section)
        } else {
          await log.debug(`Section dropped due to budget: ${section[0]?.slice(0, 40)}...`)
        }
      }
      finalLines.push('</hivemind>')

      const injection = finalLines.join('\n')

      output.system.push(injection)

      await log.debug(
        `Session lifecycle: injected ${injection.length} chars`
      )
    } catch (error) {
      // P3: Never break session lifecycle
      await log.error(`Session lifecycle hook error: ${error}`)
    }
  }
}
