# Phase 27 G-B Evidence Schema

**Purpose:** Provide the reusable evidence record format for Phase 27 final scoring. File existence alone cannot produce `PASS`; every score requires current path, command, eval, reference, integration, platform, or self-correction proof.

## Record Shape

```yaml
skill_path: .opencode/skills/<skill>/SKILL.md
quality_tier: EXEMPLAR | SUBSTANTIVE | THIN | HOLLOW
dimension_scores:
  HMQUAL-01:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D1 Trigger Accuracy
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
  HMQUAL-02:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D2 Body Depth
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
  HMQUAL-03:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D3 6-NON Defence
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
  HMQUAL-04:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D4 Eval Coverage
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
  HMQUAL-05:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D5 Reference Completeness
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
  HMQUAL-06:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D6 Integration Wiring
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
  HMQUAL-07:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D7 Cross-Platform Compatibility
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
  HMQUAL-08:
    score: PASS | PARTIAL | FAIL
    playbook_dimension: D8 Self-Correction
    evidence: <current path, command, eval, or reviewer note>
    blocker: <required for PARTIAL/FAIL; use "none" for PASS>
verification_commands:
  - <command copied exactly>
eval_bundle_status:
  trigger_coverage: PASS | PARTIAL | FAIL
  negative_coverage: PASS | PARTIAL | FAIL
  boundary_coverage: PASS | PARTIAL | FAIL
  stacked_scenario: PASS | PARTIAL | FAIL
  latest_grade: <fresh command or manual grade note>
reference_bundle_status:
  files: [<relative file paths>]
  cited_from_skill: PASS | PARTIAL | FAIL
  one_level_deep: PASS | PARTIAL | FAIL
  stale_link_status: PASS | PARTIAL | FAIL
integration_wiring_notes:
  agents: <applicable | not applicable | deferred plus evidence>
  commands: <applicable | not applicable | deferred plus evidence>
  tools: <applicable | not applicable | deferred plus evidence>
  plugin_hooks: <applicable | not applicable | deferred plus evidence>
  runtime_state: <applicable | not applicable | deferred plus evidence>
cross_platform_notes:
  opencode_native: <evidence>
  hivemind_harness: <evidence>
  arbitrary_user_project: <evidence>
self_correction_notes:
  retry: <evidence>
  rollback: <evidence>
  escalation: <evidence>
  blocked_handoff: <evidence>
```

## Grading Rules

1. `PASS` requires current evidence, not historical intent.
2. File or directory existence alone is inventory evidence only and cannot produce `PASS`.
3. Any `PARTIAL` or `FAIL` cell must include a blocker field with remediation.
4. Any non-PASS in Plan 04 must be surfaced in `27-G-B-FINAL-EVIDENCE.md` and `27-G-B-VERIFICATION.md`.
5. Shipped skill files must remain portable; absolute repository paths are allowed only in phase-local evidence artifacts.
6. `SUBSTANTIVE` requires no hollow dimensions and no anti-regression violation from the Phase 26 playbook.
7. `EXEMPLAR` requires all HMQUAL dimensions scored `PASS` plus stacked eval and integration evidence.

## Verification Commands

```bash
grep -q "dimension_scores" .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-EVIDENCE-SCHEMA.md
grep -q "eval_bundle_status" .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-EVIDENCE-SCHEMA.md
grep -q "integration_wiring_notes" .planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/27-G-B-EVIDENCE-SCHEMA.md
```
