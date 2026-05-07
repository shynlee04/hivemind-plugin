import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { z } from "zod"

import {
  HIVEMIND_CONFIGS_SCHEMA_VERSION,
  HivemindConfigsSchema,
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
  required?: string[]
}

type JsonSchemaNode = {
  type?: string
  properties?: Record<string, JsonSchemaNode>
  items?: JsonSchemaNode
  anyOf?: JsonSchemaNode[]
  allOf?: JsonSchemaNode[]
  oneOf?: JsonSchemaNode[]
  required?: string[]
  additionalProperties?: boolean | JsonSchemaNode
  default?: unknown
  enum?: unknown[]
  description?: string
  [key: string]: unknown
}

/**
 * Convert a runtime-oriented JSON Schema tree into the persisted BOOT-02 file contract.
 *
 * The runtime Zod schema applies defaults eagerly, which causes `z.toJSONSchema()`
 * to mark many properties as required. BOOT-02 persists partial config files and
 * applies defaults at read time, so the shipped JSON Schema must expose the full
 * property surface while allowing omitted fields and the `$schema` helper key.
 *
 * @param node - JSON Schema subtree generated from the full runtime contract.
 * @returns A deep-cloned schema subtree adjusted for persisted config files.
 */
function normalizePersistedConfigSchema(node: JsonSchemaNode): JsonSchemaNode {
  const normalized: JsonSchemaNode = { ...node }

  if (normalized.properties !== undefined) {
    normalized.properties = Object.fromEntries(
      Object.entries(normalized.properties).map(([key, value]) => [key, normalizePersistedConfigSchema(value)]),
    )
  }

  if (normalized.items !== undefined) {
    normalized.items = normalizePersistedConfigSchema(normalized.items)
  }

  for (const compositeKey of ["anyOf", "allOf", "oneOf"] as const) {
    const branch = normalized[compositeKey]
    if (Array.isArray(branch)) {
      normalized[compositeKey] = branch.map((entry) => normalizePersistedConfigSchema(entry))
    }
  }

  if (
    normalized.additionalProperties !== undefined
    && typeof normalized.additionalProperties === "object"
    && normalized.additionalProperties !== null
    && !Array.isArray(normalized.additionalProperties)
  ) {
    normalized.additionalProperties = normalizePersistedConfigSchema(normalized.additionalProperties as JsonSchemaNode)
  }

  delete normalized.required
  return normalized
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
  const generated = normalizePersistedConfigSchema(
    z.toJSONSchema(HivemindConfigsSchema) as JsonSchemaNode,
  )

  generated.properties = {
    $schema: {
      type: "string",
      default: "./configs.schema.json",
      description: "Relative path to the shipped Hivemind config JSON Schema.",
    },
    ...(generated.properties ?? {}),
  }

  return {
    $schema: JSON_SCHEMA_DRAFT,
    $id: `https://hivemind.dev/schema/configs/${HIVEMIND_CONFIGS_SCHEMA_VERSION}`,
    title: "Hivemind Configs",
    description: "IDE-facing JSON Schema for .hivemind/configs.json generated from the runtime config contract.",
    ...(generated as Omit<JsonSchema, "$schema" | "$id" | "title" | "description">),
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
