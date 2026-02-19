/**
 * Session Governance Signal Compilation.
 *
 * Extracted from session-lifecycle.ts to keep the hook focused on
 * prompt assembly rather than signal detection logic.
 */

import { readActiveMd } from "./planning-fs.js"
import { detectChainBreaks } from "./chain-analysis.js"
import { detectLongSession } from "./long-session.js"
import { estimateContextPercent, shouldCreateNewSession } from "./session-boundary.js"
import { getToolActivation } from "./tool-activation.js"
import {
  compileEscalatedSignals,
  compileIgnoredTier,
  formatSignals,
  formatIgnoredEvidence,
  createDetectionState,
  DEFAULT_THRESHOLDS,
  type DetectionState,
} from "./detection.js"
import { loadTree, detectGaps, treeExists, countCompleted } from "./hierarchy-tree.js"
import {
  detectFrameworkContext,
  buildFrameworkSelectionMenu,
} from "./framework-context.js"
import { collectProjectSnapshot, localized, generateProjectBackboneBlock } from "../hooks/session-lifecycle-helpers.js"
import type { HiveMindConfig } from "../schemas/config.js"
import { isCoachAutomation } from "../schemas/config.js"
import type { BrainState } from "../schemas/brain-state.js"

export interface GovernanceSignals {
  warningLines: string[]
  ignoredLines: string[]
  frameworkLines: string[]
  onboardingLines: string[]
}

/**
 * Build all governance signals for the session lifecycle hook.
 */
export async function buildGovernanceSignals(
  directory: string,
  state: BrainState,
  config: HiveMindConfig
): Promise<GovernanceSignals> {
  const warningLines: string[] = []
  const ignoredLines: string[] = []
  const frameworkLines: string[] = []
  const onboardingLines: string[] = []

  const frameworkContext = await detectFrameworkContext(directory)
  const projectSnapshot = await collectProjectSnapshot(directory)

  // Onboarding backbone for first run
  if (!state.hierarchy.trajectory && state.metrics.turn_count <= 1) {
    onboardingLines.push(
      generateProjectBackboneBlock(config.language, projectSnapshot, frameworkContext.mode)
    )
  }

  // Framework conflict routing
  buildFrameworkLines(frameworkContext, state, frameworkLines)

  // No hierarchy warning
  if (!state.hierarchy.trajectory && !state.hierarchy.tactic && !state.hierarchy.action) {
    warningLines.push(
      config.governance_mode === "strict"
        ? localized(config.language, "No intent declared. Use declare_intent to unlock the session before writing.", "Chua khai bao intent. Dung declare_intent de mo khoa session truoc khi ghi file.")
        : localized(config.language, "Tip: Use declare_intent to set your work focus for better tracking.", "Meo: dung declare_intent de dat focus cong viec va theo doi tot hon.")
    )
    warningLines.push(
      localized(
        config.language,
        "Auto-realignment: if command flow is missing, route through HiveFiver start + skill stack and continue.",
        "Canh chinh tu dong: neu thieu luong lenh, chuyen sang HiveFiver start + bo ky nang va tiep tuc.",
      ),
    )
  }

  // Detection signal compilation
  const detection = buildDetectionState(state)
  const { maxGapMs, completedBranchCount, sessionFileLines } = await loadTreeMetrics(directory)

  // Compile detection signals
  const signals = await compileDetectionSignals(directory, state, detection, maxGapMs, completedBranchCount, sessionFileLines, config)
  if (signals.signalBlock && config.governance_mode !== "permissive") {
    warningLines.push(signals.signalBlock)
  }

  // Ignored tier
  if (signals.ignoredTier) {
    ignoredLines.push(`[IGNORED] ${signals.ignoredTier.unacknowledgedCycles} unacknowledged governance cycles. Tone: ${signals.ignoredTier.tone}.`)
    ignoredLines.push(`  ${formatIgnoredEvidence(signals.ignoredTier.evidence)}`)
  }

  // Drift and failure warnings
  buildDriftWarnings(frameworkContext, state, config, warningLines)

  // Chain breaks
  if (config.governance_mode !== "permissive") {
    const chainBreaks = detectChainBreaks(state)
    if (chainBreaks.length > 0) {
      warningLines.push("⚠ Chain breaks: " + chainBreaks.map(b => b.message).join("; "))
    }
  }

  // Long session
  const longSession = detectLongSession(state, config.auto_compact_on_turns)
  if (longSession.isLong) {
    warningLines.push(config.governance_mode === "permissive"
      ? `Info: ${longSession.suggestion}`
      : `⏰ ${longSession.suggestion}`)
  }

  // Session boundary
  buildSessionBoundaryWarnings(state, config, completedBranchCount, warningLines)

  // Tool activation hint
  const toolHint = getToolActivation(state, {
    completedBranches: completedBranchCount,
    hasMissingTree: !treeExists(directory),
    postCompaction: (state.last_compaction_time ?? 0) > 0 && state.metrics.turn_count <= 1,
  })
  if (toolHint) {
    warningLines.push(`💡 Suggested: ${toolHint.tool} — ${toolHint.reason}`)
  }

  return { warningLines, ignoredLines, frameworkLines, onboardingLines }
}

