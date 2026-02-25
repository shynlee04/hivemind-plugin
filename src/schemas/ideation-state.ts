/**
 * Q.U.A.N.T. Matrix Schema — Ideation Spec Validation
 *
 * Five dimensions:
 *   Q - Quantifiable Ambiguity Index (QAI)
 *   U - Unhappy Path Saturation (UPS)
 *   A - Architectural Grounding Score (AGS)
 *   N - Noun Resolution (NR)
 *   T - TDD Materialization (TDD-M)
 */

import { z } from "zod"

export const FeatureStateMatrixSchema = z.object({
  ideal: z.string().min(10).describe("What happens when everything works perfectly"),
  empty: z.string().min(10).describe("What happens when data is null, [], or first-run"),
  latency: z.string().min(10).describe("What happens when network/DB takes > 5 seconds"),
  partial_failure: z.string().min(10).describe("What happens when a 3rd party API rate-limits but core DB is up"),
  destructive: z.string().min(10).describe("What happens on deletion, rollback, or concurrent writes"),
})

export const IdeationRequirementSchema = z.object({
  id: z.string().uuid(),
  feature_name: z.string().min(1),
  state_matrix: FeatureStateMatrixSchema,
  tdd_vectors: z.array(z.string().regex(/^(Given|When|Then)/i)).min(1).describe("Given/When/Then test boundaries"),
  code_intel_anchors: z.array(z.string()).describe("AST symbol paths or new schema declarations from codebase-intel"),
})

export const IdeationSpecSchema = z.object({
  id: z.string().uuid(),
  user_intent: z.string().min(10),
  proposed_stack: z.array(z.string()).min(1),
  mcp_research_refs: z.array(z.string()).min(1).describe("Required citations from DeepWiki/Git MCP research"),
  requirements: z.array(IdeationRequirementSchema).min(1),
})

export type FeatureStateMatrix = z.infer<typeof FeatureStateMatrixSchema>
export type IdeationRequirement = z.infer<typeof IdeationRequirementSchema>
export type IdeationSpec = z.infer<typeof IdeationSpecSchema>
