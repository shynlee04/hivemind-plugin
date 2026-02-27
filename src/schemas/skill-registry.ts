import { z } from "zod"

export const SkillBundleSchema = z.enum([
  "governance-core",
  "routing-core",
  "planning-core",
  "research-core",
  "verification-core",
  "repair-core",
  "meta-core",
])

export const ProgressiveDisclosureLevelSchema = z.enum(["L0", "L1", "L2", "L3"])

export const KnowledgeDeltaScoreSchema = z.number().min(0).max(1)

export const SkillMetadataSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  bundle: SkillBundleSchema,
  knowledge_delta_score: KnowledgeDeltaScoreSchema,
  status: z.enum(["active", "experimental", "deprecated", "merge_candidate"]),
  owner: z.string().min(1),
  disclosure_level: ProgressiveDisclosureLevelSchema,
  triggers: z.array(z.string().min(1)).default([]),
  supersedes: z.array(z.string().min(1)).default([]),
  depends_on: z.array(z.string().min(1)).default([]),
})

export const SkillRegistrySchema = z.object({
  version: z.string().min(1),
  source_of_truth: z.literal(true),
  local_first_resolution: z.literal(true),
  external_opt_in: z.literal(true),
  skills: z.array(SkillMetadataSchema),
})

export type SkillBundle = z.infer<typeof SkillBundleSchema>
export type ProgressiveDisclosureLevel = z.infer<typeof ProgressiveDisclosureLevelSchema>
export type KnowledgeDeltaScore = z.infer<typeof KnowledgeDeltaScoreSchema>
export type SkillMetadata = z.infer<typeof SkillMetadataSchema>
export type SkillRegistry = z.infer<typeof SkillRegistrySchema>
