/**
 * HiveOps source-of-truth compatibility wrapper.
 *
 * Canonical behavior now lives in `src/tools/hiveops-sot.ts`.
 * This file stays only as an OpenCode compatibility entrypoint during the migration window.
 *
 * @example Agent calls: hiveops_sot({ action: "register", path: "docs/plans/my-plan.md", tags: "plan,R1" })
 * @example Agent calls: hiveops_sot({ action: "search", query: "delegation" })
 * @example Agent calls: hiveops_sot({ action: "index" })
 */

import { createHiveOpsSotTool } from "../../src/tools/hiveops-sot.js"

export default createHiveOpsSotTool(".")
