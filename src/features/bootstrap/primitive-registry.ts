/**
 * @fileoverview Primitive Registry — catalogs all OpenCode primitives (agents,
 * skills, commands, tools) with metadata, versioning, dependency tracking, and
 * conflict detection. Used by the control plane to enforce gatekeeper decisions
 * before user messages reach the agent.
 *
 * Phase 61 — CP-01, CP-02, CP-03
 */

import path from "node:path"
import { scanAgents, scanCommands, scanSkills } from "./primitive-scanners.js"
import type { ValidationResult } from "../../shared/types.js"

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * A single cataloged OpenCode primitive with full metadata.
 */
export interface PrimitiveEntry {
  /** Primitive category. */
  type: "agent" | "skill" | "command" | "tool" | "rule"
  /** Unique name (filename without extension). */
  name: string
  /** Absolute path to the primitive file on disk. */
  path: string
  /** Schema version extracted from frontmatter, defaults to "0". */
  version: string
  /** Names of other primitives this one depends on (keyed as "type:name"). */
  dependencies: string[]
  /** File modification timestamp. */
  lastModified: Date
  /** Arbitrary frontmatter metadata. */
  metadata: Record<string, unknown>
}

/**
 * A conflict detected between primitives.
 */
export interface ConflictEntry {
  /** Conflict classification. */
  type: "duplicate-name" | "circular-dependency" | "missing-dependency"
  /** Affected primitive keys (format: "type:name"). */
  primitives: string[]
  /** Human-readable description of the conflict. */
  description: string
}

/**
 * Complete registry snapshot at a point in time.
 */
export interface RegistrySnapshot {
  /** All discovered primitives keyed as "type:name". */
  primitives: Map<string, PrimitiveEntry>
  /** Dependency edges: primitive key → list of depended-upon primitive keys. */
  dependencyGraph: Map<string, string[]>
  /** Conflicts detected at build time. */
  conflicts: ConflictEntry[]
  /** When this snapshot was built. */
  timestamp: Date
}



// ---------------------------------------------------------------------------
// buildRegistry — scan and catalog all primitives
// ---------------------------------------------------------------------------

/**
 * Scans the project's `.opencode/` directory tree for all primitives
 * (agents, commands, skills) and returns a cataloged snapshot.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns A {@link RegistrySnapshot} with all discovered primitives, their
 *   dependency graph, and any detected conflicts.
 *
 * @example
 * ```ts
 * const snapshot = await buildRegistry("/path/to/project")
 * console.log(`Found ${snapshot.primitives.size} primitives`)
 * ```
 */
export async function buildRegistry(projectRoot: string): Promise<RegistrySnapshot> {
  const root = path.resolve(projectRoot)
  const primitives = new Map<string, PrimitiveEntry>()
  const conflicts: ConflictEntry[] = []

  await scanAgents(root, primitives)
  await scanCommands(root, primitives)
  await scanSkills(root, primitives)

  detectDuplicateNames(primitives, conflicts)

  const dependencyGraph = resolveDependencyGraphFromPrimitives(primitives)
  detectMissingDependencies(primitives, dependencyGraph, conflicts)

  return { primitives, dependencyGraph, conflicts, timestamp: new Date() }
}

// ---------------------------------------------------------------------------
// resolveDependencyGraph — build edges from frontmatter references
// ---------------------------------------------------------------------------

/**
 * Builds a dependency graph from the primitives in a snapshot.
 * Agents reference skills via their `skills` frontmatter field.
 * Commands reference agents via their `agent` frontmatter field.
 *
 * @param snapshot - The registry snapshot to analyze.
 * @returns Map from primitive key to its list of dependency keys.
 */
export function resolveDependencyGraph(snapshot: RegistrySnapshot): Map<string, string[]> {
  return resolveDependencyGraphFromPrimitives(snapshot.primitives)
}

// ---------------------------------------------------------------------------
// detectConflicts — find issues in the registry
// ---------------------------------------------------------------------------

/**
 * Detects conflicts in a registry snapshot: duplicate names across types,
 * missing dependencies, and circular dependencies.
 *
 * @param snapshot - The registry snapshot to analyze.
 * @returns Array of detected conflicts.
 */
