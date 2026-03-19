import { z } from 'zod'

import { freshnessStatusSchema, timestampSchema } from './shared.js'

export const artifactFreshnessRegistrySchema = z.object({
  version: z.literal('v1'),
  artifacts: z.array(z.object({
    artifactRef: z.string().min(1),
    status: freshnessStatusSchema,
    checkedAt: timestampSchema,
    inputs: z.array(z.string().min(1)),
  }).strict()),
}).strict()

export const deadlockCheckpointSchema = z.object({
  version: z.literal('v1'),
  checkpointId: z.string().min(1),
  sessionId: z.string().min(1),
  workflowId: z.string().min(1),
  signal: z.enum(['timeout', 'dependency-cycle', 'lease-conflict']),
  recordedAt: timestampSchema,
  recoveryHint: z.string().min(1),
}).strict()

export const recoveryReplayEnvelopeSchema = z.object({
  version: z.literal('v1'),
  replayId: z.string().min(1),
  sourceCheckpointId: z.string().min(1),
  sessionIds: z.array(z.string().min(1)),
  workflowIds: z.array(z.string().min(1)),
  status: z.enum(['pending', 'replayed', 'failed']),
  recordedAt: timestampSchema,
}).strict()

export interface CreateArtifactFreshnessRegistryRecordInput {
  artifactRef: string
  status: ArtifactFreshnessRegistryRecord['artifacts'][number]['status']
  checkedAt: string
  inputs?: string[]
}

export function createArtifactFreshnessRegistryRecord(
  input: CreateArtifactFreshnessRegistryRecordInput,
): ArtifactFreshnessRegistryRecord {
  return artifactFreshnessRegistrySchema.parse({
    version: 'v1',
    artifacts: [{
      artifactRef: input.artifactRef,
      status: input.status,
      checkedAt: input.checkedAt,
      inputs: input.inputs ?? [],
    }],
  })
}

export type ArtifactFreshnessRegistryRecord = z.infer<typeof artifactFreshnessRegistrySchema>
export type DeadlockCheckpointRecord = z.infer<typeof deadlockCheckpointSchema>
export type RecoveryReplayEnvelopeRecord = z.infer<typeof recoveryReplayEnvelopeSchema>
