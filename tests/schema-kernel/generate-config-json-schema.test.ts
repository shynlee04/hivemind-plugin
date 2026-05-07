import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, expect, it } from "vitest"

import {
  generateHivemindConfigsJsonSchema,
  writeConfigJsonSchema,
} from "../../src/schema-kernel/generate-config-json-schema.js"

describe("generate-config-json-schema", () => {
  it("returns a deterministic schema object with BOOT-02 contract properties", () => {
    const schema = generateHivemindConfigsJsonSchema()

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema")
    expect(schema.type).toBe("object")
    expect(schema.properties).toMatchObject({
      conversation_language: { type: "string", default: "en" },
      documents_and_artifacts_language: { type: "string", default: "en" },
      mode: { type: "string", default: "expert-advisor" },
      user_expert_level: { type: "string", default: "intermediate-high-level" },
      delegation_systems: { type: "object" },
    })
  })

  it("writes valid JSON to a temp project root without touching repository state", () => {
    const tempRoot = mkdtempSync(join(tmpdir(), "hivemind-config-schema-"))

    try {
      const outputPath = writeConfigJsonSchema(tempRoot)
      expect(outputPath).toBe(join(tempRoot, ".hivemind", "configs.schema.json"))

      const written = JSON.parse(readFileSync(outputPath, "utf8")) as {
        properties?: Record<string, unknown>
      }

      expect(written.properties).toHaveProperty("conversation_language")
      expect(written.properties).toHaveProperty("documents_and_artifacts_language")
      expect(written.properties).toHaveProperty("mode")
      expect(written.properties).toHaveProperty("user_expert_level")
      expect(written.properties).toHaveProperty("delegation_systems")
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })

  it("documents build wiring and shipped artifact metadata for BOOT-02", async () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
    ) as {
      scripts?: Record<string, string>
      files?: string[]
    }

    expect(packageJson.scripts?.build).toContain("node dist/schema-kernel/generate-config-json-schema.js")
    expect(packageJson.files).toContain(".hivemind/configs.schema.json")
  })
})
