import { DELEGATION_EVIDENCE_STATES } from "./types.js"
import type { DelegationEvidenceRecord, DelegationEvidenceState } from "./types.js"

/**
 * In-memory delegation evidence tracker with per-delegation chronological storage.
 *
 * Records are stored by delegation ID and can be queried for full history or latest state.
 * The tracker is created via {@link createDelegationEvidenceTracker} and is not persisted
 * across sessions — use dual persistence for durable storage.
 *
 * @example
 * ```ts
 * const tracker = createDelegationEvidenceTracker()
 * tracker.track("del_001", "partial", { step: 1 })
 * tracker.track("del_001", "complete", { result: "ok" })
 * const records = tracker.query("del_001") // [partial, complete]
 * ```
 */
export type DelegationEvidenceTracker = {
  /**
   * Records a delegation state transition with associated evidence.
   *
   * @param delegationId - The delegation identifier to track.
   * @param state - The lifecycle state: partial, blocked, or complete.
   * @param evidence - Arbitrary evidence data for this state transition.
   * @returns The created evidence record with deterministic ID.
   * @throws {Error} When the state is not a valid {@link DelegationEvidenceState}.
   */
  track(delegationId: string, state: DelegationEvidenceState, evidence: Record<string, unknown>): DelegationEvidenceRecord

  /**
   * Queries all evidence records for a delegation in chronological order.
   *
   * @param delegationId - The delegation identifier to look up.
   * @returns An array of evidence records, oldest first. Empty when the delegation has no records.
   */
  query(delegationId: string): DelegationEvidenceRecord[]

  /**
   * Returns the most recent evidence record for a delegation.
   *
   * @param delegationId - The delegation identifier to look up.
   * @returns The latest evidence record, or null when the delegation has no records.
   */
  latestState(delegationId: string): DelegationEvidenceRecord | null
}

/**
 * Creates a new in-memory delegation evidence tracker.
 *
 * @returns A tracker instance with {@link track}, {@link query}, and {@link latestState} methods.
 *
 * @example
 * ```ts
 * const tracker = createDelegationEvidenceTracker()
 * tracker.track("del_001", "partial", { toolCallsCompleted: 3 })
 * ```
 */
export function createDelegationEvidenceTracker(): DelegationEvidenceTracker {
  const store = new Map<string, DelegationEvidenceRecord[]>()

  return {
    track(delegationId: string, state: DelegationEvidenceState, evidence: Record<string, unknown>): DelegationEvidenceRecord {
      assertValidState(state)
      const timestamp = Date.now()
      const record: DelegationEvidenceRecord = {
        id: buildRecordId(delegationId, state, timestamp),
        delegationId,
        state,
        evidence,
        timestamp,
      }
      const existing = store.get(delegationId) ?? []
      existing.push(record)
      store.set(delegationId, existing)
      return record
    },

    query(delegationId: string): DelegationEvidenceRecord[] {
      return store.get(delegationId) ?? []
    },

    latestState(delegationId: string): DelegationEvidenceRecord | null {
      const records = store.get(delegationId)
      return records?.at(-1) ?? null
    },
  }
}

/**
 * Builds a deterministic record ID from delegation ID, state, and timestamp.
 *
 * @param delegationId - The delegation identifier.
 * @param state - The lifecycle state.
 * @param timestamp - The record creation timestamp.
 * @returns A string ID in the format `delegationId::state::timestamp`.
 */
function buildRecordId(delegationId: string, state: string, timestamp: number): string {
  return `${delegationId}::${state}::${timestamp}`
}

/**
 * Validates that a state value is one of the allowed delegation evidence states.
 *
 * @param state - The state value to validate.
 * @throws {Error} When the state is not a valid {@link DelegationEvidenceState}.
 */
function assertValidState(state: string): asserts state is DelegationEvidenceState {
  if (!(DELEGATION_EVIDENCE_STATES as readonly string[]).includes(state)) {
    throw new Error(`[Harness] Invalid delegation evidence state: ${state}. Expected one of: ${DELEGATION_EVIDENCE_STATES.join(", ")}`)
  }
}
