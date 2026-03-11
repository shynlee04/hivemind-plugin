import type { TaskWorkflowTopology } from "../schemas/manifest.js"

/**
 * Normalize arbitrary workflow-topology input into the canonical task contract.
 *
 * @param value - Raw workflow-topology candidate.
 * @returns Canonical task workflow topology, or `undefined` when invalid.
 */
export function normalizeTaskWorkflowTopology(value?: string): TaskWorkflowTopology | undefined {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (
    normalized === "parallel" ||
    normalized === "dependent" ||
    normalized === "independent" ||
    normalized === "inter-dependent" ||
    normalized === "unclassified"
  ) {
    return normalized
  }
  return undefined
}

/**
 * Resolve workflow topology for the canonical task contract.
 *
 * Explicit topology wins. When topology is omitted, dependency-bearing tasks
 * become `dependent` and all others default to `unclassified`.
 *
 * @param input - Workflow-topology hints for the current task.
 * @returns Canonical task workflow topology.
 */
export function resolveTaskWorkflowTopology(input: {
  workflowTopology?: string
  dependencies?: string[]
}): TaskWorkflowTopology {
  const explicit = normalizeTaskWorkflowTopology(input.workflowTopology)
  if (explicit) {
    return explicit
  }

  const hasDependencies = Array.isArray(input.dependencies) && input.dependencies.length > 0
  return hasDependencies ? "dependent" : "unclassified"
}
