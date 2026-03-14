import { z } from "zod"

export const DelegationEvidenceItemSchema = z.object({
  kind: z.enum(["command_output", "file_diff", "test_report", "trace", "citation"]),
  description: z.string().min(1),
  required: z.boolean().default(true),
})

export const DelegationScopeSchema = z.object({
  include_paths: z.array(z.string().min(1)).min(1),
  exclude_paths: z.array(z.string().min(1)).default([]),
  max_files: z.number().int().positive().optional(),
})

export const DelegationFailurePolicySchema = z.object({
  on_partial: z.enum(["retry", "escalate", "accept_with_caveat"]),
  on_failure: z.enum(["retry", "escalate", "abort"]),
  max_retries: z.number().int().nonnegative().default(0),
}).superRefine((value, ctx) => {
  if ((value.on_partial === "retry" || value.on_failure === "retry") && value.max_retries === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "max_retries must be > 0 when retry is used in failure policy",
    })
  }
})

export const DelegationPacketSchema = z.object({
  intent_id: z.string().uuid(),
  source_command: z.string().min(1),
  target_agent: z.string().min(1),
  target_workflow: z.string().min(1),
  skills_to_load: z.array(z.string().min(1)).default([]),
  scope: DelegationScopeSchema,
  constraints: z.array(z.string().min(1)).default([]),
  success_metrics: z.array(z.string().min(1)).min(1),
  acceptance_criteria: z.array(z.string().min(1)).min(1),
  required_evidence: z.array(DelegationEvidenceItemSchema).min(1),
  failure_policy: DelegationFailurePolicySchema,
})

export type DelegationEvidenceItem = z.infer<typeof DelegationEvidenceItemSchema>
export type DelegationScope = z.infer<typeof DelegationScopeSchema>
export type DelegationFailurePolicy = z.infer<typeof DelegationFailurePolicySchema>
export type DelegationPacket = z.infer<typeof DelegationPacketSchema>
