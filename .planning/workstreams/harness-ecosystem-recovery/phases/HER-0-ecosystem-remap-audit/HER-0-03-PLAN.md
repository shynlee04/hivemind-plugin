---
phase: HER-0-ecosystem-remap-audit
plan: 03
type: execute
wave: 1
depends_on: ["HER-0-01"]
files_modified:
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-patterns.md
autonomous: true
requirements: [HER-0-E]

must_haves:
  truths:
    - "Each of the 84 legacy concepts is validated as ACTIVE, EVOLVED, DEPRECATED, or SKIP"
    - "Active patterns are mapped to their current source file location"
    - "Skip recommendations from legacy-concept-catalog are spot-checked for correctness"
  artifacts:
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-patterns.md"
      provides: "Validated pattern index with Path mapping and status tags"
      min_lines: 200
      contains: "ACTIVE"
  key_links:
    - from: "lane-e-legacy-patterns.md"
      to: ".planning/research/legacy-concept-catalog-2026-05-05.md"
      via: "pattern source catalog"
      pattern: "legacy-concept-catalog"
---

<objective>
Validate the 84 legacy concepts from the legacy-concept-catalog against the current codebase.

For each concept, determine: does it still exist? Has it evolved? Was it deprecated? Should it be skipped?

The catalog already identifies 18 concepts as "outdated/unnecessary" — spot-check 3-5 of those to confirm the recommendation is correct.

Purpose: Downstream workstreams (HER-1 through HER-8) will use this pattern index to decide what to rebuild, what to preserve, and what to discard. Incorrect SKIP/ACTIVE tags waste implementation effort.

Output: lane-e-legacy-patterns.md
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md
@.planning/research/legacy-concept-catalog-2026-05-05.md
@.planning/research/GAP-MATRIX-2026-05-05.md
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Validate legacy concept catalog against codebase</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-patterns.md
  </files>
  <action>
Read `.planning/research/legacy-concept-catalog-2026-05-05.md` to extract all 84 concepts.

For each concept:
1. Extract concept name, description, and catalog status (active/skip/missing)
2. Search the codebase for evidence of the concept using grep/glob:
   - ACTIVE: concept exists in current src/ code with the same purpose
   - EVOLVED: concept exists but has been significantly refactored or renamed
   - DEPRECATED: concept exists but is marked deprecated or unused
   - SKIP: concept does not exist and the catalog recommends not implementing it
3. Record the source file path where evidence was found (or "NOT_FOUND")
4. Map to development path: path-1 (foundation), path-2 (runtime), path-3 (quality), path-4 (ecosystem)

Spot-check 3-5 SKIP recommendations:
- Verify the skip reason is valid (concept truly unnecessary, superseded, or low-value)
- If any skip recommendation appears incorrect, flag as SKIP-REVIEW-NEEDED

Output format:
```
## Pattern Index
| # | Concept | Status | Source File | Path | Evidence Level |
|---|---------|--------|-------------|------|----------------|

## Skip Spot-Check
| Concept | Skip Reason | Verified? | Notes |
|---------|-------------|-----------|-------|

## Summary
- ACTIVE: N
- EVOLVED: N
- DEPRECATED: N
- SKIP: N (N spot-checked, N flagged for review)
- NOT_FOUND: N
```

Write output to `map/lane-e-legacy-patterns.md`. Target: 200-400 lines.
  </action>
  <verify>
    <automated>grep -c 'ACTIVE\|EVOLVED\|DEPRECATED\|SKIP' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-patterns.md | grep -qv '0' && echo "PASS: Lane E has status tags" || echo "FAIL: no status tags"</automated>
  </verify>
  <done>
All 84 legacy concepts validated with ACTIVE/EVOLVED/DEPRECATED/SKIP tags. Skip spot-check complete. Pattern index maps each concept to a development path.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Cross-reference pattern index against GAP-MATRIX features</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-patterns.md
  </files>
  <action>
After completing the pattern index, cross-reference against `.planning/research/GAP-MATRIX-2026-05-05.md`:

1. For each GAP-MATRIX feature (20 features), check if any ACTIVE/EVOLVED legacy patterns provide implementation for it
2. For each GAP-MATRIX "unwired subsystem" (7 subsystems, ~2,596 LOC), check if any legacy patterns explain the original design intent
3. Produce a "pattern-to-feature mapping" table showing which legacy patterns inform which features

Append this cross-reference as a new section to lane-e-legacy-patterns.md:

```
## Pattern-to-Feature Cross-Reference
| GAP-MATRIX Feature | Related Legacy Patterns | Coverage |
|--------------------|------------------------|----------|
```
  </action>
  <verify>
    <automated>grep -c 'Pattern-to-Feature' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-e-legacy-patterns.md | grep -qv '0' && echo "PASS: Cross-reference section present" || echo "FAIL: missing cross-reference"</automated>
  </verify>
  <done>
Pattern index enriched with GAP-MATRIX cross-reference. Each of the 20 features has related legacy patterns identified.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| legacy-catalog → Lane E | Catalog may contain stale assessments (MEDIUM risk per RESEARCH A1) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-HER0-03 | I | Legacy catalog accuracy | mitigate | Spot-check SKIP recommendations; verify ACTIVE claims against actual source code with grep |
</threat_model>

<verification>
- lane-e-legacy-patterns.md covers all 84 concepts
- Skip spot-check section exists with at least 3 entries
- Pattern-to-feature cross-reference section exists
</verification>

<success_criteria>
- All 84 concepts have a status tag (ACTIVE/EVOLVED/DEPRECATED/SKIP/NOT_FOUND)
- At least 3 SKIP recommendations spot-checked
- Cross-reference table maps legacy patterns to GAP-MATRIX features
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-03-SUMMARY.md`
</output>
