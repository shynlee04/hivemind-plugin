# Phase 27 Rich Gate Correction

**Created:** 2026-04-25  
**Correction status:** Phase 27 prior PASS is rejected under the new RICH gate.  
**Affected prior claims:** `27-G-B-VERIFICATION.md`, `27-VERIFICATION.md`, `27-VALIDATION.md`, `27-G-B-FINAL-EVIDENCE.md`, `27-SUMMARY.md`, and `.planning/STATE.md` lines that describe Phase 27 as complete/pass.

## Revalidation Result

| Skill | D1-D8 prior static/package status | RICH gate status | Decision |
|-------|-----------------------------------|------------------|----------|
| `hm-spec-driven-authoring` | Previously reported PASS | FAIL | No top-3 third-party skill/repo crawl; no reviewed third-party bundled assets/references/samples/templates/scripts evidence; no Pattern 1/2/3 adoption decision. |
| `hm-test-driven-execution` | Previously reported PASS | FAIL | `npx skills find` found TDD candidates, but Phase 27 did not crawl/review the top repositories or compare bundled resources before claiming PASS. |

## Why the Previous Outcome Fails

The prior Phase 27 artifacts checked local package structure, local eval JSON, local validators, and D1-D8 sections. They did **not** enforce the user-required rich skill quality gate:

1. No `find-skill` / `npx skills find` / skills.sh top-3 source selection was performed before the PASS claim.
2. No third-party GitHub repository crawl reviewed SKILL.md plus assets, references, samples, guidelines, templates, metrics, workflows, and aiding scripts.
3. No transform-improve-adopt decision compared Pattern 1, Pattern 2, and Pattern 3 alternatives.
4. No independence audit proved the packages are battle-tested for arbitrary end-user OpenCode projects beyond local static checks.
5. `skill-judge` scoring did not include a RICH dimension that fails when third-party-source evidence and bundled-resource evidence are absent.

## Corrected Exit Decision

Phase 27 is now **FAILED/BLOCKED**, not complete. The D1-D8 local work may be retained as useful groundwork, but it cannot be reused as quality-complete evidence until the RICH gate passes.

## Required Repair Plan

1. For `hm-spec-driven-authoring`, run top-3 discovery across skills.sh/GitHub for spec-to-requirements, requirements authoring, acceptance-test generation, and spec-driven development skills.
2. For `hm-test-driven-execution`, start with the captured TDD candidates (`addyosmani/agent-skills@test-driven-development`, `bobmatnyc/claude-mpm-skills@test-driven-development`, `izyanrajwani/agent-skills-library@test-driven-development`) and crawl their repositories.
3. For each source, review SKILL.md plus references/assets/examples/templates/scripts/workflows/metrics.
4. Write Pattern 1/2/3 alternatives and an adoption/rejection decision per target skill.
5. Update both skill packages and evidence records only after the source review is complete.
6. Re-run `skill-judge` with D1-D8 plus RICH scoring.

## No-Commit Note

No commit was created because the delegated instruction explicitly said: “Do not commit.”
