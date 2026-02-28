/**
 * HiveMind Configuration Schema
 * Defines governance modes, project settings, and agent behavior constraints
 */

import type { DetectionThresholds } from "../lib/detection.js";
import { DEFAULT_MAX_RESPONSE_TOKENS } from "../lib/budget.js";

export const GOVERNANCE_MODES = ["permissive", "assisted", "strict"] as const;
export type GovernanceMode = (typeof GOVERNANCE_MODES)[number];

export const LANGUAGES = ["en", "vi"] as const;
export type Language = (typeof LANGUAGES)[number];

export const AUTOMATION_LEVELS = ["manual", "guided", "assisted", "full", "coach"] as const;
export type AutomationLevel = (typeof AUTOMATION_LEVELS)[number];

export const EXPERT_LEVELS = ["beginner", "intermediate", "advanced", "expert"] as const;
export type ExpertLevel = (typeof EXPERT_LEVELS)[number];

export const OUTPUT_STYLES = [
  "explanatory", // Detailed explanations, teaching mode
  "outline", // Bullet points, structured summaries
  "skeptical", // Critical review, challenge assumptions
  "architecture", // Focus on design patterns, structure first
  "minimal", // Brief, code-only responses
] as const;
export type OutputStyle = (typeof OUTPUT_STYLES)[number];

export const V29_OUTPUT_STYLES = [
  "supportive_discovery",
  "architecture_planning",
  "problem_solving_debugging",
  "execution_oriented",
] as const;
export type V29OutputStyle = (typeof V29_OUTPUT_STYLES)[number];

export const LEGACY_OUTPUT_STYLE_TO_V29_STYLE: Record<OutputStyle, V29OutputStyle> = {
  explanatory: "supportive_discovery",
  outline: "execution_oriented",
  skeptical: "problem_solving_debugging",
  architecture: "architecture_planning",
  minimal: "execution_oriented",
};

// ── OpenCode Permission Types ──────────────────────────────

export type PermissionMode = "allow" | "ask" | "deny";

export interface ToolPermissions {
  /** Read files */
  read?: PermissionMode;
  /** Write/create new files */
  write?: PermissionMode;
  /** Edit existing files */
  edit?: PermissionMode;
  /** Execute shell commands (can be object for pattern matching) */
  bash?: PermissionMode | Record<string, PermissionMode>;
  /** Search file contents */
  grep?: PermissionMode;
  /** Find files by pattern */
  glob?: PermissionMode;
  /** List directory contents */
  list?: PermissionMode;
  /** Execute Task tool (spawn subagents) */
  task?: PermissionMode;
  /** Load skills */
  skill?: PermissionMode;
  /** Fetch web content */
  webfetch?: PermissionMode;
  /** Search the web */
  websearch?: PermissionMode;
  /** Ask user questions */
  question?: PermissionMode;
  /** All other tools not explicitly listed */
  "*"? : PermissionMode;
}

// ── Profile Presets ─────────────────────────────────────────

export interface ProfilePreset {
  /** Display name for the profile */
  label: string;
  /** Description shown in wizard */
  description: string;
  /** Governance mode */
  governance_mode: GovernanceMode;
  /** Automation level */
  automation_level: AutomationLevel;
  /** Expert level */
  expert_level: ExpertLevel;
  /** Output style */
  output_style: OutputStyle;
  /** Default permissions for this profile */
  permissions: ToolPermissions;
  /** Whether to require code review */
  require_code_review: boolean;
  /** Whether to enforce TDD */
  enforce_tdd: boolean;
}

