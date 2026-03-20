/**
 * Agent-Work Contract Schema Definitions
 *
 * Core contract schemas for the Agent-Work Contract feature.
 * These schemas define the machine-validated contract structures that
 * downstream engine and tools consume.
 *
 * @module agent-work-contract/schema/contract
 */

import { z } from 'zod'

/**
 * Purpose classification for user intents.
 * Determines the workflow complexity and governance requirements.
 */
export const PurposeClassSchema = z.enum([
  'quick-action',
  'research-brainstorm',
  'project-driven',
])

/**
 * Delegation mode for task distribution.
 * Controls how tasks are delegated to sub-sessions.
 */
export const DelegationModeSchema = z.enum([
  'parallel',
  'sequential',
  'handoff',
])

/**
 * Response mode for handling user requests.
 * Determines the interaction pattern and depth of processing.
 */
export const ResponseModeSchema = z.enum([
  'broad-search-execute',
  'interactive-qa',
  'deep-research',
])

/**
 * Task status values within a workflow.
 * Tracks the lifecycle state of individual tasks.
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'active',
  'delegated',
  'verifying',
  'complete',
])

/**
 * Chain action triggers for workflow automation.
 * Defines what happens when key workflow events occur.
 */
export const ChainActionTriggerSchema = z.enum([
  'onTaskComplete',
  'onWorkflowEnd',
  'onDelegation',
  'onCompaction80',
])

/**
 * Individual task schema within a workflow.
 * Represents a discrete unit of work with dependencies.
 */
export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  status: TaskStatusSchema,
  parentTaskId: z.string().min(1).optional(),
  dependencyIds: z.array(z.string().min(1)).optional(),
  delegationMode: DelegationModeSchema.optional(),
  delegationSessionId: z.string().min(1).optional(),
  evidenceRefs: z.array(z.string().min(1)).optional(),
})

/**
 * User intent schema capturing raw input and classification.
 * Used to determine response mode and governance needs.
 */
export const UserIntentSchema = z.object({
  raw: z.string().min(1),
  confidence: z.number().min(0).max(1),
  purposeClass: PurposeClassSchema,
  requiresPlan: z.boolean(),
  requiresGovernance: z.boolean(),
})

/**
 * Workflow frame schema for task orchestration.
 * Tracks the current workflow state and task graph.
 */
export const WorkflowFrameSchema = z.object({
  planningPath: z.string().min(1).optional(),
  phase: z.string().min(1).optional(),
  outlineRef: z.string().min(1).optional(),
  tasks: z.array(TaskSchema),
})

/**
 * Chain actions schema defining automation hooks.
 * Determines behavior for workflow events.
 */
export const ChainActionsSchema = z.object({
  onTaskComplete: z.enum(['export-workflow', 'next-task', 'close']),
  onWorkflowEnd: z.enum(['export-contract', 'archive']),
  onDelegation: z.enum(['export-messages', 'handoff-packet']),
  onCompaction80: z.enum(['launch-context-agent', 'export-summary']),
})

/**
 * Briefing schema for session handoff context.
 * Provides summary state for resuming sessions.
 */
export const BriefingSchema = z.object({
  summary: z.string().min(1),
  workflowState: z.string().min(1),
  followUp: z.array(z.string().min(1)),
})

/**
 * Anchor point schema for tracking significant context shifts.
 * Records workflow transitions and user interventions.
 */
export const AnchorPointSchema = z.object({
  timestamp: z.string().min(1),
  kind: z.enum(['workflow-shift', 'planning-shift', 'stage-shift', 'user-redirect']),
  description: z.string().min(1),
  snapshotRef: z.string().min(1).optional(),
})

/**
 * Full Agent-Work Contract schema.
 *
 * This is the complete contract structure that governs agent-work
 * interactions, including intent classification, workflow framing,
 * chain actions, briefing state, and anchor points.
 *
 * @example
 * ```typescript
 * const contract = AgentWorkContractSchema.parse({
 *   contractId: 'c123',
 *   sessionId: 's456',
 *   createdAt: new Date().toISOString(),
 *   updatedAt: new Date().toISOString(),
 *   userIntent: {
 *     raw: 'Implement feature X',
 *     confidence: 0.95,
 *     purposeClass: 'project-driven',
 *     requiresPlan: true,
 *     requiresGovernance: true,
 *   },
 *   responseMode: 'broad-search-execute',
 *   workflow: { tasks: [] },
 *   chainActions: {
 *     onTaskComplete: 'next-task',
 *     onWorkflowEnd: 'archive',
 *     onDelegation: 'handoff-packet',
 *     onCompaction80: 'launch-context-agent',
 *   },
 * })
 * ```
 */
export const AgentWorkContractSchema = z.object({
  // Identity
  contractId: z.string().min(1),
  sessionId: z.string().min(1),
  delegationExportSessionId: z.string().min(1).optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),

  // User Intent
  userIntent: UserIntentSchema,

  // Response Mode
  responseMode: ResponseModeSchema,

  // Workflow Frame
  workflow: WorkflowFrameSchema,

  // Chain Actions
  chainActions: ChainActionsSchema,

  // Briefing
  briefing: BriefingSchema.optional(),

  // Anchor Points
  anchors: z.array(AnchorPointSchema).optional(),
})

/**
 * Schema for the compaction-safe preservation packet derived from a full
 * agent-work contract.
 */
export const CompactionPreservationPacketSchema = z.object({
  contractId: z.string().min(1),
  sessionId: z.string().min(1),
  delegationExportSessionId: z.string().min(1).optional(),
  purposeClass: PurposeClassSchema,
  responseMode: ResponseModeSchema,
  workflowPhase: z.string().min(1),
  activeTaskIds: z.array(z.string().min(1)),
  pendingTaskIds: z.array(z.string().min(1)),
  briefingSummary: z.string().min(1),
  followUp: z.array(z.string().min(1)),
  recentAnchorDescriptions: z.array(z.string().min(1)),
  compactionAction: ChainActionsSchema.shape.onCompaction80,
})

// Type exports using Zod inference
export type PurposeClass = z.infer<typeof PurposeClassSchema>
export type DelegationMode = z.infer<typeof DelegationModeSchema>
export type ResponseMode = z.infer<typeof ResponseModeSchema>
export type TaskStatus = z.infer<typeof TaskStatusSchema>
export type ChainActionTrigger = z.infer<typeof ChainActionTriggerSchema>
export type Task = z.infer<typeof TaskSchema>
export type UserIntent = z.infer<typeof UserIntentSchema>
export type WorkflowFrame = z.infer<typeof WorkflowFrameSchema>
export type ChainActions = z.infer<typeof ChainActionsSchema>
export type Briefing = z.infer<typeof BriefingSchema>
export type AnchorPoint = z.infer<typeof AnchorPointSchema>
export type AgentWorkContract = z.infer<typeof AgentWorkContractSchema>
export type CompactionPreservationPacket = z.infer<typeof CompactionPreservationPacketSchema>
