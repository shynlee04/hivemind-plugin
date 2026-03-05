import { existsSync } from "fs"
import { readFile } from "fs/promises"
import { join } from "path"
import { createStateManager } from "./persistence.js"
import { getEffectivePaths } from "./paths.js"
import { loadTree, treeExists } from "./hierarchy-tree.js"
import type { BrainState } from "../schemas/brain-state.js"

export interface UnifiedStateSnapshot {
  brain: BrainState | null
  sessionId: string | null
  turnCount: number
  role: string
  hierarchyState: unknown
  todoState: unknown
  runtimeProfile: unknown
  contextRecovery: unknown
  healthMetrics: unknown
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

export async function readUnifiedStateSnapshot(directory: string): Promise<UnifiedStateSnapshot> {
  const paths = getEffectivePaths(directory)
  const stateManager = createStateManager(directory)
  const brain = await stateManager.load()

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
    hierarchyState = await safeReadJson(paths.hierarchy)
  }

  const stateDir = paths.stateDir

  return {
    brain,
    sessionId: brain?.session.id ?? null,
    turnCount: brain?.metrics.turn_count ?? 0,
    role: brain?.session.role ?? "",
    hierarchyState,
    todoState: await safeReadJson(join(stateDir, "todo.json")),
    runtimeProfile: await safeReadJson(join(stateDir, "runtime-profile.json")),
    contextRecovery: await safeReadJson(join(stateDir, "context-recovery.json")),
    healthMetrics: await safeReadJson(join(stateDir, "health-metrics.json")),
  }
}
