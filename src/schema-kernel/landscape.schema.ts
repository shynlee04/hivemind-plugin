import { z } from "zod"

import { IntentIdSchema, PhaseIdSchema } from "./intent-lock.schema.js"

/**
 * Landscape artifact — written to `.planning/landscapes/{phaseId}.json` with
 * atomic commit; the step-2 verifier cross-checks the commit hash.
 *
 * Captures scope, risks, and effort estimate for a code-change phase. NON-code
 * intents (LOCKED_NON_CODE) bypass this schema entirely.
 */
export const LandscapeSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  phaseId: PhaseIdSchema,
  intentLockRef: IntentIdSchema,
  scope: z.object({
    filesAffected: z.array(z.string()),
    modulesTouched: z.array(z.string()),
  }),
  risks: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high", "critical"]),
      description: z.string().min(1),
      mitigation: z.string().min(1),
    }),
  ),
  estimatedEffort: z.enum(["trivial", "small", "medium", "large"]),
  createdAt: z.string().datetime(),
  commitHash: z.string().regex(/^[a-f0-9]{40}$/, "commitHash must be 40 hex chars"),
})

export type Landscape = z.infer<typeof LandscapeSchema>
