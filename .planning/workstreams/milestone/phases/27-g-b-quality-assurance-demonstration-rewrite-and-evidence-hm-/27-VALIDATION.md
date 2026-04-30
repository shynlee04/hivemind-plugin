---
phase: 27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-
validated: 2026-04-25T12:34:33Z
status: passed
equivalent_gate: /gsd-validate-phase 27
coverage: HMQUAL-01..HMQUAL-08 for hm-spec-driven-authoring and hm-test-driven-execution
gaps: []
---

# Phase 27 Validation Gate

**Equivalent gate:** `/gsd-validate-phase 27`  
**Validated:** 2026-04-25T12:34:33Z  
**Result:** PASS for non-interactive validation coverage.

## Nyquist Coverage Matrix

| Dimension | hm-spec-driven-authoring | hm-test-driven-execution | Evidence |
|---|---|---|---|
| HMQUAL-01 Trigger Accuracy | PASS | PASS | Positive, negative, and boundary trigger entries in eval bundles; boundaries in `SKILL.md`. |
| HMQUAL-02 Body Depth | PASS | PASS | Entry gates, workflows, exit criteria, anti-patterns, and blocked handoff sections present. |
| HMQUAL-03 6-NON Defence | PASS | PASS | `6-NON Defence Table` present in both skill bodies. |
| HMQUAL-04 Eval Coverage | PASS | PASS | `evals/evals.json` parse successfully and include gradeable assertions plus `stacked_scenario`. |
| HMQUAL-05 Reference Completeness | PASS | PASS | Reference maps cite one-level support files; files resolve. |
| HMQUAL-06 Integration Wiring | PASS | PASS | Agents, commands, tools, plugin hooks, and runtime state documented in both skills. |
| HMQUAL-07 Cross-Platform Compatibility | PASS | PASS | OpenCode, Hivemind harness, and arbitrary-project adapters documented; shipped `SKILL.md` files contain no local absolute paths. |
| HMQUAL-08 Self-Correction | PASS | PASS | Retry/blocked/escalation/handoff behavior documented in both skills. |

## Commands Run

```bash
bash .opencode/skills/hm-spec-driven-authoring/scripts/validate-skill.sh
bash .opencode/skills/hm-test-driven-execution/scripts/validate-skill.sh
python3 -m json.tool .opencode/skills/hm-spec-driven-authoring/evals/evals.json >/dev/null
python3 -m json.tool .opencode/skills/hm-test-driven-execution/evals/evals.json >/dev/null
bash -n .opencode/skills/hm-spec-driven-authoring/scripts/validate-skill.sh
bash -n .opencode/skills/hm-test-driven-execution/scripts/validate-skill.sh
```

**Observed:** both validators printed PASS; JSON and shell syntax checks exited 0.

## Additional Structural Checks

```bash
test -f .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-BASELINE-SCORECARD.md
test -f .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-EVIDENCE-SCHEMA.md
test -f .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-SDA-EVIDENCE.md
test -f .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-TDE-EVIDENCE.md
test -f .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-FINAL-EVIDENCE.md
test -f .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-VERIFICATION.md
```

**Observed:** exit 0.

## Validation Gaps

None for static/package validation. Runtime activation remains a UAT item, not a validation blocker.
