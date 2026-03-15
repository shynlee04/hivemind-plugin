import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { initProject } from "../src/cli/init.js"
import { runDoctorRecovery } from "../src/lib/doctor-recovery.js"
import { getEffectivePaths } from "../src/lib/paths.js"
import { getPlanningAuthorityPaths } from "../src/lib/planning-authority.js"

describe("doctor recovery planning authority", () => {
  it("detects and repairs planning authority drift", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-doctor-planning-"))

    try {
      await initProject(dir, { silent: true })

      const effective = getEffectivePaths(dir)
      const authority = getPlanningAuthorityPaths(dir)

      await unlink(authority.rootAgents)
      await unlink(authority.rootPlan)
      await rm(effective.projectPlanningIndex, { force: true })
      await writeFile(join(dir, "docs", "plans", "stray-plan.md"), "# stray\n", "utf-8")

      const report = await runDoctorRecovery(dir, { mode: "report" })
      assert.equal(report.issues.some((issue) => issue.code === "PROJECT_ENTRY_SURFACE_DRIFT"), true)
      assert.equal(report.issues.some((issue) => issue.code === "PLANNING_LEDGER_SURFACE_MISSING"), true)
      assert.equal(report.issues.some((issue) => issue.code === "PLANNING_BACKLOG_DRIFT"), true)

      const repair = await runDoctorRecovery(dir, { mode: "repair" })
      assert.equal(repair.actions.includes("normalize_planning_authority"), true)
      assert.equal(existsSync(authority.rootAgents), true)
      assert.equal(existsSync(authority.rootPlan), true)
      assert.equal(existsSync(effective.projectPlanningIndex), true)
      assert.equal(existsSync(join(authority.plansLegacyArchiveDir, "stray-plan.md")), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
