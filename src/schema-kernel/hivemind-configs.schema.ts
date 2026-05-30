import { z } from "zod"

export const HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"

// ---------------------------------------------------------------------------
// 1. Supported languages — shared enum for conversation and document output
// ---------------------------------------------------------------------------

/**
 * Supported language codes for agent conversation output and artifact generation.
 *
 * @example
 * ```typescript
 * const result = SupportedLanguageSchema.safeParse("en")
 * // result.success === true
 * ```
 */
export const SupportedLanguageSchema = z.enum([
  "en",
  "vi",
  "zh",
  "fr",
  "ja",
  "ko",
  "de",
  "es",
  "th",
  "id",
])

export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>

// ---------------------------------------------------------------------------
// 2. Mode — guardrail intensity level
// ---------------------------------------------------------------------------

/**
 * Hivemind operation mode controlling guardrail intensity.
 *
 * - `expert-advisor`: Agent-led with TDD, spec-driven, research-first, systematic planning.
 * - `hivemind-powered`: Stricter guardrails, hierarchical tracking, cross-context persistence.
 * - `free-style`: Features only available if child control-panes are active or explicitly requested.
 *
 * @example
 * ```typescript
 * const result = HivemindModeSchema.safeParse("expert-advisor")
 * // result.success === true
 * ```
 */
export const HivemindModeSchema = z.enum([
  "expert-advisor",
  "hivemind-powered",
  "free-style",
])

export type HivemindMode = z.infer<typeof HivemindModeSchema>

// ---------------------------------------------------------------------------
// 3. User expert level — output style adaptation
// ---------------------------------------------------------------------------

/**
 * User proficiency level affecting agent output style, jargon level, and elaboration depth.
 *
 * @example
 * ```typescript
 * const result = UserExpertLevelSchema.safeParse("architecture-driven")
 * // result.success === true
 * ```
 */
export const UserExpertLevelSchema = z.enum([
  "clumsy-vibecoder",
  "beginner-friendly",
  "intermediate-high-level",
  "architecture-driven",
  "absolute-expert",
])

export type UserExpertLevel = z.infer<typeof UserExpertLevelSchema>

// ---------------------------------------------------------------------------
// 4. Discuss mode — GSD discuss-phase mode selection
// ---------------------------------------------------------------------------

/**
 * Phase discussion intensity controlling how the discuss-phase skill operates.
 *
 * - `sufficient-phase-discussion`: Gather enough context, then move on.
 * - `intensive-phase-discussion`: Deep exploration before planning.
 * - `skip-phase-discussion`: Skip discussion, go straight to planning.
 *
 * @example
 * ```typescript
 * const result = DiscussModeSchema.safeParse("sufficient-phase-discussion")
 * // result.success === true
 * ```
 */
export const DiscussModeSchema = z.enum([
  "sufficient-phase-discussion",
  "intensive-phase-discussion",
  "skip-phase-discussion",
])

export type DiscussMode = z.infer<typeof DiscussModeSchema>

// ---------------------------------------------------------------------------
// 5. Workflow config — runtime feature toggles
// ---------------------------------------------------------------------------

/**
 * Workflow configuration controlling runtime feature toggles.
 * Each toggle controls a separate runtime feature — implemented as OpenCode primitives,
 * custom tools, engines, or event-hook injections.
 *
 * @example
 * ```typescript
 * const result = WorkflowConfigSchema.safeParse({
 *   research: true,
 *   plan_check: true,
 *   discuss_mode: "sufficient-phase-discussion",
 * })
 * // result.success === true
 * ```
 */
/**
 * Internal workflow config object schema (without outer default).
 * Used to generate a fully-resolved default value for the outer schema.
 *
 * @internal
 */
const WorkflowConfigInnerSchema = z.object({
  research: z.boolean().default(true),
  /** @future-consumer lifecycle-manager.ts — CA-04 */
  cross_session_tasks_dependencies_validation: z.boolean().default(false),
  /** @future-consumer hivemind-trajectory tool — CA-04 */
  trajectory_control: z.boolean().default(false),
  /** @future-consumer continuity.ts — CA-04 */
  advanced_continuity_validation: z.boolean().default(false),
  /** @future-consumer task-status.ts — CA-04 */
  task_plus_enabled: z.boolean().default(false),
  plan_check: z.boolean().default(true),
  verifier: z.boolean().default(true),
  /** @future-consumer sidecar UI (WS-2/WS-8) — Future */
  ui_phase: z.boolean().default(false),
  /** @future-consumer sidecar UI (WS-2/WS-8) — Future */
  ui_safety_gate: z.boolean().default(false),
  /** @future-consumer WS-4 workstream — Future */
  ai_integration_phase: z.boolean().default(false),
  research_before_questions: z.boolean().default(true),
  discuss_mode: DiscussModeSchema.default("sufficient-phase-discussion"),
  use_worktrees: z.boolean().default(false),
})

