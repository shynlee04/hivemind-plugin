/**
 * Durable JSON persistence for config workflow state.
 *
 * Follows delegation-persistence.ts pattern:
 * - Separate JSON file in the same state directory
 * - Atomic write via tmp + rename
 * - Normalize on read (invalid entries silently dropped)
 * - Deep-clone on read (prevents mutation aliasing)
 *
 * @module config-workflow/workflow-persistence
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

import { getContinuityStoragePath } from "../continuity.js"
import type { ConfigWorkflowState } from "../types.js"

// ---------------------------------------------------------------------------
// Store format
// ---------------------------------------------------------------------------

type WorkflowStoreFile = {
  version: number
  updatedAt: number
  workflows: Record<string, ConfigWorkflowState>
}

const STORE_VERSION = 1

// ---------------------------------------------------------------------------
// Path resolution
// ---------------------------------------------------------------------------

/**
 * Get the file path for workflow persistence.
 * Follows delegation-persistence.ts pattern: same state directory, different file.
 *
 * @returns Absolute path to `config-workflows.json`.
 */
export function getWorkflowStorePath(): string {
  return join(dirname(getContinuityStoragePath()), "config-workflows.json")
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a single persisted workflow entry. Invalid entries return null.
 *
 * @param value - Raw parsed value from the JSON store.
 * @returns A validated {@link ConfigWorkflowState}, or `null` if invalid.
 */
function normalizeWorkflowEntry(value: unknown): ConfigWorkflowState | null {
  if (typeof value !== "object" || value === null) return null
  const rec = value as Record<string, unknown>

  if (
    typeof rec.id !== "string"
    || typeof rec.type !== "string"
    || typeof rec.currentTurn !== "number"
    || typeof rec.startedAt !== "number"
    || typeof rec.updatedAt !== "number"
    || !Array.isArray(rec.targetPrimitives)
    || typeof rec.scope !== "string"
    || typeof rec.mode !== "string"
  ) {
    return null
  }

  // Deep-clone to prevent mutation aliasing
  const turns: Record<string, unknown> =
    typeof rec.turns === "object" && rec.turns !== null
      ? { ...(rec.turns as Record<string, unknown>) }
      : {}

  return {
    id: rec.id,
    type: rec.type as ConfigWorkflowState["type"],
    currentTurn: rec.currentTurn,
    turns: turns as ConfigWorkflowState["turns"],
    targetPrimitives: (rec.targetPrimitives as Array<{ type: "agent" | "command" | "skill"; name: string }>).map(
      (p) => ({ type: p.type, name: p.name }),
    ),
    scope: rec.scope as ConfigWorkflowState["scope"],
    mode: rec.mode as ConfigWorkflowState["mode"],
    startedAt: rec.startedAt,
    updatedAt: rec.updatedAt,
  }
}

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

/**
 * Read all persisted workflows from disk.
 * Returns a Map keyed by workflow ID. Invalid entries are silently dropped.
 *
 * @returns Map of workflow ID → workflow state.
 */
export function readPersistedWorkflows(): Map<string, ConfigWorkflowState> {
  const filePath = getWorkflowStorePath()
  const result = new Map<string, ConfigWorkflowState>()

  if (!existsSync(filePath)) {
    return result
  }

  try {
    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw) as unknown

    if (typeof parsed !== "object" || parsed === null) return result
    const store = parsed as WorkflowStoreFile
    if (typeof store.workflows !== "object" || store.workflows === null) return result

    for (const [id, entry] of Object.entries(store.workflows)) {
      const normalized = normalizeWorkflowEntry(entry)
      if (normalized) {
        result.set(id, normalized)
      }
    }
  } catch {
    // Corrupted file — return empty
  }

  return result
}

/**
 * Persist all workflows to disk (atomic write: tmp + rename).
 *
 * @param workflows - Map of workflow ID → workflow state.
 */
export function persistWorkflows(workflows: Map<string, ConfigWorkflowState>): void {
  const filePath = getWorkflowStorePath()
  mkdirSync(dirname(filePath), { recursive: true })

  const store: WorkflowStoreFile = {
    version: STORE_VERSION,
    updatedAt: Date.now(),
    workflows: Object.fromEntries(workflows.entries()),
  }

  const tmpFile = filePath + ".tmp"
  writeFileSync(tmpFile, `${JSON.stringify(store, null, 2)}\n`, "utf-8")
  renameSync(tmpFile, filePath)
}

/**
 * Persist a single workflow (reads all, updates one, writes all).
 *
 * @param workflow - The workflow state to persist.
 */
export function persistWorkflow(workflow: ConfigWorkflowState): void {
  const all = readPersistedWorkflows()
  all.set(workflow.id, workflow)
  persistWorkflows(all)
}

/**
 * Read a single workflow by ID. Returns undefined if not found.
 *
 * @param workflowId - The workflow ID to look up.
 * @returns The workflow state, or `undefined`.
 */
export function readWorkflow(workflowId: string): ConfigWorkflowState | undefined {
  return readPersistedWorkflows().get(workflowId)
}

/**
 * Delete a workflow by ID from the persisted store.
 *
 * @param workflowId - The workflow ID to delete.
 */
export function deleteWorkflow(workflowId: string): void {
  const all = readPersistedWorkflows()
  all.delete(workflowId)
  persistWorkflows(all)
}
