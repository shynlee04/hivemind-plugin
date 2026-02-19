import { z } from "zod";

const nodeStatusSchema = z.enum(["pending", "active", "complete", "blocked"]);

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
  status: z.enum(["pending", "in_progress", "complete", "invalidated"]),
  file_locks: z.array(z.string()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  plan_id: z.string().uuid().nullable().optional(),
  milestone_id: z.string().uuid().nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
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
export type PlanNode = z.infer<typeof PlanNodeSchema>;
export type PhaseNode = z.infer<typeof PhaseNodeSchema>;
export type TaskNode = z.infer<typeof TaskNodeSchema>;
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
