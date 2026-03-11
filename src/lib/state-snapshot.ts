import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { join } from "path"
import { createStateManager } from "./persistence.js"
import { getEffectivePaths } from "./paths.js"
import { loadTree, treeExists } from "./hierarchy-tree.js"
import {
  createHivemindIngressWarning,
  ensureHivemindIngressClassification,
  type HivemindIngressReadWarning,
} from "./hivemind-ingress-policy.js"
import { readCanonicalTaskAuthority } from "./task-authority.js"
import type { BrainState } from "../schemas/brain-state.js"

export interface UnifiedStateSnapshot {
  brain: BrainState | null
  sessionId: string | null
  turnCount: number
  role: string
  hierarchyState: unknown
  taskState: unknown
  runtimeProfile: unknown
  contextRecovery: unknown
  healthMetrics: unknown
  ingressWarnings: HivemindIngressReadWarning[]
}

async function safeReadJson(filePath: string): Promise<unknown | null> {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const raw = await readFile(filePath, "utf-8")
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

/**
 * Read a non-authority supplemental surface while emitting ingress warnings for
 * projection/compatibility reads.
 *
 * @param directory - Project root used to resolve ingress policy.
 * @param filePath - Concrete `.hivemind/` file path to read.
 * @param warnings - Accumulator for ingress warnings emitted during the read.
 * @returns Parsed JSON payload or `null` when absent/corrupt.
 */
async function safeReadSupplementalJson(
  directory: string,
  filePath: string,
  warnings: HivemindIngressReadWarning[],
): Promise<unknown | null> {
  if (!existsSync(filePath)) {
    return null
  }

  const warning = createHivemindIngressWarning(directory, filePath)
  if (warning) {
    warnings.push(warning)
  }

  return safeReadJson(filePath)
}

/**
 * Read the current unified `.hivemind` snapshot through canonical authority
 * surfaces instead of compatibility projections.
 *
 * @param directory - Project root used to resolve runtime state paths.
 * @returns Unified state snapshot for inspection and export flows, including
 * ingress warnings when compatibility/projection surfaces are still read.
 */
export async function readUnifiedStateSnapshot(directory: string): Promise<UnifiedStateSnapshot> {
  const paths = getEffectivePaths(directory)
  const stateManager = createStateManager(directory)
  const brain = await stateManager.load()
  const ingressWarnings: HivemindIngressReadWarning[] = []

  let hierarchyState: unknown = null
  if (treeExists(directory)) {
    try {
      const tree = await loadTree(directory)
      hierarchyState = tree.root
    } catch {
      hierarchyState = null
    }
  }
  if (!hierarchyState) {
    ensureHivemindIngressClassification(
      directory,
      paths.hierarchy,
      ["authority"],
      "readUnifiedStateSnapshot hierarchy fallback read",
    )
    hierarchyState = await safeReadJson(paths.hierarchy)
  }

  const stateDir = paths.stateDir
  const taskAuthority = await readCanonicalTaskAuthority(directory, brain?.session.id ?? undefined)

  return {
    brain,
    sessionId: brain?.session.id ?? null,
    turnCount: brain?.metrics.turn_count ?? 0,
    role: brain?.session.role ?? "",
    hierarchyState,
    taskState: taskAuthority.manifest,
    runtimeProfile: await safeReadSupplementalJson(
      directory,
      join(stateDir, "runtime-profile.json"),
      ingressWarnings,
    ),
    contextRecovery: await safeReadSupplementalJson(
      directory,
      join(stateDir, "context-recovery.json"),
      ingressWarnings,
    ),
    healthMetrics: await safeReadSupplementalJson(
      directory,
      join(stateDir, "health-metrics.json"),
      ingressWarnings,
    ),
    ingressWarnings,
  }
}
