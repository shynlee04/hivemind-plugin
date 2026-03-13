import assert from "node:assert/strict"
import { existsSync, lstatSync, readlinkSync } from "node:fs"
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import {
  ensurePlanningAuthoritySurfaces,
  getPlanningAuthorityPaths,
} from "../src/lib/planning-authority.js"

describe("planning authority surfaces", () => {
  it("creates canonical symlinks, active phase index, and archives root backlog", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-planning-authority-"))

    try {
      await mkdir(join(dir, "docs", "plans"), { recursive: true })
      await mkdir(join(dir, "docs", "governance"), { recursive: true })

      await writeFile(join(dir, "AGENTS.md"), "# Existing Agents\n", "utf-8")
      await writeFile(join(dir, "PLAN.md"), "# Existing Plan\n", "utf-8")
      await writeFile(join(dir, "docs", "plans", "old-plan.md"), "# Old plan\n", "utf-8")
      await writeFile(join(dir, "docs", "plans", "legacy-status.md"), "# Legacy status\n", "utf-8")
      await mkdir(join(dir, "docs", "plans", "refactor"), { recursive: true })
      await writeFile(join(dir, "docs", "plans", "refactor", "packet.md"), "# Packet\n", "utf-8")

      const status = await ensurePlanningAuthoritySurfaces(dir)
      const paths = getPlanningAuthorityPaths(dir)

      assert.equal(status.backlogEntries.length, 0)
      assert.equal(existsSync(paths.governanceDoc), true)
      assert.equal(existsSync(paths.masterPlanDoc), true)
      assert.equal(existsSync(paths.activePhaseIndex), true)
      assert.equal(lstatSync(paths.rootAgents).isSymbolicLink(), true)
      assert.equal(lstatSync(paths.rootPlan).isSymbolicLink(), true)
      assert.equal(readlinkSync(paths.rootAgents), "docs/governance/project-governance-2026-03-14.md")
      assert.equal(readlinkSync(paths.rootPlan), "docs/plans/project-master-plan-2026-03-14.md")
      assert.equal(existsSync(join(paths.plansLegacyArchiveDir, "old-plan.md")), true)
      assert.equal(existsSync(join(paths.plansLegacyArchiveDir, "legacy-status.md")), true)
      assert.equal(existsSync(join(paths.plansLegacyArchiveDir, "refactor")), true)

      const index = await readFile(paths.activePhaseIndex, "utf-8")
      assert.equal(index.includes("Cycle 3A - Planning authority normalization"), true)
      assert.equal(index.includes("old-plan.md"), true)
      assert.equal(index.includes("legacy-status.md"), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
