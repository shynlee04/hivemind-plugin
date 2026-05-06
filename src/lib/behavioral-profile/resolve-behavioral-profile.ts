/**
 * Behavioral profile resolution with lazy caching.
 *
 * @module behavioral-profile/resolve-behavioral-profile
 * @description Resolves a unified ResolvedBehavioralProfile for a session by
 * merging static config values, mode lookup, and runtime profile detection.
 * Results are cached per sessionId for the session lifetime.
 *
 * Merge strategy: config-first with runtime fallback (D-06).
 *
 * @see D-06, D-07, D-08 in CA-02-CONTEXT.md
 */

import type { UserExpertLevel } from "../../schema-kernel/hivemind-configs.schema.js"
import type { Expertise } from "../session-entry/profile-resolver.js"
import type { ResolvedBehavioralProfile } from "./types.js"
import { getConfig } from "../config-subscriber.js"
import { resolveProfile } from "../session-entry/profile-resolver.js"
import { BehavioralProfiles } from "./profiles.js"

/** Module-level cache: sessionId → resolved profile. */
const profileCache = new Map<string, ResolvedBehavioralProfile>()

/**
 * Maps a UserExpertLevel config value to a profile Expertise level.
 * Returns undefined if no mapping exists (caller falls back to runtime).
 *
 * @param level - The user_expert_level from configs.json
 * @returns Mapped expertise level, or undefined for fallback
 *
 * @example
 * ```typescript
 * mapLevelToExpertise("architecture-driven") // "senior"
 * mapLevelToExpertise("clumsy-vibecoder")    // "junior"
 * ```
 */
export function mapLevelToExpertise(level: UserExpertLevel): Expertise | undefined {
  switch (level) {
    case "clumsy-vibecoder":
    case "beginner-friendly":
      return "junior"
    case "intermediate-high-level":
      return "mid"
    case "architecture-driven":
    case "absolute-expert":
      return "senior"
    default:
      return undefined
  }
}

/**
 * Resolves the behavioral profile for a session. Lazy — computes on first
 * call, caches by sessionId for session lifetime.
 *
 * @param sessionId - Unique session identifier for cache key
 * @param projectRoot - Absolute path to project root (for config read)
 * @param sessionContext - Optional session context for runtime profile detection
 * @returns The unified resolved behavioral profile
 *
 * @example
 * ```typescript
 * const profile = resolveBehavioralProfile("sess-1", "/project")
 * console.log(profile.mode)                      // "expert-advisor"
 * console.log(profile.behavioralProfile.guardrailLevel) // "moderate"
 * console.log(profile.merged.expertise)           // "mid"
 * ```
 *
 * @see D-06 Config-first merge strategy
 * @see D-08 Lazy-cache resolution pattern
 */
export function resolveBehavioralProfile(
  sessionId: string,
  projectRoot: string,
  sessionContext?: Record<string, unknown>,
): ResolvedBehavioralProfile {
  const cached = profileCache.get(sessionId)
  if (cached) {
    return cached
  }

  const config = getConfig(projectRoot)
  const behavioralProfile = BehavioralProfiles[config.mode]
  const runtimeProfile = resolveProfile(sessionContext)

  // Config-first merge: mapLevelToExpertise wins if defined, else runtime
  const configExpertise = mapLevelToExpertise(config.user_expert_level)

  const resolved: ResolvedBehavioralProfile = {
    mode: config.mode,
    behavioralProfile,
    language: {
      conversation: config.conversation_language,
      documents: config.documents_and_artifacts_language,
    },
    userExpertLevel: config.user_expert_level,
    discussMode: config.workflow.discuss_mode,
    runtimeProfile,
    merged: {
      expertise: configExpertise ?? runtimeProfile.expertise,
      communicationStyle: runtimeProfile.communicationStyle,
      decisionSpeed: runtimeProfile.decisionSpeed,
    },
  }

  profileCache.set(sessionId, resolved)
  return resolved
}

/**
 * Invalidates the cached behavioral profile for a session.
 * Call on session teardown to prevent memory leaks.
 *
 * @param sessionId - Session to invalidate
 *
 * @example
 * ```typescript
 * invalidateBehavioralProfile("sess-1")
 * ```
 */
export function invalidateBehavioralProfile(sessionId: string): void {
  profileCache.delete(sessionId)
}

/**
 * Clears all cached behavioral profiles. For testing only.
 *
 * @example
 * ```typescript
 * clearAllBehavioralProfiles() // resets entire cache
 * ```
 */
export function clearAllBehavioralProfiles(): void {
  profileCache.clear()
}
