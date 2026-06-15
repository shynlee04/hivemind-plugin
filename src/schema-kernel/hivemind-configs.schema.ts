import { z } from "zod"
import { DEFAULT_GOVERNANCE_CONFIGS } from "../config/defaults.js"
import { deepMerge } from "../shared/helpers.js"

export const HIVEMIND_CONFIGS_SCHEMA_VERSION = "2.0.0"

// ---------------------------------------------------------------------------
// 1. Supported languages — shared enum for conversation and document output
// ---------------------------------------------------------------------------

/**
 * Supported language codes for agent conversation output and artifact generation.
 *
 * @example
 * ```typescript
 * const result = SupportedLanguageSchema.safeParse("en")
 * // result.success === true
 * ```
 */
export const SupportedLanguageSchema = z.enum([
  "en",
  "vi",
  "zh",
  "fr",
  "ja",
  "ko",
  "de",
  "es",
  "th",
  "id",
])
  .describe("ISO-style language code for agent output. Supported: en=English, vi=Vietnamese, zh=Chinese, fr=French, ja=Japanese, ko=Korean, de=German, es=Spanish, th=Thai, id=Indonesian.")

export type SupportedLanguage = z.infer<typeof SupportedLanguageSchema>

// ---------------------------------------------------------------------------
// 2. Mode — guardrail intensity level
// ---------------------------------------------------------------------------

/**
 * Hivemind operation mode controlling guardrail intensity.
 *
 * - `expert-advisor`: Agent-led with TDD, spec-driven, research-first, systematic planning.
 * - `hivemind-powered`: Stricter guardrails, hierarchical tracking, cross-context persistence.
 * - `free-style`: Features only available if child control-panes are active or explicitly requested.
 *
 * @example
 * ```typescript
 * const result = HivemindModeSchema.safeParse("expert-advisor")
 * // result.success === true
 * ```
 */
export const HivemindModeSchema = z.enum([
  "expert-advisor",
  "hivemind-powered",
  "free-style",
])
  .describe("Operation mode controlling guardrail intensity. expert-advisor=agent-led-TDD/spec-driven; hivemind-powered=stricter-hierarchical-tracking; free-style=features-only-if-explicitly-requested.")

export type HivemindMode = z.infer<typeof HivemindModeSchema>

// ---------------------------------------------------------------------------
// 3. User expert level — output style adaptation
// ---------------------------------------------------------------------------

/**
 * User proficiency level affecting agent output style, jargon level, and elaboration depth.
 *
 * @example
 * ```typescript
 * const result = UserExpertLevelSchema.safeParse("architecture-driven")
 * // result.success === true
 * ```
 */
export const UserExpertLevelSchema = z.enum([
  "clumsy-vibecoder",
  "beginner-friendly",
  "intermediate-high-level",
  "architecture-driven",
  "absolute-expert",
])
  .describe("User proficiency level affecting agent output style. clumsy-vibecoder=maximum-explanation; beginner-friendly=gentle-introduction; intermediate-high-level=balanced; architecture-driven=technical-depth; absolute-expert=minimal-explanation.")

export type UserExpertLevel = z.infer<typeof UserExpertLevelSchema>

// ---------------------------------------------------------------------------
// 4. Discuss mode — GSD discuss-phase mode selection
// ---------------------------------------------------------------------------

/**
 * Phase discussion intensity controlling how the discuss-phase skill operates.
 *
 * - `sufficient-phase-discussion`: Gather enough context, then move on.
 * - `intensive-phase-discussion`: Deep exploration before planning.
 * - `skip-phase-discussion`: Skip discussion, go straight to planning.
 *
 * @example
 * ```typescript
 * const result = DiscussModeSchema.safeParse("sufficient-phase-discussion")
 * // result.success === true
 * ```
 */
export const DiscussModeSchema = z.enum([
  "sufficient-phase-discussion",
  "intensive-phase-discussion",
  "skip-phase-discussion",
])
  .describe("Phase discussion intensity. sufficient=gather-enough-context-then-move-on; intensive=deep-exploration-before-planning; skip=go-straight-to-planning.")

export type DiscussMode = z.infer<typeof DiscussModeSchema>

// ---------------------------------------------------------------------------
// 5. Workflow config — runtime feature toggles
// ---------------------------------------------------------------------------

