/**
 * Brain State Schema
 * Core state machine for session governance
 */

import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { HiveMindConfig, GovernanceMode, V29OutputStyle } from "./config.js";
import type { HierarchyState } from "./hierarchy.js";
import type { GovernanceCounters } from "../lib/detection.js";

export type SessionMode = "plan_driven" | "quick_fix" | "exploration";
export type GovernanceStatus = "LOCKED" | "OPEN";
export type SessionKind = "main" | "sub" | "unresolved";
export type LineageScope = "project" | "meta-framework" | "unknown";
export type RoleSource = "declare" | "profile" | "inferred" | "unset";
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
  /** Session execution kind (main user-facing vs delegated sub-session) */
  kind: SessionKind;
  /** Declared lineage scope for this session */
  lineage_scope: LineageScope;
  /** Provenance of current role assignment */
  role_source: RoleSource;
  /** Whether session was initiated by AI (true) or human (false) */
  by_ai: boolean;
  /** OpenCode's session ID for cross-system correlation (Knot 2) */
  opencode_session_id: string | null;
}

export interface MetricsState {
  /** Tool execution count (many per user message) - used for health tracking */
  turn_count: number;
  /** User response cycles (one per user→assistant→user) - used for split logic */
  user_turn_count: number;
  drift_score: number;
  files_touched: string[];
  context_updates: number;
  /** Last user turn index where hierarchy context was updated */
  last_context_update_turn?: number;
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
  /** User turn index where keyword flags were last reset */
  keyword_flags_reset_turn?: number;
  /** Count of file writes without prior read this session */
  write_without_read_count: number;
  /** File paths that have been read at least once this session */
  files_read_this_session?: string[];
  /** Governance escalation/reset counters for severity routing */
  governance_counters: GovernanceCounters;
}

/** Captured subagent cycle result (auto-captured by tool.execute.after) */
export interface CycleLogEntry {
  /** Epoch ms when captured */
  timestamp: number;
  /** Tool name that was captured (usually 'task') */
  tool: string;
  /** Delegated task/session identifier when the runtime surfaces one */
  task_id?: string;
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

export interface CheckpointSnapshot {
  id: string;
  timestamp: number;
  trigger: string;
  session_id: string;
  turn_count: number;
  hierarchy: HierarchyState;
  metrics: {
    drift_score: number;
    context_updates: number;
    files_touched: string[];
    violation_count: number;
  };
  governance_counters: GovernanceCounters;
  pending_mandatory_tools: string[];
  pending_failure_ack: boolean;
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
  /** @lifecycle runtime - deterministic trigger queue for mandatory governance tools */
  pending_mandatory_tools: string[];
  /** @lifecycle hybrid - user framework preference persists until intentionally changed */
  framework_selection: FrameworkSelectionState;