function buildFrameworkLines(
  frameworkContext: Awaited<ReturnType<typeof detectFrameworkContext>>,
  state: BrainState,
  frameworkLines: string[]
) {
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
      frameworkLines.push("Override note captured, but framework selection is still required before implementation.")
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
}

function buildDetectionState(state: BrainState): DetectionState {
  return {
    consecutive_failures: state.metrics.consecutive_failures ?? 0,
    consecutive_same_section: state.metrics.consecutive_same_section ?? 0,
    last_section_content: state.metrics.last_section_content ?? "",
    tool_type_counts: state.metrics.tool_type_counts ?? createDetectionState().tool_type_counts,
    keyword_flags: state.metrics.keyword_flags ?? [],
  }
}

async function loadTreeMetrics(directory: string): Promise<{
  maxGapMs: number | undefined
  completedBranchCount: number | undefined
  sessionFileLines: number | undefined
}> {
  let maxGapMs: number | undefined
  let completedBranchCount: number | undefined
  let sessionFileLines: number | undefined

  if (treeExists(directory)) {
    try {
      const tree = await loadTree(directory)
      const gaps = detectGaps(tree)
      const staleGaps = gaps.filter(g => g.severity === "stale")
      if (staleGaps.length > 0) {
        maxGapMs = Math.max(...staleGaps.map(g => g.gapMs))
      }
      completedBranchCount = countCompleted(tree)
    } catch {
      // Tree read failure is non-fatal
    }
  }

  try {
    const activeMd = await readActiveMd(directory)
    if (activeMd.body) {
      sessionFileLines = activeMd.body.split("\n").length
    }
  } catch {
    // Non-fatal
  }

  return { maxGapMs, completedBranchCount, sessionFileLines }
}

async function compileDetectionSignals(
  directory: string,
  state: BrainState,
  detection: DetectionState,
  maxGapMs: number | undefined,
  completedBranchCount: number | undefined,
  sessionFileLines: number | undefined,
  config: HiveMindConfig
): Promise<{ signalBlock: string | null; ignoredTier: ReturnType<typeof compileIgnoredTier> }> {
  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...config.detection_thresholds }
  if (!config.detection_thresholds?.session_file_lines) {
    mergedThresholds.session_file_lines = config.max_active_md_lines
  }

  const signals = compileEscalatedSignals({
    turnCount: state.metrics.turn_count,
    detection,
    completedBranches: completedBranchCount,
    hierarchyActionEmpty: state.hierarchy.action === "",
    timestampGapMs: maxGapMs,
    sessionFileLines,
    missingTree: !treeExists(directory),
    writeWithoutReadCount: state.metrics.write_without_read_count ?? 0,
    thresholds: mergedThresholds,
    maxSignals: 3,
  })

  const signalBlock = formatSignals(signals)

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

  return { signalBlock, ignoredTier }
}

function buildDriftWarnings(
  frameworkContext: Awaited<ReturnType<typeof detectFrameworkContext>>,
  state: BrainState,
  config: HiveMindConfig,
  warningLines: string[]
) {
  if (frameworkContext.mode === "gsd" && frameworkContext.gsdPhaseGoal && config.governance_mode !== "permissive") {
    warningLines.push("Drift target: align hierarchy and current action with pinned GSD phase goal.")
  }

  if (config.governance_mode !== "permissive" && state.metrics.drift_score < 50) {
    warningLines.push("⚠ High drift detected. Use map_context to re-focus.")
  }

  if (config.governance_mode !== "permissive" && state.pending_failure_ack) {
    warningLines.push("⚠ SUBAGENT REPORTED FAILURE. Call export_cycle or map_context with status \"blocked\" before proceeding.")
  }

  if (config.governance_mode !== "permissive" && (isCoachAutomation(config.automation_level) || config.automation_level === "full")) {
    warningLines.push("[ARGUE-BACK MODE] System WILL challenge claims without evidence. Do not proceed without validation.")
    if (state.metrics.turn_count > 0 && state.metrics.context_updates === 0) {
      warningLines.push(`⛔ ${state.metrics.turn_count} turns and 0 context updates. You MUST call map_context before continuing.`)
    }
  }
}

function buildSessionBoundaryWarnings(
  state: BrainState,
  config: HiveMindConfig,
  completedBranchCount: number | undefined,
  warningLines: string[]
) {
  const role = (state.session.role || "").toLowerCase()
  const contextPercent = estimateContextPercent(state.metrics.turn_count, config.auto_compact_on_turns)
  const boundaryRecommendation = shouldCreateNewSession({
    turnCount: state.metrics.turn_count,
    userTurnCount: state.metrics.user_turn_count,
    contextPercent,
    hierarchyComplete: (completedBranchCount ?? 0) > 0,
    isMainSession: !role.includes("subagent"),
    hasDelegations: (state.cycle_log ?? []).some((entry) => entry.tool === "task"),
    compactionCount: state.compaction_count ?? 0,
  })

  if (boundaryRecommendation.recommended) {
    warningLines.push(`🔄 ${boundaryRecommendation.reason}`)
    warningLines.push("→ Run /hivemind-compact to archive and start fresh")
  }
}
