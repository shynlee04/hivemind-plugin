import { z } from "zod"

export const KERNEL_STATE_VERSION = "3.0.0"

export const KernelLineageSchema = z.enum(["hivefiver", "hiveminder"])
export type KernelLineage = z.infer<typeof KernelLineageSchema>

export const KernelBootHealthSchema = z.enum([
  "ready",
  "bootstrap_required",
  "repair_required",
])
export type KernelBootHealth = z.infer<typeof KernelBootHealthSchema>

export const KernelIntegrityGradeSchema = z.enum([
  "healthy",
  "recovering",
  "degraded",
  "critical",
])
export type KernelIntegrityGrade = z.infer<typeof KernelIntegrityGradeSchema>

export const KernelBranchStatusSchema = z.enum([
  "idle",
  "active",
  "blocked",
  "verifying",
])
export type KernelBranchStatus = z.infer<typeof KernelBranchStatusSchema>

export const KernelSessionStatusSchema = z.enum([
  "bootstrap",
  "active",
  "paused",
  "completed",
  "archived",
])
export type KernelSessionStatus = z.infer<typeof KernelSessionStatusSchema>

export const KernelReferenceSchema = z.object({
  path: z.string(),
  id: z.string().nullable().optional(),
  description: z.string().optional(),
})
export type KernelReference = z.infer<typeof KernelReferenceSchema>

export const KernelSettingsDigestSchema = z.object({
  language: z.string(),
  governance_mode: z.string(),
  automation_level: z.string().nullable().default(null),
  expert_level: z.string().nullable().default(null),
  output_style: z.string().nullable().default(null),
})
export type KernelSettingsDigest = z.infer<typeof KernelSettingsDigestSchema>

export const KernelIntegrityStateSchema = z.object({
  version: z.string(),
  updated_at: z.string(),
  grade: KernelIntegrityGradeSchema,
  boot_health: KernelBootHealthSchema,
  issues: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
})
export type KernelIntegrityState = z.infer<typeof KernelIntegrityStateSchema>

export const KernelSessionMapEntrySchema = z.object({
  canonical_session_id: z.string(),
  brain_session_id: z.string(),
  opencode_session_id: z.string().nullable().default(null),
  legacy_session_id: z.string().nullable().default(null),
  lineage: KernelLineageSchema,
  session_kind: z.string().nullable().default(null),
  status: KernelSessionStatusSchema,
  last_seen_at: z.string(),
})
export type KernelSessionMapEntry = z.infer<typeof KernelSessionMapEntrySchema>

export const KernelSessionMapSchema = z.object({
  version: z.string(),
  updated_at: z.string(),
  active_session_id: z.string().nullable().default(null),
  active_opencode_session_id: z.string().nullable().default(null),
  sessions: z.array(KernelSessionMapEntrySchema).default([]),
})
export type KernelSessionMap = z.infer<typeof KernelSessionMapSchema>

export const KernelArtifactIndexSchema = z.object({
  version: z.string(),
  updated_at: z.string(),
  items: z.array(KernelReferenceSchema).default([]),
})
export type KernelArtifactIndex = z.infer<typeof KernelArtifactIndexSchema>

export const KernelVerificationIndexItemSchema = z.object({
  id: z.string(),
  verdict: z.string(),
  path: z.string(),
})
export type KernelVerificationIndexItem = z.infer<typeof KernelVerificationIndexItemSchema>

export const KernelVerificationIndexSchema = z.object({
  version: z.string(),
  updated_at: z.string(),
  items: z.array(KernelVerificationIndexItemSchema).default([]),
})
export type KernelVerificationIndex = z.infer<typeof KernelVerificationIndexSchema>

export const KernelCompletionRuleSchema = z.object({
  mode: z.string(),
  description: z.string(),
})
export type KernelCompletionRule = z.infer<typeof KernelCompletionRuleSchema>

export const KernelIntentPackageSchema = z.object({
  summary: z.string(),
  source_signals: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
})
export type KernelIntentPackage = z.infer<typeof KernelIntentPackageSchema>

export const KernelSessionRefsSchema = z.object({
  verification: z.array(KernelReferenceSchema).default([]),
  handoffs: z.array(KernelReferenceSchema).default([]),
  artifacts: z.array(KernelReferenceSchema).default([]),
})
export type KernelSessionRefs = z.infer<typeof KernelSessionRefsSchema>

