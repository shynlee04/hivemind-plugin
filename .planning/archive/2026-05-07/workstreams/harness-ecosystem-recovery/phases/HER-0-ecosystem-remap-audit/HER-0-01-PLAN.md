---
phase: HER-0-ecosystem-remap-audit
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/.gitkeep
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/.gitkeep
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/reclassification/.gitkeep
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/lineage/.gitkeep
autonomous: true
requirements: [HER-0-F]

must_haves:
  truths:
    - "ROADMAP.md exists with all 7 requirements and 6 plan placeholders"
    - "Output directory structure exists with .gitkeep files in all 4 subdirectories"
    - "All 4 foundational research documents are accessible and dated 2026-05-05"
  artifacts:
    - path: ".planning/workstreams/harness-ecosystem-recovery/ROADMAP.md"
      provides: "Workstream roadmap with HER-0 phase entry and requirements table"
      contains: "HER-0-A"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/.gitkeep"
      provides: "Lane output directory"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/.gitkeep"
      provides: "Matrix output directory"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/reclassification/.gitkeep"
      provides: "UAT reclassification output directory"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/lineage/.gitkeep"
      provides: "Lineage-specific output directory"
  key_links:
    - from: "ROADMAP.md"
      to: "phases/HER-0-ecosystem-remap-audit/"
      via: "plan list entries"
      pattern: "HER-0-..-PLAN"
---

<objective>
Pre-audit setup: validate foundational research documents, scaffold output directories, confirm ROADMAP.md exists with correct requirements.

Purpose: Downstream lanes depend on a consistent directory structure and verified input documents. This plan ensures the foundation is solid before any audit lane runs.

Output: ROADMAP.md (already created), output directory scaffold with 4 subdirectories, validation report confirming all 4 foundational docs are accessible.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md
@.planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold output directories and validate foundational docs</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/.gitkeep,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/.gitkeep,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/reclassification/.gitkeep,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/lineage/.gitkeep
  </files>
  <action>
Create 4 output subdirectories under the HER-0 phase directory, each with a .gitkeep file:
- map/ — lane output documents (lane-a-uat-reclass.md, lane-b-governance-audit.md, etc.)
- matrix/ — cross-reference matrices (ecosystem-map.md goes here)
- reclassification/ — UAT test reclassification tables
- lineage/ — lineage-specific consumption notes (hm vs hf profiles)

Then validate all 4 foundational research documents exist and are dated 2026-05-05:
1. .planning/research/GAP-MATRIX-2026-05-05.md
2. .planning/research/FEATURE-DEPENDENCY-GRAPH-2026-05-05.md
3. .planning/codebase/IMPLEMENTATION-INVENTORY-2026-05-05.md
4. .planning/research/legacy-concept-catalog-2026-05-05.md

For each doc, verify: file exists, is non-empty, contains a datestamp matching 2026-05-05. Print a summary table of validation results.
  </action>
  <verify>
    <automated>ls -la .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/{map,matrix,reclassification,lineage}/.gitkeep 2>&1 | grep -c '.gitkeep' | grep -q '4' && echo "PASS: 4 directories scaffolded" || echo "FAIL: missing directories"</automated>
  </verify>
  <done>
4 output directories exist with .gitkeep files. All 4 foundational research documents confirmed accessible and dated 2026-05-05.
  </done>
</task>

<task type="auto">
  <name>Task 2: Validate ROADMAP.md requirements completeness</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md
  </files>
  <action>
Read the ROADMAP.md and verify it contains:
- All 7 requirement IDs (HER-0-A through HER-0-G)
- 6 plan entries (HER-0-01 through HER-0-06)
- Phase HER-0 goal statement
- Status: Planning

Print a validation table showing each requirement ID and whether it appears in the ROADMAP. If any requirement is missing, the next plans cannot proceed — flag immediately.
  </action>
  <verify>
    <automated>grep -c 'HER-0-[A-G]' .planning/workstreams/harness-ecosystem-recovery/ROADMAP.md | grep -q '7' && echo "PASS: 7 requirements found" || echo "FAIL: missing requirements"</automated>
  </verify>
  <done>
ROADMAP.md validated: 7 requirements present, 6 plan entries listed, phase goal defined.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| filesystem → planner | Read-only access to research documents (trusted input) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-HER0-01 | I | Foundational docs | accept | Read-only audit — no code execution, no PII, low-value target |
</threat_model>

<verification>
- All 4 output directories exist with .gitkeep files
- ROADMAP.md contains all 7 requirement IDs
- All 4 foundational research docs are accessible and current-dated
</verification>

<success_criteria>
- `ls map/ matrix/ reclassification/ lineage/` shows all 4 directories
- `grep -c 'HER-0-[A-G]' ROADMAP.md` returns 7
- Validation summary printed with all docs confirmed
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-01-SUMMARY.md`
</output>
