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
  examples?: unknown[]
  [key: string]: unknown
}

/**
 * Enrichment metadata for each config property.
 * Adds examples and recommendedFor to the generated JSON Schema.
 */
const PROPERTY_ENRICHMENTS: Record<string, { examples?: unknown[]; recommendedFor?: string[] }> = {
  // Root fields
  "$schema": {
    examples: ["./configs.schema.json"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  conversation_language: {
    examples: ["en", "vi", "zh"],
    recommendedFor: ["multilang-vi", "multilang-en", "solo-vibecoder"],
  },
  documents_and_artifacts_language: {
    examples: ["en", "vi", "fr"],
    recommendedFor: ["multilang-vi", "multilang-en", "team-mid"],
  },
  document_paths: {
    examples: [[".planning/"], [".planning/", "docs/"]],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  mode: {
    examples: ["expert-advisor", "hivemind-powered"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  user_expert_level: {
    examples: ["intermediate-high-level", "architecture-driven"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },

  // Delegation
  delegation_systems: {
    examples: [{ native_task: true, delegate_task: true, background_delegation: true }],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "delegation_systems.native_task": {
    examples: [true, false],
    recommendedFor: ["solo-vibecoder", "team-mid"],
  },
  "delegation_systems.delegate_task": {
    examples: [true, false],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "delegation_systems.background_delegation": {
    examples: [true, false],
    recommendedFor: ["enterprise-architect", "research-heavy"],
  },

  // Workflow
  workflow: {
    examples: [{ research: true, plan_check: true, verifier: true, discuss_mode: "sufficient-phase-discussion" }],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  parallelization: {
    examples: [true, false],
    recommendedFor: ["team-mid", "enterprise-architect", "fast-iteration"],
  },
  atomic_commit: {
    examples: [true, false],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  commit_docs: {
    examples: [true, false],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },

  // Workflow toggles
  "workflow.research": {
    examples: [true, false],
    recommendedFor: ["research-heavy", "team-mid", "enterprise-architect"],
  },
  "workflow.cross_session_tasks_dependencies_validation": {
    examples: [false, true],
    recommendedFor: ["enterprise-architect"],
  },
  "workflow.trajectory_control": {
    examples: [false, true],
    recommendedFor: ["enterprise-architect", "research-heavy"],
  },
  "workflow.advanced_continuity_validation": {
    examples: [false, true],
    recommendedFor: ["enterprise-architect"],
  },
  "workflow.task_plus_enabled": {
    examples: [false, true],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "workflow.plan_check": {
    examples: [true, false],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "workflow.verifier": {
    examples: [true, false],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "workflow.ui_phase": {
    examples: [false, true],
    recommendedFor: ["team-mid"],
  },
  "workflow.ui_safety_gate": {
    examples: [false, true],
    recommendedFor: ["team-mid"],
  },
  "workflow.ai_integration_phase": {
    examples: [false, true],
    recommendedFor: ["research-heavy", "enterprise-architect"],
  },
  "workflow.research_before_questions": {
    examples: [true, false],
    recommendedFor: ["research-heavy", "team-mid"],
  },
  "workflow.discuss_mode": {
    examples: ["sufficient-phase-discussion", "intensive-phase-discussion", "skip-phase-discussion"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "workflow.use_worktrees": {
    examples: [false, true],
    recommendedFor: ["enterprise-architect", "fast-iteration"],
  },
  "workflow.intent_lock": {
    examples: [{ enabled: false }],
    recommendedFor: ["enterprise-architect"],
  },
  "workflow.intent_lock.enabled": {
    examples: [false, true],
    recommendedFor: ["enterprise-architect"],
  },

  // Governance
  governance: {
    examples: [{ rules: [], default_action: "allow", hardcoded_gates: { manual_state_writes: "warn" } }],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.rules": {
    examples: [[{ id: "example-rule", condition: { toolNames: ["bash"] }, action: { type: "allow" }, enabled: true }]],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.default_action": {
    examples: ["allow", "warn", "block"],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.write_denylist_override": {
    examples: ["disabled", [".env*", "*.key"]],
    recommendedFor: ["enterprise-architect"],
  },
  "governance.hardcoded_gates": {
    examples: [{ manual_state_writes: "warn" }],
    recommendedFor: ["enterprise-architect"],
  },
  "governance.hardcoded_gates.manual_state_writes": {
    examples: ["warn", "block", "allow"],
    recommendedFor: ["enterprise-architect"],
  },
  "governance.naming_standards": {
    examples: [{ allowed_frameworks: ["hm", "hf"], naming_format: "{framework}-{purpose}" }],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.naming_standards.allowed_frameworks": {
    examples: [["hm", "hf", "gate", "stack"]],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.naming_standards.allowed_classifications": {
    examples: [["root", "child", "grandchild", "fork"]],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.naming_standards.naming_format": {
    examples: ["{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}"],
    recommendedFor: ["enterprise-architect"],
  },
  "governance.naming_standards.max_title_length": {
    examples: [80, 120],
    recommendedFor: ["enterprise-architect"],
  },
  "governance.agent_configs": {
    examples: [{ "hm-executor": { description: "Executes PLAN.md tasks atomically" } }],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.command_agent_mappings": {
    examples: [{ "hm-execute": { agent: "hm-executor", description: "Execute phase plans" } }],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.templates": {
    examples: [{ "audit-brief": { content: "Audit the following: {{brief}}" } }],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },
  "governance.tool_registry": {
    examples: [{ "delegate-task": { name: "delegate-task", description: "Delegate work", permissions: ["delegate"] } }],
    recommendedFor: ["team-mid", "enterprise-architect"],
  },

  // Behavioral (root-level legacy)
  guardrail_level: {
    examples: ["moderate", "strict", "permissive"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  delegation_mode: {
    examples: ["waiter", "direct", "autonomous"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  tool_access_pattern: {
    examples: ["standard", "restricted", "full"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  skill_filter: {
    examples: ["curated", "domain", "full"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },

  // Behavioral (nested)
  behavioral: {
    examples: [{ guardrail_level: "moderate", delegation_mode: "waiter", communication_style: "mixed" }],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "behavioral.guardrail_level": {
    examples: ["moderate", "strict", "permissive"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "behavioral.delegation_mode": {
    examples: ["waiter", "direct", "autonomous"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "behavioral.tool_access_pattern": {
    examples: ["standard", "restricted", "full"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "behavioral.skill_filter": {
    examples: ["curated", "domain", "full"],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "behavioral.communication_style": {
    examples: ["mixed", "concise", "detailed"],
    recommendedFor: ["solo-vibecoder", "team-mid"],
  },
  "behavioral.decision_speed": {
    examples: ["fast", "deliberate"],
    recommendedFor: ["solo-vibecoder", "fast-iteration"],
  },
  "behavioral.expertise": {
    examples: ["mid", "junior", "senior"],
    recommendedFor: ["solo-vibecoder", "team-mid"],
  },

  // Language (nested)
  language: {
    examples: [{ conversation: "en", documents: "en" }],
    recommendedFor: ["multilang-vi", "multilang-en", "team-mid"],
  },
  "language.conversation": {
    examples: ["en", "vi"],
    recommendedFor: ["multilang-vi", "multilang-en"],
  },
  "language.documents": {
    examples: ["en", "vi"],
    recommendedFor: ["multilang-vi", "multilang-en"],
  },

  // Runtime (nested)
  runtime: {
    examples: [{ communication_style: "mixed", decision_speed: "fast", expertise: "mid" }],
    recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
  },
  "runtime.communication_style": {
    examples: ["mixed", "concise", "detailed"],
    recommendedFor: ["solo-vibecoder", "team-mid"],
  },
  "runtime.decision_speed": {
    examples: ["fast", "deliberate"],
    recommendedFor: ["solo-vibecoder", "fast-iteration"],
  },
  "runtime.expertise": {
    examples: ["mid", "junior", "senior"],
    recommendedFor: ["solo-vibecoder", "team-mid"],
  },
}

/**
 * Recursively enrich a JSON Schema node with examples and recommendedFor metadata.
 * Traverses properties, items, and composite schemas (anyOf/allOf/oneOf).
 */
function enrichSchemaNode(
  node: JsonSchemaNode,
  path: string[],
): JsonSchemaNode {
  const enriched = { ...node }

  // Enrich current node if we have metadata for this path
  const pathKey = path.join(".")
  const metadata = PROPERTY_ENRICHMENTS[pathKey]
  if (metadata) {
    if (metadata.examples !== undefined) {
      enriched.examples = metadata.examples
    }
    if (metadata.recommendedFor !== undefined) {
      enriched.recommendedFor = metadata.recommendedFor
    }
  }

  // Recurse into properties
  if (enriched.properties !== undefined) {
    enriched.properties = Object.fromEntries(
      Object.entries(enriched.properties).map(([key, value]) => [
        key,
        enrichSchemaNode(value as JsonSchemaNode, [...path, key]),
      ]),
    )
  }

  // Recurse into items
  if (enriched.items !== undefined && typeof enriched.items === "object") {
    enriched.items = enrichSchemaNode(enriched.items as JsonSchemaNode, [...path, "items"])
  }

  // Recurse into composite schemas
  for (const compositeKey of ["anyOf", "allOf", "oneOf"] as const) {
    const branch = enriched[compositeKey]
    if (Array.isArray(branch)) {
      enriched[compositeKey] = branch.map((entry) =>
        enrichSchemaNode(entry as JsonSchemaNode, path),
      )
    }
  }

  return enriched
}

/**
 * Enrich the generated JSON Schema with examples and recommendedFor metadata.
 * Applies PROPERTY_ENRICHMENTS to the appropriate schema nodes.
 */
function enrichWithExamples(schema: JsonSchema): JsonSchema {
  return enrichSchemaNode(schema as unknown as JsonSchemaNode, []) as unknown as JsonSchema
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
      examples: ["./configs.schema.json"],
      recommendedFor: ["solo-vibecoder", "team-mid", "enterprise-architect"],
    },
    ...(generated.properties ?? {}),
  }

  const enriched = enrichWithExamples({
    $schema: JSON_SCHEMA_DRAFT,
    $id: `https://hivemind.dev/schema/configs/${HIVEMIND_CONFIGS_SCHEMA_VERSION}`,
    title: "Hivemind Configs",
    description: "IDE-facing JSON Schema for .hivemind/configs.json generated from the runtime config contract.",
    ...(generated as Omit<JsonSchema, "$schema" | "$id" | "title" | "description">),
  })

  return enriched
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