export const KernelSessionStateSchema = z.object({
  id: z.string(),
  lineage: KernelLineageSchema,
  brain_session_id: z.string(),
  opencode_session_id: z.string().nullable().default(null),
  legacy_session_id: z.string().nullable().default(null),
  role: z.string().nullable().default(null),
  session_kind: z.string().nullable().default(null),
  status: KernelSessionStatusSchema,
  workflow_id: z.string().nullable().default(null),
  todo_chain_id: z.string().nullable().default(null),
  branch_refs: z.array(z.string()).default([]),
  intent: KernelIntentPackageSchema,
  completion_rule: KernelCompletionRuleSchema,
  refs: KernelSessionRefsSchema,
  created_at: z.string(),
  updated_at: z.string(),
})
export type KernelSessionState = z.infer<typeof KernelSessionStateSchema>

export const KernelWorkflowStateSchema = z.object({
  id: z.string(),
  lineage: KernelLineageSchema,
  normalized_intent: z.string(),
  route: z.string(),
  success_metrics: z.array(z.string()).default([]),
  acceptance_criteria: z.array(z.string()).default([]),
  branch_plan: z.array(z.string()).default([]),
  allowed_agent_classes: z.array(z.string()).default([]),
  escalation_policy: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
export type KernelWorkflowState = z.infer<typeof KernelWorkflowStateSchema>

export const KernelTaskStateSchema = z.object({
  id: z.string(),
  lineage: KernelLineageSchema,
  owner_branch: z.string(),
  status: z.string(),
  dependency_ids: z.array(z.string()).default([]),
  acceptance_criteria: z.array(z.string()).default([]),
  evidence_refs: z.array(KernelReferenceSchema).default([]),
  related_artifacts: z.array(KernelReferenceSchema).default([]),
  verification_target: z.string().nullable().default(null),
  created_at: z.string(),
  updated_at: z.string(),
})
export type KernelTaskState = z.infer<typeof KernelTaskStateSchema>

export const KernelTodoChainItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  task_id: z.string().nullable().default(null),
  position: z.number().int().nonnegative(),
})
export type KernelTodoChainItem = z.infer<typeof KernelTodoChainItemSchema>

export const KernelTodoChainStateSchema = z.object({
  id: z.string(),
  lineage: KernelLineageSchema,
  title: z.string(),
  items: z.array(KernelTodoChainItemSchema).default([]),
  completion_marker: z.string().nullable().default(null),
  reroute_history: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
})
export type KernelTodoChainState = z.infer<typeof KernelTodoChainStateSchema>

export const KernelVerificationStateSchema = z.object({
  id: z.string(),
  lineage: KernelLineageSchema,
  verdict: z.string(),
  truths: z.array(z.string()).default([]),
  artifact_refs: z.array(KernelReferenceSchema).default([]),
  key_links: z.array(z.string()).default([]),
  commands_run: z.array(z.string()).default([]),
  residual_risk: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
})
export type KernelVerificationState = z.infer<typeof KernelVerificationStateSchema>

export const KernelHandoffStateSchema = z.object({
  id: z.string(),
  lineage: KernelLineageSchema,
  source_session_id: z.string(),
  target_agent: z.string().nullable().default(null),
  next_workflow_id: z.string().nullable().default(null),
  evidence_refs: z.array(KernelReferenceSchema).default([]),
  resume_packet_ref: KernelReferenceSchema.nullable().default(null),
  confidence: z.number().min(0).max(1),
  next_actions: z.array(z.string()).default([]),
  created_at: z.string(),
  updated_at: z.string(),
})
export type KernelHandoffState = z.infer<typeof KernelHandoffStateSchema>

export const HiveNeuronSchema = z.object({
  version: z.string(),
  updated_at: z.string(),
  boot_health: KernelBootHealthSchema,
  current_lineage: KernelLineageSchema,
  active_session_id: z.string().nullable().default(null),
  active_opencode_session_id: z.string().nullable().default(null),
  active_workflow_id: z.string().nullable().default(null),
  active_todo_chain_id: z.string().nullable().default(null),
  branch_status: KernelBranchStatusSchema,
  integrity_grade: KernelIntegrityGradeSchema,
  critical_gaps: z.array(z.string()).default([]),
  settings_digest: KernelSettingsDigestSchema,
  refs: z.object({
    integrity: KernelReferenceSchema,
    session_map: KernelReferenceSchema,
    artifact_index: KernelReferenceSchema,
    verification_index: KernelReferenceSchema,
    profile: KernelReferenceSchema,
    governance: KernelReferenceSchema,
    guardrails: KernelReferenceSchema,
    session: KernelReferenceSchema.nullable().default(null),
    workflow: KernelReferenceSchema.nullable().default(null),
    todo_chain: KernelReferenceSchema.nullable().default(null),
  }),
})
export type HiveNeuronState = z.infer<typeof HiveNeuronSchema>
