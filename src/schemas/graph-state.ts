import { z } from "zod";

import {
  MemNodeSchema,
  PlanNodeSchema,
  TaskNodeSchema,
  TrajectoryNodeSchema,
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

export type TrajectoryState = z.infer<typeof TrajectoryStateSchema>;
export type PlansState = z.infer<typeof PlansStateSchema>;
export type GraphTasksState = z.infer<typeof GraphTasksStateSchema>;
export type GraphMemsState = z.infer<typeof GraphMemsStateSchema>;
