export type DelegationReturnedStatus = 'partial' | 'blocked' | 'complete'

export interface DelegationReturnedEvidenceInput {
  statusDetail?: DelegationReturnedStatus
  evidenceSnapshot?: string
  blockedReason?: string
  completionMetadata?: string
}

export interface DelegationReturnedPayloadInput {
  packetId: string | null
  delegatedTo: string
  subagentType: string
  description: string
  evidence?: DelegationReturnedEvidenceInput
}

export interface DelegationReturnedPayload {
  packetId: string
  delegatedTo: string
  subagentType: string
  description: string
  statusDetail: DelegationReturnedStatus | 'N/A'
  evidenceSnapshot: string
  blockedReason: string
  completionMetadata: string
}

export interface NormalizedDelegationCoreFields {
  packetId: string
  delegatedTo: string
  subagentType: string
  description: string
}

function withFallback(value: string | undefined): string {
  return value?.trim() ? value : 'N/A'
}

export function normalizeDelegationCoreFields(
  input: Pick<DelegationReturnedPayloadInput, 'packetId' | 'delegatedTo' | 'subagentType' | 'description'>,
): NormalizedDelegationCoreFields {
  return {
    packetId: withFallback(input.packetId ?? undefined),
    delegatedTo: withFallback(input.delegatedTo),
    subagentType: withFallback(input.subagentType),
    description: withFallback(input.description),
  }
}

/**
 * Builds a canonical delegation_returned payload with N/A fallbacks.
 */
export function buildDelegationReturnedEvidencePayload(
  input: DelegationReturnedPayloadInput,
): DelegationReturnedPayload {
  const normalized = normalizeDelegationCoreFields(input)

  return {
    packetId: normalized.packetId,
    delegatedTo: normalized.delegatedTo,
    subagentType: normalized.subagentType,
    description: normalized.description,
    statusDetail: input.evidence?.statusDetail ?? 'N/A',
    evidenceSnapshot: withFallback(input.evidence?.evidenceSnapshot),
    blockedReason: withFallback(input.evidence?.blockedReason),
    completionMetadata: withFallback(input.evidence?.completionMetadata),
  }
}
