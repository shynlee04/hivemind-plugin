import { z } from "zod"

export const SKILL_METADATA_SCHEMA_VERSION = "1.0.0"

// ---------------------------------------------------------------------------
// 1. Skill Name — kebab-case identifier for OpenCode skills
// ---------------------------------------------------------------------------

/**
 * Validates skill naming: 1–64 chars, lowercase alphanumeric with single
 * hyphen separators, no leading/trailing/consecutive hyphens.
 */
export const SkillNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Skill name must be kebab-case (lowercase alphanumeric, single hyphen separators, no leading/trailing hyphens)",
  )

export type SkillName = z.infer<typeof SkillNameSchema>

// ---------------------------------------------------------------------------
// 2. Skill Frontmatter — YAML frontmatter fields in SKILL.md
// ---------------------------------------------------------------------------

/**
 * YAML frontmatter schema for SKILL.md files. The `name` field must be
 * valid kebab-case and must match the directory name containing the file.
 */
export const SkillFrontmatterSchema = z
  .object({
    name: SkillNameSchema,
    description: z.string().min(1).max(1024),
    license: z.string().optional(),
    compatibility: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const SkillFrontmatterSchemaLenient = SkillFrontmatterSchema.strip()

export type SkillFrontmatterLenient = z.infer<typeof SkillFrontmatterSchemaLenient>

// ---------------------------------------------------------------------------
// 3. Skill File — complete SKILL.md file representation
// ---------------------------------------------------------------------------

/**
 * Complete SKILL.md file: frontmatter + markdown body + filesystem context.
 * Enforces that frontmatter.name matches the directory name.
 */
export const SkillFileSchema = z
  .object({
    frontmatter: SkillFrontmatterSchema,
    body: z.string().min(1),
    directoryName: SkillNameSchema,
    skillPath: z.string().min(1),
  })
  .strict()
  .refine(
    (data) => data.frontmatter.name === data.directoryName,
    {
      message: "frontmatter.name must match the directory name",
      path: ["frontmatter", "name"],
    },
  )

export type SkillFile = z.infer<typeof SkillFileSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const SkillFileSchemaLenient = z
  .object({
    frontmatter: SkillFrontmatterSchemaLenient,
    body: z.string().min(1),
    directoryName: SkillNameSchema,
    skillPath: z.string().min(1),
  })
  .strip()
  .refine(
    (data) => data.frontmatter.name === data.directoryName,
    {
      message: "frontmatter.name must match the directory name",
      path: ["frontmatter", "name"],
    },
  )

export type SkillFileLenient = z.infer<typeof SkillFileSchemaLenient>

// ---------------------------------------------------------------------------
// 4. Skill Discovery Location — where skills can be found (priority order)
// ---------------------------------------------------------------------------

/**
 * Ordered discovery locations for OpenCode skills, from project-local to
 * global user directories.
 */
export const SkillDiscoveryLocationSchema = z.enum([
  "project", // .opencode/skills/<name>/SKILL.md
  "global", // ~/.config/opencode/skills/<name>/SKILL.md
  "claude", // .claude/skills/<name>/SKILL.md
  "claude-global", // ~/.claude/skills/<name>/SKILL.md
  "agents", // .agents/skills/<name>/SKILL.md
  "agents-global", // ~/.agents/skills/<name>/SKILL.md
])

export type SkillDiscoveryLocation = z.infer<typeof SkillDiscoveryLocationSchema>