/**
 * Workflow configuration controlling runtime feature toggles.
 * Each toggle controls a separate runtime feature — implemented as OpenCode primitives,
 * custom tools, engines, or event-hook injections.
 *
 * @example
 * ```typescript
 * const result = WorkflowConfigSchema.safeParse({
 *   research: true,
 *   plan_check: true,
 *   discuss_mode: "sufficient-phase-discussion",
 * })
 * // result.success === true
 * ```
 */
/**
 * Internal workflow config object schema (without outer default).
 * Used to generate a fully-resolved default value for the outer schema.
 *
 * @internal
 */
/**
 * Configuration for the Intent Lock gate (Phase 27.1).
 *
 * Simple boolean toggle — all other knobs (purposes, step overrides,
 * bash list, parallel, resume) are hardcoded defaults per SPEC §3.
 *
 * @see 27.1-SPEC.md §3 for design rationale
 */
const IntentLockConfigSchema = z.object({
  enabled: z.boolean().default(false)
    .describe("Enable the 4-step governance gate for root sessions. When enabled, sessions must pass intent-lock → trajectory → roadmap → phase-manifest before file-mutation tools are unlocked. Default: false."),
})

/**
 * Workflow config object schema (without outer default).
 * Used to generate a fully-resolved default value for the outer schema.
 *
 * @internal
 */
const WorkflowConfigInnerSchema = z.object({
  research: z.boolean().default(true)
    .describe("Enable the research-before-planning workflow. Agent conducts domain and codebase research before creating phase plans. Disable for trivial tasks where research overhead isn't justified. Default: true."),
  /** @future-consumer */
  cross_session_tasks_dependencies_validation: z.boolean().default(false)
    .describe("Validate task dependencies across session boundaries. Ensures tasks completed in prior sessions are verified before dependent tasks start. Enable for high-reliability workflows. Default: false."),
  /** @future-consumer */
  trajectory_control: z.boolean().default(false)
    .describe("Enable trajectory ledger tracking for session execution. Records every phase transition and decision point for audit trails. Enable for compliance-heavy projects. Default: false."),
  /** @future-consumer */
  advanced_continuity_validation: z.boolean().default(false)
    .describe("Enable deep continuity checks across session compaction. Validates that restored session state matches the last known good state. Enable when context windows are frequently compacted. Default: false."),
  /** @future-consumer */
  task_plus_enabled: z.boolean().default(false)
    .describe("Enable extended task status tracking with sub-task breakdown and progress percentages. Adds overhead but provides richer progress visibility. Default: false."),
  plan_check: z.boolean().default(true)
    .describe("Enable plan validation before execution. The plan-checker agent verifies goal coverage, dependency completeness, and task granularity before execution starts. Default: true."),
  verifier: z.boolean().default(true)
    .describe("Enable verification agent after phase execution. Validates implementation against plan must-haves and acceptance criteria. Disable for quick experiments. Default: true."),
  ui_phase: z.boolean().default(false)
    .describe("Enable the UI design contract phase for frontend work. Generates UI-SPEC.md before implementation. Enable when building user interfaces. Default: false."),
  /** @future-consumer */
  ui_safety_gate: z.boolean().default(false)
    .describe("Enable UI safety gate that validates accessibility and visual correctness before shipping. Requires ui_phase to be enabled. Default: false."),
  /** @future-consumer */
  ai_integration_phase: z.boolean().default(false)
    .describe("Enable the AI integration design contract phase. Generates AI-SPEC.md for phases involving LLM or ML components. Default: false."),
  research_before_questions: z.boolean().default(true)
    .describe("Require research before asking clarifying questions. Agent first investigates the codebase, then asks only what cannot be inferred. Disable if you prefer upfront questions. Default: true."),
  discuss_mode: DiscussModeSchema.default("sufficient-phase-discussion")
    .describe("Phase discussion intensity. sufficient=gather-enough-context, intensive=deep-exploration, skip=go-directly-to-planning. Default: sufficient-phase-discussion."),
  /** @future-consumer */
  use_worktrees: z.boolean().default(false)
    .describe("Use git worktrees for isolated task execution. Each wave of parallel tasks gets its own worktree. Enable for concurrent work without branch switching. Default: false."),
  intent_lock: IntentLockConfigSchema.default(
    () => IntentLockConfigSchema.parse({}),
  )
    .describe("4-step governance gate for root sessions. When enabled, sessions must pass intent-lock → trajectory → roadmap → phase-manifest before file-mutation tools are unlocked. Default: disabled."),
})

