---
phase: HER-0-ecosystem-remap-audit
plan: 06
type: execute
wave: 3
depends_on: ["HER-0-02", "HER-0-03", "HER-0-04", "HER-0-05"]
files_modified:
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY.md
autonomous: true
requirements: [HER-0-F, HER-0-G]

must_haves:
  truths:
    - "All 5 lane outputs are cross-referenced and conflicts are documented"
    - "The unified ecosystem map covers all 20 GAP-MATRIX features"
    - "No feature has conflicting path/lineage classifications across lanes"
  artifacts:
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map.md"
      provides: "Unified ecosystem map — single source of truth for harness state"
      min_lines: 300
      contains: "RECONCILED"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY.md"
      provides: "Phase execution summary with metrics and quality gate results"
      contains: "HER-0"
  key_links:
    - from: "ecosystem-map.md"
      to: "lane-a-uat-reclass.md"
      via: "UAT finding classification"
      pattern: "lane-a"
    - from: "ecosystem-map.md"
      to: "lane-b-governance-audit.md"
      via: "governance drift data"
      pattern: "lane-b"
    - from: "ecosystem-map.md"
      to: "lane-c-ownership-matrix.md"
      via: "module ownership data"
      pattern: "lane-c"
    - from: "ecosystem-map.md"
      to: "lane-d-runtime-verify.md"
      via: "SDK verification data"
      pattern: "lane-d"
    - from: "ecosystem-map.md"
      to: "lane-e-legacy-patterns.md"
      via: "legacy pattern data"
      pattern: "lane-e"
---

<objective>
Reconcile all 5 lane outputs into a unified ecosystem map, resolve classification conflicts, and produce the phase summary.

Purpose: The 5 lanes produce independent analyses. Without reconciliation, downstream workstreams would see conflicting data. This plan is the quality gate that ensures one consistent picture.

Output: ecosystem-map.md (unified map), HER-0-SUMMARY.md (execution summary)
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-a-uat-reclass.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-b-governance-audit.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-verify.md
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-patterns.md
@.planning/research/GAP-MATRIX-2026-05-05.md
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Cross-reference and reconcile all 5 lane outputs</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map.md
  </files>
  <action>
Read all 5 lane outputs and the GAP-MATRIX. Produce a unified ecosystem map:

**Step 1: Feature inventory (from GAP-MATRIX)**
For each of the 20 GAP-MATRIX features:
- Pull path classification from GAP-MATRIX (path-1 through path-4)
- Pull lineage classification from GAP-MATRIX (hm, hf, hm+hf)
- Pull UAT findings from Lane A (PASS/FAIL count, evidence level)
- Pull governance status from Lane B (CONFIRMED/DRIFT)
- Pull module ownership from Lane C (responsible module)
- Pull SDK verification from Lane D (VERIFIED/UNVERIFIED/DRIFT)
- Pull legacy pattern from Lane E (ACTIVE/EVOLVED/DEPRECATED/SKIP)

**Step 2: Conflict detection**
For each feature, check for conflicts:
- Same feature classified as different paths in different lanes → PATH-CONFLICT
- Same feature classified as different lineages in different lanes → LINEAGE-CONFLICT
- Governance says CONFIRMED but UAT says FAIL → STATUS-CONFLICT
- Module ownership says module-X but SDK verification says module-X has DRIFT → RISK-CONFLICT

**Step 3: Conflict resolution**
For each conflict:
- If Lane A (UAT) and Lane B (governance) disagree → prefer Lane A (tested evidence)
- If Lane C (ownership) and Lane D (SDK) disagree → prefer Lane D (verified against docs)
- If any conflict is unresolvable → flag as CONFLICT-UNRESOLVED for human review

**Output format:**
```
## Unified Ecosystem Map

### Feature: [F-01] Feature Name
- Path: path-N
- Lineage: hm/hf/hm+hf
- UAT: N PASS, N FAIL (evidence level)
- Governance: CONFIRMED/DRIFT
- Module: module-name (responsibility)
- SDK: VERIFIED/UNVERIFIED/DRIFT
- Legacy: ACTIVE/EVOLVED/DEPRECATED/SKIP
- Status: RECONCILED / CONFLICT-UNRESOLVED

### Conflict Register
| Feature | Lane A | Lane B | Conflict Type | Resolution |

### Unwired Subsystems
| Subsystem | LOC | Path | Legacy Pattern | Re-activation Risk |

### Summary Metrics
- Total features: 20
- RECONCILED: N
- CONFLICT-UNRESOLVED: N
- Unwired subsystems: N
- Total dead LOC: N
```

