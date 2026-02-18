/**
 * Auto-Context State - Automatic FK wiring to prevent "Hallucinated FK Risk"
 *
 * US-051: Provides automatic tracking of session focus to infer foreign keys
 * when creating mems, tasks, and other graph entities.
 *
 * Problem: Agents might use wrong UUIDs when creating mems/tasks.
 * Solution: System automatically tracks focus and infers FKs.
 *
 * ARCHITECTURAL NOTE: This is a thin utility wrapper that tracks session focus.
 * The actual FK fields (active_task_ids, active_phase_id, active_plan_id) are
 * defined in TrajectoryNodeSchema (graph-nodes.ts). This module provides
 * in-memory tracking for FK inference during the session.
 *
 * @module lib/auto-context
 * @see graph-nodes.ts:TrajectoryNodeSchema for persistent FK storage
 */

/**
 * Represents the current focus state of a session.
 * Used to auto-wire foreign keys for newly created entities.
 *
 * Note: This mirrors fields from TrajectoryNodeSchema for in-memory tracking.
 * The authoritative source of truth is the graph node in persistent storage.
 */
export interface FocusState {
  /** Session ID this focus belongs to */
  sessionId: string;
  /** Last file that was modified */
  lastModifiedFile: string | null;
  /** Currently active task UUID */
  activeTaskId: string | null;
  /** Currently active phase UUID */
  activePhaseId: string | null;
  /** Currently active plan UUID */
  activePlanId: string | null;
  /** Recent commands executed (max 10) */
  recentCommands: string[];
  /** Drift score (0-100) based on context switches */
  focusDriftScore: number;
  /** ISO timestamp of last focus update */
  lastFocusUpdate: string;
}

/**
 * Types of focus-tracking actions.
 */
export type FocusActionType =
  | "file_modified"
  | "task_created"
  | "mem_created"
  | "context_mapped"
  | "command_executed";

/**
 * Action payload for focus tracking.
 */
export interface FocusAction {
  type: FocusActionType;
  payload: Record<string, unknown>;
}

/** Maximum number of recent commands to track */
const MAX_RECENT_COMMANDS = 10;

/** Points added to drift score on directory switch */
const DRIFT_INCREMENT = 10;

/** Points subtracted from drift score on successful context update */
const DRIFT_DECREMENT = 5;

/** Maximum drift score */
const MAX_DRIFT_SCORE = 100;

/** Minimum drift score */
const MIN_DRIFT_SCORE = 0;

/**
 * Focus states indexed by session ID.
 * Uses a Map to support multiple concurrent sessions (worktrees, parallel agents).
 */
const focusStates = new Map<string, FocusState>();

/**
 * Get or create focus state for a session.
 * @internal
 */
function getOrCreateFocusState(sessionId: string): FocusState {
  let state = focusStates.get(sessionId);
  if (!state) {
    state = {
      sessionId,
      lastModifiedFile: null,
      activeTaskId: null,
      activePhaseId: null,
      activePlanId: null,
      recentCommands: [],
      focusDriftScore: 0,
      lastFocusUpdate: new Date().toISOString(),
    };
    focusStates.set(sessionId, state);
  }
  return state;
}

/**
 * Extract directory from a file path.
 * Returns the directory portion without trailing slash.
 */
function extractDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf("/");
  return lastSlash > 0 ? filePath.slice(0, lastSlash) : "";
}

/**
 * Track focus state changes from tool/hook calls.
 *
 * Updates the session's focus state based on the action type:
 * - file_modified: Updates lastModifiedFile, potentially increases drift
 * - task_created: Sets activeTaskId
 * - mem_created: No state change, but confirms focus
 * - context_mapped: Updates phase/plan IDs, decreases drift
 * - command_executed: Adds to recentCommands
 *
 * @param sessionId - The session ID (required for multi-session support)
 * @param action - The action that occurred
 * @returns The updated focus state
 */
export function trackFocusState(
  sessionId: string,
  action: FocusAction
): FocusState {
  const state = getOrCreateFocusState(sessionId);

  const prevFile = state.lastModifiedFile;
  const prevDir = prevFile ? extractDirectory(prevFile) : null;

  // Apply action-specific updates
  switch (action.type) {
    case "file_modified": {
      const file = action.payload.file as string | undefined;
      if (file) {
        state.lastModifiedFile = file;
        const newDir = extractDirectory(file);

        // Increase drift score if switching to different directory
        if (prevDir && newDir && prevDir !== newDir) {
          state.focusDriftScore = Math.min(
            MAX_DRIFT_SCORE,
            state.focusDriftScore + DRIFT_INCREMENT
          );
        }
      }
      break;
    }

    case "task_created": {
      const taskId = action.payload.taskId as string | undefined;
      if (taskId) {
        state.activeTaskId = taskId;
      }
      break;
    }

    case "mem_created": {
      // Mem creation confirms focus but doesn't change state
      // The origin_task_id should come from activeTaskId
      break;
    }

    case "context_mapped": {
      const phaseId = action.payload.phaseId as string | undefined;
      const planId = action.payload.planId as string | undefined;

      if (phaseId) {
        state.activePhaseId = phaseId;
      }
      if (planId) {
        state.activePlanId = planId;
      }

      // Context mapping decreases drift (agent is on track)
      state.focusDriftScore = Math.max(
        MIN_DRIFT_SCORE,
        state.focusDriftScore - DRIFT_DECREMENT
      );
      break;
    }

    case "command_executed": {
      const command = action.payload.command as string | undefined;
      if (command) {
        // Add to recent commands, maintaining max size
        state.recentCommands.push(command);
        if (state.recentCommands.length > MAX_RECENT_COMMANDS) {
          state.recentCommands = state.recentCommands.slice(-MAX_RECENT_COMMANDS);
        }
      }
      break;
    }
  }

  // Update timestamp
  state.lastFocusUpdate = new Date().toISOString();

  return { ...state };
}

