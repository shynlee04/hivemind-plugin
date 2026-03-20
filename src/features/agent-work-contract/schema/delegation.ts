/**
 * Delegation Schema Definitions
 *
 * Schemas for delegation records and handoff packets.
 * Used to track task delegation between sessions and manage context transfer.
 *
 * @module agent-work-contract/schema/delegation
 */

import { z } from 'zod'

import { DelegationModeSchema } from './contract.js'

/**
 * Delegation status values.
 * Tracks the lifecycle state of a delegation.
 */
export const DelegationStatusSchema = z.enum([
  'pending',
  'active',
  'completed',
  'failed',
  'timed-out',
])

/**
 * Delegation record schema for tracking task delegation.
 * Records the parent-child session relationship and task assignments.
 */
export const DelegationRecordSchema = z.object({
  delegationId: z.string().min(1).describe('Unique identifier for this delegation'),
  contractId: z.string().min(1).describe('Reference to the parent contract'),
  parentSessionId: z.string().min(1).describe('ID of the delegating parent session'),
  childSessionId: z.string().min(1).describe('ID of the delegated child session'),
  mode: DelegationModeSchema.describe('Delegation mode (parallel, sequential, handoff)'),
  delegatedTaskIds: z.array(z.string().min(1)).describe('IDs of tasks delegated to child session'),
  createdAt: z.string().min(1).describe('ISO timestamp when delegation was created'),
  completedAt: z.string().min(1).optional().describe('ISO timestamp when delegation completed'),
  status: DelegationStatusSchema.describe('Current status of the delegation'),
  evidenceRefs: z.array(z.string().min(1)).optional().describe('References to evidence artifacts'),
})

/**
 * Handoff context schema for session state transfer.
 * Contains summary information needed to resume work.
 */
export const HandoffContextSchema = z.object({
  summary: z.string().min(1).describe('Brief summary of current work state'),
  workflowState: z.string().min(1).describe('Current workflow state description'),
  followUp: z.array(z.string().min(1)).describe('Follow-up actions to take'),
})

/**
 * Handoff packet schema for cross-session context transfer.
 * Full context package for handing off work between sessions.
 */
export const HandoffPacketSchema = z.object({
  delegationId: z.string().min(1).describe('Reference to the delegation record'),
  sourceSessionId: z.string().min(1).describe('ID of the source session'),
  targetSessionId: z.string().min(1).describe('ID of the target session'),
  contractRef: z.string().min(1).describe('Reference to the contract ID'),
  taskRefs: z.array(z.string().min(1)).describe('References to task IDs being handed off'),
  context: HandoffContextSchema.describe('Context for the handoff'),
  exportedAt: z.string().min(1).describe('ISO timestamp when packet was exported'),
})

// Type exports using Zod inference
export type DelegationStatus = z.infer<typeof DelegationStatusSchema>
export type DelegationRecord = z.infer<typeof DelegationRecordSchema>
export type HandoffContext = z.infer<typeof HandoffContextSchema>
export type HandoffPacket = z.infer<typeof HandoffPacketSchema>