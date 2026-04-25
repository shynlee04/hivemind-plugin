# hm-* Skill Quality Playbook

## Purpose

This playbook is the binding quality contract for all `hm-*` and `hivefiver-*` skills produced by the Hivemind harness project. It converts Phase 26 decisions and Phase 18 audit evidence into measurable standards for skills that must work as standalone, OpenCode-native quality components even when GSD is unavailable.

The standard applies to agents, commands, tools, plugin hooks, runtime state interactions, and arbitrary end-user project contexts. Phase 26 is a synthesis phase: this artifact defines quality gates and evidence requirements without mutating `.opencode/skills/**/SKILL.md`, `src/**`, or IDE sync directories.

## Decision Traceability

| Decision | Implementation in this playbook |
|----------|----------------------------------|
| D-01 | Requires standalone-superior skills that remain useful outside GSD and can be selected as a cohesive quality-assurance lineage. |
| D-02 | Uses GSD-comparable artifact quality as the benchmark: concrete contracts, falsifiable requirements, verification reports, and eval bundles. |
| D-03 | Establishes this `26-PLAYBOOK.md` as the unified quality contract across G-A through G-D lineages. |
| D-04 | Defines D1-D8 dimensions that later G-B demonstration SPECs must satisfy for `hm-spec-driven-authoring` and `hm-test-driven-execution`. |
| D-05 | Provides the scoring and evidence basis consumed by later ecosystem audit, requirements, and Phase 27-30 roadmap artifacts. |
| D-06 | Treats skills as runtime components wired through agents, commands, tools, plugin hooks, and runtime state routers. |
| D-07 | Requires OpenCode-native, Hivemind harness, and arbitrary user-project adaptation notes for every quality dimension. |

## Quality Tiers

| Tier | Definition | Release meaning |
|------|------------|-----------------|
| EXEMPLAR | Passes all D1-D8 dimensions with cited evidence, stacked evals, integration wiring, and self-correction paths. | May be used as a pattern source for other skills. |
| SUBSTANTIVE | Passes core workflow and evidence requirements with at most minor non-blocking gaps documented. | May ship with follow-up notes if no dimension is hollow. |
| THIN | Contains a valid package and some guidance but lacks measurable evidence, eval depth, or integration specificity. | Must not be treated as quality-complete. |
| HOLLOW | Template-only or assertion-heavy content without operational guidance, verification, or references. | Must be rewritten before use as a standard. |

## Quality Dimensions

## D1: Trigger Accuracy

**Description**
The skill must activate for precise user intents and avoid false positives that steal unrelated workflows. Trigger wording must include positive cases, negative exclusions, and conditions that distinguish the skill from nearby siblings.

**PASS Criteria**
- Description starts with specific “Use when...” conditions.
- Positive and negative trigger examples exist in an eval bundle or scoring record.
- The skill declares at least one nearby skill it should not replace.
- Evidence maps trigger language to real user prompts or audit findings.

**FAIL Criteria**
- Trigger wording is generic, broad, or pure keyword matching.
- No negative examples exist.
- The skill overlaps another skill without a boundary statement.
- Activation depends on local project paths or GSD-only command names.

**Verification Command**
`grep -n "Use when\|Do not use\|NOT for\|Triggers" .opencode/skills/<skill>/SKILL.md && test -f .opencode/skills/<skill>/evals/evals.json`

**Exemplar Skill**
`hivefiver-use-authoring-skills` demonstrates explicit authoring triggers and a quality matrix for scoring trigger specificity.

**Agent Integration**
Agent prompts that mention this skill must pass the same trigger boundaries to subagents and avoid routing all “quality” work to one generic specialist.

**Command Integration**
Commands invoking this skill must parse `$ARGUMENTS` into an intent shape before loading the skill and must reject ambiguous invocations with a clarification gate.

**Tool Integration**
`prompt-skim` and `prompt-analyze` may be used to prove a prompt contains the triggering signals and does not match exclusion signals.

**Plugin Hook Integration**
PreToolUse or session-start hooks may suggest the skill only when trigger evidence is present; hooks must not force-load it for every session.

**Runtime State Integration**
Skill activation records should preserve trigger rationale in continuity or session metadata so repeated false positives can be audited.

## D2: Body Depth

**Description**
The skill body must provide enough operational guidance to change agent behavior, not merely define a concept. It needs entry state, process, decision points, exit criteria, anti-patterns, and recovery guidance.

