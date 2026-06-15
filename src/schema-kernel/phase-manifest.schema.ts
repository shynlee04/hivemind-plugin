import { z } from "zod"

import { IntentIdSchema, PhaseIdSchema } from "./intent-lock.schema.js"

/**
 * Evidence types accepted by a phase manifest as required proof.
 *
 * These are the six evidence labels from the Hivemind gate triad. Each phase
 * declares the subset it must produce before the verifier marks it complete.
 */
export const PhaseRequiredProofSchema = z.enum([
  "typecheck_pass",
  "tests_pass",
  "coverage_threshold",
  "spec_compliance",
  "evidence_truth",
  "code_review",
])

export type PhaseRequiredProof = z.infer<typeof PhaseRequiredProofSchema>

/**
 * Phase manifest — written to `.planning/phases/{phaseId}/manifest.json` with
 * atomic commit; the step-4 verifier cross-checks both commit hashes.
 *
 * Captures FK references to the intent-lock and landscape artifacts plus the
 * ROADMAP/STATE commits that authorized the phase. SPEC.md and CONTEXT.md are
 * deliberately NOT required by this schema (per SPEC §7).
 */
export const PhaseManifestSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  phaseId: PhaseIdSchema,
  intentLockRef: IntentIdSchema,
  landscapeRef: z.string().min(1),
  roadmapCommitHash: z.string().regex(/^[a-f0-9]{40}$/, "roadmapCommitHash must be 40 hex chars"),
  stateCommitHash: z.string().regex(/^[a-f0-9]{40}$/, "stateCommitHash must be 40 hex chars"),
  status: z.enum(["drafting", "spec-locked", "planned", "executing", "complete"]),
  requiredProof: z.array(PhaseRequiredProofSchema),
  createdAt: z.string().datetime(),
  lockedAt: z.string().datetime().optional(),
})

export type PhaseManifest = z.infer<typeof PhaseManifestSchema>
