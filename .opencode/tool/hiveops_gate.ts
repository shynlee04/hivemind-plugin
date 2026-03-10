/**
 * HiveOps quality gate compatibility wrapper.
 *
 * Canonical behavior now lives in `src/tools/hiveops-gate.ts`.
 * This file stays only as an OpenCode compatibility entrypoint during the migration window.
 *
 * @example Agent calls: hiveops_gate({ action: "check", gate: "G1", domain: "R1" })
 * @example Agent calls: hiveops_gate({ action: "pass", gate: "G3", evidence: "npm test output: 0 failures" })
 * @example Agent calls: hiveops_gate({ action: "status" })
 */

import { createHiveOpsGateTool } from "../../src/tools/hiveops-gate.js"

export default createHiveOpsGateTool(".")