/**
 * Workflow config schema with a factory default that produces
 * fully-resolved values (satisfies Zod v4 `.default()` type requirements).
 */
export const WorkflowConfigSchema = WorkflowConfigInnerSchema.default(
  () => WorkflowConfigInnerSchema.parse({}),
)

export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>

// ---------------------------------------------------------------------------
// 6. Delegation systems — enabled delegation modes
// ---------------------------------------------------------------------------

/**
 * Toggles for available delegation mechanisms.
 *
 * - `native_task`: OpenCode innate task tool (always available).
 * - `delegate_task`: Custom delegation via harness (f-06).
 * - `background_delegation`: Background/async delegation (f-06 advanced).
 *
 * @example
 * ```typescript
 * const result = DelegationSystemsSchema.safeParse({
 *   native_task: true,
 *   delegate_task: true,
 *   background_delegation: false,
 * })
 * // result.success === true
 * ```
 */
export const DelegationSystemsSchema = z
  .object({
    native_task: z.boolean().default(true)
      .describe("Enable OpenCode's built-in task tool for simple subagent dispatch. Always available but limited to basic delegation. Disable only if using exclusively delegate_task. Default: true."),
    delegate_task: z.boolean().default(true)
      .describe("Enable harness-controlled delegation via the delegate-task tool. Provides session stacking, context preservation, and trajectory tracking. Recommended for multi-agent workflows. Default: true."),
    background_delegation: z.boolean().default(true)
      .describe("Enable background/async delegation for long-running tasks. Tasks execute without blocking the parent session. Disable if you need all work synchronous. Default: true."),
  })
  .default({
    native_task: true,
    delegate_task: true,
    background_delegation: true,
  })

export type DelegationSystems = z.infer<typeof DelegationSystemsSchema>

// ---------------------------------------------------------------------------
// 7. Legacy key migration — camelCase → snake_case
// ---------------------------------------------------------------------------

/**
 * Maps legacy camelCase JSON keys to canonical snake_case keys.
 * Applied during `readConfigs()` to support backward-compatible config files.
 *
 * @example
 * ```typescript
 * // Input: { "conversationLanguage": "en" }
 * // After migration: { "conversation_language": "en" }
 * ```
 */
export const LEGACY_KEY_MAP: Record<string, string> = {
  conversationLanguage: "conversation_language",
  documentsLanguage: "documents_and_artifacts_language",
  documentPaths: "document_paths",
  userExpertLevel: "user_expert_level",
  delegationSystems: "delegation_systems",
} as const

/**
 * Applies legacy camelCase → snake_case key migration to a raw config object.
 * Mutates the input object in-place for efficiency.
 *
 * @param raw - The raw parsed JSON object from configs.json.
 * @returns The same object with legacy keys renamed to snake_case.
 */
export function migrateKeys(raw: Record<string, unknown>): Record<string, unknown> {
  for (const [oldKey, newKey] of Object.entries(LEGACY_KEY_MAP)) {
    if (oldKey in raw && !(newKey in raw)) {
      raw[newKey] = raw[oldKey]
      delete raw[oldKey]
    }
  }
  return raw
}

// ---------------------------------------------------------------------------
// 8. Hivemind configs — top-level .hivemind/configs.json schema
// ---------------------------------------------------------------------------

/**
 * Schema for `.hivemind/configs.json` — the full skeleton v2 §9.1 runtime configuration.
 * Loaded at every front-facing session start and reloaded after each user prompt.
 *
 * Unknown fields are stripped (lenient parsing) to support forward-compatible
 * configs from future versions without rejecting the entire file.
 *
 * @see SKELETON-INTEGRATED-SYSTEMATIC-APPROACH-v2 §9.1 for the full schema specification.
 *
 * @example
 * ```typescript
 * import { HivemindConfigsSchema, readConfigs } from "./configs.js"
 *
 * // Validate a config object
 * const result = HivemindConfigsSchema.safeParse({
 *   conversation_language: "en",
 *   mode: "expert-advisor",
 *   workflow: { research: true, plan_check: true },
 * })
 *
 * // Read from disk
 * const configs = readConfigs("/path/to/project")
 * ```
 */
