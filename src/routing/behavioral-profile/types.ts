/**
 * Behavioral profile type definitions for the Hivemind mode dispatch system.
 *
 * @module behavioral-profile/types
 * @description Defines the static behavioral profile shape (BehavioralProfile),
 * the unified resolution output (ResolvedBehavioralProfile), and supporting
 * union types for guardrail levels, delegation modes, tool access patterns,
 * and skill filters. These are TypeScript-only types — no Zod schemas.
 *
 * Leaf module — depends only on schema-kernel and profile-resolver types.
 *
 * @see D-01, D-02, D-03, D-07, D-12 in CA-02-CONTEXT.md
 */

import type {
  HivemindMode,
  SupportedLanguage,
  UserExpertLevel,
  DiscussMode,
} from "../../schema-kernel/hivemind-configs.schema.js"
import type {
  ProfileMatch,
  Expertise,
  CommunicationStyle,
  DecisionSpeed,
} from "../session-entry/profile-resolver.js"

/** Guardrail strictness level controlling delegation and tool behavior. */
export type GuardrailLevel = "minimal" | "moderate" | "strict"

/** Delegation dispatch strategy. */
export type DelegationMode = "waiter" | "sync" | "disabled"

/** Tool access filtering level. */
export type ToolAccessPattern = "full" | "restricted" | "curated"

/** Skill loading filter. */
export type SkillFilter = "all" | "curated"

/**
 * Static behavioral profile derived from a HivemindMode.
 * One entry per mode in the lookup table — no runtime computation.
 *
 * @see D-01, D-02 in CA-02-CONTEXT.md
 */
export interface BehavioralProfile {
  /** Guardrail strictness level */
  guardrailLevel: GuardrailLevel
  /** Delegation dispatch strategy */
  delegationMode: DelegationMode
  /** Tool access filtering level */
  toolAccessPattern: ToolAccessPattern
  /** Skill loading filter */
  skillFilter: SkillFilter
}

/**
 * Unified resolved behavioral profile combining config values,
 * static mode lookup, and runtime profile detection.
 *
 * Produced once per session by resolveBehavioralProfile().
 *
 * @see D-07 in CA-02-CONTEXT.md
 */
export interface ResolvedBehavioralProfile {
  /** Active mode from configs.json */
  mode: HivemindMode
  /** Static behavioral profile derived from mode */
  behavioralProfile: BehavioralProfile
  /** Language configuration from configs.json */
  language: {
    conversation: SupportedLanguage
    documents: SupportedLanguage
  }
  /** User expertise level from configs.json */
  userExpertLevel: UserExpertLevel
  /** Discussion mode — signal only, no routing (D-13) */
  discussMode: DiscussMode
  /** Runtime-detected profile from profile-resolver.ts (SEI-04) */
  runtimeProfile: ProfileMatch
  /** Merged fields: config-first with runtime fallback */
  merged: {
    expertise: Expertise
    communicationStyle: CommunicationStyle
    decisionSpeed: DecisionSpeed
  }
}

/**
 * Behavioral override parameters for DelegationManager dispatch.
 * Supplements RuntimePolicy — never replaces it.
 *
 * @see D-12 in CA-02-CONTEXT.md
 */
export interface BehavioralOverrides {
  /** Guardrail strictness to apply to delegation */
  guardrailLevel: GuardrailLevel
  /** Delegation dispatch strategy override */
  delegationMode: DelegationMode
}

/**
 * Config-driven behavioral overrides from configs.json.
 * Allows per-project customization of the 4 security-relevant dimensions.
 * Values here override the static BehavioralProfiles[mode] lookup.
 *
 * @see SR-05 CONTEXT.md Decision 4 (snake_case config, camelCase interface)
 */
export interface BehavioralConfigOverrides {
  guardrail_level?: "strict" | "moderate" | "permissive"
  delegation_mode?: "waiter" | "direct" | "autonomous"
  tool_access_pattern?: "restricted" | "standard" | "full"
  skill_filter?: "curated" | "domain" | "full"
}