Write to `matrix/ecosystem-map.md`. Target: 300-500 lines.
  </action>
  <verify>
    <automated>grep -c 'RECONCILED\|CONFLICT-UNRESOLVED' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map.md | grep -qv '0' && echo "PASS: Ecosystem map has reconciliation status" || echo "FAIL: no reconciliation"</automated>
  </verify>
  <done>
All 20 features reconciled across 5 lanes. Conflict register documents all disagreements. Unwired subsystems catalogued. No conflicting classifications remain unresolved (or explicitly flagged for human review).
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Produce HER-0-SUMMARY.md with quality gate check</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY.md
  </files>
  <action>
Produce the phase execution summary with metrics and quality gate results.

**Summary structure:**
```
# HER-0 Phase Summary

## Metrics
| Metric | Value |
|--------|-------|
| Foundational docs validated | 4/4 |
| UAT findings reclassified | N/116 |
| Governance claims verified | N/M (N DRIFT) |
| Legacy patterns validated | N/84 |
| Modules classified | N/N |
| SDK registrations verified | N/16 tools, N/N hooks |
| Features reconciled | N/20 |
| Conflicts resolved | N |
| Conflicts unresolved | N |

## Requirement Coverage
| Req ID | Description | Status | Evidence |
|--------|-------------|--------|----------|
| HER-0-A | UAT reclassification | COVERED/PARTIAL/MISSING | lane-a-uat-reclass.md |
| HER-0-B | Governance drift | COVERED/PARTIAL/MISSING | lane-b-governance-audit.md |
| HER-0-C | Module ownership | COVERED/PARTIAL/MISSING | lane-c-ownership-matrix.md |
| HER-0-D | SDK verification | COVERED/PARTIAL/MISSING | lane-d-runtime-verify.md |
| HER-0-E | Legacy patterns | COVERED/PARTIAL/MISSING | lane-e-legacy-patterns.md |
| HER-0-F | Unified ecosystem map | COVERED/PARTIAL/MISSING | ecosystem-map.md |
| HER-0-G | Zero conflicts | PASS/FAIL | Conflict register in ecosystem-map.md |

## Quality Gate
- [ ] All 7 requirements have COVERED status
- [ ] Conflict register has 0 CONFLICT-UNRESOLVED entries (or all flagged for human review)
- [ ] All lane outputs are non-empty with evidence tags
- [ ] ecosystem-map.md covers all 20 GAP-MATRIX features

## Key Findings
- [List the top 5 findings across all lanes]

## Artifacts Produced
| File | Lines | Purpose |

## Recommendations for HER-1+
- [List of follow-up actions based on audit findings]
```

Write to `HER-0-SUMMARY.md`. Target: 100-200 lines.
  </action>
  <verify>
    <automated>grep -c 'HER-0-[A-G]' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY.md | grep -qv '0' && echo "PASS: Summary covers all requirements" || echo "FAIL: missing requirements"</automated>
  </verify>
  <done>
Phase summary produced with all 7 requirements covered. Quality gate results documented. Key findings and recommendations for downstream workstreams included.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Lane outputs → Reconciliation | 5 independent analyses merged into one view |
| ecosystem-map → Downstream workstreams | This becomes the source of truth for HER-1 through HER-8 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-HER0-06 | T | Reconciliation correctness | mitigate | Conflict register with explicit resolution rationale; unresolvable conflicts flagged for human review |
| T-HER0-07 | I | Ecosystem map accuracy | mitigate | Every claim traced to a lane output with evidence tag; no new claims introduced during reconciliation |
</threat_model>

<verification>
- ecosystem-map.md covers all 20 GAP-MATRIX features
- Conflict register exists with resolution status per conflict
- HER-0-SUMMARY.md covers all 7 requirements
- Quality gate checklist present
</verification>

<success_criteria>
- All 20 features have RECONCILED status (or CONFLICT-UNRESOLVED with documented rationale)
- ecosystem-map.md cross-references all 5 lane outputs
- HER-0-SUMMARY.md quality gate shows all requirements COVERED
- Zero uncaught conflicting classifications (HER-0-G satisfied)
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-06-SUMMARY.md`
</output>
