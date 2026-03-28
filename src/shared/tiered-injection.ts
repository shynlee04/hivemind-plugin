/**
 * Tiered Injection — Two-tier skill injection resolution for the HiveMind framework.
 *
 * **Tier 1 (Core Init):** Skills always loaded during the project-initiation phase.
 * These are foundational skills every agent needs when setting up a project.
 *
 * **Tier 2 (Task-Conditional):** Skills loaded based on the current task classification.
 * The front agent (hiveminder/hivefiver) conditionally selects these based on:
 * - Active agent
 * - Current phase
 * - Task type
 *
 * @module shared/tiered-injection
 */

import type { SkillInjectionConfig } from '../schema-kernel/skill-injection-records.js'
import type { TaskClassification, PhaseClassification } from '../schema-kernel/agent-records.js'

/** A single skill entry — mirrors the schema-kernel SkillEntry type */
export interface SkillEntry {
  name: string
  description: string
}

/** A tier 2 task-conditional injection rule */
export interface SkillInjectionRule {
  /** The task classification that triggers this rule */
  task_classification: TaskClassification
  /** Skills always injected when this classification is active */
  mandatory_skills: SkillEntry[]
  /** Skills injected with high likelihood (treated as mandatory for resolution) */
  high_likelihood_skills: SkillEntry[]
}

// ─── Tier 1: Core Init Skills ────────────────────────────────────────────────

/**
 * Tier 1 core initialization skills — always loaded during project-initiation.
 *
 * These form the foundational skill set every agent needs when starting
 * a new project or resuming project initiation.
 */
export const TIER1_CORE_INIT_SKILLS: SkillEntry[] = [
  { name: 'use-hivemind', description: 'Session entry router — detects lineage, checks context health, routes to correct domain' },
  { name: 'use-hivemind-delegation', description: 'Enforce delegation when front-facing agents must split work across subagents' },
  { name: 'hivemind-spec-driven', description: 'Spec-driven engineering — from vague requirements to testable specs' },
]

// ─── Tier 2: Task-Conditional Rules ──────────────────────────────────────────

/**
 * Tier 2 task-conditional rules — activated when taskClassification is provided.
 *
 * Each rule maps a task classification to its mandatory and high-likelihood skills.
 * The front agent (hiveminder/hivefiver) triggers these based on task type.
 */
