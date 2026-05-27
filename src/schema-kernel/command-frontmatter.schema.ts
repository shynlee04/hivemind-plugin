import { z } from "zod"

export const COMMAND_FRONTMATTER_SCHEMA_VERSION = "1.0.0"

// ---------------------------------------------------------------------------
// 1. Command Name — validates OpenCode command naming conventions
// ---------------------------------------------------------------------------

/**
 * Validates command names: 1–64 chars, lowercase alphanumeric with single
 * hyphens between segments. Same rules as agent names.
 */
export const CommandNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Command name must be lowercase alphanumeric with single hyphens between segments",
  )

export type CommandName = z.infer<typeof CommandNameSchema>

// ---------------------------------------------------------------------------
// 2. Command Frontmatter — YAML frontmatter fields from .md command files
// ---------------------------------------------------------------------------

/**
 * YAML frontmatter extracted from an OpenCode command `.md` file.
 * Only `description` is required; all other fields are optional overrides.
 */
export const CommandFrontmatterSchema = z
  .object({
    description: z.string().min(1),
    agent: z.string().min(1).optional(),
    model: z.string().min(1).optional(),
    subtask: z.boolean().optional(),
    namespace: z.string().min(1).optional(),
    requires: z.array(z.string()).optional(),
    tools: z.record(z.string(), z.any()).optional(),
  })
  .strict()

export type CommandFrontmatter = z.infer<typeof CommandFrontmatterSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const CommandFrontmatterSchemaLenient = CommandFrontmatterSchema.strip()

export type CommandFrontmatterLenient = z.infer<typeof CommandFrontmatterSchemaLenient>

// ---------------------------------------------------------------------------
// 3. Command Template Syntax — detects special syntax in the template body
// ---------------------------------------------------------------------------

/**
 * Informational scan result: which OpenCode template syntax features are
 * present in the command body. Used for validation warnings, not blocking.
 */
export const CommandTemplateFeaturesSchema = z
  .object({
    has_arguments: z.boolean(),
    has_positional_params: z.boolean(),
    positional_indices: z.array(z.number().int().min(1).max(9)),
    has_bash_injection: z.boolean(),
    has_file_injection: z.boolean(),
    has_file_reference: z.boolean(),
    bash_injection_count: z.number().int().nonnegative(),
    file_injection_count: z.number().int().nonnegative(),
    file_reference_count: z.number().int().nonnegative(),
  })
  .strict()

export type CommandTemplateFeatures = z.infer<typeof CommandTemplateFeaturesSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const CommandTemplateFeaturesSchemaLenient = CommandTemplateFeaturesSchema.strip()

export type CommandTemplateFeaturesLenient = z.infer<typeof CommandTemplateFeaturesSchemaLenient>

// ---------------------------------------------------------------------------
// 4. Command File — complete parsed command `.md` file
// ---------------------------------------------------------------------------

/**
 * Fully parsed command `.md` file: validated frontmatter, raw template
 * body, and source file path for traceability.
 */
export const CommandFileSchema = z
  .object({
    frontmatter: CommandFrontmatterSchema,
    body: z.string().min(1),
    filePath: z.string().min(1),
  })
  .strict()

export type CommandFile = z.infer<typeof CommandFileSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const CommandFileSchemaLenient = z
  .object({
    frontmatter: CommandFrontmatterSchemaLenient,
    body: z.string().min(1),
    filePath: z.string().min(1),
  })
  .strip()

export type CommandFileLenient = z.infer<typeof CommandFileSchemaLenient>
