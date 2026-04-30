# Phase 15: Security & Quality Remediation - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix all 26 audit findings from the comprehensive 6-phase codebase audit. Deliver a spotless, production-ready `.opencode/` configuration with zero security vulnerabilities, zero portability failures, zero dangling references, and all files conforming to OpenCode platform standards. This phase modifies ONLY soft meta-concepts (skills, agents, commands) — no `src/` code changes.

**In scope:** 3 critical issues, 8 high-severity warnings, 7 medium warnings, 8 low/info items, 4 cross-phase risks.
**Out of scope:** New features, new agents, new capabilities, `src/` code changes.

</domain>

<decisions>
## Implementation Decisions

### Profanity Handling
- **D-01:** Replace all profanity in `build.md` with professional alternatives: `MUST_FUCKING_READ_AND_OBEY` → `MUST_READ_AND_OBEY` (preserves urgency, removes reputational risk)
- **D-02:** Apply same professional tone to agent description text in `build.md`

### Orchestrator Hierarchy
- **D-03:** `coordinator.md` is THE single primary orchestrator — no other agent may claim "primary orchestrator" role
- **D-04:** Reassign overlapping agents to distinct specialist roles with non-overlapping trigger phrases:
  - `conductor.md` → delegation routing specialist
  - `orchestrator.md` → phase-gated workflow specialist
  - `hivefiver.md` → meta-concept workflow specialist (HF tooling)
- **D-05:** Each specialist gets a comment/header explaining its position in the hierarchy relative to coordinator

### Missing Skills Resolution
- **D-06:** Update `conductor.md` and `hivefiver-agent-builder.md` references to `skill-creator` and `skill-judge` to point to global skills at `~/.agents/skills/`
- **D-07:** Do NOT create local stubs — the global skills already exist and are installed

### Path Portability
- **D-08:** Replace ALL hardcoded paths with project-relative paths from project root
  - `$HOME/.claude/get-shit-done/` → `.opencode/get-shit-done/`
  - `/Users/apple/...` absolute paths → relative from project root
- **D-09:** GSD workflow `bin/gsd-tools.cjs` references already use project-root-relative paths — verify and fix any exceptions

### Critical Security Fixes (auto-decided from audit)
- **D-10:** Remove wildcard `skill: *: allow` from `build.md` — replace with explicit skill allowlist
- **D-11:** Scope `conductor.md` permissions — replace blanket `allow` with minimum-required tool access

### Command Standards (auto-decided from audit)
- **D-12:** Add YAML frontmatter to `deep-init.md` and `deep-research-synthesis-repomix.md`
- **D-13:** Quote all `$ARGUMENTS` references in command files: `hf-absorb.md`, `hf-prompt-enhance-to-plan.md`, `hf-prompt-enhance.md`, `ultrawork.md`

### Skill Standards (auto-decided from audit)
- **D-14:** Add `files_to_read` blocks to: `coordinating-loop`, `harness-audit`, `use-authoring-skills`, `user-intent-interactive-loop`
- **D-15:** Narrow generic trigger phrases in `hm-deep-research` and `hm-detective` to be more specific

### Agent Standards (auto-decided from audit)
- **D-16:** Fix non-standard schema in `orchestrator.md` to use proper YAML frontmatter format
- **D-17:** Resolve AGENT_TOOLS implementation gap — either implement in `src/plugin.ts` or remove references from agent files

### Folded Todos
- **D-18:** Phase 3 architecture discussion — live steering protocols (from todo 2026-04-09)
- **D-19:** Configurable category routing with user-defined categories (from todo 2026-04-09)
- **D-20:** Full Phase 3 planning for runtime configurability architecture (from todo 2026-04-09)
- **D-21:** Fix delegation execution — sync JSON parser crash + async silent failure (from todo 2026-04-10)

