/**
 * Brain State Schema
 * Core state machine for session governance
 */

import { randomUUID } from "node:crypto";
import type { HiveMindConfig, GovernanceMode, V29OutputStyle } from "./config.js";
import type { HierarchyState } from "./hierarchy.js";
import type { GovernanceCounters } from "../lib/detection.js";

export type SessionMode = "plan_driven" | "quick_fix" | "exploration";
export type GovernanceStatus = "LOCKED" | "OPEN";
/** Classification for brain state fields across session boundaries */
export type FieldLifecycle = "runtime" | "persistent" | "hybrid";

export interface SessionState {
  id: string;
  trajectory_id?: string;
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

export interface MetricsState {
  /** Tool execution count (many per user message) - used for health tracking */
  turn_count: number;
  /** User response cycles (one per user→assistant→user) - used for split logic */
  user_turn_count: number;
  drift_score: number;
  files_touched: string[];
  context_updates: number;
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

export type RationaleOption = "option_1" | "option_2" | "option_3" | null;

export interface FirstTurnConfirmationState {
  required: boolean;
  confirmed: boolean;
  rationale_option: RationaleOption;
  selected_output_style: V29OutputStyle | null;
  confirmed_at: number | null;
}

export type SessionMemoryCategory =
  | "discovery_brainstorming_discuss"
  | "research_synthesis"
  | "codebase_investigation"
  | "planning"
  | "implementing"
  | "debug"
  | "test_validation_gatekeeping";

export interface MemoryGovernanceState {
  last_classified_at: number;
  /** Phase 3A: Flag set by event-handler when terminal tasks detected; cleared by purge action */
  pending_purge?: boolean;
}

export interface OffTrackIntent {
  id: string;
  content: string;
  created_at: number;
  source: string;
  status: "pending" | "resolved";
}

export interface BrainState {
  /** @lifecycle runtime */
  session: SessionState;
  /** @lifecycle runtime */
  hierarchy: HierarchyState;
  /** @lifecycle runtime */
  metrics: MetricsState;
  /** @lifecycle runtime */
  first_turn_context_injected: boolean;
  /** @lifecycle runtime */
  first_turn_confirmation: FirstTurnConfirmationState;
  /** @lifecycle runtime */
  selected_output_style_v29: V29OutputStyle | null;
  /** @lifecycle runtime */
  memory_governance: MemoryGovernanceState;
  /** @lifecycle persistent */
  version: string;

  // New — hierarchy redesign fields
  /** @lifecycle hybrid - set during compaction and consumed by the next session */
  next_compaction_report: string | null;
  /** @lifecycle hybrid - cumulative compaction counter carried across session boundaries */
  compaction_count: number;
  /** @lifecycle hybrid - latest compaction timestamp used for continuity checks */
  last_compaction_time: number;
  /** @lifecycle runtime - compaction hard limit reached; prompt LLM to start a fresh session */
  compaction_limit_reached: boolean;

  // Cycle intelligence fields
  /** @lifecycle runtime */
  cycle_log: CycleLogEntry[];
  /** @lifecycle runtime */
  pending_failure_ack: boolean;
  /** @lifecycle hybrid - user framework preference persists until intentionally changed */
  framework_selection: FrameworkSelectionState;

