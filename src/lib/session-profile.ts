import { mkdir, readFile, writeFile } from "node:fs/promises"

import { getSessionPaths } from "./paths.js"
import {
  createSessionProfile,
  SessionProfileSchema,
  type SessionProfile,
  type SessionProfileSeed,
} from "../schemas/session-profile.js"

export interface EnsureSessionProfileOptions {
  force?: boolean
}

async function readSessionProfile(path: string): Promise<unknown> {
  try {
    const raw = await readFile(path, "utf-8")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Ensure a compatibility session-profile exists under the canonical runtime
 * session-profile directory instead of mixing profile shims into
 * `sessions/active/`.
 *
 * @param projectRoot - Project root containing `.hivemind/`.
 * @param seed - Runtime/bootstrap seed values for the compatibility profile.
 * @param options - Optional force rewrite toggle.
 * @returns The normalized profile payload that now exists on disk.
 */
export async function ensureSessionProfile(
  projectRoot: string,
  seed: SessionProfileSeed,
  options: EnsureSessionProfileOptions = {},
): Promise<SessionProfile> {
  const sessionPaths = getSessionPaths(projectRoot, seed.sessionId)
  await mkdir(sessionPaths.profileDir, { recursive: true })

  const existing = SessionProfileSchema.safeParse(await readSessionProfile(sessionPaths.profile))
  const profile = createSessionProfile({
    sessionId: seed.sessionId,
    brainSessionId: seed.brainSessionId ?? (existing.success ? existing.data.brain_session_id : null),
    agent: seed.agent ?? (existing.success ? existing.data.agent : "unresolved"),
    lineageScope: seed.lineageScope ?? (existing.success ? existing.data.lineage_scope : "unknown"),
    sessionKind: seed.sessionKind ?? (existing.success ? existing.data.session_kind : "unresolved"),
    createdAt: existing.success ? existing.data.created_at : seed.createdAt,
    updatedAt: seed.updatedAt,
    version: seed.version ?? (existing.success ? existing.data.version : undefined),
  })

  if (
    options.force ||
    !existing.success ||
    JSON.stringify(existing.data) !== JSON.stringify(profile)
  ) {
    await writeFile(sessionPaths.profile, `${JSON.stringify(profile, null, 2)}\n`, "utf-8")
  }

  return profile
}