/**
 * Schema for delegation depth conditions in governance rules.
 * Enables depth-based rule matching: rules fire only when session depth
 * falls within the specified min/max range (inclusive).
 */
export const DepthConditionSchema = z.object({
  min: z.number().optional()
    .describe("Minimum delegation depth (inclusive) for this condition to match. Depth 0 = root session. Use to restrict rules to deeper subagents."),
  max: z.number().optional()
    .describe("Maximum delegation depth (inclusive) for this condition to match. Depth 0 = root session. Use to restrict rules to shallow sessions."),
})

export const GovernanceRuleSchema = z.object({
  id: z.string()
    .describe("Unique identifier for this governance rule. Used for debugging and rule lookup. Format: kebab-case recommended (e.g., 'gov-delegate-task-subagent-only')."),
  condition: z.object({
    toolNames: z.array(z.string()).optional()
      .describe("Match when any of these tool names are called. Tool names are case-sensitive and match the registered tool name exactly."),
    sessionIDs: z.array(z.string()).optional()
      .describe("Match when the call originates from any of these session IDs. Use for session-specific governance."),
    depth: DepthConditionSchema.optional()
      .describe("Match when delegation depth falls within the min/max range. Depth 0 = root session."),
  }).catchall(z.unknown())
    .describe("Condition that triggers this rule. All specified fields must match (AND logic). Empty condition matches all calls."),
  action: z.object({
    type: z.enum(["allow", "warn", "block", "escalate", "needs_jit_grant"])
      .describe("Action to take when this rule matches. allow=permit, warn=permit+log, block=hard-block, escalate=human-in-the-loop, needs_jit_grant=require explicit grant."),
    escalation: z.record(z.string(), z.unknown()).optional()
      .describe("Additional context for escalate/needs_jit_grant actions. Passed to the escalation handler for routing."),
    message: z.string().optional()
      .describe("Human-readable message to display when this rule fires. Used in warn/block/escalate actions."),
  }).catchall(z.unknown())
    .describe("Action to take when this rule matches and all conditions are met."),
  enabled: z.boolean().default(true)
    .describe("Whether this rule is active. Disabled rules are skipped during evaluation. Default: true."),
})

/**
 * Schema for naming standards configuration.
 * Defines allowed frameworks, classifications, naming format, and title length limits.
 */
export const NamingStandardsSchema = z.object({
  allowed_frameworks: z.array(z.string()).optional()
    .describe("Permitted framework prefixes for agent/skill/tool naming. E.g., ['hm', 'hf', 'gate', 'stack']. Agents using other prefixes will be flagged."),
  allowed_classifications: z.array(z.string()).optional()
    .describe("Permitted classification tiers in the naming taxonomy. E.g., ['root', 'child', 'grandchild', 'fork']. Controls agent hierarchy naming."),
  naming_format: z.string().optional()
    .describe("Expected naming template pattern. E.g., '{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}'. Used for validation and auto-generation."),
  max_title_length: z.number().optional()
    .describe("Maximum character length for agent/skill titles. Longer titles are flagged during audits. Default: no limit."),
})

/**
 * Schema for per-agent configuration.
 * Defines agent description, allowed commands, tools, and temperature.
 */
export const AgentConfigSchema = z.object({
  description: z.string().optional()
    .describe("Human-readable description of this agent's purpose and capabilities. Used in agent discovery and routing."),
  allowedCommands: z.array(z.string()).optional()
    .describe("List of slash commands this agent is permitted to execute. Empty array = no commands allowed."),
  tools: z.array(z.string()).optional()
    .describe("List of tool names this agent can access. Empty array = no tools allowed. Omit for default tool set."),
  temperature: z.number().optional()
    .describe("Model temperature override for this agent (0.0-2.0). Higher values produce more creative/random output. Omit for default."),
})

/**
 * Schema for command-to-agent mapping configuration.
 * Defines which agent handles a command and the associated workflow.
 */
export const CommandConfigSchema = z.object({
  agent: z.string().optional()
    .describe("Agent name that handles this command. Empty string = no agent routing (inline execution)."),
  workflow: z.string().optional()
    .describe("Workflow identifier to execute when this command is invoked. Maps to a registered workflow definition."),
  description: z.string().optional()
    .describe("Human-readable description of what this command does. Used in command discovery and help text."),
})