export const TIER2_TASK_RULES: SkillInjectionRule[] = [
  {
    task_classification: 'tdd',
    mandatory_skills: [
      { name: 'use-hivemind-tdd', description: 'Test-driven development — red-green-refactor cycle with gate enforcement' },
    ],
    high_likelihood_skills: [
      { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
      { name: 'verification-before-completion', description: 'Run verification commands and confirm output before completing claims' },
    ],
  },
  {
    task_classification: 'research',
    mandatory_skills: [
      { name: 'use-hivemind-research', description: 'Structured research methodology with question framing and evidence grading' },
    ],
    high_likelihood_skills: [
      { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
      { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
    ],
  },
  {
    task_classification: 'debug',
    mandatory_skills: [
      { name: 'hivemind-system-debug', description: 'Detox and restoration work with reproducibility, containment, and rollback logic' },
    ],
    high_likelihood_skills: [
      { name: 'systematic-debugging', description: 'Reproduce, narrow, contain, and create evidence before fixing bugs' },
    ],
  },
  {
    task_classification: 'refactor',
    mandatory_skills: [
      { name: 'hivemind-refactor', description: 'Refactor methodology — smallest safe change, behavior preservation' },
    ],
    high_likelihood_skills: [
      { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
      { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
    ],
  },
  {
    task_classification: 'implementation',
    mandatory_skills: [
      { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
    ],
    high_likelihood_skills: [
      { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
    ],
  },
  {
    task_classification: 'codebase-scan',
    mandatory_skills: [
      { name: 'hivemind-codemap', description: 'Whole-codebase mapping, seam discovery, and concern slicing for refactors' },
    ],
    high_likelihood_skills: [
      { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
    ],
  },
  {
    task_classification: 'spec-driven',
    mandatory_skills: [
      { name: 'hivemind-spec-driven', description: 'Spec-driven engineering — from vague requirements to testable specs' },
    ],
    high_likelihood_skills: [
      { name: 'writing-plans', description: 'Create structured implementation plans with success criteria and dependencies' },
    ],
  },
  {
    task_classification: 'investigation',
    mandatory_skills: [
      { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
    ],
    high_likelihood_skills: [
      { name: 'hivemind-codemap', description: 'Whole-codebase mapping, seam discovery, and concern slicing for refactors' },
      { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
    ],
  },
]

// ─── Resolution Logic ────────────────────────────────────────────────────────

/**
 * Resolve the complete skill bundle using the two-tier injection system.
 *
 * **Resolution order:**
 * 1. Shared skills from config (always)
 * 2. Tier 1 core init skills (if phase is 'project-initiation')
 * 3. Agent-specific bundle from config
 * 4. Tier 2 task-conditional skills (if taskClassification provided)
 * 5. Purpose-conditional skills from config (if purposeClass matches)
 * 6. Sub-session additions (if sessionState is 'sub-session')
 *
 * All entries are deduplicated by skill name. The max_skills cap is respected
 * when set (null = unlimited).
 *
 * @param agentId            - The active agent ID (e.g., 'hivemaker')
 * @param phaseClassification - The current phase classification ('project-initiation' | 'planning-execution')
 * @param taskClassification  - The current task classification (optional — triggers Tier 2 when present)
 * @param config             - The skill injection configuration
 * @param options            - Optional parameters: purposeClass, sessionState
 * @returns Ordered, deduplicated skill entries
 */
export function resolveTieredSkills(
  agentId: string | undefined,
  phaseClassification: PhaseClassification | undefined,
  taskClassification: TaskClassification | undefined,
  config: SkillInjectionConfig,
  options?: { purposeClass?: string | undefined; sessionState?: string | undefined },
): SkillEntry[] {
  const maxSkills = config.max_skills
  const seen = new Set<string>()
  const result: SkillEntry[] = []
  const purposeClass = options?.purposeClass
  const sessionState = options?.sessionState

  /** Check if we've hit the cap */
  const isCapped = (): boolean => maxSkills !== null && result.length >= maxSkills

  /** Add a skill if not seen and not capped */
  const addSkill = (skill: SkillEntry): void => {
    if (isCapped()) return
    if (!seen.has(skill.name)) {
      seen.add(skill.name)
      result.push(skill)
    }
  }

  // 1. Shared skills (always)
  for (const skill of config.shared_skills) {
    addSkill(skill)
  }

  // 2. Tier 1: Core init skills (project-initiation only)
  if (phaseClassification === 'project-initiation') {
    for (const skill of TIER1_CORE_INIT_SKILLS) {
      addSkill(skill)
    }
  }

  // 3. Agent-specific bundle
  const defaultAgent = config.default_agent ?? 'hiveminder'
  const effectiveAgent = (agentId && agentId in config.agent_bundles)
    ? agentId
    : defaultAgent

  const agentSkills = config.agent_bundles[effectiveAgent] ?? []
  for (const skill of agentSkills) {
    addSkill(skill)
  }

  // 4. Tier 2: Task-conditional rules (when taskClassification provided)
  if (taskClassification) {
    const taskRule = TIER2_TASK_RULES.find(r => r.task_classification === taskClassification)
    if (taskRule) {
      for (const skill of taskRule.mandatory_skills) {
        addSkill(skill)
      }
      for (const skill of taskRule.high_likelihood_skills) {
        addSkill(skill)
      }
    }
  }

  // 5. Purpose-conditional skills (when purposeClass matches a key in config)
  if (purposeClass && purposeClass in config.purpose_conditional) {
    const conditionalSkills = config.purpose_conditional[purposeClass as keyof typeof config.purpose_conditional]
    for (const skill of conditionalSkills) {
      addSkill(skill)
    }
  }

  // 6. Sub-session additions
  if (sessionState === 'sub-session') {
    for (const skill of config.subsession_additions) {
      addSkill(skill)
    }
  }

  return result
}
