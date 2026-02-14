import { calculateSimilarity } from "../utils/string.js";
/**
 * Detection Engine
 * Programmatic signal detection for drift, stuck patterns, and governance alerts.
 *
 * 5 sections: Types, Tool Classification, Counter Logic, Keyword Scanning, Signal Compilation
 *
 * Consumers:
 * - soft-governance.ts (tool.execute.after) → Sections 2-4 (detection, writes to brain)
 * - session-lifecycle.ts (system.transform) → Section 5 (compilation, reads from brain, appends to prompt)
 */

// ============================================================
// Section 1: Types
// ============================================================

/** Classification of a tool by its behavioral category */
export type ToolCategory = "read" | "write" | "query" | "governance";

/** Tool type usage counters tracked per session */
export interface ToolTypeCounts {
  read: number;
  write: number;
  query: number;
  governance: number;
}

/** A single detection signal to be compiled into a prompt warning */
export interface DetectionSignal {
  /** Unique signal type identifier */
  type: string;
  /** Severity for priority sorting (0 = highest) */
  severity: number;
  /** Human-readable warning message */
  message: string;
  /** Suggested tool or action for the agent */
  suggestion?: string;
}

/** Detection state tracked in brain.json.metrics (extended fields) */
export interface DetectionState {
  /** Reset on success, incremented on tool failure */
  consecutive_failures: number;
  /** Reset on section change, incremented on same-section update */
  consecutive_same_section: number;
  /** Last section content for repetition detection */
  last_section_content: string;
  /** Per-session tool usage pattern */
  tool_type_counts: ToolTypeCounts;
  /** Detected keyword flags this session */
  keyword_flags: string[];
}

/** Escalation tiers — signals intensify over turns */
export type EscalationTier = "INFO" | "WARN" | "CRITICAL" | "DEGRADED";

/** Enhanced signal with escalation tier, evidence, and counter-argument */
export interface EscalatedSignal extends DetectionSignal {
  /** Current escalation tier based on persistence */
  tier: EscalationTier;
  /** Data-backed evidence string (counters, metrics) */
  evidence: string;
  /** Counter-argument against common agent excuses */
  counter_excuse?: string;
}

export type GovernanceSignalKind =
  | "out_of_order"
  | "drift"
  | "compaction"
  | "evidence_pressure"
  | "ignored";

export type GovernanceSeverity = "info" | "warning" | "error";

export interface SeriousnessInputs {
  declaredIntentMismatch: boolean;
  hierarchyMismatch: boolean;
  roleMetadataMismatch: boolean;
}

export interface SeriousnessScore {
  score: number;
  tier: "low" | "medium" | "high";
}

export interface GovernanceCounters {
  out_of_order: number;
  drift: number;
  compaction: number;
  evidence_pressure: number;
  ignored: number;
  acknowledged: boolean;
  prerequisites_completed: boolean;
}

export type HierarchyImpact = "low" | "medium" | "high";

export interface IgnoredEvidenceInput {
  declaredOrder: string;
  actualOrder: string;
  missingPrerequisites: string[];
  expectedHierarchy: string;
  actualHierarchy: string;
}

export interface IgnoredTierResult {
  tier: "IGNORED";
  severity: GovernanceSeverity;
  unacknowledgedCycles: number;
  tone: string;
  evidence: IgnoredEvidenceInput;
}

export interface IgnoredResetDecision {
  downgrade: boolean;
  fullReset: boolean;
  decrementBy: number;
}

/** Thresholds for signal detection */
export interface DetectionThresholds {
  /** Turns before warning (default: 5) */
  turns_warning: number;
  /** Consecutive failures before alert (default: 3) */
  failure_alert: number;
  /** Same-section repeats before circling alert (default: 4) */
  repetition_alert: number;
  /** Read-to-write ratio imbalance threshold (default: 8) */
  read_write_imbalance: number;
  /** Completed branches before prune suggestion (default: 5) */
  completed_branch_threshold: number;
  /** Timestamp gap in ms before stale alert (default: 2h) */
  stale_gap_ms: number;
  /** Session file line count before warning (default: 50) */
  session_file_lines: number;
}

