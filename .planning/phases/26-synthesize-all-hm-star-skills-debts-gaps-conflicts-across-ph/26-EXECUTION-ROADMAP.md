# Phase 27-30 hm-* Quality Execution Roadmap

## Dependency Basis

Phase 27-30 execution is derived from the Phase 26 quality contract and evidence set:

- `26-PLAYBOOK.md` defines D1-D8: Trigger Accuracy, Body Depth, 6-NON Defence, Eval Coverage, Reference Completeness, Integration Wiring, Cross-Platform Compatibility, and Self-Correction.
- `26-ECOLOGY-AUDIT.md` identifies the current canonical `hm-*` and `hivefiver-*` quality gaps and priority queue.
- `26-G-B-SPEC-hm-spec-driven-authoring.md` and `26-G-B-SPEC-hm-test-driven-execution.md` define the first demonstration contracts.
- `26-ARCHIVE-REPORT.md` prevents stale Phase 22 and Phase 23 claims from being reused as completion evidence.
- `.planning/REQUIREMENTS.md` HMQUAL entries make D1-D8 project-level requirements.

The sequencing follows `26-CONTEXT.md` D-10/D-11 and the dependency map in `26-RESEARCH.md`: first prove the quality framework on G-B, then apply it to research, execution, and guardrail lineages.

## Phase 27: G-B Quality Assurance Demonstration

**Goal:** Rewrite and evidence the first quality-assurance demonstration pair so the playbook becomes executable, not merely aspirational.

**Skills Affected:**
- `hm-spec-driven-authoring`
- `hm-test-driven-execution`

**Required Inputs:**
- `26-PLAYBOOK.md`
- `26-ECOLOGY-AUDIT.md`
- `26-G-B-SPEC-hm-spec-driven-authoring.md`
- `26-G-B-SPEC-hm-test-driven-execution.md`
- `.planning/REQUIREMENTS.md` HMQUAL-01 through HMQUAL-08

**Deliverables:**
- Updated `hm-spec-driven-authoring` skill package with REQ-SDA-01 through REQ-SDA-08 evidence.
- Updated `hm-test-driven-execution` skill package with REQ-TDE-01 through REQ-TDE-08 evidence.
- Eval bundles with positive, negative, boundary, and stacked scenarios.
- Summary evidence showing both target skills score PASS on D1-D8.

**Verification Gate:** Both target skills must score PASS on D1-D8 in `26-PLAYBOOK.md`, including stacked eval evidence and integration notes for adjacent skills, tools, commands, plugin hooks, and runtime state.

**Dependency on previous phase:** Depends on Phase 26 artifacts being complete and on Phase 26 preserving G-B skill mutation for Phase 27 rather than performing it during synthesis.

## Phase 28: G-C Research Lineage

**Goal:** Apply the proven G-B quality pattern to the research and synthesis lineage so deep investigation workflows become evidence-backed, chained, and portable.

**Skills Affected:**
- `hm-deep-research`
- `hm-detective`
- `hm-synthesis`
- `hm-research-chain`

**Required Inputs:**
- `26-PLAYBOOK.md`
- `26-ECOLOGY-AUDIT.md` G-C rows and priority queue
- Phase 27 G-B summary and examples of D1-D8 evidence records
- `CR-AUDIT-ECOSYSTEM.md`, `CR-GAP-MAP.md`, and `CR-DECISIONS.md` G-C evidence

**Deliverables:**
- Per-skill baseline and final D1-D8 scoring records.
- Research-chain stacked scenario that proves detect → research → synthesize → artifact behavior.
- Updated references/evals where required by the G-C gap evidence.
- Summary evidence showing each G-C target skill score and remaining deferred gaps, if any.

**Verification Gate:** All G-C target skills must score PASS on D1-D8 in `26-PLAYBOOK.md`, or any non-PASS cell must be explicitly deferred with owner, blocker, and verification command. Completion cannot be based on file existence alone.

**Dependency on previous phase:** Depends on Phase 27 demonstrating that D1-D8 can be executed against real skill packages and that stacked eval evidence can be written in the existing skill package format.

## Phase 29: G-D Execution Lineage

**Goal:** Bring execution, debugging, refactoring, planning, and support skills up to runtime-truthful quality standards so agents can complete work without false closure or unbounded retries.

**Skills Affected:**
- `hm-debug`
- `hm-refactor`
- `hm-phase-execution`
- `hm-planning-with-files`
- `hm-command-parser`
- `hm-agent-composition`
- `hm-agents-md-sync`
- `hm-opencode-project-audit`
- `hm-opencode-project-inspection`
- `hm-opencode-non-interactive-shell`
- `hm-opencode-platform-reference`
- `hivefiver-agents-and-subagents-dev`
- `hivefiver-command-dev`
- `hivefiver-custom-tools-dev`
- `hivefiver-use-authoring-skills`

**Required Inputs:**
- `26-PLAYBOOK.md`
- `26-ECOLOGY-AUDIT.md` G-D and support rows
- Phase 27 and Phase 28 summary evidence patterns
- `CR-GAP-MAP.md` G-D rows
- `CR-DECISIONS.md` body rewrite, bundle expansion, split, merge, and create decisions

**Deliverables:**
- Execution-lineage D1-D8 score records.
- Runtime-truthful verification guidance for debugging, refactoring, phase execution, file-backed planning, command parsing, and OpenCode project inspection.
- Eval coverage for recovery, retry, blocked handoff, and false-completion prevention.
- Summary evidence that distinguishes primary G-D skills from `hivefiver-*` support skills without dropping the shared HMQUAL quality bar.