export const PROFILE_PRESETS: Record<string, ProfilePreset> = {
  beginner: {
    label: "Beginner",
    description: "Learning to code with AI assistance. Maximum guidance, explanatory responses, ask before actions.",
    governance_mode: "assisted",
    automation_level: "assisted",
    expert_level: "beginner",
    output_style: "explanatory",
    permissions: {
      edit: "ask",
      write: "ask",
      bash: "ask",
      "*": "allow",
    },
    require_code_review: false,
    enforce_tdd: false,
  },
  intermediate: {
    label: "Intermediate (recommended)",
    description: "Comfortable with AI tools. Balanced automation, clear explanations, allow most actions.",
    governance_mode: "assisted",
    automation_level: "assisted",
    expert_level: "intermediate",
    output_style: "explanatory",
    permissions: {
      edit: "allow",
      write: "allow",
      bash: "ask",
      "*": "allow",
    },
    require_code_review: false,
    enforce_tdd: false,
  },
  advanced: {
    label: "Advanced",
    description: "Experienced developer. Permissive governance, outline responses, full control.",
    governance_mode: "permissive",
    automation_level: "guided",
    expert_level: "advanced",
    output_style: "outline",
    permissions: {
      edit: "allow",
      write: "allow",
      bash: "allow",
      "*": "allow",
    },
    require_code_review: false,
    enforce_tdd: false,
  },
  expert: {
    label: "Expert",
    description: "Senior developer. Minimal guidance, terse responses, full autonomy.",
    governance_mode: "permissive",
    automation_level: "manual",
    expert_level: "expert",
    output_style: "minimal",
    permissions: {
      edit: "allow",
      write: "allow",
      bash: "allow",
      "*": "allow",
    },
    require_code_review: false,
    enforce_tdd: false,
  },
  coach: {
    label: "Coach (max guidance)",
    description: "Learning mode with maximum hand-holding. Strict governance, skeptical responses, asks everything.",
    governance_mode: "strict",
    automation_level: "coach",
    expert_level: "beginner",
    output_style: "skeptical",
    permissions: {
      edit: "ask",
      write: "ask",
      bash: "ask",
      "*": "ask",
    },
    require_code_review: true,
    enforce_tdd: true,
  },
};

export type ProfilePresetKey = keyof typeof PROFILE_PRESETS;

export function isValidProfilePreset(key: string): key is ProfilePresetKey {
  return key in PROFILE_PRESETS;
}

// ── OpenCode Integration Settings ───────────────────────────

export interface OpenCodeSettings {
  /** Default model for agents (provider/model-id format) */
  default_model?: string;
  /** Per-agent model overrides */
  agent_models?: Record<string, string>;
  /** Default permissions applied to all agents */
  default_permissions?: ToolPermissions;
  /** MCP servers configuration */
  mcp_servers?: Array<{
    name: string;
    url?: string;
    command?: string;
    args?: string[];
    enabled?: boolean;
  }>;
}

export interface AgentBehaviorConfig {
  /** Language for all responses */
  language: Language;
  /** Expertise level - affects depth and assumptions */
  expert_level: ExpertLevel;
  /** Output style - affects response format */
  output_style: OutputStyle;
  /** V2.9 output style model */
  output_style_v29?: V29OutputStyle;
  /** Additional behavioral constraints */
  constraints: {
    /** Require code review before accepting */
    require_code_review: boolean;
    /** Enforce test-driven development */
    enforce_tdd: boolean;
    /** Maximum response length in tokens (approximate) */
    max_response_tokens: number;
  };
}

export interface HiveMindConfig {
  governance_mode: GovernanceMode;
  language: Language;
  max_turns_before_warning: number;
  max_active_md_lines: number;
  auto_compact_on_turns: number;
  /** Days of inactivity before auto-archiving session */
  stale_session_days: number;
  /** Files touched threshold before suggesting a commit */
  commit_suggestion_threshold: number;
  /** Enable auto-commit after write/edit/bash tools when changes are detected */
  auto_commit: boolean;
  /** Agent behavior configuration - injected into every session */
  agent_behavior: AgentBehaviorConfig;
  /** Override detection thresholds (merged with defaults at runtime) */
  detection_thresholds?: Partial<DetectionThresholds>;
  /** Automation level — "coach" mode = max automation, system argues back, max guidance */
  automation_level: AutomationLevel;
  /** Selected profile preset */
  profile?: ProfilePresetKey;
  /** OpenCode-specific settings */
  opencode?: OpenCodeSettings;
}

