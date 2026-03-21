/**
 * Plugin input helpers.
 *
 * Temporary extraction layer - these functions contain business logic that
 * must eventually move to their appropriate feature layers:
 * - createStartWorkInput -> features/session-entry/
 * - resolveCompactionAgentWorkPacket -> features/agent-work-contract/
 *
 * @module plugin/input-helpers
 */

import type { StartWorkInput } from '../features/session-entry/start-work-types.js'
import { ContractStore } from '../features/agent-work-contract/engine/contract-store.js'
import { createCompactionPreservationPacket } from '../features/agent-work-contract/hooks/index.js'
import type { RuntimeBindingsSnapshot } from '../shared/runtime-attachment.js'

/**
 * Create a StartWorkInput from turn snapshot data.
 *
 * @param input - Directory, session ID, user message, optional active agent, and turn snapshot.
 * @returns StartWorkInput for session routing.
 */
export function createStartWorkInput(input: {
  directory: string
  sessionId: string
  userMessage: string
  activeAgent?: string
  snapshot: RuntimeBindingsSnapshot
}): StartWorkInput {
  return {
    userMessage: input.userMessage,
    sessionId: input.sessionId,
    sessionScope: 'main',
    projectRoot: input.directory,
    workflowId: input.snapshot.workflowId,
    taskIds: input.snapshot.taskIds,
    hasRuntimeAttachment: input.snapshot.hasRuntimeAttachment,
    profileComplete: input.snapshot.profileComplete,
    activeLineage: input.snapshot.defaultLineage,
    activeAgent: input.activeAgent,
    hasHivemind: input.snapshot.hasHivemind,
    hivemindHealthy: input.snapshot.hivemindHealthy,
    hasWorkflow: input.snapshot.hasWorkflow,
    hasHandoff: false,
  }
}

/**
 * Resolve the latest agent-work contract for compaction preservation.
 *
 * @param directory - Project root for contract store.
 * @param sessionId - Session ID to look up contracts for.
 * @returns Compaction preservation packet or undefined if no contracts exist.
 */
export async function resolveCompactionAgentWorkPacket(
  directory: string,
  sessionId: string,
): Promise<ReturnType<typeof createCompactionPreservationPacket> | undefined> {
  const contracts = await new ContractStore(directory).list(sessionId)
  const latestContract = contracts
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]

  return latestContract
    ? createCompactionPreservationPacket(latestContract)
    : undefined
}
