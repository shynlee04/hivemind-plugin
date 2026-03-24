/**
 * Skill Exposure Map — Selective skill bundle resolution per agent and runtime state.
 *
 * Resolves the top 6-7 skills for the active agent based on:
 * - The agent's registered identity
 * - The current purpose class (workflow type)
 * - The session state (main vs sub-session)
 *
 * Registry constraint: ONLY the 9 registered agent IDs from OPENCODE_AGENT_REGISTRY_IDS
 * are valid keys. Subagents spawned via Task() use their parent agent's skill bundle.
 *
 * @note The 9 valid agent IDs are: hiveminder, hivefiver, hiveq, hivemaker, hiveplanner,
 *       hivexplorer, hiverd, hivehealer, hitea. AGENT_BUNDLES is keyed by these strings.
 */

export interface SkillEntry {
  name: string
  description: string
}

/** Always-on skills shared across all agents */
const SHARED_SKILLS: SkillEntry[] = [
  {
    name: 'use-hivemind-delegation',
    description: 'Enforce delegation when front-facing agents must split work across subagents',
  },
]

/** Maximum skills to expose per turn (leaves room for conditional additions) */
const MAX_SKILLS = 7

/**
 * Base skill bundles per registered agent ID.
 * Only the 9 agents from OPENCODE_AGENT_REGISTRY_IDS are valid.
 * Subagents (architect, code-skeptic, handoff) are NOT registered — they
 * receive their dispatching parent's bundle.
 */
const AGENT_BUNDLES: Record<string, SkillEntry[]> = {
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
}

/** Conditional skill additions keyed by purpose class */
const PURPOSE_CONDITIONAL: Record<string, SkillEntry[]> = {
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
}

/** Skills added when operating as a sub-session (delegated context) */
const SUBSESSION_ADDITIONS: SkillEntry[] = [
  { name: 'git-continuity-memory', description: 'Git-aware context continuity and branch state management for delegated sessions' },
]

/**
 * Resolve the skill bundle for an active agent.
 *
 * @param activeAgent  - The agent ID from transformInput.agent (may be undefined)
 * @param purposeClass - The current purpose class from startWork routing
 * @param sessionState - The session state (main | sub-session | fresh | ongoing | continuation)
 * @returns Ordered skill entries capped at MAX_SKILLS (7)
 */
export function resolveSkillBundle(
  activeAgent: string | undefined,
  purposeClass: string | undefined,
  sessionState: string | undefined,
): SkillEntry[] {
  const seen = new Set<string>()
  const result: SkillEntry[] = []

  // 1. Always add shared skills first
  for (const skill of SHARED_SKILLS) {
    if (!seen.has(skill.name)) {
      seen.add(skill.name)
      result.push(skill)
    }
  }

  // 2. Add agent-specific bundle
  const effectiveAgent = (activeAgent && activeAgent in AGENT_BUNDLES)
    ? activeAgent
    : 'hivefiver' // Default fallback for unattributed turns

  const agentSkills = AGENT_BUNDLES[effectiveAgent] ?? []
  for (const skill of agentSkills) {
    if (!seen.has(skill.name) && result.length < MAX_SKILLS) {
      seen.add(skill.name)
      result.push(skill)
    }
  }

  // 3. Add purpose-conditional skills
  if (purposeClass && purposeClass in PURPOSE_CONDITIONAL) {
    const conditional = PURPOSE_CONDITIONAL[purposeClass]
    for (const skill of conditional) {
      if (!seen.has(skill.name) && result.length < MAX_SKILLS) {
        seen.add(skill.name)
        result.push(skill)
      }
    }
  }

  // 4. Add sub-session skills if applicable
  if (sessionState === 'sub-session') {
    for (const skill of SUBSESSION_ADDITIONS) {
      if (!seen.has(skill.name) && result.length < MAX_SKILLS) {
        seen.add(skill.name)
        result.push(skill)
      }
    }
  }

  return result
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