/** Default detection thresholds */
export const DEFAULT_THRESHOLDS: DetectionThresholds = {
  turns_warning: 5,
  failure_alert: 3,
  repetition_alert: 4,
  read_write_imbalance: 8,
  completed_branch_threshold: 5,
  stale_gap_ms: 2 * 60 * 60 * 1000, // 2 hours
  session_file_lines: 50,
};

/** Create initial detection state */
export function createDetectionState(): DetectionState {
  return {
    consecutive_failures: 0,
    consecutive_same_section: 0,
    last_section_content: "",
    tool_type_counts: { read: 0, write: 0, query: 0, governance: 0 },
    keyword_flags: [],
  };
}

export function createGovernanceCounters(): GovernanceCounters {
  return {
    out_of_order: 0,
    drift: 0,
    compaction: 0,
    evidence_pressure: 0,
    ignored: 0,
    acknowledged: false,
    prerequisites_completed: false,
  };
}

export function computeViolationSeriousness(
  inputs: SeriousnessInputs
): SeriousnessScore {
  let score = 0;
  if (inputs.declaredIntentMismatch) score += 40;
  if (inputs.hierarchyMismatch) score += 35;
  if (inputs.roleMetadataMismatch) score += 25;

  const tier = score >= 70 ? "high" : score >= 35 ? "medium" : "low";
  return { score, tier };
}

export function computeGovernanceSeverity(opts: {
  kind: GovernanceSignalKind;
  repetitionCount: number;
  acknowledged?: boolean;
}): GovernanceSeverity {
  const effectiveCount =
    opts.acknowledged && opts.repetitionCount > 0
      ? opts.repetitionCount - 1
      : opts.repetitionCount;

  if (opts.kind === "ignored") return "error";
  if (opts.kind === "compaction") return "info";

  if (opts.kind === "out_of_order") {
    if (effectiveCount <= 0) return "info";
    if (effectiveCount === 1) return "warning";
    return "error";
  }

  if (effectiveCount <= 0) return "warning";
  return "error";
}

export function computeUnacknowledgedCycles(counters: GovernanceCounters): number {
  return counters.out_of_order + counters.drift + counters.evidence_pressure;
}

function getIgnoredTone(opts: {
  governanceMode: "permissive" | "assisted" | "strict";
  expertLevel: "beginner" | "intermediate" | "advanced" | "expert";
}): string {
  if (opts.governanceMode === "strict") {
    if (opts.expertLevel === "beginner") return "direct corrective";
    if (opts.expertLevel === "advanced" || opts.expertLevel === "expert") {
      return "confrontational corrective";
    }
    return "firm corrective";
  }

  if (opts.governanceMode === "assisted") {
    if (opts.expertLevel === "beginner") return "guided corrective";
    return "firm coaching";
  }

  return "advisory";
}

export function compileIgnoredTier(opts: {
  counters: GovernanceCounters;
  governanceMode: "permissive" | "assisted" | "strict";
  expertLevel: "beginner" | "intermediate" | "advanced" | "expert";
  evidence: IgnoredEvidenceInput;
}): IgnoredTierResult | null {
  const unacknowledgedCycles = computeUnacknowledgedCycles(opts.counters);
  if (unacknowledgedCycles < 10) return null;
  if (opts.counters.acknowledged) return null;
  if (opts.governanceMode === "permissive") return null;

  return {
    tier: "IGNORED",
    severity: "error",
    unacknowledgedCycles,
    tone: getIgnoredTone({
      governanceMode: opts.governanceMode,
      expertLevel: opts.expertLevel,
    }),
    evidence: opts.evidence,
  };
}

export function formatIgnoredEvidence(evidence: IgnoredEvidenceInput): string {
  const missing =
    evidence.missingPrerequisites.length > 0
      ? evidence.missingPrerequisites.join(", ")
      : "none";
  return `[SEQ] ${evidence.declaredOrder} -> ${evidence.actualOrder} | [PLAN] missing: ${missing} | [HIER] expected=${evidence.expectedHierarchy}; actual=${evidence.actualHierarchy}`;
}

