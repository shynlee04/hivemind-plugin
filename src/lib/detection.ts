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
    /^self_rate$/i,
    /^scan_hierarchy$/i,
    /^save_anchor$/i,
    /^think_back$/i,
    /^check_drift$/i,
    /^save_mem$/i,
    /^list_shelves$/i,
    /^recall_mems$/i,
    /^hierarchy_prune$/i,
    /^hierarchy_migrate$/i,
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
  const isSimilar = normalized === lastNormalized || levenshteinSimilarity(normalized, lastNormalized) > 0.8;

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
function levenshteinSimilarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const maxLen = Math.max(a.length, b.length);

  // Optimization: if strings are very different in length, skip computation
  if (Math.abs(a.length - b.length) / maxLen > 0.5) return 0;

  // Simplified: use character overlap ratio instead of full Levenshtein
  // This is faster and sufficient for detecting "same content with minor edits"
  const aChars = new Set(a.split(""));
  const bChars = new Set(b.split(""));
  let overlap = 0;
  for (const c of aChars) {
    if (bChars.has(c)) overlap++;
  }
  const totalUnique = new Set([...aChars, ...bChars]).size;
  return totalUnique === 0 ? 1 : overlap / totalUnique;
}

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
      message: `${opts.completedBranches} completed branches. Run hierarchy_prune to clean up.`,
      suggestion: "hierarchy_prune",
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
      message: "No hierarchy.json found. Run hierarchy_migrate to upgrade.",
      suggestion: "hierarchy_migrate",
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
 * Format compiled signals into a string block for prompt injection.
 *
 * @consumer session-lifecycle.ts (appended to <hivemind> block)
 */
export function formatSignals(signals: DetectionSignal[]): string {
  if (signals.length === 0) return "";

  const lines: string[] = ["[ALERTS]"];
  for (const signal of signals) {
    const suggestion = signal.suggestion ? ` → use ${signal.suggestion}` : "";
    lines.push(`- ${signal.message}${suggestion}`);
  }
  return lines.join("\n");
}