**PASS Criteria**
- Body defines entry conditions, workflow steps, decision gates, and exit state.
- Guidance is specific enough for a new agent to execute without hidden session context.
- The skill includes at least one anti-pattern table or failure-mode section.
- References deepen the body instead of replacing it.

**FAIL Criteria**
- Body is a shallow checklist with no decisions.
- Content is mostly conceptual background.
- No exit criterion or verification point exists.
- References are listed but not integrated into the workflow.

**Verification Command**
`grep -n "Entry\|Exit\|Gate\|Anti-Pattern\|Self-Correction\|When unsure" .opencode/skills/<skill>/SKILL.md`

**Exemplar Skill**
`hm-phase-execution` demonstrates workflow gates, failure handling, dependency validation, and recovery behavior.

**Agent Integration**
Agents using the skill must know whether they are executing, reviewing, planning, or coordinating, and the body must constrain that role.

**Command Integration**
Commands must expose the same entry and exit boundaries in their user-facing wording and not bypass skill gates with direct shell shortcuts.

**Tool Integration**
Tools referenced by the body must be named with their purpose and failure behavior, not presented as magic steps.

**Plugin Hook Integration**
Hook-aware skills must explain whether hooks observe, mutate, block, or merely report facts.

**Runtime State Integration**
Long-running skills must describe what state is persisted, what can be reconstructed, and what evidence proves completion.

## D3: 6-NON Defence

**Description**
Every skill must defend against the six known failure modes from Phase 18: non-audit, non-contextual, non-cycles, non-hierarchy, non-ecosystem-eval, and non-systematic-pattern.

**PASS Criteria**
- NON-1 audit trail cites source evidence or parent-child-stage map.
- NON-2 context map states stacks-with and clashes-with relationships.
- NON-3 cycle guidance includes entry, exit, and loop-back paths.
- NON-4 hierarchy is reflected in metadata and operational role boundaries.
- NON-5 includes ecosystem or stacked eval evidence.
- NON-6 documents pattern choice, body size appropriateness, and deterministic helper behavior where scripts exist.

**FAIL Criteria**
- A quality claim has no source evidence.
- The skill has no relationship to adjacent skills.
- The skill can start but not decide when to stop.
- Eval claims are isolated trigger checks only.
- Script or reference structure is arbitrary or untracked.

**Verification Command**
`grep -n "NON-1\|audit\|stacks with\|clashes with\|loop-back\|stacked_scenario" .opencode/skills/<skill>/SKILL.md .opencode/skills/<skill>/evals/*.json 2>/dev/null`

**Exemplar Skill**
`hm-completion-looping` is the current strongest local stacked-scenario example and should be compared against Phase 18 6-NON audit rows.

**Agent Integration**
Subagent prompts must carry audit source, context boundary, entry gate, exit gate, ecosystem eval expectation, and pattern rationale when the skill is delegated.

**Command Integration**
Commands must avoid one-shot wrappers that skip audit, context, or loop-back gates required by the skill.

**Tool Integration**
`prompt-skim`, `prompt-analyze`, and `session-patch` can support NON-1 and NON-3 evidence capture when used with explicit source paths and patch boundaries.

**Plugin Hook Integration**
Hooks that enforce or observe the skill must report facts and leave judgment to the agent unless they are explicitly safety gates.

**Runtime State Integration**
State records must make audit and loop progress recoverable across sessions, especially for skills that coordinate long workflows.

## D4: Eval Coverage

**Description**
Eval coverage proves the skill changes outcomes in realistic situations. Target quality requires trigger queries, negative cases, assertion-based grading, and stacked multi-skill scenarios where the skill is expected to interact with other runtime components.

**PASS Criteria**
- `evals/evals.json` exists and contains realistic prompts with assertions.
- Positive and negative trigger coverage is present.
- At target tier, `stacked_scenario` or equivalent multi-step workflow eval exists.
- Eval assertions are programmatically or manually verifiable with recorded evidence.

**FAIL Criteria**
- No eval file exists.
- Evals contain only one happy-path trigger query.
- Assertions are vague, subjective, or impossible to grade.
- Skill claims integration quality without multi-component eval evidence.

**Verification Command**
`test -f .opencode/skills/<skill>/evals/evals.json && grep -n "trigger_queries\|evals\|assertions\|stacked_scenario" .opencode/skills/<skill>/evals/evals.json`

**Exemplar Skill**
`hm-completion-looping/evals/evals.json` contains a stacked scenario pattern; `hivefiver-use-authoring-skills/references/10-eval-lifecycle.md` defines the lifecycle.

