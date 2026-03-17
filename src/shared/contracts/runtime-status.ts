import { z } from 'zod'

export const runtimeAuthoritySchema = z.enum(['managed-sdk', 'attached-sdk', 'none'])

export const runtimeStatusSchema = z.object({
  runtimeAuthority: runtimeAuthoritySchema,
  runtimeInstanceId: z.string().optional(),
  serverBaseUrl: z.string().optional(),
  entryState: z.string(),
  interactiveBootstrapRequired: z.boolean(),
  recommendedNext: z.string(),
  qaState: z.string(),
  releaseState: z.string(),
  supervisorStatus: z.enum(['healthy', 'degraded', 'blocked']),
  trajectoryId: z.string().optional(),
  workflowId: z.string().optional(),
  taskIds: z.array(z.string()),
  subtaskIds: z.array(z.string()),
  checkpointId: z.string().optional(),
})

export type RuntimeStatus = z.infer<typeof runtimeStatusSchema>
