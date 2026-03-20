/**
 * Anchor Recorder
 *
 * Records anchor points to track workflow transitions and user interventions.
 * Appends anchor points to contract's anchors array with persistence.
 *
 * @module agent-work-contract/engine/anchor-recorder
 */

import type { AnchorPoint } from '../schema/index.js'
import type { ContractStore } from './contract-store.js'

/**
 * Records an anchor point in a contract.
 *
 * Anchor points track significant transitions in the workflow:
 * - workflow-shift: Major workflow changes
 * - planning-shift: Planning phase transitions
 * - stage-shift: Stage transitions within a workflow
 * - user-redirect: User-initiated redirects
 *
 * @param store - The contract store instance for persistence
 * @param contractId - The contract ID to record the anchor for
 * @param anchor - The anchor point to record
 * @throws Error if contract not found
 *
 * @example
 * ```typescript
 * const store = new ContractStore('/project/root')
 * await recordAnchor(store, 'contract-123', {
 *   timestamp: new Date().toISOString(),
 *   kind: 'workflow-shift',
 *   description: 'Workflow transitioned to planning phase',
 * })
 * ```
 */
export async function recordAnchor(
  store: ContractStore,
  contractId: string,
  anchor: AnchorPoint
): Promise<void> {
  // Get existing contract
  const contract = await store.get(contractId)
  
  if (!contract) {
    throw new Error(`Contract ${contractId} not found`)
  }

  // Ensure anchors array exists
  const existingAnchors = contract.anchors ?? []

  // Append new anchor
  const updatedAnchors = [...existingAnchors, anchor]

  // Update contract with new anchors and updated timestamp
  await store.update(contractId, {
    anchors: updatedAnchors,
    updatedAt: new Date().toISOString(),
  })
}