### the agent's Discretion
- Exact wording of professional alternatives for profanity replacement
- Specific trigger phrase wording for narrowed skills
- Exact YAML frontmatter content for commands missing it
- Implementation approach for AGENT_TOOLS (implement vs remove references)
- Ordering/priority of fixes within the phase plans

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Audit Findings (PRIMARY INPUT)
- `audit-report-2026-04-17.md` — Full markdown audit report with all 26 findings, evidence, and remediation guidance
- `audit-findings-2026-04-17.json` — Structured JSON with machine-readable severity, evidence, and remediation fields

### Project Standards
- `AGENTS.md` — Code style rules (no `any`, 500 LOC max, `[Harness]` prefix, TypeScript strict mode)
- `.planning/PROJECT.md` — Vision, principles, non-negotiables (Phase 02 baseline, evidence standards)

### Prior Phase Decisions
- `.planning/phases/02-v3-runtime-architecture/02-CONTEXT.md` — Agent discovery from config, no hardcoded lists
- `.planning/phases/14-delegate-task-truth-reset-archive-phases-09-13-remove-trash-/14-CONTEXT.md` — NUKE broken artifacts, runtime-truthful only

### Critical Files to Fix
- `.opencode/agents/build.md` — C-2: wildcard permissions + profanity
- `.opencode/agents/conductor.md` — C-3: excessive permissions
- `.opencode/skills/harness-delegation-inspection/SKILL.md` — C-1: hardcoded $HOME path
- `.opencode/commands/deep-init.md` — W-1: missing frontmatter
- `.opencode/commands/deep-research-synthesis-repomix.md` — W-1: missing frontmatter
- `.opencode/commands/hf-absorb.md` — W-2: unquoted $ARGUMENTS
- `.opencode/commands/hf-prompt-enhance-to-plan.md` — W-2 + W-9: unquoted $ARGUMENTS + hardcoded path
- `.opencode/commands/hf-prompt-enhance.md` — W-2: unquoted $ARGUMENTS
- `.opencode/commands/ultrawork.md` — W-2: unquoted $ARGUMENTS

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Global skills at `~/.agents/skills/skill-creator/` and `~/.agents/skills/skill-judge/` — already exist, just need reference updates
- `src/plugin.ts` AGENT_DEFAULTS and AGENT_TOOLS — the existing mechanism for tool restrictions that W-7 references

### Established Patterns
- YAML frontmatter in agent files: `name`, `description`, `mode`, `permission`, `tool`, `skill` fields
- Command frontmatter: `name`, `description`, `arguments` fields
- Skill files: `SKILL.md` with purpose, execution_context, process sections
- Project-root-relative paths used consistently in GSD workflows (established pattern to follow)

### Integration Points
- Agent definitions feed into OpenCode's agent dispatch — permission changes affect runtime behavior
- Command definitions affect CLI argument parsing — frontmatter changes affect discoverability
- Skill definitions affect trigger matching — missing files_to_read blocks affect agent context loading

</code_context>

<specifics>
## Specific Ideas

- Professional urgency markers: `MUST_READ_AND_OBEY`, `CRITICAL_REQUIREMENT`, `MANDATORY_COMPLIANCE` — convey the same enforcement without profanity
- Coordinator.md should have an explicit comment: "This is the single primary orchestrator. All other orchestrator-named agents are specialists under this coordinator."
- Global skill references should use the format: `skill-creator` (installed at `~/.agents/skills/skill-creator/`) — agents can find them via the skill tool

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Folded Todos (included in decisions)
- Phase 3 architecture discussion — live steering protocols
- Configurable category routing with user-defined categories
- Full Phase 3 planning for runtime configurability architecture
- Fix delegation execution — sync JSON parser crash + async silent failure

### Reviewed Todos (not folded)
None — all 4 matched todos were folded into scope.

</deferred>

---

*Phase: 15-security-quality-remediation-fix-all-26-audit-issues-from-co*
*Context gathered: 2026-04-17*