  // Cross-session continuity (P0-6: session-split amnesia fix)
  /** @lifecycle runtime */
  recent_messages: Array<{ role: "user" | "assistant"; content: string }>;
  /** @lifecycle hybrid - unresolved off-track intents carried across sessions */
  offtrack_todo_pending: OffTrackIntent[];
  /** @lifecycle hybrid - plan-aware trajectory context */
  trajectory_context: TrajectoryContext;
  /** @lifecycle hybrid - bounded checkpoint snapshots for deterministic restore */
  checkpoints: CheckpointSnapshot[];
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
  pending_mandatory_tools: "runtime",
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
  trajectory_context: "hybrid",
  checkpoints: "hybrid",
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

/** Trajectory context for plan-aware sessions */
export interface TrajectoryContext {
  /** Session classification */
  session_type: "main" | "delegated" | "post_compaction" | "long_haul";
  /** Memory classification for current turn */
  memory_class: "discovery" | "research" | "codebase_investigation" | "planning" | "implementing" | "debug_testing";
  /** Active plan context */
  active_plan_prefix: string | null;
  active_plan_id: string | null;
  /** Disclosure level */
  disclosure_depth: "summary" | "detail" | "full";
  /** Revalidation loop counter (for long-haul sessions) */
  revalidation_count: number;
  /** Transformed prompt metadata (from session start) */
  context_preparation: {
    sot_searched: boolean;
    skills_activated: string[];
    investigation_complete: boolean;
    mapped_nodes: string[];
    success_metrics: string[];
  };
}

export const BRAIN_STATE_VERSION = "2.0.0";

// ── Zod Runtime Validation Schema ──
// Mirrors the BrainState interface for runtime validation on load.
// Used by StateManager.load() to detect corrupt or outdated brain.json files.

const SessionStateSchema = z.object({
  id: z.string(),
  trajectory_id: z.string().optional(),
  opencode_session_id: z.string().nullable().default(null),
  mode: z.enum(["plan_driven", "quick_fix", "exploration"]),
  governance_mode: z.enum(["strict", "assisted", "permissive"]),
  governance_status: z.enum(["LOCKED", "OPEN"]),
  start_time: z.number(),
  last_activity: z.number(),
  date: z.string(),
  meta_key: z.string(),
  role: z.string(),
  kind: z.enum(["main", "sub", "unresolved"]).default("unresolved"),
  lineage_scope: z.enum(["project", "meta-framework", "unknown"]).default("unknown"),
  role_source: z.enum(["declare", "profile", "inferred", "unset"]).default("unset"),
  by_ai: z.boolean(),
});

const MetricsStateSchema = z.object({
  turn_count: z.number(),
  user_turn_count: z.number(),
  drift_score: z.number(),
  files_touched: z.array(z.string()),
  context_updates: z.number(),
  last_context_update_turn: z.number().optional(),
  auto_health_score: z.number(),
  total_tool_calls: z.number(),
  successful_tool_calls: z.number(),
  violation_count: z.number(),
  consecutive_failures: z.number(),
  consecutive_same_section: z.number(),
  last_section_content: z.string(),
  tool_type_counts: z.object({
    read: z.number(),
    write: z.number(),
    query: z.number(),
    governance: z.number(),
  }),
  keyword_flags: z.array(z.string()),
  keyword_flags_reset_turn: z.number().optional(),
  write_without_read_count: z.number(),
  files_read_this_session: z.array(z.string()).optional(),
  governance_counters: z.object({
    drift: z.number(),
    compaction: z.number(),
    out_of_order: z.number(),
    evidence_pressure: z.number(),
  }),
});

const CycleLogEntrySchema = z.object({
  timestamp: z.number(),
  tool: z.string(),
  task_id: z.string().optional(),
  failure_detected: z.boolean(),
  failure_keywords: z.array(z.string()),
});

const FirstTurnConfirmationSchema = z.object({
  required: z.boolean(),
  confirmed: z.boolean(),
  rationale_option: z.enum(["option_1", "option_2", "option_3"]).nullable(),
  selected_output_style: z.string().nullable(),
  confirmed_at: z.number().nullable(),
});

const FrameworkSelectionSchema = z.object({
  choice: z.enum(["gsd", "spec-kit", "override", "cancel"]).nullable(),
  active_phase: z.string(),
  active_spec_path: z.string(),
  acceptance_note: z.string(),
  updated_at: z.number(),
});

const OffTrackIntentSchema = z.object({
  id: z.string(),
  content: z.string(),
  created_at: z.number(),
  source: z.string(),
  status: z.enum(["pending", "resolved"]),
});

const CheckpointSnapshotSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  trigger: z.string(),
  session_id: z.string(),
  turn_count: z.number(),
  hierarchy: z.object({
    trajectory: z.string(),
    tactic: z.string(),
    action: z.string(),
  }),
  metrics: z.object({
    drift_score: z.number(),
    context_updates: z.number(),
    files_touched: z.array(z.string()),
    violation_count: z.number(),
  }),
  governance_counters: z.object({
    drift: z.number(),
    compaction: z.number(),
    out_of_order: z.number(),
    evidence_pressure: z.number(),
  }),
  pending_mandatory_tools: z.array(z.string()),
  pending_failure_ack: z.boolean(),
});

const TrajectoryContextSchema = z.object({
  session_type: z.enum(["main", "delegated", "post_compaction", "long_haul"]),
  memory_class: z.enum(["discovery", "research", "codebase_investigation", "planning", "implementing", "debug_testing"]),
  active_plan_prefix: z.string().nullable(),
  active_plan_id: z.string().nullable(),
  disclosure_depth: z.enum(["summary", "detail", "full"]),
  revalidation_count: z.number(),
  context_preparation: z.object({
    sot_searched: z.boolean(),
    skills_activated: z.array(z.string()),
    investigation_complete: z.boolean(),
    mapped_nodes: z.array(z.string()),
    success_metrics: z.array(z.string()),
  }),
});

