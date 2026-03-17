import { z } from 'zod'

export const runtimeAuthoritySchema = z.enum(['managed-sdk', 'attached-sdk', 'none'])

export const runtimeStatusEntryStateSchema = z.object({
  state: z.string(),
  interactiveBootstrapRequired: z.boolean(),
  recommendedNext: z.string(),
})

export const runtimeStatusQaStateSchema = z.object({
  state: z.string(),
  releaseState: z.string(),
})

export const runtimeStatusLineageSessionStateSchema = z.object({
  lineage: z.string(),
  purposeClass: z.string(),
  trajectoryId: z.string().optional(),
  workflowId: z.string().optional(),
  taskIds: z.array(z.string()),
  subtaskIds: z.array(z.string()),
  checkpointId: z.string().optional(),
})

export const runtimeStatusSchema = z.object({
  runtimeAuthority: runtimeAuthoritySchema,
  runtimeInstanceId: z.string().optional(),
  serverBaseUrl: z.string().optional(),
  entryState: runtimeStatusEntryStateSchema,
  qaState: runtimeStatusQaStateSchema,
  lineageSessionState: runtimeStatusLineageSessionStateSchema,
})

export type RuntimeStatusEntryState = z.infer<typeof runtimeStatusEntryStateSchema>
export type RuntimeStatusQaState = z.infer<typeof runtimeStatusQaStateSchema>
export type RuntimeStatusLineageSessionState = z.infer<typeof runtimeStatusLineageSessionStateSchema>
export type RuntimeStatus = z.infer<typeof runtimeStatusSchema>
