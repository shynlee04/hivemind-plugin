/**
 * Deep-clone helpers for continuity records.
 *
 * Extracted from `continuity/index.ts` to satisfy the ≤500 LOC gate (GA-4).
 * The clone functions preserve defensive-copy semantics for the
 * session continuity store (Q6: deep-clone-on-read, deep-clone-on-write).
 *
 * @module task-management/continuity/continuity-clone
 */

import type {
  CapturedResult,
  CompactionCheckpointData,
  DelegationMeta,
  DelegationPacket,
  PendingNotification,
  SessionContinuityRecord,
  SessionLifecycleState,
} from "../../shared/types.js"

/**
 * Clone a DelegationMeta envelope (or null).
 *
 * @param meta - Source meta or null.
 * @returns Deep-cloned copy or null.
 */
export function cloneDelegationMeta(meta: DelegationMeta | null): DelegationMeta | null {
  if (!meta) return null
  return { ...meta }
}

/**
 * Clone a CompactionCheckpointData value, deep-copying nested tools/warnings.
 *
 * @param cp - Source checkpoint or undefined.
 * @returns Deep-cloned copy or undefined.
 */
export function cloneCompactionCheckpoint(cp: CompactionCheckpointData | undefined): CompactionCheckpointData | undefined {
  if (!cp) return undefined
  return {
    ...cp,
    tools: [...cp.tools],
    warnings: [...cp.warnings],
    delegationMeta: cp.delegationMeta ? { ...cp.delegationMeta } : null,
    sessionStats: { ...cp.sessionStats, byTool: { ...cp.sessionStats.byTool } },
  }
}

/**
 * Clone a DelegationPacket envelope with deep-copied arrays.
 *
 * @param packet - Source packet or undefined.
 * @returns Deep-cloned copy or undefined.
 */
export function cloneDelegationPacket(packet: DelegationPacket | undefined): DelegationPacket | undefined {
  if (!packet) return undefined
  return {
    ...packet,
    artifacts: [...packet.artifacts],
    commits: [...packet.commits],
    parentChain: [...packet.parentChain],
  }
}

/**
 * Clone a SessionLifecycleState envelope.
 *
 * @param state - Source lifecycle state or undefined.
 * @returns Deep-cloned copy or undefined.
 */
export function cloneLifecycleState(state: SessionLifecycleState | undefined): SessionLifecycleState | undefined {
  if (!state) return undefined
  return { ...state }
}

/**
 * Clone the pendingNotifications array, deep-copying nested metadata/artifacts/commits.
 *
 * @param notifications - Source array or undefined.
 * @returns Deep-cloned array (empty if input is not an array).
 */
export function clonePendingNotifications(notifications: PendingNotification[] | undefined): PendingNotification[] {
  if (!Array.isArray(notifications)) return []
  return notifications.map((notification) => ({
    ...notification,
    metadata: notification.metadata ? { ...notification.metadata } : undefined,
    artifacts: notification.artifacts ? [...notification.artifacts] : undefined,
    commits: notification.commits ? [...notification.commits] : undefined,
  }))
}

/**
 * Clone a CapturedResult envelope with deep-copied arrays.
 *
 * @param result - Source result or undefined.
 * @returns Deep-cloned copy or undefined.
 */
export function cloneCapturedResult(result: CapturedResult | undefined): CapturedResult | undefined {
  if (!result) return undefined
  return {
    ...result,
    artifactPaths: [...result.artifactPaths],
    gitCommits: [...result.gitCommits],
    toolCallSummary: [...result.toolCallSummary],
  }
}

/**
 * Clone a SessionContinuityRecord, deep-copying every nested metadata field.
 *
 * This is the canonical defensive-copy entry point used by the public API
 * surface in `continuity/index.ts` for all reads and writes.
 *
 * @param record - Source record.
 * @returns Deep-cloned copy.
 */
export function cloneContinuityRecord(record: SessionContinuityRecord): SessionContinuityRecord {
  return {
    ...record,
    metadata: {
      ...record.metadata,
      delegation: cloneDelegationMeta(record.metadata.delegation),
      constraints: [...record.metadata.constraints],
      pendingNotifications: clonePendingNotifications(record.metadata.pendingNotifications),
      resultCapture: cloneCapturedResult(record.metadata.resultCapture),
      compactionCheckpoint: cloneCompactionCheckpoint(record.metadata.compactionCheckpoint),
      delegationPacket: cloneDelegationPacket(record.metadata.delegationPacket),
      lifecycle: cloneLifecycleState(record.metadata.lifecycle),
    },
  }
}
