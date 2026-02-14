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

import { existsSync } from "node:fs"
import type { Logger } from "../lib/logging.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { generateAgentBehaviorPrompt, isCoachAutomation } from "../schemas/config.js"
import { createStateManager, loadConfig } from "../lib/persistence.js"
import { getEffectivePaths, isLegacyStructure } from "../lib/paths.js"
import { migrateIfNeeded } from "../lib/migrate.js"
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
  compileEscalatedSignals,
  compileIgnoredTier,
  formatSignals,
  formatIgnoredEvidence,
  createDetectionState,
  DEFAULT_THRESHOLDS,
  type DetectionState,
} from "../lib/detection.js"
import {
  createTree,
  loadTree,
  saveTree,
  toAsciiTree,
  detectGaps,
  getTreeStats,
  treeExists,
  countCompleted,
  getCursorNode,
  getAncestors,
} from "../lib/hierarchy-tree.js"
import {
  detectFrameworkContext,
  buildFrameworkSelectionMenu,
} from "../lib/framework-context.js"

import {
  collectProjectSnapshot,
  generateBootstrapBlock,
  generateEvidenceDisciplineBlock,
  generateTeamBehaviorBlock,
  compileFirstTurnContext,
  generateSetupGuidanceBlock,
  getNextStepHint,
  localized,
  generateProjectBackboneBlock,
} from "./session-lifecycle-helpers.js";

/**
 * Creates the session lifecycle hook (system prompt transform).
 *
 * Injects current session context into the system prompt:
 *   - Hierarchy state (trajectory/tactic/action)
 *   - Governance status (LOCKED/OPEN)
 *   - Session metrics (drift score, turn count)
 *   - Behavioral bootstrap (when LOCKED, first 2 turns)
 *   - First-turn context (anchors, mems, prior session — turns 0-1)
 *
 * Budget: ≤2500 chars normally, ≤4500 chars when bootstrap active.
 * Sections assembled by priority, lowest dropped if over budget. ADD, not REPLACE.
 */
