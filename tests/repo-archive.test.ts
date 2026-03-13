import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { initProject } from "../src/cli/init.js"
import { runDoctorRecovery } from "../src/lib/doctor-recovery.js"
import { ensureRepoArchiveStructure, getRepoArchivePaths } from "../src/lib/repo-archive.js"

describe("repo archive taxonomy", () => {
  it("ensures the strategic archive bucket structure", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-repo-archive-"))

    try {
      const paths = await ensureRepoArchiveStructure(dir, "2026-03-14")
      assert.equal(existsSync(paths.root), true)
      assert.equal(existsSync(paths.consolidatedGovernanceClusterDir), true)
      assert.equal(existsSync(paths.consolidatedSessionClusterDir), true)
      assert.equal(existsSync(paths.consolidatedTaskClusterDir), true)
      assert.equal(existsSync(paths.consolidatedUtilityClusterDir), true)
      assert.equal(existsSync(paths.deadCodeSwarmClusterDir), true)
      assert.equal(existsSync(paths.deprecatedScriptsDateDir), true)
      assert.equal(existsSync(paths.skillsRoot), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("doctor repair recreates missing repo archive surfaces", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-repo-archive-doctor-"))

    try {
      await initProject(dir, { silent: true })
      const paths = getRepoArchivePaths(dir)
      await rm(paths.root, { recursive: true, force: true })

      const report = await runDoctorRecovery(dir, { mode: "report" })
      assert.equal(
        report.issues.some((issue) => issue.code === "REPO_ARCHIVE_SURFACE_MISSING"),
        true,
      )

      await runDoctorRecovery(dir, { mode: "repair" })
      assert.equal(existsSync(paths.root), true)
      assert.equal(existsSync(paths.consolidatedGovernanceClusterDir), true)
      assert.equal(existsSync(paths.deadCodeSwarmClusterDir), true)
      assert.equal(existsSync(paths.deprecatedScriptsDateDir), true)
      assert.equal(existsSync(paths.skillsRoot), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
