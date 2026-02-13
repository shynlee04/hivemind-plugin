/**
 * Brain State Schema
 * Core state machine for session governance
 */

import type { HiveMindConfig, GovernanceMode } from "./config.js";
import type { HierarchyState } from "./hierarchy.js";
import type { GovernanceCounters } from "../lib/detection.js";

export type SessionMode = "plan_driven" | "quick_fix" | "exploration";
export type GovernanceStatus = "LOCKED" | "OPEN";

export interface SessionState {
  id: string;
  mode: SessionMode;
  governance_mode: GovernanceMode;
  governance_status: GovernanceStatus;
  start_time: number;
  last_activity: number;
  /** ISO date string (YYYY-MM-DD) of session creation */
  date: string;
  /** User-defined key for session categorization */
  meta_key: string;
  /** Agent role/identity for this session */
  role: string;
  /** Whether session was initiated by AI (true) or human (false) */
  by_ai: boolean;
}

export interface SelfRating {
  score: number; // 1-10
  reason?: string;
  turn_context?: string;
  timestamp: number;
  turn_number: number;
}

export interface MetricsState {
  turn_count: number;
  drift_score: number;
  files_touched: string[];
  context_updates: number;
  ratings: SelfRating[];
  auto_health_score: number; // 0-100, calculated from success rate
  total_tool_calls: number;
  successful_tool_calls: number;
  violation_count: number; // Tracks governance violations

  // Detection counters (new — wired by soft-governance.ts detection engine)
  consecutive_failures: number;           // reset on success
  consecutive_same_section: number;       // reset on section change
  last_section_content: string;           // detect repetition
  tool_type_counts: {                     // per-session tool usage pattern
    read: number;
    write: number;
    query: number;
    governance: number;
  };
  keyword_flags: string[];               // detected keywords this session
  /** Count of file writes without prior read this session */
  write_without_read_count: number;
  /** Governance escalation/reset counters for severity routing */
  governance_counters: GovernanceCounters;
}

/** Captured subagent cycle result (auto-captured by tool.execute.after) */
export interface CycleLogEntry {
  /** Epoch ms when captured */
  timestamp: number;
  /** Tool name that was captured (usually 'task') */
  tool: string;
  /** First 500 chars of tool output */
  output_excerpt: string;
  /** Whether failure signals were detected in output */
  failure_detected: boolean;
  /** Which failure keywords were found */
  failure_keywords: string[];
}

/** Failure signal keywords — if ANY appear in output, failure_detected = true */
export const FAILURE_KEYWORDS = [
  "failed", "failure", "error", "blocked", "unable",
  "partially", "could not", "cannot", "not found", "crashed",
  "timed out", "timeout", "exception", "rejected",
] as const;

/** Max entries in cycle_log before oldest are dropped */
export const MAX_CYCLE_LOG = 10;

export interface BrainState {
  session: SessionState;
  hierarchy: HierarchyState;
  metrics: MetricsState;
  complexity_nudge_shown: boolean;
  /** Turn number when last commit suggestion was shown */
  last_commit_suggestion_turn: number;
  version: string;

  // New — hierarchy redesign fields
  /** Written by purification subagent for next compaction cycle */
  next_compaction_report: string | null;
  /** How many compactions this session */
  compaction_count: number;
  /** Epoch ms of last compaction — used for gap detection */
  last_compaction_time: number;

  // Cycle intelligence fields
  /** Auto-captured subagent results (capped at MAX_CYCLE_LOG entries) */
  cycle_log: CycleLogEntry[];
  /** True when a subagent reported failure and agent hasn't acknowledged it */
  pending_failure_ack: boolean;
  /** Framework conflict selection metadata for dual-framework projects */
  framework_selection: FrameworkSelectionState;
}

export type FrameworkChoice = "gsd" | "spec-kit" | "override" | "cancel" | null;

export interface FrameworkSelectionState {
  choice: FrameworkChoice;
  active_phase: string;
  active_spec_path: string;
  acceptance_note: string;
  updated_at: number;
}

export const BRAIN_STATE_VERSION = "1.0.0";

export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `session-${timestamp}-${random}`;
}