**Verification Gate:** All G-D target and support skills must score PASS on D1-D8 in `26-PLAYBOOK.md` before quality completion is claimed. Support rows may be sequenced across subplans, but each completed skill must include evidence for trigger boundaries, body depth, 6-NON defence, eval coverage, references, integration wiring, platform compatibility, and self-correction.

**Dependency on previous phase:** Depends on Phase 27 G-B and Phase 28 G-C examples so execution skills inherit proven spec, test, research, and synthesis patterns instead of creating another template-only wave.

## Phase 30: G-A Guardrail Lineage

**Goal:** Harden guardrails, loops, delegation boundaries, and intent handling so multi-agent workflows terminate honestly, recover across sessions, and escalate when verification is missing.

**Skills Affected:**
- `hm-completion-looping`
- `hm-phase-loop`
- `hm-subagent-delegation-patterns`
- `hm-user-intent-interactive-loop`
- `hivefiver-delegation-gates`

**Required Inputs:**
- `26-PLAYBOOK.md`
- `26-ECOLOGY-AUDIT.md` G-A and support rows
- Phase 27-29 summaries, especially false-completion and runtime-truthful verification evidence
- `CR-AUDIT-ECOSYSTEM.md` G-A rows
- `CR-GAP-MAP.md` G-A critical gaps

**Deliverables:**
- Guardrail-lineage D1-D8 score records.
- Stacked delegation/loop evals that prove completion detection, phase exit, subagent boundaries, and intent clarification under multi-session conditions.
- Explicit escalation and blocked-state handoff patterns for every guardrail skill.
- Summary evidence that removes or documents any remaining false-completion risk.

**Verification Gate:** All G-A target skills must score PASS on D1-D8 in `26-PLAYBOOK.md`. The gate must include stacked scenario evidence for multi-skill guardrail behavior, not isolated trigger checks.

**Dependency on previous phase:** Depends on Phase 27-29 proving the quality standard across authoring, testing, research, and execution before guardrail skills enforce it across the full ecosystem.

## Excluded Scope Note

Cross-lineage integration testing and end-to-end meta-concept validation are excluded from Phase 27-30 and belong to Phase 31 per Phase 26 CONTEXT.md.

## Sequencing Rationale

1. **Phase 27 first:** G-B is the smallest high-impact demonstration pair and has exact SPEC contracts ready.
2. **Phase 28 second:** Research skills need the G-B output quality model before they can produce reliable investigation artifacts.
3. **Phase 29 third:** Execution skills should inherit both the spec/test pattern and the research/synthesis pattern before governing implementation workflows.
4. **Phase 30 fourth:** Guardrail skills should harden last because they enforce completion, delegation, and loop rules across all earlier lineages.
5. **Phase 31 deferred:** Cross-lineage end-to-end validation requires all four lineage improvements to exist first.

## Entry Criteria Per Phase

| Phase | Entry Criteria |
|-------|----------------|
| Phase 27 | Phase 26 complete; `26-PLAYBOOK.md`, `26-ECOLOGY-AUDIT.md`, both G-B SPECs, `26-ARCHIVE-REPORT.md`, `26-EXECUTION-ROADMAP.md`, and HMQUAL requirements exist. |
| Phase 28 | Phase 27 summary proves G-B skills have D1-D8 evidence or documents exact unresolved blockers. |
| Phase 29 | Phase 28 summary provides research/synthesis evidence patterns and remaining G-C gaps. |
| Phase 30 | Phase 29 summary provides execution-lineage recovery and verification evidence for guardrail inheritance. |

## Exit Criteria Per Phase

| Phase | Exit Criteria |
|-------|---------------|
| Phase 27 | `hm-spec-driven-authoring` and `hm-test-driven-execution` score PASS on D1-D8 or any exception is explicitly blocked and not marked complete. |
| Phase 28 | G-C target skills score PASS on D1-D8 with chained/stacked research evidence and current eval status recorded. |
| Phase 29 | G-D target and support skills score PASS on D1-D8 with runtime-truthful execution, recovery, and command/tool integration evidence. |
| Phase 30 | G-A guardrail skills score PASS on D1-D8 with stacked delegation/loop/intent evals and honest escalation behavior. |

## Phase 26 Readiness Checklist

- [ ] `26-PLAYBOOK.md` exists and defines D1-D8 with PASS/FAIL criteria.
- [ ] `26-ECOLOGY-AUDIT.md` exists and inventories canonical `hm-*` and `hivefiver-*` skills.
- [ ] `26-G-B-SPEC-hm-spec-driven-authoring.md` exists and contains `REQ-SDA-08`.
- [ ] `26-G-B-SPEC-hm-test-driven-execution.md` exists and contains `REQ-TDE-08`.
- [ ] `26-ARCHIVE-REPORT.md` exists and records Phase 22 as NOT SUBSTANTIATED and Phase 23 as PARTIAL.
- [ ] `.planning/REQUIREMENTS.md HMQUAL entries` exist through `HMQUAL-08`.
- [ ] `.opencode/skills/**/SKILL.md` and `src/**` remain unchanged during Phase 26 execution.

Copy-paste verification command:

```bash
test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md && test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ECOLOGY-AUDIT.md && test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md && test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md && test -f .planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ARCHIVE-REPORT.md && grep -q "HMQUAL-08" .planning/REQUIREMENTS.md
```
