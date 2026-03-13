import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { initProject } from "../src/cli/init.js"
import { updateProjectSettings } from "../src/cli/settings.js"
import { loadConfig } from "../src/lib/persistence.js"
import { getEffectivePaths } from "../src/lib/paths.js"

describe("settings command support", () => {
  it("updates persisted config and kernel steering files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-settings-"))

    try {
      await initProject(dir, { silent: true })
      const result = await updateProjectSettings(dir, {
        language: "vi",
        governanceMode: "strict",
        expertLevel: "advanced",
        outputStyle: "architecture",
        requireCodeReview: true,
      })

      assert.equal(result.updatedFields.includes("language"), true)
      assert.equal(result.updatedFields.includes("governance_mode"), true)

      const config = await loadConfig(dir)
      assert.equal(config.language, "vi")
      assert.equal(config.governance_mode, "strict")
      assert.equal(config.agent_behavior.expert_level, "advanced")
      assert.equal(config.agent_behavior.output_style, "architecture")
      assert.equal(config.agent_behavior.constraints.require_code_review, true)

      const governanceProjection = JSON.parse(
        await readFile(getEffectivePaths(dir).kernel.governanceConfig, "utf-8"),
      )
      const profileProjection = JSON.parse(
        await readFile(getEffectivePaths(dir).kernel.profileConfig, "utf-8"),
      )
      assert.equal(governanceProjection.governance_mode, "strict")
      assert.equal(profileProjection.chat_language, "vi")
      assert.equal(profileProjection.output_style, "architecture")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
