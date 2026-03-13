import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { initProject } from "../src/cli/init.js"
import { createStateManager, saveConfig } from "../src/lib/persistence.js"
import { getEffectivePaths } from "../src/lib/paths.js"
import { createConfig } from "../src/schemas/config.js"

describe("session kernel init", () => {
  it("creates kernel root projections during fresh init", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-kernel-init-"))

    try {
      await initProject(dir, { silent: true })

      const paths = getEffectivePaths(dir)
      const hiveneuron = JSON.parse(await readFile(paths.kernel.hiveneuron, "utf-8"))
      const hivebrain = await readFile(paths.kernel.hivebrain, "utf-8")
      const sessionMap = JSON.parse(await readFile(paths.kernel.sessionMap, "utf-8"))

      assert.equal(hiveneuron.current_lineage, "hivefiver")
      assert.equal(typeof hiveneuron.active_session_id, "string")
      assert.equal(hiveneuron.active_session_id.startsWith("SES-"), true)
      assert.equal(sessionMap.sessions.length, 1)
      assert.equal(sessionMap.sessions[0].canonical_session_id, hiveneuron.active_session_id)
      assert.match(hivebrain, /# HiveBrain/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("backfills kernel projections for an already-initialized runtime", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-kernel-upgrade-"))

    try {
      const paths = getEffectivePaths(dir)
      await mkdir(paths.stateDir, { recursive: true })
      await saveConfig(dir, createConfig())
      const stateManager = createStateManager(dir)
      const state = await stateManager.initialize("11111111-1111-4111-8111-111111111111", createConfig())

      await initProject(dir, { silent: true })

      const sessionMap = JSON.parse(await readFile(paths.kernel.sessionMap, "utf-8"))
      assert.equal(sessionMap.sessions.length, 1)
      assert.equal(sessionMap.sessions[0].brain_session_id, state.session.id)
      assert.equal(sessionMap.sessions[0].canonical_session_id, `SES-${state.session.id}`)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
