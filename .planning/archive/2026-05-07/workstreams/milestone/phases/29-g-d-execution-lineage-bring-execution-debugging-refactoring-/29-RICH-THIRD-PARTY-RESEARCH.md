# Phase 29: Rich Third-Party Research — Execution Lineage hm-* Skills

**Date:** 2026-04-25  
**Researcher:** gsd-phase-researcher subagent  
**Scope:** Phase 29 G-D Execution Lineage RICH gate source research  
**Artifact boundary:** Research only; no skill implementation edits were made.

## Baseline inspected

- Phase 29 is blocked because selected local skills have local resource inventory but lack third-party crawl and Pattern 1/2/3 adoption records. [VERIFIED: `.planning/phases/29-g-d-execution-lineage-bring-execution-debugging-refactoring-/29-RICH-GATE-BASELINE.md`]
- Phase 29 target skills are `hm-debug`, `hm-refactor`, `hm-phase-execution`, `hm-planning-with-files`, `hm-command-parser`, `hm-agent-composition`, `hm-agents-md-sync`, `hm-opencode-project-audit`, `hm-opencode-project-inspection`, `hm-opencode-non-interactive-shell`, and `hm-opencode-platform-reference`. [VERIFIED: `.planning/phases/29-g-d-execution-lineage-bring-execution-debugging-refactoring-/29-01-PLAN.md`]
- Local execution-lineage adjacent skills `hm-test-driven-execution`, `hm-spec-driven-authoring`, and `hm-completion-looping` each already have `SKILL.md`, `references/`, `evals/`, and `scripts/` directories, even though they are not in the Phase 29 blocked target list. [VERIFIED: local glob of `.opencode/skills/hm-test-driven-execution`, `.opencode/skills/hm-spec-driven-authoring`, `.opencode/skills/hm-completion-looping`]

## Source corpus selected

Because per-skill top-3 would exceed this call, sources are grouped by domain cluster. Top sources were selected for direct pattern fit, resource richness, and relevance to OpenCode/harness execution lineage.

| Cluster | Top 3 selected sources | Evidence inspected | Confidence |
|---|---|---|---|
| Debug / TDD / spec gates | `addyosmani/agent-skills`, `NousResearch/hermes-agent`, GitHub Docs agent skills | Raw SKILL.md for debugging, TDD, spec; Hermes systematic-debugging; GitHub skill resource docs | HIGH |
| Refactor / implementation planning | `github/awesome-copilot`, `addyosmani/agent-skills`, `NousResearch/hermes-agent` | Raw `refactor-plan`, `create-implementation-plan`, source search/dir listings for related workflow skills | MEDIUM-HIGH |
| Phase execution / coordination / completion | `garagon/nanostack`, `github/awesome-copilot`, `barkain/claude-code-workflow-orchestration` | Raw `conductor/SKILL.md`, `conductor/bin/sprint.sh`, raw implementation-plan skill, search evidence for workflow orchestration hooks | MEDIUM-HIGH |
| OpenCode / command / shell safety / project audit | OpenCode official docs, `garagon/nanostack`, `NousResearch/hermes-agent` OpenCode skill | OpenCode agents/commands/config/rules docs snippets, raw guard SKILL/rules, search evidence for OpenCode runtime skill | MEDIUM |

## Key evidence by source

### 1. `addyosmani/agent-skills`

