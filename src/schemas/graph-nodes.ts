import { z } from "zod";

const nodeStatusSchema = z.enum(["pending", "active", "complete", "blocked"]);

export const UnifiedStatusSchema = z.enum([
  "pending",
  "in_progress",
  "active",
  "complete",
  "blocked",
  "invalidated",
  "cancelled",
]);

export const PlanningLifecycleLevelSchema = z.enum([
  "project",
  "milestone",
  "phase",
  "plan",
  "task",
  "verification",
]);

export const RalphUserStorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).default("pending"),
  acceptanceCriteria: z.array(z.string().min(1)).default([]),
  dependencies: z.array(z.string().min(1)).default([]),
  relatedEntities: z.object({
    session_id: z.string().optional(),
    plan_id: z.string().optional(),
    phase_id: z.string().optional(),
    graph_task_id: z.string().optional(),
    story_id: z.string().optional(),
    workflow_id: z.string().optional(),
    requirement_node_id: z.string().optional(),
    mcp_provider_id: z.string().optional(),
    export_id: z.string().optional(),
  }).optional(),
});

export const RalphPrdJsonSchema = z.object({
  name: z.string().min(1),
  branchName: z.string().optional(),
  description: z.string().optional(),
  userStories: z.array(RalphUserStorySchema),
});

export const TrajectoryNodeSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  active_plan_id: z.string().uuid().nullable(),
  active_phase_id: z.string().uuid().nullable(),
  active_task_ids: z.array(z.string().uuid()),
  intent: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ProjectNodeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: UnifiedStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const MilestoneNodeSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  status: UnifiedStatusSchema,
  order: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const PlanNodeSchema = z.object({
  id: z.string().uuid(),
  trajectory_id: z.string().uuid(),
  title: z.string(),
  status: nodeStatusSchema,
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  project_id: z.string().uuid().nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
  phases: z.array(z.object({ id: z.string().uuid() })).optional(),
  verifications: z.array(z.object({ id: z.string().uuid() })).optional(),
});

