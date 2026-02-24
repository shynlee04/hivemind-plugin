import { z } from "zod";

import {
  DelegationNodeSchema,
  MemNodeSchema,
  MilestoneNodeSchema,
  PlanNodeSchema,
  ProjectNodeSchema,
  SessionNodeSchema,
  SubtaskNodeSchema,
  TaskNodeSchema,
  TrajectoryExportSchema,
  TrajectoryNodeSchema,
  VerificationNodeSchema,
} from "./graph-nodes.js";

export const TrajectoryStateSchema = z.object({
  version: z.string(),
  trajectory: TrajectoryNodeSchema.nullable(),
});

export const PlansStateSchema = z.object({
  version: z.string(),
  plans: z.array(PlanNodeSchema),
});

export const GraphTasksStateSchema = z.object({
  version: z.string(),
  tasks: z.array(TaskNodeSchema),
});

export const GraphMemsStateSchema = z.object({
  version: z.string(),
  mems: z.array(MemNodeSchema),
});

export const ProjectsStateSchema = z.object({
  version: z.string(),
  projects: z.array(ProjectNodeSchema),
});

export const MilestonesStateSchema = z.object({
  version: z.string(),
  milestones: z.array(MilestoneNodeSchema),
});

export const SubtasksStateSchema = z.object({
  version: z.string(),
  subtasks: z.array(SubtaskNodeSchema),
});

export const SessionsStateSchema = z.object({
  version: z.string(),
  sessions: z.array(SessionNodeSchema),
});

export const DelegationsStateSchema = z.object({
  version: z.string(),
  delegations: z.array(DelegationNodeSchema),
});

export const TrajectoryExportsStateSchema = z.object({
  version: z.string(),
  exports: z.array(TrajectoryExportSchema),
});

export const VerificationsStateSchema = z.object({
  version: z.string(),
  verifications: z.array(VerificationNodeSchema),
});

export type TrajectoryState = z.infer<typeof TrajectoryStateSchema>;
export type PlansState = z.infer<typeof PlansStateSchema>;
export type GraphTasksState = z.infer<typeof GraphTasksStateSchema>;
export type GraphMemsState = z.infer<typeof GraphMemsStateSchema>;
export type ProjectsState = z.infer<typeof ProjectsStateSchema>;
export type MilestonesState = z.infer<typeof MilestonesStateSchema>;
export type SubtasksState = z.infer<typeof SubtasksStateSchema>;
export type SessionsState = z.infer<typeof SessionsStateSchema>;
export type DelegationsState = z.infer<typeof DelegationsStateSchema>;
export type TrajectoryExportsState = z.infer<typeof TrajectoryExportsStateSchema>;
export type VerificationsState = z.infer<typeof VerificationsStateSchema>;
