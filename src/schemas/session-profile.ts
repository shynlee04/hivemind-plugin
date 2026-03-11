import { z } from "zod"

export const SESSION_PROFILE_VERSION = "1.0.0"

export const SESSION_PROFILE_LINEAGE_VALUES = [
  "project",
  "meta-framework",
  "unknown",
] as const

export const SESSION_PROFILE_KIND_VALUES = [
  "main",
  "sub",
  "unresolved",
] as const

export const SessionProfileSchema = z.object({
  session_id: z.string().min(1),
  brain_session_id: z.string().min(1).nullable().default(null),
  agent: z.string().min(1).default("unresolved"),
  lineage_scope: z.enum(SESSION_PROFILE_LINEAGE_VALUES).default("unknown"),
  session_kind: z.enum(SESSION_PROFILE_KIND_VALUES).default("unresolved"),
  created_at: z.number().int().nonnegative(),
  updated_at: z.number().int().nonnegative(),
  version: z.string().min(1).default(SESSION_PROFILE_VERSION),
})

export type SessionProfile = z.infer<typeof SessionProfileSchema>

export interface SessionProfileSeed {
  sessionId: string
  brainSessionId?: string | null
  agent?: string
  lineageScope?: SessionProfile["lineage_scope"]
  sessionKind?: SessionProfile["session_kind"]
  createdAt?: number
  updatedAt?: number
  version?: string
}

/**
 * Build a normalized compatibility session-profile payload.
 *
 * @param seed - Seed values gathered from runtime/bootstrap owners.
 * @returns Canonical compatibility session-profile payload.
 */
export function createSessionProfile(seed: SessionProfileSeed): SessionProfile {
  const updatedAt = seed.updatedAt ?? Date.now()
  return SessionProfileSchema.parse({
    session_id: seed.sessionId,
    brain_session_id: seed.brainSessionId ?? null,
    agent: seed.agent ?? "unresolved",
    lineage_scope: seed.lineageScope ?? "unknown",
    session_kind: seed.sessionKind ?? "unresolved",
    created_at: seed.createdAt ?? updatedAt,
    updated_at: updatedAt,
    version: seed.version ?? SESSION_PROFILE_VERSION,
  })
}