export const PhaseNodeSchema = z.object({
  id: z.string().uuid(),
  plan_id: z.string().uuid(),
  title: z.string(),
  status: nodeStatusSchema,
  order: z.number(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const TaskNodeSchema = z.object({
  id: z.string().uuid(),
  parent_phase_id: z.string().uuid(),
  title: z.string(),
  status: z.enum([
    "pending",
    "in_progress",
    "active",
    "complete",
    "blocked",
    "invalidated",
    "cancelled",
  ]),
  file_locks: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  plan_id: z.string().uuid().nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  classification: z
    .enum(["feature", "bugfix", "refactor", "test", "docs", "chore", "research", "spike"])
    .optional(),
  description: z.string().optional(),
  acceptance_criteria: z.array(z.string()).optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
});

export const SubtaskNodeTypeSchema = z.enum([
  "discussion",
  "research",
  "investigation",
  "validation",
  "execution",
  "review",
  "loop",
  "gatekeeping",
]);

export const SubtaskNodeSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  session_id: z.string().uuid(),
  type: SubtaskNodeTypeSchema,
  title: z.string().min(1),
  status: UnifiedStatusSchema,
  agent_role: z.string().optional(),
  evidence: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const SessionNodeSchema = z.object({
  id: z.string().uuid(),
  mode: z.enum(["plan_driven", "quick_fix", "exploration"]),
  status: z.enum(["active", "compacting", "closed", "split"]),
  parent_session_id: z.string().uuid().nullable().optional(),
  trajectory_id: z.string().uuid().nullable().optional(),
  compaction_count: z.number().int().nonnegative().default(0),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const DelegationLevelSchema = z.enum(["orchestrator", "specialist", "worker"]);

export const DelegationNodeSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  task_id: z.string().uuid().nullable().optional(),
  agent_type: z.string().min(1),
  level: DelegationLevelSchema,
  status: UnifiedStatusSchema,
  outcome: z.enum(["success", "partial", "failure"]).nullable().optional(),
  findings: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const TrajectoryExportSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  trajectory_id: z.string().uuid(),
  task_ids: z.array(z.string().uuid()).default([]),
  summary: z.string(),
  decisions: z.array(z.string()).default([]),
  anchors_snapshot: z.array(
    z.object({
      key: z.string(),
      value: z.string(),
    })
  ).default([]),
  created_at: z.string().datetime(),
});

export const VerificationNodeSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  plan_id: z.string().uuid().nullable().optional(),
  type: z.enum(["test", "type_check", "lint", "manual", "code_review", "integration"]),
  status: z.enum(["pending", "pass", "fail", "skipped"]),
  evidence: z.string().optional(),
  command: z.string().optional(),
  output_excerpt: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const MemNodeSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(), // FK to trajectory.session_id - REQUIRED
  origin_task_id: z.string().uuid().nullable(),
  verification_id: z.string().uuid().nullable().optional(),
  shelf: z.string(),
  type: z.enum(["insight", "false_path"]),
  content: z.string(),
  relevance_score: z.number().min(0).max(1),
  staleness_stamp: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type TrajectoryNode = z.infer<typeof TrajectoryNodeSchema>;
export type UnifiedStatus = z.infer<typeof UnifiedStatusSchema>;
export type ProjectNode = z.infer<typeof ProjectNodeSchema>;
export type MilestoneNode = z.infer<typeof MilestoneNodeSchema>;
export type PlanNode = z.infer<typeof PlanNodeSchema>;
export type PhaseNode = z.infer<typeof PhaseNodeSchema>;
export type TaskNode = z.infer<typeof TaskNodeSchema>;
export type SubtaskNodeType = z.infer<typeof SubtaskNodeTypeSchema>;
export type SubtaskNode = z.infer<typeof SubtaskNodeSchema>;
export type SessionNode = z.infer<typeof SessionNodeSchema>;
export type DelegationLevel = z.infer<typeof DelegationLevelSchema>;
export type DelegationNode = z.infer<typeof DelegationNodeSchema>;
export type TrajectoryExport = z.infer<typeof TrajectoryExportSchema>;
export type VerificationNode = z.infer<typeof VerificationNodeSchema>;
export type MemNode = z.infer<typeof MemNodeSchema>;
export type PlanningLifecycleLevel = z.infer<typeof PlanningLifecycleLevelSchema>;
export type RalphUserStory = z.infer<typeof RalphUserStorySchema>;
export type RalphPrdJson = z.infer<typeof RalphPrdJsonSchema>;

export interface PlanningLifecycleBundle {
  project_id?: string | null;
  milestone_id?: string | null;
  phase_id?: string | null;
  plan_id?: string | null;
  task_id?: string | null;
  verification_id?: string | null;
}

type ParentLinkedNode = {
  id: string;
  parent_id?: string | null;
  parent_phase_id?: string | null;
  plan_id?: string | null;
  trajectory_id?: string | null;
  origin_task_id?: string | null;
};

function getNodeParentId(node: ParentLinkedNode): string | null {
  return (
    node.parent_id ??
    node.parent_phase_id ??
    node.plan_id ??
    node.trajectory_id ??
    node.origin_task_id ??
    null
  );
}

export function validateParentExists(
  childId: string,
  parentId: string,
  parentIds: string[]
): boolean {
  if (!childId || !parentId) {
    return false;
  }

  return parentIds.includes(parentId);
}

export function validateOrphanFree(
  nodes: ParentLinkedNode[],
  allParentIds: string[]
): { valid: boolean; orphans: string[] } {
  const parentSet = new Set(allParentIds);
  const orphans = nodes
    .filter((node) => {
      const parentId = getNodeParentId(node);
      return parentId !== null && !parentSet.has(parentId);
    })
    .map((node) => node.id);

  return {
    valid: orphans.length === 0,
    orphans,
  };
}

/**
 * HiveFiver compatibility helper:
 * validates that a lifecycle mapping contains all required lineage IDs.
 */
export function validateLifecycleLineage(
  bundle: PlanningLifecycleBundle
): { valid: boolean; missing: PlanningLifecycleLevel[] } {
  const checks: Array<[PlanningLifecycleLevel, string | null | undefined]> = [
    ["project", bundle.project_id],
    ["milestone", bundle.milestone_id],
    ["phase", bundle.phase_id],
    ["plan", bundle.plan_id],
    ["task", bundle.task_id],
    ["verification", bundle.verification_id],
  ];

  const missing = checks
    .filter(([, value]) => !value || value.trim().length === 0)
    .map(([level]) => level);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Ralph bridge safety helper:
 * validates flat-root PRD JSON shape and common anti-patterns.
 */
export function validateRalphPrdJsonShape(input: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return {
      valid: false,
      errors: ["root must be an object"],
    };
  }

  const payload = input as Record<string, unknown>;
  if ("prd" in payload) {
    errors.push("anti-pattern: wrapper key 'prd' is not allowed");
  }
  if ("tasks" in payload) {
    errors.push("anti-pattern: root 'tasks' is not allowed; use 'userStories'");
  }

  const parse = RalphPrdJsonSchema.safeParse(payload);
  if (!parse.success) {
    for (const issue of parse.error.issues) {
      const pointer = issue.path.length > 0 ? issue.path.join(".") : "root";
      errors.push(`${pointer}: ${issue.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