export function evaluateIgnoredResetPolicy(opts: {
  counters: GovernanceCounters;
  prerequisitesCompleted: boolean;
  missedStepCount: number;
  hierarchyImpact: HierarchyImpact;
}): IgnoredResetDecision {
  if (!opts.counters.acknowledged) {
    return { downgrade: false, fullReset: false, decrementBy: 0 };
  }

  if (
    opts.prerequisitesCompleted &&
    opts.missedStepCount <= 1 &&
    opts.hierarchyImpact === "low"
  ) {
    return { downgrade: false, fullReset: true, decrementBy: opts.counters.ignored };
  }

  const decrementBy =
    opts.hierarchyImpact === "low"
      ? 3
      : opts.hierarchyImpact === "medium"
        ? 2
        : 1;

  return { downgrade: true, fullReset: false, decrementBy };
}

export function registerGovernanceSignal(
  counters: GovernanceCounters,
  kind: GovernanceSignalKind
): GovernanceCounters {
  return {
    ...counters,
    [kind]: counters[kind] + 1,
    acknowledged: false,
  };
}

export function acknowledgeGovernanceSignals(
  counters: GovernanceCounters
): GovernanceCounters {
  return {
    ...counters,
    acknowledged: true,
  };
}

export function resetGovernanceCounters(
  counters: GovernanceCounters,
  opts: { full: boolean; prerequisitesCompleted: boolean }
): GovernanceCounters {
  if (!opts.full) {
    return {
      ...counters,
      acknowledged: false,
    };
  }

  if (!opts.prerequisitesCompleted) {
    return {
      ...counters,
      prerequisites_completed: false,
      acknowledged: false,
    };
  }

  return {
    ...createGovernanceCounters(),
    prerequisites_completed: true,
  };
}

/**
 * Compute escalation tier based on how long a signal has persisted.
 * Uses turn_count as proxy — signals that fire at threshold get INFO,
 * and escalate as turns accumulate without resolution.
 * 
 * @param turnCount current turn count
 * @param threshold the threshold at which signal first fires
 */
export function computeEscalationTier(turnCount: number, threshold: number): EscalationTier {
  const overshoot = turnCount - threshold;
  if (overshoot <= 0) return "INFO";
  if (overshoot <= 3) return "WARN";
  if (overshoot <= 7) return "CRITICAL";
  return "DEGRADED";
}

// ============================================================
// Section 2: Tool Classification
// ============================================================

/** Tool name patterns for classification */
const TOOL_PATTERNS: Record<ToolCategory, RegExp[]> = {
  read: [
    /^read$/i,
    /^glob$/i,
    /^grep$/i,
    /^webfetch$/i,
    /^google_search$/i,
    /^cat$/i,
    /^head$/i,
    /^tail$/i,
    /^find$/i,
    /^ls$/i,
  ],
  write: [
    /^write$/i,
    /^edit$/i,
    /^bash$/i,
    /^mkdir$/i,
    /^rm$/i,
    /^mv$/i,
    /^cp$/i,
  ],
  query: [
    /^task$/i,
    /^question$/i,
    /^skill$/i,
    /^todowrite$/i,
  ],
  governance: [
    /^declare_intent$/i,
    /^map_context$/i,
    /^compact_session$/i,
    /^scan_hierarchy$/i,
    /^save_anchor$/i,
    /^think_back$/i,
    /^save_mem$/i,
    /^recall_mems$/i,
    /^hierarchy_manage$/i,
    /^export_cycle$/i,
  ],
};

/**
 * Classify a tool by its name into a behavioral category.
 *
 * @consumer soft-governance.ts (tool.execute.after)
 */
export function classifyTool(toolName: string): ToolCategory {
  for (const [category, patterns] of Object.entries(TOOL_PATTERNS) as [ToolCategory, RegExp[]][]) {
    for (const pattern of patterns) {
      if (pattern.test(toolName)) return category;
    }
  }

  // Heuristics for unknown tools
  const lower = toolName.toLowerCase();
  if (lower.includes("read") || lower.includes("get") || lower.includes("list") || lower.includes("search") || lower.includes("fetch")) {
    return "read";
  }
  if (lower.includes("write") || lower.includes("create") || lower.includes("update") || lower.includes("delete") || lower.includes("set")) {
    return "write";
  }

  // Default: query (safest — doesn't trigger write-without-declaration warnings)
  return "query";
}