/**
 * Schema for template configuration.
 * Defines template description and content.
 */
export const TemplateConfigSchema = z.object({
  description: z.string().optional()
    .describe("Human-readable description of when and how to use this template."),
  content: z.string().optional()
    .describe("Template body content. Supports mustache-style {{variable}} interpolation."),
})

/**
 * Schema for tool registry item configuration.
 * Defines tool name, description, and permissions.
 */
export const ToolRegistryItemSchema = z.object({
  name: z.string()
    .describe("Registered tool name identifier. Must match the tool's registered name exactly."),
  description: z.string()
    .describe("Human-readable description of what this tool does."),
  permissions: z.array(z.string())
    .describe("Permission categories this tool requires. E.g., ['read'], ['read', 'write'], ['delegate', 'session']."),
})

export const GovernanceConfigsSchema = z.object({
  rules: z.array(GovernanceRuleSchema).default([])
    .describe("Array of governance rules evaluated in order for every tool call. First matching rule wins. Empty array = no custom rules (use default_action for all calls)."),
  default_action: z.enum(["allow", "warn", "block", "escalate", "needs_jit_grant"]).default("allow")
    .describe("Fallback action when no governance rule matches a tool call. allow=permit-all, warn=permit+log, block=block-all, escalate=human-in-the-loop, needs_jit_grant=require explicit grant. Default: allow."),
  write_denylist_override: z.union([
    z.literal("disabled"),
    z.array(z.string()),
  ]).optional()
    .describe("Override the governance write denylist for doc-intelligence operations. 'disabled'=bypass denylist entirely; array of glob patterns=replace built-in denylist; omitted=null=built-in denylist applies."),
  hardcoded_gates: z.object({
    manual_state_writes: z.enum(["allow", "warn", "block"]).default("warn")
      .describe("Gate for manual writes to .hivemind/ state files. allow=permit without logging, warn=permit with warning, block=hard-block. Default: warn."),
  }).default({ manual_state_writes: "warn" })
    .describe("Hardcoded governance gates that cannot be overridden by rules. These are safety boundaries enforced regardless of rule configuration."),
  tool_denied_message: z.record(z.string(), z.object({
    message: z.string()
      .describe("Message template shown when OpenCode denies this tool. Supports {toolName} and {agentName} placeholders."),
  })).optional()
    .describe("Per-tool customizable deny messages emitted when OpenCode's native permission: field blocks a tool call. Keys are tool names; values contain a message template with {toolName} and {agentName} interpolation. Used by tool-guard-hooks to produce actionable hints instead of generic 'tool denied' errors."),
  naming_standards: NamingStandardsSchema.optional()
    .describe("Naming convention rules for agents, skills, tools, and commands. Controls allowed prefixes, classifications, format patterns, and title length limits."),
  agent_configs: z.record(z.string(), AgentConfigSchema).optional()
    .describe("Per-agent configuration overrides. Keyed by agent name. Controls description, allowed commands, tools, and temperature for each agent."),
  command_agent_mappings: z.record(z.string(), CommandConfigSchema).optional()
    .describe("Command-to-agent routing table. Keyed by command name. Maps slash commands to the agent that handles them and optional workflow identifiers."),
  templates: z.record(z.string(), TemplateConfigSchema).optional()
    .describe("Reusable prompt templates. Keyed by template name. Support mustache-style {{variable}} interpolation for dynamic content."),
  tool_registry: z.record(z.string(), ToolRegistryItemSchema).optional()
    .describe("Tool registration catalog. Keyed by tool name. Defines tool descriptions and permission categories for governance evaluation."),
})

export type GovernanceConfigs = z.infer<typeof GovernanceConfigsSchema>

/**
 * Behavioral override enums for config-driven profile customization.
 * These fields allow per-project override of the static BehavioralProfiles lookup.
 */
export const GuardrailLevelSchema = z.enum(["strict", "moderate", "permissive"])
  .describe("Guardrail intensity level. strict=block-by-default and require explicit grants; moderate=balanced enforcement; permissive=allow-by-default with minimal blocking.")
export const DelegationModeSchema = z.enum(["waiter", "direct", "autonomous"])
  .describe("Delegation dispatch style. waiter=synchronous-block-until-done; direct=fire-and-forget-with-result-callback; autonomous=full-self-directed-delegation.")
