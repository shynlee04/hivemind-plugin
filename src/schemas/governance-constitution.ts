import { z } from "zod";

export const ConstitutionalRuleSchema = z.object({
  id: z.string().uuid(),
  key: z.string().regex(/^[a-z0-9._-]+$/),
  priority: z.enum(["critical", "high", "medium", "low"]),
  scope: z.enum(["global", "session", "turn", "hook", "tool"]),
  applies_to_roles: z
    .array(z.enum(["front_agent", "builder_agent", "review_agent", "any"]))
    .default(["any"]),
  content: z.string().min(1),
  rationale: z.string().min(1),
  source: z.enum(["builtin", "project", "session"]),
  enabled: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const EntityChecklistItemSchema = z.object({
  key: z.enum([
    "hivemind_config",
    "planning_sot",
    "hierarchy_chain",
    "anchors_presence",
    "mems_presence",
    "active_action",
    "state_validation_ready",
  ]),
  required: z.boolean().default(true),
  status: z.enum(["pass", "warn", "fail", "unknown"]),
  message: z.string().min(1),
  evidence_ref: z.string().min(1),
});

export const EntityChecklistSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  turn_id: z.string().min(1),
  items: z.array(EntityChecklistItemSchema).min(1),
  passed: z.boolean(),
  generated_at: z.string().datetime(),
});

export const GovernanceInstructionSchema = z.object({
  id: z.string().uuid(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  marker: z.string().min(1),
  title: z.string().min(1),
  rules: z.array(ConstitutionalRuleSchema).min(1),
  checklist: EntityChecklistSchema.optional(),
  checksum: z.string().min(8),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type ConstitutionalRule = z.infer<typeof ConstitutionalRuleSchema>;
export type EntityChecklistItem = z.infer<typeof EntityChecklistItemSchema>;
export type EntityChecklist = z.infer<typeof EntityChecklistSchema>;
export type GovernanceInstruction = z.infer<typeof GovernanceInstructionSchema>;
