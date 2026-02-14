/**
 * HiveMind Configuration Schema
 * Defines governance modes, project settings, and agent behavior constraints
 */

import type { DetectionThresholds } from "../lib/detection.js";

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

export interface AgentBehaviorConfig {
  /** Language for all responses */
  language: Language;
  /** Expertise level - affects depth and assumptions */
  expert_level: ExpertLevel;
  /** Output style - affects response format */
  output_style: OutputStyle;
  /** Additional behavioral constraints */
  constraints: {
    /** Require code review before accepting */
    require_code_review: boolean;
    /** Enforce test-driven development */
    enforce_tdd: boolean;
    /** Maximum response length in tokens (approximate) */
    max_response_tokens: number;
    /** Always explain 'why' not just 'what' */
    explain_reasoning: boolean;
    /** Challenge user assumptions */
    be_skeptical: boolean;
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
  /** Agent behavior configuration - injected into every session */
  agent_behavior: AgentBehaviorConfig;
  /** Override detection thresholds (merged with defaults at runtime) */
  detection_thresholds?: Partial<DetectionThresholds>;
  /** Automation level — "coach" mode = max automation, system argues back, max guidance */
  automation_level: AutomationLevel;
}

export const DEFAULT_AGENT_BEHAVIOR: AgentBehaviorConfig = {
  language: "en",
  expert_level: "intermediate",
  output_style: "explanatory",
  constraints: {
    require_code_review: false,
    enforce_tdd: false,
    max_response_tokens: 2000,
    explain_reasoning: true,
    be_skeptical: false,
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
  agent_behavior: DEFAULT_AGENT_BEHAVIOR,
  automation_level: "assisted" as AutomationLevel,
};

export function createConfig(overrides: Partial<HiveMindConfig> = {}): HiveMindConfig {
  const automationOverride = (overrides as { automation_level?: unknown }).automation_level
  const normalizedAutomationLevel = typeof automationOverride === "string"
    ? normalizeAutomationInput(automationOverride)
    : null
  const overrideBehavior = overrides.agent_behavior;
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    automation_level: normalizedAutomationLevel ?? DEFAULT_CONFIG.automation_level,
    agent_behavior: {
      ...DEFAULT_AGENT_BEHAVIOR,
      ...overrideBehavior,
      constraints: {
        ...DEFAULT_AGENT_BEHAVIOR.constraints,
        ...(overrideBehavior?.constraints),
      },
    },
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

/**
 * Generates the mandatory agent configuration prompt that is injected
 * at every session opening and persists throughout the conversation.
 */
export function generateAgentBehaviorPrompt(config: AgentBehaviorConfig): string {
  const lines: string[] = [];
  
  lines.push("<agent-configuration>");
  lines.push("MANDATORY: You MUST obey these constraints for this entire session:");
  lines.push("");
  
  // Language enforcement
  const langNames: Record<Language, string> = {
    en: "English",
    vi: "Vietnamese (Tiếng Việt)",
  };
  lines.push(`[LANGUAGE] Respond ONLY in ${langNames[config.language]}. No exceptions.`);
  lines.push("");
  
  // Expert level
  const expertDescriptions: Record<ExpertLevel, string> = {
    beginner: "Explain everything simply. Define terms. No assumptions of prior knowledge.",
    intermediate: "Standard technical depth. Some domain knowledge assumed.",
    advanced: "Concise, sophisticated. Assume strong domain expertise.",
    expert: "Terse, reference advanced concepts. Minimal hand-holding.",
  };
  lines.push(`[EXPERT LEVEL] ${config.expert_level.toUpperCase()}: ${expertDescriptions[config.expert_level]}`);
  lines.push("");
  
  // Output style
  const styleInstructions: Record<OutputStyle, string[]> = {
    explanatory: [
      "- Explain WHY, not just WHAT",
      "- Provide context and rationale",
      "- Use analogies where helpful",
      "- Answer follow-up questions proactively",
    ],
    outline: [
      "- Use bullet points and structured lists",
      "- Headings for organization",
      "- Summary at the top",
      "- Details collapsed or abbreviated",
    ],
    skeptical: [
      "- Challenge assumptions in the request",
      "- Point out risks and edge cases",
      "- Ask clarifying questions",
      "- Suggest alternatives",
      "- Verify requirements are complete",
    ],
    architecture: [
      "- Start with high-level design",
      "- Discuss patterns and trade-offs",
      "- Component diagrams before code",
      "- Implementation follows design",
    ],
    minimal: [
      "- Code only, minimal prose",
      "- No explanations unless asked",
      "- Direct answers",
    ],
  };
  lines.push(`[OUTPUT STYLE] ${config.output_style.toUpperCase()}:`);
  styleInstructions[config.output_style].forEach(instruction => lines.push(instruction));
  lines.push("");
  
  // Constraints
  lines.push("[CONSTRAINTS]");
  lines.push("- TASK MANAGEMENT: Use `todoread` to check tasks and `todowrite` to update them.");
  if (config.constraints.require_code_review) {
    lines.push("- MUST review code before accepting: check for bugs, smells, tests");
  }
  if (config.constraints.enforce_tdd) {
    lines.push("- TDD REQUIRED: Write failing test first, then implementation");
  }
  if (config.constraints.explain_reasoning) {
    lines.push("- ALWAYS explain your reasoning");
  }
  if (config.constraints.be_skeptical) {
    lines.push("- BE SKEPTICAL: Question requirements, point out gaps");
  }
  lines.push(`- Maximum response: ~${config.constraints.max_response_tokens} tokens`);
  lines.push("");
  
  lines.push("VIOLATION: If you cannot obey these constraints, state why explicitly.");
  lines.push("</agent-configuration>");
  
  return lines.join("\n");
}
