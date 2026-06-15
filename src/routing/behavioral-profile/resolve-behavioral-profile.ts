/**
 * Behavioral profile resolution.
 *
 * @module behavioral-profile/resolve-behavioral-profile
 * @description Resolves a unified ResolvedBehavioralProfile for a session by
 * merging static config values, mode lookup, and runtime profile detection.
 *
 * Always reads fresh config from disk so language/governance changes
 * take effect immediately without a plugin restart.
 *
 * Merge strategy: config-first with runtime fallback (D-06).
 * SR-05: config-defined guardrail_level, delegation_mode, tool_access_pattern,
 * skill_filter override static BehavioralProfiles[mode] values when set.
 *
 * @see D-06, D-07, D-08 in CA-02-CONTEXT.md
 * @see SR-05 CONTEXT.md Decision 4 (snake_case config, camelCase interface)
 */

import type { UserExpertLevel } from "../../schema-kernel/hivemind-configs.schema.js"
import type { Expertise } from "../session-entry/profile-resolver.js"
import type { ResolvedBehavioralProfile, BehavioralProfile } from "./types.js"
import { getFreshConfig } from "../../config/subscriber.js"
import { resolveProfile } from "../session-entry/profile-resolver.js"
import { BehavioralProfiles } from "./profiles.js"

/**
 * Maps a UserExpertLevel config value to a profile Expertise level.
 * Returns undefined if no mapping exists (caller falls back to runtime).
 *
 * @param level - The user_expert_level from configs.json
 * @returns Mapped expertise level, or undefined for fallback
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
 * Resolves the behavioral profile for a session.
 *
 * Always reads fresh config from disk so language/governance changes
 * take effect immediately without a plugin restart.
 *
 * SR-05: Config-defined behavioral overrides (guardrail_level, delegation_mode,
 * tool_access_pattern, skill_filter) take precedence over static profile values.
 * snake_case config fields map to camelCase interface fields at the merge point.
 *
 * CONSTITUTION-2026-06-10: `.hivemind/configs.json` is supreme truth.
 * All merged fields MUST prefer config values over runtime profile values.
 * `language.conversation` and `language.documents` always come from configs.json
 * and completely override any session context or runtime detection.
 *
 * @param sessionId - Unique session identifier
 * @param projectRoot - Absolute path to project root (for config read)
 * @param sessionContext - Optional session context for runtime profile detection
 * @returns The unified resolved behavioral profile with current config values
 */
export function resolveBehavioralProfile(
  _sessionId: string,
  projectRoot: string,
  sessionContext?: Record<string, unknown>,
): ResolvedBehavioralProfile {
  // Always use fresh config — picks up language/governance changes without restart.
  const config = getFreshConfig(projectRoot)
  const mode = config.mode as keyof typeof BehavioralProfiles
  const staticProfile = BehavioralProfiles[mode]
  const runtimeProfile = resolveProfile(sessionContext)

  // ── Resolution order: behavioral.* > root-level > static profile default ──
  // CONSTITUTION-2026-06-10: `.hivemind/configs.json` is supreme truth.
  // Nested blocks take precedence; root-level fields are backward-compatible fallbacks.
  const behavioralProfile: BehavioralProfile = {
    guardrailLevel: (config.behavioral?.guardrail_level as any)
      ?? (config.guardrail_level as any)
      ?? staticProfile.guardrailLevel,
    delegationMode: (config.behavioral?.delegation_mode as any)
      ?? (config.delegation_mode as any)
      ?? staticProfile.delegationMode,
    toolAccessPattern: (config.behavioral?.tool_access_pattern as any)
      ?? (config.tool_access_pattern as any)
      ?? staticProfile.toolAccessPattern,
    skillFilter: (config.behavioral?.skill_filter as any)
      ?? (config.skill_filter as any)
      ?? staticProfile.skillFilter,
  }

  // Config-first merge: mapLevelToExpertise wins if defined, else runtime
  const configExpertise = mapLevelToExpertise(config.user_expert_level)

  return {
    mode,
    behavioralProfile,
    language: {
      // Resolution: language.conversation > conversation_language > "en"
      conversation: config.language?.conversation ?? config.conversation_language,
      // Resolution: language.documents > documents_and_artifacts_language > "en"
      documents: config.language?.documents ?? config.documents_and_artifacts_language,
    },
    userExpertLevel: config.user_expert_level,
    discussMode: config.workflow.discuss_mode,
    runtimeProfile,
    // CONSTITUTION-2026-06-10: Config values override runtime profile completely.
    // configs.json is supreme — runtime values are ONLY fallbacks when config is undefined.
    // Resolution order: runtime.* > behavioral.* > mapLevelToExpertise > runtime profile.
    merged: {
      expertise: config.runtime?.expertise as any
        ?? config.behavioral?.expertise as any
        ?? configExpertise
        ?? runtimeProfile.expertise,
      communicationStyle: (config.runtime?.communication_style as any)
        ?? (config.behavioral?.communication_style as any)
        ?? runtimeProfile.communicationStyle,
      decisionSpeed: (config.runtime?.decision_speed as any)
        ?? (config.behavioral?.decision_speed as any)
        ?? runtimeProfile.decisionSpeed,
    },
  }
}
