import type {
  CompactionCheckpointData,
  DelegationExecutionMetadata,
  DelegationPacket,
  PermissionRule,
  SessionContinuityRecord,
  SessionLifecycleCleanup,
  SessionLifecycleObservation,
  SessionLifecycleQueueState,
  SessionLifecycleState,
} from "./types.js"

function clonePermissionRules(rules: PermissionRule[]): PermissionRule[] {
  return rules.map((rule) => ({ ...rule }))
}

function cloneStringList(values: readonly string[]): string[] {
  return [...values]
}

function cloneLifecycleQueueState(
  queue: SessionLifecycleQueueState | undefined,
): SessionLifecycleQueueState | undefined {
  return queue ? { ...queue } : undefined
}

function cloneLifecycleObservation(
  observation: SessionLifecycleObservation | undefined,
): SessionLifecycleObservation | undefined {
  return observation ? { ...observation } : undefined
}

function cloneLifecycleCleanup(
  cleanup: SessionLifecycleCleanup | undefined,
): SessionLifecycleCleanup | undefined {
  return cleanup ? { ...cleanup } : undefined
}

function cloneExecutionMetadata(
  execution: DelegationExecutionMetadata | undefined,
): DelegationExecutionMetadata | undefined {
  return execution
    ? {
        ...execution,
        characteristics: { ...execution.characteristics },
        capabilityEvidence: { ...execution.capabilityEvidence },
      }
    : undefined
}

export function cloneLifecycleState(
  lifecycle: SessionLifecycleState | undefined,
): SessionLifecycleState | undefined {
  return lifecycle
    ? {
        ...lifecycle,
        queue: cloneLifecycleQueueState(lifecycle.queue),
        observation: cloneLifecycleObservation(lifecycle.observation),
        cleanup: cloneLifecycleCleanup(lifecycle.cleanup),
      }
    : undefined
}

export function cloneDelegationPacket(
  packet: DelegationPacket | undefined,
): DelegationPacket | undefined {
  return packet
    ? {
        ...packet,
        artifacts: cloneStringList(packet.artifacts),
        commits: cloneStringList(packet.commits),
        parentChain: cloneStringList(packet.parentChain),
      }
    : undefined
}

export function cloneCompactionCheckpoint(
  checkpoint: CompactionCheckpointData | undefined,
): CompactionCheckpointData | undefined {
  return checkpoint
    ? {
        agent: checkpoint.agent,
        model: checkpoint.model,
        tools: cloneStringList(checkpoint.tools),
        delegationMeta: checkpoint.delegationMeta ? { ...checkpoint.delegationMeta } : null,
        warnings: cloneStringList(checkpoint.warnings),
        sessionStats: {
          total: checkpoint.sessionStats.total,
          byTool: { ...checkpoint.sessionStats.byTool },
          loop: { ...checkpoint.sessionStats.loop },
        },
        capturedAt: checkpoint.capturedAt,
      }
    : undefined
}

export function cloneContinuityRecord(record: SessionContinuityRecord): SessionContinuityRecord {
  return {
    sessionID: record.sessionID,
    toolProfile: {
      permissionRules: clonePermissionRules(record.toolProfile.permissionRules),
      compatibleTools: cloneStringList(record.toolProfile.compatibleTools),
    },
    promptParams: {
      agent: record.promptParams.agent,
      category: record.promptParams.category,
      model: record.promptParams.model,
      temperature: record.promptParams.temperature,
      guidanceText: record.promptParams.guidanceText,
      tools: cloneStringList(record.promptParams.tools),
    },
    metadata: {
      ...record.metadata,
      delegation: { ...record.metadata.delegation },
      compactionCheckpoint: cloneCompactionCheckpoint(record.metadata.compactionCheckpoint),
      delegationPacket: cloneDelegationPacket(record.metadata.delegationPacket),
      execution: cloneExecutionMetadata(record.metadata.execution),
      route: record.metadata.route
        ? {
            ...record.metadata.route,
            warnings: cloneStringList(record.metadata.route.warnings ?? []),
          }
        : undefined,
      constraints: cloneStringList(record.metadata.constraints),
      lifecycle: cloneLifecycleState(record.metadata.lifecycle),
    },
  }
}