**Agent Integration**
Agents must not report eval coverage from file existence alone; they must report assertion outcomes and what behavior was tested.

**Command Integration**
Commands that audit or improve skills must surface eval status and avoid “passed” wording when evals were not run.

**Tool Integration**
`run-background-command` may execute eval scripts or validation commands when they exist; outputs must be recorded with pass/fail evidence.

**Plugin Hook Integration**
PostToolUse hooks may record eval command outputs but must not transform failed evals into successful completion claims.

**Runtime State Integration**
Eval runs should record timestamp, skill path, command, result, and commit hash when available.

## D5: Reference Completeness

**Description**
References must support progressive disclosure without becoming a dumping ground. They should be cited from the skill body, one level deep, ordered clearly, and checked for stale or circular links.

**PASS Criteria**
- Reference map lists every included reference with purpose and when to read it.
- Links resolve within the skill package or documented external sources.
- Reference depth stays one level unless explicitly justified.
- The body can still guide minimal execution without reading every reference.

**FAIL Criteria**
- Reference files are empty, stale, or uncited.
- The skill body delegates all substance to references.
- Circular references or deep nesting obscure the workflow.
- Paths are absolute to this repository without a portable fallback.

**Verification Command**
`grep -n "Reference Map\|references/" .opencode/skills/<skill>/SKILL.md && find .opencode/skills/<skill>/references -maxdepth 1 -type f 2>/dev/null`

**Exemplar Skill**
`hivefiver-use-authoring-skills` demonstrates multiple references tied to authoring and evaluation workflows.

**Agent Integration**
Agent prompts should point to exact references relevant to the task instead of loading an entire reference bundle blindly.

**Command Integration**
Commands must pass file references explicitly when they require reference content and avoid hidden assumptions about local directories.

**Tool Integration**
`prompt-skim` can summarize reference relevance; `session-patch` can update a bounded section when a reference needs correction.

**Plugin Hook Integration**
Skill-loading hooks should preserve reference discoverability and avoid injecting uncited reference content into unrelated sessions.

**Runtime State Integration**
State should capture which references were consulted for major decisions so future audits can reproduce the path.

## D6: Integration Wiring

**Description**
Skills are runtime components. A quality-complete skill states how it integrates with agents, commands, tools, plugin hooks, and runtime state routers without assuming all surfaces are available in every user project.

**PASS Criteria**
- Agent integration covers allowed tools, permissions, temperature, and subagent role boundaries.
- Command integration covers `$ARGUMENTS`, `!bash` usage, non-interactive shell constraints, and output contracts.
- Tool integration names relevant tool surfaces: `delegate-task`, `delegation-status`, `run-background-command`, `prompt-skim`, `prompt-analyze`, `session-patch`, `configure-primitive`, and `validate-restart`.
- Plugin hook integration distinguishes PreToolUse, PostToolUse, session hooks, and fact-reporting hooks.
- Runtime state integration describes continuity, lifecycle-manager, durable records, and resumability boundaries.

**FAIL Criteria**
- Skill treats itself as standalone Markdown only.
- Integration guidance says “use the usual tools” without naming contracts.
- Delegation, command, or tool use bypasses permission and validation gates.
- Runtime state guidance assumes this repository’s `.opencode/state` path exists in every user project.

**Verification Command**
`grep -n "delegate-task\|delegation-status\|run-background-command\|prompt-skim\|prompt-analyze\|session-patch\|configure-primitive\|validate-restart\|PreToolUse\|PostToolUse\|continuity\|lifecycle-manager" .opencode/skills/<skill>/SKILL.md`

**Exemplar Skill**
`opencode-config-workflow` and `hm-opencode-platform-reference` show how skill guidance can be tied to agents, commands, tools, and runtime validation surfaces.

**Agent Integration**
Agent definitions must make tool permissions explicit and must tell delegated specialists they are subagents with bounded success metrics.

**Command Integration**
Command files must quote user inputs, parse `$ARGUMENTS` safely, and choose whether a command runs in main context or subtask context.

**Tool Integration**
Tool-facing skills must cite Zod schema expectations, validation failure modes, and the difference between read-side and write-side operations.

**Plugin Hook Integration**
Hook-aware guidance must state whether hooks run before tool execution, after tool execution, during session lifecycle events, or at restart validation.

**Runtime State Integration**
Runtime state guidance must describe what is durable, what is in-memory, what survives restart, and how status is queried or reconstructed.

