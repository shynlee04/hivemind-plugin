/**
 * Per-agent configuration defaults.
 * Maps agent IDs to their descriptions and optional settings.
 */
export const AGENT_CONFIGS = {
    "hf-agent-builder": {
      description: "Creates, audits, and repairs OpenCode agent definitions with YAML frontmatter, granular permissions, and XML-tagged execution flows.",
    },
    "hf-auditor": {
      description: "Audits OpenCode primitives (agents, skills, commands, tools) for quality compliance, drift detection, anti-pattern discovery, and structural integrity.",
    },
    "hf-command-builder": {
      description: "Creates and audits OpenCode command definitions with YAML frontmatter, $ARGUMENTS parsing, and non-interactive shell safety.",
    },
    "hf-coordinator": {
      description: "Meta-builder category coordinator for hf-* lineage. Dispatches meta-concept specialists, manages creation waves, validates AQUAL compliance.",
    },
    "hf-l0-orchestrator": {
      description: "Front-facing high-reasoning L0 strategist and battle commander for hf-* meta-builder lineage.",
    },
    "hf-meta-builder": {
      description: "Meta-concept workflow specialist for the hf-* lineage. Architects multi-agent workflows through MINDNETWORK graphs.",
    },
    "hf-prompter": {
      description: "Expert prompt engineering and validation specialist for creating, optimizing, and testing high-quality prompts.",
    },
    "hf-refactorer": {
      description: "Refactors OpenCode skills and agents to improve structural quality, reduce technical debt, eliminate anti-patterns.",
    },
    "hf-skill-builder": {
      description: "Creates and audits SKILL.md packages with progressive disclosure, trigger phrases, and agentskills.io compliance.",
    },
    "hf-synthesizer": {
      description: "Synthesizes OpenCode skills from GitHub repositories, codebase patterns, and documentation.",
    },
    "hf-tool-builder": {
      description: "Creates custom OpenCode tools with Zod schemas, plugin hooks, and TypeScript implementation.",
    },
    "hm-architect": {
      description: "Designs technical architecture and produces Architecture Decision Records.",
    },
    "hm-code-fixer": {
      description: "Applies code review fixes atomically, producing one commit per fix and generating REVIEW-FIX.md.",
    },
    "hm-code-reviewer": {
      description: "Performs adversarial code review against spec compliance and code quality standards.",
    },
    "hm-codebase-mapper": {
      description: "Extracts codebase structure, dependency graphs, and pattern maps.",
    },
    "hm-debug-session-manager": {
      description: "Orchestrates multi-cycle debugging sessions with checkpoint state persistence.",
    },
    "hm-debugger": {
      description: "Investigates bugs through hypothesis-driven root cause analysis.",
    },
    "hm-doc-verifier": {
      description: "Verifies documentation claims against actual code implementation.",
    },
    "hm-doc-writer": {
      description: "Authors project documentation including README, API references, and usage guides.",
    },
    "hm-ecologist": {
      description: "Maps feature dependencies and cross-cutting impact across the project ecosystem.",
    },
    "hm-executor": {
      description: "Executes PLAN.md tasks atomically with wave-based parallelization, deviation handling, and checkpoint protocols.",
    },
    "hm-integration-checker": {
      description: "Validates cross-phase integration and end-to-end flow correctness.",
    },
    "hm-intel-updater": {
      description: "Maintains codebase intelligence files in .planning/intel/ with structured JSON summaries.",
    },
    "hm-intent-loop": {
      description: "Clarifies user intent through structured Q&A sessions when requirements are ambiguous.",
    },
    "hm-l0-orchestrator": {
      description: "Front-facing high-reasoning L0 strategist and battle commander for hm-* product development.",
    },
    "hm-nyquist-auditor": {
      description: "Performs Nyquist validation gap analysis on completed phases.",
    },
    "hm-orchestrator": {
      description: "L0 front-facing agent for session orchestration, routing, and governance.",
    },
    "hm-pattern-mapper": {
      description: "Maps code patterns and conventions for new file creation.",
    },
    "hm-phase-researcher": {
      description: "Conducts phase-specific implementation research before planning.",
    },
    "hm-plan-checker": {
      description: "Validates plan completeness through goal-backward analysis.",
    },
    "hm-planner": {
      description: "Decomposes phase objectives into executable tasks with dependency analysis.",
    },
    "hm-project-researcher": {
      description: "Conducts domain ecosystem research before roadmap creation.",
    },
    "hm-roadmapper": {
      description: "Breaks project scope into phases and maps requirements.",
    },
    "hm-security-auditor": {
      description: "Performs STRIDE threat model verification against implemented code.",
    },
    "hm-shipper": {
      description: "Coordinates release preparation including CHANGELOG.md generation, version bumping.",
    },
    "hm-specifier": {
      description: "Performs spec-driven authoring, transforming requirements into falsifiable SPEC.md documents.",
    },
    "hm-synthesizer": {
      description: "Combines outputs from parallel research agents into a consolidated SUMMARY.md artifact.",
    },
    "hm-ui-auditor": {
      description: "Performs 6-pillar visual audit of implemented frontend screens.",
    },
    "hm-ui-checker": {
      description: "Validates frontend implementation against UI design contracts.",
    },
    "hm-ui-researcher": {
      description: "Creates UI design contracts as UI-SPEC.md documents.",
    },
    "hm-user-profiler": {
      description: "Analyzes developer session interactions to build a behavioral profile.",
    },
    "hm-verifier": {
      description: "Verifies implementation completeness through goal-backward validation.",
    },
} as const
