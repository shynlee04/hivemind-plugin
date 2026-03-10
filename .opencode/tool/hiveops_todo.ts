/**
 * HiveOps TODO compatibility wrapper.
 *
 * Canonical behavior now lives in `src/tools/hiveops-todo.ts`.
 * This file stays only as an OpenCode compatibility entrypoint during the migration window.
 *
 * @example Agent calls: hiveops_todo({ action: "add", content: "Fix auth bug", priority: "high" })
 * @example Agent calls: hiveops_todo({ action: "complete", id: "task-1" })
 * @example Agent calls: hiveops_todo({ action: "list" })
 */

import { createHiveOpsTodoTool } from "../../src/tools/hiveops-todo.js"

export default createHiveOpsTodoTool(".")
