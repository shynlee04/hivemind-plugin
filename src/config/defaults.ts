import type { GovernanceConfigs } from "../schema-kernel/hivemind-configs.schema.js"

/**
 * Default governance configurations for the Hivemind ecosystem.
 * Provides sensible defaults for agents, commands, tools, rules, naming standards, and templates.
 */
export const DEFAULT_GOVERNANCE_CONFIGS: GovernanceConfigs = {
  rules: [
    {
      id: "gov-delegate-task-subagent-only",
      condition: {
        toolNames: ["delegate-task"],
        depth: { max: 0 },
      },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-write-depth-warn",
      condition: {
        toolNames: ["write", "edit"],
        depth: { min: 2 },
      },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-delegate-task-depth-block",
      condition: {
        toolNames: ["delegate-task"],
        depth: { min: 3 },
      },
      action: { type: "allow" },
      enabled: true,
    },
    {
      id: "gov-create-session-naming-warn",
      condition: {
        toolNames: ["create-governance-session"],
      },
      action: { type: "warn" },
      enabled: true,
    },
    {
      id: "gov-unsafe-tools-escalate",
      condition: {
        toolNames: ["bash"],
        depth: { min: 1 },
      },
      action: {
        type: "escalate",
        escalation: { reason: "bash in child session" },
      },
      enabled: true,
    },
  ],
  naming_standards: {
    allowed_frameworks: ["hm", "hf", "gate", "stack"],
    allowed_classifications: ["root", "child", "grandchild", "fork"],
    naming_format: "{framework}/{workflow}/{classification}/{agent}/{purpose}@{depth}",
  },
  agent_configs: {
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
  },
  command_agent_mappings: {
    "deep-init": {
      description: "Generate hierarchical AGENTS.md files with root + complexity-scored subdirectories.",
      agent: "",
    },
    "deep-research-synthesis-repomix": {
      description: "Reference document: Advanced Repomix + OpenCode orchestration cheat sheet.",
      agent: "hm-l2-researcher",
    },
    "harness-audit": {
      description: "Comprehensive harness audit: boundary integrity, claim-vs-reality, governance, context poisoning.",
      agent: "hf-l0-orchestrator",
    },
    "harness-doctor": {
      description: "Run harness diagnostics. Checks configuration, agents, plugin control path, and harness health.",
      agent: "hm-l0-orchestrator",
    },
    "hf-absorb": {
      description: "Absorb dense context (links, text, files, stories, events, actors) into persistent session context.",
      agent: "hf-l0-orchestrator",
    },
    "hf-audit": {
      description: "Audit existing skills, agents, commands, or tools for quality, overlaps, and dead references.",
      agent: "hf-l0-orchestrator",
    },
    "hf-configure": {
      description: "Configure OpenCode primitives (agents, commands, skills) programmatically.",
      agent: "hf-l0-orchestrator",
    },
    "hf-create": {
      description: "Create a new skill, agent, command, or tool. Routes to the right specialist.",
      agent: "hf-l0-orchestrator",
    },
    "hf-prompt-enhance-to-plan": {
      description: "Enhance, improve, and export as plan repack a prompt through selection of suitable template.",
      agent: "hf-prompter",
    },
    "hf-prompt-enhance": {
      description: "Enhance, audit, or repack a prompt through skim, investigation lanes, clarification gating.",
      agent: "hm-coordinator",
    },
    "hf-stack": {
      description: "Stack multiple skills together for a specific workflow.",
      agent: "hf-l0-orchestrator",
    },
    "hm-add-tests": {
      description: "Generate tests for a completed phase based on UAT criteria and implementation.",
      agent: "hm-orchestrator",
    },
    "hm-ai-integration-phase": {
      description: "Generate an AI-SPEC.md design contract for phases that involve building AI systems.",
      agent: "hm-planner",
    },
    "hm-architect": {
      description: "Design technical architecture and produce Architecture Decision Records.",
      agent: "hm-architect",
    },
    "hm-audit-fix": {
      description: "Autonomous audit-to-fix pipeline — find issues, classify, fix, test, commit.",
      agent: "hm-code-fixer",
    },
    "hm-audit-milestone": {
      description: "Audit milestone completion against original intent before archiving.",
      agent: "hm-nyquist-auditor",
    },
    "hm-audit-uat": {
      description: "Cross-phase audit of all outstanding UAT and verification items.",
      agent: "hm-nyquist-auditor",
    },
    "hm-audit": {
      description: "Run codebase and primitive audit to identify structure drift, orphaned configurations.",
      agent: "hm-nyquist-auditor",
    },
    "hm-autonomous": {
      description: "Run all remaining phases autonomously — discuss→plan→execute per phase.",
      agent: "hm-orchestrator",
    },
    "hm-capture": {
      description: "Capture ideas, tasks, notes, and seeds to their destination.",
      agent: "hm-orchestrator",
    },
    "hm-cleanup": {
      description: "Archive accumulated phase directories from completed milestones.",
      agent: "hm-orchestrator",
    },
    "hm-code-review": {
      description: "Review source files for bugs, security issues, spec compliance, and code quality.",
      agent: "hm-code-reviewer",
    },
    "hm-complete-milestone": {
      description: "Archive completed milestone and prepare for next version.",
      agent: "hm-roadmapper",
    },
    "hm-config": {
      description: "Configure Hivemind settings — workflow toggles, advanced knobs, integrations, and model profile.",
      agent: "hm-orchestrator",
    },
    "hm-debug": {
      description: "Start systematic debugging session to diagnose and repair connection, compilation, or logic errors.",
      agent: "hm-debugger",
    },
    "hm-deep-init": {
      description: "Generate hierarchical AGENTS.md files with root + complexity-scored subdirectories.",
      agent: "hm-orchestrator",
    },
    "hm-deep-research-synthesis-repomix": {
      description: "Reference document: Advanced Repomix + OpenCode orchestration cheat sheet.",
      agent: "hm-phase-researcher",
    },
    "hm-discuss-phase": {
      description: "Gather phase context through adaptive questioning before planning.",
      agent: "hm-intent-loop",
    },
    "hm-discuss": {
      description: "Start phase discussion to clarify intent, lock decisions, and establish boundaries before planning.",
      agent: "hm-intent-loop",
    },
    "hm-docs-update": {
      description: "Generate or update project documentation verified against the codebase.",
      agent: "hm-orchestrator",
    },
    "hm-doctor": {
      description: "Run a comprehensive health check on the Hivemind project.",
      agent: "hm-nyquist-auditor",
    },
    "hm-ecologist": {
      description: "Map feature dependencies and cross-cutting impact across the project ecosystem.",
      agent: "hm-ecologist",
    },
    "hm-eval-review": {
      description: "Audit an executed AI phase's evaluation coverage and produce an EVAL-REVIEW.md remediation plan.",
      agent: "hm-code-reviewer",
    },
    "hm-execute-phase": {
      description: "Execute all plans in a phase with wave-based parallelization, atomic commits, deviation handling.",
      agent: "hm-executor",
    },
    "hm-execute": {
      description: "Execute a created phase plan using TDD, atomic commits, and regression checks.",
      agent: "hm-executor",
    },
    "hm-explore": {
      description: "Socratic ideation and idea routing — think through ideas before committing to plans.",
      agent: "hm-orchestrator",
    },
    "hm-extract-learnings": {
      description: "Extract decisions, lessons, patterns, and surprises from completed phase artifacts.",
      agent: "hm-orchestrator",
    },
    "hm-fast": {
      description: "Execute a trivial task inline — no subagents, no planning overhead.",
      agent: "hm-executor",
    },
    "hm-forensics": {
      description: "Post-mortem investigation for failed Hivemind workflows — diagnoses what went wrong.",
      agent: "hm-debugger",
    },
    "hm-gate": {
      description: "Run the L3 quality gate triad (lifecycle, spec compliance, evidence truth) for the target phase.",
      agent: "hm-orchestrator",
    },
    "hm-graphify": {
      description: "Build, query, and inspect the project knowledge graph in .planning/graphs/.",
      agent: "hm-codebase-mapper",
    },
    "hm-harness-audit": {
      description: "Comprehensive harness audit: boundary integrity, claim-vs-reality, governance, context poisoning.",
      agent: "hm-nyquist-auditor",
    },
    "hm-harness-doctor": {
      description: "Run harness diagnostics. Checks configuration, agents, plugin control path, and harness health.",
      agent: "hm-nyquist-auditor",
    },
    "hm-health": {
      description: "Diagnose planning directory health and optionally repair issues.",
      agent: "hm-orchestrator",
    },
    "hm-help": {
      description: "Show available Hivemind commands and usage guide.",
      agent: "hm-orchestrator",
    },
    "hm-hf-absorb": {
      description: "Absorb dense context (links, text, files, stories, events, actors) into persistent session context.",
      agent: "hm-orchestrator",
    },
    "hm-hf-audit": {
      description: "Audit existing skills, agents, commands, or tools for quality, overlaps, and dead references.",
      agent: "hm-nyquist-auditor",
    },
    "hm-hf-configure": {
      description: "Configure OpenCode primitives (agents, commands, skills) programmatically.",
      agent: "hm-orchestrator",
    },
    "hm-hf-create": {
      description: "Create a new skill, agent, command, or tool. Routes to the right specialist.",
      agent: "hm-orchestrator",
    },
    "hm-hf-prompt-enhance-to-plan": {
      description: "Enhance, improve, and export as plan repack a prompt through selection of suitable template.",
      agent: "hm-planner",
    },
    "hm-hf-prompt-enhance": {
      description: "Enhance, audit, or repack a prompt through skim, investigation lanes, clarification gating.",
      agent: "hm-orchestrator",
    },
    "hm-hf-stack": {
      description: "Stack multiple skills together for a specific workflow.",
      agent: "hm-orchestrator",
    },
    "hm-import": {
      description: "Ingest external plans with conflict detection against project decisions before writing anything.",
      agent: "hm-orchestrator",
    },
    "hm-inbox": {
      description: "Triage and review open GitHub issues and PRs against project templates.",
      agent: "hm-orchestrator",
    },
    "hm-ingest-docs": {
      description: "Bootstrap or merge a .planning/ setup from existing ADRs, PRDs, SPECs, and docs in a repo.",
      agent: "hm-project-researcher",
    },
    "hm-init-project": {
      description: "Initialize a new Hivemind-powered project structure with namespaces, directories, and standard config files.",
      agent: "hm-orchestrator",
    },
    "hm-intel-updater": {
      description: "Maintain codebase intelligence files in .planning/intel/ with structured JSON summaries.",
      agent: "hm-intel-updater",
    },
    "hm-l0-orchestrate": {
      description: "Front-facing L0 strategist for hm-* lineage — coordinate high-level phase routing and intent classification.",
      agent: "hm-l0-orchestrator",
    },
    "hm-manager": {
      description: "Interactive command center for managing multiple phases from one terminal.",
      agent: "hm-orchestrator",
    },
    "hm-map-codebase": {
      description: "Analyze codebase with parallel mapper agents to produce .planning/codebase/ documents.",
      agent: "hm-codebase-mapper",
    },
    "hm-milestone-summary": {
      description: "Generate a comprehensive project summary from milestone artifacts for team onboarding.",
      agent: "hm-roadmapper",
    },
    "hm-mvp-phase": {
      description: "Plan a phase as a vertical MVP slice — user story, SPIDR splitting, then plan-phase.",
      agent: "hm-planner",
    },
    "hm-new-milestone": {
      description: "Start a new milestone cycle — update PROJECT.md and route to requirements.",
      agent: "hm-roadmapper",
    },
    "hm-new-project": {
      description: "Initialize a new project with deep context gathering and PROJECT.md.",
      agent: "hm-roadmapper",
    },
    "hm-ns-context": {
      description: "codebase intelligence | map graphify docs learnings.",
      agent: "hm-orchestrator",
    },
    "hm-ns-ideate": {
      description: "exploration capture | explore sketch spike spec capture.",
      agent: "hm-orchestrator",
    },
    "hm-ns-manage": {
      description: "config workspace | workstreams thread update ship inbox.",
      agent: "hm-orchestrator",
    },
    "hm-ns-project": {
      description: "project lifecycle | milestones audits summary.",
      agent: "hm-orchestrator",
    },
    "hm-ns-review": {
      description: "quality gates | code review debug audit security eval ui.",
      agent: "hm-code-reviewer",
    },
    "hm-ns-workflow": {
      description: "workflow | discuss plan execute verify phase progress.",
      agent: "hm-orchestrator",
    },
    "hm-pause-work": {
      description: "Create context handoff when pausing work mid-phase.",
      agent: "hm-orchestrator",
    },
    "hm-phase": {
      description: "CRUD for phases in ROADMAP.md — add, insert, remove, or edit phases.",
      agent: "hm-orchestrator",
    },
    "hm-plan-phase": {
      description: "Create detailed phase plan (PLAN.md) with research, task breakdown, dependency analysis.",
      agent: "hm-planner",
    },
    "hm-plan-review-convergence": {
      description: "Cross-AI plan convergence loop — replan with review feedback until no HIGH concerns remain.",
      agent: "hm-planner",
    },
    "hm-plan": {
      description: "Enter strategic planning mode. Agent interviews you to build a detailed plan before any code is written.",
      agent: "hm-planner",
    },
    "hm-pr-branch": {
      description: "Create a clean PR branch by filtering out .planning/ commits — ready for code review.",
      agent: "hm-orchestrator",
    },
    "hm-profile-user": {
      description: "Generate developer behavioral profile and create Claude-discoverable artifacts.",
      agent: "hm-user-profiler",
    },
    "hm-profile": {
      description: "View or switch the behavioral profile for Hivemind agents.",
      agent: "hm-orchestrator",
    },
    "hm-progress": {
      description: "Check progress, advance workflow, or dispatch freeform intent — the unified Hivemind situational command.",
      agent: "hm-orchestrator",
    },
    "hm-quick": {
      description: "Execute a quick task with Hivemind guarantees (atomic commits, state tracking) but skip optional agents.",
      agent: "hm-executor",
    },
    "hm-research": {
      description: "Conduct dense stack research and codebase investigation for a roadmap phase.",
      agent: "hm-phase-researcher",
    },
    "hm-resume-work": {
      description: "Resume work from previous session with full context restoration.",
      agent: "hm-orchestrator",
    },
    "hm-review-backlog": {
      description: "Review and promote backlog items to active milestone.",
      agent: "hm-code-reviewer",
    },
    "hm-review": {
      description: "Request cross-AI peer review of phase plans from external AI CLIs.",
      agent: "hm-code-reviewer",
    },
    "hm-roadmap": {
      description: "Roadmap management: view current roadmap, analyze phase dependencies, add/remove phases.",
      agent: "hm-orchestrator",
    },
    "hm-secure-phase": {
      description: "Retroactively verify threat mitigations for a completed phase.",
      agent: "hm-nyquist-auditor",
    },
    "hm-session": {
      description: "Session management: list active sessions, resume an interrupted session, stack new work.",
      agent: "hm-orchestrator",
    },
    "hm-settings": {
      description: "Configure Hivemind workflow toggles and model profile.",
      agent: "hm-orchestrator",
    },
    "hm-ship": {
      description: "Create PR, run review, and prepare for merge after verification passes.",
      agent: "hm-orchestrator",
    },
    "hm-shipper": {
      description: "Coordinate release preparation including CHANGELOG.md generation, version bumping.",
      agent: "hm-shipper",
    },
    "hm-sketch": {
      description: "Sketch UI/design ideas with throwaway HTML mockups, or propose what to sketch next.",
      agent: "hm-phase-researcher",
    },
    "hm-spec-phase": {
      description: "Clarify WHAT a phase delivers with ambiguity scoring; produces a SPEC.md before discuss-phase.",
      agent: "hm-planner",
    },
    "hm-specifier": {
      description: "Author formal design contracts (SPEC.md, UI-SPEC.md, AI-SPEC.md) from requirements and context.",
      agent: "hm-specifier",
    },
    "hm-spike": {
      description: "Spike an idea through experiential exploration, or propose what to spike next.",
      agent: "hm-phase-researcher",
    },
    "hm-start-work": {
      description: "Execute a task plan with full orchestration. Reads plan and runs pending phases through controlled delegation.",
      agent: "hm-orchestrator",
    },
    "hm-state": {
      description: "View project state and progress: current phase status, completed phases, pending work.",
      agent: "hm-orchestrator",
    },
    "hm-stats": {
      description: "Display project statistics — phases, plans, requirements, git metrics, and timeline.",
      agent: "hm-orchestrator",
    },
    "hm-surface": {
      description: "Toggle which skills are surfaced — apply a profile, list, or disable a cluster without reinstall.",
      agent: "hm-orchestrator",
    },
    "hm-sync-agents-md": {
      description: "Sync AGENTS.md files with current codebase state. Detects drift between documentation and actual source code.",
      agent: "hm-orchestrator",
    },
    "hm-synthesize": {
      description: "Synthesize research outputs from parallel agents into a consolidated SUMMARY.md.",
      agent: "hm-orchestrator",
    },
    "hm-test-echo": {
      description: "Echo back the user's message.",
      agent: "hm-orchestrator",
    },
    "hm-test-list": {
      description: "List files in the current directory.",
      agent: "hm-orchestrator",
    },
    "hm-test-spike-execute": {
      description: "Tests the programmatic execution of slash commands by an agent.",
      agent: "hm-executor",
    },
    "hm-test-status": {
      description: "Show git status.",
      agent: "hm-orchestrator",
    },
    "hm-thread": {
      description: "Manage persistent context threads for cross-session work.",
      agent: "hm-orchestrator",
    },
    "hm-ui-phase": {
      description: "Generate UI design contract (UI-SPEC.md) for frontend phases.",
      agent: "hm-planner",
    },
    "hm-ui-review": {
      description: "Retroactive 6-pillar visual audit of implemented frontend code.",
      agent: "hm-code-reviewer",
    },
    "hm-ultraplan-phase": {
      description: "[BETA] Offload plan phase to Claude Code's ultraplan cloud; review in browser and import back.",
      agent: "hm-planner",
    },
    "hm-ultrawork": {
      description: "Activate full autonomous orchestration. Agent explores, plans, and executes until done.",
      agent: "hm-orchestrator",
    },
    "hm-undo": {
      description: "Safe git revert. Roll back phase or plan commits using the phase manifest with dependency checks.",
      agent: "hm-orchestrator",
    },
    "hm-update": {
      description: "Update Hivemind to latest version with changelog display.",
      agent: "hm-orchestrator",
    },
    "hm-validate-phase": {
      description: "Retroactively audit and fill Nyquist validation gaps for a completed phase.",
      agent: "hm-nyquist-auditor",
    },
    "hm-verify-work": {
      description: "Validate built features through conversational UAT.",
      agent: "hm-verifier",
    },
    "hm-verify": {
      description: "Verify completed phase deliverables against plan must-haves, truths, and links.",
      agent: "hm-verifier",
    },
    "hm-workspace": {
      description: "Manage Hivemind workspaces — create, list, or remove isolated workspace environments.",
      agent: "hm-orchestrator",
    },
    "hm-workstreams": {
      description: "Manage parallel workstreams — list, create, switch, status, progress, complete, and resume.",
      agent: "hm-orchestrator",
    },
    "plan": {
      description: "Enter strategic planning mode. Agent interviews you to build a detailed plan before any code is written.",
      agent: "hm-l0-orchestrator",
    },
    "start-work": {
      description: "Execute a task plan with full orchestration. Reads plan and runs pending phases through controlled delegation.",
      agent: "hm-l0-orchestrator",
    },
    "sync-agents-md": {
      description: "Sync AGENTS.md files with current codebase state. Detects drift between documentation and actual source code.",
      agent: "hm-l0-orchestrator",
    },
    "test-echo": {
      description: "Echo back the user's message.",
      agent: "",
    },
    "test-list": {
      description: "List files in the current directory.",
      agent: "",
    },
    "test-spike-execute": {
      description: "Tests the programmatic execution of slash commands by an agent.",
      agent: "build",
    },
    "test-status": {
      description: "Show git status.",
      agent: "",
    },
    "ultrawork": {
      description: "Activate full autonomous orchestration. Agent explores, plans, and executes until done.",
      agent: "hm-l0-orchestrator",
    },
  },
  templates: {
    "governance-brief": {
      content: "You are a governance {{role}}. Review the following: {{brief}}",
    },
    "audit-brief": {
      content: "Audit the following against project standards: {{brief}}",
    },
  },
  tool_registry: {
    "delegate-task": {
      name: "delegate-task",
      description: "Delegate work to a specialist agent via SDK child-session dispatch.",
      permissions: ["delegate", "session"],
    },
    "delegation-status": {
      name: "delegation-status",
      description: "Check delegation status, discover stackable sessions, and retrieve results.",
      permissions: ["read"],
    },
    "hivemind-agent-work-create": {
      name: "hivemind-agent-work-create",
      description: "Create a durable agent work contract without dispatching sessions.",
      permissions: ["write"],
    },
    "hivemind-agent-work-export": {
      name: "hivemind-agent-work-export",
      description: "Export an agent work contract as bounded JSON or Markdown handoff payload.",
      permissions: ["read"],
    },
    "hivemind-command-engine": {
      name: "hivemind-command-engine",
      description: "Discover command bundles, analyze contracts, render bounded context.",
      permissions: ["read"],
    },
    "hivemind-doc": {
      name: "hivemind-doc",
      description: "Multi-format CRUD document intelligence: skim, read, chunk, search, section-read, line-read, offset-read, create, write, upsert, append, insert, delete-section, delete-file, search-and-replace, batch-section-edits, batch-multi-file, metadata-read, metadata-write, metadata-delete, toc, heading-tree, code-inspect, xref-validate, index, context-extract — 24 actions across md/json/yaml/xml.",
      permissions: ["read", "write"],
    },
    "hivemind-pressure": {
      name: "hivemind-pressure",
      description: "Classify runtime pressure, detect pure control-plane outcomes, inspect tool authority.",
      permissions: ["read"],
    },
    "hivemind-sdk-supervisor": {
      name: "hivemind-sdk-supervisor",
      description: "Inspect SDK wrapper health, heartbeat, bounded diagnostics, and readiness.",
      permissions: ["read"],
    },
    "hivemind-session-view": {
      name: "hivemind-session-view",
      description: "Query a unified session view across 3 Hivemind data roots.",
      permissions: ["read"],
    },
    "hivemind-trajectory": {
      name: "hivemind-trajectory",
      description: "Inspect and update the Hivemind trajectory ledger.",
      permissions: ["read", "write"],
    },
    "execute-slash-command": {
      name: "execute-slash-command",
      description: "Executes an OpenCode slash command.",
      permissions: ["execute"],
    },
    "session-context": {
      name: "session-context",
      description: "Cross-session synthesis and discovery.",
      permissions: ["read"],
    },
    "session-delegation-query": {
      name: "session-delegation-query",
      description: "Query delegation history with progressive disclosure.",
      permissions: ["read"],
    },
    "session-hierarchy": {
      name: "session-hierarchy",
      description: "Navigate session delegation hierarchy.",
      permissions: ["read"],
    },
    "session-journal-export": {
      name: "session-journal-export",
      description: "Export bounded Session Journal and Execution Lineage quick-read summaries.",
      permissions: ["read"],
    },
    "session-patch": {
      name: "session-patch",
      description: "Patch specific sections in session file with backup.",
      permissions: ["write"],
    },
    "session-tracker": {
      name: "session-tracker",
      description: "Query and export session tracker data.",
      permissions: ["read"],
    },
    "create-governance-session": {
      name: "create-governance-session",
      description: "Creates a named child session with 'hm-governance:' title prefix.",
      permissions: ["create", "session"],
    },
    "tmux-copilot": {
      name: "tmux-copilot",
      description: "Co-pilot affordance for the tmux visual orchestration layer.",
      permissions: ["execute"],
    },
    "tmux-state-query": {
      name: "tmux-state-query",
      description: "Read-only session metadata query for the tmux visual orchestration layer.",
      permissions: ["read"],
    },
    "validate-restart": {
      name: "validate-restart",
      description: "Validate that compiled OpenCode primitives are discoverable and free of runtime issues after a restart.",
      permissions: ["read"],
    },
    "run-background-command": {
      name: "run-background-command",
      description: "Run CLI commands in shared background PTY sessions with queue-governed dispatch.",
      permissions: ["execute"],
    },
    "skill": {
      name: "skill",
      description: "Load a specialized skill when the task at hand matches one of the skills listed in the system prompt.",
      permissions: ["read"],
    },
    "configure-primitive": {
      name: "configure-primitive",
      description: "Configure, read, list, or inspect OpenCode primitives (agent, command, skill).",
      permissions: ["read", "write"],
    },
    "prompt-analyze": {
      name: "prompt-analyze",
      description: "Analyze prompt content for contradictions, vagueness, missing scope, and clarity signals.",
      permissions: ["read"],
    },
    "prompt-skim": {
      name: "prompt-skim",
      description: "Fast scan of prompt content: count words/lines/tokens, extract URLs, verify file paths.",
      permissions: ["read"],
    },
    "todowrite": {
      name: "todowrite",
      description: "Create and maintain a structured task list for the current coding session.",
      permissions: ["write"],
    },
  },
}