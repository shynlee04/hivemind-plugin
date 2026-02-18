/**
 * State Mutation Queue
 *
 * CQRS-compliant state mutation mechanism for hooks.
 *
 * Problem: Hooks should be read-only (CQRS principle), but some hooks
 * need to update state (e.g., metrics, hierarchy). Direct stateManager.save()
 * calls from hooks violate CQRS.
 *
 * Solution: Hooks push mutations to this queue instead of writing directly.
 * Tools (write operations) flush the queue and apply mutations.
 *
 * Flow:
 * 1. Hook calls queueStateMutation() with partial state update
 * 2. Mutation is queued with timestamp and source
 * 3. Tool calls flushMutations() before/after write operations
 * 4. All pending mutations are merged and saved atomically
 *
 * @module lib/state-mutation-queue
 */

import type { BrainState } from "../schemas/brain-state.js";
import type { StateManager } from "./persistence.js";

/**
 * Types of state mutations that can be queued.
 */
export type MutationType =
  | "UPDATE_STATE"
  | "UPDATE_HIERARCHY"
  | "UPDATE_METRICS"
  | "UPDATE_SESSION"
  | "UPDATE_FRAMEWORK_SELECTION";

/**
 * Represents a single pending state mutation.
 */
export interface StateMutation {
  /** Type of mutation for categorization */
  type: MutationType;
  /** Partial state to merge (deep merge for nested objects) */
  payload: Partial<BrainState>;
  /** ISO timestamp when mutation was queued */
  timestamp: string;
  /** Source identifier - which hook/function created this mutation */
  source: string;
  /** Optional priority for ordering (higher = applied first) */
  priority?: number;
}

/**
 * Global mutation queue (in-process, per-session).
 *
 * This is module-scoped (not exported) to ensure all access goes through
 * the provided API functions.
 */
const mutationQueue: StateMutation[] = [];

/**
 * Maximum queue size before warning.
 * If exceeded, oldest mutations are dropped (FIFO).
 */
const MAX_QUEUE_SIZE = 100;

/**
 * Queue a state mutation for later application.
 *
 * Hooks should call this instead of stateManager.save() directly.
 * Mutations are applied when tools call flushMutations().
 *
 * @param mutation - Mutation to queue (timestamp auto-generated)
 *
 * @example
 * ```typescript
 * // In a hook - queue a metrics update
 * queueStateMutation({
 *   type: "UPDATE_METRICS",
 *   payload: {
 *     metrics: {
 *       turn_count: currentTurn + 1
 *     }
 *   },
 *   source: "session-lifecycle-hook"
 * });
 * ```
 */
export function queueStateMutation(
  mutation: Omit<StateMutation, "timestamp">
): void {
  const fullMutation: StateMutation = {
    ...mutation,
    timestamp: new Date().toISOString(),
  };

  // Prevent unbounded queue growth
  if (mutationQueue.length >= MAX_QUEUE_SIZE) {
    // Capture dropped mutation BEFORE shift for accurate logging
    const dropped = mutationQueue[0];
    mutationQueue.shift();
    console.warn(
      `[state-mutation-queue] Queue overflow, dropped mutation from: ${dropped?.source ?? "unknown"}`
    );
  }

  mutationQueue.push(fullMutation);
}

/**
 * Flush all pending mutations and apply to state.
 *
 * Called by tools (write operations) to apply queued mutations.
 * Mutations are merged deeply into the current state.
 *
 * @param stateManager - State manager instance with load/save methods
 * @returns Number of mutations that were applied
 *
 * @example
 * ```typescript
 * // In a tool - flush mutations before write
 * const applied = await flushMutations(stateManager);
 * console.log(`Applied ${applied} pending mutations`);
 * ```
 */
export async function flushMutations(
  stateManager: StateManager
): Promise<number> {
  if (mutationQueue.length === 0) {
    return 0;
  }

  try {
    // Load current state
    const currentState = await stateManager.load();

    // If no state exists, we can't apply mutations - this is an error condition
    if (!currentState) {
      console.warn(
        "[state-mutation-queue] Cannot flush mutations: no state exists. " +
          "Mutations will remain queued until state is initialized."
      );
      return 0;
    }

    // Sort by priority (lower first), then by timestamp (older first)
    // This ensures higher priority mutations are applied LAST (they win in merge)
    const sortedMutations = [...mutationQueue].sort((a, b) => {
      const priorityDiff = (a.priority ?? 0) - (b.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp.localeCompare(b.timestamp);
    });

    // Apply mutations sequentially (deep merge)
    let mergedState = currentState;
    for (const mutation of sortedMutations) {
      mergedState = deepMerge(mergedState, mutation.payload);
    }

    // Save merged state
    await stateManager.save(mergedState);

    // Clear queue after successful save
    const appliedCount = mutationQueue.length;
    mutationQueue.length = 0;

    return appliedCount;
  } catch (error) {
    console.error("[state-mutation-queue] Flush failed:", error);
    // Leave mutations in queue for retry
    throw error;
  }
}

/**
 * Get the count of pending mutations.
 *
 * Useful for debugging and monitoring queue health.
 *
 * @returns Number of mutations waiting to be applied
 */
export function getPendingMutationCount(): number {
  return mutationQueue.length;
}

/**
 * Get a snapshot of pending mutations (for debugging).
 *
 * Returns copies to prevent external modification.
 *
 * @returns Array of pending mutation snapshots
 */
export function getPendingMutations(): StateMutation[] {
  return [...mutationQueue];
}

/**
 * Clear the mutation queue without applying.
 *
 * Use with caution - primarily for tests and error recovery.
 */
export function clearMutationQueue(): void {
  mutationQueue.length = 0;
}

/**
 * Deep merge helper for state mutations.
 *
 * Merges nested objects recursively, arrays are replaced (not concatenated).
 * Primitive values are overwritten.
 *
 * @param target - Base object to merge into
 * @param source - Partial object with updates
 * @returns New merged object (does not mutate inputs)
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  // Handle non-objects or null
  if (
    target === null ||
    target === undefined ||
    source === null ||
    source === undefined
  ) {
    return source !== undefined ? (source as T) : target;
  }

  if (typeof target !== "object" || typeof source !== "object") {
    return source as T;
  }

  const result = { ...target } as T;

  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === "object" &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      targetValue !== null &&
      typeof targetValue === "object" &&
      !Array.isArray(targetValue)
    ) {
      // Deep merge nested objects
      (result as Record<string, unknown>)[key as string] = deepMerge(
        targetValue,
        sourceValue
      );
    } else {
      // Replace primitives and arrays
      (result as Record<string, unknown>)[key as string] = sourceValue;
    }
  }

  return result;
}

/**
 * Check if there are pending mutations for a specific source.
 *
 * @param source - Source identifier to check
 * @returns True if mutations exist from this source
 */
export function hasPendingMutationsFrom(source: string): boolean {
  return mutationQueue.some((m) => m.source === source);
}

/**
 * Get mutations from a specific source (for debugging).
 *
 * @param source - Source identifier to filter by
 * @returns Array of mutations from the specified source
 */
export function getMutationsBySource(source: string): StateMutation[] {
  return mutationQueue.filter((m) => m.source === source);
}