export const ToolAccessPatternSchema = z.enum(["restricted", "standard", "full"])
  .describe("Tool visibility level. restricted=essential-only-reduced-surface; standard=normal-set-for-most-workflows; full=everything-exposed-no-restrictions.")
export const SkillFilterSchema = z.enum(["curated", "domain", "full"])
  .describe("Skill loading filter. curated=essential-only-minimal-context; domain=project-relevant-skills; full=all-available-skills-maximal-context.")

export const HivemindConfigsSchema = z.object({
  conversation_language: SupportedLanguageSchema.default("en")
    .describe("Language for agent conversations and responses. Affects all text output from the agent. Change this to match your preferred communication language. Default: English."),
  documents_and_artifacts_language: SupportedLanguageSchema.default("en")
    .describe("Language for generated documents, summaries, and artifacts. Separate from conversation language so docs can be in English while conversation is in Vietnamese. Default: English."),
  document_paths: z.array(z.string()).default([".planning/"])
    .describe("Directory prefixes where planning artifacts live. The doc-intelligence engine uses these paths to determine which files to scan for language enforcement and governance. Default: ['.planning/']."),
  mode: HivemindModeSchema.default("expert-advisor")
    .describe("Operation mode controlling guardrail intensity and agent autonomy. expert-advisor uses TDD/spec-driven workflows; hivemind-powered adds hierarchical tracking; free-style disables most guardrails. Default: expert-advisor."),
  user_expert_level: UserExpertLevelSchema.default("intermediate-high-level")
    .describe("User proficiency level affecting agent output style and elaboration depth. Higher levels produce more concise, jargon-rich responses. Lower levels include more explanation and context. Default: intermediate-high-level."),
  delegation_systems: DelegationSystemsSchema
    .describe("Toggle which delegation mechanisms are available. native_task is OpenCode built-in; delegate_task adds harness-controlled delegation; background_delegation enables async execution. Default: all enabled."),
  parallelization: z.boolean().default(true)
    .describe("Allow wave-based parallel task execution when multiple independent tasks exist. Disable for sequential-only workflows or when debugging concurrency issues. Default: true."),
  atomic_commit: z.boolean().default(true)
    .describe("Require atomic commits after each task completion during phase execution. Ensures each logical change is independently revertable. Disable for bulk operations where many small commits add noise. Default: true."),
  commit_docs: z.boolean().default(true)
    .describe("Include documentation and planning artifacts in phase execution commits. When false, only code changes are committed. Disable when docs are managed separately from code. Default: true."),
  workflow: WorkflowConfigSchema
    .describe("Feature toggles controlling runtime behaviors — research, verification, UI phases, intent lock, and more. Each toggle maps to a specific OpenCode primitive or engine. Defaults: research=true, plan_check=true, verifier=true, all others false."),
  governance: GovernanceConfigsSchema.default({ rules: [], default_action: "allow", hardcoded_gates: { manual_state_writes: "warn" } })
    .describe("Governance rules, agent configs, command mappings, naming standards, and tool registry. Controls what tools are allowed, how agents behave, and which commands route where. Default: empty rules with allow-all fallback."),

  // ── Root-level behavioral overrides (backward-compatible) ────────────────
  guardrail_level: GuardrailLevelSchema.optional()
    .describe("Root-level guardrail override (legacy). Prefer behavioral.guardrail_level instead. Controls how strictly the agent follows rules: strict blocks more, permissive allows more. Resolution: behavioral.* > root-level > static profile."),
  delegation_mode: DelegationModeSchema.optional()
    .describe("Root-level delegation override (legacy). Prefer behavioral.delegation_mode instead. Controls how subagents are dispatched: waiter=block-until-done, direct=fire-and-forget, autonomous=full self-direction. Resolution: behavioral.* > root-level > static profile."),
  tool_access_pattern: ToolAccessPatternSchema.optional()
    .describe("Root-level tool access override (legacy). Prefer behavioral.tool_access_pattern instead. Controls which tools are surfaced to agents: restricted=minimal, standard=normal, full=all. Resolution: behavioral.* > root-level > static profile."),
  skill_filter: SkillFilterSchema.optional()
    .describe("Root-level skill filter override (legacy). Prefer behavioral.skill_filter instead. Controls which skills are loaded: curated=essential only, domain=project-relevant, full=all available. Resolution: behavioral.* > root-level > static profile."),

  // ── Nested behavioral block (new structured layout) ──────────────────────
  behavioral: z.object({
    guardrail_level: GuardrailLevelSchema.optional()
      .describe("Guardrail intensity: strict=block-by-default, moderate=balanced, permissive=allow-by-default. Overrides static profile lookup."),
    delegation_mode: DelegationModeSchema.optional()
      .describe("Delegation dispatch style: waiter=synchronous-block, direct=fire-and-forget, autonomous=self-directed delegation. Overrides static profile lookup."),
    tool_access_pattern: ToolAccessPatternSchema.optional()
      .describe("Tool visibility: restricted=essential-only, standard=normal-set, full=everything-exposed. Overrides static profile lookup."),
    skill_filter: SkillFilterSchema.optional()
      .describe("Skill loading filter: curated=essential-only, domain=project-relevant, full=all-available. Overrides static profile lookup."),
    communication_style: z.enum(["concise", "detailed", "mixed"]).optional()
      .describe("Agent response verbosity: concise=short-answers, detailed=full-explanations, mixed=context-dependent. Overrides runtime.communication_style."),
    decision_speed: z.enum(["fast", "deliberate"]).optional()
      .describe("Decision-making pace: fast=quick-execution, deliberate=thorough-analysis. Overrides runtime.decision_speed."),
    expertise: z.enum(["junior", "mid", "senior"]).optional()
      .describe("Agent self-model expertise level: junior=asks-more-questions, mid=balanced, senior=executes-confidently. Overrides runtime.expertise."),
  }).optional()
    .describe("Structured behavioral profile overrides. Resolution order: behavioral.* > root-level overrides > static profile default. Use this instead of root-level overrides for cleaner config."),

  // ── Nested language block (alternative to root-level conversation_language) ──
  language: z.object({
    conversation: SupportedLanguageSchema.optional()
      .describe("Override conversation language. Takes precedence over root-level conversation_language when set."),
    documents: SupportedLanguageSchema.optional()
      .describe("Override documents language. Takes precedence over root-level documents_and_artifacts_language when set."),
  }).optional()
    .describe("Structured language overrides. Resolution order: language.* > root-level fields. Use this when you want a structured config instead of separate root-level language fields."),

  // ── Nested runtime block (alternative to behavioral.communication_style, etc.) ──
  runtime: z.object({
    communication_style: z.enum(["concise", "detailed", "mixed"]).optional()
      .describe("Runtime communication style override. Takes precedence over behavioral.communication_style when set."),
    decision_speed: z.enum(["fast", "deliberate"]).optional()
      .describe("Runtime decision speed override. Takes precedence over behavioral.decision_speed when set."),
    expertise: z.enum(["junior", "mid", "senior"]).optional()
      .describe("Runtime expertise override. Takes precedence over behavioral.expertise when set."),
  }).optional()
    .describe("Runtime profile overrides. Resolution order: runtime.* > behavioral.* > root-level > static profile default. Use this for fine-grained runtime control."),

  // ── SDK configuration ────────────────────────────────────────────────
  sdk: z.object({
    baseUrl: z.string().optional()
      .describe("Override the runtime-derived serverUrl for v2 SDK client. When set, this takes priority over the serverUrl provided by OpenCode at plugin load time."),
    mode: z.enum(["v1", "v2", "auto"]).default("auto")
      .describe("SDK mode selection (D-11): 'v1' forced, 'v2' forced (fail-secure if no baseUrl), 'auto' resolves at init (default). Replaces the predecessor `version` field."),
  }).optional().describe("SDK client configuration. Controls v2 client activation and mode selection. Default: auto-detect via 'auto' mode."),
})