const HierarchyStateSchema = z.object({
  trajectory: z.string(),
  tactic: z.string(),
  action: z.string(),
});

const MemoryGovernanceSchema = z.object({
  last_classified_at: z.number(),
  pending_purge: z.boolean().optional(),
});

export const BrainStateSchema = z.object({
  session: SessionStateSchema,
  hierarchy: HierarchyStateSchema,
  metrics: MetricsStateSchema,
  first_turn_context_injected: z.boolean().default(false),
  first_turn_confirmation: FirstTurnConfirmationSchema,
  selected_output_style_v29: z.string().nullable(),
  memory_governance: MemoryGovernanceSchema,
  version: z.string(),
  next_compaction_report: z.string().nullable().default(null),
  compaction_count: z.number().default(0),
  last_compaction_time: z.number().default(0),
  compaction_limit_reached: z.boolean().default(false),
  cycle_log: z.array(CycleLogEntrySchema).default([]),
  pending_failure_ack: z.boolean().default(false),
  pending_mandatory_tools: z.array(z.string()).default([]),
  framework_selection: FrameworkSelectionSchema,
  recent_messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).default([]),
  offtrack_todo_pending: z.array(OffTrackIntentSchema).default([]),
  trajectory_context: TrajectoryContextSchema,
  checkpoints: z.array(CheckpointSnapshotSchema).default([]),
});

export type BrainStateFromSchema = z.infer<typeof BrainStateSchema>;

/**
 * Migrate v1 BrainState (pre-session-scoping) to v2.
 * Adds opencode_session_id field and bumps version.
 */
export function migrateBrainStateV1toV2(raw: Record<string, unknown>): Record<string, unknown> {
  const session = raw.session as Record<string, unknown> | undefined;
  if (session && !('opencode_session_id' in session)) {
    session.opencode_session_id = null;
  }
  raw.version = "2.0.0";
  return raw;
}

/** Migration registry: version string → migration function */
export const BRAIN_STATE_MIGRATIONS: Map<string, (raw: Record<string, unknown>) => Record<string, unknown>> = new Map([
  ["1.0.0", migrateBrainStateV1toV2],
]);

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
      kind: "unresolved",
      lineage_scope: "unknown",
      role_source: "unset",
      by_ai: true,
      opencode_session_id: null,
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
      last_context_update_turn: 0,
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
      keyword_flags_reset_turn: 0,
      write_without_read_count: 0,
      files_read_this_session: [],
      governance_counters: {
        drift: 0,
        compaction: 0,
        out_of_order: 0,
        evidence_pressure: 0,
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
    pending_mandatory_tools: [],
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
    // Planning framework trajectory context
    trajectory_context: {
      session_type: "main",
      memory_class: "planning",
      active_plan_prefix: null,
      active_plan_id: null,
      disclosure_depth: "summary",
      revalidation_count: 0,
      context_preparation: {
        sot_searched: false,
        skills_activated: [],
        investigation_complete: false,
        mapped_nodes: [],
        success_metrics: [],
      },
    },
    checkpoints: [],
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
      last_context_update_turn: state.metrics.user_turn_count,
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
  const userTurns = state.metrics.user_turn_count;
  const lastUpdateTurn = state.metrics.last_context_update_turn ?? 0;
  const turnsSinceUpdate = Math.max(0, userTurns - lastUpdateTurn);
  const turnsPenalty = Math.min(50, turnsSinceUpdate * 5);
  const updatesBonus = state.metrics.context_updates > 0 ? 20 : 0;
  return Math.max(0, Math.min(100, 100 - turnsPenalty + updatesBonus));
}

export function shouldTriggerDriftWarning(
  state: BrainState,
  maxTurns: number
): boolean {
  return state.metrics.user_turn_count >= maxTurns && state.metrics.drift_score < 50;
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
 *
 * @param state - Current BrainState snapshot.
 * @param tool - Tool name associated with the captured output.
 * @param output - Tool output text used for failure-keyword detection.
 * @param options - Optional continuity metadata surfaced by the runtime.
 * @returns Updated BrainState with the new cycle-log entry appended.
 */
export function addCycleLogEntry(
  state: BrainState,
  tool: string,
  output: string,
  options?: {
    taskId?: string | null;
  }
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
  if (typeof options?.taskId === "string" && options.taskId.trim().length > 0) {
    entry.task_id = options.taskId.trim();
  }

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