## D7: Cross-Platform Compatibility

**Description**
Skills must adapt to OpenCode native use, Hivemind harness runtime use, and arbitrary user projects with different languages, frameworks, shells, state directories, and governance models.

**PASS Criteria**
- OpenCode-native notes explain skill loading, tool alternatives, and command behavior.
- Hivemind harness notes explain integration with delegation, continuity, and runtime guardrails.
- Arbitrary user-project notes define fallback behavior when GSD, Hivemind, or specific tools are unavailable.
- No shipped skill content depends on absolute local paths without portable instructions.

**FAIL Criteria**
- Skill only works if `.planning/` or GSD commands exist.
- Skill assumes one language, package manager, shell, or OS without adapters.
- Skill instructs users to mutate this repository when it is meant for their own project.
- Verification commands cannot be translated to non-Node projects.

**Verification Command**
`grep -n "OpenCode\|Hivemind\|arbitrary\|fallback\|adapter\|project" .opencode/skills/<skill>/SKILL.md`

**Exemplar Skill**
`hm-opencode-non-interactive-shell` is a useful reference for platform adaptation when shell behavior differs.

**Agent Integration**
Agents must distinguish this harness repository from the end user’s project and must not hardcode local project state into delegated tasks.

**Command Integration**
Commands must support argument parsing and execution on different shells or document non-interactive fallbacks.

**Tool Integration**
Tool guidance must provide alternatives when a tool is absent, unavailable, or restricted by agent permissions.

**Plugin Hook Integration**
Hook guidance must separate OpenCode plugin semantics from generic agent-runner semantics.

**Runtime State Integration**
State paths must be configurable or described abstractly; `OPENCODE_HARNESS_STATE_DIR` and similar overrides are examples, not universal requirements.

## D8: Self-Correction

**Description**
The skill must explain how to detect when it is failing, how to loop back safely, when to escalate, and how to avoid false completion claims.

**PASS Criteria**
- Includes “When the task keeps failing” or equivalent recovery guidance.
- Defines blocked, retry, rollback, and escalation conditions.
- Requires fresh verification evidence before completion claims.
- States what to report in a handoff when the skill cannot complete autonomously.

**FAIL Criteria**
- Skill says “continue until done” without a stop rule.
- Repeated failures lead to unlimited retries.
- Completion is based on intention rather than verification output.
- Handoff omits current state, blockers, or evidence gathered.

**Verification Command**
`grep -n "Self-Correction\|keeps failing\|blocked\|escalate\|retry\|handoff\|verification" .opencode/skills/<skill>/SKILL.md`

**Exemplar Skill**
`hm-test-driven-execution` demonstrates red-green-refactor failure gates and coverage-claim verification; `hm-phase-execution` demonstrates wave failure handling.

**Agent Integration**
Agents must report incomplete work honestly and return verification needed rather than delegating further without authority.

**Command Integration**
Commands must surface blocked states and avoid auto-advancing after failed verification.

**Tool Integration**
Tools must return structured failures with enough context for the agent to retry or escalate without inventing success.

**Plugin Hook Integration**
Hooks must make failure facts visible without hiding or auto-correcting them into green status.

**Runtime State Integration**
State records must preserve blocked reason, last successful checkpoint, retry count, and resume instructions.

## Integration Wiring Requirements

Every quality score must consider five runtime surfaces: agents, commands, tools, plugin hooks, and runtime state. A skill does not need to use every surface, but it must explicitly state whether each surface is applicable, not applicable, or deferred with rationale.

Minimum integration review questions:

1. Which agent types may load or delegate this skill, and what permission boundaries apply?
2. Which commands invoke it, and how are `$ARGUMENTS` parsed and quoted?
3. Which tools are directly relevant, and what schemas or response contracts govern them?
4. Which plugin hooks can observe or affect this workflow, and are they fact-reporting or policy-enforcing?
5. What runtime state must survive restart, compaction, or parent-child handoff?

## Cross-Platform Compatibility Rules

1. **OpenCode-native:** Document how the skill loads through OpenCode skill discovery and what tool substitutes exist when a tool is unavailable.
2. **Hivemind harness:** Document how the skill interacts with delegation, continuity, lifecycle, PTY, and guardrail surfaces when the harness is installed.
3. **Arbitrary user project:** Provide language/framework-neutral fallback verification patterns and avoid assumptions about `.planning/`, GSD, Node-only tooling, or this repository’s file paths.
4. **Path portability:** Absolute paths may appear only as local evidence in planning artifacts, not as shipped skill requirements.
5. **Shell portability:** Commands must be non-interactive or provide alternatives for common shells and CI/headless contexts.

