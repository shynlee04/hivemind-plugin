import { z } from "zod";

const nodeStatusSchema = z.enum(["pending", "active", "complete", "blocked"]);

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
});

export const MemNodeSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(), // FK to trajectory.session_id - REQUIRED
  origin_task_id: z.string().uuid().nullable(),
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