/**
 * Increment the tool type counter for a classified tool.
 *
 * @consumer soft-governance.ts (tool.execute.after)
 */
export function incrementToolType(
  counts: ToolTypeCounts,
  category: ToolCategory
): ToolTypeCounts {
  return { ...counts, [category]: counts[category] + 1 };
}

// ============================================================
// Section 3: Counter Logic
// ============================================================

/**
 * Track a tool execution result — success or failure.
 * On success: reset consecutive_failures.
 * On failure: increment consecutive_failures.
 *
 * @consumer soft-governance.ts (tool.execute.after)
 */
export function trackToolResult(
  state: DetectionState,
  success: boolean
): DetectionState {
  if (success) {
    return { ...state, consecutive_failures: 0 };
  }
  return {
    ...state,
    consecutive_failures: state.consecutive_failures + 1,
  };
}

/**
 * Track a hierarchy section update.
 * If the new content is similar to the last, increment repetition counter.
 * Otherwise, reset.
 *
 * @consumer soft-governance.ts (when map_context fires)
 */
export function trackSectionUpdate(
  state: DetectionState,
  newContent: string
): DetectionState {
  const normalized = newContent.trim().toLowerCase();
  const lastNormalized = state.last_section_content.trim().toLowerCase();

  // Simple similarity: check if content is the same or very similar
  const isSimilar = normalized === lastNormalized || calculateSimilarity(normalized, lastNormalized) > 0.8;

  if (isSimilar && state.last_section_content !== "") {
    return {
      ...state,
      consecutive_same_section: state.consecutive_same_section + 1,
      last_section_content: newContent,
    };
  }

  return {
    ...state,
    consecutive_same_section: 0,
    last_section_content: newContent,
  };
}

/**
 * Reset section tracking (on map_context with new level).
 *
 * @consumer soft-governance.ts
 */
export function resetSectionTracking(state: DetectionState): DetectionState {
  return {
    ...state,
    consecutive_same_section: 0,
    last_section_content: "",
  };
}

/**
 * Simple Levenshtein-based similarity ratio (0-1).
 * Used internally for section repetition detection.
 */

// ============================================================
// Section 4: Keyword Scanning
// ============================================================

