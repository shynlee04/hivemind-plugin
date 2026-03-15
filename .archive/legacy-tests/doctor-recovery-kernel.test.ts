import assert from "node:assert/strict"
import { mkdtemp, rm, unlink } from "node:fs/promises"
import { existsSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { initProject } from "../src/cli/init.js"
import { runDoctorRecovery } from "../src/lib/doctor-recovery.js"
import { getEffectivePaths } from "../src/lib/paths.js"

describe("doctor recovery kernel integration", () => {
  it("detects and repairs missing kernel surfaces", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-doctor-kernel-"))

    try {
      await initProject(dir, { silent: true })
      const paths = getEffectivePaths(dir)

      await unlink(paths.kernel.hiveneuron)
      await unlink(paths.kernel.hivebrain)

      const report = await runDoctorRecovery(dir, { mode: "report" })
      assert.equal(report.issues.some((issue) => issue.code === "KERNEL_HIVENEURON_MISSING"), true)

      const repair = await runDoctorRecovery(dir, { mode: "repair" })
      assert.equal(existsSync(paths.kernel.hiveneuron), true)
      assert.equal(existsSync(paths.kernel.hivebrain), true)
      assert.equal(typeof repair.kernelSessionId, "string")
      assert.equal(Boolean(repair.metaArtifacts?.healthStatus), true)
      assert.equal(Boolean(repair.metaArtifacts?.diagnosisTracking), true)
      assert.equal(Boolean(repair.metaArtifacts?.metaState), true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