/**
 * Workflow config schema with a factory default that produces
 * fully-resolved values (satisfies Zod v4 `.default()` type requirements).
 */
export const WorkflowConfigSchema = WorkflowConfigInnerSchema.default(
  () => WorkflowConfigInnerSchema.parse({}),
)

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>

// ---------------------------------------------------------------------------
// 6. Delegation systems — enabled delegation modes
// ---------------------------------------------------------------------------

/**
 * Toggles for available delegation mechanisms.
 *
 * - `native_task`: OpenCode innate task tool (always available).
 * - `delegate_task`: Custom delegation via harness (f-06).
 * - `background_delegation`: Background/async delegation (f-06 advanced).
 *
 * @example
 * ```typescript
 * const result = DelegationSystemsSchema.safeParse({
 *   native_task: true,
 *   delegate_task: true,
 *   background_delegation: false,
 * })
 * // result.success === true
 * ```
 */
export const DelegationSystemsSchema = z
  .object({
    native_task: z.boolean().default(true),
    delegate_task: z.boolean().default(true),
    background_delegation: z.boolean().default(true),
  })
  .default({
    native_task: true,
    delegate_task: true,
    background_delegation: true,
  })

export type DelegationSystems = z.infer<typeof DelegationSystemsSchema>

// ---------------------------------------------------------------------------
// 7. Legacy key migration — camelCase → snake_case
// ---------------------------------------------------------------------------

/**
 * Maps legacy camelCase JSON keys to canonical snake_case keys.
 * Applied during `readConfigs()` to support backward-compatible config files.
 *
 * @example
 * ```typescript
 * // Input: { "conversationLanguage": "en" }
 * // After migration: { "conversation_language": "en" }
 * ```
 */
export const LEGACY_KEY_MAP: Record<string, string> = {
  conversationLanguage: "conversation_language",
  documentsLanguage: "documents_and_artifacts_language",
  documentPaths: "document_paths",
  userExpertLevel: "user_expert_level",
  delegationSystems: "delegation_systems",
} as const

/**
 * Applies legacy camelCase → snake_case key migration to a raw config object.
 * Mutates the input object in-place for efficiency.
 *
 * @param raw - The raw parsed JSON object from configs.json.
 * @returns The same object with legacy keys renamed to snake_case.
 */
