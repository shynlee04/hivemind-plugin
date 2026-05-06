# Phase 27 Source Coverage Audit

SOURCE | ID | Feature/Requirement | Plan | Status | Notes
--- | --- | --- | --- | --- | ---
GOAL | — | Rewrite and evidence `hm-spec-driven-authoring` and `hm-test-driven-execution` so the Phase 26 playbook is executable against real skill packages | 01-04 | COVERED | Plan 01 establishes baseline/evidence schema; Plans 02-03 rewrite packages; Plan 04 verifies final evidence.
REQ | HMQUAL-01 | Trigger accuracy with positive, negative, boundary evidence | 01-04 | COVERED | Baseline scorecard plus both package eval bundles and final verification.
REQ | HMQUAL-02 | Body depth with executable workflow, gates, exit state, anti-patterns | 01-03 | COVERED | Package rewrites require operational body sections and evidence notes.
REQ | HMQUAL-03 | 6-NON defence with audit, context, cycle, hierarchy, ecosystem eval, pattern evidence | 01-04 | COVERED | Plan 01 scorecard schema and Plans 02-03 package evidence feed Plan 04 audit.
REQ | HMQUAL-04 | Eval coverage with positive, negative, boundary, stacked scenarios | 02-04 | COVERED | Each target package expands evals; Plan 04 grades both eval bundles.
REQ | HMQUAL-05 | Reference completeness with cited, one-level references and stale-link checks | 02-04 | COVERED | Each package reference map is rewritten and verified in final audit.
REQ | HMQUAL-06 | Integration wiring across adjacent skills, agents, commands, tools, hooks, runtime state | 01-04 | COVERED | Baseline schema requires all five surfaces; package rewrites and final audit prove coverage.
REQ | HMQUAL-07 | Cross-platform compatibility for OpenCode-native, Hivemind harness, arbitrary user projects | 02-04 | COVERED | Package rewrites include adapters and final audit checks absence of local-only assumptions.
REQ | HMQUAL-08 | Self-correction, retry, rollback, blocked handoff, fresh verification evidence | 01-04 | COVERED | Baseline, package guidance, eval scenarios, and final report all require non-PASS blockers to be explicit.
RESEARCH | 26-PLAYBOOK D1-D8 | Binding quality dimensions, evidence fields, anti-regression rules, no GSD-only operation | 01-04 | COVERED | All plans cite D1-D8 and require current evidence over file existence.
RESEARCH | 26-ECOLOGY-AUDIT G-B rows | Both target skills are THIN and quality-open, existence is not closure | 01 | COVERED | Plan 01 creates the baseline scorecard from current package evidence.
RESEARCH | 26-G-B-SPEC SDA | REQ-SDA-01 through REQ-SDA-08 | 02,04 | COVERED | Plan 02 implements package rewrite; Plan 04 verifies all SDA evidence.
RESEARCH | 26-G-B-SPEC TDE | REQ-TDE-01 through REQ-TDE-08 | 03,04 | COVERED | Plan 03 implements package rewrite; Plan 04 verifies all TDE evidence.
RESEARCH | 26-EXECUTION-ROADMAP | Phase 27 deliverables and exit gate | 01-04 | COVERED | Plan set maps directly to required deliverables and final PASS/blocker gate.
CONTEXT | D-01 | Phase 27 starts with G-B demonstration skills before other lineages | 01-04 | COVERED | Only G-B target packages are planned.
CONTEXT | D-02 | Target skills are exactly `hm-spec-driven-authoring` and `hm-test-driven-execution` | 02-03 | COVERED | No other skill package is modified.
CONTEXT | D-03 | Both target skills must be scored against HMQUAL-01 through HMQUAL-08 | 01,04 | COVERED | Baseline and final scorecards require all eight dimensions.
CONTEXT | D-04 | Completion requires evidence-backed PASS results or explicit blockers | 04 | COVERED | Final gate forbids hidden non-PASS results.
CONTEXT | D-05 | Eval bundles must include positive, negative, boundary, and stacked scenarios where required | 02-04 | COVERED | Each package plan updates evals; final plan grades scenario coverage.
CONTEXT | D-06 | Integration evidence must account for adjacent skills, agents, commands, tools, plugin hooks, runtime state | 01-04 | COVERED | Scorecard schema and package body sections cover all surfaces.
CONTEXT | D-07 | Phase 31 remains excluded and owns later cross-lineage end-to-end validation | 04 | COVERED | Plan 04 limits final audit to G-B pair and records Phase 31 exclusion.
CONTEXT | DISCRETION-01 | Exact wording, section ordering, reference layout may be chosen if D1-D8 contract is met | 02-03 | COVERED | Plans specify required sections and evidence, leaving package-local layout to executor.
CONTEXT | DISCRETION-02 | Introduce smallest package-local evidence format if missing | 01-04 | COVERED | Plan 01 creates phase-local scorecard format; package plans may add bounded package-local evidence fields.

## Exclusions

- Phase 28 G-C research lineage uplift is excluded.
- Phase 29 G-D execution/support lineage uplift is excluded.
- Phase 30 G-A guardrail lineage uplift is excluded.
- Phase 31 cross-lineage end-to-end validation is excluded.
