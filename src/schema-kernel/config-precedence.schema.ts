import { z } from "zod"

export const CONFIG_PRECEDENCE_SCHEMA_VERSION = "1.0.0"

// ---------------------------------------------------------------------------
// 1. Config Precedence Level — resolution order for merged config
// ---------------------------------------------------------------------------

/**
 * Validates a config precedence level: any non-empty string. Previously a
 * fixed enum of 8 known levels, now softened to accept future OpenCode
 * config levels without rejecting valid configs.
 *
 * Known values (for reference): managed_preferences, managed_config,
 * inline_config, opencode_dir, project_config, custom_config, global_config,
 * remote_config
 */
export const ConfigPrecedenceLevelSchema = z.string().min(1)

export type ConfigPrecedenceLevel = z.infer<typeof ConfigPrecedenceLevelSchema>

// ---------------------------------------------------------------------------
// 2. Config Source — tracks provenance of a resolved config value
// ---------------------------------------------------------------------------

/**
 * Records where a specific config value originated: the key path,
 * resolved value, precedence level, and optional filesystem path.
 */
export const ConfigSourceSchema = z
  .object({
    key: z.string().min(1),
    value: z.unknown(),
    source: ConfigPrecedenceLevelSchema,
    filePath: z.string().optional(),
  })
  .strict()

export type ConfigSource = z.infer<typeof ConfigSourceSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const ConfigSourceSchemaLenient = ConfigSourceSchema.strip()

export type ConfigSourceLenient = z.infer<typeof ConfigSourceSchemaLenient>

// ---------------------------------------------------------------------------
// 3. OpenCode Config — top-level opencode.json structure
// ---------------------------------------------------------------------------

/**
 * Schema for the `opencode.json` / `opencode.jsonc` configuration file.
 * Sub-sections are intentionally opaque (`z.unknown()`) at this level —
 * dedicated schemas (e.g. `MCPServerRegistrySchema`) validate them when
 * accessed by name.
 */
export const OpenCodeConfigSchema = z
  .object({
    $schema: z.string().optional(),
    agent: z.record(z.string(), z.unknown()).optional(),
    command: z.record(z.string(), z.unknown()).optional(),
    permission: z.record(z.string(), z.unknown()).optional(),
    plugin: z.array(z.string()).optional(),
    mcp: z.record(z.string(), z.unknown()).optional(),
    instructions: z.array(z.string()).optional(),
    default_agent: z.string().optional(),
    theme: z.record(z.string(), z.unknown()).optional(),
    provider: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export type OpenCodeConfig = z.infer<typeof OpenCodeConfigSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const OpenCodeConfigSchemaLenient = OpenCodeConfigSchema.strip()

export type OpenCodeConfigLenient = z.infer<typeof OpenCodeConfigSchemaLenient>