/** Keyword patterns that indicate the agent may be stuck */
const STUCK_KEYWORDS: { pattern: RegExp; flag: string }[] = [
  { pattern: /\bstuck\b/i, flag: "stuck" },
  { pattern: /\bretry\b/i, flag: "retry" },
  { pattern: /\bconfused\b/i, flag: "confused" },
  { pattern: /\bloop(ing)?\b/i, flag: "loop" },
  { pattern: /\bfail(ed|ing|s)?\b/i, flag: "failure" },
  { pattern: /\berror(s)?\b/i, flag: "error" },
  { pattern: /\bcan'?t\s+(figure|find|get|make)\b/i, flag: "blocked" },
  { pattern: /\btry(ing)?\s+again\b/i, flag: "retry" },
  { pattern: /\bsame\s+(issue|problem|error)\b/i, flag: "repetition" },
  { pattern: /\bnot\s+working\b/i, flag: "blocked" },
  { pattern: /\bstill\s+(not|broken|failing)\b/i, flag: "persistent" },
];

/**
 * Scan text (tool args, tool output) for stuck/confusion keywords.
 * Returns newly detected flags (not already in state.keyword_flags).
 *
 * @consumer soft-governance.ts (tool.execute.after — scans tool args and output)
 */
export function scanForKeywords(
  text: string,
  existingFlags: string[]
): string[] {
  const newFlags: string[] = [];
  const existingSet = new Set(existingFlags);

  for (const { pattern, flag } of STUCK_KEYWORDS) {
    if (!existingSet.has(flag) && pattern.test(text)) {
      newFlags.push(flag);
    }
  }

  return newFlags;
}

/**
 * Add keyword flags to detection state, deduplicating.
 *
 * @consumer soft-governance.ts
 */
export function addKeywordFlags(
  state: DetectionState,
  newFlags: string[]
): DetectionState {
  if (newFlags.length === 0) return state;

  const existing = new Set(state.keyword_flags);
  const additions = newFlags.filter((f) => !existing.has(f));

  if (additions.length === 0) return state;

  return {
    ...state,
    keyword_flags: [...state.keyword_flags, ...additions],
  };
}

/** Counter-arguments against common agent excuses. Evidence-based pushback. */
const COUNTER_EXCUSES: Record<string, string> = {
  turn_count: "\"I'll checkpoint later\" — Every untracked turn is context that dies on compaction. Act now.",
  consecutive_failures: "\"One more try\" — Repeating failed approaches wastes context budget. Step back.",
  section_repetition: "\"I'm refining\" — 4+ updates to the same section with similar content = circling, not refining.",
  read_write_imbalance: "\"I'm still exploring\" — Exploration without writing suggests you're stuck, not learning.",
  keyword_flags: "\"I know what I'm doing\" — Your own words signal confusion. Let the tools help.",
  tool_hierarchy_mismatch: "\"I'll declare intent after\" — Files written without hierarchy tracking are invisible to future sessions.",
  completed_pileup: "\"It's fine\" — Completed branches consume prompt budget. Prune to stay focused.",
  timestamp_gap: "\"I remember\" — After this time gap, you don't. Use scan_hierarchy to rebuild context.",
  missing_tree: "\"I don't need it\" — Without hierarchy.json, ALL drift detection is disabled.",
  session_file_long: "\"More context is better\" — Long session files get truncated on compaction. Compact to preserve.",
  write_without_read: "\"I know the file\" — Writing without reading risks overwriting changes made by other tools or sessions.",
};

// ============================================================
// Section 5: Signal Compilation
// ============================================================

/**
 * Compile all active detection signals from brain state into prioritized warnings.
 * This is the main entry point for session-lifecycle.ts (system.transform).
 *
 * @consumer session-lifecycle.ts (reads brain.json, calls this, appends to prompt)
 */
export function compileSignals(opts: {
  /** Current turn count */
  turnCount: number;
  /** Detection state from brain.json.metrics */
  detection: DetectionState;
  /** Optional: number of completed branches in tree */
  completedBranches?: number;
  /** Optional: is hierarchy action empty while write tools have been used? */
  hierarchyActionEmpty?: boolean;
  /** Optional: current timestamp gap severity */
  timestampGapMs?: number;
  /** Optional: is hierarchy.json missing (migration needed)? */
  missingTree?: boolean;
  /** Optional: current active session file line count */
  sessionFileLines?: number;
  /** Thresholds for triggering signals */
  thresholds?: DetectionThresholds;
  /** Budget cap: maximum number of signals to return */
  maxSignals?: number;
}): DetectionSignal[] {
  const thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS;
  const maxSignals = opts.maxSignals ?? 3;
  const signals: DetectionSignal[] = [];

  // 1. Turn count warning
  if (opts.turnCount >= thresholds.turns_warning) {
    signals.push({
      type: "turn_count",
      severity: 3,
      message: `${opts.turnCount} turns on current section. Checkpoint your decisions?`,
      suggestion: "map_context",
    });
  }

  // 2. Consecutive failures
  if (opts.detection.consecutive_failures >= thresholds.failure_alert) {
    signals.push({
      type: "consecutive_failures",
      severity: 1,
      message: `${opts.detection.consecutive_failures} consecutive tool failures. Step back and reassess?`,
      suggestion: "think_back",
    });
  }

  // 3. Section repetition (circling)
  if (opts.detection.consecutive_same_section >= thresholds.repetition_alert) {
    signals.push({
      type: "section_repetition",
      severity: 2,
      message: `Tactic updated ${opts.detection.consecutive_same_section}x with similar content. Circling?`,
      suggestion: "think_back",
    });
  }

  // 4. Read-write imbalance
  const { read, write } = opts.detection.tool_type_counts;
  if (read >= thresholds.read_write_imbalance && write === 0) {
    signals.push({
      type: "read_write_imbalance",
      severity: 4,
      message: `Pattern: ${read} reads, 0 writes. Still exploring or stuck?`,
      suggestion: "map_context",
    });
  }

  // 5. Keyword flags
  if (opts.detection.keyword_flags.length > 0) {
    const flags = opts.detection.keyword_flags.join(", ");
    signals.push({
      type: "keyword_flags",
      severity: 2,
      message: `Detected signals: ${flags}. Use think_back to refocus?`,
      suggestion: "think_back",
    });
  }

  // 6. Tool-hierarchy mismatch (write without action declared)
  if (
    opts.hierarchyActionEmpty &&
    opts.detection.tool_type_counts.write > 0
  ) {
    signals.push({
      type: "tool_hierarchy_mismatch",
      severity: 3,
      message: "Writing files but no action declared in hierarchy.",
      suggestion: "map_context",
    });
  }

  // 7. Completed branch pileup
  if (
    opts.completedBranches !== undefined &&
    opts.completedBranches >= thresholds.completed_branch_threshold
  ) {
    signals.push({
      type: "completed_pileup",
      severity: 5,
      message: `${opts.completedBranches} completed branches. Run hierarchy_manage with action=prune to clean up.`,
      suggestion: "hivemind-scan",
    });
  }

  // 8. Timestamp gap (stale)
  if (
    opts.timestampGapMs !== undefined &&
    opts.timestampGapMs >= thresholds.stale_gap_ms
  ) {
    const hours = Math.round(opts.timestampGapMs / (60 * 60 * 1000) * 10) / 10;
    signals.push({
      type: "timestamp_gap",
      severity: 1,
      message: `${hours}hr gap since last hierarchy node. Context may be lost.`,
      suggestion: "scan_hierarchy",
    });
  }

  // 9. Missing tree (migration needed)
  if (opts.missingTree) {
    signals.push({
      type: "missing_tree",
      severity: 0,
      message: "No hierarchy.json found. Run hivemind-scan to build context backbone.",
      suggestion: "hivemind-scan",
    });
  }

  // 10. Session file too long
  if (
    opts.sessionFileLines !== undefined &&
    opts.sessionFileLines >= thresholds.session_file_lines
  ) {
    signals.push({
      type: "session_file_long",
      severity: 4,
      message: `Session file at ${opts.sessionFileLines} lines (threshold: ${thresholds.session_file_lines}). Consider compacting.`,
      suggestion: "compact_session",
    });
  }

  // Sort by severity (lower = more important) and cap at budget
  signals.sort((a, b) => a.severity - b.severity);
  return signals.slice(0, maxSignals);
}

/**
 * Compile escalated signals with tiers, evidence, and counter-arguments.
 * This is the main entry point for evidence-based prompt injection.
 * Wraps compileSignals and enriches each signal with escalation data.
 * 
 * @consumer session-lifecycle.ts (reads brain.json, calls this, appends to prompt)
 */
export function compileEscalatedSignals(opts: {
  turnCount: number;
  detection: DetectionState;
  completedBranches?: number;
  hierarchyActionEmpty?: boolean;
  timestampGapMs?: number;
  missingTree?: boolean;
  sessionFileLines?: number;
  writeWithoutReadCount?: number;
  thresholds?: DetectionThresholds;
  maxSignals?: number;
}): EscalatedSignal[] {
  const thresholds = opts.thresholds ?? DEFAULT_THRESHOLDS;
  
  // Get base signals
  const baseSignals = compileSignals(opts);
  
  // Add write-without-read signal if applicable
  if (opts.writeWithoutReadCount !== undefined && opts.writeWithoutReadCount > 0) {
    baseSignals.push({
      type: "write_without_read",
      severity: 2,
      message: `${opts.writeWithoutReadCount} file(s) written without being read first. Risk of overwriting.`,
      suggestion: "read files before writing",
    });
    // Re-sort and re-cap
    baseSignals.sort((a, b) => a.severity - b.severity);
    const max = opts.maxSignals ?? 3;
    if (baseSignals.length > max) baseSignals.length = max;
  }
  
  // Enrich each signal with escalation data
  return baseSignals.map(signal => {
    // Determine which threshold this signal relates to
    let relevantThreshold = thresholds.turns_warning;
    if (signal.type === "consecutive_failures") relevantThreshold = thresholds.failure_alert;
    else if (signal.type === "section_repetition") relevantThreshold = thresholds.repetition_alert;
    else if (signal.type === "read_write_imbalance") relevantThreshold = thresholds.read_write_imbalance;
    else if (signal.type === "completed_pileup") relevantThreshold = thresholds.completed_branch_threshold;
    else if (signal.type === "timestamp_gap") relevantThreshold = 1; // Always at least WARN for gaps
    else if (signal.type === "missing_tree") relevantThreshold = 0; // Always CRITICAL for missing tree
    else if (signal.type === "session_file_long") relevantThreshold = thresholds.session_file_lines;
    
    const tier = computeEscalationTier(opts.turnCount, relevantThreshold);
    const evidence = buildEvidence(signal, opts);
    const counter_excuse = COUNTER_EXCUSES[signal.type];
    
    return { ...signal, tier, evidence, counter_excuse };
  });
}

/**
 * Build evidence string for a signal based on actual counter data.
 */
function buildEvidence(signal: DetectionSignal, opts: {
  turnCount: number;
  detection: DetectionState;
  completedBranches?: number;
  timestampGapMs?: number;
  sessionFileLines?: number;
  writeWithoutReadCount?: number;
}): string {
  const d = opts.detection;
  switch (signal.type) {
    case "turn_count":
      return `${opts.turnCount} turns elapsed. ${d.tool_type_counts.write} writes, ${d.tool_type_counts.read} reads, 0 map_context calls since last update.`;
    case "consecutive_failures":
      return `${d.consecutive_failures} consecutive tool failures. Last success unknown. Health score degrading.`;
    case "section_repetition":
      return `Section updated ${d.consecutive_same_section}x with >80% similar content. No meaningful progress detected.`;
    case "read_write_imbalance":
      return `${d.tool_type_counts.read} reads vs ${d.tool_type_counts.write} writes this session. Pattern suggests exploration without output.`;
    case "keyword_flags":
      return `Detected keywords in tool output: [${d.keyword_flags.join(", ")}]. These are YOUR words indicating difficulty.`;
    case "tool_hierarchy_mismatch":
      return `${d.tool_type_counts.write} write operations with no action declared in hierarchy. These changes are untracked.`;
    case "completed_pileup":
      return `${opts.completedBranches ?? 0} completed branches consuming hierarchy space. Prompt budget impact: ~${(opts.completedBranches ?? 0) * 50} chars.`;
    case "timestamp_gap":
      const hours = opts.timestampGapMs ? Math.round(opts.timestampGapMs / (60 * 60 * 1000) * 10) / 10 : 0;
      return `${hours}hr gap since last hierarchy activity. Context decay is exponential after 2hr.`;
    case "missing_tree":
      return `hierarchy.json not found. ALL drift detection, gap analysis, and tree rendering disabled.`;
    case "session_file_long":
      return `Session file at ${opts.sessionFileLines ?? 0} lines. Compaction will truncate oldest entries first.`;
    case "write_without_read":
      return `${opts.writeWithoutReadCount ?? 0} file(s) written without prior read. Blind writes risk data loss.`;
    default:
      return signal.message;
  }
}

/**
 * Format compiled signals into a string block for prompt injection.
 * Handles both regular DetectionSignal and EscalatedSignal.
 *
 * @consumer session-lifecycle.ts (appended to <hivemind> block)
 */
export function formatSignals(signals: DetectionSignal[]): string {
  if (signals.length === 0) return "";

  const lines: string[] = ["[ALERTS]"];
  for (const signal of signals) {
    const suggestion = signal.suggestion ? ` → use ${signal.suggestion}` : "";
    
    // Check if this is an escalated signal
    const escalated = signal as EscalatedSignal;
    if (escalated.tier && escalated.evidence) {
      const tierPrefix = `[${escalated.tier}]`;
      lines.push(`${tierPrefix} ${signal.message}${suggestion}`);
      lines.push(`  EVIDENCE: ${escalated.evidence}`);
      if (escalated.counter_excuse) {
        lines.push(`  ↳ ${escalated.counter_excuse}`);
      }
    } else {
      lines.push(`- ${signal.message}${suggestion}`);
    }
  }
  return lines.join("\n");
}