export function migrateBrainState(data: any): BrainState {
  const state = data as BrainState;

  // Migration: ensure fields added in v1.5+ exist
  state.last_commit_suggestion_turn ??= 0;

  // Migration: ensure Round 2 session fields exist
  if (state.session) {
    state.session.date ??= new Date(state.session.start_time).toISOString().split("T")[0];
    state.session.meta_key ??= "";
    state.session.role ??= "";
    state.session.by_ai ??= true;
  }

  // Migration: ensure Iteration 1 fields exist (hierarchy-redesign)
  state.compaction_count ??= 0;
  state.last_compaction_time ??= 0;
  state.next_compaction_report ??= null;
  state.cycle_log ??= [];
  state.pending_failure_ack ??= false;

  // Migration: ensure detection counter fields exist
  if (state.metrics) {
    state.metrics.consecutive_failures ??= 0;
    state.metrics.consecutive_same_section ??= 0;
    state.metrics.last_section_content ??= "";
    state.metrics.keyword_flags ??= [];
    state.metrics.write_without_read_count ??= 0;
    state.metrics.tool_type_counts ??= { read: 0, write: 0, query: 0, governance: 0 };

    state.metrics.governance_counters ??= {
      out_of_order: 0,
      drift: 0,
      compaction: 0,
      evidence_pressure: 0,
      ignored: 0,
      acknowledged: false,
      prerequisites_completed: false,
    };
  }

  state.framework_selection ??= {
    choice: null,
    active_phase: "",
    active_spec_path: "",
    acceptance_note: "",
    updated_at: 0,
  };

  // Migration: remove deprecated sentiment_signals field
  if ("sentiment_signals" in state) {
    delete (state as any).sentiment_signals;
  }

  return state;
}

export function createBrainState(
  sessionId: string,
  config: HiveMindConfig,
  mode: SessionMode = "plan_driven"
): BrainState {
  const now = Date.now();
  
  return {
    session: {
      id: sessionId,
      mode,
      governance_mode: config.governance_mode,
      governance_status: config.governance_mode === "strict" ? "LOCKED" : "OPEN",
      start_time: now,
      last_activity: now,
      date: new Date(now).toISOString().split("T")[0],
      meta_key: "",
      role: "",
      by_ai: true,
    },
    hierarchy: {
      trajectory: "",
      tactic: "",
      action: "",
    },
    metrics: {
      turn_count: 0,
      drift_score: 100,
      files_touched: [],
      context_updates: 0,
      ratings: [],
      auto_health_score: 100,
      total_tool_calls: 0,
      successful_tool_calls: 0,
      violation_count: 0,
      // Detection counters (initialized empty)
      consecutive_failures: 0,
      consecutive_same_section: 0,
      last_section_content: "",
      tool_type_counts: { read: 0, write: 0, query: 0, governance: 0 },
      keyword_flags: [],
      write_without_read_count: 0,
      governance_counters: {
        out_of_order: 0,
        drift: 0,
        compaction: 0,
        evidence_pressure: 0,
        ignored: 0,
        acknowledged: false,
        prerequisites_completed: false,
      },
    },
    complexity_nudge_shown: false,
    last_commit_suggestion_turn: 0,
    version: BRAIN_STATE_VERSION,
    // Hierarchy redesign fields (initialized null/0)
    next_compaction_report: null,
    compaction_count: 0,
    last_compaction_time: 0,
    // Cycle intelligence fields
    cycle_log: [],
    pending_failure_ack: false,
    framework_selection: {
      choice: null,
      active_phase: "",
      active_spec_path: "",
      acceptance_note: "",
      updated_at: 0,
    },
  };
}

export function isSessionLocked(state: BrainState): boolean {
  return state.session.governance_status === "LOCKED";
}

export function unlockSession(state: BrainState): BrainState {
  return {
    ...state,
    session: {
      ...state.session,
      governance_status: "OPEN",
      last_activity: Date.now(),
    },
  };
}

export function lockSession(state: BrainState): BrainState {
  return {
    ...state,
    session: {
      ...state.session,
      governance_status: "LOCKED",
      last_activity: Date.now(),
    },
  };
}

