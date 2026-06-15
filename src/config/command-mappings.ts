/**
 * Default command-to-agent routing table.
 * Maps command names to their responsible agent for dispatch.
 */
export const COMMAND_AGENT_MAPPINGS: Record<string, { description: string; agent: string }> = {
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
}
