/**
 * Brain State Schema
 * Core state machine for session governance
 */

import type { HiveMindConfig, GovernanceMode } from "./config.js";
import type { HierarchyState } from "./hierarchy.js";
import type { SentimentSignal } from "../lib/sentiment.js";

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
}

export interface BrainState {
  session: SessionState;
  hierarchy: HierarchyState;
  metrics: MetricsState;
  sentiment_signals: SentimentSignal[];
  complexity_nudge_shown: boolean;
  /** Turn number when last commit suggestion was shown */
  last_commit_suggestion_turn: number;
  version: string;
}

export const BRAIN_STATE_VERSION = "1.0.0";

export function generateSessionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `session-${timestamp}-${random}`;
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
    },
    sentiment_signals: [],
    complexity_nudge_shown: false,
    last_commit_suggestion_turn: 0,
    version: BRAIN_STATE_VERSION,
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

// Dead functions removed: trackToolCall, addSentimentSignals
// Preserved in git history — re-add when sentiment pipeline is wired.

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

