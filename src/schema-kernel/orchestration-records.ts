import { z } from 'zod'

import {
  dependencyStatusSchema,
  freshnessStatusSchema,
  sessionScopeSchema,
  timestampSchema,
} from './shared.js'

export const supervisorInstanceRegistrySchema = z.object({
  version: z.literal('v1'),
  instances: z.array(z.object({
    instanceId: z.string().min(1),
    status: z.enum(['healthy', 'degraded', 'blocked']),
    runtimeAuthority: z.enum(['managed-sdk', 'attached-sdk', 'none']),
    runtimeInstanceId: z.string().min(1).optional(),
    serverBaseUrl: z.string().url().optional(),
    startedAt: timestampSchema,
    lastHeartbeatAt: timestampSchema,
    transport: z.literal('same-local-env'),
  }).strict()),
}).strict()

export const sessionRegistrySchema = z.object({
  version: z.literal('v1'),
  sessions: z.array(z.object({
    sessionId: z.string().min(1),
    scope: sessionScopeSchema,
    leaseId: z.string().min(1),
    status: z.enum(['active', 'waiting', 'blocked', 'replaying']),
    workflowIds: z.array(z.string().min(1)),
    writableSurfaces: z.array(z.string().min(1)),
    updatedAt: timestampSchema,
  }).strict()),
}).strict()

export const workflowExecutionGraphSchema = z.object({
  version: z.literal('v1'),
  workflowId: z.string().min(1),
  edges: z.array(z.object({
    from: z.string().min(1),
    to: z.string().min(1),
    kind: z.enum(['blocks', 'unblocks']),
  }).strict()),
}).strict()

export const workflowWaveStateSchema = z.object({
  version: z.literal('v1'),
  workflowId: z.string().min(1),
  waveId: z.string().min(1),
  status: z.enum(['pending', 'active', 'complete', 'blocked']),
  taskIds: z.array(z.string().min(1)),
  parallelizable: z.boolean(),
}).strict()

export const workflowGuardStateSchema = z.object({
  version: z.literal('v1'),
  workflowId: z.string().min(1),
  guardLevel: z.enum(['warn', 'strict']),
  dependencyStatus: dependencyStatusSchema,
  freshnessStatus: freshnessStatusSchema,
  writableSurfaceStatus: z.enum(['exclusive', 'shared-conflict']),
}).strict()

export interface CreateSessionRegistryRecordInput {
  sessionId: string
  scope: SessionRegistryRecord['sessions'][number]['scope']
  leaseId: string
  status: SessionRegistryRecord['sessions'][number]['status']
  workflowIds?: string[]
  writableSurfaces?: string[]
  updatedAt: string
}

export function createSessionRegistryRecord(
  input: CreateSessionRegistryRecordInput,
): SessionRegistryRecord {
  return sessionRegistrySchema.parse({
    version: 'v1',
    sessions: [{
      sessionId: input.sessionId,
      scope: input.scope,
      leaseId: input.leaseId,
      status: input.status,
      workflowIds: input.workflowIds ?? [],
      writableSurfaces: input.writableSurfaces ?? [],
      updatedAt: input.updatedAt,
    }],
  })
}

export type SupervisorInstanceRegistryRecord = z.infer<typeof supervisorInstanceRegistrySchema>
export type SessionRegistryRecord = z.infer<typeof sessionRegistrySchema>
export type WorkflowExecutionGraphRecord = z.infer<typeof workflowExecutionGraphSchema>
export type WorkflowWaveStateRecord = z.infer<typeof workflowWaveStateSchema>
export type WorkflowGuardStateRecord = z.infer<typeof workflowGuardStateSchema>
