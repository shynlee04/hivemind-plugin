import { z } from "zod"

/**
 * Regex for a stable intent identifier.
 *
 * Format: `INT-{8 digits}-{6 lowercase alphanumerics}`.
 * Example: `INT-20260610-a1b2c3`.
 */
export const INTENT_ID_REGEX = /^INT-\d{8}-[a-z0-9]{6}$/

/**
 * Regex for a phase identifier used across intent-lock, landscape, and manifest schemas.
 *
 * Format: `P{digits}{.optional digits}-{kebab-name}`.
 * Examples: `P27-routing`, `P27.1-intent-lock-gate`.
 */
export const PHASE_ID_REGEX = /^P\d{2}(\.\d+)?-[a-z0-9-]+$/

/**
 * Single-string schema matching the `INT-{8}-{6}` intent ID format.
 *
 * Reused in landscape + manifest schemas to keep FK validation consistent.
 */
export const IntentIdSchema = z.string().regex(INTENT_ID_REGEX, "intentId must match INT-{8 digits}-{6 lowercase}")

/**
 * Single-string schema matching the `P{2}{.optional}-{kebab}` phase ID format.
 *
 * Reused in landscape + manifest schemas to keep FK validation consistent.
 */
export const PhaseIdSchema = z.string().regex(PHASE_ID_REGEX, "phaseId must match P{digits}{.optional}-{kebab-name}")

/**
 * Schema for the `purpose` enum on an intent lock artifact.
 *
 * Eight values: research, brainstorming, discovery, planning, implementation, tdd, gatekeeping, course-correction.
 */
export const IntentPurposeSchema = z.enum([
  "research",
  "brainstorming",
  "discovery",
  "planning",
  "implementation",
  "tdd",
  "gatekeeping",
  "course-correction",
])

export type IntentPurpose = z.infer<typeof IntentPurposeSchema>

/**
 * Step verification result.
 *
 * Returned by every `verifyStep{N}` function in the intent-lock gate. Plan 02
 * uses this shape; plan 01 declares it so the type lives in the public surface.
 */
export const StepVerificationSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string()).default([]),
  nextCommand: z.string().optional(),
  alternatives: z.array(z.string()).default([]),
  skipped: z.string().optional(),
})

export type StepVerification = z.infer<typeof StepVerificationSchema>

/**
 * Phase entry row in ROADMAP.md.
 *
 * Mirrors `.planning/ROADMAP.md` row shape; the `dependsOn` array and FK refs to
 * intent-lock/landscape are validated downstream by the gate's step-3 verifier.
 */
export const PhaseEntrySchema = z.object({
  phaseId: PhaseIdSchema,
  name: z.string().min(3),
  status: z.enum(["planned", "active", "blocked", "complete", "cancelled"]),
  dependsOn: z.array(z.string()).default([]),
  intentLockRef: z.string().optional(),
  landscapeRef: z.string().optional(),
  createdAt: z.string().datetime(),
  lastSynced: z.string().datetime(),
})

export type PhaseEntry = z.infer<typeof PhaseEntrySchema>

/**
 * Intent lock artifact — written to `.planning/intent-locks/{intentId}.md`
 * with YAML frontmatter matching this schema.
 *
 * P27.2 (REQ-5, REQ-6): exactly 9 required fields. The `commitHash` field
 * is the atomic git commit SHA that introduced the artifact; the step-1
 * verifier cross-checks this against `git log`.
 *
 * **9 fields:** intentId, phaseId, summary, isCodeChange, allowedSurfaces,
 * successCriteria, createdAt, sessionId, commitHash.
 */
export const IntentLockArtifactSchema = z.object({
  intentId: IntentIdSchema,
  phaseId: PhaseIdSchema,
  sessionId: z.string().min(1),
  summary: z.string().min(20).max(500),
  isCodeChange: z.boolean(),
  allowedSurfaces: z.array(z.string()).min(1),
  successCriteria: z.array(z.string()).min(1),
  createdAt: z.number(),
  commitHash: z.string().regex(/^[a-f0-9]{40}$/, "commitHash must be 40 hex chars"),
})

export type IntentLockArtifact = z.infer<typeof IntentLockArtifactSchema>

/**
 * Error class for schema validation failures.
 * Carries `issues[]` listing every missing or wrong-typed field.
 */
export class IntentLockSchemaError extends Error {
  public readonly issues: string[]

  constructor(message: string, issues: string[]) {
    super(`[Hivemind] ${message}`)
    this.name = "IntentLockSchemaError"
    this.issues = issues
  }
}
