import { z } from "zod"
import { ProgressiveDisclosureLevelSchema, SkillBundleSchema } from "./skill-registry.js"

export const ExecutionKnotFailurePolicySchema = z.object({
  on_token_budget_breach: z.enum(["downgrade", "escalate", "abort"]),
  on_gate_failure: z.enum(["retry", "escalate", "abort"]),
  max_retries: z.number().int().nonnegative().default(0),
})

export const ExecutionKnotSchema = z.object({
  knot_id: z.string().min(1),
  objective: z.string().min(1),
  in_scope_paths: z.array(z.string().min(1)).min(1),
  out_of_scope_paths: z.array(z.string().min(1)).default([]),
  required_skill_bundles: z.array(SkillBundleSchema).min(1),
  disclosure_level: ProgressiveDisclosureLevelSchema,
  token_budget: z.number().int().positive(),
  gate_commands: z.array(z.string().min(1)).default([]),
  required_evidence: z.array(z.string().min(1)).min(1),
  acceptance_criteria: z.array(z.string().min(1)).min(1),
  failure_policy: ExecutionKnotFailurePolicySchema,
  max_parallel: z.number().int().min(1).max(3).default(1),
}).superRefine((value, ctx) => {
  if (value.max_parallel > 1 && value.failure_policy.on_gate_failure === "abort") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "parallel knots should use retry/escalate gate failure policy for safe coordination",
    })
  }
})

export type ExecutionKnotFailurePolicy = z.infer<typeof ExecutionKnotFailurePolicySchema>
export type ExecutionKnot = z.infer<typeof ExecutionKnotSchema>
