/**
 * Skill Registry Schema
 *
 * Zod schema and types for skills/registry.yaml validation.
 * Consumed by src/lib/skill-registry.ts for skill resolution.
 */
import { z } from "zod"

// ── Enums ────────────────────────────────────────────────────────────────

export const ProgressiveDisclosureLevelSchema = z.enum(["L0", "L1", "L2", "L3"])
export type ProgressiveDisclosureLevel = z.infer<typeof ProgressiveDisclosureLevelSchema>

export const SkillBundleSchema = z.enum([
    "governance-core",
    "meta-core",
    "verification-core",
    "research-core",
])
export type SkillBundle = z.infer<typeof SkillBundleSchema>

export const SkillStatusSchema = z.enum(["active", "experimental", "deprecated"])
export type SkillStatus = z.infer<typeof SkillStatusSchema>

// ── Skill Metadata ───────────────────────────────────────────────────────

export const SkillMetadataSchema = z.object({
    name: z.string(),
    domain: z.string(),
    bundle: SkillBundleSchema,
    knowledge_delta_score: z.number().min(0).max(1),
    status: SkillStatusSchema,
    owner: z.string(),
    disclosure_level: ProgressiveDisclosureLevelSchema,
    triggers: z.array(z.string()).default([]),
    supersedes: z.array(z.string()).default([]),
    depends_on: z.array(z.string()).default([]),
})

export type SkillMetadata = z.infer<typeof SkillMetadataSchema>

// ── Registry Root ────────────────────────────────────────────────────────

export const SkillRegistrySchema = z.object({
    version: z.string(),
    source_of_truth: z.boolean().default(true),
    local_first_resolution: z.boolean().default(true),
    external_opt_in: z.boolean().default(true),
    skills: z.array(SkillMetadataSchema),
})

export type SkillRegistry = z.infer<typeof SkillRegistrySchema>