/**
 * Get current focus state for a session.
 *
 * @param sessionId - The session ID (required for multi-session support)
 * @returns The focus state for the session, or null if not initialized
 */
export function getCurrentFocus(sessionId?: string): FocusState | null {
  // If sessionId provided, get that specific session's focus
  if (sessionId) {
    const state = focusStates.get(sessionId);
    return state ? { ...state } : null;
  }

  // Legacy: Return first available session's focus (for backward compatibility)
  const firstState = focusStates.values().next().value;
  return firstState ? { ...firstState } : null;
}

/**
 * Auto-wire FK for new mem.
 *
 * Returns the inferred origin_task_id from the active focus.
 * This helps prevent "hallucinated FK" where agents might use wrong UUIDs.
 *
 * @param sessionId - The session ID (required for multi-session support)
 * @returns The active task ID, or null if no active task
 */
export function autoWireMemFK(sessionId?: string): string | null {
  const state = getCurrentFocus(sessionId);
  return state?.activeTaskId ?? null;
}

/**
 * Auto-wire FK for new task.
 *
 * Returns the inferred parent_phase_id from the active focus.
 * This helps prevent "hallucinated FK" where agents might use wrong UUIDs.
 *
 * @param sessionId - The session ID (required for multi-session support)
 * @returns The active phase ID, or null if no active phase
 */
export function autoWireTaskFK(sessionId?: string): string | null {
  const state = getCurrentFocus(sessionId);
  return state?.activePhaseId ?? null;
}

/**
 * Detect focus drift when returning to a previous file.
 *
 * Checks if the user has switched context and is now returning to a
 * previously modified file. This can indicate context switching.
 *
 * @param currentFile - The file being accessed
 * @param sessionId - The session ID (required for multi-session support)
 * @returns Drift detection result, or null if no drift detected
 */
export function detectFocusDrift(
  currentFile: string,
  sessionId?: string
): { drifted: boolean; suggestion: string } | null {
  const state = getCurrentFocus(sessionId);
  if (!state) {
    return null;
  }

  const lastFile = state.lastModifiedFile;
  if (!lastFile) {
    return null;
  }

  // Same file = no drift
  if (currentFile === lastFile) {
    return null;
  }

  // Same directory = no drift (working in same area)
  const currentDir = extractDirectory(currentFile);
  const lastDir = extractDirectory(lastFile);

  if (currentDir === lastDir) {
    return null;
  }

  // Different directory = potential drift
  return {
    drifted: true,
    suggestion: `Focus has shifted from ${lastFile} to ${currentFile}. Consider updating context.`,
  };
}

/**
 * Reset focus state for a specific session.
 *
 * Clears the focus state for the given session.
 * If no sessionId provided, clears all sessions (for testing).
 *
 * @param sessionId - Optional session ID. If not provided, clears all sessions.
 */
export function resetFocusState(sessionId?: string): void {
  if (sessionId) {
    focusStates.delete(sessionId);
  } else {
    focusStates.clear();
  }
}

/**
 * Reset drift score for a session.
 *
 * Sets the drift score back to 0 for the given session.
 * Useful when agent acknowledges drift and refocuses.
 *
 * @param sessionId - The session ID
 */
export function resetDriftScore(sessionId: string): void {
  const state = focusStates.get(sessionId);
  if (state) {
    state.focusDriftScore = 0;
  }
}

/**
 * Decay drift score for a session.
 *
 * Reduces the drift score by a fixed amount.
 * Called automatically on successful context updates.
 *
 * @param sessionId - The session ID
 * @param amount - Amount to decay (default: DRIFT_DECREMENT)
 */
export function decayDriftScore(sessionId: string, amount: number = DRIFT_DECREMENT): void {
  const state = focusStates.get(sessionId);
  if (state) {
    state.focusDriftScore = Math.max(MIN_DRIFT_SCORE, state.focusDriftScore - amount);
  }
}

/**
 * Get the active plan ID.
 *
 * @param sessionId - The session ID (required for multi-session support)
 * @returns The active plan ID, or null if not set
 */
export function getActivePlanId(sessionId?: string): string | null {
  const state = getCurrentFocus(sessionId);
  return state?.activePlanId ?? null;
}

/**
 * Get the last modified file.
 *
 * @param sessionId - The session ID (required for multi-session support)
 * @returns The last modified file path, or null if not set
 */
export function getLastModifiedFile(sessionId?: string): string | null {
  const state = getCurrentFocus(sessionId);
  return state?.lastModifiedFile ?? null;
}

/**
 * Get all active session IDs.
 * Useful for debugging and monitoring.
 *
 * @returns Array of session IDs with focus state
 */
export function getActiveSessions(): string[] {
  return Array.from(focusStates.keys());
}