## Evidence Requirements

Evidence records must connect every quality claim to a path, command, eval result, or reviewer note. Every skill score created in Phase 27+ must include exactly these fields:

| Field | Required content | Mechanical check |
|-------|------------------|------------------|
| `skill_path` | Canonical `.opencode/skills/<name>/SKILL.md` path or explicitly documented external skill path. | File exists or external package reference is cited. |
| `quality_tier` | One of `EXEMPLAR`, `SUBSTANTIVE`, `THIN`, or `HOLLOW`. | Value matches a tier defined above. |
| `dimension_scores` | D1-D8 score map with `PASS`, `PARTIAL`, or `FAIL` plus one evidence note per dimension. | All eight keys exist. |
| `verification_commands` | Commands used to verify trigger, body, 6-NON, eval, reference, integration, platform, and self-correction claims. | Commands are copied verbatim into the audit record. |
| `eval_bundle_status` | Eval file state, trigger coverage state, stacked scenario state, and latest run/grade evidence. | `evals/evals.json` checked or absence documented. |
| `reference_bundle_status` | Reference count, reference purpose map, stale-link status, and depth/circularity status. | Reference directory checked or absence documented. |
| `integration_wiring_notes` | Agent, command, tool, plugin hook, and runtime state applicability notes. | Each surface marked applicable, not applicable, or deferred. |
| `cross_platform_notes` | OpenCode-native, Hivemind harness, and arbitrary user-project adaptation notes. | All three environments addressed. |
| `self_correction_notes` | Retry, escalation, rollback, blocked-state, and handoff behavior. | Failure-handling section cited. |

Evidence must be current to the skill package being scored. Historical Phase 18, Phase 22, or Phase 23 artifacts may explain background but cannot substitute for current `skill_path` evidence.

## Anti-Regression Rules

Anti-regression rules protect the project from repeating Phase 22 and Phase 23 false-closure patterns. Later audits must grep these exact rule names and cite evidence before marking a skill complete:

1. **No template-only skills** — a skill with frontmatter and headings but no operational workflow is `HOLLOW` until rewritten.
2. **No eval claim without eval files** — eval coverage cannot be claimed unless the skill package contains an eval file or an explicit external eval artifact.
3. **No 6-NON claim without cited evidence** — DEFENDED/PARTIAL/EXPOSED labels require path, line, command, or reviewer evidence.
4. **No GSD-only dependency for hm-* operation** — GSD may be a benchmark, but hm-* skills must include OpenCode-native and generic project fallback behavior.
5. **No absolute project paths in shipped skill content** — local absolute paths are allowed in planning evidence, not as reusable skill requirements.
6. **No source mutation during synthesis phases** — synthesis phases write planning artifacts and requirements only; they do not mutate `src/**` or `.opencode/skills/**/SKILL.md`.

Any violation blocks `EXEMPLAR` and `SUBSTANTIVE` tiers. If a violation is intentional, it must be recorded as a deferred issue with owner, phase, and verification gate.

## Applying This Playbook in Phase 27+

Future phases must treat this playbook as the entry contract before any `hm-*` or `hivefiver-*` skill rewrite. A future skill is complete only when it has D1-D8 evidence, passes required verification commands, and records the resulting score in the relevant audit catalog.

Required sequence for every Phase 27+ skill-quality task:

1. **Read current skill package** — inspect `SKILL.md`, `references/`, `evals/`, `scripts/`, related agents, related commands, and relevant tool/plugin surfaces.
2. **Score D1-D8 before editing** — create a baseline evidence record with `skill_path`, `quality_tier`, and `dimension_scores`.
3. **Change skill package** — modify only the approved package files for that phase, preserving scope and platform compatibility.
4. **Run verification commands** — execute the D1-D8 checks, eval checks, reference checks, and integration checks relevant to the changed package.
5. **Update audit catalog** — record final tier, dimension scores, eval status, reference status, integration notes, cross-platform notes, and self-correction notes.
6. **Record summary evidence** — summarize what changed, which anti-regression rules were checked, what remains deferred, and which commit contains the work.

This sequence is the minimum bar for preventing false closure. A skill is not complete because it was edited; it is complete only when its evidence record proves the edit moved it to the intended quality tier.