- The repo exposes a broad production-engineering skill set including `debugging-and-error-recovery`, `spec-driven-development`, `test-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `code-simplification`, and `deprecation-and-migration`. [VERIFIED: GitHub contents API for `addyosmani/agent-skills/skills`; CITED: https://github.com/addyosmani/agent-skills]
- `debugging-and-error-recovery` uses a stop-the-line rule: stop adding features, preserve evidence, diagnose, fix root cause, guard recurrence, and resume only after verification. [CITED: https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/debugging-and-error-recovery/SKILL.md]
- `debugging-and-error-recovery` structures debugging as reproduce, localize, reduce, root-cause fix, recurrence guard, and end-to-end verification. [CITED: https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/debugging-and-error-recovery/SKILL.md]
- `spec-driven-development` defines a gated `SPECIFY -> PLAN -> TASKS -> IMPLEMENT` flow with human review gates and explicit assumptions before spec writing. [CITED: https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/spec-driven-development/SKILL.md]
- `test-driven-development` defines RED/GREEN/REFACTOR, Prove-It bug reproduction, a test pyramid, and resource-size classification for tests. [CITED: https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/test-driven-development/SKILL.md]
- Bundled-resource richness is mostly SKILL.md-centered for the inspected individual skills; no bundled references/scripts were visible for those three skill directories via GitHub contents API. [VERIFIED: GitHub contents API for inspected skill dirs]

**Useful import:** strengthen local `hm-debug`, `hm-test-driven-execution`, and `hm-spec-driven-authoring` wording with stop-the-line, assumption surfacing, and proof-before-fix gates. [ADAPT]

### 2. `NousResearch/hermes-agent`

- `skills/software-development` includes `plan`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, and `writing-plans`. [VERIFIED: GitHub contents API for `NousResearch/hermes-agent/skills/software-development`]
- `systematic-debugging` has an explicit “NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST” iron law and a four-phase process: root cause investigation, pattern analysis, hypothesis/testing, implementation. [CITED: https://raw.githubusercontent.com/NousResearch/hermes-agent/main/skills/software-development/systematic-debugging/SKILL.md]
- The Hermes debugging skill explicitly requires reading errors, reproducing consistently, checking recent changes, adding diagnostic instrumentation across component boundaries, and tracing data flow before fixes. [CITED: https://raw.githubusercontent.com/NousResearch/hermes-agent/main/skills/software-development/systematic-debugging/SKILL.md]
- Search evidence indicates Hermes also has an autonomous-ai-agents OpenCode skill covering `opencode run`, PTY/background process use, binary resolution, `/exit` pitfall avoidance, and smoke-test verification. [VERIFIED: Tavily search result for `NousResearch/hermes-agent/skills/autonomous-ai-agents/opencode/SKILL.md`]

**Useful import:** adopt the “no fixes before Phase 1 root-cause investigation” as a hard phrase in `hm-debug`; adapt the OpenCode operational pitfalls into `hm-opencode-non-interactive-shell`. [ADOPT/ADAPT]

### 3. `github/awesome-copilot`

- Discovery found `refactor-plan`, `create-implementation-plan`, `breakdown-plan`, `breakdown-test`, `create-specification`, `create-github-issues-feature-from-implementation-plan`, and related planning/spec skills in the repository. [VERIFIED: GitHub contents API/search result for `github/awesome-copilot/skills`; CITED: https://github.com/github/awesome-copilot]
- `refactor-plan` is concise but directly relevant: it requires codebase search, affected file/dependency identification, safe sequence planning, verification steps between changes, rollback planning, and phased order “types first, then implementations, then tests.” [CITED: https://raw.githubusercontent.com/github/awesome-copilot/main/skills/refactor-plan/SKILL.md]
- `create-implementation-plan` is machine-execution oriented and requires deterministic language, atomic phases, measurable completion criteria, explicit dependencies, specific files/functions, standardized identifiers, validation criteria, and mandatory template sections. [CITED: https://raw.githubusercontent.com/github/awesome-copilot/main/skills/create-implementation-plan/SKILL.md]
- The inspected `refactor-plan` skill is SKILL.md-only, so it is pattern-rich but resource-light. [VERIFIED: GitHub contents API for `github/awesome-copilot/skills/refactor-plan`]

**Useful import:** adopt refactor sequencing and rollback table into `hm-refactor`; adapt deterministic task identifiers into `hm-phase-execution` and planning bridge docs, but reject overly prescriptive “exact implementation details” where this harness separates research/planning/execution. [ADOPT/ADAPT/REJECT]

### 4. `garagon/nanostack`

- `nanostack` contains top-level skills/directories including `conductor`, `guard`, `plan`, `qa`, `review`, `ship`, `skills`, `commands`, `bin`, `reference`, and docs. [VERIFIED: GitHub contents API for `garagon/nanostack`]
- `conductor/SKILL.md` describes multi-agent sprint orchestration using atomic file operations under `.nanostack/conductor/`; it coordinates claims, dependency resolution, artifacts, and downstream handoff. [CITED: https://raw.githubusercontent.com/garagon/nanostack/main/conductor/SKILL.md]
- `conductor` defines a default dependency graph: `think -> plan -> build -> {review, qa, security} -> ship`; review, QA, and security can run in parallel after build. [CITED: https://raw.githubusercontent.com/garagon/nanostack/main/conductor/SKILL.md]
- `conductor` has bundled resources beyond SKILL.md: `conductor/bin/sprint.sh` and `conductor/agents/openai.yaml`. [VERIFIED: GitHub contents API for `garagon/nanostack/conductor`]
- `sprint.sh` implements atomic claim via `mkdir`, dependency checks, project-hash sprint directories, stable agent identity, stale lock checks, and audit logging. [CITED: https://raw.githubusercontent.com/garagon/nanostack/main/conductor/bin/sprint.sh]
- `guard/SKILL.md` provides safety guardrails, careful/freeze/unfreeze modes, PreToolUse Bash hook metadata, and cites a rules-based danger checker. [CITED: https://raw.githubusercontent.com/garagon/nanostack/main/guard/SKILL.md]
- `guard/rules.json` includes allowlist, block, and warning tiers for destructive operations such as mass deletion, force push, hard reset, database destruction, infrastructure deletion, production access, and remote-code execution. [CITED: https://raw.githubusercontent.com/garagon/nanostack/main/guard/rules.json]

**Useful import:** adapt filesystem state-machine and stale-lock concepts into `hm-phase-execution`; adapt `guard` tiering into non-interactive shell safety; do not copy script governance directly because this project rule says scripts report facts and leave judgment to the agent. [ADAPT/REJECT]

### 5. OpenCode official docs

- OpenCode official docs state agents can be defined as markdown files in `~/.config/opencode/agents/` or `.opencode/agents/`, and permissions can be set in Markdown agents or in `opencode.json`. [CITED: https://opencode.ai/docs/agents/]
- OpenCode docs list common agent roles: build agent, plan agent, review agent, debug agent, and docs agent, with different tool/permission profiles. [CITED: https://opencode.ai/docs/agents/]
- OpenCode command docs state custom commands can be defined through `opencode.json` or markdown files in global/project `.opencode/commands/`, with frontmatter properties including description, agent, subtask, and model. [CITED: https://opencode.ai/docs/commands/]
- OpenCode config docs state `OPENCODE_CONFIG` and `OPENCODE_CONFIG_DIR` can change config discovery; custom config directory is searched for agents, commands, modes, and plugins and can override lower-priority settings. [CITED: https://opencode.ai/docs/config/]
- OpenCode rules docs state local instruction files (`AGENTS.md`, `CLAUDE.md`) and global instruction files are loaded with precedence, and custom instruction files can be listed in `opencode.json`. [CITED: https://opencode.ai/docs/rules/]

**Useful import:** adopt official configuration-scope matrix into `hm-opencode-project-audit`, `hm-opencode-project-inspection`, `hm-opencode-platform-reference`, and `hm-command-parser`. [ADOPT]

### 6. GitHub Docs: agent skills resource model

- GitHub Docs define agent skills as folders containing `SKILL.md` plus optional supplementary Markdown files, scripts, examples, or other resources. [CITED: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills]
- GitHub Docs require `SKILL.md` with YAML frontmatter containing required `name` and `description`; optional scripts/examples/resources can be added to the skill directory. [CITED: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills]
- GitHub Docs warn that pre-approving `shell` or `bash` should only be done after reviewing the skill/scripts because it can allow arbitrary command execution. [CITED: https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills]

**Useful import:** use as RICH-gate authority for why SKILL.md-only packages are weaker unless intentionally resource-light with documented rationale. [ADOPT]

## Pattern 1/2/3 alternatives

### Pattern 1 — Gated discipline skill pattern

**Definition:** A skill enforces ordered phases and hard stop conditions before action. Examples: stop-the-line debugging, no fixes before root cause, spec before implementation, RED/GREEN/REFACTOR before behavior changes. [CITED: addyosmani debugging/TDD/spec skills; Hermes systematic-debugging]

**Adopt for:** `hm-debug`, `hm-test-driven-execution`, `hm-spec-driven-authoring`, `hm-completion-looping`.  
**Adapt for:** `hm-refactor` by adding “safe sequence + verification + rollback” as gates.  
**Reject for:** `hm-opencode-platform-reference` as primary pattern because reference skills need navigational accuracy, not process gating.

### Pattern 2 — File-backed execution state machine pattern

**Definition:** Execution coordination is represented as durable state with claims/locks, dependencies, artifacts, and recovery semantics. Examples: Nanostack conductor’s `.nanostack/conductor/<sprint_id>/phase/{lock,done,artifact}` and atomic `mkdir` claim. [CITED: `garagon/nanostack/conductor/SKILL.md`; `conductor/bin/sprint.sh`]

**Adopt for:** `hm-phase-execution` as conceptual model for wave-state and checkpoint recovery.  
**Adapt for:** `hm-completion-looping` to persist failed verification evidence and loop state.  
**Reject for:** `hm-command-parser` unless command parsing state must persist across turns; parser should remain deterministic and stateless by default.  
**Caution:** Use project’s existing state conventions; do not introduce `.nanostack/` paths into HiveMind. [VERIFIED: AGENTS.md says runtime state path is `.opencode/state/opencode-harness/`]

### Pattern 3 — Resource-rich skill packaging and official-scope alignment pattern

**Definition:** Skills should expose a concise `SKILL.md` and progressively loaded resources/scripts/examples where the task has reusable detail; platform-specific skills must align with official config scopes and permission models. [CITED: GitHub Docs agent skills; OpenCode agents/commands/config/rules docs]

**Adopt for:** `hm-opencode-project-audit`, `hm-opencode-project-inspection`, `hm-opencode-platform-reference`, `hm-opencode-non-interactive-shell`, `hm-agent-composition`.  
**Adapt for:** `hm-planning-with-files` and `hm-command-parser` by adding resource/eval rationale if intentionally reference-only.  
**Reject for:** blindly adding scripts to every skill; RICH can be satisfied by documented source review plus evals/references when executable scripts would be unjustified. [ASSUMED]

## Per-skill decisions and remaining blockers

| Local skill | Current Phase 29 status | Pattern decision | Third-party decision | Remaining blocker |
|---|---:|---|---|---|
| `hm-debug` | BLOCKED | Pattern 1 ADOPT | Adopt Hermes iron law; adapt addyosmani stop-the-line and recurrence guard | Needs skill content update + eval update + skill-judge score |
| `hm-refactor` | BLOCKED | Pattern 1 ADAPT | Adopt GitHub `refactor-plan` safe sequencing, verification, rollback | Needs bundled resource expansion or documented SKILL.md-only rationale + eval |
| `hm-phase-execution` | BLOCKED | Pattern 2 ADAPT | Adapt Nanostack conductor claim/dependency/artifact/stale-lock concepts; do not copy `.nanostack` layout | Needs mapping to HiveMind `.opencode/state/opencode-harness/` and Wave protocol docs |
| `hm-planning-with-files` | BLOCKED | Pattern 3 ADAPT | Use GitHub `create-implementation-plan` deterministic sections and GitHub Docs resource-model rationale | Needs per-resource gap decision; not fully per-skill researched |
| `hm-command-parser` | BLOCKED | Pattern 3 ADAPT | Use OpenCode command docs for frontmatter/template/argument/shell-output/file-reference matrix | Per-skill source crawl BLOCKED; only official OpenCode docs reviewed |
| `hm-agent-composition` | BLOCKED | Pattern 3 ADAPT | Use OpenCode agents docs and GitHub resource model to validate permission/tool-scope guidance | Needs specific third-party agent-composition repo crawl beyond official docs |
| `hm-agents-md-sync` | BLOCKED | Pattern 3 DEFER | Use OpenCode rules docs for AGENTS/CLAUDE precedence | Per-skill top-3 source crawl BLOCKED; no dedicated sync source inspected |
| `hm-opencode-project-audit` | BLOCKED | Pattern 3 ADOPT | Use OpenCode docs config/agents/commands/rules as authoritative scope matrix | Needs audit checklist update with config precedence evidence |
| `hm-opencode-project-inspection` | BLOCKED | Pattern 3 ADOPT | Use OpenCode docs config dirs + agents/commands/rules discovery scopes | Needs inspection script/resource mapping update |
| `hm-opencode-non-interactive-shell` | BLOCKED | Pattern 3 ADAPT | Adapt Nanostack guard dangerous-command tiers; adapt Hermes OpenCode `opencode run`/PTY pitfall evidence | Need raw Hermes OpenCode skill fetch; only search snippet inspected |
| `hm-opencode-platform-reference` | BLOCKED | Pattern 3 ADOPT | Use OpenCode official docs as primary source; verify all reference claims against docs | Needs independence/resource audit and dated doc freshness note |
| `hm-test-driven-execution` | Not in baseline target list | Pattern 1 ADOPT | Adopt addyosmani RED/GREEN/REFACTOR, Prove-It, test-size model | Optional Phase 29 extension; not blocking baseline unless added |
| `hm-spec-driven-authoring` | Not in baseline target list | Pattern 1 ADOPT | Adopt addyosmani assumptions-first and SPECIFY/PLAN/TASKS/IMPLEMENT gates | Optional Phase 29 extension; not blocking baseline unless added |
| `hm-completion-looping` | Not in baseline target list | Pattern 1 + 2 ADAPT | Combine proof gates with persisted loop state | Optional Phase 29 extension; not blocking baseline unless added |

## Top gaps

1. **Per-skill top-3 source crawl is still incomplete** for `hm-command-parser`, `hm-agents-md-sync`, `hm-planning-with-files`, and `hm-agent-composition`. [VERIFIED: this artifact selected cluster-level top-3 due scope limit]
2. **Hermes OpenCode raw SKILL.md was not fetched**; only search evidence was captured. Treat related OpenCode runtime details as MEDIUM confidence until raw file is inspected. [VERIFIED: Tavily search result only]
3. **OpenCode official docs should become the primary source** for platform-scope claims before editing OpenCode inspection/audit/platform-reference skills. [CITED: https://opencode.ai/docs/agents/, https://opencode.ai/docs/commands/, https://opencode.ai/docs/config/, https://opencode.ai/docs/rules/]
4. **Do not import Nanostack scripts verbatim.** The project’s AGENTS.md says scripts should report facts and leave judgment to the agent; Nanostack guard has blocking behavior. Use its pattern as evidence, not implementation copy. [VERIFIED: AGENTS.md; CITED: https://raw.githubusercontent.com/garagon/nanostack/main/guard/SKILL.md]

## Execution readiness

**Ready for next execution pass:** PARTIAL.

Ready tasks:
- Update `hm-debug` using Pattern 1 evidence from addyosmani + Hermes. [CITED]
- Update `hm-refactor` using GitHub `refactor-plan` phased sequencing and rollback. [CITED]
- Update `hm-phase-execution` research references using Nanostack conductor concepts, adapted to HiveMind state paths. [CITED]
- Update OpenCode audit/inspection/reference skills against official OpenCode docs scope matrix. [CITED]

Not ready without additional per-skill crawl:
- `hm-command-parser`
- `hm-agents-md-sync`
- `hm-planning-with-files`
- Full raw-source validation of Hermes OpenCode skill for `hm-opencode-non-interactive-shell`

## Source index

Primary sources inspected:
- https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/debugging-and-error-recovery/SKILL.md
- https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/spec-driven-development/SKILL.md
- https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/test-driven-development/SKILL.md
- https://raw.githubusercontent.com/github/awesome-copilot/main/skills/refactor-plan/SKILL.md
- https://raw.githubusercontent.com/github/awesome-copilot/main/skills/create-implementation-plan/SKILL.md
- https://raw.githubusercontent.com/NousResearch/hermes-agent/main/skills/software-development/systematic-debugging/SKILL.md
- https://raw.githubusercontent.com/garagon/nanostack/main/conductor/SKILL.md
- https://raw.githubusercontent.com/garagon/nanostack/main/conductor/bin/sprint.sh
- https://raw.githubusercontent.com/garagon/nanostack/main/guard/SKILL.md
- https://raw.githubusercontent.com/garagon/nanostack/main/guard/rules.json
- https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/add-skills
- https://opencode.ai/docs/agents/
- https://opencode.ai/docs/commands/
- https://opencode.ai/docs/config/
- https://opencode.ai/docs/rules/

Local sources inspected:
- `.planning/phases/29-g-d-execution-lineage-bring-execution-debugging-refactoring-/29-RICH-GATE-BASELINE.md`
- `.planning/phases/29-g-d-execution-lineage-bring-execution-debugging-refactoring-/29-01-PLAN.md`
- `.planning/phases/29-g-d-execution-lineage-bring-execution-debugging-refactoring-/STATE.md`
- `.opencode/skills/hm-debug/**`
- `.opencode/skills/hm-refactor/**`
- `.opencode/skills/hm-phase-execution/**`
- `.opencode/skills/hm-test-driven-execution/**`
- `.opencode/skills/hm-spec-driven-authoring/**`
- `.opencode/skills/hm-completion-looping/**`
