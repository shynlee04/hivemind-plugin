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
  lane?: "vibecoder" | "floppy_engineer" | "enterprise" | "enterprise_architect" | "auto" | string
  persona?: "vibecoder" | "floppy_engineer" | "enterprise_architect" | string
  source?: "todo.updated" | "init.seed" | "manual" | "system.realign" | string
  hivefiver_action?: string
  validation_attempts?: number
  max_validation_attempts?: number
  evidence_confidence?: "full" | "partial" | "low" | string
  menu_step?: number
  menu_total?: number
  auto_initiate?: boolean
  requires_permission?: boolean
  permission_prompt?: string
  next_step_menu?: Array<{
    id?: string
    command: string
    action?: string
    label?: string
    description?: string
    requiresPermission?: boolean
  }>
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
    workflow_id?: string
    requirement_node_id?: string
    mcp_provider_id?: string
    export_id?: string
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
