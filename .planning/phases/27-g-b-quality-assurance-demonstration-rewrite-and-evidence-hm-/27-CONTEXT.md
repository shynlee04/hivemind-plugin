# Phase 27: G-B Quality Assurance Demonstration - Context

**Gathered:** 2026-04-25
**Status:** Ready for research and planning
**Source:** Phase 26 execution roadmap and G-B SPEC artifacts

<domain>
## Phase Boundary

Phase 27 rewrites and evidences the first quality-assurance demonstration pair from the `hm-*` skill ecosystem:

- `.opencode/skills/hm-spec-driven-authoring/`
- `.opencode/skills/hm-test-driven-execution/`

The phase must prove that Phase 26's D1-D8 skill quality playbook is executable against real skill packages, not merely documented as a future standard. It is a soft meta-concept quality phase: expected changes are skill package content, references, eval bundles, and phase-local evidence artifacts. Source-code changes in `src/**` are out of scope unless a later approved architectural decision explicitly changes this boundary.

</domain>

<decisions>
## Locked Decisions

- Phase 27 starts with G-B demonstration skills before G-C, G-D, and G-A lineage work.
- The target skills are exactly `hm-spec-driven-authoring` and `hm-test-driven-execution`.
- Both target skills must be scored against HMQUAL-01 through HMQUAL-08, corresponding to PLAYBOOK D1-D8.
- Completion requires evidence-backed PASS results or explicit blockers; file existence alone is not quality evidence.
- Eval bundles must include positive, negative, boundary, and stacked scenarios where the Phase 26 SPECs require them.
- Integration evidence must account for adjacent skills, agents, commands, tools, plugin hooks, and runtime state implications.
- Phase 31 remains excluded from this phase and owns later cross-lineage end-to-end validation.

## Agent Discretion

- Exact wording, section ordering, and reference layout inside each skill package may be chosen during planning, provided the D1-D8 contract and project skill-authoring conventions are satisfied.
- If a required evidence artifact format is missing from the existing skill package, the planner may introduce the smallest package-local format that supports repeatable verification.

</decisions>

<canonical_refs>
## Canonical References

Downstream research, planning, execution, review, validation, and verification agents MUST read these before changing Phase 27 artifacts.

### Phase 26 quality contract

- `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-PLAYBOOK.md` — Binding D1-D8 quality dimensions and PASS/FAIL criteria.
- `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ECOLOGY-AUDIT.md` — Current G-B baseline: both target skills are THIN and quality-open.
- `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-spec-driven-authoring.md` — REQ-SDA-01 through REQ-SDA-08 contract.
- `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-G-B-SPEC-hm-test-driven-execution.md` — REQ-TDE-01 through REQ-TDE-08 contract.
- `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-ARCHIVE-REPORT.md` — Prevents reuse of stale Phase 22/23 completion claims.
- `.planning/phases/26-synthesize-all-hm-star-skills-debts-gaps-conflicts-across-ph/26-EXECUTION-ROADMAP.md` — Phase 27 entry/exit criteria and dependency sequence.

### Project registries

- `.planning/REQUIREMENTS.md` — HMQUAL-01 through HMQUAL-08 requirement registry.
- `.planning/ROADMAP.md` — Phase 27 registration and dependency on Phase 26.
- `.planning/STATE.md` — Current focus and known blockers.

### Target packages

- `.opencode/skills/hm-spec-driven-authoring/SKILL.md` — Target skill package entry point.
- `.opencode/skills/hm-test-driven-execution/SKILL.md` — Target skill package entry point.

</canonical_refs>

<specifics>
## Success Shape

- Updated `hm-spec-driven-authoring` skill package with evidence for REQ-SDA-01 through REQ-SDA-08.
- Updated `hm-test-driven-execution` skill package with evidence for REQ-TDE-01 through REQ-TDE-08.
- Eval bundles demonstrate positive, negative, boundary, and stacked scenarios as applicable.
- Phase summary shows both target skills scored against D1-D8 with verification evidence.
- Any non-PASS result is documented as a blocker or deferred issue, not hidden behind completion wording.

</specifics>

<deferred>
## Deferred Ideas

- Phase 28 owns G-C research lineage uplift.
- Phase 29 owns G-D execution/support lineage uplift.
- Phase 30 owns G-A guardrail lineage uplift.
- Phase 31 owns cross-lineage end-to-end meta-concept validation.

</deferred>

---

*Phase: 27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-*
*Context gathered: 2026-04-25 from Phase 26 artifacts*
