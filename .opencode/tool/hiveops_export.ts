/**
 * HiveOps export compatibility wrapper.
 *
 * Canonical behavior now lives in `src/tools/hiveops-export.ts`.
 * This file stays only as an OpenCode compatibility entrypoint during the migration window.
 *
 * @example Agent calls: hiveops_export({ action: "handoff", summary: "Completed R1", next_agent: "hivemaker" })
 * @example Agent calls: hiveops_export({ action: "checkpoint", label: "R1 complete" })
 */

import { createHiveOpsExportTool } from "../../src/tools/hiveops-export.js"

export default createHiveOpsExportTool(".")
