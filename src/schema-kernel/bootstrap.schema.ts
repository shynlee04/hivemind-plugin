import { z } from "zod"

import {
  DelegationSystemsSchema,
  HivemindModeSchema,
  SupportedLanguageSchema,
  UserExpertLevelSchema,
} from "./hivemind-configs.schema.js"

/**
 * Supported primitive installation scopes for BOOT-02 bootstrap flows.
 */
export const BootstrapScopeSchema = z.enum(["project", "global"])

/**
 * Partial config payload accepted by bootstrap init for wizard-driven writes.
 */
export const BootstrapConfigInputSchema = z.object({
  conversation_language: SupportedLanguageSchema.optional(),
  documents_and_artifacts_language: SupportedLanguageSchema.optional(),
  mode: HivemindModeSchema.optional(),
  user_expert_level: UserExpertLevelSchema.optional(),
  delegation_systems: DelegationSystemsSchema.optional(),
}).strip()

/**
 * Input contract for the write-side bootstrap init tool.
 */
export const BootstrapInitInputSchema = z.object({
  projectRoot: z.string().min(1),
  scope: BootstrapScopeSchema.default("project"),
  nonInteractive: z.boolean().default(false),
  config: BootstrapConfigInputSchema.default({}),
  globalConfigDir: z.string().min(1).optional(),
})

/**
 * Input contract for the write-side bootstrap recover tool.
 */
export const BootstrapRecoverInputSchema = z.object({
  projectRoot: z.string().min(1),
  scope: BootstrapScopeSchema.default("project"),
  globalConfigDir: z.string().min(1).optional(),
})

const BootstrapStatusCountSchema = z.object({
  ok: z.number().int().nonnegative(),
  missing: z.number().int().nonnegative(),
  broken: z.number().int().nonnegative(),
  file: z.number().int().nonnegative(),
  repaired: z.number().int().nonnegative(),
})

/**
 * Primitive repair status counts returned by bootstrap recover.
 */
export const BootstrapRecoverCountsSchema = z.object({
  agents: BootstrapStatusCountSchema,
  skills: BootstrapStatusCountSchema,
  commands: BootstrapStatusCountSchema,
})

/**
 * Result contract returned by bootstrap init.
 */
export const BootstrapInitResultSchema = z.object({
  projectRoot: z.string(),
  requestedScope: BootstrapScopeSchema,
  effectiveScope: BootstrapScopeSchema,
  fallbackApplied: z.boolean(),
  fallbackReason: z.string().optional(),
  primitiveTargetRoot: z.string(),
  backupPath: z.string().optional(),
  created: z.object({
    hiveMindDirectories: z.number().int().nonnegative(),
    gitkeepFiles: z.number().int().nonnegative(),
    primitiveSymlinks: z.number().int().nonnegative(),
    configsJson: z.boolean(),
    configSchemaJson: z.boolean(),
    versionFile: z.boolean(),
  }),
  existing: z.object({
    hiveMindDirectories: z.number().int().nonnegative(),
    primitiveEntries: z.number().int().nonnegative(),
    configsJson: z.boolean(),
    configSchemaJson: z.boolean(),
  }),
})

/**
 * Result contract returned by bootstrap recover.
 */
export const BootstrapRecoverResultSchema = z.object({
  projectRoot: z.string(),
  requestedScope: BootstrapScopeSchema,
  effectiveScope: BootstrapScopeSchema,
  fallbackApplied: z.boolean(),
  fallbackReason: z.string().optional(),
  primitiveTargetRoot: z.string(),
  counts: BootstrapRecoverCountsSchema,
  warnings: z.array(z.string()),
})

export type BootstrapScope = z.infer<typeof BootstrapScopeSchema>
export type BootstrapConfigInput = z.infer<typeof BootstrapConfigInputSchema>
export type BootstrapInitInput = z.infer<typeof BootstrapInitInputSchema>
export type BootstrapRecoverInput = z.infer<typeof BootstrapRecoverInputSchema>
export type BootstrapInitResult = z.infer<typeof BootstrapInitResultSchema>
export type BootstrapRecoverResult = z.infer<typeof BootstrapRecoverResultSchema>
