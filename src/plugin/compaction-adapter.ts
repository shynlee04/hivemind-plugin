/**
 * Compaction Adapter.
 *
 * Isolated hook adapter for `experimental.session.compacting`.
 * Injects HiveMind context into compaction prompt.
 */

import { createHivemindContextPacket, renderHivemindContext } from './context-renderer.js'
import { type TurnSnapshotLoader } from './runtime-snapshot.js'
import { resolveCompactionAgentWorkPacket } from './input-helpers.js'

export interface CompactionDeps {
  directory: string
  turnSnapshot: TurnSnapshotLoader
}

/**
 * Create the session compaction hook handler.
 *
 * @param deps - Injected dependencies (directory, snapshot loader)
 * @returns Async hook handler for session.compacting
 */
export function createCompactionHandler(deps: CompactionDeps) {
  const { directory, turnSnapshot } = deps

  return async (
    compactionInput: { sessionID: string },
    output: { context: string[] },
  ): Promise<void> => {
    const snapshot = await turnSnapshot.getSnapshot()
    const agentWorkPacket = await resolveCompactionAgentWorkPacket(
      directory,
      compactionInput.sessionID,
    )
    const packet = createHivemindContextPacket({
      sessionId: compactionInput.sessionID,
      snapshot,
      agentWorkPacket,
    })

    // Always use renderHivemindContext for the authoritative format
    // This correctly includes contract_id and all agent-work fields when a contract exists
    const renderedContext = renderHivemindContext(packet)
    output.context.push(renderedContext)
  }
}