export type HivemindConfigs = z.infer<typeof HivemindConfigsSchema>

// ---------------------------------------------------------------------------
// 9. Defaults helper
// ---------------------------------------------------------------------------

/**
 * Returns the default Hivemind configuration object.
 * Merges schema defaults with DEFAULT_GOVERNANCE_CONFIGS.
 *
 * @returns Default configuration with all fields set to their default values.
 *
 * @example
 * ```typescript
 * const defaults = getDefaultConfigs()
 * // defaults.conversationLanguage === "en"
 * // defaults.mode === "expert-advisor"
 * ```
 */
export function getDefaultConfigs(): HivemindConfigs {
  const schemaDefaults = HivemindConfigsSchema.parse({})
  return deepMerge(schemaDefaults, { governance: DEFAULT_GOVERNANCE_CONFIGS }) as HivemindConfigs
}

// ---------------------------------------------------------------------------
// 10. Read/write helpers
// ---------------------------------------------------------------------------

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"

/**
 * Resolves the canonical path to `.hivemind/configs.json` for a given project root.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns Absolute path to `.hivemind/configs.json`.
 */
export function getConfigsPath(projectRoot: string): string {
  return resolve(projectRoot, ".hivemind", "configs.json")
}

/**
 * Reads and validates `.hivemind/configs.json` from disk. Returns defaults if
 * the file is missing or contains invalid JSON. Unknown fields are silently
 * stripped.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns Validated Hivemind configuration object.
 *
 * @example
 * ```typescript
 * const configs = readConfigs("/path/to/project")
 * console.log(configs.mode) // "expert-advisor"
 * ```
 */
