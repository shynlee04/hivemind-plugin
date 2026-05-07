import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

import {
  HIVEMIND_CONFIGS_SCHEMA_VERSION,
  SupportedLanguageSchema,
  HivemindModeSchema,
  UserExpertLevelSchema,
} from "./hivemind-configs.schema.js"

const CONFIG_JSON_SCHEMA_FILENAME = "configs.schema.json"
const JSON_SCHEMA_DRAFT = "https://json-schema.org/draft/2020-12/schema"

type JsonSchema = {
  $schema: string
  $id: string
  title: string
  description: string
  type: "object"
  additionalProperties: boolean
  properties: Record<string, unknown>
}

function getEnumValues(schema: { options: readonly string[] }): string[] {
  return [...schema.options]
}

/**
 * Generate the shipped JSON Schema contract for `.hivemind/configs.json`.
 *
 * The schema is derived from the existing Zod config source of truth and kept
 * intentionally deterministic so `npm run build` can safely regenerate the
 * committed artifact without introducing dependency drift.
 *
 * @returns A JSON-serializable schema object for `.hivemind/configs.json`.
 *
 * @example
 * ```ts
 * const schema = generateHivemindConfigsJsonSchema()
 * console.log(schema.properties.conversation_language)
 * ```
 */
export function generateHivemindConfigsJsonSchema(): JsonSchema {
  return {
    $schema: JSON_SCHEMA_DRAFT,
    $id: `https://hivemind.dev/schema/configs/${HIVEMIND_CONFIGS_SCHEMA_VERSION}`,
    title: "Hivemind Configs",
    description: "IDE-facing JSON Schema for .hivemind/configs.json generated from the runtime config contract.",
    type: "object",
    additionalProperties: true,
    properties: {
      conversation_language: {
        type: "string",
        enum: getEnumValues(SupportedLanguageSchema),
        default: "en",
      },
      documents_and_artifacts_language: {
        type: "string",
        enum: getEnumValues(SupportedLanguageSchema),
        default: "en",
      },
      mode: {
        type: "string",
        enum: getEnumValues(HivemindModeSchema),
        default: "expert-advisor",
      },
      user_expert_level: {
        type: "string",
        enum: getEnumValues(UserExpertLevelSchema),
        default: "intermediate-high-level",
      },
      delegation_systems: {
        type: "object",
        additionalProperties: false,
        properties: {
          native_task: { type: "boolean", default: true },
          delegate_task: { type: "boolean", default: true },
          background_delegation: { type: "boolean", default: false },
        },
      },
    },
  }
}

/**
 * Write the generated config JSON Schema to `<projectRoot>/.hivemind/configs.schema.json`.
 *
 * This helper only writes the schema artifact path owned by BOOT-02. It creates
 * the parent `.hivemind/` directory when needed and does not modify any other files.
 *
 * @param projectRoot - Absolute or cwd-relative project root that should receive the schema artifact.
 * @returns The absolute path written to disk.
 *
 * @example
 * ```ts
 * const outputPath = writeConfigJsonSchema(process.cwd())
 * console.log(outputPath)
 * ```
 */
export function writeConfigJsonSchema(projectRoot = process.cwd()): string {
  const outputPath = resolve(projectRoot, ".hivemind", CONFIG_JSON_SCHEMA_FILENAME)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(
    outputPath,
    `${JSON.stringify(generateHivemindConfigsJsonSchema(), null, 2)}\n`,
    "utf8",
  )
  return outputPath
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeConfigJsonSchema()
}