export const DEFAULT_AGENT_BEHAVIOR: AgentBehaviorConfig = {
  language: "en",
  expert_level: "intermediate",
  output_style: "explanatory",
  output_style_v29: "supportive_discovery",
  constraints: {
    require_code_review: false,
    enforce_tdd: false,
    max_response_tokens: DEFAULT_MAX_RESPONSE_TOKENS,
  },
};

export const DEFAULT_CONFIG: HiveMindConfig = {
  governance_mode: "assisted",
  language: "en",
  max_turns_before_warning: 5,
  max_active_md_lines: 50,
  auto_compact_on_turns: 20,
  stale_session_days: 3,
  commit_suggestion_threshold: 5,
  auto_commit: false,
  agent_behavior: DEFAULT_AGENT_BEHAVIOR,
  automation_level: "assisted" as AutomationLevel,
};

export function createConfig(overrides: Partial<HiveMindConfig> = {}): HiveMindConfig {
  const automationOverride = (overrides as { automation_level?: unknown }).automation_level
  const normalizedAutomationLevel = typeof automationOverride === "string"
    ? normalizeAutomationInput(automationOverride)
    : null
  const overrideBehavior = overrides.agent_behavior;
  const mergedBehavior: AgentBehaviorConfig = {
    ...DEFAULT_AGENT_BEHAVIOR,
    ...overrideBehavior,
    constraints: {
      ...DEFAULT_AGENT_BEHAVIOR.constraints,
      ...(overrideBehavior?.constraints),
    },
  };
  mergedBehavior.output_style_v29 =
    overrideBehavior?.output_style_v29 ??
    mapLegacyOutputStyleToV29(mergedBehavior.output_style);

  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    automation_level: normalizedAutomationLevel ?? DEFAULT_CONFIG.automation_level,
    agent_behavior: mergedBehavior,
  };
}

export function isValidGovernanceMode(mode: string): mode is GovernanceMode {
  return (GOVERNANCE_MODES as readonly string[]).includes(mode);
}

export function isValidLanguage(lang: string): lang is Language {
  return (LANGUAGES as readonly string[]).includes(lang);
}

export function isValidExpertLevel(level: string): level is ExpertLevel {
  return (EXPERT_LEVELS as readonly string[]).includes(level);
}

export function isValidOutputStyle(style: string): style is OutputStyle {
  return (OUTPUT_STYLES as readonly string[]).includes(style);
}

export function isValidV29OutputStyle(style: string): style is V29OutputStyle {
  return (V29_OUTPUT_STYLES as readonly string[]).includes(style);
}

export function mapLegacyOutputStyleToV29(style: OutputStyle): V29OutputStyle {
  return LEGACY_OUTPUT_STYLE_TO_V29_STYLE[style] ?? "execution_oriented";
}

export function resolveV29OutputStyle(
  style: V29OutputStyle | null | undefined,
  legacyStyle: OutputStyle
): V29OutputStyle {
  return style ?? mapLegacyOutputStyleToV29(legacyStyle);
}

export function isValidAutomationLevel(level: string): level is AutomationLevel {
  return (AUTOMATION_LEVELS as readonly string[]).includes(level);
}

const LEGACY_COACH_ALIAS = String.fromCharCode(114, 101, 116, 97, 114, 100)

/**
 * Normalize raw automation input values from CLI/config files.
 * Keeps backward compatibility for a legacy alias while exposing only modern labels.
 */
export function normalizeAutomationInput(level: string | null | undefined): AutomationLevel | null {
  if (typeof level !== "string") return null
  const normalized = level.trim().toLowerCase()
  if (!normalized) return null
  if (isValidAutomationLevel(normalized)) return normalized
  if (normalized === LEGACY_COACH_ALIAS) return "coach"
  return null
}

export function isCoachAutomation(level: AutomationLevel): boolean {
  return level === "coach"
}

export function normalizeAutomationLabel(level: AutomationLevel): AutomationLevel {
  return level
}