export function incrementTurnCount(state: BrainState): BrainState {
  return {
    ...state,
    metrics: {
      ...state.metrics,
      turn_count: state.metrics.turn_count + 1,
    },
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  };
}

export function resetTurnCount(state: BrainState): BrainState {
  return {
    ...state,
    metrics: {
      ...state.metrics,
      turn_count: 0,
      drift_score: Math.min(100, state.metrics.drift_score + 10),
    },
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  };
}

export function updateHierarchy(
  state: BrainState,
  hierarchy: Partial<HierarchyState>
): BrainState {
  return {
    ...state,
    hierarchy: { ...state.hierarchy, ...hierarchy },
    metrics: {
      ...state.metrics,
      context_updates: state.metrics.context_updates + 1,
    },
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  };
}

export function addFileTouched(state: BrainState, filePath: string): BrainState {
  if (state.metrics.files_touched.includes(filePath)) {
    return state;
  }
  return {
    ...state,
    metrics: {
      ...state.metrics,
      files_touched: [...state.metrics.files_touched, filePath],
    },
  };
}

export function calculateDriftScore(state: BrainState): number {
  const turnsPenalty = Math.min(50, state.metrics.turn_count * 5);
  const updatesBonus = Math.min(20, state.metrics.context_updates * 2);
  return Math.max(0, Math.min(100, 100 - turnsPenalty + updatesBonus));
}

export function shouldTriggerDriftWarning(
  state: BrainState,
  maxTurns: number
): boolean {
  return state.metrics.turn_count >= maxTurns && state.metrics.drift_score < 50;
}

export function addSelfRating(
  state: BrainState,
  rating: Omit<SelfRating, "timestamp" | "turn_number">
): BrainState {
  const newRating: SelfRating = {
    ...rating,
    timestamp: Date.now(),
    turn_number: state.metrics.turn_count,
  };
  return {
    ...state,
    metrics: {
      ...state.metrics,
      ratings: [...state.metrics.ratings, newRating],
    },
  };
}

export function setComplexityNudgeShown(state: BrainState): BrainState {
  return {
    ...state,
    complexity_nudge_shown: true,
  };
}

export function resetComplexityNudge(state: BrainState): BrainState {
  return {
    ...state,
    complexity_nudge_shown: false,
  };
}

export function setLastCommitSuggestionTurn(state: BrainState, turn: number): BrainState {
  return {
    ...state,
    last_commit_suggestion_turn: turn,
  };
}

export function addViolationCount(state: BrainState): BrainState {
  return {
    ...state,
    metrics: {
      ...state.metrics,
      violation_count: state.metrics.violation_count + 1,
    },
  };
}

/**
 * Auto-capture a subagent tool output into cycle_log.
 * Detects failure keywords and sets pending_failure_ack if found.
 * Caps cycle_log at MAX_CYCLE_LOG entries (drops oldest).
 */
export function addCycleLogEntry(
  state: BrainState,
  tool: string,
  output: string
): BrainState {
  const excerpt = output.slice(0, 500);
  const lowerExcerpt = excerpt.toLowerCase();
  const foundKeywords = FAILURE_KEYWORDS.filter(kw => lowerExcerpt.includes(kw));
  const failureDetected = foundKeywords.length > 0;

  const entry: CycleLogEntry = {
    timestamp: Date.now(),
    tool,
    output_excerpt: excerpt,
    failure_detected: failureDetected,
    failure_keywords: foundKeywords,
  };

  const newLog = [...(state.cycle_log ?? []), entry];
  // Cap at MAX_CYCLE_LOG
  const trimmedLog = newLog.length > MAX_CYCLE_LOG
    ? newLog.slice(newLog.length - MAX_CYCLE_LOG)
    : newLog;

  return {
    ...state,
    cycle_log: trimmedLog,
    // Set pending_failure_ack if failure detected (don't clear existing)
    pending_failure_ack: state.pending_failure_ack || failureDetected,
  };
}

/**
 * Clear the pending_failure_ack flag (called by export_cycle or map_context with blocked status).
 */
export function clearPendingFailureAck(state: BrainState): BrainState {
  return {
    ...state,
    pending_failure_ack: false,
  };
}
