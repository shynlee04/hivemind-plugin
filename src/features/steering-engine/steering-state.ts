import type { SteeringContext } from "./types.js"

// ---------------------------------------------------------------------------
// SteeringStateEntry — per-session steering tracking data
// ---------------------------------------------------------------------------

/**
 * In-memory state entry for a single session's steering engine tracking.
 * Tracks turn count, injection cadence, compaction flags, and task boundaries.
 * @see PATTERNS.md §6 State Tracking (CQRS)
 */
interface SteeringStateEntry {
  /** Current turn number (incremented on each tool.execute.after event). */
  turnCount: number
  /** Turns since the last steering injection into this session. */
  turnsSinceLastInjection: number
  /** Whether a compaction event was observed for this session. */
  lastCompactionFlag: boolean
  /** Whether a task boundary shift was detected. */
  taskBoundaryShift: boolean
  /** Turn number of the most recent injection (null if none). */
  lastInjectionTurn: number | null
}

// ---------------------------------------------------------------------------
// Default state factory
// ---------------------------------------------------------------------------

function createDefaultEntry(): SteeringStateEntry {
  return {
    turnCount: 0,
    turnsSinceLastInjection: 0,
    lastCompactionFlag: false,
    taskBoundaryShift: false,
    lastInjectionTurn: null,
  }
}

// ---------------------------------------------------------------------------
// SteeringState — CQRS read-side in-memory cache (singleton)
// ---------------------------------------------------------------------------

/**
 * In-memory CQRS read-side state for the steering engine.
 *
 * **CQRS boundary:** This module is a READ-SIDE cache. Hooks read from
 * it (via getSteeringContext) without performing durable writes. Tools
 * own the write-side and update this cache when mutations occur.
 *
 * **Never writes to disk from this module.** Persistence is the
 * responsibility of the tool/callbacks that update this cache.
 *
 * @see PATTERNS.md §6 State Tracking (CQRS)
 * @see SPEC.md §5 CQRS Boundary Specification
 */
class SteeringState {
  /** Per-session state entries keyed by sessionId. */
  private sessions = new Map<string, SteeringStateEntry>()

  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // Accessors
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  /**
   * Retrieve or create the state entry for a session.
   * Idempotent — returns existing entry or creates a fresh default.
   */
  private getOrCreate(sessionId: string): SteeringStateEntry {
    let entry = this.sessions.get(sessionId)
    if (!entry) {
      entry = createDefaultEntry()
      this.sessions.set(sessionId, entry)
    }
    return entry
  }

  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // Turn counting
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  /**
   * Increment the turn counter for a session.
   * Called by tool.execute.after hooks.
   * @param sessionId - Session identifier.
   */
  incrementTurnCount(sessionId: string): void {
    const entry = this.getOrCreate(sessionId)
    entry.turnCount++
    entry.turnsSinceLastInjection++
  }

  /**
   * Get the current turn count for a session.
   * @returns Current turn number (0 if session not yet tracked).
   */
  getTurnCount(sessionId: string): number {
    return this.sessions.get(sessionId)?.turnCount ?? 0
  }

  /**
   * Reset the turns-since-injection counter after a successful injection.
   * This enforces the min_turn_interval cadence (C5).
   * @param sessionId - Session identifier.
   */
  resetTurnsSinceInjection(sessionId: string): void {
    const entry = this.getOrCreate(sessionId)
    entry.turnsSinceLastInjection = 0
    entry.lastInjectionTurn = entry.turnCount
  }

  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // Compaction flag
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  /**
   * Mark that a compaction event has occurred for this session.
   * Called by session.compacting hooks.
   * @param sessionId - Session identifier.
   */
  markCompaction(sessionId: string): void {
    const entry = this.getOrCreate(sessionId)
    entry.lastCompactionFlag = true
  }

  /**
   * Check whether a compaction event was observed for this session
   * since the last time the flag was cleared.
   */
  wasCompacted(sessionId: string): boolean {
    return this.sessions.get(sessionId)?.lastCompactionFlag ?? false
  }

  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // Task boundary
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  /**
   * Mark that a task boundary shift has been detected for this session.
   * Called when continuity metadata indicates a scope change.
   * @param sessionId - Session identifier.
   */
  markTaskBoundary(sessionId: string): void {
    const entry = this.getOrCreate(sessionId)
    entry.taskBoundaryShift = true
  }

  /**
   * Check whether a task boundary shift was detected for this session
   * since the last time the flag was cleared.
   */
  hasTaskBoundaryShift(sessionId: string): boolean {
    return this.sessions.get(sessionId)?.taskBoundaryShift ?? false
  }

  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // SteeringContext builder
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  /**
   * Build a SteeringContext snapshot for policy evaluation.
   * This is a pure read operation — no mutations.
   * @param sessionId - Session identifier.
   * @param overrides - Optional context fields that come from other
   *   sources (primitive scanner, behavioral profile, etc.).
   * @returns A complete SteeringContext for condition evaluation.
   */
  getSteeringContext(
    sessionId: string,
    overrides?: Partial<SteeringContext>,
  ): SteeringContext {
    const entry = this.getOrCreate(sessionId)
    return {
      hierarchy: overrides?.hierarchy,
      depth: overrides?.depth,
      lineage: overrides?.lineage,
      workflow_phase: overrides?.workflow_phase,
      active_skills: overrides?.active_skills ?? [],
      delegation_chain: overrides?.delegation_chain ?? [],
      parent_agent: overrides?.parent_agent,
      turn_number: entry.turnCount,
      turns_since_last_injection: entry.turnsSinceLastInjection,
      was_compacted: entry.lastCompactionFlag,
      task_boundary_shift: entry.taskBoundaryShift,
      task_boundary: overrides?.task_boundary,
      remaining_token_budget:
        overrides?.remaining_token_budget ??
        overrides?.max_token_budget ??
        0,
      max_token_budget: overrides?.max_token_budget ?? 600,
    }
  }

  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
  // Session lifecycle
  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  /**
   * Reset all steering state for a session. Idempotent.
   * @param sessionId - Session identifier.
   */
  resetSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  /**
   * Remove a session from the cache (e.g., on session deletion).
   * @param sessionId - Session identifier.
   */
  removeSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

/**
 * Singleton instance of the steering state cache.
 * Import this in hooks (read-side) and tools (write-side).
 */
export const steeringState = new SteeringState()