export function createSessionLifecycleHook(
  log: Logger,
  directory: string,
  _initConfig: HiveMindConfig
) {
  const stateManager = createStateManager(directory, log)

  return async (
    input: { sessionID?: string; model?: any },
    output: { system: string[] }
  ): Promise<void> => {
    try {
      if (!input.sessionID) return

      if (isLegacyStructure(directory)) {
        await migrateIfNeeded(directory, log)
      }

      // Rule 6: Re-read config from disk each invocation
      const config = await loadConfig(directory)

      // FIRST-RUN DETECTION: If config.json doesn't exist, the user
      // never ran `hivemind init`. Inject setup guidance instead of
      // full governance — teach them how to configure.
      const configPath = getEffectivePaths(directory).config
      if (!existsSync(configPath)) {
        const setupBlock = await generateSetupGuidanceBlock(directory)
        output.system.push(setupBlock)
        await log.info("HiveMind not configured — injected setup guidance")
        return
      }

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
          await saveTree(directory, createTree())

          await log.info(`Auto-archived stale session ${staleSessionId}`);
        } catch (archiveError) {
          await log.error(`Failed to auto-archive stale session: ${archiveError}`);
          output.system.push(
            `[HIVEMIND][AUTO-ARCHIVE FAILED] Stale session archival failed; session remains active. Reason: ${archiveError}`
          )
        }
      }

      // Build sections in priority order
      const statusLines: string[] = []
      const hierarchyLines: string[] = []
      const ignoredLines: string[] = []
      const warningLines: string[] = []
      const frameworkLines: string[] = []
      const onboardingLines: string[] = []
      const anchorLines: string[] = []
      const metricsLines: string[] = []
      const configLines: string[] = []

      const frameworkContext = await detectFrameworkContext(directory)
      const projectSnapshot = await collectProjectSnapshot(directory)

      if (!state.hierarchy.trajectory && state.metrics.turn_count <= 1) {
        onboardingLines.push(
          generateProjectBackboneBlock(config.language, projectSnapshot, frameworkContext.mode)
        )
      }

      if (frameworkContext.mode === "gsd" && frameworkContext.gsdPhaseGoal) {
        frameworkLines.push(`GSD Phase Goal: ${frameworkContext.gsdPhaseGoal}`)
      }

      if (frameworkContext.mode === "both") {
        const menu = buildFrameworkSelectionMenu(frameworkContext)
        const selection = state.framework_selection
        const hasFrameworkChoice = selection.choice === "gsd" || selection.choice === "spec-kit"
        const hasGsdMetadata = selection.choice === "gsd" && selection.active_phase.trim().length > 0
        const hasSpecMetadata = selection.choice === "spec-kit" && selection.active_spec_path.trim().length > 0
        const hasValidSelection = hasFrameworkChoice && (hasGsdMetadata || hasSpecMetadata)

        frameworkLines.push("[FRAMEWORK CONFLICT] Both .planning and .spec-kit detected.")
        frameworkLines.push("Request consolidation first, then choose one framework before implementation.")

        if (selection.acceptance_note.trim().length > 0 && !hasValidSelection) {
          frameworkLines.push(
            "Override note captured, but framework selection is still required before implementation."
          )
        }

        if (frameworkContext.gsdPhaseGoal) {
          frameworkLines.push(`Pinned GSD goal: ${frameworkContext.gsdPhaseGoal}`)
        }

        frameworkLines.push("Locked menu:")
        for (const option of menu.options) {
          const required = option.requiredMetadata.length > 0
            ? ` (metadata: ${option.requiredMetadata.join(", ")})`
            : ""
          frameworkLines.push(`- ${option.label}${required}`)
        }
      }

      // STATUS (always shown)
      statusLines.push(`Session: ${state.session.governance_status} | Mode: ${state.session.mode} | Governance: ${state.session.governance_mode}`)
      statusLines.push(getNextStepHint(config.language, state.hierarchy))

      // HIERARCHY: prefer tree if available, fall back to flat
      if (treeExists(directory)) {
        try {
          const tree = await loadTree(directory);
          const stats = getTreeStats(tree);
          if (tree.root) {
            const treeView = toAsciiTree(tree);
            const treeLines = treeView.split('\n');
            
            // Smart hierarchy summarization for large trees
            if (treeLines.length > 8) {
              const cursorNode = getCursorNode(tree);
              let summaryLines: string[] = [];
              
              if (cursorNode) {
                // Show the path from root to cursor (current focus)
                const ancestors = getAncestors(tree.root, cursorNode.id);
                summaryLines.push("Current focus path:");
                ancestors.forEach((node, index) => {
                  const indent = "  ".repeat(index);
                  summaryLines.push(`${indent}${node.content}`);
                  
                  // Show immediate children of current node if it has any
                  if (node.id === cursorNode.id && node.children.length > 0) {
                    node.children.forEach(child => {
                      summaryLines.push(`${indent}  └─ ${child.content}`);
                    });
                  }
                });
              } else {
                // No cursor - show root and top-level structure
                summaryLines.push(treeLines[0]); // Root node
                if (tree.root.children.length > 0) {
                  summaryLines.push("  └─ " + tree.root.children.slice(0, 3).map(child => child.content).join(", "));
                  if (tree.root.children.length > 3) {
                    summaryLines.push(`  └─ ... and ${tree.root.children.length - 3} more tactics`);
                  }
                }
              }
              
              // Add statistics
              summaryLines.push(`\nTree statistics: ${stats.totalNodes} nodes (${stats.activeNodes} active, ${stats.completedNodes} completed, ${stats.blockedNodes} blocked)`);
              
              hierarchyLines.push(...summaryLines);
            } else {
              // Small tree - show full view
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
          warningLines.push(localized(config.language, "No intent declared. Use declare_intent to unlock the session before writing.", "Chua khai bao intent. Dung declare_intent de mo khoa session truoc khi ghi file."))
        } else {
          warningLines.push(localized(config.language, "Tip: Use declare_intent to set your work focus for better tracking.", "Meo: dung declare_intent de dat focus cong viec va theo doi tot hon."))
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
      const signals = compileEscalatedSignals({
        turnCount: state.metrics.turn_count,
        detection,
        completedBranches: completedBranchCount,
        hierarchyActionEmpty: state.hierarchy.action === '',
        timestampGapMs: maxGapMs,
        sessionFileLines,
        missingTree: !treeExists(directory),
        writeWithoutReadCount: state.metrics.write_without_read_count ?? 0,
        thresholds: mergedThresholds,
        maxSignals: 3,
      })
      const signalBlock = formatSignals(signals)
      if (signalBlock && config.governance_mode !== "permissive") {
        warningLines.push(signalBlock)
      }

      const ignoredTier = compileIgnoredTier({
        counters: state.metrics.governance_counters,
        governanceMode: config.governance_mode,
        expertLevel: config.agent_behavior.expert_level,
        evidence: {
          declaredOrder: "declare_intent -> map_context(tactic) -> map_context(action) -> execution",
          actualOrder: `turn ${state.metrics.turn_count}: reads=${detection.tool_type_counts.read}, writes=${detection.tool_type_counts.write}, governance=${detection.tool_type_counts.governance}`,
          missingPrerequisites: [
            ...(state.hierarchy.trajectory ? [] : ["trajectory"]),
            ...(state.hierarchy.tactic ? [] : ["tactic"]),
            ...(state.hierarchy.action ? [] : ["action"]),
          ],
          expectedHierarchy: "trajectory -> tactic -> action",
          actualHierarchy: `trajectory=${state.hierarchy.trajectory || "(empty)"}, tactic=${state.hierarchy.tactic || "(empty)"}, action=${state.hierarchy.action || "(empty)"}`,
        },
      })
      if (ignoredTier) {
        ignoredLines.push(
          `[IGNORED] ${ignoredTier.unacknowledgedCycles} unacknowledged governance cycles. Tone: ${ignoredTier.tone}.`
        )
        ignoredLines.push(`  ${formatIgnoredEvidence(ignoredTier.evidence)}`)
      }

      if (frameworkContext.mode === "gsd" && frameworkContext.gsdPhaseGoal && config.governance_mode !== "permissive") {
        warningLines.push("Drift target: align hierarchy and current action with pinned GSD phase goal.")
      }

      // Legacy drift warning (kept for backward compat with tests)
      if (config.governance_mode !== "permissive" && state.metrics.drift_score < 50 && !signals.some(s => s.type === "turn_count")) {
        warningLines.push("⚠ High drift detected. Use map_context to re-focus.")
      }

      // PENDING FAILURE ACK — subagent reported failure, agent hasn't acknowledged
      if (config.governance_mode !== "permissive" && state.pending_failure_ack) {
        warningLines.push("⚠ SUBAGENT REPORTED FAILURE. Call export_cycle or map_context with status \"blocked\" before proceeding.")
      }

      // AUTOMATION LEVEL — coach mode = maximum pushback
      if (config.governance_mode !== "permissive" && (isCoachAutomation(config.automation_level) || config.automation_level === "full")) {
        warningLines.push("[ARGUE-BACK MODE] System WILL challenge claims without evidence. Do not proceed without validation.")
        if (state.metrics.turn_count > 0 && state.metrics.context_updates === 0) {
          warningLines.push(`⛔ ${state.metrics.turn_count} turns and 0 context updates. You MUST call map_context before continuing.`)
        }
      }

      // Chain breaks
      const chainBreaks = detectChainBreaks(state)
      if (config.governance_mode !== "permissive" && chainBreaks.length > 0) {
        warningLines.push("⚠ Chain breaks: " + chainBreaks.map(b => b.message).join("; "))
      }

      // Long session detection
      const longSession = detectLongSession(state, config.auto_compact_on_turns)
      if (longSession.isLong) {
        if (config.governance_mode === "permissive") {
          warningLines.push(`Info: ${longSession.suggestion}`)
        } else {
          warningLines.push(`⏰ ${longSession.suggestion}`)
        }
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

      // TASKS
      const taskLines: string[] = []
      taskLines.push("[TASKS]")
      taskLines.push("- Remember to track your work. Use `todoread` to check pending tasks and `todowrite` to update status.")

      // METRICS (shown if space)
      metricsLines.push(`Turns: ${state.metrics.turn_count} | Drift: ${state.metrics.drift_score}/100 | Files: ${state.metrics.files_touched.length}`)

      // AGENT CONFIG (shown if space)
      const agentConfigPrompt = generateAgentBehaviorPrompt(config.agent_behavior)
      configLines.push(agentConfigPrompt)

      // BEHAVIORAL BOOTSTRAP — inject teaching block when session is LOCKED
      // This is the ZERO-cooperation activation path (L7 fix)
      const bootstrapLines: string[] = []
      const firstTurnContextLines: string[] = []
      const evidenceLines: string[] = []
      const teamLines: string[] = []
      const readFirstLines: string[] = []
      const isBootstrapActive = state.metrics.turn_count <= 2

      // NEW: Detect clean state (new project, no prior work)
      const isCleanState = state.metrics.turn_count === 0 &&
        (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action)

      if (isCleanState) {
        // Inject "READ FIRST" guidance for new/clean state
        readFirstLines.push("<read-first>")
        readFirstLines.push("## STATE: NEW PROJECT / CLEAN STATE")
        readFirstLines.push("")
        readFirstLines.push("This is a NEW project or clean state. Before ANY work:")
        readFirstLines.push("1. **SCAN first**: Use `scan_hierarchy({ action: \"analyze\" })` to understand project")
        readFirstLines.push("2. **READ master plan**: Check `docs/plans/` for existing plans")
        readFirstLines.push("3. **DECIDE focus**: Then call `declare_intent({ mode, focus })`")
        readFirstLines.push("")
        readFirstLines.push("Do NOT start writing code until you understand the project structure.")
        readFirstLines.push("</read-first>")
      }

      if (isBootstrapActive) {
        bootstrapLines.push(generateBootstrapBlock(config.governance_mode, config.language))
        evidenceLines.push(generateEvidenceDisciplineBlock(config.language))
        teamLines.push(generateTeamBehaviorBlock(config.language))

        // First-turn context: anchors, mems, prior session (agent never starts blind)
        const ftContext = await compileFirstTurnContext(directory, state)
        if (ftContext) {
          firstTurnContextLines.push(ftContext)
        }
      }

      // Assemble by priority — drop lowest priority sections if over budget
      // Budget expands to 4500 when bootstrap is active (first turns need teaching + context)
      const BUDGET_CHARS = isBootstrapActive ? 4500 : 2500
      const sections = [
        readFirstLines,    // P-1: ALWAYS first for clean state - READ BEFORE WORK
        bootstrapLines, // P0: behavioral bootstrap (only when LOCKED, first 2 turns)
        firstTurnContextLines, // P0.3: first-turn context (anchors, mems, prior session)
        evidenceLines,  // P0.5: evidence discipline from turn 0
        teamLines,      // P0.6: team behavior from turn 0
        onboardingLines, // P0.7: first-run project backbone guidance
        frameworkLines, // P0.8: framework context and conflict routing
        statusLines,    // P1: always
        hierarchyLines, // P2: always
        taskLines,      // P2.2: Task reminders
        ignoredLines,   // P2.5: IGNORED tri-evidence is non-negotiable
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
