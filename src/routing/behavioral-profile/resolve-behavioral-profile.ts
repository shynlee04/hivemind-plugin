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

  // SR-05: Config-first merge for behavioral profile dimensions
  // Config values override static profile; undefined config fields fall back to static
  const behavioralProfile: BehavioralProfile = {
    guardrailLevel: (config.guardrail_level as any) ?? staticProfile.guardrailLevel,
    delegationMode: (config.delegation_mode as any) ?? staticProfile.delegationMode,
    toolAccessPattern: (config.tool_access_pattern as any) ?? staticProfile.toolAccessPattern,
    skillFilter: (config.skill_filter as any) ?? staticProfile.skillFilter,
  }

  // Config-first merge: mapLevelToExpertise wins if defined, else runtime
  const configExpertise = mapLevelToExpertise(config.user_expert_level)

  return {
    mode,
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
}
