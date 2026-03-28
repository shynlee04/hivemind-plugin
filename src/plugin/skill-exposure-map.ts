/**
 * Skill Exposure Map — Selective skill bundle resolution per agent and runtime state.
 *
 * Resolves skills for the active agent based on:
 * - The agent's registered identity
 * - The current purpose class (workflow type)
 * - The session state (main vs sub-session)
 *
 * Configuration is loaded dynamically via the skill injection loader.
 * Call `initSkillInjection(packageRoot)` once at plugin startup.
 *
 * Registry constraint: ONLY the 9 registered agent IDs are valid keys.
 * Subagents spawned via Task() use their parent agent's skill bundle.
 *
 * @module plugin/skill-exposure-map
 */

import { loadSkillInjectionConfig, type SkillInjectionConfig } from '../shared/skill-injection-loader.js'
import { resolveTieredSkills } from '../shared/tiered-injection.js'
import type { TaskClassification } from '../schema-kernel/agent-records.js'

export interface SkillEntry {
  name: string
  description: string
}

/** Cached config — populated by initSkillInjection() */
let cachedConfig: SkillInjectionConfig | null = null

/**
 * Resolve the default agent name from the loaded config.
 *
 * Returns the configured `default_agent` field, or falls back to `'hiveminder'`
 * if no config has been loaded yet.
 *
 * @returns The default agent ID
 */
export function resolveDefaultAgent(): string {
  return cachedConfig?.default_agent ?? 'hiveminder'
}

/**
 * Initialize skill injection from config file.
 *
 * Must be called once at plugin startup before resolveSkillBundle() is used.
 * Loads from '{packageRoot}/config/skill-injection.json', falling back to defaults.
 *
 * @param packageRoot - Absolute path to the project root
 */
export function initSkillInjection(packageRoot: string): void {
  cachedConfig = loadSkillInjectionConfig(packageRoot)
}

/**
 * Resolve the skill bundle for an active agent.
 *
 * Delegates to the two-tier injection system (`resolveTieredSkills`) which
 * handles shared skills, Tier 1 core init (project-initiation), agent bundles,
 * Tier 2 task-conditional (when taskClassification is provided), purpose-conditional,
 * and sub-session additions.
 *
 * The 4th parameter `taskClassification` is OPTIONAL — existing callers
 * (e.g., messages-transform-adapter.ts) use 3 args and continue to work.
 *
 * @param activeAgent        - The agent ID from transformInput.agent (may be undefined)
 * @param purposeClass       - The current purpose class from startWork routing
 * @param sessionState       - The session state (main | sub-session | fresh | ongoing | continuation)
 * @param taskClassification - The current task classification (optional — triggers Tier 2 injection)
 * @returns Ordered skill entries
 */
export function resolveSkillBundle(
  activeAgent: string | undefined,
  purposeClass: string | undefined,
  sessionState: string | undefined,
  taskClassification?: TaskClassification | undefined,
): SkillEntry[] {
  if (!cachedConfig) {
    // Fallback: if init was never called, return empty bundle
    console.warn('[skill-exposure-map] resolveSkillBundle called before initSkillInjection. Returning empty bundle.')
    return []
  }

  // Phase classification is not exposed to the adapter yet; derive from purposeClass
  // When purposeClass is absent, phaseClassification is undefined (no Tier 1 injection)
  const phaseClassification = undefined

  return resolveTieredSkills(
    activeAgent,
    phaseClassification,
    taskClassification,
    cachedConfig,
    { purposeClass, sessionState },
  )
}

/**
 * Session role classification — determines whether the agent should DELEGATE or COMPLETE.
 *
 * This is NOT a role label. It is a behavioral directive written as natural
 * user-side guidance that tells the agent what to do with its current turn.
 */
export type SessionRole = 'orchestrate' | 'specialist' | 'standalone'

/**
 * Determine the session role based on session state and agent type.
 *
 * - main/fresh/ongoing/continuation + orchestrator agent → "orchestrate"
 *   → You are the conductor. Delegate work. Coordinate specialists.
 *
 * - sub-session + specialist agent → "specialist"
 *   → You received delegated work. Complete it. Do NOT redelegate.
 *     Stop only at a checkpoint, then return your evidence.
 *
 * - standalone agents (explorer, hiverd, hiveplanner) → "standalone"
 *   → You are doing direct research or planning. Make progress.
 *     Use subagents only for isolated parallel research.
 */
export function resolveSessionRole(
  sessionState: string | undefined,
  activeAgent: string | undefined,
): SessionRole {
  // Orchestrator agents: hiveminder, hivefiver — always orchestrate in main sessions
  if (activeAgent === 'hiveminder' || activeAgent === 'hivefiver') {
    return 'orchestrate'
  }

  // Sub-session: specialist completing delegated work
  if (sessionState === 'sub-session') {
    return 'specialist'
  }

  // Specialist agents that should complete directly (not redelegate)
  const specialistAgents = ['hiveq', 'hivemaker', 'hivehealer', 'hitea']
  if (activeAgent && specialistAgents.includes(activeAgent)) {
    return 'specialist'
  }

  // Research/planning agents: standalone but may use parallel subagents
  const standaloneAgents = ['hivexplorer', 'hiverd', 'hiveplanner']
  if (activeAgent && standaloneAgents.includes(activeAgent)) {
    return 'standalone'
  }

  // Default for unknown agents
  return sessionState === 'sub-session' ? 'specialist' : 'orchestrate'
}

/**
 * Render the natural-language session role directive.
 * This is written as user-side prompting, NOT a system label.
 */
export function renderSessionRoleDirective(role: SessionRole): string {
  switch (role) {
    case 'orchestrate':
      return 'You are coordinating the session. Break work into focused tasks and delegate each to the right specialist. Do not implement directly — have specialists do the work and verify their returns.'
    case 'specialist':
      return 'You have a specific task to complete. Work on it until you reach a checkpoint, then return your evidence and findings. Do not redelegate your assigned work — you are the terminal executor for this task.'
    case 'standalone':
      return 'You are doing direct research or planning. Make tangible progress each turn. You may use parallel subagents for isolated research threads, but own the synthesis yourself.'
  }
}