export function readConfigs(projectRoot: string): HivemindConfigs {
  const configPath = getConfigsPath(projectRoot)

  if (!existsSync(configPath)) {
    return getDefaultConfigs()
  }

  try {
    const raw = readFileSync(configPath, "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>

    // Apply legacy camelCase → snake_case key migration
    migrateKeys(parsed)

    const result = HivemindConfigsSchema.safeParse(parsed)

    if (result.success) {
      return result.data
    }

    // Invalid schema — return defaults rather than crashing
    return getDefaultConfigs()
  } catch {
    // Corrupt JSON or read error — return defaults
    return getDefaultConfigs()
  }
}

export type ConfigFileValidationResult =
  | { success: true; data: HivemindConfigs }
  | { success: false; error: string }

/**
 * Validate `.hivemind/configs.json` without silently falling back to defaults.
 *
 * This helper is intended for diagnostics such as `hivemind doctor`, where the
 * caller needs a precise success/failure result instead of the lenient runtime
 * fallback behavior used by {@link readConfigs}.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @returns Explicit validation success or a human-readable failure message.
 *
 * @example
 * ```typescript
 * const result = validateConfigsFile("/path/to/project")
 * if (!result.success) console.error(result.error)
 * ```
 */
export function validateConfigsFile(projectRoot: string): ConfigFileValidationResult {
  const configPath = getConfigsPath(projectRoot)

  if (!existsSync(configPath)) {
    return { success: false, error: `Missing ${configPath}` }
  }

  try {
    const raw = readFileSync(configPath, "utf8")
    const parsed = JSON.parse(raw) as Record<string, unknown>
    migrateKeys(parsed)
    const result = HivemindConfigsSchema.safeParse(parsed)
    if (!result.success) {
      return {
        success: false,
        error: result.error.issues
          .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
          .join("; "),
      }
    }
    return { success: true, data: result.data }
  } catch (cause) {
    return { success: false, error: cause instanceof Error ? cause.message : String(cause) }
  }
}

/**
 * Validates and writes a Hivemind configuration object to `.hivemind/configs.json`.
 * Creates the parent directory if it does not exist.
 *
 * @param projectRoot - Absolute path to the project root directory.
 * @param config - Configuration object to validate and persist.
 * @returns The validated configuration that was written.
 * @throws {Error} If the config object fails Zod validation.
 *
 * @example
 * ```typescript
 * const written = writeConfigs("/path/to/project", {
 *   conversationLanguage: "vi",
 *   documentsLanguage: "en",
 *   mode: "hivemind-powered",
 *   userExpertLevel: "architecture-driven",
 *   delegationSystems: {
 *     native_task: true,
 *     delegate_task: true,
 *     background_delegation: true,
 *   },
 * })
 * ```
 */
export function writeConfigs(projectRoot: string, config: HivemindConfigs): HivemindConfigs {
  const validated = HivemindConfigsSchema.parse(config)
  const configPath = getConfigsPath(projectRoot)
  mkdirSync(dirname(configPath), { recursive: true })
  // Always write canonical snake_case JSON keys (schema already uses snake_case)
  writeFileSync(configPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8")
  return validated
}
