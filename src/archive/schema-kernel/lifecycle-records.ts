import { z } from 'zod'

import {
  agentModeSchema,
  dependencyStatusSchema,
  entryKernelQaStateSchema,
  entryKernelReleaseStateSchema,
  entryKernelStateKindSchema,
  freshnessStatusSchema,
  kernelLineageSchema,
  sessionScopeSchema,
  timestampSchema,
  verificationVerdictSchema,
} from './shared.js'

export const entryKernelStateSchema = z.object({
  version: z.literal('v1'),
  state: entryKernelStateKindSchema,
  qaState: entryKernelQaStateSchema,
  releaseState: entryKernelReleaseStateSchema,
  lifecycle: z.object({
    layer: z.literal('entry-kernel'),
    phase: z.literal('session-entry'),
    state: entryKernelStateKindSchema,
  }).strict(),
  reason: z.string().min(1),
  profileValidated: z.boolean(),
  lastRecoveryAction: z.enum(['hm-init', 'hm-doctor']).optional(),
  lastUpdatedAt: timestampSchema,
}).strict()

export const runtimeInvocationSchema = z.object({
  version: z.literal('v1'),
  invocationId: z.string().min(1),
  lifecycle: z.object({
    layer: z.literal('runtime-invocation'),
    phase: z.literal('request'),
    entryState: entryKernelStateKindSchema,
    qaState: entryKernelQaStateSchema,
    releaseState: entryKernelReleaseStateSchema,
  }).strict(),
  invokerClass: z.enum(['user', 'main-agent', 'sub-agent']),
  sessionId: z.string().min(1),
  parentSessionId: z.string().min(1).optional(),
  sessionScope: sessionScopeSchema,
  agentId: z.string().min(1).optional(),
  agentMode: agentModeSchema.optional(),
  lineage: kernelLineageSchema.optional(),
  trajectoryId: z.string().min(1).optional(),
  workflowId: z.string().min(1).optional(),
  taskIds: z.array(z.string().min(1)),
  subtaskIds: z.array(z.string().min(1)),
  entryState: entryKernelStateKindSchema,
  qaState: entryKernelQaStateSchema,
  releaseState: entryKernelReleaseStateSchema,
  gateState: z.string().min(1),
  sotRefs: z.array(z.string().min(1)),
  artifactRefs: z.array(z.string().min(1)),
  delegationId: z.string().min(1).optional(),
  requestReason: z.string().min(1),
}).strict()

export const turnOutputEnvelopeSchema = z.object({
  version: z.literal('v1'),
  turnId: z.string().min(1),
  invocationId: z.string().min(1),
  lifecycle: z.object({
    layer: z.literal('turn-output'),
    phase: z.literal('completed'),
    entryState: entryKernelStateKindSchema,
    qaState: entryKernelQaStateSchema,
    releaseState: entryKernelReleaseStateSchema,
    invocationPhase: z.literal('request'),
  }).strict(),
  sessionId: z.string().min(1),
  parentSessionId: z.string().min(1).optional(),
  sessionScope: sessionScopeSchema,
  agentId: z.string().min(1).optional(),
  agentMode: agentModeSchema.optional(),
  lineage: kernelLineageSchema.optional(),
  delegationId: z.string().min(1).optional(),
  trajectoryId: z.string().min(1).optional(),
  workflowId: z.string().min(1).optional(),
  taskIds: z.array(z.string().min(1)),
  subtaskIds: z.array(z.string().min(1)),
  status: z.string().min(1),
  qaState: entryKernelQaStateSchema,
  pivot: z.string().min(1).optional(),
  rationale: z.array(z.string()),
  workflowEffects: z.array(z.string()),
  dependencyEffects: z.array(z.string()),
  sotEffects: z.array(z.string()),
  artifactRefs: z.array(z.string()),
  toolEvidence: z.array(z.string()),
  handoffSummary: z.string().min(1).optional(),
  followups: z.array(z.string()),
  resumeHints: z.array(z.string()),
}).strict()

