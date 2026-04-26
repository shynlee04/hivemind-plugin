import { z } from "zod"

export const AGENT_FRONTMATTER_SCHEMA_VERSION = "1.0.0"

// ---------------------------------------------------------------------------
// 1. Agent Name Validation
// ---------------------------------------------------------------------------

/**
 * Validates an OpenCode agent file name: 1–64 chars, lowercase alphanumeric
 * with single hyphen separators. No leading/trailing hyphens, no consecutive
 * hyphens. Matches: my-agent, researcher, gsd-code-fixer.
 */
export const AgentNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Agent name must be lowercase alphanumeric with single hyphen separators, no leading/trailing/consecutive hyphens",
  )

export type AgentName = z.infer<typeof AgentNameSchema>

// ---------------------------------------------------------------------------
// 2. Agent Mode
// ---------------------------------------------------------------------------

/**
 * Determines when the agent is available:
 * - "primary" → top-level conversations only
 * - "subagent" → delegated sub-sessions only
 * - "all" → both (default)
 */
export const AgentModeEnum = z.enum(["primary", "subagent", "all"])

export type AgentMode = z.infer<typeof AgentModeEnum>

// ---------------------------------------------------------------------------
// 3. Agent Frontmatter — YAML frontmatter of an agent .md file
// ---------------------------------------------------------------------------

/**
 * Known theme color names accepted by the OpenCode color field.
 * Agents may use these named colors instead of hex codes.
 */
const THEME_COLOR_NAMES = [
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
  "cyan",
  "magenta",
  "orange",
  "pink",
  "teal",
] as const

/**
 * Validates a color value: either a hex color code (#RGB or #RRGGBB) or
 * a known theme color name.
 */
const ColorSchema = z.string().refine(
  (val) => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(val) ||
    THEME_COLOR_NAMES.includes(val as (typeof THEME_COLOR_NAMES)[number]),
  {
    message: `Must be a hex color (#RGB or #RRGGBB) or a theme color name (${THEME_COLOR_NAMES.join(", ")})`,
  },
)

/**
 * OpenCode agent YAML frontmatter schema. Only `description` is strictly
 * required. Includes backward-compatible deprecated fields (tools, maxSteps)
 * with deprecation-tracking refines that always pass validation.
 */
export const AgentFrontmatterSchema = z
  .object({
    /** Human-readable agent description (triggers @ autocomplete) */
    description: z.string().min(1),

    /** Where this agent can be used: primary, subagent, or both */
    mode: AgentModeEnum.optional(),

    /** Model to use: provider/model-id format (e.g. anthropic/claude-sonnet-4-20250514) */
    model: z.string().optional(),

    /** Default model variant */
    variant: z.string().optional(),

    /** Sampling temperature (0.0 = deterministic, 2.0 = highly random) */
    temperature: z.number().min(0).max(2).optional(),

    /** Nucleus sampling threshold */
    top_p: z.number().min(0).max(1).optional(),

    /** System prompt text; supports {file:./path.txt} syntax */
    prompt: z.string().optional(),

    /** @deprecated Kept for backward compat validation only */
    tools: z.record(z.string(), z.boolean()).optional(),

    /** Disable the agent entirely */
    disable: z.boolean().optional(),

    /** Hide from @ autocomplete */
    hidden: z.boolean().optional(),

    /** Agent-specific additional options */
    options: z.record(z.string(), z.unknown()).optional(),

    /** Display color: hex (#RGB, #RRGGBB) or theme name */
    color: ColorSchema.optional(),

    /** Maximum agentic iteration steps */
    steps: z.number().int().positive().optional(),

    /** @deprecated Use `steps` instead */
    maxSteps: z.number().int().positive().optional(),

    /** Tool permission rules (placeholder until permission.schema.ts exists) */
    permission: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine(
    (_data) => true,
    { message: "Field 'tools' is deprecated — prefer permission rules", path: ["tools"] },
  )
  .refine(
    (_data) => true,
    { message: "Field 'maxSteps' is deprecated — use 'steps' instead", path: ["maxSteps"] },
  )

export type AgentFrontmatter = z.infer<typeof AgentFrontmatterSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const AgentFrontmatterSchemaLenient = AgentFrontmatterSchema.strip()

export type AgentFrontmatterLenient = z.infer<typeof AgentFrontmatterSchemaLenient>

// ---------------------------------------------------------------------------
// 4. Agent File — complete parsed .md file representation
// ---------------------------------------------------------------------------

/**
 * Represents a fully parsed OpenCode agent .md file: the validated YAML
 * frontmatter, the markdown body (system prompt), and the file path.
 */
export const AgentFileSchema = z
  .object({
    frontmatter: AgentFrontmatterSchema,
    body: z.string().min(1),
    filePath: z.string().min(1),
  })
  .strict()

export type AgentFile = z.infer<typeof AgentFileSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const AgentFileSchemaLenient = z
  .object({
    frontmatter: AgentFrontmatterSchemaLenient,
    body: z.string().min(1),
    filePath: z.string().min(1),
  })
  .strip()

export type AgentFileLenient = z.infer<typeof AgentFileSchemaLenient>
