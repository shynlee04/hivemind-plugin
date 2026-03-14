import { join } from "node:path"

import { getEffectivePaths } from "./paths.js"

export interface HiveOpsPaths {
  gatesFile: string
  sotIndexFile: string
  sotExportFile: string
  todoFile: string
  handoffDir: string
  checkpointDir: string
}

/**
 * Resolve the legacy HiveOps storage locations through the canonical path layer.
 *
 * This keeps the current file layout stable while moving tool ownership into `src/`.
 *
 * @param projectRoot - Project root used to resolve `.hivemind/` paths.
 * @returns Canonical paths for HiveOps gate, SOT, TODO, handoff, and checkpoint files.
 */
export function getHiveOpsPaths(projectRoot: string): HiveOpsPaths {
  const paths = getEffectivePaths(projectRoot)

  return {
    gatesFile: join(paths.stateDir, "gates.json"),
    sotIndexFile: join(paths.stateDir, "sot-index.json"),
    sotExportFile: join(paths.stateDir, "sot-export.tsv"),
    todoFile: join(paths.stateDir, "todo.json"),
    handoffDir: join(paths.root, "handoffs"),
    checkpointDir: join(paths.root, "checkpoints"),
  }
}
