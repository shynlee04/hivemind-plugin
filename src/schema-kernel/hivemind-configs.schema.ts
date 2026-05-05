import { z } from "zod"

export const HIVEMIND_CONFIGS_SCHEMA_VERSION = "1.0.0"

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
// 4. Delegation systems — enabled delegation modes
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
    background_delegation: z.boolean().default(false),
  })
  .default({
    native_task: true,
    delegate_task: true,
    background_delegation: false,
  })

export type DelegationSystems = z.infer<typeof DelegationSystemsSchema>

// ---------------------------------------------------------------------------
// 5. Hivemind configs — top-level .hivemind/configs.json schema
// ---------------------------------------------------------------------------

/**
 * Schema for `.hivemind/configs.json` — the 5-field minimal runtime configuration.
 * Loaded at every front-facing session start and reloaded after each user prompt.
 *
 * Unknown fields are stripped (lenient parsing) to support forward-compatible
 * configs from future versions without rejecting the entire file.
 *
 * @see WS1-01-SPEC.md §3 for the full schema specification.
 *
 * @example
 * ```typescript
 * import { HivemindConfigsSchema, readConfigs } from "./configs.js"
 *
 * // Validate a config object
 * const result = HivemindConfigsSchema.safeParse({
 *   conversationLanguage: "en",
 *   mode: "expert-advisor",
 * })
 *
 * // Read from disk
 * const configs = readConfigs("/path/to/project")
 * ```
 */
export const HivemindConfigsSchema = z
  .object({
    conversationLanguage: SupportedLanguageSchema.default("en"),
    documentsLanguage: SupportedLanguageSchema.default("en"),
    mode: HivemindModeSchema.default("expert-advisor"),
    userExpertLevel: UserExpertLevelSchema.default("intermediate-high-level"),
    delegationSystems: DelegationSystemsSchema,
  })
  .strip()

export type HivemindConfigs = z.infer<typeof HivemindConfigsSchema>

// ---------------------------------------------------------------------------
// 6. Defaults helper
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
// 7. Read/write helpers
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
    const parsed: unknown = JSON.parse(raw)
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
  writeFileSync(configPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8")
  return validated
}
