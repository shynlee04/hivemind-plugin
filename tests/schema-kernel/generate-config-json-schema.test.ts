import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import { describe, expect, it } from "vitest"

import {
  generateHivemindConfigsJsonSchema,
  writeConfigJsonSchema,
} from "../../src/schema-kernel/generate-config-json-schema.js"
import { DEFAULT_CONFIG_JSON } from "../../src/lib/bootstrap-structure.js"

function validateSampleAgainstGeneratedSchema(sample: unknown, schema: Record<string, unknown>): void {
  const assertNode = (value: unknown, node: Record<string, unknown>, path: string): void => {
    const nodeType = node.type
    if (nodeType === "object") {
      expect(value, `${path} should be an object`).toSatisfy((candidate) => typeof candidate === "object" && candidate !== null && !Array.isArray(candidate))
      const recordValue = value as Record<string, unknown>
      const properties = (node.properties ?? {}) as Record<string, Record<string, unknown>>
      const additionalProperties = node.additionalProperties
      for (const key of Object.keys(recordValue)) {
        expect(
          properties[key] !== undefined || additionalProperties === true,
          `${path}.${key} must be declared in generated schema`,
        ).toBe(true)
      }
      for (const [propertyName, propertySchema] of Object.entries(properties)) {
        if (recordValue[propertyName] !== undefined) {
          assertNode(recordValue[propertyName], propertySchema, `${path}.${propertyName}`)
        }
      }
      return
    }

    if (nodeType === "string") {
      expect(typeof value, `${path} should be a string`).toBe("string")
      if (Array.isArray(node.enum)) {
        expect(node.enum).toContain(value)
      }
      return
    }

    if (nodeType === "boolean") {
      expect(typeof value, `${path} should be a boolean`).toBe("boolean")
    }
  }

  assertNode(sample, schema, "$")
}

describe("generate-config-json-schema", () => {
  it("returns a deterministic schema object with BOOT-02 contract properties", () => {
    const schema = generateHivemindConfigsJsonSchema()

    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema")
    expect(schema.type).toBe("object")
    expect(schema.properties).toMatchObject({
      $schema: { type: "string", default: "./configs.schema.json" },
      conversation_language: { type: "string", default: "en" },
      documents_and_artifacts_language: { type: "string", default: "en" },
      mode: { type: "string", default: "expert-advisor" },
      user_expert_level: { type: "string", default: "intermediate-high-level" },
      delegation_systems: { type: "object" },
      parallelization: { type: "boolean", default: true },
      atomic_commit: { type: "boolean", default: true },
      commit_docs: { type: "boolean", default: true },
      workflow: { type: "object" },
    })
    expect(schema.required).toBeUndefined()
    expect((schema.properties?.workflow as { required?: string[] }).required).toBeUndefined()
    expect((schema.properties?.delegation_systems as { required?: string[] }).required).toBeUndefined()
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
      expect(written.properties).toHaveProperty("parallelization")
      expect(written.properties).toHaveProperty("atomic_commit")
      expect(written.properties).toHaveProperty("commit_docs")
      expect(written.properties).toHaveProperty("workflow")
      expect(written.properties).toHaveProperty("$schema")
    } finally {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })

  it("accepts the exact non-interactive default config file shape under the generated schema", () => {
    const schema = generateHivemindConfigsJsonSchema() as Record<string, unknown>
    const defaultConfig = JSON.parse(DEFAULT_CONFIG_JSON) as Record<string, unknown>
    validateSampleAgainstGeneratedSchema(defaultConfig, schema)
  })

  it("accepts an interactive partial config file under the generated schema", () => {
    const schema = generateHivemindConfigsJsonSchema() as Record<string, unknown>
    const interactivePartial = {
      $schema: "./configs.schema.json",
      mode: "hivemind-powered",
      delegation_systems: {
        native_task: true,
      },
      workflow: {
        research: true,
        discuss_mode: "intensive-phase-discussion",
      },
    }

    validateSampleAgainstGeneratedSchema(interactivePartial, schema)
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
