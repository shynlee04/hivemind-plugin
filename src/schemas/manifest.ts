/**
 * Manifest Schemas
 *
 * Centralized schema definitions for .hivemind manifests.
 */

export interface TaskItem {
  id: string
  text: string
  status: "pending" | "in_progress" | "completed" | "cancelled" | string
  priority?: "low" | "medium" | "high" | string
  domain?: "dev" | "marketing" | "finance" | "office-ops" | "hybrid" | string
  lane?: "vibecoder" | "enterprise" | "auto" | string
  source?: "todo.updated" | "init.seed" | "manual" | "system.realign" | string
  dependencies?: string[]
  acceptance_criteria?: string[]
  recommended_skills?: string[]
  canonical_command?: string
  related_entities?: {
    session_id?: string
    plan_id?: string
    phase_id?: string
    graph_task_id?: string
    story_id?: string
  }
  last_realigned_at?: number
  created_at?: number
  completed_at?: number
  [key: string]: unknown
}

export interface TaskManifest {
  session_id: string
  updated_at: number
  tasks: TaskItem[]
}
