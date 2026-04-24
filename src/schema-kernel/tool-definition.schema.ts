import { z } from "zod"

// ---------------------------------------------------------------------------
// 1. Tool Name — kebab-case identifier
// ---------------------------------------------------------------------------

/**
 * Validates a tool name: 1–64 characters, lowercase kebab-case
 * (letters, digits, hyphens; must start with a letter).
 */
export const ToolNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(
    /^[a-z][a-z0-9-]*$/,
    "Tool name must be kebab-case: lowercase, start with a letter, digits and hyphens allowed",
  )

export type ToolName = z.infer<typeof ToolNameSchema>

// ---------------------------------------------------------------------------
// 2. Tool Definition — structural shape of a custom tool
// ---------------------------------------------------------------------------

/**
 * Structural representation of an OpenCode custom tool as defined in a
 * `.opencode/tools/*.ts` file. Argument schemas are opaque (`z.unknown()`)
 * at this level — actual Zod schema objects are not serialisable.
 */
export const ToolDefinitionSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    args: z.record(z.string(), z.unknown()),
    hasExecute: z.boolean(),
    filePath: z.string().min(1),
    exports: z.array(z.string()),
  })
  .strict()

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>

// ---------------------------------------------------------------------------
// 3. Tool File — complete tool file representation
// ---------------------------------------------------------------------------

/**
 * Complete tool file representation: the parsed definition plus the
 * resolved filesystem path to the TypeScript source.
 */
export const ToolFileSchema = z
  .object({
    definition: ToolDefinitionSchema,
    sourcePath: z.string().min(1),
  })
  .strict()

export type ToolFile = z.infer<typeof ToolFileSchema>