export function detectConflicts(snapshot: RegistrySnapshot): ConflictEntry[] {
  const conflicts: ConflictEntry[] = []

  detectDuplicateNames(snapshot.primitives, conflicts)
  detectMissingDependencies(snapshot.primitives, snapshot.dependencyGraph, conflicts)
  detectCircularDependencies(snapshot.dependencyGraph, conflicts)

  return conflicts
}

// ---------------------------------------------------------------------------
// validateRegistry — validate all primitives
// ---------------------------------------------------------------------------

/**
 * Validates a registry snapshot for correctness.
 *
 * @param snapshot - The registry snapshot to validate.
 * @returns Validation result with errors (blocking) and warnings (non-blocking).
 */
export function validateRegistry(snapshot: RegistrySnapshot): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (snapshot.conflicts.length > 0) {
    for (const conflict of snapshot.conflicts) {
      const msg = `[${conflict.type}] ${conflict.description} (affects: ${conflict.primitives.join(", ")})`
      if (conflict.type === "duplicate-name" || conflict.type === "circular-dependency") {
        errors.push(msg)
      } else {
        warnings.push(msg)
      }
    }
  }

  for (const [key, entry] of snapshot.primitives) {
    if (!entry.name || entry.name.length === 0) errors.push(`Primitive ${key} has empty name`)
    if (!entry.path || entry.path.length === 0) errors.push(`Primitive ${key} has empty path`)
    if (!entry.type) errors.push(`Primitive ${key} has no type`)
  }

  return { valid: errors.length === 0, errors, warnings }
}

// ---------------------------------------------------------------------------
// Internal: dependency graph building
// ---------------------------------------------------------------------------

/**
 * Builds a dependency graph from primitive entries.
 */
function resolveDependencyGraphFromPrimitives(
  primitives: Map<string, PrimitiveEntry>,
): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  for (const [key, entry] of primitives) {
    if (entry.dependencies.length > 0) {
      graph.set(key, [...entry.dependencies])
    }
  }
  return graph
}

// ---------------------------------------------------------------------------
// Internal: conflict detection
// ---------------------------------------------------------------------------

/**
 * Detects primitives with the same name across different types.
 */
function detectDuplicateNames(
  primitives: Map<string, PrimitiveEntry>,
  conflicts: ConflictEntry[],
): void {
  const nameToTypes = new Map<string, string[]>()

  for (const [, entry] of primitives) {
    const existing = nameToTypes.get(entry.name) || []
    existing.push(entry.type)
    nameToTypes.set(entry.name, existing)
  }

  for (const [name, types] of nameToTypes) {
    if (types.length > 1) {
      conflicts.push({
        type: "duplicate-name",
        primitives: types.map((t) => `${t}:${name}`),
        description: `Name "${name}" is used by ${types.length} primitive types: ${types.join(", ")}`,
      })
    }
  }
}

/**
 * Detects dependencies that reference primitives not in the registry.
 */
function detectMissingDependencies(
  primitives: Map<string, PrimitiveEntry>,
  dependencyGraph: Map<string, string[]>,
  conflicts: ConflictEntry[],
): void {
  for (const [key, deps] of dependencyGraph) {
    for (const dep of deps) {
      if (!primitives.has(dep)) {
        conflicts.push({
          type: "missing-dependency",
          primitives: [key, dep],
          description: `Primitive "${key}" depends on "${dep}" which does not exist in the registry`,
        })
      }
    }
  }
}

/**
 * Detects circular dependencies using DFS cycle detection.
 */
function detectCircularDependencies(
  dependencyGraph: Map<string, string[]>,
  conflicts: ConflictEntry[],
): void {
  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(node: string, path: string[]): void {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node)
      const cycle = path.slice(cycleStart).concat(node)
      conflicts.push({
        type: "circular-dependency",
        primitives: cycle,
        description: `Circular dependency detected: ${cycle.join(" → ")}`,
      })
      return
    }
    if (visited.has(node)) return

    visited.add(node)
    inStack.add(node)
    path.push(node)

    const deps = dependencyGraph.get(node) || []
    for (const dep of deps) {
      dfs(dep, [...path])
    }

    inStack.delete(node)
  }

  for (const key of dependencyGraph.keys()) {
    if (!visited.has(key)) {
      dfs(key, [])
    }
  }
}
