import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { syncRuntimeSurface } from "../src/cli/runtime-assets.js"
import { HiveMindPlugin } from "../src/index.js"

describe("runtime entry attachment", () => {
  it("syncs project-level OpenCode assets for downstream project installs", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-runtime-surface-"))

    try {
      const result = await syncRuntimeSurface(dir)
      const pluginSource = await readFile(result.pluginFile, "utf-8")
      const configSource = await readFile(join(dir, "opencode.json"), "utf-8")

      assert.match(pluginSource, /hivemind-context-governance\/plugin/)
      assert.equal(result.mirroredCommandFiles.some((file) => file.endsWith("hm-init.md")), true)
      assert.equal(result.mirroredCommandFiles.some((file) => file.endsWith("hm-plan.md")), true)
      assert.equal(result.mirroredAgentFiles.some((file) => file.endsWith("hivefiver.md")), true)
      assert.equal(JSON.parse(configSource).plugin.length, 0)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("re-exports the OpenCode plugin from the package root", () => {
    assert.equal(typeof HiveMindPlugin, "function")
  })
})