export const delegationReceiptSchema = z.object({
  version: z.literal('v1'),
  receiptId: z.string().min(1),
  delegationId: z.string().min(1),
  parentSessionId: z.string().min(1),
  childSessionId: z.string().min(1),
  verificationVerdict: verificationVerdictSchema,
  dependencyStatus: dependencyStatusSchema,
  freshnessStatus: freshnessStatusSchema,
  recordedAt: timestampSchema,
}).strict()

export interface CreateEntryKernelStateRecordInput {
  state: EntryKernelStateRecord['state']
  qaState: EntryKernelStateRecord['qaState']
  releaseState: EntryKernelStateRecord['releaseState']
  reason: string
  profileValidated: boolean
  lastUpdatedAt: string
  lastRecoveryAction?: EntryKernelStateRecord['lastRecoveryAction']
}

export interface CreateRuntimeInvocationRecordInput {
  invocationId: string
  sessionId: string
  sessionScope: RuntimeInvocationRecord['sessionScope']
  entryState: RuntimeInvocationRecord['entryState']
  qaState: RuntimeInvocationRecord['qaState']
  releaseState: RuntimeInvocationRecord['releaseState']
  gateState: string
  requestReason: string
  invokerClass?: RuntimeInvocationRecord['invokerClass']
  agentId?: string
  agentMode?: RuntimeInvocationRecord['agentMode']
  lineage?: RuntimeInvocationRecord['lineage']
  trajectoryId?: string
  workflowId?: string
  taskIds?: string[]
  subtaskIds?: string[]
  sotRefs?: string[]
  artifactRefs?: string[]
  delegationId?: string
  parentSessionId?: string
}

export function createEntryKernelStateRecord(
  input: CreateEntryKernelStateRecordInput,
): EntryKernelStateRecord {
  return entryKernelStateSchema.parse({
    version: 'v1',
    state: input.state,
    qaState: input.qaState,
    releaseState: input.releaseState,
    lifecycle: {
      layer: 'entry-kernel',
      phase: 'session-entry',
      state: input.state,
    },
    reason: input.reason,
    profileValidated: input.profileValidated,
    lastRecoveryAction: input.lastRecoveryAction,
    lastUpdatedAt: input.lastUpdatedAt,
  })
}

export function createRuntimeInvocationRecord(
  input: CreateRuntimeInvocationRecordInput,
): RuntimeInvocationRecord {
  return runtimeInvocationSchema.parse({
    version: 'v1',
    invocationId: input.invocationId,
    lifecycle: {
      layer: 'runtime-invocation',
      phase: 'request',
      entryState: input.entryState,
      qaState: input.qaState,
      releaseState: input.releaseState,
    },
    invokerClass: input.invokerClass ?? 'main-agent',
    sessionId: input.sessionId,
    parentSessionId: input.parentSessionId,
    sessionScope: input.sessionScope,
    agentId: input.agentId,
    agentMode: input.agentMode,
    lineage: input.lineage,
    trajectoryId: input.trajectoryId,
    workflowId: input.workflowId,
    taskIds: input.taskIds ?? [],
    subtaskIds: input.subtaskIds ?? [],
    entryState: input.entryState,
    qaState: input.qaState,
    releaseState: input.releaseState,
    gateState: input.gateState,
    sotRefs: input.sotRefs ?? [],
    artifactRefs: input.artifactRefs ?? [],
    delegationId: input.delegationId,
    requestReason: input.requestReason,
  })
}

export type EntryKernelStateRecord = z.infer<typeof entryKernelStateSchema>
export type RuntimeInvocationRecord = z.infer<typeof runtimeInvocationSchema>
export type TurnOutputEnvelopeRecord = z.infer<typeof turnOutputEnvelopeSchema>
export type DelegationReceiptRecord = z.infer<typeof delegationReceiptSchema>