export function migrateKeys(raw: Record<string, unknown>): Record<string, unknown> {
  for (const [oldKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
    if (oldKey in raw && !(newKey in raw)) {
      raw[newKey] = raw[oldKey]
      delete raw[oldKey]
    }
  }
  return raw
}

// ---------------------------------------------------------------------------
// 8. Hivemind configs — top-level .hivemind/configs.json schema
// ---------------------------------------------------------------------------

/**
 * Schema for `.hivemind/configs.json` — the full skeleton v2 §9.1 runtime configuration.
 * Loaded at every front-facing session start and reloaded after each user prompt.
 *
 * Unknown fields are stripped (lenient parsing) to support forward-compatible
 * configs from future versions without rejecting the entire file.
 *
 * @see SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2 §9.1 for the full schema specification.
 *
 * @example
 * ```typescript
 * import { HivemindConfigsSchema, readConfigs } from "./configs.js"
 *
 * // Validate a config object
 * const result = HivemindConfigsSchema.safeParse({
 *   conversation_language: "en",
 *   mode: "expert-advisor",
 *   workflow: { research: true, plan_check: true },
 * })
 *
 * // Read from disk
 * const configs = readConfigs("/path/to/project")
 * ```
 */
export const GovernanceRuleSchema = z.object({
  id: z.string(),
  condition: z.object({
    toolNames: z.array(z.string()).optional(),
    sessionIDs: z.array(z.string()).optional(),
  }).catchall(z.unknown()),
  action: z.object({
    type: z.string(), // e.g. "block", "warn", "escalate"
    escalation: z.record(z.string(), z.unknown()).optional(),
  }).catchall(z.unknown()),
  enabled: z.boolean().default(true),
})

export const GovernanceConfigsSchema = z.object({
  rules: z.array(GovernanceRuleSchema).default([]),
})

export const HivemindConfigsSchema = z
  .object({
    conversation_language: SupportedLanguageSchema.default("en"),
    documents_and_artifacts_language: SupportedLanguageSchema.default("en"),
    /**
     * Configurable document path prefixes for language enforcement.
     * Flat array of strings, each relative to project root.
     * Default: [".hivemind/planning/"] — supports recursive subdirectory globbing.
     * @see D-08, D-09, D-10 in BOOT-09-CONTEXT.md
     */
    document_paths: z.array(z.string()).default([".hivemind/planning/"]),
    mode: HivemindModeSchema.default("expert-advisor"),
    user_expert_level: UserExpertLevelSchema.default("intermediate-high-level"),
    delegation_systems: DelegationSystemsSchema,
    parallelization: z.boolean().default(true),
    atomic_commit: z.boolean().default(true),
    commit_docs: z.boolean().default(true),
    workflow: WorkflowConfigSchema,
    governance: GovernanceConfigsSchema.default({ rules: [] }),
  })
  .strip()

export type HivemindConfigs = z.infer<typeof HivemindConfigsSchema>

// ---------------------------------------------------------------------------
// 9. Defaults helper
// ---------------------------------------------------------------------------

/**
 * Returns the default Hivemind configuration object.
 * Equivalent to `HivemindConfigsSchema.parse({})`.
 *
 * @returns Default configuration with all fields set to their default values.
 *
 * @example
 * ```typescript
 * const defaults = getDefaultConfigs()
 * // defaults.conversationLanguage === "en"
 * // defaults.mode === "expert-advisor"
 * ```
 */
export function getDefaultConfigs(): HivemindConfigs {
  return HivemindConfigsSchema.parse({})
}

// ---------------------------------------------------------------------------
// 10. Read/write helpers
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

/**
 * Resolves the canonical path to `.hivemind/configs.json` for a given project root.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns Absolute path to `.hivemind/configs.json`.
 */
export function getConfigsPath(projectRoot: string): string {
  return resolve(projectRoot, ".hivemind", "configs.json")
}

/**
 * Reads and validates `.hivemind/configs.json` from disk. Returns defaults if
 * the file is missing or contains invalid JSON. Unknown fields are silently
 * stripped.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns Validated Hivemind configuration object.
 *
 * @example
 * ```typescript
 * const configs = readConfigs("/path/to/project")
 * console.log(configs.mode) // "expert-advisor"
 * ```
 */
export function readConfigs(projectRoot: string): HivemindConfigs {
  const configPath = getConfigsPath(projectRoot)

  if (!existsSync(configPath)) {
    return getDefaultConfigs()
  }

  try {
    const raw = readFileSync(configPath, "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Apply legacy camelCase → snake_case key migration
    migrateKeys(parsed)

    const result = HivemindConfigsSchema.safeParse(parsed)

    if (result.success) {
      return result.data
    }

    // Invalid schema — return defaults rather than crashing
    return getDefaultConfigs()
  } catch {
    // Corrupt JSON or read error — return defaults
    return getDefaultConfigs()
  }
}

export type ConfigFileValidationResult =
  | { success: true; data: HivemindConfigs }
  | { success: false; error: string }

/**
 * Validate `.hivemind/configs.json` without silently falling back to defaults.
 *
 * This helper is intended for diagnostics such as `hivemind doctor`, where the
 * caller needs a precise success/failure result instead of the lenient runtime
 * fallback behavior used by {@link readConfigs}.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns Explicit validation success or a human-readable failure message.
 *
 * @example
 * ```typescript
 * const result = validateConfigsFile("/path/to/project")
 * if (!result.success) console.error(result.error)
 * ```
 */
export function validateConfigsFile(projectRoot: string): ConfigFileValidationResult {
  const configPath = getConfigsPath(projectRoot)

  if (!existsSync(configPath)) {
    return { success: false, error: `Missing ${configPath}` }
  }

  try {
    const raw = readFileSync(configPath, "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>
    migrateKeys(parsed)
    const result = HivemindConfigsSchema.safeParse(parsed)
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues
          .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
          .join("; "),
      }
    }
    return { success: true, data: result.data }
  } catch (cause) {
    return { success: false, error: cause instanceof Error ? cause.message : String(cause) }
  }
}

/**
 * Validates and writes a Hivemind configuration object to `.hivemind/configs.json`.
 * Creates the parent directory if it does not exist.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param config - Configuration object to validate and persist.
 * @returns The validated configuration that was written.
 * @throws {Error} If the config object fails Zod validation.
 *
 * @example
 * ```typescript
 * const written = writeConfigs("/path/to/project", {
 *   conversationLanguage: "vi",
 *   documentsLanguage: "en",
 *   mode: "hivemind-powered",
 *   userExpertLevel: "architecture-driven",
 *   delegationSystems: {
 *     native_task: true,
 *     delegate_task: true,
 *     background_delegation: true,
 *   },
 * })
 * ```
 */
export function writeConfigs(projectRoot: string, config: HivemindConfigs): HivemindConfigs {
  const validated = HivemindConfigsSchema.parse(config)
  const configPath = getConfigsPath(projectRoot)
  mkdirSync(dirname(configPath), { recursive: true })
  // Always write canonical snake_case JSON keys (schema already uses snake_case)
  writeFileSync(configPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8")
  return validated
}
