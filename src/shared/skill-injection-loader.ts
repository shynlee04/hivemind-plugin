/**
 * Skill Injection Loader — Config-driven dynamic skill bundle resolution.
 *
 * Reads skill injection configuration from `{packageRoot}/config/skill-injection.json`,
 * validates skill names against the on-disk registry, and caches the result.
 * Falls back to defaults when config file is missing.
 *
 * @module shared/skill-injection-loader
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { type SkillInjectionConfig, type SkillValidationResult } from '../schema-kernel/skill-injection-records.js'
import { createOpencodeSkillRegistry } from './opencode-skill-registry.js'

export type { SkillInjectionConfig, SkillValidationResult }

/** Cached config singleton — keyed by package root */
let cachedConfig: SkillInjectionConfig | null = null
let cachedRoot: string | null = null

/**
 * Build a default config derived from the current hardcoded exposure map.
 * Used when no config file exists on disk.
 *
 * @returns Default SkillInjectionConfig with agent bundles and purpose conditionals
 */
function buildDefaultConfig(): SkillInjectionConfig {
  return {
    _meta: {
      version: '1.0.0',
      updated_at: new Date().toISOString(),
      updated_by: 'hivemaker',
      schema: 'skill-injection-config-v1',
    },
    shared_skills: [
      { name: 'use-hivemind-delegation', description: 'Enforce delegation when front-facing agents must split work across subagents' },
    ],
    max_skills: null,
    agent_bundles: {
      hiveminder: [
        { name: 'hivemind-gatekeeping-delegation', description: 'Gatekeeping for multi-pass delegation loops and synthesis gates' },
        { name: 'git-continuity-memory', description: 'Git-aware context continuity, commit SHAs, and branch state for delegation resume' },
        { name: 'hivemind-atomic-commit', description: 'Atomic commit discipline with typed activity classification and pre-commit gates' },
      ],
      hivefiver: [
        { name: 'hivemind-gatekeeping-delegation', description: 'Gatekeeping for multi-pass delegation loops and synthesis gates' },
        { name: 'git-continuity-memory', description: 'Git-aware context continuity and branch state management' },
        { name: 'hivemind-atomic-commit', description: 'Atomic commit discipline with typed activity classification' },
      ],
      hiveq: [
        { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
        { name: 'verification-before-completion', description: 'Run verification commands and confirm output before completing claims' },
        { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
      ],
      hivemaker: [
        { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
        { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
        { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
        { name: 'test-driven-development', description: 'Test-first development with red-green-refactor discipline' },
      ],
      hiveplanner: [
        { name: 'writing-plans', description: 'Create structured implementation plans with success criteria and dependencies' },
        { name: 'breakdown-plan', description: 'Break down work into Epic > Feature > Story/Enabler > Test hierarchy' },
        { name: 'spec-distillation', description: 'Distill noisy requirements into structured spec candidates before planning' },
      ],
      hivexplorer: [
        { name: 'research-delegation', description: 'Research-specific delegation for evidence collection and multi-source synthesis' },
        { name: 'context-map', description: 'Map all files relevant to a task before making changes' },
        { name: 'hivemind-codemap', description: 'Whole-codebase mapping, seam discovery, and concern slicing for refactors' },
        { name: 'hivemind-research', description: 'Structured research methodology with question framing and evidence grading' },
      ],
      hiverd: [
        { name: 'research-delegation', description: 'Research-specific delegation for evidence collection and multi-source synthesis' },
        { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
        { name: 'hivemind-research', description: 'Structured research methodology with question framing and evidence grading' },
      ],
      hivehealer: [
        { name: 'course-correction-delegation', description: 'Debug loop delegation: reproduce, narrow, contain, and prove evidence' },
        { name: 'systematic-debugging', description: 'Reproduce, narrow, contain, and create evidence before fixing bugs' },
        { name: 'hivemind-system-debug', description: 'Detox and restoration work with reproducibility and rollback logic' },
      ],
      hitea: [
        { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
        { name: 'qa-test-planner', description: 'Comprehensive test plans with manual test cases and regression suites' },
        { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
      ],
    },
    purpose_conditional: {
      tdd: [
        { name: 'tdd-delegation', description: 'TDD-aware delegation for red-green-refactor loops with phase gates' },
        { name: 'test-driven-development', description: 'Test-first development with 80%+ coverage requirements' },
      ],
      research: [
        { name: 'research-delegation', description: 'Research-specific delegation for evidence collection and multi-source synthesis' },
        { name: 'deep-research', description: 'Enterprise-grade research with multi-source synthesis and citation tracking' },
      ],
      planning: [
        { name: 'writing-plans', description: 'Create structured implementation plans with success criteria and dependencies' },
        { name: 'breakdown-plan', description: 'Break down work into Epic > Feature > Story/Enabler > Test hierarchy' },
      ],
      implementation: [
        { name: 'clean-code', description: 'Clean Code principles: meaningful names, small functions, clear intent' },
        { name: 'refactor', description: 'Surgical refactoring to improve maintainability without changing behavior' },
      ],
      'course-correction': [
        { name: 'course-correction-delegation', description: 'Debug loop delegation: reproduce, narrow, contain, and prove evidence' },
        { name: 'systematic-debugging', description: 'Reproduce, narrow, contain, and create evidence before fixing bugs' },
      ],
      gatekeeping: [
        { name: 'hivemind-gatekeeping-delegation', description: 'Gatekeeping for multi-pass delegation loops and synthesis gates' },
        { name: 'verification-before-completion', description: 'Run verification commands and confirm output before completing claims' },
      ],
    },
    subsession_additions: [
      { name: 'git-continuity-memory', description: 'Git-aware context continuity and branch state management for delegated sessions' },
    ],
    excluded_skill_ids: [],
    default_agent: 'hiveminder',
  }
}

/**
 * Load skill injection configuration from disk.
 *
 * Reads `{packageRoot}/config/skill-injection.json`. If the file doesn't exist,
 * returns default config derived from the original hardcoded exposure map.
 * Results are cached per package root.
 *
 * @param packageRoot - Absolute path to the project root
 * @returns Parsed or default SkillInjectionConfig
 */
export function loadSkillInjectionConfig(packageRoot: string): SkillInjectionConfig {
  // Return cached config if root matches
  if (cachedConfig && cachedRoot === packageRoot) {
    return cachedConfig
  }

  const configPath = join(packageRoot, 'config', 'skill-injection.json')

  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as SkillInjectionConfig
    cachedConfig = parsed
    cachedRoot = packageRoot
    return parsed
  } catch (err) {
    // Config file missing or unreadable — use defaults
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(
        `[skill-injection-loader] Config file not found at ${configPath}. ` +
        'Using default skill injection config. Create the file to customize skill bundles.',
      )
    } else {
      console.warn(
        `[skill-injection-loader] Failed to read config at ${configPath}: ${(err as Error).message}. ` +
        'Using default config.',
      )
    }

    cachedConfig = buildDefaultConfig()
    cachedRoot = packageRoot
    return cachedConfig
  }
}

/**
 * Validate skill names in a config against the on-disk skill registry.
 *
 * Builds the registry from SKILL.md files on disk, then checks
 * every skill name referenced in the config. Missing skills are reported as
 * warnings (not errors), so the config remains valid.
 *
 * @param config - The skill injection config to validate
 * @param packageRoot - Absolute path to the project root for registry scan
 * @returns Validation result with missing skills and warnings
 */
export function validateSkillNames(
  config: SkillInjectionConfig,
  packageRoot: string,
): SkillValidationResult {
  const registry = createOpencodeSkillRegistry(packageRoot)
  const registryIds = new Set(registry.map(entry => entry.id))

  const allSkillNames: string[] = []

  // Collect all referenced skill names from config
  for (const skill of config.shared_skills) {
    allSkillNames.push(skill.name)
  }
  for (const bundle of Object.values(config.agent_bundles)) {
    for (const skill of bundle) {
      allSkillNames.push(skill.name)
    }
  }
  for (const conditional of Object.values(config.purpose_conditional)) {
    for (const skill of conditional) {
      allSkillNames.push(skill.name)
    }
  }
  for (const skill of config.subsession_additions) {
    allSkillNames.push(skill.name)
  }

  // Deduplicate
  const uniqueNames = [...new Set(allSkillNames)]

  // Find missing
  const missingSkills = uniqueNames.filter(name => !registryIds.has(name))
  const warnings = missingSkills.map(
    name => `Skill "${name}" not found in registry at ${packageRoot}/skills/`,
  )

  return {
    valid: true, // Missing skills are warnings, not errors
    missing_skills: missingSkills,
    warnings,
  }
}

/**
 * Reset cached config — for testing only.
 * @internal
 */
export function resetCache(): void {
  cachedConfig = null
  cachedRoot = null
}
