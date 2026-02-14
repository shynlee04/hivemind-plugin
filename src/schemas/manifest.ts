/**
 * Manifest Schemas
 *
 * Centralized schema definitions for .hivemind manifests.
 */

export interface TaskItem {
  id: string
  text: string
  status: "pending" | "in_progress" | "completed" | "cancelled" | string
  created_at?: number
  completed_at?: number
  [key: string]: unknown
}

export interface TaskManifest {
  session_id: string
  updated_at: number
  tasks: TaskItem[]
}