  // Cross-session continuity (P0-6: session-split amnesia fix)
  /** @lifecycle runtime */
  recent_messages: Array<{ role: "user" | "assistant"; content: string }>;
  /** @lifecycle hybrid - unresolved off-track intents carried across sessions */
  offtrack_todo_pending: OffTrackIntent[];
}

export const BRAIN_STATE_FIELD_CLASSIFICATION: Record<keyof BrainState, FieldLifecycle> = {
  // Session fields reset each session
  session: "runtime",
  hierarchy: "runtime",
  metrics: "runtime",
  first_turn_context_injected: "runtime",
  first_turn_confirmation: "runtime",
  selected_output_style_v29: "runtime",
  memory_governance: "runtime",
  cycle_log: "runtime",
  pending_failure_ack: "runtime",
  compaction_limit_reached: "runtime",
  recent_messages: "runtime",

  // Persistent fields survive all sessions
  version: "persistent",

  // Hybrid fields carry forward conditionally
  compaction_count: "hybrid",
  last_compaction_time: "hybrid",
  next_compaction_report: "hybrid",
  framework_selection: "hybrid",
  offtrack_todo_pending: "hybrid",
};

export function getFieldsByLifecycle(lifecycle: FieldLifecycle): Array<keyof BrainState> {
  return (Object.keys(BRAIN_STATE_FIELD_CLASSIFICATION) as Array<keyof BrainState>).filter(
    (field) => BRAIN_STATE_FIELD_CLASSIFICATION[field] === lifecycle
  );
}

export function getHybridFields(): Array<keyof BrainState> {
  return getFieldsByLifecycle("hybrid");
}

export function carryForwardHybridFields(oldState: BrainState, newState: BrainState): BrainState {
  const carriedHybridValues = Object.fromEntries(
    getHybridFields().map((field) => [field, oldState[field]])
  ) as Partial<BrainState>;

  return {
    ...newState,
    ...carriedHybridValues,
  };
}

export function getRuntimeFields(): Array<keyof BrainState> {
  return getFieldsByLifecycle("runtime");
}

export function getPersistentFields(): Array<keyof BrainState> {
  return getFieldsByLifecycle("persistent");
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
  // Return a proper UUID for graph schema compatibility
  return randomUUID()
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
      governance_status: "LOCKED", // Always start LOCKED - call startSession() to unlock
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
      user_turn_count: 0,
      drift_score: 100,
      files_touched: [],
      context_updates: 0,
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
        drift: 0,
        compaction: 0,
      },
    },
    first_turn_context_injected: false,
    first_turn_confirmation: {
      required: true,
      confirmed: false,
      rationale_option: null,
      selected_output_style: null,
      confirmed_at: null,
    },
    selected_output_style_v29: config.agent_behavior.output_style_v29 ?? null,
    memory_governance: {
      last_classified_at: 0,
    },
    version: BRAIN_STATE_VERSION,
    // Hierarchy redesign fields (initialized null/0)
    next_compaction_report: null,
    compaction_count: 0,
    last_compaction_time: 0,
    compaction_limit_reached: false,
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
    // Cross-session continuity (P0-6)
    recent_messages: [],
    offtrack_todo_pending: [],
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

/** Increment user_turn_count (called on session.idle event - after each user→assistant→user cycle) */
export function incrementUserTurnCount(state: BrainState): BrainState {
  return {
    ...state,
    metrics: {
      ...state.metrics,
      user_turn_count: state.metrics.user_turn_count + 1,
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
      user_turn_count: 0,
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

export function setComplexityNudgeShown(state: BrainState): BrainState {
  return state;
}

export function resetComplexityNudge(state: BrainState): BrainState {
  return state;
}

export function setLastCommitSuggestionTurn(state: BrainState, turn: number): BrainState {
  void turn;
  return state;
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
  const lowerOutput = output.toLowerCase();
  const foundKeywords = FAILURE_KEYWORDS.filter(kw => lowerOutput.includes(kw));
  const failureDetected = foundKeywords.length > 0;

  const entry: CycleLogEntry = {
    timestamp: Date.now(),
    tool,
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

export function confirmFirstTurnProtocol(
  state: BrainState,
  rationaleOption: Exclude<RationaleOption, null>,
  selectedOutputStyle: V29OutputStyle
): BrainState {
  return {
    ...state,
    first_turn_confirmation: {
      required: false,
      confirmed: true,
      rationale_option: rationaleOption,
      selected_output_style: selectedOutputStyle,
      confirmed_at: Date.now(),
    },
    selected_output_style_v29: selectedOutputStyle,
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  };
}

export function addMemoryClassification(
  state: BrainState,
  category: SessionMemoryCategory
): BrainState {
  void category;
  return {
    ...state,
    memory_governance: {
      ...state.memory_governance,
      last_classified_at: Date.now(),
    },
  };
}

export function recordConsolidationAndPurge(
  state: BrainState,
  consolidatedCount: number,
  purgedCount: number
): BrainState {
  void consolidatedCount;
  void purgedCount;
  return {
    ...state,
    memory_governance: {
      ...state.memory_governance,
      last_classified_at: Date.now(),
    },
  };
}

export function queueOffTrackIntent(
  state: BrainState,
  content: string,
  source = "unspecified"
): BrainState {
  const normalized = content.trim();
  if (!normalized) return state;
  const duplicate = state.offtrack_todo_pending.some(
    (item) => item.status === "pending" && item.content.trim().toLowerCase() === normalized.toLowerCase()
  );
  if (duplicate) return state;

  const nextIntent: OffTrackIntent = {
    id: randomUUID(),
    content: normalized,
    created_at: Date.now(),
    source,
    status: "pending",
  };

  return {
    ...state,
    offtrack_todo_pending: [...state.offtrack_todo_pending, nextIntent],
    session: {
      ...state.session,
      last_activity: Date.now(),
    },
  };
}
