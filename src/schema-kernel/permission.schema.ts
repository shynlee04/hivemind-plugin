import { z } from "zod"

export const PERMISSION_SCHEMA_VERSION = "1.0.0"

// ---------------------------------------------------------------------------
// 1. Permission Actions — allowed values for any permission rule
// ---------------------------------------------------------------------------

/** Three-state permission action: allow, ask for approval, or deny outright. */
export const PermissionActionSchema = z.enum(["allow", "ask", "deny"])

export type PermissionAction = z.infer<typeof PermissionActionSchema>

// ---------------------------------------------------------------------------
// 2. Permission Keys — known tool/operation identifiers
// ---------------------------------------------------------------------------

/**
 * Validates a permission key: any non-empty string. Previously a fixed enum
 * of 14 known keys, now softened to accept future OpenCode permission keys
 * without rejecting valid configs.
 *
 * Known values (for reference): read, edit, glob, grep, bash, task, skill,
 * lsp, question, webfetch, websearch, codesearch, external_directory, doom_loop
 */
export const PermissionKeySchema = z.string().min(1)

export type PermissionKey = z.infer<typeof PermissionKeySchema>

// ---------------------------------------------------------------------------
// 3. Pattern Entry — glob/wildcard pattern → action mapping
// ---------------------------------------------------------------------------

/**
 * A single pattern-to-action mapping used inside a pattern-based permission
 * block. Keys are glob-style patterns (`"git *"`, `"*"`, `"internal-*"`);
 * last (most specific) match wins.
 */
export const PatternEntrySchema = z.record(z.string(), PermissionActionSchema)

// ---------------------------------------------------------------------------
// 4. Permission Rule — structured rule entry
// ---------------------------------------------------------------------------

/**
 * A single structured permission rule: permission key + action + pattern.
 * Used in the rules-based permission format.
 */
export const PermissionRuleSchema = z
  .object({
    permission: z.string().min(1),
    action: PermissionActionSchema,
    pattern: z.string().min(1),
  })
  .strict()

export type PermissionRule = z.infer<typeof PermissionRuleSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const PermissionRuleSchemaLenient = PermissionRuleSchema.strip()

export type PermissionRuleLenient = z.infer<typeof PermissionRuleSchemaLenient>

// ---------------------------------------------------------------------------
// 5. Pattern-Based Permissions — key → { pattern → action }
// ---------------------------------------------------------------------------

/**
 * Pattern-based permission format. Each permission key maps to a dictionary
 * of glob patterns → actions. The `"*"` wildcard is the default; last
 * (most specific) match wins.
 */
export const PatternBasedPermissionSchema = z.record(
  PermissionKeySchema,
  PatternEntrySchema,
)

export type PatternBasedPermissions = z.infer<typeof PatternBasedPermissionSchema>

// ---------------------------------------------------------------------------
// 6. Rules-Based Permissions — { rules: [...] }
// ---------------------------------------------------------------------------

/**
 * Rules-based permission format. An ordered list of {permission, action,
 * pattern} tuples evaluated top-to-bottom.
 */
export const RulesBasedPermissionSchema = z
  .object({
    rules: z.array(PermissionRuleSchema),
  })
  .strict()

export type RulesBasedPermissions = z.infer<typeof RulesBasedPermissionSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const RulesBasedPermissionSchemaLenient = z
  .object({
    rules: z.array(PermissionRuleSchemaLenient),
  })
  .strip()

export type RulesBasedPermissionsLenient = z.infer<typeof RulesBasedPermissionSchemaLenient>

// ---------------------------------------------------------------------------
// 7. Permission Ruleset — union of both formats (+ combination)
// ---------------------------------------------------------------------------

/**
 * A complete permission ruleset: may be purely pattern-based, purely
 * rules-based, or a combination (pattern keys with an optional `"rules"`
 * key). The combination variant is expressed as a passthrough object
 * that permits any PermissionKey keys (each mapping to pattern entries)
 * alongside an optional `rules` array.
 */
export const PermissionRulesetSchema = z.union([
  PatternBasedPermissionSchema,
  RulesBasedPermissionSchema,
  // Combination: pattern-based keys + optional "rules" array + optional compatibility version
  z.object({
    rules: z.array(PermissionRuleSchema).optional(),
    compatibilityVersion: z.string().optional(),
  }).catchall(PatternEntrySchema),
])

export type PermissionRuleset = z.infer<typeof PermissionRulesetSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const PermissionRulesetSchemaLenient = z.union([
  PatternBasedPermissionSchema,
  RulesBasedPermissionSchemaLenient,
  // Combination: pattern-based keys + optional "rules" array + optional compatibility version
  z.object({
    rules: z.array(PermissionRuleSchemaLenient).optional(),
    compatibilityVersion: z.string().optional(),
  }).catchall(PatternEntrySchema),
])

export type PermissionRulesetLenient = z.infer<typeof PermissionRulesetSchemaLenient>

// ---------------------------------------------------------------------------
// 8. Agent Permission Override — per-agent permission scope
// ---------------------------------------------------------------------------

/**
 * Agent-level permission override. Same structure as a global permission
 * ruleset, optionally scoped by agent name for merge resolution.
 */
export const AgentPermissionOverrideSchema = z
  .object({
    agent: z.string().min(1),
    permissions: PermissionRulesetSchema,
    priority: z.number().int().nonnegative().optional(),
  })
  .strict()

export type AgentPermissionOverride = z.infer<typeof AgentPermissionOverrideSchema>

/** Lenient variant that strips unknown fields instead of rejecting them. */
export const AgentPermissionOverrideSchemaLenient = z
  .object({
    agent: z.string().min(1),
    permissions: PermissionRulesetSchemaLenient,
    priority: z.number().int().nonnegative().optional(),
  })
  .strip()

export type AgentPermissionOverrideLenient = z.infer<typeof AgentPermissionOverrideSchemaLenient>
