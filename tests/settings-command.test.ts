import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, it } from "node:test"

import { initProject } from "../src/cli/init.js"
import { runSettingsCommand, updateProjectSettings } from "../src/cli/settings.js"
import { getConfigPath } from "../src/shared/paths.js"
import { loadRuntimeAttachmentSettings } from "../src/shared/runtime-attachment.js"

describe("settings command support", () => {
  it("updates persisted config and kernel steering files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-settings-"))

    try {
      await initProject(dir, { presetId: "guided-onboarding", silent: true })
      const result = await updateProjectSettings(dir, {
        language: "vi",
        governanceMode: "strict",
        expertLevel: "advanced",
        outputStyle: "architecture",
      })

      assert.equal(result.updatedFields.includes("language"), true)
      assert.equal(result.updatedFields.includes("governanceMode"), true)

      const settings = await loadRuntimeAttachmentSettings(dir)
      const persisted = JSON.parse(
        await readFile(getConfigPath(dir, "runtime-attachment.json"), "utf-8"),
      ) as {
        language: string
        governanceMode: string
        expertLevel: string
        outputStyle: string
      }
      assert.equal(settings.language, "vi")
      assert.equal(settings.governanceMode, "strict")
      assert.equal(settings.expertLevel, "advanced")
      assert.equal(settings.outputStyle, "architecture")
      assert.equal(persisted.language, "vi")
      assert.equal(persisted.governanceMode, "strict")
      assert.equal(persisted.expertLevel, "advanced")
      assert.equal(persisted.outputStyle, "architecture")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("runs hm-settings through the canonical command bundle and returns changed fields", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-settings-command-"))

    try {
      await initProject(dir, {
        presetId: "guided-onboarding",
        silent: true,
      })

      const result = await runSettingsCommand(dir, {
        sessionId: "ses_settings",
        language: "vi",
        artifactLanguage: "en",
      })

      assert.equal(result.executionMode, "handler")
      assert.deepEqual(result.report.changed_fields, ["chatLanguage"])
      assert.equal((result.report.updated_settings as { chatLanguage: string }).chatLanguage, "vi")
      assert.equal((result.report.updated_settings as { artifactLanguage: string }).artifactLanguage, "en")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it("fails fast when hm-settings CLI parity has neither explicit deltas nor preset", async () => {
    const dir = await mkdtemp(join(tmpdir(), "hm-settings-empty-"))

    try {
      await initProject(dir, {
        presetId: "guided-onboarding",
        silent: true,
      })

      await assert.rejects(
        () => runSettingsCommand(dir, {
          sessionId: "ses_settings_empty",
        }),
        /hm-settings requires explicit profile intake before execution/,
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
